import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Sparkles, Eye, Heart, Loader2 } from "lucide-react";

interface RootResult {
  root: string;
  literal: string;
  quranic: string;
  derivations: string;
}

interface RootDecoderProps {
  onDecode?: (root: string) => void;
}

const RootDecoder = ({ onDecode }: RootDecoderProps) => {
  const [rootInput, setRootInput] = useState("");
  const [result, setResult] = useState<RootResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDecode = async () => {
    if (!rootInput.trim() || rootInput.trim().length < 2) return;

    // If onDecode callback is provided, delegate to parent (chat integration)
    if (onDecode) {
      onDecode(rootInput.trim());
      return;
    }

    // Placeholder UI - shows the structure without real data
    setLoading(true);
      setTimeout(() => {
        setResult({
          root: rootInput.trim(),
          literal: "المعنى اللغوي — سيتم ربطه بمساعد التدبر",
          quranic: "الدلالة القرآنية — سيتم ربطه بمساعد التدبر",
          derivations: "الفروق والاشتقاقات — سيتم ربطه بمساعد التدبر",
        });
        setLoading(false);
      }, 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleDecode();
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={rootInput}
            onChange={(e) => setRootInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="أدخل الجذر الثلاثي... مثل: ع ق ل"
            className="pr-10 text-center font-display text-lg tracking-widest"
            dir="rtl"
          />
        </div>
        <Button
          onClick={handleDecode}
          disabled={loading || rootInput.trim().length < 2}
          className="gap-2 bg-primary hover:bg-primary/90"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              فكّك
            </>
          )}
        </Button>
      </div>

      {/* Result Card */}
      {result && (
        <Card className="sanctuary-card animate-fade-in">
          <CardContent className="p-0 relative z-10">
            {/* Root Display */}
            <div className="text-center mb-6">
              <h3 className="text-3xl font-display text-primary tracking-[0.3em]">
                {result.root}
              </h3>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="w-12 h-px bg-gradient-to-r from-transparent to-accent" />
                <Sparkles className="h-3 w-3 text-accent" />
                <span className="w-12 h-px bg-gradient-to-l from-transparent to-accent" />
              </div>
            </div>

            {/* Three Levels */}
            <div className="space-y-4">
              {/* Level 1: Literal */}
              <div className="flex gap-3 items-start p-3 rounded-xl bg-secondary/50">
                <div className="w-10 h-10 rounded-full bg-earth-brown/10 flex items-center justify-center flex-shrink-0">
                  <Eye className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <Badge variant="outline" className="mb-1 text-xs border-primary/30 text-primary">
                    المعنى اللغوي
                  </Badge>
                  <p className="text-sm text-foreground leading-relaxed">
                    {result.literal}
                  </p>
                </div>
              </div>

              {/* Level 2: Quranic Usage */}
              <div className="flex gap-3 items-start p-3 rounded-xl bg-accent/5">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Heart className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <Badge variant="outline" className="mb-1 text-xs border-accent/30 text-accent">
                    الدلالة القرآنية
                  </Badge>
                  <p className="text-sm text-foreground leading-relaxed">
                    {result.quranic}
                  </p>
                </div>
              </div>

              {/* Level 3: Derivations */}
              <div className="flex gap-3 items-start p-3 rounded-xl bg-primary/5">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <Badge variant="outline" className="mb-1 text-xs border-primary/20 text-primary">
                    الاشتقاقات والفروق
                  </Badge>
                  <p className="text-sm text-foreground leading-relaxed">
                    {result.derivations}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RootDecoder;
