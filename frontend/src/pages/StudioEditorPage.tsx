import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Image as ImageIcon,
    Calendar,
    Send,
    Save,
    MoreVertical,
    Clock,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Plus
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ImageGenerationModal } from '../modals/ImageGenerationModal';

interface StudioEditorPageProps {
    activeCompanyId?: string;
    backendBaseUrl: string;
    authedFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
    notify: (message: string, tone?: 'success' | 'error' | 'info') => void;
    getImageGeneratedUrl?: (row: any) => string | null;
}

export function StudioEditorPage({ activeCompanyId, backendBaseUrl, authedFetch, notify, getImageGeneratedUrl }: StudioEditorPageProps) {
    const { companyId, contentId } = useParams();
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [caption, setCaption] = useState('');
    const [hashtags, setHashtags] = useState('');
    const [mediaUrl, setMediaUrl] = useState<string | null>(null);
    const [platform, setPlatform] = useState<'linkedin' | 'twitter'>('linkedin');
    const [scheduleDate, setScheduleDate] = useState('');
    const [status, setStatus] = useState<'DRAFT' | 'SCHEDULED' | 'PUBLISHED'>('DRAFT');
    const [isUploading, setIsUploading] = useState(false);
    const [connectedAccounts, setConnectedAccounts] = useState<any[]>([]);
    const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (activeCompanyId) {
            fetchAccounts();
        }
    }, [activeCompanyId]);


    // Load existing content if editing
    useEffect(() => {
        if (contentId && activeCompanyId) {
            fetchContent(contentId);
        }
    }, [contentId, activeCompanyId]);

    const fetchContent = async (id: string) => {
        setIsLoading(true);
        try {
            const res = await authedFetch(`${backendBaseUrl}/api/content-calendar/${id}`);
            if (res.ok) {
                const data = await res.json();
                const row = data.contentCalendar || data;
                setCaption(row.finalCaption || row.captionOutput || '');
                setHashtags(row.finalHashtags || row.hastagsOutput || '');
                setMediaUrl(row.imageGeneratedUrl || null);
                setScheduleDate(row.scheduled_at ? new Date(row.scheduled_at).toISOString().slice(0, 16) : '');
                setStatus(row.status || 'DRAFT');
            } else {
                notify('Failed to load content', 'error');
            }
        } catch (error) {
            console.error(error);
            notify('Error loading content', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (newStatus: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' = 'DRAFT', isPublishing = false): Promise<string | null> => {
        if (!activeCompanyId) return null;
        setIsSaving(true);

        try {
            const payload: any = {
                companyId: activeCompanyId,
                finalCaption: caption,
                captionOutput: caption,
                finalHashtags: hashtags,
                hastagsOutput: hashtags, // Misspelling in DB
                imageGenerated: mediaUrl, // DB column is imageGenerated
                status: newStatus,
                scheduled_at: newStatus === 'SCHEDULED' && scheduleDate ? new Date(scheduleDate).toISOString() : null
            };

            let url = `${backendBaseUrl}/api/content-calendar`;
            let method = 'POST';

            if (contentId) {
                url = `${url}/${contentId}`;
                method = 'PUT';
            } else {
                payload.date = new Date().toISOString().split('T')[0];
                payload.contentType = 'Social Post';
            }

            const res = await authedFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json();
                const savedId = data.contentCalendar?.contentCalendarId || data.contentCalendarId || contentId;

                notify(contentId ? 'Saved changes' : 'Created new post', 'success');

                if (!contentId && !isPublishing) {
                    navigate(`/company/${encodeURIComponent(activeCompanyId)}/studio/${savedId}`);
                }
                return savedId;
            } else {
                const errorData = await res.json().catch(() => ({}));
                console.error('Save failed:', errorData);
                notify(errorData.error || 'Failed to save', 'error');
                return null;
            }
        } catch (error: any) {
            console.error('Save error:', error);
            notify(`Error saving post: ${error.message}`, 'error');
            return null;
        } finally {
            setIsSaving(false);
        }
    };

    const fetchAccounts = async () => {
        if (!activeCompanyId) return;
        try {
            const res = await authedFetch(`${backendBaseUrl}/api/social/${activeCompanyId}/accounts`);
            if (res.ok) {
                const data = await res.json();
                setConnectedAccounts(data.accounts || []);
                // Default select all if it's a new post or based on existing platform
                if (data.accounts?.length > 0 && selectedAccountIds.length === 0) {
                    setSelectedAccountIds(data.accounts.map((a: any) => a.id));
                }
            }
        } catch (error) {
            console.error('Error fetching accounts:', error);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeCompanyId) return;

        // Limit file size to 5MB
        if (file.size > 5 * 1024 * 1024) {
            notify('File is too large. Maximum size is 5MB.', 'error');
            return;
        }

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${activeCompanyId}/${Date.now()}.${fileExt}`;
            const filePath = `generated-images/${fileName}`;

            if (!supabase) throw new Error('Supabase client not initialized');

            const { error: uploadError } = await supabase.storage
                .from('generated-images')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('generated-images')
                .getPublicUrl(fileName);

            setMediaUrl(publicUrl);
            notify('Image uploaded successfully', 'success');
        } catch (error: any) {
            console.error('Upload error:', error);
            notify(error.message || 'Failed to upload image', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const handlePublish = async () => {
        if (!activeCompanyId) return;
        if (selectedAccountIds.length === 0) {
            notify('Please select at least one account to post to', 'error');
            return;
        }

        // 1. Save first
        const savedId = await handleSave('DRAFT', true);
        if (!savedId) return;

        setIsSaving(true);
        let successCount = 0;
        let failCount = 0;

        try {
            for (const accountId of selectedAccountIds) {
                const account = connectedAccounts.find(a => a.id === accountId);
                if (!account) continue;

                try {
                    const res = await authedFetch(`${backendBaseUrl}/api/social/${activeCompanyId}/publish`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            companyId: activeCompanyId, // Explicitly pass companyId
                            provider: account.provider,
                            contentCalendarId: savedId,
                            content: {
                                text: [caption, hashtags].filter(Boolean).join('\n\n'),
                                url: mediaUrl
                            }
                        })
                    });

                    if (res.ok) {
                        successCount++;
                    } else {
                        failCount++;
                        const data = await res.json().catch(() => ({}));
                        console.error(`Failed to publish to ${account.provider}:`, data.error);
                    }
                } catch (err) {
                    failCount++;
                    console.error(`Error publishing to ${account.provider}:`, err);
                }
            }

            if (successCount > 0) {
                notify(`Published successfully to ${successCount} platform(s)${failCount > 0 ? `, but failed for ${failCount}` : ''}!`, successCount > 0 && failCount === 0 ? 'success' : 'info');
                setStatus('PUBLISHED');
            } else if (failCount > 0) {
                notify('Failed to publish to all selected platforms', 'error');
            }
        } catch (error: any) {
            console.error('Publish overall error:', error);
            notify(`Publish failed: ${error.message}`, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
            </div>
        );
    }

    return (
        <main className="flex h-full flex-col bg-slate-50/50">
            {/* Header */}
            <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(`/company/${encodeURIComponent(activeCompanyId || '')}/studio`)}
                        className="p-2 -ml-2 rounded-xl text-brand-dark/60 hover:text-brand-dark hover:bg-slate-100 transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h1 className="text-lg font-bold text-slate-800">
                        {contentId ? 'Edit Post' : 'New Post'}
                    </h1>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${status === 'PUBLISHED' ? 'bg-green-100 text-green-700' :
                        status === 'SCHEDULED' ? 'bg-sky-100 text-sky-700' :
                            'bg-slate-100 text-slate-600'
                        }`}>
                        {status}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => handleSave('DRAFT')}
                        disabled={isSaving}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save Draft
                    </button>

                    {scheduleDate ? (
                        <button
                            onClick={() => handleSave('SCHEDULED')}
                            disabled={isSaving}
                            className="inline-flex items-center gap-2 rounded-lg bg-[#3fa9f5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2f97e6] disabled:opacity-50"
                        >
                            <Calendar className="h-4 w-4" />
                            Schedule
                        </button>
                    ) : (
                        <button
                            onClick={handlePublish}
                            disabled={isSaving}
                            className="inline-flex items-center gap-2 rounded-lg bg-[#3fa9f5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2f97e6] disabled:opacity-50"
                        >
                            <Send className="h-4 w-4" />
                            Post Now
                        </button>
                    )}
                </div>
            </header>

            {/* 2-Column Layout */}
            <div className="flex flex-1 overflow-hidden">

                {/* 2. Editor (40%) */}
                <div className="flex-1 min-w-[400px] overflow-y-auto border-r border-slate-200 bg-white p-6">
                    <div className="max-w-xl mx-auto space-y-6">

                        {/* Platform Select */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Post to Platforms</label>
                                <button
                                    onClick={() => navigate(`/company/${encodeURIComponent(activeCompanyId || '')}/settings/integrations`)}
                                    className="text-[10px] font-bold text-[#3fa9f5] hover:underline uppercase tracking-tight"
                                >
                                    Manage Accounts
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {connectedAccounts.length === 0 ? (
                                    <button
                                        onClick={() => navigate(`/company/${encodeURIComponent(activeCompanyId || '')}/settings/integrations`)}
                                        className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 p-4 text-sm font-medium text-slate-400 hover:border-[#3fa9f5]/50 hover:bg-[#3fa9f5]/5 transition"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Connect social accounts
                                    </button>
                                ) : (
                                    connectedAccounts.map((account) => {
                                        const isSelected = selectedAccountIds.includes(account.id);
                                        return (
                                            <button
                                                key={account.id}
                                                onClick={() => {
                                                    setSelectedAccountIds(prev =>
                                                        isSelected
                                                            ? prev.filter(id => id !== account.id)
                                                            : [...prev, account.id]
                                                    );
                                                }}
                                                className={`flex items-center gap-3 rounded-xl border p-3 text-sm font-semibold transition ${isSelected
                                                    ? account.provider === 'linkedin'
                                                        ? 'border-[#0077b5] bg-[#0077b5]/5 text-[#0077b5]'
                                                        : account.provider === 'facebook'
                                                            ? 'border-[#1877F2] bg-[#1877F2]/5 text-[#1877F2]'
                                                            : 'border-[#3fa9f5] bg-[#3fa9f5]/5 text-[#3fa9f5]'
                                                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                                    }`}
                                            >
                                                {account.provider === 'linkedin' && (
                                                    <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                                                )}
                                                {account.provider === 'facebook' && (
                                                    <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                                                )}
                                                <div className="text-left">
                                                    <div className="text-[10px] uppercase tracking-wider opacity-60 font-bold">{account.provider}</div>
                                                    <div className="truncate max-w-[120px]">{account.profile_name || 'Account'}</div>
                                                </div>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Caption Editor */}
                        <div>
                            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Caption</label>
                            <textarea
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                placeholder="What do you want to share?"
                                className="w-full rounded-xl border border-slate-200 p-4 text-sm leading-relaxed placeholder:text-slate-400 focus:border-[#3fa9f5] focus:outline-none focus:ring-1 focus:ring-[#3fa9f5]"
                                rows={8}
                            />
                            <div className="mt-2 flex justify-end">
                                <span className={`text-xs ${caption.length > 3000 ? 'text-red-500' : 'text-slate-400'}`}>
                                    {caption.length} characters
                                </span>
                            </div>
                        </div>

                        {/* Hashtags Editor */}
                        <div>
                            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Hashtags</label>
                            <textarea
                                value={hashtags}
                                onChange={(e) => setHashtags(e.target.value)}
                                placeholder="#trending #topic..."
                                className="w-full rounded-xl border border-slate-200 p-4 text-sm leading-relaxed placeholder:text-slate-400 focus:border-[#3fa9f5] focus:outline-none focus:ring-1 focus:ring-[#3fa9f5]"
                                rows={3}
                            />
                        </div>

                        {/* Media */}
                        <div className="relative">
                            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Media</label>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                accept="image/*"
                                className="hidden"
                            />
                            {mediaUrl ? (
                                <div className="relative overflow-hidden rounded-xl border border-slate-200 group">
                                    <img src={mediaUrl} alt="Post media" className="h-64 w-full object-cover" />
                                    <button
                                        onClick={() => setMediaUrl(null)}
                                        className="absolute top-2 right-2 rounded-full bg-white/90 p-1.5 text-slate-600 shadow-sm hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                                    >
                                        <AlertCircle className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="flex h-32 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400 transition hover:border-[#3fa9f5]/50 hover:bg-[#3fa9f5]/5 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="mb-2 h-8 w-8 animate-spin text-[#3fa9f5]" />
                                            <span className="text-sm font-medium text-[#3fa9f5]">Uploading...</span>
                                        </>
                                    ) : (
                                        <>
                                            <ImageIcon className="mb-2 h-8 w-8 opacity-50" />
                                            <span className="text-sm font-medium">Upload or Drag Image</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>

                        {/* Scheduling */}
                        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                            <div className="flex items-center gap-3">
                                <Clock className="h-5 w-5 text-slate-400" />
                                <div className="flex-1">
                                    <label className="block text-sm font-semibold text-slate-700">Schedule for later</label>
                                    <p className="text-xs text-slate-500">Choose a date and time to publish automatically</p>
                                </div>
                                <input
                                    type="datetime-local"
                                    value={scheduleDate}
                                    onChange={(e) => setScheduleDate(e.target.value)}
                                    min={new Date().toISOString().slice(0, 16)}
                                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#3fa9f5] focus:outline-none"
                                />
                            </div>
                        </div>

                    </div>
                </div>

                {/* 3. Preview (40%) */}
                <div className="flex-1 min-w-[400px] bg-slate-100 p-8 flex items-center justify-center">
                    <div className="w-full max-w-[500px] rounded-xl border border-slate-200 bg-white shadow-sm">
                        {/* Preview Header */}
                        <div className="flex items-center gap-3 border-b border-slate-100 p-4">
                            <div className="h-10 w-10 rounded-full bg-slate-200" /> {/* Avatar placeholder */}
                            <div>
                                <div className="h-4 w-24 rounded bg-slate-200" />
                                <div className="mt-1 h-3 w-16 rounded bg-slate-100" />
                            </div>
                            <div className="ml-auto text-slate-300">
                                <MoreVertical className="h-5 w-5" />
                            </div>
                        </div>

                        {/* Preview Body */}
                        <div className="p-4">
                            {caption ? (
                                <div className="whitespace-pre-wrap text-sm text-slate-800">
                                    {caption}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="h-4 w-full rounded bg-slate-100" />
                                    <div className="h-4 w-3/4 rounded bg-slate-100" />
                                </div>
                            )}
                            {hashtags && (
                                <div className="mt-2 text-sm font-medium text-[#0077b5]">
                                    {hashtags}
                                </div>
                            )}
                        </div>

                        {/* Preview Image */}
                        {mediaUrl ? (
                            <div className="bg-slate-50 border-y border-slate-100">
                                <img src={mediaUrl} alt="Preview" className="w-full h-auto block mx-auto max-h-[600px] object-contain" />
                            </div>
                        ) : (
                            <div className="aspect-video w-full bg-slate-50 flex items-center justify-center text-slate-300">
                                <ImageIcon className="h-12 w-12 opacity-20" />
                            </div>
                        )}

                        {/* Preview Footer */}
                        <div className="border-t border-slate-100 px-4 py-3">
                            <div className="flex gap-4 opacity-50">
                                <div className="h-5 w-5 rounded bg-slate-200" />
                                <div className="h-5 w-5 rounded bg-slate-200" />
                                <div className="h-5 w-5 rounded bg-slate-200" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
