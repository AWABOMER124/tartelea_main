import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Post = Database["public"]["Tables"]["posts"]["Row"];

interface PostManagementProps {
  posts: Post[];
  onRefresh: () => void;
}

const categoryLabels: Record<string, string> = {
  general: "عام",
  quran: "قرآن",
  awareness: "توعية",
  sudan_awareness: "السودان",
};

const PostManagement = ({ posts, onRefresh }: PostManagementProps) => {
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) {
      toast({ title: "خطأ", description: "فشل حذف المنشور", variant: "destructive" });
    } else {
      toast({ title: "تم بنجاح", description: "تم حذف المنشور" });
      onRefresh();
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-foreground">
        إدارة المنشورات ({posts.length})
      </h2>

      <div className="overflow-x-auto -mx-4 px-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>العنوان</TableHead>
              <TableHead>التصنيف</TableHead>
              <TableHead>التاريخ</TableHead>
              <TableHead>إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((post) => (
              <TableRow key={post.id}>
                <TableCell className="font-medium max-w-[150px] truncate">
                  {post.title}
                </TableCell>
                <TableCell>
                  {categoryLabels[post.category] || post.category}
                </TableCell>
                <TableCell>
                  {post.created_at
                    ? new Date(post.created_at).toLocaleDateString("ar")
                    : "-"}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(post.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {posts.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground"
                >
                  لا يوجد منشورات
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PostManagement;
