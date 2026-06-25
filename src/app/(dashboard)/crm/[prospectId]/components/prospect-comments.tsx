"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Loader2, MoreHorizontal, Pencil, Trash2, CheckCircle, Smile } from "lucide-react";
import { useTenant } from "@/hooks/use-tenant";
import { toast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const COMMON_EMOJIS = ["👍", "🔥", "😂", "❤️", "🙌", "🎉", "👀", "🚀", "💡", "✅", "✨", "💯", "👏", "😊", "😎", "🤔"];

export function ProspectComments({ prospectId, companyId }: { prospectId: string; companyId: string }) {
  const { profile } = useTenant();
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Tagging state
  const [users, setUsers] = useState<any[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Edit State
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [historyComment, setHistoryComment] = useState<any | null>(null);

  useEffect(() => {
    // Fetch initial comments
    const fetchComments = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("Comment")
        .select("*, user:User(*)")
        .eq("prospect_id", prospectId)
        .order("created_at", { ascending: true });
        
      if (!error && data) {
        setComments(data);
      }
      setLoading(false);
    };

    // Fetch team members for tagging
    const fetchUsers = async () => {
      const { data } = await supabase
        .from("User")
        .select("id, fullName, avatar")
        .eq("company_id", companyId);
      if (data) {
        setUsers(data);
      }
    };

    fetchComments();
    fetchUsers();

    // Subscribe to new/updated/deleted comments
    const channel = supabase
      .channel(`prospect-comments-${prospectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Comment",
          filter: `prospect_id=eq.${prospectId}`,
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const { data: userData } = await supabase
              .from("User")
              .select("*")
              .eq("id", payload.new.user_id)
              .single();
              
            const commentWithUser = { ...payload.new, user: userData };
            setComments((prev) => {
              if (prev.some((c) => c.id === commentWithUser.id)) return prev;
              return [...prev, commentWithUser];
            });
          } else if (payload.eventType === "UPDATE") {
            setComments((prev) => prev.map((c) => c.id === payload.new.id ? { ...c, ...payload.new, user: c.user } : c));
          } else if (payload.eventType === "DELETE") {
            setComments((prev) => prev.filter((c) => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [prospectId, companyId]);

  const handlePostComment = async () => {
    if (!newComment.trim() || !profile) return;
    setIsSubmitting(true);
    
    const newId = crypto.randomUUID();
    const commentText = newComment.trim();
    
    const { error } = await supabase.from("Comment").insert({
      id: newId,
      prospect_id: prospectId,
      company_id: companyId,
      user_id: profile.id,
      content: commentText,
      reactions: []
    });

    setIsSubmitting(false);

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      setNewComment("");
      const newCommentObj = {
        id: newId,
        prospect_id: prospectId,
        company_id: companyId,
        user_id: profile.id,
        content: commentText,
        created_at: new Date().toISOString(),
        is_edited: false,
        reactions: [],
        user: profile
      };
      
      setComments((prev) => {
        if (prev.some((c) => c.id === newId)) return prev;
        return [...prev, newCommentObj];
      });
    }
  };

  const handleEditSubmit = async (commentId: string) => {
    if (!editContent.trim()) return;

    const currentComment = comments.find(c => c.id === commentId);
    if (!currentComment) return;

    const currentHistory = currentComment.edit_history || [];
    const newHistoryEntry = {
      content: currentComment.content,
      edited_at: new Date().toISOString()
    };
    const newHistory = [...currentHistory, newHistoryEntry];

    const { error } = await supabase.from("Comment").update({
      content: editContent.trim(),
      is_edited: true,
      updated_at: new Date().toISOString(),
      edit_history: newHistory
    }).eq("id", commentId);

    if (!error) {
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, content: editContent.trim(), is_edited: true, edit_history: newHistory } : c));
      setEditingCommentId(null);
    } else {
      toast({ variant: "destructive", title: "Error editing message", description: error.message });
    }
  };

  const handleDelete = async (commentId: string) => {
    const { error } = await supabase.from("Comment").delete().eq("id", commentId);
    if (!error) {
      setComments(prev => prev.filter(c => c.id !== commentId));
    } else {
      toast({ variant: "destructive", title: "Error deleting message", description: error.message });
    }
  };

  const handleAcknowledge = async (commentId: string, currentReactions: any[] = []) => {
    if (!profile) return;
    const isAcknowledged = currentReactions.some(r => r.userId === profile.id && r.type === 'acknowledge');
    
    let newReactions;
    if (isAcknowledged) {
      newReactions = currentReactions.filter(r => !(r.userId === profile.id && r.type === 'acknowledge'));
    } else {
      newReactions = [...currentReactions, { userId: profile.id, type: 'acknowledge' }];
    }

    const { error } = await supabase.from("Comment").update({ reactions: newReactions }).eq("id", commentId);
    if (!error) {
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, reactions: newReactions } : c));
    }
  };

  const handleAddEmojiReaction = async (commentId: string, emoji: string, currentReactions: any[] = []) => {
    if (!profile) return;
    const newReactions = [...currentReactions, { userId: profile.id, type: 'emoji', value: emoji }];
    const { error } = await supabase.from("Comment").update({ reactions: newReactions }).eq("id", commentId);
    if (!error) {
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, reactions: newReactions } : c));
    }
  };

  const insertEmojiToInput = (emoji: string) => {
    const cursor = textareaRef.current?.selectionStart || newComment.length;
    const textBefore = newComment.slice(0, cursor);
    const textAfter = newComment.slice(cursor);
    setNewComment(textBefore + emoji + textAfter);
    
    // Auto focus and set cursor after emoji
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.selectionStart = cursor + emoji.length;
        textareaRef.current.selectionEnd = cursor + emoji.length;
      }
    }, 10);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!showMentions) {
        handlePostComment();
      }
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNewComment(val);

    const cursor = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursor);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      setShowMentions(true);
      setMentionFilter(mentionMatch[1].toLowerCase());
    } else {
      setShowMentions(false);
    }
  };

  const handleSelectMention = (user: any) => {
    const cursor = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = newComment.slice(0, cursor);
    const textAfterCursor = newComment.slice(cursor);
    
    const newTextBefore = textBeforeCursor.replace(/@\w*$/, `@${user.fullName} `);
    setNewComment(newTextBefore + textAfterCursor);
    setShowMentions(false);
    textareaRef.current?.focus();
  };

  const filteredUsers = users.filter(u => u.fullName.toLowerCase().includes(mentionFilter));

  return (
    <Card className="border-none shadow-sm rounded-[10px] bg-white dark:bg-slate-900 flex flex-col h-[500px]">
      <CardHeader className="border-b pb-4 shrink-0">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-foreground" /> Conversation Thread
        </CardTitle>
        <CardDescription>Add comments, tag team members, and discuss this prospect.</CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 p-0 flex flex-col overflow-hidden relative">
        <ScrollArea className="flex-1 p-4">
          {loading ? (
            <div className="flex justify-center items-center h-full min-h-[200px]">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-muted-foreground space-y-2">
              <MessageSquare className="h-8 w-8 opacity-20" />
              <p className="text-sm">No comments yet. Start the discussion!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {comments.map((comment) => {
                const isOwnComment = comment.user_id === profile?.id;
                const reactions = comment.reactions || [];
                const acknowledges = reactions.filter((r: any) => r.type === 'acknowledge');
                const hasAcknowledged = acknowledges.some((r: any) => r.userId === profile?.id);
                const emojiReactions = reactions.filter((r: any) => r.type === 'emoji');
                
                return (
                  <div key={comment.id} className="flex gap-3 group">
                    <Avatar className="h-8 w-8 mt-1 shrink-0">
                      <AvatarImage src={comment.user?.avatar || ""} />
                      <AvatarFallback className="text-xs">{comment.user?.fullName?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm truncate">{comment.user?.fullName || "Unknown User"}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {comment.created_at ? formatDistanceToNow(new Date(comment.created_at), { addSuffix: true }) : ""}
                          {comment.is_edited && (
                            <button 
                              onClick={() => setHistoryComment(comment)}
                              className="ml-1 hover:underline hover:text-foreground text-muted-foreground transition-colors"
                              title="View edit history"
                            >
                              (edited)
                            </button>
                          )}
                        </span>
                        
                        {/* Hover Actions */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center ml-auto">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className={`h-6 w-6 rounded-full ${hasAcknowledged ? 'text-primary' : 'text-muted-foreground'}`}
                            onClick={() => handleAcknowledge(comment.id, reactions)}
                            title={hasAcknowledged ? "Remove Acknowledgement" : "Acknowledge"}
                          >
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full text-muted-foreground" title="React">
                                <Smile className="h-3 w-3" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-2 rounded-xl" align="end">
                              <div className="grid grid-cols-8 gap-1">
                                {COMMON_EMOJIS.map(emoji => (
                                  <button 
                                    key={emoji} 
                                    className="h-8 w-8 hover:bg-accent rounded text-lg flex items-center justify-center transition-colors"
                                    onClick={() => handleAddEmojiReaction(comment.id, emoji, reactions)}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                          {isOwnComment && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full text-muted-foreground">
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-xl">
                                <DropdownMenuItem onClick={() => { setEditingCommentId(comment.id); setEditContent(comment.content); }}>
                                  <Pencil className="h-4 w-4 mr-2" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDelete(comment.id)}>
                                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                      
                      {editingCommentId === comment.id ? (
                        <div className="space-y-2 mt-2">
                          <Textarea 
                            value={editContent} 
                            onChange={(e) => setEditContent(e.target.value)}
                            className="min-h-[60px] text-sm rounded-xl"
                            autoFocus
                          />
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="ghost" onClick={() => setEditingCommentId(null)} className="h-7 text-xs rounded-lg">Cancel</Button>
                            <Button size="sm" onClick={() => handleEditSubmit(comment.id)} className="h-7 text-xs rounded-lg">Save</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm bg-muted/50 p-3 rounded-2xl rounded-tl-none border break-words">
                          {comment.content.split(/(@[\w\s]+)/).map((part: string, i: number) => 
                            part.startsWith('@') ? (
                              <span key={i} className="text-primary font-bold bg-primary/10 px-1 py-0.5 rounded text-xs">{part}</span>
                            ) : (
                              <span key={i}>{part}</span>
                            )
                          )}
                        </div>
                      )}
                      
                      {/* Reactions & Acknowledgements Display */}
                      {(acknowledges.length > 0 || emojiReactions.length > 0) && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {acknowledges.length > 0 && (
                            <div className="flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              <CheckCircle className="h-3 w-3" />
                              {acknowledges.length}
                            </div>
                          )}
                          {/* Group emoji reactions by value */}
                          {Object.entries(emojiReactions.reduce((acc: any, r: any) => {
                            acc[r.value] = (acc[r.value] || 0) + 1;
                            return acc;
                          }, {})).map(([emoji, count]) => (
                            <div key={emoji} className="flex items-center gap-1 bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              <span>{emoji}</span> <span>{count as number}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t bg-accent/5 shrink-0 relative">
          {showMentions && filteredUsers.length > 0 && (
            <div className="absolute bottom-full mb-2 left-4 z-10 w-64 bg-white dark:bg-slate-800 border rounded-xl shadow-lg max-h-48 overflow-auto">
              {filteredUsers.map(u => (
                <button
                  key={u.id}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2 transition-colors"
                  onClick={() => handleSelectMention(u)}
                  type="button"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={u.avatar} />
                    <AvatarFallback>{u.fullName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{u.fullName}</span>
                </button>
              ))}
            </div>
          )}
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={newComment}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message... use @ to tag someone"
              className="pr-[88px] resize-none min-h-[80px] rounded-xl bg-white dark:bg-slate-900"
            />
            <div className="absolute bottom-2 right-2 flex items-center gap-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground transition-colors" type="button">
                    <Smile className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2 rounded-xl mb-2" align="end" sideOffset={8}>
                  <div className="grid grid-cols-8 gap-1">
                    {COMMON_EMOJIS.map(emoji => (
                      <button 
                        key={emoji} 
                        className="h-8 w-8 hover:bg-accent rounded text-lg flex items-center justify-center transition-colors"
                        onClick={() => insertEmojiToInput(emoji)}
                        type="button"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <Button 
                size="icon" 
                onClick={handlePostComment}
                disabled={isSubmitting || !newComment.trim()}
                className="rounded-xl h-8 w-8 transition-transform active:scale-95"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>

      <Dialog open={!!historyComment} onOpenChange={(open) => !open && setHistoryComment(null)}>
        <DialogContent className="rounded-xl sm:max-w-md bg-white dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle>Edit History</DialogTitle>
            <DialogDescription>Previous versions of this message.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {historyComment?.edit_history?.length > 0 ? (
              [...historyComment.edit_history].reverse().map((hist: any, idx: number) => (
                <div key={idx} className="space-y-1 border-b pb-3 last:border-0 dark:border-slate-800">
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(hist.edited_at), { addSuffix: true })}
                  </div>
                  <div className="text-sm bg-muted/50 p-3 rounded-2xl rounded-tl-none border break-words dark:border-slate-800">
                    {hist.content.split(/(@[\w\s]+)/).map((part: string, i: number) => 
                      part.startsWith('@') ? (
                        <span key={i} className="text-primary font-bold bg-primary/10 px-1 py-0.5 rounded text-xs">{part}</span>
                      ) : (
                        <span key={i}>{part}</span>
                      )
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground text-center py-4">No history available for this message.</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
