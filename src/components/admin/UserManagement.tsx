import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
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
import { Shield, User, Crown, UserCheck, Loader2, GraduationCap, Plus } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type AppRole = Database["public"]["Enums"]["app_role"];

interface UserWithRoles extends Profile {
  roles: AppRole[];
}

interface UserManagementProps {
  users: Profile[];
  isAdmin: boolean;
  onRefresh: () => void;
}

const roleIcons: Record<AppRole, typeof Shield> = {
  admin: Crown,
  moderator: Shield,
  trainer: GraduationCap,
  member: UserCheck,
  guest: User,
};

const roleLabels: Record<AppRole, string> = {
  admin: "مدير",
  moderator: "مشرف",
  trainer: "مدرب",
  member: "عضو",
  guest: "زائر",
};

const roleColors: Record<AppRole, string> = {
  admin: "bg-accent text-accent-foreground",
  moderator: "bg-primary/10 text-primary",
  trainer: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  member: "bg-secondary text-secondary-foreground",
  guest: "bg-muted text-muted-foreground",
};

const allRoles: AppRole[] = ["admin", "moderator", "trainer", "member", "guest"];

const UserManagement = ({ users, isAdmin, onRefresh }: UserManagementProps) => {
  const { toast } = useToast();
  const [usersWithRoles, setUsersWithRoles] = useState<UserWithRoles[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchUserRoles();
  }, [users]);

  const fetchUserRoles = async () => {
    setLoadingRoles(true);
    
    // Fetch ALL roles for all users
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, role");

    // Group roles by user
    const rolesMap = new Map<string, AppRole[]>();
    roles?.forEach((r) => {
      const existing = rolesMap.get(r.user_id) || [];
      rolesMap.set(r.user_id, [...existing, r.role]);
    });
    
    const enrichedUsers = users.map((user) => ({
      ...user,
      roles: rolesMap.get(user.id) || ["member"],
    }));

    setUsersWithRoles(enrichedUsers);
    setLoadingRoles(false);
  };

  const handleRoleToggle = async (userId: string, role: AppRole, currentRoles: AppRole[]) => {
    if (!isAdmin) {
      toast({
        title: "غير مصرح",
        description: "فقط المدير يمكنه تغيير الصلاحيات",
        variant: "destructive",
      });
      return;
    }

    setUpdatingUserId(userId);
    const hasRole = currentRoles.includes(role);

    if (hasRole) {
      // Remove role
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);

      if (error) {
        toast({
          title: "خطأ",
          description: "فشل إزالة الصلاحية",
          variant: "destructive",
        });
      } else {
        toast({
          title: "تم بنجاح",
          description: `تم إزالة صلاحية ${roleLabels[role]}`,
        });
        fetchUserRoles();
      }
    } else {
      // Add role
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role });

      if (error) {
        toast({
          title: "خطأ",
          description: "فشل إضافة الصلاحية",
          variant: "destructive",
        });
      } else {
        toast({
          title: "تم بنجاح",
          description: `تم إضافة صلاحية ${roleLabels[role]}`,
        });
        fetchUserRoles();
      }
    }

    setUpdatingUserId(null);
  };

  if (loadingRoles) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-foreground">
          إدارة المستخدمين ({usersWithRoles.length})
        </h2>
        {!isAdmin && (
          <Badge variant="outline" className="text-muted-foreground">
            العرض فقط - المدير يمكنه تغيير الصلاحيات
          </Badge>
        )}
      </div>

      <div className="bg-card border border-border rounded-lg p-3 mb-4">
        <p className="text-sm text-muted-foreground">
          <strong>ملاحظة:</strong> يمكن للمستخدم امتلاك أدوار متعددة في نفس الوقت. مثلاً: مدرب + مشرف.
        </p>
      </div>

      <div className="overflow-x-auto -mx-4 px-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>المستخدم</TableHead>
              <TableHead>البلد</TableHead>
              <TableHead>الصلاحيات</TableHead>
              <TableHead>تاريخ التسجيل</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersWithRoles.map((user) => (
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
                                      onClick={() => handleRoleToggle(user.id, role, user.roles)}
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
            {usersWithRoles.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground"
                >
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
