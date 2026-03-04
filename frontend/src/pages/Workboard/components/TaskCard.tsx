import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, Loader2, Users, Clock, AlertCircle } from 'lucide-react';
import type { Post } from '../types';

interface TaskCardProps {
    post: Post;
    onClick?: (post: Post) => void;
    isGenerating?: boolean;
}

export function TaskCard({ post, onClick, isGenerating }: TaskCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: post.id,
        data: {
            type: 'Post',
        }
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        pointerEvents: isGenerating ? 'none' as const : undefined,
    };

    const getDeadlineStatus = (deadline: string | null | undefined) => {
        if (!deadline || deadline === 'Unscheduled' || deadline === 'No date' || deadline === 'Draft') return null;
        const now = new Date();
        const deadlineDate = new Date(deadline);
        if (isNaN(deadlineDate.getTime())) return null;

        const diff = deadlineDate.getTime() - now.getTime();
        const hours = diff / (1000 * 60 * 60);

        if (hours < 0) return 'overdue';
        if (hours <= 24) return 'high';
        return 'safe';
    };

    const deadlineStatus = getDeadlineStatus(post.content_deadline || post.design_deadline || post.postDate);

    const accentColor =
        post.status === 'Approved' ? 'border-l-emerald-500' :
            post.status === 'Revision' ? 'border-l-rose-500' :
                post.status === 'For Review' ? 'border-l-amber-500' :
                    'border-l-indigo-500';

    const deadlineClasses =
        deadlineStatus === 'overdue' ? 'bg-rose-100/60 text-rose-700 border-rose-200 shadow-sm shadow-rose-100 ring-1 ring-rose-200/30' :
            deadlineStatus === 'high' ? 'bg-amber-100/60 text-amber-700 border-amber-200 shadow-sm shadow-amber-100 ring-1 ring-amber-200/30' :
                deadlineStatus === 'safe' ? 'bg-emerald-100/60 text-emerald-700 border-emerald-200 shadow-sm shadow-emerald-100 ring-1 ring-emerald-200/30' :
                    'bg-slate-50 text-slate-400 border-slate-100';

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...(isGenerating ? {} : listeners)}
            className={`relative bg-white rounded-xl shadow-sm border border-slate-100 border-l-4 ${accentColor} hover:shadow-md hover:border-l-indigo-400 transition-all group overflow-hidden ${isGenerating ? 'cursor-wait' : 'cursor-pointer'}`}
            onClick={() => !isGenerating && onClick?.(post)}
        >
            {/* Generating overlay */}
            {isGenerating && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center gap-2 rounded-xl">
                    <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Generating...</span>
                </div>
            )}
            {/* Image thumbnail — shown when image exists */}
            {post.imageUrl && (
                <div className="w-full h-32 overflow-hidden bg-slate-100">
                    <img
                        src={post.imageUrl}
                        alt="Post visual"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                </div>
            )}

            <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                        {post.brandName || 'Unassigned'}
                    </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors line-clamp-2">
                    {post.cardName || post.theme || 'Untitled Post'}
                </h3>

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                        {post.tags.map(tag => (
                            <span
                                key={tag.id}
                                className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter border shadow-sm"
                                style={{
                                    color: tag.color,
                                    borderColor: `${tag.color}30`,
                                    backgroundColor: `${tag.color}10`
                                }}
                            >
                                {tag.name}
                            </span>
                        ))}
                    </div>
                )}

                <p className="text-[10px] font-medium text-slate-500 mb-3 px-1.5 py-0.5 bg-slate-50 rounded inline-block">
                    {post.contentType}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                    <div className="flex items-center gap-3">
                        {post.postDate && post.postDate !== 'Draft' ? (
                            <div className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg border ${deadlineClasses}`}>
                                {deadlineStatus === 'overdue' ? <AlertCircle size={9} /> : <Clock size={9} />}
                                {post.postDate}
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-slate-300 px-1">
                                <Calendar size={9} />
                                <span>Draft</span>
                            </div>
                        )}

                        {post.collaborators && post.collaborators.length > 0 && (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg">
                                <Users size={10} className="text-slate-400" />
                                <div className="flex -space-x-1.5 overflow-hidden">
                                    {post.collaborators.slice(0, 3).map((c) => (
                                        <div
                                            key={c.id}
                                            className="inline-block h-5 w-5 rounded-full ring-2 ring-white bg-indigo-500 flex items-center justify-center text-[8px] font-black text-white uppercase shadow-sm"
                                            title={c.email}
                                        >
                                            {c.email?.substring(0, 1) || '?'}
                                        </div>
                                    ))}
                                    {post.collaborators.length > 3 && (
                                        <div className="flex items-center justify-center h-5 w-5 rounded-full ring-2 ring-white bg-slate-100 text-[8px] font-bold text-slate-500 shadow-sm">
                                            +{post.collaborators.length - 3}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
