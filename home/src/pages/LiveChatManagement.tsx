import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, Send, CheckCircle, Clock, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface TidioConversation {
  id: string;
  visitor: {
    name: string;
    email?: string;
  };
  status: string;
  created_at: string;
  updated_at: string;
  unread_messages_count: number;
}

interface TidioMessage {
  id: string;
  message: string;
  delivered_at: string;
  author: {
    type: string;
    name: string;
  };
}

export default function LiveChatManagement() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<TidioConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<TidioMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
    
    // Auto-refresh conversations every 10 seconds
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
      
      // Auto-refresh messages every 5 seconds
      const interval = setInterval(() => {
        fetchMessages(selectedConversation);
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

  const callTidioAPI = async (action: string, data?: any) => {
    const { data: result, error } = await supabase.functions.invoke('tidio-chat', {
      body: { action, ...data },
    });

    if (error) throw error;
    return result;
  };

  const fetchConversations = async () => {
    try {
      const result = await callTidioAPI('getConversations');
      if (result?.conversations) {
        setConversations(result.conversations);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const result = await callTidioAPI('getMessages', { conversationId });
      if (result?.messages) {
        setMessages(result.messages);
        scrollToBottom();
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    setLoading(true);
    try {
      await callTidioAPI('sendMessage', {
        conversationId: selectedConversation,
        message: newMessage,
      });

      setNewMessage("");
      toast({
        title: t('تم', 'Done'),
        description: t('تم إرسال الرسالة', 'Message sent'),
      });

      // Refresh messages
      await fetchMessages(selectedConversation);
    } catch (error) {
      toast({
        title: t('خطأ', 'Error'),
        description: t('فشل إرسال الرسالة', 'Failed to send message'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseConversation = async (conversationId: string) => {
    try {
      await callTidioAPI('closeConversation', { conversationId });
      
      toast({
        title: t('تم', 'Done'),
        description: t('تم إغلاق المحادثة', 'Conversation closed'),
      });
      
      await fetchConversations();
      if (selectedConversation === conversationId) {
        setSelectedConversation(null);
      }
    } catch (error) {
      toast({
        title: t('خطأ', 'Error'),
        description: t('فشل إغلاق المحادثة', 'Failed to close conversation'),
        variant: 'destructive',
      });
    }
  };

  const activeConversations = conversations.filter((c) => c.status === 'open');
  const closedConversations = conversations.filter((c) => c.status === 'closed');

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-24">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">
            {t('إدارة الدردشة المباشرة', 'Live Chat Management')}
          </h1>
          <Button
            onClick={fetchConversations}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {t('تحديث', 'Refresh')}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                {t('المحادثات', 'Conversations')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="active">
                <TabsList className="w-full">
                  <TabsTrigger value="active" className="flex-1">
                    {t('نشطة', 'Active')} ({activeConversations.length})
                  </TabsTrigger>
                  <TabsTrigger value="closed" className="flex-1">
                    {t('مغلقة', 'Closed')} ({closedConversations.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="m-0">
                  <ScrollArea className="h-[500px]">
                    {activeConversations.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        {t('لا توجد محادثات نشطة', 'No active conversations')}
                      </div>
                    ) : (
                      <div className="divide-y">
                        {activeConversations.map((conversation) => (
                          <div
                            key={conversation.id}
                            className={`p-4 cursor-pointer hover:bg-muted transition-colors ${
                              selectedConversation === conversation.id ? 'bg-muted' : ''
                            }`}
                            onClick={() => setSelectedConversation(conversation.id)}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-semibold">
                                {conversation.visitor.name || 'زائر'}
                              </p>
                              <Badge variant="default" className="gap-1">
                                <Clock className="w-3 h-3" />
                                {t('نشط', 'Active')}
                              </Badge>
                            </div>
                            {conversation.visitor.email && (
                              <p className="text-xs text-muted-foreground">
                                {conversation.visitor.email}
                              </p>
                            )}
                            {conversation.unread_messages_count > 0 && (
                              <Badge variant="destructive" className="mt-1">
                                {conversation.unread_messages_count} {t('جديد', 'new')}
                              </Badge>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(conversation.updated_at), {
                                addSuffix: true,
                                locale: language === 'ar' ? ar : undefined,
                              })}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="closed" className="m-0">
                  <ScrollArea className="h-[500px]">
                    {closedConversations.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        {t('لا توجد محادثات مغلقة', 'No closed conversations')}
                      </div>
                    ) : (
                      <div className="divide-y">
                        {closedConversations.map((conversation) => (
                          <div
                            key={conversation.id}
                            className={`p-4 cursor-pointer hover:bg-muted transition-colors ${
                              selectedConversation === conversation.id ? 'bg-muted' : ''
                            }`}
                            onClick={() => setSelectedConversation(conversation.id)}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-semibold">
                                {conversation.visitor.name || 'زائر'}
                              </p>
                              <Badge variant="secondary" className="gap-1">
                                <CheckCircle className="w-3 h-3" />
                                {t('مغلقة', 'Closed')}
                              </Badge>
                            </div>
                            {conversation.visitor.email && (
                              <p className="text-xs text-muted-foreground">
                                {conversation.visitor.email}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {selectedConversation
                    ? conversations.find((c) => c.id === selectedConversation)?.visitor.name ||
                      t('زائر', 'Visitor')
                    : t('اختر محادثة', 'Select a conversation')}
                </CardTitle>
                {selectedConversation &&
                  conversations.find((c) => c.id === selectedConversation)?.status === 'open' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCloseConversation(selectedConversation)}
                    >
                      {t('إغلاق المحادثة', 'Close Chat')}
                    </Button>
                  )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {selectedConversation ? (
                <div className="flex flex-col h-[500px]">
                  <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.author.type === 'operator' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              message.author.type === 'operator'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-xs font-semibold mb-1">
                              {message.author.name}
                            </p>
                            <p className="text-sm">{message.message}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {formatDistanceToNow(new Date(message.delivered_at), {
                                addSuffix: true,
                                locale: language === 'ar' ? ar : undefined,
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  {conversations.find((c) => c.id === selectedConversation)?.status === 'open' && (
                    <div className="p-4 border-t">
                      <div className="flex gap-2">
                        <Input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !loading) {
                              handleSendMessage();
                            }
                          }}
                          placeholder={t('اكتب ردك...', 'Type your reply...')}
                          className="flex-1"
                          disabled={loading}
                        />
                        <Button 
                          onClick={handleSendMessage} 
                          size="icon"
                          disabled={loading}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-[500px] flex items-center justify-center text-muted-foreground">
                  {t('اختر محادثة لبدء الرد', 'Select a conversation to start replying')}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}