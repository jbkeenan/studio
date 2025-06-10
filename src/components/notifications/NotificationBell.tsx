// src/components/notifications/NotificationBell.tsx
"use client";

import { useState } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationCenter } from './NotificationCenter';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true); // Mock state for unread notifications

  // Mock notifications - replace with actual data fetching
  const mockNotifications = [
    { id: '1', title: 'High Temperature Alert', message: 'Living Room temperature is 28°C, exceeding the 25°C threshold.', type: 'alert' as const, timestamp: new Date(Date.now() - 3600000) },
    { id: '2', title: 'HVAC Maintenance Due', message: 'Filter replacement for Unit A is due next week.', type: 'reminder' as const, timestamp: new Date(Date.now() - 86400000) },
    { id: '3', title: 'Energy Report Ready', message: 'Your monthly energy savings report is available.', type: 'info' as const, timestamp: new Date(Date.now() - 172800000) },
    { id: '4', title: 'System Update', message: 'ThermoAI has been updated to version 1.2.0.', type: 'info' as const, timestamp: new Date(Date.now() - 604800000) },
  ];


  const toggleNotifications = () => {
    setIsOpen(!isOpen);
    if (isOpen === false && hasUnread) {
      setHasUnread(false); // Mark as read when opening
    }
  };

  return (
    <>
      <Button variant="ghost" size="icon" onClick={toggleNotifications} aria-label="Toggle Notifications">
        {hasUnread ? <BellRing className="h-5 w-5 text-primary animate-pulse" /> : <Bell className="h-5 w-5" />}
      </Button>
      <NotificationCenter isOpen={isOpen} onClose={() => setIsOpen(false)} notifications={mockNotifications} />
    </>
  );
}
