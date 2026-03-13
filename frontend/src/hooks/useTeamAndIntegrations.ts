import { useCallback, useEffect, useState } from 'react';

type Notify = (message: string, tone?: 'success' | 'error' | 'info') => void;

type RequestConfirm = (config: {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  thirdLabel?: string;
  confirmVariant?: 'primary' | 'danger';
  thirdVariant?: 'primary' | 'danger' | 'ghost';
}) => Promise<boolean | 'third'>;

export type Collaborator = {
  id: string;
  email: string;
  role: string;
};

export type CustomRole = {
  name: string;
  description?: string;
  permissions?: {
    canApprove: boolean;
    canGenerate: boolean;
    canCreate: boolean;
    canDelete: boolean;
    canEditSettings: boolean;
    canAddCollaborators: boolean;
  };
};

interface UseTeamAndIntegrationsOptions {
  companyId?: string;
  pathname: string;
  session: { user?: { id?: string } } | null;
  authedFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  backendBaseUrl: string;
  notify: Notify;
  requestConfirm: RequestConfirm;
}

export function useTeamAndIntegrations({
  companyId,
  pathname,
  session,
  authedFetch,
  backendBaseUrl,
  notify,
  requestConfirm,
}: UseTeamAndIntegrationsOptions) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [connectedAccounts, setConnectedAccounts] = useState<any[]>([]);
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState('');

  const fetchCollaborators = useCallback(async (targetCompanyId: string) => {
    try {
      const res = await authedFetch(`${backendBaseUrl}/api/collaborators/${targetCompanyId}`);
      const data = await res.json();
      if (!res.ok) {
        notify(data.error || 'Failed to load collaborators.', 'error');
        return;
      }
      setCollaborators(data.collaborators || []);
      setCustomRoles(data.customRoles || []);
    } catch {
      notify('Failed to load collaborators.', 'error');
    }
  }, [authedFetch, backendBaseUrl, notify]);

  const handleAddCollaborator = useCallback(async (emailOverride?: string) => {
    const emailToInvite = (emailOverride ?? newCollaboratorEmail).trim();

    if (!emailToInvite) {
      notify('Please enter an email address.', 'info');
      return;
    }
    if (!companyId) {
      notify('Company context missing. Please refresh the page.', 'error');
      console.error('[handleAddCollaborator] companyId is null');
      return;
    }

    try {
      const res = await authedFetch(`${backendBaseUrl}/api/collaborators/${companyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToInvite }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 404) {
          notify(data.error || 'User with this email not found or not registered.', 'error');
        } else if (res.status === 409) {
          notify('User is already a collaborator.', 'error');
        } else {
          notify(data.error || 'Failed to add collaborator.', 'error');
        }
        return;
      }
      notify('Collaborator added successfully!', 'success');
      setNewCollaboratorEmail('');
      await fetchCollaborators(companyId);
    } catch (err) {
      console.error('handleAddCollaborator error:', err);
      notify('Failed to add collaborator. Please check your connection.', 'error');
    }
  }, [authedFetch, backendBaseUrl, companyId, fetchCollaborators, newCollaboratorEmail, notify]);

  const handleUpdateCustomRoles = useCallback(async (roles: CustomRole[]) => {
    if (!companyId) return;
    try {
      const res = await authedFetch(`${backendBaseUrl}/api/collaborators/${companyId}/roles`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customRoles: roles }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error || 'Failed to update custom roles.', 'error');
        return;
      }
      setCustomRoles(roles);
      notify('Custom roles updated!', 'success');
    } catch (err) {
      console.error('handleUpdateCustomRoles error:', err);
      notify('Failed to update custom roles. This might be due to missing database columns.', 'error');
    }
  }, [authedFetch, backendBaseUrl, companyId, notify]);

  const handleAssignRole = useCallback(async (targetUserId: string, role: string) => {
    if (!companyId) return;
    try {
      const res = await authedFetch(`${backendBaseUrl}/api/collaborators/${companyId}/${targetUserId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error || 'Failed to assign role.', 'error');
        return;
      }
      setCollaborators((prev) => prev.map((collaborator) => (
        collaborator.id === targetUserId ? { ...collaborator, role } : collaborator
      )));
      notify(`Role updated to ${role}`, 'success');
    } catch (err) {
      console.error('handleAssignRole error:', err);
      notify('Failed to assign role. This might be due to missing database columns.', 'error');
    }
  }, [authedFetch, backendBaseUrl, companyId, notify]);

  const handleRemoveCollaborator = useCallback(async (id: string) => {
    if (!companyId) return;
    try {
      const res = await authedFetch(`${backendBaseUrl}/api/collaborators/${companyId}/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error || 'Failed to remove collaborator.', 'error');
        return;
      }
      notify('Collaborator removed.', 'success');
      await fetchCollaborators(companyId);
    } catch {
      notify('Failed to remove collaborator.', 'error');
    }
  }, [authedFetch, backendBaseUrl, companyId, fetchCollaborators, notify]);

  const fetchConnectedAccounts = useCallback(async (targetCompanyId: string) => {
    try {
      const res = await authedFetch(`${backendBaseUrl}/api/social/${targetCompanyId}/accounts`);
      const data = await res.json();
      if (!res.ok) return;
      setConnectedAccounts(data.accounts || []);
    } catch (err) {
      console.error('Failed to load social accounts.', err);
    }
  }, [authedFetch, backendBaseUrl]);

  const handleConnectLinkedIn = useCallback(async () => {
    if (!companyId) return;
    try {
      const res = await authedFetch(`${backendBaseUrl}/api/auth/linkedin/connect?companyId=${companyId}`);
      if (!res.ok) {
        notify('Failed to initiate LinkedIn connection.', 'error');
        return;
      }
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('LinkedIn connect error:', err);
      notify('Failed to connect LinkedIn.', 'error');
    }
  }, [authedFetch, backendBaseUrl, companyId, notify]);

  const handleConnectFacebook = useCallback(async () => {
    if (!companyId) return;
    try {
      const res = await authedFetch(`${backendBaseUrl}/api/auth/facebook/connect?companyId=${companyId}`);
      if (!res.ok) {
        notify('Failed to initiate Facebook connection.', 'error');
        return;
      }
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Facebook connection error', err);
      notify('An error occurred. Please try again.', 'error');
    }
  }, [authedFetch, backendBaseUrl, companyId, notify]);

  const handleDisconnectAccount = useCallback(async (accountId: string) => {
    if (!companyId) return;

    try {
      const confirmed = await requestConfirm({
        title: 'Disconnect Account?',
        description: 'Are you sure you want to disconnect this social account? You will need to reconnect it to publish content again.',
        confirmLabel: 'Disconnect',
        cancelLabel: 'Cancel',
        confirmVariant: 'danger',
      });

      if (!confirmed) return;

      const res = await authedFetch(`${backendBaseUrl}/api/social/${companyId}/accounts/${accountId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to disconnect account');
      }

      notify('Account disconnected successfully', 'success');
      setConnectedAccounts((prev) => prev.filter((account) => account.id !== accountId));
    } catch (err: any) {
      console.error('Error disconnecting account:', err);
      notify(err.message || 'Failed to disconnect account', 'error');
    }
  }, [authedFetch, backendBaseUrl, companyId, notify, requestConfirm]);

  useEffect(() => {
    const isCompanyRoute = /^\/company\/[^/]+/.test(pathname);
    if (!isCompanyRoute || !companyId || !session) return;
    fetchCollaborators(companyId);
  }, [companyId, fetchCollaborators, pathname, session]);

  useEffect(() => {
    if (!companyId || !session) {
      setConnectedAccounts([]);
      return;
    }
    fetchConnectedAccounts(companyId);
  }, [companyId, fetchConnectedAccounts, session]);

  return {
    collaborators,
    customRoles,
    connectedAccounts,
    newCollaboratorEmail,
    setNewCollaboratorEmail,
    fetchCollaborators,
    fetchConnectedAccounts,
    handleAddCollaborator,
    handleUpdateCustomRoles,
    handleAssignRole,
    handleRemoveCollaborator,
    handleConnectLinkedIn,
    handleConnectFacebook,
    handleDisconnectAccount,
  };
}
