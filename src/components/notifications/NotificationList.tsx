import { useNavigate } from "react-router-dom";
import { Bell, Heart, MessageCircle, UserPlus, CheckCircle, MessageSquare, Calendar, Video, BookOpen, Award, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow, ar } from "@/lib/date-utils";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  is_read: boolean;
  created_at: string;
  related_post_id: string | null;
  related_course_id: string | null;
}

interface NotificationListProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClose: () => void;
}

const typeIcons: Record<string, typeof Bell> = {
  reaction: Heart,
  comment: MessageCircle,
  course_comment: MessageCircle,
  chat_message: MessageSquare,
  new_subscriber: UserPlus,
  course_approved: CheckCircle,
  new_workshop: Calendar,
  new_room: Radio,
  recording_available: Video,
  certificate_issued: Award,
  new_booking: BookOpen,
  booking_update: BookOpen,
  new_message: MessageSquare,
};

const NotificationList = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClose,
}: NotificationListProps) => {
  const navigate = useNavigate();

  const handleClick = (notification: Notification) => {
    onMarkAsRead(notification.id);
    
    // Navigate based on notification type
    switch (notification.type) {
      case 'reaction':
      case 'comment':
        if (notification.related_post_id) {
          navigate(`/community/${notification.related_post_id}`);
        } else {
          navigate("/community");
        }
        break;
      case 'course_comment':
      case 'chat_message':
      case 'new_subscriber':
      case 'course_approved':
      case 'certificate_issued':
        if (notification.related_course_id) {
          navigate(`/courses/${notification.related_course_id}`);
        } else {
          navigate("/courses");
        }
        break;
      case 'new_workshop':
      case 'recording_available':
        navigate("/workshops");
        break;
      case 'new_room':
        navigate("/rooms");
        break;
      case 'new_booking':
      case 'booking_update':
        navigate("/bookings");
        break;
      case 'new_message':
        navigate("/profile");
        break;
      default:
        if (notification.related_post_id) {
          navigate(`/community/${notification.related_post_id}`);
        } else if (notification.related_course_id) {
          navigate(`/courses/${notification.related_course_id}`);
        }
        break;
    }
    
    onClose();
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="font-semibold text-foreground">الإشعارات</h3>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onMarkAllAsRead}>
            تحديد الكل كمقروء
          </Button>
        )}
      </div>

      <ScrollArea className="h-80">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <Bell className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>لا توجد إشعارات</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => {
              const Icon = typeIcons[notification.type] || Bell;
              
              return (
                <button
                  key={notification.id}
                  onClick={() => handleClick(notification)}
                  className={`w-full text-right p-3 hover:bg-muted/50 transition-colors flex gap-3 items-start ${
                    !notification.is_read ? "bg-primary/5" : ""
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    !notification.is_read ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notification.is_read ? "font-medium" : ""}`}>
                      {notification.title}
                    </p>
                    {notification.message && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {notification.message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                        locale: ar,
                      })}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default NotificationList;
