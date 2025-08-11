'use client';

import { motion, AnimatePresence } from 'framer-motion';
import AnimatedNotification from './AnimatedNotification';

interface Notification {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

interface NotificationContainerProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
}

export default function NotificationContainer({ notifications, onRemove }: NotificationContainerProps) {
  // Группируем уведомления по позиции
  const groupedNotifications = notifications.reduce((acc, notification) => {
    const position = notification.position || 'top-right';
    if (!acc[position]) {
      acc[position] = [];
    }
    acc[position].push(notification);
    return acc;
  }, {} as Record<string, Notification[]>);

  return (
    <>
      {Object.entries(groupedNotifications).map(([position, positionNotifications]) => (
        <div key={position} className="fixed z-50 pointer-events-none">
          <AnimatePresence>
            {positionNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: position.includes('top') ? -20 : 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: position.includes('top') ? -20 : 20 }}
                transition={{ 
                  duration: 0.3,
                  delay: index * 0.1,
                  ease: "easeOut"
                }}
                style={{
                  marginBottom: index > 0 ? '0.5rem' : '0'
                }}
              >
                <div className="pointer-events-auto">
                  <AnimatedNotification
                    isVisible={true}
                    onClose={() => onRemove(notification.id)}
                    title={notification.title}
                    message={notification.message}
                    type={notification.type}
                    duration={notification.duration}
                    position={notification.position as any}
                  />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ))}
    </>
  );
} 