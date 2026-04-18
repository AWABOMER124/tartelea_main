import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, User, Crown, UserCheck, Loader2, GraduationCap } from "lucide-react";
import { updateAdminUserRoles, type AdminUser } from "@/lib/backendAdmin";
import type { PlatformRole } from "@/lib/platformRoles";

interface UserManagementProps {
  users: AdminUser[];
  isAdmin: boolean;
  onRefresh: () => void;
}

const roleIcons: Record<PlatformRole, typeof Shield> = {
  admin: Crown,
  moderator: Shield,
  trainer: GraduationCap,
  member: UserCheck,
  guest: User,
};

const roleLabels: Record<PlatformRole, string> = {
  admin: "مدير",
  moderator: "مشرف",
  trainer: "مدرب",
  member: "عضو",
  guest: "زائر",
};

const roleColors: Record<PlatformRole, string> = {
  admin: "bg-accent text-accent-foreground",
  moderator: "bg-primary/10 text-primary",
  trainer: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  member: "bg-secondary text-secondary-foreground",
  guest: "bg-muted text-muted-foreground",
};

const allRoles: PlatformRole[] = ["admin", "moderator", "trainer", "member", "guest"];

const UserManagement = ({ users, isAdmin, onRefresh }: UserManagementProps) => {
  const { toast } = useToast();
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const handleRoleToggle = async (userId: string, role: PlatformRole, currentRoles: PlatformRole[]) => {
    if (!isAdmin) {
      toast({
        title: "غير مصرح",
        description: "فقط المدير يمكنه تغيير الصلاحيات",
        variant: "destructive",
      });
      return;
    }

    const hasRole = currentRoles.includes(role);
    const nextRoles = hasRole
      ? currentRoles.filter((currentRole) => currentRole !== role)
      : [...currentRoles, role];

    setUpdatingUserId(userId);

    try {
      await updateAdminUserRoles(userId, nextRoles.length ? nextRoles : ["member"]);
      toast({
        title: "تم بنجاح",
        description: "تم تحديث صلاحيات المستخدم",
      });
      onRefresh();
    } catch (error) {
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "فشل تحديث الصلاحيات",
        variant: "destructive",
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-foreground">
          إدارة المستخدمين ({users.length})
        </h2>
        {!isAdmin && (
          <Badge variant="outline" className="text-muted-foreground">
            العرض فقط - المدير يمكنه تغيير الصلاحيات
          </Badge>
        )}
      </div>

      <div className="bg-card border border-border rounded-lg p-3 mb-4">
        <p className="text-sm text-muted-foreground">
          <strong>ملاحظة:</strong> هذه الواجهة تحدّث الأدوار الآن عبر مسار إداري رسمي في الباك إند، وليس عبر كتابة مباشرة إلى جدول `user_roles`.
        </p>
      </div>

      <div className="overflow-x-auto -mx-4 px-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>المستخدم</TableHead>
              <TableHead>البريد</TableHead>
              <TableHead>البلد</TableHead>
              <TableHead>الصلاحيات</TableHead>
              <TableHead>تاريخ التسجيل</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium">
                      {user.full_name || "بدون اسم"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.country || "-"}</TableCell>
                <TableCell>
                  {isAdmin ? (
                    <div className="flex items-center gap-2">
                      {updatingUserId === user.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Accordion type="single" collapsible className="w-full max-w-xs">
                          <AccordionItem value="roles" className="border-none">
                            <AccordionTrigger className="py-1 hover:no-underline">
                              <div className="flex flex-wrap gap-1">
                                {user.roles.map((role) => {
                                  const RoleIcon = roleIcons[role];
                                  return (
                                    <Badge key={role} className={`${roleColors[role]} text-xs`}>
                                      <RoleIcon className="h-3 w-3 ml-1" />
                                      {roleLabels[role]}
                                    </Badge>
                                  );
                                })}
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2">
                              <div className="space-y-2">
                                {allRoles.map((role) => {
                                  const RoleIcon = roleIcons[role];
                                  const hasRole = user.roles.includes(role);
                                  return (
                                    <div
                                      key={role}
                                      className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded"
                                      onClick={() => void handleRoleToggle(user.id, role, user.roles)}
                                    >
                                      <Checkbox checked={hasRole} />
                                      <RoleIcon className="h-4 w-4" />
                                      <span className="text-sm">{roleLabels[role]}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => {
                        const RoleIcon = roleIcons[role];
                        return (
                          <Badge key={role} className={roleColors[role]}>
                            <RoleIcon className="h-3 w-3 ml-1" />
                            {roleLabels[role]}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString("ar")
                    : "-"}
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  لا يوجد مستخدمين
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default UserManagement;
