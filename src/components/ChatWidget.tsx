import { useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ChatWidget() {
  const { s, me, send } = useStore();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const msgs = s.messages.filter((m) => m.resellerId === me.id);

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-3 flex h-[26rem] w-[min(22rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-border bg-background card-shadow">
          <div className="flex items-center justify-between bg-charcoal px-4 py-3 text-white">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">PakDropship Support</p>
              <p className="text-xs opacity-70">Owner Admin · online now</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto bg-surface p-3">
            {msgs.map((m) => (
              <div
                key={m.id}
                className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                  m.from === "reseller"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-background text-foreground border border-border"
                }`}
              >
                {m.text}
              </div>
            ))}
          </div>
          <form
            className="flex gap-2 border-t border-border p-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!text.trim()) return;
              send(me.id, "reseller", text.trim());
              setText("");
            }}
          >
            <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…" />
            <Button size="icon" type="submit"><Send className="h-4 w-4" /></Button>
          </form>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        className="grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground glow-shadow transition hover:scale-105"
        aria-label="Live support chat"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    </div>
  );
}
