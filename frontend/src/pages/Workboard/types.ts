export type SokMedStatus = 'Drafts' | 'To Do' | 'Caption Generated' | 'Design Generated' | 'Revision' | 'For Approval' | 'Approved' | 'Scheduled' | 'Published';

export interface Tag {
    id: string;
    name: string;
    color: string;
}

export interface Collaborator {
    id: string;
    email: string;
    role: string;
}

export interface Post {
    id: string;
    theme: string;
    contentType: string;
    status: SokMedStatus | string;
    postDate: string | null;
    brandName?: string;
    cardName?: string;
    imageUrl?: string;
    content_deadline?: string;
    design_deadline?: string;
    organization_id?: string;
    brand_id?: string;
    kanban_order?: number;
    tags?: Tag[];
    collaborators?: Collaborator[];
    checklist?: any[];
}

export interface KanbanColumn {
    id: string;
    title: string;
    description?: string;
    color?: string;
}

export const SOKMED_COLUMNS: KanbanColumn[] = [
    { id: 'Drafts', title: 'Drafts', color: '#94a3b8' },
    { id: 'To Do', title: 'To Do', color: '#6366f1' },
    { id: 'Caption Generated', title: 'Caption Generated', color: '#3fa9f5' },
    { id: 'Design Generated', title: 'Design Generated', color: '#8b5cf6' },
    { id: 'Revision', title: 'Revision', color: '#f59e0b' },
    { id: 'For Approval', title: 'For Approval', color: '#ec4899' },
    { id: 'Approved', title: 'Approved', color: '#10b981' },
    { id: 'Scheduled', title: 'Scheduled', color: '#0ea5e9' },
    { id: 'Published', title: 'Published', color: '#1e293b' },
];
