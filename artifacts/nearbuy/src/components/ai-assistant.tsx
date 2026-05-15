import React, { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { Sparkles, X, Send, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listings as staticListings } from "@/data/listings";

interface Message {
  id: number;
  role: "assistant" | "user";
  text: string;
  products?: number[];
}

const QUICK_REPLIES = [
  "Help me style a beach vacation 🌴",
  "What should I wear on a date night? 💕",
  "Create a baddie outfit under ₦40k 💅",
  "Dress me for an owambe party 🎉",
  "What's trending right now? 🔥",
  "Clean girl aesthetic look ✨",
  "I need a gym outfit 💪",
  "Soft girl vibes please 🎀",
];

interface Suggestion {
  text: string;
  productIds: number[];
}

function getSuggestion(input: string): Suggestion {
  const q = input.toLowerCase();

  if (q.match(/beach|vacation|vacay|holiday|island|zanzibar|dubai trip|travel/)) {
    return {
      text: "Beach babes, this one is for you! 🌴 Here's your perfect vacay edit — you'll be the most dripped-out girl on the sand:",
      productIds: [7, 8, 9],
    };
  }
  if (q.match(/date|dinner|restaurant|night out|romantic/)) {
    return {
      text: "Date night? Say less, sis. Here's how to have him shook from the moment you walk in: 💕",
      productIds: [2, 13, 5],
    };
  }
  if (q.match(/gym|workout|fitness|exercise|yoga|pilates|run/)) {
    return {
      text: "Main character energy at the gym! 💪 Here's your cute-but-functional workout fit:",
      productIds: [12, 9],
    };
  }
  if (q.match(/owambe|party|wedding|event|aso-ebi|celebration|birthday/)) {
    return {
      text: "Owambe season is a SPORT and you're about to win it! 🎉 Aunties will be taking notes:",
      productIds: [1, 11, 5],
    };
  }
  if (q.match(/baddie|slay|hot girl|boss|confident/)) {
    return {
      text: "Baddie energy incoming 🔥 These pieces will have everyone checking for you:",
      productIds: [2, 15, 13, 4],
    };
  }
  if (q.match(/old money|clean|minimal|classic|chic|elegant|sophisticated/)) {
    return {
      text: "Old money aesthetic coming right up ✨ Quiet luxury is the loudest flex:",
      productIds: [3, 5, 9],
    };
  }
  if (q.match(/boho|bohemian|free spirit|earthy|festival/)) {
    return {
      text: "Boho girlie energy! 🌸 Free, flowy, and absolutely stunning:",
      productIds: [8, 7, 5],
    };
  }
  if (q.match(/soft girl|cute|pastel|feminine|girly|pink|sweet/)) {
    return {
      text: "Soft girl era activated! 🎀 Here are your must-haves for the most adorable aesthetic:",
      productIds: [10, 5, 8],
    };
  }
  if (q.match(/streetwear|street|urban|hypebeast|drip|swag|hype/)) {
    return {
      text: "Streets will know! 🔥 Here's your streetwear starter pack:",
      productIds: [6, 9, 15],
    };
  }
  if (q.match(/90s|vintage|retro|aunty|throwback|y2k/)) {
    return {
      text: "Serving 90s African Aunty realness! 🌺 These pieces are giving everything:",
      productIds: [11, 1, 17],
    };
  }
  if (q.match(/skin|glow|serum|skincare|face|beauty|makeup|radiant/)) {
    return {
      text: "Your skin is your best accessory! ✨ Start with this skin-loving routine made for melanin skin:",
      productIds: [14],
    };
  }
  if (q.match(/wig|hair|install|lace|frontal|weave/)) {
    return {
      text: "Hair is EVERYTHING darling! 💇‍♀️ This wig will have you looking snatched:",
      productIds: [4],
    };
  }
  if (q.match(/office|work|corporate|professional|business|meeting/)) {
    return {
      text: "CEO energy activated 💼 Here's how to serve looks AND professionalism:",
      productIds: [3, 1, 5],
    };
  }
  if (q.match(/plus|curvy|thick|size 14|size 16|size 18|size 20/)) {
    return {
      text: "Every body deserves to slay! 💕 These pieces celebrate your curves beautifully:",
      productIds: [16, 8, 5],
    };
  }
  if (q.match(/cheap|affordable|budget|under 10|under 15|₦10|₦15|₦20|low budget/)) {
    return {
      text: "Budget-friendly and still fly! 💸 You don't need to break the bank to slay:",
      productIds: [5, 11, 14],
    };
  }
  if (q.match(/gift|present|birthday gift|anniversary/)) {
    return {
      text: "Shopping for someone special? 🎁 These make the most thoughtful gifts:",
      productIds: [5, 10, 14],
    };
  }
  if (q.match(/trend|trending|new|popular|viral|tiktok/)) {
    return {
      text: "Here's what everyone is buying and buzzing about right now on Dripp 🔥:",
      productIds: [4, 2, 12, 9],
    };
  }

  return {
    text: "I'd love to help you find your perfect drip! Here are some of our most loved pieces right now ✨:",
    productIds: [2, 3, 12, 5],
  };
}

function formatNaira(n: number) {
  return "₦" + n.toLocaleString("en-NG");
}

function ProductPill({ id }: { id: number }) {
  const p = staticListings.find((l) => l.id === id);
  if (!p) return null;
  return (
    <Link href={`/listing/${id}`}>
      <div className="flex items-center gap-2 bg-background border border-border rounded-xl p-2 hover:border-primary transition-colors cursor-pointer">
        <img src={p.imageUrl} alt={p.title} className="w-10 h-10 rounded-lg object-cover shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold line-clamp-1">{p.title}</p>
          <p className="text-xs text-primary font-bold">{formatNaira(p.price)}</p>
        </div>
      </div>
    </Link>
  );
}

let msgCounter = 0;
function nextId() { return ++msgCounter; }

const WELCOME: Message = {
  id: nextId(),
  role: "assistant",
  text: "Hey babe! 👋 I'm your Dripp AI stylist. Tell me what you need — an occasion, a vibe, a budget — and I'll build you the perfect outfit. What are we shopping for today? ✨",
};

export default function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open, messages]);

  function sendMessage(text: string) {
    if (!text.trim()) return;
    const userMsg: Message = { id: nextId(), role: "user", text: text.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);

    setTimeout(() => {
      const suggestion = getSuggestion(text);
      const assistantMsg: Message = {
        id: nextId(),
        role: "assistant",
        text: suggestion.text,
        products: suggestion.productIds,
      };
      setMessages((m) => [...m, assistantMsg]);
      setTyping(false);
    }, 900 + Math.random() * 400);
  }

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-5 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
          aria-label="Open AI stylist"
        >
          <Sparkles className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-background" title="Online" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-0 right-0 left-0 sm:left-auto sm:right-5 sm:bottom-5 z-50 sm:w-[360px] flex flex-col rounded-t-3xl sm:rounded-3xl overflow-hidden border border-border shadow-2xl bg-background"
          style={{ maxHeight: "calc(100vh - 5rem)" }}>
          {/* Header */}
          <div className="bg-primary text-primary-foreground px-4 py-3.5 flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">Dripp AI Stylist</p>
              <p className="text-[10px] opacity-80">Always here to help you slay ✨</p>
            </div>
            <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] ${msg.role === "user" ? "" : "w-full"}`}>
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <Sparkles className="w-2.5 h-2.5 text-primary-foreground" />
                      </div>
                      <span className="text-[10px] font-semibold text-muted-foreground">Dripp AI</span>
                    </div>
                  )}
                  <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-muted text-foreground rounded-tl-sm"
                  }`}>
                    {msg.text}
                  </div>
                  {msg.products && msg.products.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {msg.products.map((id) => <ProductPill key={id} id={id} />)}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies */}
          {messages.length <= 1 && (
            <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto scrollbar-hide shrink-0">
              {QUICK_REPLIES.slice(0, 4).map((r) => (
                <button
                  key={r}
                  onClick={() => sendMessage(r)}
                  className="shrink-0 text-[10px] bg-accent text-accent-foreground px-3 py-1.5 rounded-full font-medium border border-border hover:border-primary hover:text-primary transition-colors whitespace-nowrap"
                >
                  {r}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-border p-3 flex gap-2 shrink-0">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
              placeholder="Ask me anything about style..."
              className="flex-1 text-sm bg-muted rounded-full px-4 py-2.5 outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-primary transition-colors placeholder:text-muted-foreground"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || typing}
              className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 transition-opacity hover:opacity-90 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
