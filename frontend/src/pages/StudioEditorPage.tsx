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
    Plus,
    FileText,
    Eye
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
                            accountId: account.id,
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
        <main className="flex h-screen flex-col bg-slate-50/50">
            {/* Header */}
            <header className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 border-b border-slate-700 px-6 py-2 relative overflow-hidden shrink-0">
                <FileText className="absolute top-1 right-8 text-blue-400/5 w-16 h-16 rotate-12 pointer-events-none" />

                <div className="flex items-center justify-between gap-4 relative z-10">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(`/company/${encodeURIComponent(activeCompanyId || '')}/studio`)}
                            className="p-1.5 rounded-lg bg-white/5 text-white/70 border border-white/10 hover:bg-white/15 transition-all"
                            title="Back to Studio"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                        </button>

                        <div className="flex items-center gap-3">
                            <span className="text-[18px] !text-[18px] font-bold text-white/90 tracking-wider">
                                {contentId ? 'Refining Post' : 'New Post'}
                            </span>
                            <div className="h-3 w-px bg-white/10" />
                            <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter border ${status === 'PUBLISHED' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/10' :
                                status === 'SCHEDULED' ? 'bg-amber-500/20 text-amber-400 border-amber-500/10' :
                                    'bg-white/5 text-white/40 border-white/5'
                                }`}>
                                {status.toLowerCase()}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">

                        {scheduleDate ? (
                            <button
                                onClick={() => handleSave('SCHEDULED')}
                                disabled={isSaving}
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-all disabled:opacity-50"
                            >
                                <Calendar className="h-3.5 w-3.5" />
                                Schedule Post
                            </button>
                        ) : (
                            <button
                                onClick={handlePublish}
                                disabled={isSaving}
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-all disabled:opacity-50"
                            >
                                <Send className="h-3.5 w-3.5" />
                                Post Now
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden">

                {/* Left: Editor (60%) */}
                <div className="flex-[3] min-w-[500px] overflow-y-auto bg-white border-r border-slate-200 p-8 pt-6">
                    <div className="max-w-3xl mx-auto space-y-10">

                        {/* 1. Account Selection */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Publish Destinations</h3>
                                    <p className="text-xs text-slate-500">Select the accounts where this post will go live.</p>
                                </div>
                                <button
                                    onClick={() => navigate(`/company/${encodeURIComponent(activeCompanyId || '')}/settings/integrations`)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                                >
                                    Manage Accounts
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                {connectedAccounts.length === 0 ? (
                                    <button
                                        onClick={() => navigate(`/company/${encodeURIComponent(activeCompanyId || '')}/settings/integrations`)}
                                        className="w-full group flex flex-col items-center justify-center gap-3 rounded-[1.5rem] border-2 border-dashed border-slate-200 p-8 text-center transition-all hover:border-blue-400/50 hover:bg-blue-50/50"
                                    >
                                        <div className="p-3 bg-slate-100 rounded-2xl group-hover:bg-blue-100 transition-colors">
                                            <Plus className="h-6 w-6 text-slate-400 group-hover:text-blue-500" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-900">No accounts connected</div>
                                            <p className="text-xs text-slate-500 mt-1">Visit settings to link your LinkedIn or Facebook pages.</p>
                                        </div>
                                    </button>
                                ) : (
                                    connectedAccounts.map((account) => {
                                        const isSelected = selectedAccountIds.includes(account.id);
                                        const providerColor = account.provider === 'linkedin' ? '#0077b5' : '#1877F2';

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
                                                className={`flex items-center gap-4 rounded-2xl border-2 p-4 text-sm transition-all duration-300 ${isSelected
                                                    ? 'border-blue-500 bg-blue-50/50 shadow-md shadow-blue-500/10'
                                                    : 'border-slate-100 hover:border-slate-200 bg-white text-slate-600'
                                                    }`}
                                            >
                                                <div className={`p-2 rounded-xl ${isSelected ? 'bg-white shadow-sm' : 'bg-slate-50'}`} style={{ color: isSelected ? providerColor : '#94a3b8' }}>
                                                    {account.provider === 'linkedin' && (
                                                        <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                                                    )}
                                                    {account.provider === 'facebook' && (
                                                        <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                                                    )}
                                                </div>
                                                <div className="text-left">
                                                    <div className="text-[10px] uppercase tracking-widest font-black opacity-40">{account.provider}</div>
                                                    <div className="font-bold text-slate-800 truncate max-w-[120px]">{account.profile_name || 'Account'}</div>
                                                </div>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* 2. Content Sections */}
                        <div className="grid grid-cols-1 gap-8">
                            {/* Caption */}
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-slate-900 uppercase tracking-widest">Post Narrative</label>
                                <div className="relative group">
                                    <textarea
                                        value={caption}
                                        onChange={(e) => setCaption(e.target.value)}
                                        placeholder="The voice of your brand starts here..."
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/30 p-5 text-sm leading-relaxed placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                                        rows={10}
                                    />
                                    <div className="absolute bottom-4 right-4 text-[10px] font-bold text-slate-400 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-lg border border-slate-100">
                                        {caption.length} Characters
                                    </div>
                                </div>
                            </div>

                            {/* Hashtags */}
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-slate-900 uppercase tracking-widest">Strategic Hashtags</label>
                                <textarea
                                    value={hashtags}
                                    onChange={(e) => setHashtags(e.target.value)}
                                    placeholder="#growth #strategy #insights"
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/30 p-5 text-sm font-medium text-blue-600 leading-relaxed placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                                    rows={3}
                                />
                            </div>

                            {/* Media Section */}
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-slate-900 uppercase tracking-widest">Visual Asset</label>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageUpload}
                                    accept="image/*"
                                    className="hidden"
                                />
                                {mediaUrl ? (
                                    <div className="relative group rounded-3xl overflow-hidden border-2 border-slate-100 shadow-sm">
                                        <img src={mediaUrl} alt="Post asset" className="w-full h-72 object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-3">
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="p-3 bg-white rounded-2xl text-slate-900 hover:bg-blue-50 hover:text-blue-600 transition-all shadow-xl"
                                                title="Change Image"
                                            >
                                                <ImageIcon className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => setMediaUrl(null)}
                                                className="p-3 bg-white rounded-2xl text-slate-900 hover:bg-rose-50 hover:text-rose-600 transition-all shadow-xl"
                                                title="Remove Image"
                                            >
                                                <AlertCircle className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading}
                                        className="w-full group h-48 flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 transition-all hover:border-blue-500/40 hover:bg-blue-50/50 disabled:opacity-50"
                                    >
                                        {isUploading ? (
                                            <>
                                                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                                                <span className="text-sm font-bold text-blue-500">Processing media...</span>
                                            </>
                                        ) : (
                                            <>
                                                <div className="p-4 bg-white rounded-2xl shadow-sm text-slate-400 group-hover:text-blue-500 group-hover:shadow-md transition-all">
                                                    <ImageIcon className="h-8 w-8" />
                                                </div>
                                                <div className="text-center">
                                                    <span className="text-sm font-bold text-slate-900 block">Upload Visual</span>
                                                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">Support: JPG, PNG, WEBP</span>
                                                </div>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>

                            {/* Scheduling Section */}
                            <div className="bg-slate-900 rounded-3xl p-6 text-white overflow-hidden relative group">
                                <Clock className="absolute top-1/2 -right-4 -translate-y-1/2 h-40 w-40 text-white/5 rotate-12 group-hover:rotate-0 transition-transform duration-700" />

                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                                    <div>
                                        <h3 className="text-lg font-black tracking-tight">Time-Travel Engine</h3>
                                        <p className="text-sm text-slate-400 mt-1">Set your publication pulse. Precise automation awaits.</p>
                                    </div>

                                    <div className="relative">
                                        <input
                                            type="datetime-local"
                                            value={scheduleDate}
                                            onChange={(e) => setScheduleDate(e.target.value)}
                                            min={new Date().toISOString().slice(0, 16)}
                                            className="w-full md:w-auto bg-white/10 hover:bg-white/15 border border-white/20 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-white/30"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Live Preview (40%) */}
                <div className="flex-[2] bg-slate-50 flex items-center justify-center p-12 overflow-y-auto">
                    <div className="w-full max-w-md">
                        <div className="flex items-center gap-2 mb-6 px-1">
                            <Eye className="h-4 w-4 text-blue-500" />
                            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Real-Time Simulation</span>
                        </div>

                        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl shadow-slate-200 overflow-hidden group">
                            {/* Preview Header */}
                            <div className="p-5 flex items-center gap-4 border-b border-slate-50">
                                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20" />
                                <div className="flex-1">
                                    <div className="h-4 w-32 rounded-lg bg-slate-100 mb-2" />
                                    <div className="h-3 w-20 rounded-lg bg-slate-50" />
                                </div>
                                <MoreVertical className="h-5 w-5 text-slate-300" />
                            </div>

                            <div className="p-6">
                                {caption ? (
                                    <div className="whitespace-pre-wrap text-sm text-slate-800 leading-relaxed font-medium">
                                        {caption}
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="h-3 w-full rounded bg-slate-50" />
                                        <div className="h-3 w-11/12 rounded bg-slate-50" />
                                        <div className="h-3 w-4/5 rounded bg-slate-50" />
                                    </div>
                                )}

                                {hashtags && (
                                    <div className="mt-4 text-sm font-bold text-blue-600 tracking-tight">
                                        {hashtags}
                                    </div>
                                )}
                            </div>

                            {mediaUrl ? (
                                <div className="mx-2 mb-2 rounded-[1.5rem] overflow-hidden border border-slate-100">
                                    <img src={mediaUrl} alt="Visual preview" className="w-full h-auto object-cover max-h-[400px]" />
                                </div>
                            ) : (
                                <div className="mx-2 mb-2 rounded-[1.5rem] bg-slate-50 aspect-video flex items-center justify-center border border-dashed border-slate-200 text-slate-300">
                                    <ImageIcon className="h-8 w-8 opacity-20" />
                                </div>
                            )}

                            <div className="p-5 flex items-center justify-between border-t border-slate-50 mt-2">
                                <div className="flex gap-6">
                                    <div className="h-4 w-4 rounded-full bg-slate-100" />
                                    <div className="h-4 w-4 rounded-full bg-slate-100" />
                                    <div className="h-4 w-4 rounded-full bg-slate-100" />
                                </div>
                                <div className="h-4 w-4 rounded-full bg-slate-100" />
                            </div>
                        </div>

                        <div className="mt-8 text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-loose">
                                Visual simulation of the final audience experience.<br />
                                Renders may vary slightly by platform.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
