import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import type { OnboardingData } from '@/modals';
import { SOKMED_COLUMNS } from '@/pages/Workboard/types';

type Notify = (message: string, tone?: 'success' | 'error' | 'info') => void;

interface ConfirmConfig {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  confirmVariant?: 'primary' | 'danger';
  thirdLabel?: string;
  thirdVariant?: 'primary' | 'danger' | 'ghost';
}

interface UseCompanyLifecycleOptions {
  session: Session | null;
  userProfile: any;
  setUserProfile: React.Dispatch<React.SetStateAction<any>>;
  setIsOnboardingOpen: React.Dispatch<React.SetStateAction<boolean>>;
  companies: any[];
  collaborators: any[];
  activeCompanyId?: string | null;
  authedFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  backendBaseUrl: string;
  supabase: any;
  notify: Notify;
  requestConfirm: (config: ConfirmConfig) => Promise<boolean | 'third'>;
  setActiveCompanyIdWithPersistence: (companyId?: string) => void;
}

export function useCompanyLifecycle({
  session,
  userProfile,
  setUserProfile,
  setIsOnboardingOpen,
  companies,
  collaborators,
  activeCompanyId,
  authedFetch,
  backendBaseUrl,
  supabase,
  notify,
  requestConfirm,
  setActiveCompanyIdWithPersistence,
}: UseCompanyLifecycleOptions) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);
  const [isAddCompanyModalOpen, setIsAddCompanyModalOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyDescription, setNewCompanyDescription] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');

  const handleAddCompany = useCallback(async () => {
    if (!newCompanyName.trim()) {
      notify('Company name is required.', 'error');
      return;
    }
    if (isCreatingCompany) return;

    setIsCreatingCompany(true);
    try {
      const res = await authedFetch(`${backendBaseUrl}/api/company`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: newCompanyName.trim(),
          companyDescription: newCompanyDescription.trim(),
          kanban_settings: {
            columns: SOKMED_COLUMNS,
            automations: [],
            studio_settings: {
              schedulingStatus: 'Scheduled',
              postedStatus: 'Published',
              unscheduledStatus: 'Drafts',
            },
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        notify(data.error || 'Failed to create company.', 'error');
        return;
      }
      notify('Company created.', 'success');
      setIsAddCompanyModalOpen(false);
      await new Promise((resolve) => setTimeout(resolve, 200));
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      if (data.company?.companyId) {
        setActiveCompanyIdWithPersistence(data.company.companyId);
      }
    } catch (err) {
      console.error('Failed to create company', err);
      notify('Failed to create company. Check console for details.', 'error');
    } finally {
      setTimeout(() => setIsCreatingCompany(false), 2000);
    }
  }, [
    authedFetch,
    backendBaseUrl,
    isCreatingCompany,
    newCompanyDescription,
    newCompanyName,
    notify,
    queryClient,
    setActiveCompanyIdWithPersistence,
  ]);

  const handleOnboardingComplete = useCallback(async (data: OnboardingData | null) => {
    if (isCreatingCompany) return;
    setIsCreatingCompany(true);
    try {
      if (!data) {
        const profileRes = await authedFetch(`${backendBaseUrl}/api/profile`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            onboarding_completed: true,
          }),
        });

        if (profileRes.ok) {
          setIsOnboardingOpen(false);
          setUserProfile((prev: any) => ({ ...prev, onboarding_completed: true }));
          notify('You can create a company anytime from the sidebar!', 'info');
        }
        return;
      }

      const roleToUpdate = userProfile?.role === 'ADMIN' ? undefined : data.role;
      const profileRes = await authedFetch(`${backendBaseUrl}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(roleToUpdate && { role: roleToUpdate }),
          onboarding_completed: true,
        }),
      });

      if (!profileRes.ok) {
        notify('Failed to save profile. Please try again.', 'error');
        return;
      }

      const existingCompany = companies.find(
        (company) => company.companyName?.toLowerCase() === data.companyName.toLowerCase(),
      );

      if (existingCompany) {
        setIsOnboardingOpen(false);
        setUserProfile((prev: any) => ({ ...prev, onboarding_completed: true }));
        setActiveCompanyIdWithPersistence(existingCompany.companyId);
        notify('Welcome back! Using your existing company.', 'success');
        navigate(`/company/${encodeURIComponent(existingCompany.companyId)}/dashboard`);
        return;
      }

      const companyRes = await authedFetch(`${backendBaseUrl}/api/company`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: data.companyName,
          companyDescription: data.companyDescription,
        }),
      });

      const companyData = await companyRes.json().catch(() => ({}));
      if (!companyRes.ok) {
        notify(companyData.error || 'Failed to create company.', 'error');
        return;
      }

      const newCompanyId = companyData.company?.companyId;

      if (newCompanyId) {
        if (!data.skipBrandSetup) {
          const brandPayload = {
            companyId: newCompanyId,
            form_answer: {
              brandBasics: {
                name: data.companyName,
                industry: data.industry,
                type: data.businessType,
                offer: data.companyDescription,
                goal: data.primaryGoal,
              },
              audience: {
                role: data.audienceRole || '',
                industry: data.audienceIndustry || '',
                painPoints: data.audiencePainPoints?.join(', ') || '',
                outcome: data.audienceOutcome || '',
              },
              tone: {
                formal: data.toneFormal || 5,
                energy: data.toneEnergy || 5,
                bold: data.toneBold || 5,
                emojiUsage: data.emojiUsage || 'Sometimes',
                writingLength: data.writingLength || 'Medium',
                ctaStrength: data.ctaStrength || 'Moderate',
              },
              ...(data.targetAudience && {
                extractedAudience: {
                  role: data.targetAudience.role,
                  painPoints: data.targetAudience.painPoints?.join(', ') || '',
                  outcomes: data.targetAudience.outcomes?.join(', ') || '',
                },
              }),
              ...(data.brandVoice && {
                extractedTone: {
                  formality: data.brandVoice.formality,
                  energy: data.brandVoice.energy,
                  confidence: data.brandVoice.confidence,
                },
              }),
              ...(data.visualIdentity && {
                visualIdentity: {
                  colors: data.visualIdentity.primaryColors?.join(', ') || '',
                },
              }),
            },
          };

          await authedFetch(`${backendBaseUrl}/api/brandkb`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(brandPayload),
          });
        }

        queryClient.invalidateQueries({ queryKey: ['companies'] });
        setActiveCompanyIdWithPersistence(newCompanyId);
      }

      setIsOnboardingOpen(false);
      setUserProfile((prev: any) => ({ ...prev, onboarding_completed: true }));
      notify('Welcome to Moonshot Generator! 🎉', 'success');
      sessionStorage.setItem('justCompletedOnboarding', 'true');

      if (newCompanyId) {
        navigate(`/company/${encodeURIComponent(newCompanyId)}/dashboard`);
      }
    } catch {
      notify('Failed to complete onboarding. Please try again.', 'error');
    } finally {
      setTimeout(() => setIsCreatingCompany(false), 2000);
    }
  }, [
    authedFetch,
    backendBaseUrl,
    companies,
    isCreatingCompany,
    navigate,
    notify,
    queryClient,
    setActiveCompanyIdWithPersistence,
    setIsOnboardingOpen,
    setUserProfile,
    userProfile?.role,
  ]);

  const handleLogout = useCallback(async () => {
    sessionStorage.removeItem('impersonateUserId');
    setActiveCompanyIdWithPersistence(undefined);
    await supabase?.auth.signOut();
    navigate('/');
  }, [navigate, setActiveCompanyIdWithPersistence, supabase]);

  const handleUpdateCompany = useCallback(async () => {
    if (!activeCompanyId) return;
    try {
      const res = await authedFetch(`${backendBaseUrl}/api/company/${activeCompanyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: companyName.trim(),
          companyDescription: companyDescription.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update company');
      }

      notify('Company updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    } catch (err: any) {
      console.error('Error updating company:', err);
      notify(err.message || 'Failed to update company', 'error');
    }
  }, [activeCompanyId, authedFetch, backendBaseUrl, companyDescription, companyName, notify, queryClient]);

  const handleDeleteCompany = useCallback(async (companyId: string) => {
    try {
      const companyToDelete = companies.find((company) => company.companyId === companyId);
      const confirmed = await requestConfirm({
        title: 'Delete Company?',
        description: `Are you sure you want to delete "${companyToDelete?.companyName}"? This action cannot be undone and all data will be lost.`,
        confirmLabel: 'Delete Company',
        cancelLabel: 'Cancel',
        confirmVariant: 'danger',
      });

      if (!confirmed) return;

      const res = await authedFetch(`${backendBaseUrl}/api/company/${companyId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete company');
      }

      notify('Company deleted successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      const updatedCompanies = companies.filter((company) => company.companyId !== companyId);

      if (activeCompanyId === companyId) {
        if (updatedCompanies.length > 0) {
          const nextCompanyId = updatedCompanies[0].companyId;
          setActiveCompanyIdWithPersistence(nextCompanyId);
          navigate(`/company/${encodeURIComponent(nextCompanyId)}/dashboard`);
        } else {
          setActiveCompanyIdWithPersistence('');
          navigate('/');
        }
      }
    } catch (err: any) {
      console.error('Error deleting company:', err);
      notify(err.message || 'Failed to delete company', 'error');
    }
  }, [
    activeCompanyId,
    authedFetch,
    backendBaseUrl,
    companies,
    navigate,
    notify,
    queryClient,
    requestConfirm,
    setActiveCompanyIdWithPersistence,
  ]);

  const handleTransferOwnership = useCallback(async (newOwnerId: string) => {
    if (!activeCompanyId) return;

    try {
      const company = companies.find((entry) => entry.companyId === activeCompanyId);
      const collaborator = collaborators.find((entry: any) => entry.id === newOwnerId);

      const confirmed = await requestConfirm({
        title: 'Transfer Ownership?',
        description: `Are you sure you want to transfer ownership of "${company?.companyName}" to ${collaborator?.email || 'this user'}? You will become a collaborator with limited permissions.`,
        confirmLabel: 'Transfer Ownership',
        cancelLabel: 'Cancel',
        confirmVariant: 'danger',
      });

      if (!confirmed) return;

      const res = await authedFetch(`${backendBaseUrl}/api/company/${activeCompanyId}/transfer-ownership`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newOwnerId }),
      });

      const responseData = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(responseData.error || 'Failed to transfer ownership');
      }

      notify(responseData.message || 'Ownership transferred successfully', 'success');
      navigate(`/company/${encodeURIComponent(activeCompanyId)}/dashboard`);
      window.location.reload();
    } catch (err: any) {
      console.error('Error transferring ownership:', err);
      notify(err.message || 'Failed to transfer ownership', 'error');
    }
  }, [
    activeCompanyId,
    authedFetch,
    backendBaseUrl,
    collaborators,
    companies,
    navigate,
    notify,
    requestConfirm,
  ]);

  useEffect(() => {
    const loadCompany = async () => {
      if (!session || !activeCompanyId) return;
      const requestedCompanyId = activeCompanyId;
      setCompanyName('');
      setCompanyDescription('');
      try {
        const res = await authedFetch(`${backendBaseUrl}/api/company/${activeCompanyId}`);
        if (!res.ok) return;
        const data = await res.json().catch(() => ({}));
        const company = (data && (data.company || data)) as any;
        if (requestedCompanyId !== activeCompanyId) return;
        if (company && typeof company.companyName === 'string') {
          setCompanyName(company.companyName);
        }
        if (company && typeof company.companyDescription === 'string') {
          setCompanyDescription(company.companyDescription);
        }
      } catch (err) {
        console.error('Error loading company profile:', err);
      }
    };

    loadCompany();
  }, [activeCompanyId, authedFetch, backendBaseUrl, session]);

  return {
    isCreatingCompany,
    isAddCompanyModalOpen,
    setIsAddCompanyModalOpen,
    newCompanyName,
    setNewCompanyName,
    newCompanyDescription,
    setNewCompanyDescription,
    companyName,
    setCompanyName,
    companyDescription,
    setCompanyDescription,
    handleAddCompany,
    handleOnboardingComplete,
    handleLogout,
    handleUpdateCompany,
    handleDeleteCompany,
    handleTransferOwnership,
  };
}
