'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Send, MessagesSquare } from 'lucide-react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { api } from '@/lib/api';
import { Conversation, DirectMessage } from '@/types';
import { cn } from '@/lib/utils';

export default function MessagesPage() {
  const { user, isReady } = useRequireAuth();
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [activePartnerId, setActivePartnerId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<DirectMessage[]>([]);
  const [draft, setDraft] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);
  const [isLoadingList, setIsLoadingList] = React.useState(true);

  const fetchConversations = React.useCallback(async () => {
    setIsLoadingList(true);
    try {
      const data = await api.get<{ conversations: Conversation[] }>('/messages/conversations');
      setConversations(data.conversations);
    } catch {
      setConversations([]);
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  React.useEffect(() => {
    if (isReady) fetchConversations();
  }, [isReady, fetchConversations]);

  const openConversation = async (partnerId: string) => {
    setActivePartnerId(partnerId);
    try {
      const data = await api.get<{ messages: DirectMessage[] }>(`/messages/conversations/${partnerId}`);
      setMessages(data.messages);
      // Clear the unread badge for this conversation locally.
      setConversations((prev) => prev.map((c) => (c.partner.id === partnerId ? { ...c, unread: 0 } : c)));
    } catch {
      setMessages([]);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePartnerId || !draft.trim()) return;
    setIsSending(true);
    try {
      await api.post('/messages', { recipientId: activePartnerId, body: draft });
      setDraft('');
      await openConversation(activePartnerId);
      await fetchConversations();
    } catch {
      // no-op
    } finally {
      setIsSending(false);
    }
  };

  if (!isReady) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  const activePartner = conversations.find((c) => c.partner.id === activePartnerId)?.partner;

  return (
    <div className="container py-8">
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-display text-2xl font-bold md:text-3xl"
      >
        Messages
      </motion.h1>

      <div className="mt-6 grid grid-cols-1 gap-4 overflow-hidden rounded-2xl border border-border md:h-[600px] md:grid-cols-[280px_1fr]">
        <div className="overflow-y-auto border-b border-border md:border-b-0 md:border-r">
          {isLoadingList ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">No conversations yet.</p>
          ) : (
            conversations.map((c) => (
              <button
                key={c.partner.id}
                onClick={() => openConversation(c.partner.id)}
                className={cn(
                  'flex w-full items-center justify-between gap-2 border-b border-border px-4 py-3 text-left text-sm hover:bg-muted/50',
                  activePartnerId === c.partner.id && 'bg-brand-50 dark:bg-brand-950/30'
                )}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {c.partner.firstName} {c.partner.lastName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{c.lastMessage}</p>
                </div>
                {c.unread > 0 && (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                    {c.unread}
                  </span>
                )}
              </button>
            ))
          )}
        </div>

        <div className="flex flex-col">
          {!activePartnerId ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-10 text-center text-muted-foreground">
              <MessagesSquare className="h-10 w-10" />
              <p className="text-sm">Select a conversation to view messages.</p>
            </div>
          ) : (
            <>
              <div className="border-b border-border px-4 py-3">
                <p className="font-medium">
                  {activePartner?.firstName} {activePartner?.lastName}
                </p>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.map((msg) => {
                  const isMine = msg.senderId === user?.id;
                  return (
                    <div key={msg.id} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
                      <div
                        className={cn(
                          'max-w-xs rounded-2xl px-4 py-2 text-sm',
                          isMine ? 'bg-brand-500 text-white' : 'bg-muted'
                        )}
                      >
                        {msg.body}
                      </div>
                    </div>
                  );
                })}
              </div>
              <form onSubmit={handleSend} className="flex gap-2 border-t border-border p-3">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <button
                  type="submit"
                  disabled={isSending || !draft.trim()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-white disabled:opacity-50"
                  aria-label="Send message"
                >
                  {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
