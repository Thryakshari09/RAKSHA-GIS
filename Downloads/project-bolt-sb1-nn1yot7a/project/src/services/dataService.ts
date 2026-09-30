import { supabase } from '@/db/index';
import type {
  User,
  FamilyMember,
  Document,
  DocumentVersion,
  Notification,
  DashboardStats,
} from '@/types';
import { calcStatus } from '@/utils/documents';

export const dataService = {
  // ── Auth ──────────────────────────────────────────────
  async register(fullName: string, email: string, password: string): Promise<User> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw new Error(error.message);
    if (!data.user) {
      throw new Error('Check your email to confirm your account, then log in.');
    }
    return {
      id: data.user.id,
      email: data.user.email || email,
      full_name: fullName,
      profile_photo: null,
      role: 'owner',
      created_at: data.user.created_at,
      updated_at: data.user.created_at,
    };
  },

  async login(email: string, password: string): Promise<User> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error('Invalid email or password.');
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Login failed. Please try again.');
    return user;
  },

  async logout(): Promise<void> {
    await supabase.auth.signOut();
  },

  async getCurrentUser(): Promise<User | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    // Try as the account owner first
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    if (profile) {
      return {
        id: profile.id,
        email: user.email || '',
        full_name: profile.full_name,
        profile_photo: profile.profile_photo,
        role: 'owner',
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      };
    }

    // Otherwise check if this auth user is linked to a family member
    const { data: member } = await supabase
      .from('family_members')
      .select('*')
      .eq('auth_user_id', user.id)
      .maybeSingle();
    if (member) {
      return {
        id: member.id,
        email: member.email || user.email || '',
        full_name: member.name,
        profile_photo: member.profile_photo,
        role: 'member',
        family_member_id: member.id,
        created_at: member.created_at,
        updated_at: member.updated_at,
      };
    }

    return null;
  },

  isMember(): Promise<boolean> {
    return this.getCurrentUser().then((u) => u?.role === 'member');
  },

  // Throws unless the current session belongs to the account owner.
  async requireOwner(): Promise<void> {
    const current = await this.getCurrentUser();
    if (!current || current.role !== 'owner') {
      throw new Error('Only the account owner can do this.');
    }
  },

  async updateProfile(updates: { full_name?: string; profile_photo?: string | null }): Promise<void> {
    const current = await this.getCurrentUser();
    if (!current) throw new Error('Not authenticated');
    const table = current.role === 'member' ? 'family_members' : 'profiles';
    const targetId = current.role === 'member' ? current.family_member_id! : current.id;
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.full_name !== undefined) {
      payload[current.role === 'member' ? 'name' : 'full_name'] = updates.full_name;
    }
    if (updates.profile_photo !== undefined) {
      payload.profile_photo = updates.profile_photo;
    }
    const { error } = await supabase.from(table).update(payload).eq('id', targetId);
    if (error) throw new Error(error.message);
  },

  // Only works for the account owner (a real Supabase Auth account).
  // Member logins aren't Supabase Auth accounts yet — see setMemberLogin.
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) throw new Error('Not authenticated');
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (verifyError) throw new Error('Current password is incorrect.');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  },

  // Full account deletion needs the service_role key (server-only). This
  // signs the user out; wire up a server/Edge Function call here if you
  // want actual auth-account deletion.
  async deleteAccount(): Promise<void> {
    await supabase.auth.signOut();
  },

  // ── Family Members ───────────────────────────────────
  // Shared access: owner and every member see the full family list (RLS-enforced).
  async getFamilyMembers(): Promise<FamilyMember[]> {
    const { data, error } = await supabase
      .from('family_members')
      .select('*, documents(count)')
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []).map((row: any) => ({
      ...row,
      document_count: row.documents?.[0]?.count ?? 0,
    }));
  },

  async getFamilyMember(id: string): Promise<FamilyMember | null> {
    const { data, error } = await supabase
      .from('family_members')
      .select('*, documents(count)')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return { ...(data as any), document_count: (data as any).documents?.[0]?.count ?? 0 };
  },

  // Owner-only.
  async addFamilyMember(
    data: Omit<FamilyMember, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'document_count' | 'has_login' | 'password_hash'>
  ): Promise<FamilyMember> {
    await this.requireOwner();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: row, error } = await supabase
      .from('family_members')
      .insert({
        owner_id: user.id,
        name: data.name,
        relationship: data.relationship ?? null,
        date_of_birth: data.date_of_birth ?? null,
        gender: data.gender ?? null,
        phone: data.phone ?? null,
        email: data.email ?? null,
        profile_photo: data.profile_photo ?? null,
        notes: data.notes ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { ...(row as any), document_count: 0 };
  },

  // Owner-only. NOTE: creating a real login for a family member requires
  // Supabase's admin API, which needs the service_role key and can only
  // run on a trusted server. Wire this up to a Supabase Edge Function
  // (e.g. one that calls supabase.auth.admin.inviteUserByEmail) and have
  // that function set family_members.auth_user_id on success.
async setMemberLogin(memberId: string, email: string): Promise<void> {
  await this.requireOwner();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase.functions.invoke(
    'invite-family-member',
    {
      body: {
        memberId,
        email,
      },
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  if (data?.error) {
    throw new Error(data.error);
  }
},

  // Owner-only: unlink a member's login.
  async removeMemberLogin(memberId: string): Promise<void> {
    await this.requireOwner();
    const { error } = await supabase
      .from('family_members')
      .update({ auth_user_id: null, updated_at: new Date().toISOString() })
      .eq('id', memberId);
    if (error) throw new Error(error.message);
  },

  async updateFamilyMember(id: string, data: Partial<FamilyMember>): Promise<void> {
    const { error } = await supabase
      .from('family_members')
      .update({
        name: data.name,
        relationship: data.relationship,
        date_of_birth: data.date_of_birth,
        gender: data.gender,
        phone: data.phone,
        email: data.email,
        profile_photo: data.profile_photo,
        notes: data.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) throw new Error(error.message);
  },

  // Owner-only.
  async deleteFamilyMember(id: string): Promise<void> {
    await this.requireOwner();
    const { error } = await supabase.from('family_members').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  // ── Documents ────────────────────────────────────────
  // Shared access: owner and every member see all family documents (RLS-enforced).
  async getDocuments(filters?: {
    familyMemberId?: string;
    category?: string;
    documentType?: string;
    status?: string;
    search?: string;
    sortBy?: string;
  }): Promise<Document[]> {
    let query = supabase
      .from('documents')
      .select('*, family_members(name), document_versions(file_size, mime_type, original_file_name, is_current)');

    if (filters?.familyMemberId) query = query.eq('family_member_id', filters.familyMemberId);
    if (filters?.category) query = query.eq('category', filters.category);
    if (filters?.documentType) query = query.eq('document_type', filters.documentType);
    if (filters?.search) {
      const s = filters.search;
      query = query.or(
        `title.ilike.%${s}%,document_number.ilike.%${s}%,document_type.ilike.%${s}%,category.ilike.%${s}%`
      );
    }

    const sortBy = filters?.sortBy || 'updated_desc';
    const orderMap: Record<string, { column: string; ascending: boolean }> = {
      updated_desc: { column: 'updated_at', ascending: false },
      updated_asc: { column: 'updated_at', ascending: true },
      expiry_asc: { column: 'expiry_date', ascending: true },
      name_asc: { column: 'title', ascending: true },
    };
    const order = orderMap[sortBy] || orderMap.updated_desc;
    query = query.order(order.column, { ascending: order.ascending });

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []).map((d: any) => {
      const current = d.document_versions?.find((v: any) => v.is_current);
      return {
        ...d,
        family_member_name: d.family_members?.name,
        file_size: current?.file_size,
        mime_type: current?.mime_type,
        original_file_name: current?.original_file_name,
        status: calcStatus(d.expiry_date),
      };
    });
  },

  async getDocument(id: string): Promise<Document | null> {
    const { data, error } = await supabase
      .from('documents')
      .select('*, family_members(name), document_versions(file_size, mime_type, original_file_name, is_current)')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    const current = (data as any).document_versions?.find((v: any) => v.is_current);
    return {
      ...(data as any),
      family_member_name: (data as any).family_members?.name,
      file_size: current?.file_size,
      mime_type: current?.mime_type,
      original_file_name: current?.original_file_name,
      status: calcStatus((data as any).expiry_date),
    };
  },

  async getDocumentsByFamilyMember(familyMemberId: string): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*, document_versions(file_size, mime_type, original_file_name, is_current)')
      .eq('family_member_id', familyMemberId)
      .order('category')
      .order('document_type');
    if (error) throw new Error(error.message);
    return (data || []).map((d: any) => {
      const current = d.document_versions?.find((v: any) => v.is_current);
      return {
        ...d,
        file_size: current?.file_size,
        mime_type: current?.mime_type,
        original_file_name: current?.original_file_name,
        status: calcStatus(d.expiry_date),
      };
    });
  },

  // Shared access: any family member can upload for any family member.
  // owner_id is resolved and set server-side by a DB trigger.
  async createDocument(
    data: Omit<Document, 'id' | 'user_id' | 'current_version' | 'created_at' | 'updated_at' | 'status'>,
    fileData: { base64: string; originalFileName: string; mimeType: string; fileSize: number }
  ): Promise<Document> {
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .insert({
        family_member_id: data.family_member_id,
        category: data.category,
        document_type: data.document_type,
        title: data.title,
        description: data.description ?? null,
        document_number: data.document_number ?? null,
        issue_date: data.issue_date ?? null,
        expiry_date: data.expiry_date ?? null,
        current_version: 1,
      })
      .select()
      .single();
    if (docError) throw new Error(docError.message);

    const ownerId = (doc as any).owner_id;
    const storagePath = `${ownerId}/${doc.id}/v1_${fileData.originalFileName}`;
    const fileBytes = await this.base64ToBytes(fileData.base64);

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, fileBytes, { contentType: fileData.mimeType, upsert: false });
    if (uploadError) throw new Error(uploadError.message);

    const { error: versionError } = await supabase.from('document_versions').insert({
      document_id: doc.id,
      version_number: 1,
      storage_path: storagePath,
      original_file_name: fileData.originalFileName,
      mime_type: fileData.mimeType,
      file_size: fileData.fileSize,
      is_current: true,
    });
    if (versionError) throw new Error(versionError.message);

    await this.createNotification('upload', 'Document uploaded', `${data.title} has been added to your vault.`);

    return (await this.getDocument(doc.id))!;
  },

  async updateDocument(id: string, data: Partial<Document>): Promise<void> {
    const { error } = await supabase
      .from('documents')
      .update({
        title: data.title,
        description: data.description,
        document_number: data.document_number,
        issue_date: data.issue_date,
        expiry_date: data.expiry_date,
        category: data.category,
        document_type: data.document_type,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) throw new Error(error.message);
  },

  async addDocumentVersion(
    documentId: string,
    fileData: { base64: string; originalFileName: string; mimeType: string; fileSize: number }
  ): Promise<void> {
    const doc = await this.getDocument(documentId);
    if (!doc) throw new Error('Document not found');
    const newVersion = doc.current_version + 1;

    await supabase.from('document_versions').update({ is_current: false }).eq('document_id', documentId);

    const ownerId = (doc as any).owner_id;
    const storagePath = `${ownerId}/${documentId}/v${newVersion}_${fileData.originalFileName}`;
    const fileBytes = await this.base64ToBytes(fileData.base64);

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, fileBytes, { contentType: fileData.mimeType, upsert: false });
    if (uploadError) throw new Error(uploadError.message);

    await supabase.from('document_versions').insert({
      document_id: documentId,
      version_number: newVersion,
      storage_path: storagePath,
      original_file_name: fileData.originalFileName,
      mime_type: fileData.mimeType,
      file_size: fileData.fileSize,
      is_current: true,
    });

    await supabase
      .from('documents')
      .update({ current_version: newVersion, updated_at: new Date().toISOString() })
      .eq('id', documentId);

    await this.createNotification('update', 'Document updated', `${doc.title} has been updated to version ${newVersion}.`);
  },

  async deleteDocument(id: string): Promise<void> {
    const { data: versions } = await supabase
      .from('document_versions')
      .select('storage_path')
      .eq('document_id', id);
    const { error } = await supabase.from('documents').delete().eq('id', id);
    if (error) throw new Error(error.message);
    if (versions?.length) {
      await supabase.storage.from('documents').remove(versions.map((v: any) => v.storage_path));
    }
  },

  // ── Versions ─────────────────────────────────────────
  async getVersions(documentId: string): Promise<DocumentVersion[]> {
    const { data, error } = await supabase
      .from('document_versions')
      .select('*')
      .eq('document_id', documentId)
      .order('version_number', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []) as DocumentVersion[];
  },

  async restoreVersion(documentId: string, versionId: string): Promise<void> {
    const versions = await this.getVersions(documentId);
    const target = versions.find((v: any) => v.id === versionId) as any;
    if (!target) throw new Error('Version not found');
    const maxVersion = Math.max(...versions.map((v: any) => v.version_number));
    const newVersion = maxVersion + 1;

    const doc = await this.getDocument(documentId);
    const ownerId = (doc as any).owner_id;
    const newPath = `${ownerId}/${documentId}/v${newVersion}_${target.original_file_name}`;

    const { error: copyError } = await supabase.storage.from('documents').copy(target.storage_path, newPath);
    if (copyError) throw new Error(copyError.message);

    await supabase.from('document_versions').update({ is_current: false }).eq('document_id', documentId);
    await supabase.from('document_versions').insert({
      document_id: documentId,
      version_number: newVersion,
      storage_path: newPath,
      original_file_name: target.original_file_name,
      mime_type: target.mime_type,
      file_size: target.file_size,
      is_current: true,
    });
    await supabase
      .from('documents')
      .update({ current_version: newVersion, updated_at: new Date().toISOString() })
      .eq('id', documentId);
  },

  async deleteVersion(documentId: string, versionId: string): Promise<void> {
    const { data: version } = await supabase
      .from('document_versions')
      .select('is_current, storage_path')
      .eq('id', versionId)
      .maybeSingle();
    if (version?.is_current) throw new Error('Cannot delete the current version.');
    if (version) await supabase.storage.from('documents').remove([version.storage_path]);
    const { error } = await supabase.from('document_versions').delete().eq('id', versionId);
    if (error) throw new Error(error.message);
  },

  async getVersionFile(versionId: string): Promise<{
    data: Uint8Array;
    mimeType: string | null;
    originalFileName: string | null;
  } | null> {
    const { data: row } = await supabase
      .from('document_versions')
      .select('storage_path, mime_type, original_file_name')
      .eq('id', versionId)
      .maybeSingle();
    if (!row) return null;
    const { data: file, error } = await supabase.storage.from('documents').download(row.storage_path);
    if (error) throw new Error(error.message);
    return {
      data: new Uint8Array(await file.arrayBuffer()),
      mimeType: row.mime_type,
      originalFileName: row.original_file_name,
    };
  },

  async getCurrentVersionFile(documentId: string): Promise<{
    data: Uint8Array;
    mimeType: string | null;
    originalFileName: string | null;
    versionId: string;
  } | null> {
    const { data: row } = await supabase
      .from('document_versions')
      .select('id, storage_path, mime_type, original_file_name')
      .eq('document_id', documentId)
      .eq('is_current', true)
      .maybeSingle();
    if (!row) return null;
    const { data: file, error } = await supabase.storage.from('documents').download(row.storage_path);
    if (error) throw new Error(error.message);
    return {
      versionId: row.id,
      data: new Uint8Array(await file.arrayBuffer()),
      mimeType: row.mime_type,
      originalFileName: row.original_file_name,
    };
  },

  // ── Notifications ────────────────────────────────────
  async getNotifications(): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []) as Notification[];
  },

  async createNotification(type: string, title: string, message: string, documentId?: string): Promise<void> {
    // owner_id is set server-side by a trigger — no need to resolve it here
    await supabase.from('notifications').insert({
      document_id: documentId ?? null,
      type,
      title,
      message,
    });
  },

  async markNotificationRead(id: string): Promise<void> {
    const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
    if (error) throw new Error(error.message);
  },

  async markAllNotificationsRead(): Promise<void> {
    const { error } = await supabase.from('notifications').update({ read: true }).eq('read', false);
    if (error) throw new Error(error.message);
  },

  // ── Dashboard Stats ──────────────────────────────────
  // Shared access: owner and every member see the whole family's stats.
  async getDashboardStats(): Promise<DashboardStats> {
    const { count: memberCount } = await supabase
      .from('family_members')
      .select('*', { count: 'exact', head: true });

    const { data: docs } = await supabase.from('documents').select('id, expiry_date');

    let active = 0;
    let expiringSoon = 0;
    let expired = 0;
    for (const doc of docs || []) {
      const st = calcStatus((doc as any).expiry_date);
      if (st === 'active') active++;
      else if (st === 'expiring_soon') expiringSoon++;
      else if (st === 'expired') expired++;
    }

    return {
      totalFamilyMembers: memberCount || 0,
      totalDocuments: (docs || []).length,
      active,
      expiringSoon,
      expired,
    };
  },

  // ── Helpers ──────────────────────────────────────────
  async base64ToBytes(base64: string): Promise<Uint8Array> {
    const parts = base64.split(',');
    const byteStr = parts[1] || parts[0];
    const binary = atob(byteStr);
    const arr = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      arr[i] = binary.charCodeAt(i);
    }
    return arr;
  },

  bytesToBase64(bytes: Uint8Array, mimeType?: string): string {
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    const base64 = btoa(binary);
    if (mimeType) {
      return `data:${mimeType};base64,${base64}`;
    }
    return base64;
  },
};