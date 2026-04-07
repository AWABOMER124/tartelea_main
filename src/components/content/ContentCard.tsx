import { FileText, Headphones, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface ContentCardProps {
  id: string;
  title: string;
  description?: string | null;
  type: "article" | "audio" | "video";
  category: string;
  depthLevel: string;
  isSudanAwareness?: boolean;
}

const typeIcons = {
  article: FileText,
  audio: Headphones,
  video: Video,
};

const categoryLabels: Record<string, string> = {
  quran: "القرآن",
  values: "القيم",
  community: "المجتمع",
  sudan_awareness: "الوعي السوداني",
  arab_awareness: "الوعي العربي",
  islamic_awareness: "الوعي الإسلامي",
};

const depthLabels: Record<string, string> = {
  beginner: "مبتدئ",
  intermediate: "متوسط",
  advanced: "متقدم",
};

const ContentCard = ({
  id,
  title,
  description,
  type,
  category,
  depthLevel,
  isSudanAwareness,
}: ContentCardProps) => {
  const navigate = useNavigate();
  const Icon = typeIcons[type];

  return (
    <div 
      className="content-card animate-fade-in cursor-pointer hover:border-primary/50 transition-colors"
      onClick={() => navigate(`/content/${id}`)}
    >
      <div className="flex gap-3">
        <div className={cn(
          "flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center",
          isSudanAwareness ? "bg-sudan-red/10" : "bg-primary/10"
        )}>
          <Icon className={cn(
            "h-6 w-6",
            isSudanAwareness ? "text-sudan-red" : "text-primary"
          )} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-foreground leading-tight mb-1 line-clamp-2">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {description}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">
              {categoryLabels[category] || category}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {depthLabels[depthLevel] || depthLevel}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentCard;
