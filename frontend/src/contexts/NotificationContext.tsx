import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useLocation } from 'react-router-dom';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
    id: string;
    title: string;
    message?: string;
    type: NotificationType;
    link?: string;
    read: boolean;
    created_at: string;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const location = useLocation();

    const fetchNotifications = async () => {
        if (!supabase) return;

        // Get current user
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Error fetching notifications:', error);
            return;
        }

        setNotifications(data || []);
    };

    const markAsRead = async (id: string) => {
        if (!supabase) return;

        // Optimistic update
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );

        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', id);

        if (error) {
            console.error('Error marking notification as read:', error);
            // Revert on error could be implemented here
        }
    };

    const markAllAsRead = async () => {
        if (!supabase) return;

        // Optimistic update
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));

        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', session.user.id)
            .eq('read', false);

        if (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    useEffect(() => {
        fetchNotifications();

        if (!supabase) return;

        const channel = supabase
            .channel('public:notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                },
                (payload) => {
                    // Only add if it belongs to current user (though RLS should handle fetching, 
                    // realtime subscription filters might be needed if not using "postgres_changes" with filter)
                    // Ideally we check if payload.new.user_id matches current user, or rely on RLS if using "postgres_changes"
                    // Note: "postgres_changes" receives all changes unless filtered. 
                    // Easier way: fetch fresh list on insert to be safe and simple, or append if we are sure.
                    // Let's just refetch for simplicity and correctness with RLS policies.
                    fetchNotifications();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Re-fetch when location changes (optional, but good for keeping fresh)
    useEffect(() => {
        fetchNotifications();
    }, [location.pathname]);

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            markAsRead,
            markAllAsRead,
            refreshNotifications: fetchNotifications
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}
