import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, MessageSquare, LogIn } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";

interface ConversationSummary {
  otherUserId: string;
  otherName: string;
  otherAvatar: string | null;
  lastBody: string;
  lastAt: string;
  unreadCount: number;
}

export default function Messages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;

    const load = async () => {
      setLoading(true);

      // Pull every message this user sent or received, newest first —
      // conversations are grouped client-side since there's no separate
      // threads table.
      const { data: messages } = await supabase
        .from("messages")
        .select("id, sender_id, recipient_id, body, read_at, created_at")
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (cancelled) return;

      const byOther = new Map<string, { lastBody: string; lastAt: string; unreadCount: number }>();
      for (const m of messages || []) {
        const otherId = m.sender_id === user.id ? m.recipient_id : m.sender_id;
        const existing = byOther.get(otherId);
        const isUnread = m.recipient_id === user.id && !m.read_at;
        if (!existing) {
          byOther.set(otherId, { lastBody: m.body, lastAt: m.created_at, unreadCount: isUnread ? 1 : 0 });
        } else if (isUnread) {
          existing.unreadCount += 1;
        }
      }

      const otherIds = Array.from(byOther.keys());
      if (otherIds.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, store_name, avatar_url")
        .in("id", otherIds);

      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

      const list: ConversationSummary[] = otherIds.map((id) => {
        const info = byOther.get(id)!;
        const profile = profileMap.get(id);
        return {
          otherUserId: id,
          otherName: profile?.store_name || profile?.full_name || "KAT User",
          otherAvatar: profile?.avatar_url || null,
          lastBody: info.lastBody,
          lastAt: info.lastAt,
          unreadCount: info.unreadCount,
        };
      }).sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());

      if (!cancelled) {
        setConversations(list);
        setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [user?.id]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-3 p-6">
        <LogIn className="w-10 h-10 text-muted-foreground" />
        <p className="font-semibold">Sign in required</p>
        <Link href="/"><Button className="rounded-full">Go Home</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/me">
            <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <h1 className="text-base font-black flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" /> Messages
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-2">
        {loading ? (
          <p className="text-center text-sm text-muted-foreground py-8">Loading...</p>
        ) : conversations.length === 0 ? (
          <div className="text-center py-16 bg-card border border-card-border rounded-2xl">
            <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-bold text-sm">No messages yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Conversations with buyers and sellers will show up here.
            </p>
          </div>
        ) : (
          conversations.map((c, i) => (
            <motion.div key={c.otherUserId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Link href={`/messages/${c.otherUserId}`}>
                <button className="w-full bg-card border border-card-border rounded-2xl p-3.5 flex items-center gap-3 hover:bg-muted transition-colors text-left">
                  <div className="w-11 h-11 rounded-full bg-primary/10 border border-primary/20 overflow-hidden flex items-center justify-center shrink-0">
                    {c.otherAvatar ? (
                      <img src={c.otherAvatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-black text-primary">{c.otherName.slice(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${c.unreadCount > 0 ? "font-bold" : "font-semibold"}`}>{c.otherName}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.lastBody}</p>
                  </div>
                  {c.unreadCount > 0 && (
                    <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center shrink-0">
                      {c.unreadCount > 99 ? "99+" : c.unreadCount}
                    </span>
                  )}
                </button>
              </Link>
            </motion.div>
          ))
        )}
      </main>
    </div>
  );
}
