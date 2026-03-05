import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { KanbanColumn, Post } from '../types';
import { TaskCard } from './TaskCard';
import { GripVertical, Lock } from 'lucide-react';

interface ColumnProps {
    column: KanbanColumn;
    posts: Post[];
    onCardClick?: (post: Post) => void;
    generatingPostIds?: Set<string>;
    onRename?: (columnId: string, newTitle: string) => void;
    onColorChange?: (columnId: string, newColor: string) => void;
    onDeletePost?: (postId: string, e: React.MouseEvent) => void;
    onCardDelete?: (postId: string, e: React.MouseEvent) => void;
    isLocked?: boolean;
}

export function Column({ column, posts, onCardClick, generatingPostIds, onRename, onColorChange, onDeletePost, onCardDelete, isLocked }: ColumnProps) {
    const [isEditing, setIsEditing] = React.useState(false);
    const [isEditingColor, setIsEditingColor] = React.useState(false);
    const [title, setTitle] = React.useState(column.title);

    // Make the column itself sortable (for column reordering)
    const {
        attributes,
        listeners,
        setNodeRef: setSortableRef,
        transform,
        transition,
        isDragging: isColumnDragging,
    } = useSortable({
        id: column.id,
        data: { type: 'Column', column },
        disabled: isEditing,
    });

    // Also make it droppable for cards
    const { setNodeRef: setDropRef } = useDroppable({
        id: column.id,
        data: { type: 'Column', column },
    });

    const columnStyle = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isColumnDragging ? 0.4 : 1,
    };

    return (
        <div
            ref={setSortableRef}
            style={columnStyle}
            className="w-[280px] min-w-[280px] max-w-[280px] flex flex-col shrink-0 h-full max-h-full"
        >
            {/* Column Header — drag handle for column reordering */}
            <div className="flex items-center justify-between px-2 pb-3 shrink-0 group/header">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div
                        {...attributes}
                        {...listeners}
                        className="cursor-grab active:cursor-grabbing p-1 -ml-1 hover:bg-slate-100 rounded transition-colors"
                    >
                        <GripVertical size={14} className="text-slate-300 group-hover/header:text-slate-400" />
                    </div>
                    <div className="relative group/color">
                        <button
                            onClick={() => setIsEditingColor(!isEditingColor)}
                            className="w-2 h-2 rounded-full shrink-0 transition-transform hover:scale-150"
                            style={{ backgroundColor: column.color || '#94a3b8' }}
                        />
                        {isEditingColor && (
                            <div className="absolute left-0 top-full mt-2 z-50 p-2 bg-white border border-slate-200 shadow-xl rounded-xl flex gap-1.5 animate-in fade-in zoom-in-95 duration-150">
                                {['#6366f1', '#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#64748b', '#1e293b'].map(c => (
                                    <button
                                        key={c}
                                        onClick={() => {
                                            onColorChange?.(column.id, c);
                                            setIsEditingColor(false);
                                        }}
                                        className={`w-3 h-3 rounded-full border ${column.color === c ? 'border-slate-900 border-2' : 'border-transparent'}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                    {isEditing ? (
                        <input
                            autoFocus
                            className="flex-1 bg-white border border-blue-400 rounded px-2 py-0.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 min-w-0"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={() => {
                                setIsEditing(false);
                                if (title.trim() && title !== column.title) {
                                    onRename?.(column.id, title.trim());
                                } else {
                                    setTitle(column.title);
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.currentTarget.blur();
                                } else if (e.key === 'Escape') {
                                    setTitle(column.title);
                                    setIsEditing(false);
                                }
                            }}
                        />
                    ) : (
                        <h2
                            onClick={() => setIsEditing(true)}
                            className="font-bold text-slate-700 truncate cursor-text hover:text-blue-600 transition-colors flex items-center gap-1.5"
                        >
                            {column.title}
                            {isLocked && <Lock size={12} className="text-amber-500 fill-amber-500/10" />}
                        </h2>
                    )}
                    <span className="bg-slate-200 text-slate-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase shrink-0">
                        {posts.length}
                    </span>
                </div>
            </div>

            {/* Column Content — scrollable droppable area */}
            <div
                ref={setDropRef}
                className="flex-1 min-h-[600px] overflow-y-auto bg-slate-100/50 rounded-2xl p-2 border-2 border-dashed border-transparent hover:border-slate-200 transition-all"
            >
                <SortableContext items={posts.map(p => p.id)} strategy={verticalListSortingStrategy}>
                    <div className="flex flex-col gap-3">
                        {posts.map((post) => (
                            <TaskCard
                                key={post.id}
                                post={post}
                                onClick={onCardClick}
                                onDelete={onDeletePost || onCardDelete}
                                isGenerating={generatingPostIds?.has(post.id)}
                                statusColor={column.color}
                            />
                        ))}
                        {posts.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-40 text-center px-4">
                                <p className="text-xs font-semibold text-slate-400">No posts in {column.title}</p>
                            </div>
                        )}
                    </div>
                </SortableContext>
            </div>
        </div>
    );
}
