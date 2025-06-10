// src/components/notifications/NotificationCenter.tsx
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NotificationItem, type Notification } from './NotificationItem';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
}

export function NotificationCenter({ isOpen, onClose, notifications }: NotificationCenterProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col">
        <SheetHeader className="pb-4">
          <SheetTitle className="font-headline">Notifications</SheetTitle>
          <SheetDescription>
            Recent alerts and updates from your ThermoAI system.
          </SheetDescription>
        </SheetHeader>
        {notifications.length > 0 ? (
          <ScrollArea className="flex-grow pr-6 -mr-6"> {/* Added padding for scrollbar */}
            <div className="space-y-3 ">
              {notifications.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} />
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex-grow flex items-center justify-center text-muted-foreground">
            No new notifications.
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
