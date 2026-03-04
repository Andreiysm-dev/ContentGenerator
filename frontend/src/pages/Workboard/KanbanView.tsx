
import React, { useState, useEffect } from 'react';
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
    closestCorners,
    closestCenter,
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent, DragOverEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { Loader2 } from 'lucide-react';
import { SOKMED_COLUMNS } from '../Workboard/types';
import type { KanbanColumn, Post, SokMedStatus } from '../Workboard/types';
import { Column } from '../Workboard/components/Column';
import { TaskCard } from '../Workboard/components/TaskCard';
import { createPortal } from 'react-dom';

interface KanbanViewProps {
    posts: Post[];
    loading?: boolean;
    onStatusChange: (postId: string, newStatus: string) => Promise<void>;
    onColumnReorder?: (columns: KanbanColumn[]) => void;
    onCardClick?: (post: Post) => void;
    columns?: KanbanColumn[];
    onColumnRename?: (columnId: string, newTitle: string) => void;
    automations?: any[];
    userPermissions?: any;
}

export function KanbanView({
    posts: initialPosts,
    loading,
    onStatusChange,
    onColumnReorder,
    onCardClick,
    columns: initialColumns = SOKMED_COLUMNS,
    onColumnRename,
    automations = [],
    userPermissions = {}
}: KanbanViewProps) {
    const [columns, setColumns] = useState<KanbanColumn[]>(initialColumns);
    const [posts, setPosts] = useState<Post[]>(initialPosts);
    const [activePost, setActivePost] = useState<Post | null>(null);
    const [activeColumn, setActiveColumn] = useState<KanbanColumn | null>(null);

    useEffect(() => {
        setPosts(initialPosts);
    }, [initialPosts]);

    useEffect(() => {
        setColumns(initialColumns);
    }, [initialColumns]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const checkIsLocked = (status: string) => {
        if (userPermissions?.isOwner) return false;
        const lockRule = automations?.find(a => a.type === 'access_rule' && a.columnId === status);
        if (lockRule) {
            return userPermissions?.roleName !== lockRule.roleName;
        }
        return false;
    };

    const onDragStart = (event: DragStartEvent) => {
        if (event.active.data.current?.type === 'Post') {
            setActivePost(event.active.data.current.post);
            setActiveColumn(null);
        } else if (event.active.data.current?.type === 'Column') {
            setActiveColumn(event.active.data.current.column);
            setActivePost(null);
        }
    };

    const onDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        if (activeId === overId) return;

        const isActiveTask = active.data.current?.type === 'Post';
        const isOverTask = over.data.current?.type === 'Post';
        const isOverColumn = over.data.current?.type === 'Column';

        if (!isActiveTask) return;

        const activeTask = posts.find(p => p.id === activeId);
        if (activeTask && checkIsLocked(activeTask.status)) return;

        // Dropping over another task
        if (isActiveTask && isOverTask) {
            setPosts((tasks) => {
                const activeIndex = tasks.findIndex((t) => t.id === activeId);
                const overIndex = tasks.findIndex((t) => t.id === overId);

                if (tasks[activeIndex].status !== tasks[overIndex].status) {
                    const newTasks = [...tasks];
                    newTasks[activeIndex].status = tasks[overIndex].status;
                    return arrayMove(newTasks, activeIndex, overIndex);
                }

                return arrayMove(tasks, activeIndex, overIndex);
            });
        }

        // Dropping over a column
        if (isActiveTask && isOverColumn) {
            setPosts((tasks) => {
                const activeIndex = tasks.findIndex((t) => t.id === activeId);
                const newTasks = [...tasks];
                newTasks[activeIndex].status = overId as SokMedStatus;
                return arrayMove(newTasks, activeIndex, activeIndex);
            });
        }
    };

    const onDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        setActivePost(null);
        setActiveColumn(null);

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        // Column reordering
        if (active.data.current?.type === 'Column' && over.data.current?.type === 'Column') {
            if (activeId !== overId) {
                setColumns((cols) => {
                    const oldIndex = cols.findIndex((c) => c.id === activeId);
                    const newIndex = cols.findIndex((c) => c.id === overId);
                    const newCols = arrayMove(cols, oldIndex, newIndex);
                    onColumnReorder?.(newCols);
                    return newCols;
                });
            }
            return;
        }

        // Card status update
        if (active.data.current?.type === 'Post') {
            const movedPost = posts.find((p) => p.id === activeId);
            if (movedPost && movedPost.status !== (activePost?.status as string)) {
                if (activePost && checkIsLocked(activePost.status as string)) {
                    // Revert if somehow it passed over
                    setPosts(initialPosts);
                    return;
                }
                onStatusChange(activeId, movedPost.status);
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                <span className="ml-3 text-slate-500 font-bold uppercase tracking-widest text-xs">Synchronizing Board...</span>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-x-auto p-6 h-full">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
            >
                {/* Wrap columns in SortableContext for column drag-reorder */}
                <SortableContext items={columns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
                    <div className="inline-flex items-stretch gap-6 h-full min-w-full pb-4">
                        {columns.map((column) => (
                            <Column
                                key={column.id}
                                column={column}
                                posts={posts.filter(p => p.status === column.id)}
                                onCardClick={onCardClick}
                                onRename={onColumnRename}
                                isLocked={automations?.some(a => a.type === 'access_rule' && a.columnId === column.id)}
                            />
                        ))}
                    </div>
                </SortableContext>

                {createPortal(
                    <DragOverlay>
                        {activePost && <TaskCard post={activePost} />}
                        {activeColumn && (
                            <div className="w-80 bg-slate-100 rounded-2xl p-4 opacity-80 border-2 border-slate-300 shadow-2xl">
                                <div className="font-bold text-slate-700">{activeColumn.title}</div>
                            </div>
                        )}
                    </DragOverlay>,
                    document.body
                )}
            </DndContext>
        </div>
    );

}
