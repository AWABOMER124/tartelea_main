import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const REACTIONS = [
  { emoji: "❤️", label: "حب" },
  { emoji: "👏", label: "تصفيق" },
  { emoji: "🔥", label: "نار" },
  { emoji: "💡", label: "إلهام" },
  { emoji: "🤲", label: "دعاء" },
  { emoji: "✨", label: "تألق" },
  { emoji: "💯", label: "مئة" },
  { emoji: "🎯", label: "إصابة" },
];

interface FloatingEmoji {
  id: number;
  emoji: string;
  x: number;
}

interface RoomReactionsProps {
  roomId?: string;
}

const RoomReactions = ({ roomId }: RoomReactionsProps) => {
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);

  // Subscribe to realtime reactions from other users
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`room-reactions-${roomId}`)
      .on("broadcast", { event: "reaction" }, (payload) => {
        const { emoji } = payload.payload as { emoji: string };
        spawnEmoji(emoji);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId]);

  const spawnEmoji = useCallback((emoji: string) => {
    const id = Date.now() + Math.random();
    const x = 10 + Math.random() * 80;
    setFloatingEmojis((prev) => [...prev.slice(-20), { id, emoji, x }]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((e) => e.id !== id));
    }, 2500);
  }, []);

  const handleReaction = useCallback((emoji: string) => {
    spawnEmoji(emoji);
    // Broadcast to other users
    if (roomId) {
      supabase.channel(`room-reactions-${roomId}`).send({
        type: "broadcast",
        event: "reaction",
        payload: { emoji },
      });
    }
  }, [roomId, spawnEmoji]);

  return (
    <div className="relative">
      {/* Floating emojis */}
      <div className="fixed bottom-32 left-0 right-0 pointer-events-none z-50">
        {floatingEmojis.map((fe) => (
          <span
            key={fe.id}
            className="absolute text-2xl"
            style={{
              left: `${fe.x}%`,
              bottom: 0,
              animation: "floatUp 2.5s ease-out forwards",
              opacity: 0.9,
            }}
          >
            {fe.emoji}
          </span>
        ))}
      </div>

      {/* Reaction buttons - scrollable row */}
      <div className="flex items-center gap-0.5 px-1 overflow-x-auto no-scrollbar">
        {REACTIONS.map((r) => (
          <Button
            key={r.emoji}
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full hover:bg-muted/80 active:scale-150 transition-transform flex-shrink-0"
            onClick={() => handleReaction(r.emoji)}
            title={r.label}
          >
            <span className="text-lg">{r.emoji}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default RoomReactions;
