import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Room, RoomEvent } from "livekit-client";

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

const REACTION_TOPIC = "tartelea.room.reaction";

interface FloatingEmoji {
  id: number;
  emoji: string;
  x: number;
}

interface RoomReactionsProps {
  room?: Room | null;
}

const RoomReactions = ({ room }: RoomReactionsProps) => {
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);

  const spawnEmoji = useCallback((emoji: string) => {
    const id = Date.now() + Math.random();
    const x = 10 + Math.random() * 80;
    setFloatingEmojis((prev) => [...prev.slice(-20), { id, emoji, x }]);
    window.setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((item) => item.id !== id));
    }, 2500);
  }, []);

  useEffect(() => {
    if (!room) return;

    const decoder = new TextDecoder();
    const handleData = (payload: Uint8Array, _participant?: unknown, _kind?: unknown, topic?: string) => {
      if (topic !== REACTION_TOPIC) return;

      try {
        const message = JSON.parse(decoder.decode(payload)) as {
          type?: string;
          emoji?: string;
        };

        if (
          message.type === "reaction" &&
          typeof message.emoji === "string" &&
          REACTIONS.some((reaction) => reaction.emoji === message.emoji)
        ) {
          spawnEmoji(message.emoji);
        }
      } catch {
        // Ignore malformed data packets from the room.
      }
    };

    room.on(RoomEvent.DataReceived, handleData);
    return () => {
      room.off(RoomEvent.DataReceived, handleData);
    };
  }, [room, spawnEmoji]);

  const handleReaction = useCallback(
    async (emoji: string) => {
      spawnEmoji(emoji);

      if (!room) return;

      try {
        const payload = new TextEncoder().encode(
          JSON.stringify({ type: "reaction", emoji }),
        );
        await room.localParticipant.publishData(payload, {
          reliable: false,
          topic: REACTION_TOPIC,
        });
      } catch {
        // Local feedback remains responsive even if the transient broadcast fails.
      }
    },
    [room, spawnEmoji],
  );

  return (
    <div className="relative">
      <div className="fixed bottom-32 left-0 right-0 pointer-events-none z-50">
        {floatingEmojis.map((item) => (
          <span
            key={item.id}
            className="absolute text-2xl"
            style={{
              left: `${item.x}%`,
              bottom: 0,
              animation: "floatUp 2.5s ease-out forwards",
              opacity: 0.9,
            }}
          >
            {item.emoji}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-0.5 px-1 overflow-x-auto no-scrollbar">
        {REACTIONS.map((reaction) => (
          <Button
            key={reaction.emoji}
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full hover:bg-muted/80 active:scale-150 transition-transform flex-shrink-0"
            onClick={() => void handleReaction(reaction.emoji)}
            aria-label={reaction.label}
            title={reaction.label}
          >
            <span className="text-lg">{reaction.emoji}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default RoomReactions;
