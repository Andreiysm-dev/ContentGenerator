import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Image as ImageIcon,
    AlertCircle,
    Calendar,
    Send,
    Save,
    MoreVertical,
    Clock,
    CheckCircle2,
    Loader2,
    Check,
    ChevronLeft,
    ChevronRight,
    Trash2,
    Plus,
    FileText,
    Eye,
    Globe,
    Layers,
    SendHorizontal
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { DateTimePicker } from '../components/DateTimePicker';
interface StudioEditorPageProps {
    activeCompanyId?: string;
    activeCompany?: any;
    backendBaseUrl: string;
    authedFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
    notify: (message: string, tone?: 'success' | 'error' | 'info') => void;
    getImageGeneratedUrl?: (row: any) => string | null;
    setIsImageModalOpen: (open: boolean) => void;
    setSelectedRow: (row: any) => void;
    selectedRow: any;
}

export function StudioEditorPage({
    activeCompanyId,
    activeCompany,
    backendBaseUrl,
    authedFetch,
    notify,
    getImageGeneratedUrl,
    setIsImageModalOpen,
    setSelectedRow,
    selectedRow: globalSelectedRow
}: StudioEditorPageProps) {
    const { companyId, contentId } = useParams();
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const getStatusValue = (s: any) => {
        if (!s) return 'DRAFT';
        if (typeof s === 'string') return s;
        if (typeof s === 'object' && (s.id || s.title)) return s.id || s.title;
        return 'DRAFT';
    };

    const [caption, setCaption] = useState('');
    const [hashtags, setHashtags] = useState('');
    const [mediaUrls, setMediaUrls] = useState<string[]>([]);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [platform, setPlatform] = useState<'linkedin' | 'twitter'>('linkedin');
    const [scheduleDate, setScheduleDate] = useState('');
    const [isScheduleEnabled, setIsScheduleEnabled] = useState(false);
    const [status, setStatus] = useState<string>('DRAFT');
    const [targetStatus, setTargetStatus] = useState<string>('DRAFT');
    const [isUploading, setIsUploading] = useState(false);
    const [connectedAccounts, setConnectedAccounts] = useState<any[]>([]);
    const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
    const [remixes, setRemixes] = useState<{ [key: string]: { caption: string, hashtags: string } }>({
        master: { caption: '', hashtags: '' }
    });
    const [activePlatformTab, setActivePlatformTab] = useState('master');
    const [showPostConfirmation, setShowPostConfirmation] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [row, setRow] = useState<any | null>(null);

    // Sync mediaUrl when global selectedRow updates (e.g. from Image Generation Modal)
    useEffect(() => {
        if (globalSelectedRow && globalSelectedRow.contentCalendarId === contentId) {
            const newUrl = getImageGeneratedUrl ? getImageGeneratedUrl(globalSelectedRow) : (globalSelectedRow.imageGenerated || globalSelectedRow.imageGeneratedUrl);
            if (newUrl && !mediaUrls.includes(newUrl)) {
                setMediaUrls(prev => [...prev, newUrl]);
            }
        }
    }, [globalSelectedRow, contentId, mediaUrls, getImageGeneratedUrl]);

    // Keep global selectedRow in sync for modals to work
    useEffect(() => {
        if (row && setSelectedRow) {
            setSelectedRow(row);
        }
    }, [row, setSelectedRow]);

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
                const rowData = data.contentCalendar || data;
                setRow(rowData);
                setCaption(rowData.finalCaption || rowData.captionOutput || '');
                setHashtags(rowData.finalHashtags || rowData.hastagsOutput || '');

                const initialMedia = [];
                if (rowData.media_urls && Array.isArray(rowData.media_urls)) {
                    initialMedia.push(...rowData.media_urls);
                } else {
                    const singleUrl = getImageGeneratedUrl ? getImageGeneratedUrl(rowData) : (rowData.imageGenerated || rowData.imageGeneratedUrl || null);
                    if (singleUrl) initialMedia.push(singleUrl);
                }
                setMediaUrls(initialMedia);

                let fallbackDate = '';
                if (rowData.scheduled_at) {
                    fallbackDate = new Date(rowData.scheduled_at).toISOString().slice(0, 16);
                } else if (rowData.date) {
                    try {
                        const dateParts = rowData.date.split('-');
                        let dateObj: Date;
                        if (dateParts.length === 3) {
                            // YYYY-MM-DD
                            dateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]), 9, 0);
                        } else {
                            dateObj = new Date(rowData.date);
                            if (dateObj.getFullYear() <= 2001 || isNaN(dateObj.getFullYear())) {
                                const parsed = new Date(rowData.date);
                                if (!isNaN(parsed.getTime())) {
                                    dateObj = parsed;
                                    if (dateObj.getFullYear() <= 2001) {
                                        dateObj.setFullYear(new Date().getFullYear());
                                    }
                                } else {
                                    dateObj = new Date();
                                }
                            }
                            dateObj.setHours(9, 0, 0, 0);
                        }

                        const year = dateObj.getFullYear();
                        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                        const day = String(dateObj.getDate()).padStart(2, '0');
                        fallbackDate = `${year}-${month}-${day}T09:00`;
                    } catch (e) {
                        console.warn('Failed to parse rowData.date:', rowData.date);
                    }
                }

                setScheduleDate(fallbackDate);
                const currentStatus = getStatusValue(rowData.status);
                setIsScheduleEnabled(!!rowData.scheduled_at);
                setStatus(currentStatus);
                setTargetStatus(currentStatus);

                // Load selected accounts from channels
                if (rowData.channels) {
                    try {
                        const parsedChannels = Array.isArray(rowData.channels) ? rowData.channels : JSON.parse(rowData.channels);
                        if (Array.isArray(parsedChannels)) {
                            setSelectedAccountIds(parsedChannels);
                        }
                    } catch (e) {
                        // If it's just a comma separated string
                        if (typeof rowData.channels === 'string') {
                            setSelectedAccountIds(rowData.channels.split(',').map((s: string) => s.trim()).filter(Boolean));
                        }
                    }
                }

                // Load remixes from draft_caption
                if (rowData.draft_caption) {
                    try {
                        const parsed = JSON.parse(rowData.draft_caption);
                        if (parsed && typeof parsed === 'object' && parsed.master) {
                            setRemixes(parsed);
                        } else {
                            // Fallback if it's not our JSON format
                            setRemixes({
                                master: {
                                    caption: rowData.finalCaption || rowData.captionOutput || '',
                                    hashtags: rowData.finalHashtags || rowData.hastagsOutput || ''
                                }
                            });
                        }
                    } catch (e) {
                        setRemixes({
                            master: {
                                caption: rowData.finalCaption || rowData.captionOutput || '',
                                hashtags: rowData.finalHashtags || rowData.hastagsOutput || ''
                            }
                        });
                    }
                } else {
                    setRemixes({
                        master: {
                            caption: rowData.finalCaption || rowData.captionOutput || '',
                            hashtags: rowData.finalHashtags || rowData.hastagsOutput || ''
                        }
                    });
                }
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

    const saveContentCalendar = async (newStatus: 'DRAFT' | 'REVIEWED' | 'READY' | 'SCHEDULED' | 'PUBLISHED' | 'For Approval' = 'DRAFT', isPublishing = false): Promise<string | null> => {
        if (!activeCompanyId) return null;
        setIsSaving(true);

        try {
            const payload: any = {
                companyId: activeCompanyId,
                finalCaption: caption,
                captionOutput: caption,
                finalHashtags: hashtags,
                hastagsOutput: hashtags, // Misspelling in DB
                media_urls: mediaUrls,
                imageGenerated: mediaUrls.length > 0 ? mediaUrls[0] : null, // DB column is imageGenerated
                status: newStatus,
                // Only set scheduled_at on the content calendar if NOT using the new system (or for display)
                scheduled_at: (newStatus === 'SCHEDULED' || newStatus === 'For Approval') && isScheduleEnabled && scheduleDate ? new Date(scheduleDate).toISOString() :
                    (newStatus === 'For Approval' && !isScheduleEnabled) ? new Date().toISOString() : null,
                channels: selectedAccountIds, // Save selected accounts
                draft_caption: JSON.stringify(remixes), // Persist remixes here
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

                if (!contentId && !isPublishing && newStatus !== 'SCHEDULED' && newStatus !== 'READY' && newStatus !== 'For Approval') {
                    navigate(`/company/${encodeURIComponent(activeCompanyId || '')}/studio/${savedId}`);
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

    const handleScheduling = async (calendarId: string) => {
        if (!scheduleDate) {
            notify('Please select a date/time to schedule.', 'error');
            return false;
        }
        if (selectedAccountIds.length === 0) {
            notify('Select at least one platform to schedule post.', 'error');
            return false;
        }

        try {
            if (!supabase) throw new Error('Supabase client not initialized');

            // 0. Delete existing PENDING scheduled posts for this calendar row to avoid duplicates on reschedule
            await supabase!
                .from('scheduled_posts')
                .delete()
                .eq('content_calendar_id', calendarId)
                .eq('status', 'PENDING');

            // 1. Upload/Copy Images to 'scheduled-assets' bucket
            let finalMediaUrls: string[] = [];

            for (const mUrl of mediaUrls) {
                try {
                    const response = await fetch(mUrl);
                    const blob = await response.blob();
                    const fileName = `${activeCompanyId}/${calendarId}/${Date.now()}-${Math.random().toString(36).substring(7)}.png`;

                    const { data: uploadData, error: uploadError } = await supabase!.storage
                        .from('scheduled-assets')
                        .upload(fileName, blob);

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase!.storage
                        .from('scheduled-assets')
                        .getPublicUrl(fileName);

                    finalMediaUrls.push(publicUrl);
                } catch (e) {
                    console.warn(`Failed to copy asset ${mUrl} to scheduled bucket, using original URL:`, e);
                    finalMediaUrls.push(mUrl);
                }
            }

            // 2. Create Scheduled Post Entry (One entry regardless of platform count - the backend handles the loop)
            // But wait, the prompt engineer wants per-platform text if remixed.
            // Our new backend schema takes `content` string.
            // To support remixes, we should ideally create ONE scheduled_post PER PLATFORM if content differs.
            // Or update backend to support JSON content.
            // Current backend simple logic: takes `content` string.
            // Strategy: Create MULTIPLE scheduled_posts if remixes exist, one per account group sharing content.

            // Group accounts by unique content
            const postsToCreate: { accountIds: string[], content: string }[] = [];

            // Map content hash to account IDs
            const contentMap = new Map<string, string[]>();

            for (const accId of selectedAccountIds) {
                const remix = remixes[accId];
                // Try specific remix, then master remix, then master state
                const finalCap = remix?.caption || remixes.master?.caption || caption;
                const finalHash = remix?.hashtags || remixes.master?.hashtags || hashtags;
                const fullText = [finalCap, finalHash].filter(Boolean).join('\n\n');

                if (!contentMap.has(fullText)) {
                    contentMap.set(fullText, []);
                }
                contentMap.get(fullText)?.push(accId);
            }

            // Create payload for each unique content version
            for (const [text, accIds] of contentMap.entries()) {
                const { error: insertError } = await supabase!
                    .from('scheduled_posts')
                    .insert({
                        company_id: activeCompanyId,
                        content_calendar_id: calendarId,
                        scheduled_at: new Date(scheduleDate).toISOString(),
                        status: 'PENDING',
                        content: text,
                        media_urls: finalMediaUrls,
                        account_ids: accIds
                    });

                if (insertError) throw insertError;
            }

            setStatus('SCHEDULED');
            notify('Post scheduled successfully!', 'success');
            return true;
        } catch (error: any) {
            console.error('Scheduling error:', error);
            notify(`Scheduling failed: ${error.message}`, 'error');
            return false;
        }
    };

    const handleSave = async (newStatus: 'DRAFT' | 'REVIEWED' | 'READY' | 'SCHEDULED' | 'PUBLISHED' | 'For Approval' = 'DRAFT', isPublishing = false): Promise<string | null> => {
        // 1. Save Content Board Draft first
        // If create mode, this gets us the ID.
        const effectiveStatus = newStatus === 'SCHEDULED' ? 'SCHEDULED' : newStatus;
        const savedId = await saveContentCalendar(effectiveStatus, isPublishing || newStatus === 'SCHEDULED' || newStatus === 'PUBLISHED');

        if (!savedId) return null;

        // 2. If Scheduling, Trigger New Logic
        if (newStatus === 'SCHEDULED') {
            setIsSaving(true); // Re-enable loading state
            const success = await handleScheduling(savedId);
            setIsSaving(false);
            if (!success) {
                // Revert status if scheduling failed? Optional.
                return null;
            }
        }

        if (newStatus === 'For Approval') {
            notify('Post sent for supervisor review', 'info');
            navigate(`/company/${encodeURIComponent(activeCompanyId || '')}/studio`, { state: { activeTab: 'approvals' } });
        } else if (newStatus === 'SCHEDULED') {
            navigate(`/company/${encodeURIComponent(activeCompanyId || '')}/studio`, { state: { activeTab: 'scheduled' } });
        } else {
            notify(contentId ? 'Saved changes' : 'Created new post', 'success');
        }

        return savedId;
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
        const files = Array.from(e.target.files || []);
        if (files.length === 0 || !activeCompanyId) return;

        setIsUploading(true);
        let successCount = 0;

        try {
            if (!supabase) throw new Error('Supabase client not initialized');

            for (const file of files) {
                // Limit file size to 50MB
                if (file.size > 50 * 1024 * 1024) {
                    notify(`File ${file.name} is too large. Maximum size is 50MB.`, 'error');
                    continue;
                }

                try {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${activeCompanyId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                    const filePath = `generated-images/${fileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('generated-images')
                        .upload(fileName, file);

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                        .from('generated-images')
                        .getPublicUrl(fileName);

                    setMediaUrls(prev => [...prev, publicUrl]);
                    successCount++;
                } catch (err: any) {
                    console.error('Upload error for file:', file.name, err);
                    notify(`Failed to upload ${file.name}: ${err.message}`, 'error');
                }
            }

            if (successCount > 0) {
                notify(`${successCount} item(s) uploaded successfully`, 'success');
            }
        } catch (error: any) {
            console.error('Global upload error:', error);
            notify('An unexpected error occurred during upload.', 'error');
        } finally {
            setIsUploading(false);
            if (e.target) e.target.value = ''; // Clear for re-selection
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
                                text: (() => {
                                    const remix = remixes[accountId];
                                    const finalCap = remix?.caption || remixes.master?.caption || caption;
                                    const finalHash = remix?.hashtags || remixes.master?.hashtags || hashtags;
                                    return [finalCap, finalHash].filter(Boolean).join('\n\n');
                                })(),
                                media_urls: mediaUrls
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
                navigate(`/company/${encodeURIComponent(activeCompanyId || '')}/studio`, { state: { activeTab: 'published' } });
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
        <main className="flex h-screen flex-col bg-slate-50/50 p-6 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-[10%] right-[-5%] w-[40%] h-[40%] bg-gradient-to-br from-[#3fa9f5]/10 to-transparent rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-gradient-to-tr from-[#a78bfa]/8 to-transparent rounded-full blur-[100px] pointer-events-none" />

            <section className="flex-1 bg-white border border-slate-200/60 rounded-3xl shadow-2xl shadow-slate-200/50 overflow-hidden flex flex-col relative z-10 max-w-[1800px] mx-auto w-full">
                {/* Unified Header */}
                <header className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 px-10 py-4 flex items-center justify-between border-b border-slate-700 shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(`/company/${encodeURIComponent(activeCompanyId || '')}/studio`)}
                            className="p-2 rounded-xl bg-white/5 text-white/70 border border-white/10 hover:bg-white/15 transition-all group"
                            title="Back to Studio"
                        >
                            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                        <div className="flex flex-col gap-1">
                            <span className={`w-fit px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusValue(status).toUpperCase() === 'PUBLISHED' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/10' :
                                String(getStatusValue(status) || '').toUpperCase() === 'SCHEDULED' ? 'bg-amber-500/20 text-amber-400 border-amber-500/10' :
                                    'bg-white/10 text-white/50 border-white/10 shadow-sm'
                                }`}>
                                {String(getStatusValue(status) || '').toLowerCase()}
                            </span>
                            <div className="flex items-center gap-3">
                                <h1 className="text-[24px] font-black text-white tracking-widest uppercase">
                                    {contentId ? 'Studio Editor' : 'New Post'}
                                </h1>
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-60 italic">Refining and polishing your AI-generated brand content</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Status Selection / Save Setup */}
                        <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/10">
                            <span className="text-[9px] font-black uppercase tracking-widest text-[#3fa9f5]">Save To:</span>
                            <select
                                value={targetStatus}
                                onChange={(e) => setTargetStatus(e.target.value)}
                                className="bg-transparent border-none text-[11px] font-bold text-white/90 focus:ring-0 outline-none cursor-pointer"
                            >
                                {activeCompany?.kanban_settings?.columns ? (
                                    activeCompany.kanban_settings.columns.map((col: any) => (
                                        <option key={col.id} value={col.id} className="bg-slate-900">{col.title}</option>
                                    ))
                                ) : (
                                    <>
                                        <option value="DRAFT" className="bg-slate-900">Draft</option>
                                        <option value="For Approval" className="bg-slate-900">For Approval</option>
                                        <option value="READY" className="bg-slate-900">Ready</option>
                                    </>
                                )}
                            </select>
                            <div className="w-px h-4 bg-white/10 mx-1" />
                            <button
                                onClick={() => handleSave(targetStatus as any)}
                                disabled={isSaving}
                                className="px-3 py-0.5 text-xs font-bold text-white hover:text-[#3fa9f5] transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                <Save className="h-3.5 w-3.5" />
                                Save
                            </button>
                        </div>

                        {/* Scheduling Setup */}
                        <div className="flex items-center gap-4 bg-slate-900/40 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 shadow-2xl group transition-all hover:bg-slate-900/60">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center justify-between gap-4">
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#3fa9f5] flex items-center gap-1.5">
                                        <Clock className="w-3 h-3" />
                                        Scheduling
                                    </span>
                                    <button
                                        onClick={() => {
                                            const newState = !isScheduleEnabled;
                                            setIsScheduleEnabled(newState);
                                            if (newState && !scheduleDate) {
                                                const now = new Date();
                                                now.setHours(9, 0, 0, 0); // Default to 9 AM
                                                const year = now.getFullYear();
                                                const month = String(now.getMonth() + 1).padStart(2, '0');
                                                const day = String(now.getDate()).padStart(2, '0');
                                                setScheduleDate(`${year}-${month}-${day}T09:00`);
                                            }
                                        }}
                                        className={`relative inline-flex h-3.5 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-300 ${isScheduleEnabled ? 'bg-[#3fa9f5]' : 'bg-slate-700'}`}
                                    >
                                        <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition duration-300 ${isScheduleEnabled ? 'translate-x-3.5' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                                <div className={`flex items-center gap-2 transition-all duration-500 ${isScheduleEnabled ? 'opacity-100' : 'opacity-20 grayscale pointer-events-none'}`}>
                                    <DateTimePicker value={scheduleDate} onChange={setScheduleDate} disabled={!isScheduleEnabled} />
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <button
                            onClick={() => isScheduleEnabled ? handleSave('SCHEDULED') : handlePublish()}
                            disabled={isSaving}
                            className={`px-8 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center gap-2.5 shadow-xl ${isScheduleEnabled
                                ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/40'
                                : 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-emerald-900/40'
                                }`}
                            title={selectedAccountIds.length === 0 ? "Select at least one destination to post" : ""}
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : (isScheduleEnabled ? <Calendar className="h-4 w-4" /> : <Send className="h-4 w-4" />)}
                            {isSaving ? 'Processing...' : (isScheduleEnabled ? 'Schedule Post' : 'Post Content')}
                        </button>
                    </div>
                </header>

                {/* Body Content */}
                <div className="flex flex-1 overflow-hidden">
                    <div className="flex-[3] min-w-[500px] overflow-y-auto border-r border-slate-100 p-10 pt-8 scrollbar-hide">
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
                                                        const nextSelected = isSelected
                                                            ? selectedAccountIds.filter(id => id !== account.id)
                                                            : [...selectedAccountIds, account.id];

                                                        setSelectedAccountIds(nextSelected);

                                                        // If we unselected the active platform tab, switch back to master
                                                        if (isSelected && activePlatformTab === account.id) {
                                                            setActivePlatformTab('master');
                                                        }
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

                            {/* 2. Platform Remix Tabs */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Platform Specific Remixes</h3>
                                        <p className="text-xs text-slate-500">Customize your caption for each platform to maximize engagement.</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 p-1.5 bg-slate-100/50 rounded-2xl w-fit">
                                    <button
                                        onClick={() => setActivePlatformTab('master')}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activePlatformTab === 'master'
                                            ? 'bg-white text-slate-900 shadow-sm'
                                            : 'text-slate-400 hover:text-slate-600'
                                            }`}
                                    >
                                        <Globe className="w-3.5 h-3.5" />
                                        Master
                                    </button>
                                    {selectedAccountIds.map(id => {
                                        const account = connectedAccounts.find(a => a.id === id);
                                        if (!account) return null;
                                        const provider = account.provider;
                                        const isActive = activePlatformTab === id;

                                        return (
                                            <button
                                                key={id}
                                                onClick={() => {
                                                    if (!remixes[id]) {
                                                        setRemixes(prev => ({
                                                            ...prev,
                                                            [id]: { ...prev.master }
                                                        }));
                                                    }
                                                    setActivePlatformTab(id);
                                                }}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${isActive
                                                    ? 'bg-white text-slate-900 shadow-sm'
                                                    : 'text-slate-400 hover:text-slate-600'
                                                    }`}
                                            >
                                                <Layers className="w-3.5 h-3.5" />
                                                {account.profile_name || provider}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 3. Content Sections */}
                            <div className="grid grid-cols-1 gap-8">
                                {/* Caption */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-bold text-slate-900 uppercase tracking-widest">
                                            Post Narrative {activePlatformTab !== 'master' && <span className="text-blue-500 font-black ml-1">(Remix)</span>}
                                        </label>
                                        {activePlatformTab !== 'master' && (
                                            <button
                                                onClick={() => {
                                                    setRemixes(prev => ({
                                                        ...prev,
                                                        [activePlatformTab]: { ...prev.master }
                                                    }));
                                                }}
                                                className="text-[10px] font-bold text-blue-500 hover:underline"
                                            >
                                                Reset to Master
                                            </button>
                                        )}
                                    </div>
                                    <div className="relative group">
                                        <textarea
                                            value={activePlatformTab === 'master' ? caption : (remixes[activePlatformTab]?.caption || caption)}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (activePlatformTab === 'master') {
                                                    setCaption(val);
                                                    setRemixes(prev => ({ ...prev, master: { ...prev.master, caption: val } }));
                                                } else {
                                                    setRemixes(prev => ({
                                                        ...prev,
                                                        [activePlatformTab]: { ...prev[activePlatformTab], caption: val }
                                                    }));
                                                }
                                            }}
                                            placeholder="The voice of your brand starts here..."
                                            className="w-full rounded-2xl border border-slate-200 bg-slate-50/30 p-5 text-sm leading-relaxed placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                                            rows={10}
                                        />
                                        <div className="absolute bottom-4 right-4 text-[10px] font-bold text-slate-400 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-lg border border-slate-100">
                                            {(activePlatformTab === 'master' ? caption : (remixes[activePlatformTab]?.caption || caption)).length} Characters
                                        </div>
                                    </div>
                                </div>

                                {/* Hashtags */}
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-slate-900 uppercase tracking-widest">
                                        Strategic Hashtags {activePlatformTab !== 'master' && <span className="text-blue-500 font-black ml-1">(Remix)</span>}
                                    </label>
                                    <textarea
                                        value={activePlatformTab === 'master' ? hashtags : (remixes[activePlatformTab]?.hashtags || hashtags)}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (activePlatformTab === 'master') {
                                                setHashtags(val);
                                                setRemixes(prev => ({ ...prev, master: { ...prev.master, hashtags: val } }));
                                            } else {
                                                setRemixes(prev => ({
                                                    ...prev,
                                                    [activePlatformTab]: { ...prev[activePlatformTab], hashtags: val }
                                                }));
                                            }
                                        }}
                                        placeholder="#growth #strategy #insights"
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/30 p-5 text-sm font-medium text-blue-600 leading-relaxed placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                                        rows={3}
                                    />
                                </div>

                                {/* Media Section */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-bold text-slate-900 uppercase tracking-widest">Visual Asset</label>
                                        <button
                                            onClick={async () => {
                                                // Ensure content is saved before generating image
                                                const savedId = await saveContentCalendar(status as any);
                                                if (savedId) {
                                                    navigate(`/company/${encodeURIComponent(activeCompanyId || '')}/image-hub?id=${savedId}`);
                                                }
                                            }}
                                            className="text-[10px] font-black text-blue-500 hover:text-blue-600 uppercase tracking-widest flex items-center gap-1.5 transition-all bg-blue-50/50 hover:bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100/50"
                                        >
                                            <ImageIcon className="w-3 h-3" />
                                            Generate image with AI
                                        </button>
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleImageUpload}
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                    />
                                    {mediaUrls.length > 0 ? (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                {mediaUrls.map((url, idx) => (
                                                    <div key={idx} className="relative group rounded-2xl overflow-hidden border-2 border-slate-100 shadow-sm aspect-square bg-slate-50">
                                                        <img
                                                            src={url}
                                                            alt={`Post asset ${idx + 1}`}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                console.warn("Media failed to load, keeping entry:", url);
                                                            }}
                                                        />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={() => setMediaUrls(prev => prev.filter((_, i) => i !== idx))}
                                                                className="p-2 bg-white rounded-xl text-rose-600 hover:bg-rose-50 transition-all shadow-lg"
                                                                title="Remove Image"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => window.open(url, '_blank')}
                                                                className="p-2 bg-white rounded-xl text-slate-800 hover:bg-slate-50 transition-all shadow-lg"
                                                                title="View Full"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                        {idx === 0 && (
                                                            <div className="absolute top-2 left-2 px-2 py-0.5 bg-blue-600 text-[8px] font-black text-white rounded-full shadow-lg uppercase tracking-widest">
                                                                Primary
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    disabled={isUploading}
                                                    className="aspect-square flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 transition-all hover:border-blue-500/40 hover:bg-blue-50/50 disabled:opacity-50"
                                                >
                                                    <Plus className="h-6 w-6 text-slate-400" />
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Add more</span>
                                                </button>
                                            </div>
                                            {isUploading && (
                                                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-xl border border-blue-100">
                                                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                                    <span className="text-[10px] font-bold text-blue-600 uppercase">Uploading assets...</span>
                                                </div>
                                            )}
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

                            </div>
                        </div>
                    </div>

                    {/* Right: Live Preview (40%) */}
                    <div className="flex-[2] bg-slate-50 flex flex-col items-center py-16 px-12 overflow-y-auto scrollbar-hide">
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

                                {mediaUrls.length > 0 ? (
                                    <div className="mx-2 mb-2 rounded-[1.5rem] overflow-hidden border border-slate-100 relative group/preview group">
                                        <div className="relative aspect-square sm:aspect-video bg-slate-50">
                                            <img
                                                src={mediaUrls[activeImageIndex]}
                                                alt="Visual preview"
                                                className="w-full h-full object-cover transition-all duration-500"
                                            />

                                            {mediaUrls.length > 1 && (
                                                <>
                                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                                                        {mediaUrls.map((_, i) => (
                                                            <div
                                                                key={i}
                                                                className={`h-1.5 rounded-full transition-all duration-300 ${i === activeImageIndex ? 'w-4 bg-white shadow-md' : 'w-1.5 bg-white/40'}`}
                                                            />
                                                        ))}
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveImageIndex(prev => prev > 0 ? prev - 1 : mediaUrls.length - 1);
                                                        }}
                                                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
                                                    >
                                                        <ChevronLeft className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveImageIndex(prev => prev < mediaUrls.length - 1 ? prev + 1 : 0);
                                                        }}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
                                                    >
                                                        <ChevronRight className="h-4 w-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
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
            </section>
        </main>
    );
}
