import { Bell, Check, Trash2 } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export function NotificationBell() {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const navigate = useNavigate();

    const handleNotificationClick = async (id: string, link?: string) => {
        await markAsRead(id);
        if (link) {
            navigate(link);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className="relative w-8 h-8 flex items-center justify-center rounded-full text-brand-dark/60 hover:text-brand-primary hover:bg-brand-primary/10 transition-colors focus-visible:outline-none"
                    title="Notifications"
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                    )}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-[500px] overflow-y-auto">
                <div className="flex items-center justify-between px-2 py-1.5">
                    <DropdownMenuLabel className="font-semibold text-sm">Notifications</DropdownMenuLabel>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-6 px-2 text-brand-primary hover:text-brand-primary/80"
                            onClick={() => markAllAsRead()}
                        >
                            Mark all read
                        </Button>
                    )}
                </div>
                <DropdownMenuSeparator />

                {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                        No notifications yet.
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {notifications.map((notification) => (
                            <DropdownMenuItem
                                key={notification.id}
                                className={cn(
                                    "flex flex-col items-start gap-1 p-3 cursor-pointer focus:bg-slate-50",
                                    !notification.read && "bg-blue-50/50"
                                )}
                                onSelect={(e) => {
                                    e.preventDefault(); // Keep menu open if needed, or remove to close
                                    handleNotificationClick(notification.id, notification.link);
                                }}
                            >
                                <div className="flex items-start justify-between w-full">
                                    <span className={cn("text-sm font-medium leading-none", !notification.read && "text-brand-dark")}>
                                        {notification.title}
                                    </span>
                                    {!notification.read && (
                                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1" />
                                    )}
                                </div>
                                {notification.message && (
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                        {notification.message}
                                    </p>
                                )}
                                <span className="text-[10px] text-muted-foreground/60 w-full text-right mt-1">
                                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                </span>
                            </DropdownMenuItem>
                        ))}
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
