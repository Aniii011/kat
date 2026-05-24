import React, { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { Sparkles, X, Send, ChevronDown } from "lucide-react";
import { listings as staticListings } from "@/data/listings";

interface Message {
  id: number;
  role: "assistant" | "user";
  text: string;
  products?: number[];
}

const QUICK_REPLIES = [
  "Style me for a beach vacation 🌴",
  "Date night outfit under ₦30k 💕",
  "Baddie look for less ₦40k 💅",
  "Owambe party drip 🎉",
  "What's trending? 🔥",
  "Clean girl aesthetic ✨",
  "Gym fit under ₦25k 💪",
  "Soft girl vibes 🎀",
];

function getSuggestion(input: string): { text: string; productIds: number[] } {
  const q = input.toLowerCase();
  if (q.match(/beach|vacation|vacay|holiday|island|travel/))
    return { text: "Beach babes, this one is for you! 🌴 Your perfect vacay edit:", productIds: [7, 8, 9] };
  if (q.match(/date|dinner|night out|romantic/))
    return { text: "Date night done right 💕 He won't know what hit him:", productIds: [2, 13, 5] };
  if (q.match(/gym|workout|fitness|exercise|yoga/))
    return { text: "Main character energy at the gym 💪", productIds: [12, 9] };
  if (q.match(/owambe|party|wedding|event|aso-ebi|birthday/))
    return { text: "Owambe season is a SPORT and you're winning it! 🎉", productIds: [1, 11, 5] };
  if (q.match(/baddie|slay|hot girl|boss/))
    return { text: "Baddie era activated 🔥 These pieces will have everyone checking for you:", productIds: [2, 15, 13, 4] };
  if (q.match(/old money|clean|minimal|classic|elegant|chic/))
    return { text: "Old money aesthetic — quiet luxury is the loudest flex ✨", productIds: [3, 5, 9] };
  if (q.match(/boho|bohemian|free spirit|festival/))
    return { text: "Boho girlie energy 🌸 Free, flowy, and stunning:", productIds: [8, 7, 5] };
  if (q.match(/soft girl|cute|pastel|feminine|girly|pink/))
    return { text: "Soft girl era activated! 🎀", productIds: [10, 5, 8] };
  if (q.match(/streetwear|street|urban|swag/))
    return { text: "Streets will know 🔥", productIds: [6, 9, 15] };
  if (q.match(/skin|glow|serum|skincare|face|beauty/))
    return { text: "Your skin is your best accessory ✨", productIds: [14] };
  if (q.match(/wig|hair/))
    return { text: "Hair is everything darling 💇‍♀️", productIds: [4] };
  if (q.match(/office|work|corporate|professional/))
    return { text: "CEO energy activated 💼", productIds: [3, 1, 5] };
  if (q.match(/budget|cheap|affordable|under/))
    return { text: "Budget-friendly and still fly 💸", productIds: [5, 11, 14] };
  if (q.match(/trend|viral|popular|new/))
    return { text: "Here's what everyone is buying right now on KAT 🔥", productIds: [4, 2, 12, 9] };
  return { text: "Here are some of our most loved pieces right now ✨", productIds: [2, 3, 12, 5] };
}

function formatNaira(n: number) { return "₦" + n.toLocaleString("en-NG"); }

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
const WELCOME: Message = {
  id: ++msgCounter,
  role: "assistant",
  text: "Hey! I'm KAT AI 👋 Tell me an occasion, vibe, or budget and I'll build you the perfect outfit ✨",
};

export default function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const constraintsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open, messages]);

  function send(text: string) {
    if (!text.trim()) return;
    setMessages((m) => [...m, { id: ++msgCounter, role: "user", text: text.trim() }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      const { text: reply, productIds } = getSuggestion(text);
      setMessages((m) => [...m, { id: ++msgCounter, role: "assistant", text: reply, products: productIds }]);
      setTyping(false);
    }, 800 + Math.random() * 400);
  }

  return (
    <>
      <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-50" />

      {!open && (
        <motion.button
          drag
          dragConstraints={constraintsRef}
          dragElastic={0.1}
          dragMomentum={false}
          onClick={() => setOpen(true)}
          className="fixed bottom-20 sm:bottom-6 right-5 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          animate={{ boxShadow: ["0 4px 20px rgba(0,0,0,.2)", "0 6px 28px rgba(0,0,0,.3)", "0 4px 20px rgba(0,0,0,.2)"] }}
          transition={{ boxShadow: { repeat: Infinity, duration: 2.5 } }}
        >
          <Sparkles className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-background" />
        </motion.button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 right-0 left-0 sm:left-auto sm:right-5 sm:bottom-5 z-50 sm:w-[360px] flex flex-col rounded-t-3xl sm:rounded-3xl overflow-hidden border border-border shadow-2xl bg-background"
            style={{ maxHeight: "calc(100dvh - 5rem)" }}
          >
            <div className="bg-primary text-primary-foreground px-4 py-3.5 flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">KAT AI Stylist</p>
                <p className="text-[10px] opacity-80">Your personal style assistant ✨</p>
              </div>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] ${msg.role === "assistant" ? "w-full" : ""}`}>
                    {msg.role === "assistant" && (
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                          <Sparkles className="w-2.5 h-2.5 text-primary-foreground" />
                        </div>
                        <span className="text-[10px] font-semibold text-muted-foreground">KAT AI</span>
                      </div>
                    )}
                    <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted text-foreground rounded-tl-sm"}`}>
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
                      <span key={i} className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {messages.length <= 1 && (
              <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto scrollbar-hide shrink-0">
                {QUICK_REPLIES.slice(0, 4).map((r) => (
                  <button key={r} onClick={() => send(r)}
                    className="shrink-0 text-[10px] bg-accent text-accent-foreground px-3 py-1.5 rounded-full font-medium border border-border hover:border-primary hover:text-primary transition-colors whitespace-nowrap">
                    {r}
                  </button>
                ))}
              </div>
            )}

            <div className="border-t border-border p-3 flex gap-2 shrink-0">
              <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send(input)}
                placeholder="Ask me anything about style..."
                className="flex-1 text-sm bg-muted rounded-full px-4 py-2.5 outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-primary transition-colors placeholder:text-muted-foreground"
              />
              <button onClick={() => send(input)} disabled={!input.trim() || typing}
                className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 hover:opacity-90 shrink-0 transition-opacity">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
