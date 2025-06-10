// src/components/notifications/NotificationItem.tsx
import { AlertTriangle, Info, BellRing, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';


export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'alert' | 'reminder' | 'info' | 'success' | 'error';
  timestamp: Date;
  read?: boolean;
}

interface NotificationItemProps {
  notification: Notification;
}

const iconMap = {
  alert: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
  reminder: <BellRing className="h-5 w-5 text-blue-500" />,
  info: <Info className="h-5 w-5 text-sky-500" />,
  success: <CheckCircle className="h-5 w-5 text-green-500" />,
  error: <AlertCircle className="h-5 w-5 text-red-500" />,
};

const typeClasses = {
    alert: "border-yellow-500/50",
    reminder: "border-blue-500/50",
    info: "border-sky-500/50",
    success: "border-green-500/50",
    error: "border-red-500/50",
}

export function NotificationItem({ notification }: NotificationItemProps) {
  return (
    <Card className={cn("overflow-hidden shadow-sm", typeClasses[notification.type], !notification.read && "bg-secondary/50")}>
      <CardHeader className="flex flex-row items-start space-x-3 p-4 pb-2">
        <span className="flex-shrink-0 pt-0.5">{iconMap[notification.type]}</span>
        <div className="flex-grow">
          <CardTitle className="text-sm font-medium font-headline">{notification.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 pl-12"> {/* Align with title */}
        <CardDescription className="text-xs text-muted-foreground">{notification.message}</CardDescription>
        <p className="text-xs text-muted-foreground/80 mt-1">
          {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
        </p>
      </CardContent>
    </Card>
  );
}
