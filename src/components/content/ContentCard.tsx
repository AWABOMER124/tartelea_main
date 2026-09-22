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

const typeLabels = {
  article: "مقال",
  audio: "صوتي",
  video: "مرئي",
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
  beginner: "خلع — تخلية",
  intermediate: "تدبّر — تحلية",
  advanced: "تحرّر — تجلّي",
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
    <article
      role="link"
      tabIndex={0}
      aria-label={`فتح: ${title}`}
      className="group reference-card reference-card-hover cursor-pointer overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={() => navigate(`/content/${id}`)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          navigate(`/content/${id}`);
        }
      }}
    >
      <div
        className={cn(
          "relative flex aspect-[16/8.5] items-center justify-center overflow-hidden",
          type === "audio"
            ? "bg-[linear-gradient(135deg,#1f2725,#456b57)]"
            : type === "video"
              ? "bg-[linear-gradient(135deg,#6a4937,#4a2c1d)]"
              : "bg-[linear-gradient(135deg,#efe7da,#d9c8ad)]",
        )}
      >
        <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_20%_20%,white_0,transparent_28%),radial-gradient(circle_at_80%_70%,#c89b3c_0,transparent_24%)]" />
        <div className={cn(
          "relative flex h-14 w-14 items-center justify-center rounded-full border border-white/25 bg-white/10 backdrop-blur-sm",
          type === "article" ? "text-primary" : "text-white",
        )}>
          <Icon className="h-7 w-7" />
        </div>
        <span className="absolute bottom-3 right-3 rounded-full border border-white/15 bg-black/20 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
          {typeLabels[type]}
        </span>
      </div>

      <div className="p-4">
        <div className="mb-2 flex flex-wrap gap-1.5">
          <Badge variant="secondary">{categoryLabels[category] || category}</Badge>
          <Badge variant="outline">{depthLabels[depthLevel] || depthLevel}</Badge>
          {isSudanAwareness && <Badge variant="outline">وعي سوداني</Badge>}
        </div>
        <h3 className="line-clamp-2 font-bold leading-6 text-foreground transition-colors group-hover:text-primary">
          {title}
        </h3>
        {description && (
          <p className="mt-1.5 line-clamp-2 text-xs leading-6 text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    </article>
  );
};

export default ContentCard;
