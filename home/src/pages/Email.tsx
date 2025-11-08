/**
 * ⚠️ مهم جداً - صفحة البريد - Email System
 * 
 * ═══════════════════════════════════════════════════════════════
 * 🚫 لا تقم بتعديل هذه الصفحة إلا إذا طلب منك المستخدم صراحة
 * ═══════════════════════════════════════════════════════════════
 * 
 * ✅ المسؤول الوحيد عن تصميم وتطوير هذه الصفحة:
 *    Google Gemini Pro 2.5
 * 
 * 📝 ملاحظات:
 *    - تم تصميم هذه الصفحة بواسطة Google Gemini 2.5 Pro
 *    - Google Gemini Pro 2.5 هو المسؤول الوحيد عن التعديلات
 *    - لا تقم بتعديل هذه الصفحة إلا إذا طلب منك المستخدم صراحة
 * 
 * 🔗 الرابط الأصلي: https://gemini.google.com/app/3c162331e1ca365e
 * 
 * ═══════════════════════════════════════════════════════════════
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  Send, 
  Inbox, 
  Archive, 
  Trash2, 
  Star, 
  Search, 
  Filter,
  Plus,
  Reply,
  ReplyAll,
  Forward,
  MoreVertical,
  Paperclip,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Settings,
  Users,
  FileCheck,
  GripVertical
} from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Checkbox,
} from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Email {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: string;
  read: boolean;
  starred: boolean;
  folder: 'inbox' | 'sent' | 'drafts' | 'trash' | 'archive' | 'spam';
  filterIds?: string[];
  isArchived?: boolean;
  attachments?: string[];
}

export default function Email() {
  const { userRole, loading, user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [emails, setEmails] = useState<Email[]>([]);
  const [filteredEmails, setFilteredEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentFolder, setCurrentFolder] = useState<'inbox' | 'sent' | 'drafts' | 'trash' | 'archive' | 'spam'>('inbox');
  const [availableFilters, setAvailableFilters] = useState<any[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [draggedFilter, setDraggedFilter] = useState<string | null>(null);
  const [draggedTemplate, setDraggedTemplate] = useState<string | null>(null);
  const [draggedEmail, setDraggedEmail] = useState<Email | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [loadingEmails, setLoadingEmails] = useState(true);
  const [emailAccounts, setEmailAccounts] = useState<any[]>([]);
  const [currentAccountId, setCurrentAccountId] = useState<string>('default');
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 120,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  const [composeData, setComposeData] = useState({
    to: "",
    subject: "",
    body: "",
    attachments: [] as string[],
    customerIds: [] as string[],
    templateId: null as string | null
  });

  useEffect(() => {
    if (!loading) {
      // التحقق من صلاحيات الوصول
      const checkAccess = async () => {
        try {
          // TODO: التحقق من صلاحيات الوصول من قاعدة البيانات
          // حالياً نسمح للمدير فقط
          if (userRole !== 'admin') {
            navigate('/');
            return;
          }
          
          // جلب الحسابات من localStorage
          const savedAccounts = localStorage.getItem('email_accounts');
          const savedAccountId = localStorage.getItem('current_account_id');
          if (savedAccounts) {
            const accounts = JSON.parse(savedAccounts);
            setEmailAccounts(accounts);
            if (savedAccountId) {
              setCurrentAccountId(savedAccountId);
            } else if (accounts.length > 0) {
              setCurrentAccountId(accounts[0].id);
            }
          }
          
          fetchEmails();
          fetchFilters();
        } catch (error) {
          console.error('Error checking access:', error);
        }
      };
      checkAccess();
    }
  }, [userRole, loading, navigate]);

  const fetchFilters = async () => {
    try {
      // جلب الفلاتر من localStorage أو قاعدة البيانات
      const savedFilters = localStorage.getItem('email_filters');
      if (savedFilters) {
        const filters = JSON.parse(savedFilters);
        setAvailableFilters(filters);
      } else {
        // محاولة جلب من قاعدة البيانات
        try {
          const { data, error } = await supabase
            .from('email_settings')
            .select('filters')
            .eq('id', 'main')
            .single();
          
          if (!error && data?.filters) {
            setAvailableFilters(data.filters);
            localStorage.setItem('email_filters', JSON.stringify(data.filters));
          }
        } catch (dbError) {
          console.warn('Could not fetch filters from database:', dbError);
        }
      }
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  useEffect(() => {
    filterEmails();
  }, [searchQuery, currentFolder, emails, availableFilters, currentAccountId, selectedFilter]);
  
  useEffect(() => {
    // عند تغيير الحساب، جلب البريد الخاص به
    if (currentAccountId && emailAccounts.length > 0) {
      fetchEmails();
    }
  }, [currentAccountId]);

  const fetchEmails = async () => {
    setLoadingEmails(true);
    try {
      // جلب البريد من قاعدة البيانات للحساب الحالي
      const { data, error } = await supabase
        .from('emails')
        .select('*')
        .eq('account_id', currentAccountId)
        .order('date', { ascending: false })
        .limit(500);

      if (error) {
        console.error('Error fetching emails:', error);
        // إذا كان الخطأ بسبب عدم وجود الجدول، اعرض رسالة واضحة
        if (error.message?.includes('does not exist') || error.message?.includes('schema cache')) {
          toast({
            title: t({ ar: "خطأ في قاعدة البيانات", en: "Database Error" }),
            description: t({ ar: "جدول البريد غير موجود. يرجى إنشاء الجدول من إعدادات Supabase", en: "Emails table does not exist. Please create the table from Supabase settings" }),
            variant: "destructive",
          });
        }
        setEmails([]);
      } else {
        // تحويل البيانات من قاعدة البيانات إلى تنسيق Email
        const formattedEmails: Email[] = (data || []).map((e: any) => ({
          id: e.id,
          from: e.from_email || e.from,
          to: e.to_email || e.to,
          subject: e.subject,
          body: e.body,
          folder: e.folder || 'inbox',
          read: e.read || false,
          starred: e.starred || false,
          date: e.date || e.created_at,
          attachments: e.attachments || [],
          filterIds: e.filter_ids || []
        }));
        setEmails(formattedEmails);
      }

      // جلب البريد من خادم البريد (IMAP) عبر Supabase Edge Function
      try {
        const currentAccount = emailAccounts.find(a => a.id === currentAccountId);
        if (currentAccount && currentAccount.incoming && currentAccount.incoming.server) {
          const { data: imapEmails, error: imapError } = await supabase.functions.invoke('fetch-emails', {
            body: {
              account_id: currentAccountId,
              imap_settings: currentAccount.incoming,
              smtp_settings: currentAccount.outgoing
            }
          });

          if (!imapError && imapEmails && Array.isArray(imapEmails)) {
            // حفظ البريد المستلم في قاعدة البيانات
            const emailsToSave = imapEmails.map((e: any) => ({
              account_id: currentAccountId,
              from_email: e.from,
              to_email: e.to,
              subject: e.subject,
              body: e.body,
              folder: e.folder || 'inbox',
              read: e.read || false,
              starred: e.starred || false,
              attachments: e.attachments || [],
              date: e.date || new Date().toISOString()
            }));

            // حفظ في قاعدة البيانات
            const { data: savedEmails, error: saveError } = await supabase
              .from('emails')
              .upsert(emailsToSave, {
                onConflict: 'id',
                ignoreDuplicates: false
              })
              .select();

            if (saveError) {
              console.warn('Could not save emails to database:', saveError);
              // إذا كان الخطأ بسبب عدم وجود الجدول، اعرض رسالة واضحة
              if (saveError.message?.includes('does not exist') || saveError.message?.includes('schema cache')) {
                toast({
                  title: t({ ar: "خطأ في قاعدة البيانات", en: "Database Error" }),
                  description: t({ ar: "جدول البريد غير موجود. يرجى إنشاء الجدول من إعدادات Supabase", en: "Emails table does not exist. Please create the table from Supabase settings" }),
                  variant: "destructive",
                });
              }
            }

            // دمج البريد المستلم مع البريد المحفوظ
            if (savedEmails && savedEmails.length > 0) {
              const formattedNewEmails: Email[] = savedEmails.map((e: any) => ({
                id: e.id,
                from: e.from_email || e.from,
                to: e.to_email || e.to,
                subject: e.subject,
                body: e.body,
                folder: e.folder || 'inbox',
                read: e.read || false,
                starred: e.starred || false,
                date: e.date || e.created_at,
                attachments: e.attachments || [],
                filterIds: e.filter_ids || []
              }));
              
              const existingIds = new Set(formattedEmails.map(e => e.id));
              const newEmails = formattedNewEmails.filter(e => !existingIds.has(e.id));
              if (newEmails.length > 0) {
                setEmails([...formattedEmails, ...newEmails]);
              }
            }
          }
        }
      } catch (imapError) {
        console.warn('Could not fetch emails from IMAP server:', imapError);
        // استمر مع البريد المحفوظ محلياً
      }
      
    } catch (error) {
      console.error('Error fetching emails:', error);
      // استخدام بيانات تجريبية كبديل
      setEmails([
        {
          id: '1',
          from: 'customer@example.com',
          to: user?.email || 'in@in33.in',
          subject: language === 'ar' ? 'استفسار عن الحجز' : 'Booking Inquiry',
          body: language === 'ar' ? 'أرغب في الاستفسار عن توفر الغرف...' : 'I would like to inquire about room availability...',
          date: new Date().toISOString(),
          read: false,
          starred: false,
          folder: 'inbox'
        }
      ]);
    } finally {
      setLoadingEmails(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      // جلب جميع المستخدمين الذين لديهم رتبة "customer" من user_roles
      const { data: customerRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'customer')
        .eq('active', true);
      
      if (rolesError) throw rolesError;

      if (!customerRoles || customerRoles.length === 0) {
        setCustomers([]);
        return;
      }

      const customerIds = customerRoles.map(r => r.user_id);

      // جلب بيانات العملاء من profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .in('id', customerIds);

      if (profilesError) throw profilesError;

      // جلب البريد الإلكتروني من auth.users عبر Edge Function
      let customersData: any[] = [];
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          if (!supabaseUrl) {
            throw new Error('VITE_SUPABASE_URL is not defined');
          }
          
          const response = await fetch(`${supabaseUrl}/functions/v1/manage-users`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              action: 'getUserEmails',
              user_ids: customerIds 
            })
          });

          if (response.ok) {
            const responseData = await response.json();
            const userEmails = responseData.userEmails || {};
            
            customersData = (profiles || []).map(profile => ({
              id: profile.id,
              full_name: profile.full_name || '',
              email: userEmails[profile.id] || profile.phone || '',
              phone: profile.phone || ''
            }));
          } else {
            throw new Error('Edge function failed');
          }
        } else {
          throw new Error('No session');
        }
      } catch (e) {
        // إذا فشل Edge Function، استخدم phone كمعرف مؤقت
        console.warn('Could not fetch emails via edge function, using phone as identifier:', e);
        customersData = (profiles || []).map(profile => ({
          id: profile.id,
          full_name: profile.full_name || '',
          email: profile.phone || '', // استخدام phone كمعرف مؤقت
          phone: profile.phone || ''
        }));
      }

      setCustomers(customersData);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: t({ ar: "حدث خطأ أثناء تحميل العملاء", en: "Error loading customers" }),
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (userRole === 'admin' || userRole === 'employee') {
      fetchCustomers();
    }
  }, [userRole]);

  const filterEmails = () => {
    let filtered = emails.filter(email => email.folder === currentFolder);
    
    if (searchQuery) {
      filtered = filtered.filter(email => 
        email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.body.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // إذا تم اختيار فلتر، عرض البريد المفلتر فقط
    if (selectedFilter) {
      filtered = filtered.filter(email => 
        email.filterIds?.includes(selectedFilter)
      );
    }
    
    setFilteredEmails(filtered);
  };
  
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const emailId = typeof active.id === 'string' ? active.id : String(active.id);
    const email = emails.find(e => e.id === emailId);
    if (email) {
      setDraggedEmail(email);
    }
  };
  
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedEmail(null);
    
    if (!over) return;
    
    const emailId = typeof active.id === 'string' ? active.id : String(active.id);
    const filterId = typeof over.id === 'string' ? over.id : String(over.id);
    
    const email = emails.find(e => e.id === emailId);
    const filter = availableFilters.find(f => f.id === filterId);
    
    if (email && filter) {
      // إضافة الفلتر إلى البريد
      const updatedFilterIds = email.filterIds || [];
      if (!updatedFilterIds.includes(filter.id)) {
        updatedFilterIds.push(filter.id);
        
        // تحديث البريد في القائمة المحلية
        const updatedEmails = emails.map(e => 
          e.id === email.id 
            ? { ...e, filterIds: updatedFilterIds }
            : e
        );
        setEmails(updatedEmails);
        
        // حفظ في قاعدة البيانات
        try {
          const { error } = await supabase
            .from('emails')
            .update({ filter_ids: updatedFilterIds })
            .eq('id', email.id);
          
          if (error) {
            console.error('Error updating email filter:', error);
            // إذا كان الخطأ بسبب عدم وجود الجدول، اعرض رسالة واضحة
            if (error.message?.includes('does not exist') || error.message?.includes('schema cache')) {
              toast({
                title: t({ ar: "خطأ في قاعدة البيانات", en: "Database Error" }),
                description: t({ ar: "جدول البريد غير موجود. يرجى إنشاء الجدول من إعدادات Supabase", en: "Emails table does not exist. Please create the table from Supabase settings" }),
                variant: "destructive",
              });
            } else {
              toast({
                title: t({ ar: "خطأ", en: "Error" }),
                description: t({ ar: "فشل تحديث الفلتر", en: "Failed to update filter" }),
                variant: "destructive",
              });
            }
          } else {
            toast({
              title: t({ ar: "تم التطبيق", en: "Applied" }),
              description: t({ ar: `تم إضافة الفلتر "${filter.name}" إلى البريد`, en: `Filter "${filter.name}" applied to email` }),
            });
            // تحديث قائمة البريد المفلتر
            filterEmails();
          }
        } catch (error) {
          console.error('Error updating email filter:', error);
          toast({
            title: t({ ar: "خطأ", en: "Error" }),
            description: t({ ar: "فشل تحديث الفلتر", en: "Failed to update filter" }),
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: t({ ar: "تنبيه", en: "Notice" }),
          description: t({ ar: `البريد يحتوي بالفعل على الفلتر "${filter.name}"`, en: `Email already has filter "${filter.name}"` }),
        });
      }
    }
  };
  
  const getFilterEmailCount = (filterId: string) => {
    return emails.filter(email => email.filterIds?.includes(filterId)).length;
  };

  const handleSendEmail = async (bookingId?: string) => {
    if (!composeData.to && selectedCustomers.length === 0) {
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: t({ ar: "يرجى إدخال المرسل إليه أو اختيار العملاء", en: "Please enter recipient or select customers" }),
        variant: "destructive",
      });
      return;
    }

    if (!composeData.subject) {
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: t({ ar: "يرجى إدخال الموضوع", en: "Please enter subject" }),
        variant: "destructive",
      });
      return;
    }

    try {
      // جلب الحساب الحالي
      const currentAccount = emailAccounts.find(a => a.id === currentAccountId);
      if (!currentAccount || !currentAccount.outgoing || !currentAccount.outgoing.server) {
        toast({
          title: t({ ar: "خطأ", en: "Error" }),
          description: t({ ar: "يرجى إعداد البريد الصادر أولاً من إعدادات البريد", en: "Please configure outgoing email settings first" }),
          variant: "destructive",
        });
        return;
      }

      const outgoingSettings = currentAccount.outgoing;
      const fromEmail = currentAccount.email || currentAccount.outgoing.username || user?.email || '';

      // إرسال البريد عبر Supabase Edge Function أو API
      const recipients = selectedCustomers.length > 0 
        ? customers.filter(c => selectedCustomers.includes(c.id)).map(c => c.email)
        : [composeData.to];

      // إرسال البريد الفعلي عبر Supabase Edge Function أولاً
      let emailSent = false;
      try {
        const { data: sendResult, error: sendError } = await supabase.functions.invoke('send-email', {
          body: {
            to: recipients,
            subject: composeData.subject,
            body: composeData.body,
            from: fromEmail,
            smtp_settings: outgoingSettings
          }
        });

        if (sendError) {
          throw sendError;
        }
        
        emailSent = true;
      } catch (sendError: any) {
        console.error('Error sending email:', sendError);
        toast({
          title: t({ ar: "تحذير", en: "Warning" }),
          description: t({ ar: "فشل إرسال البريد. سيتم حفظه محلياً فقط", en: "Failed to send email. It will be saved locally only" }),
          variant: "destructive",
        });
      }

      // حفظ البريد في قاعدة البيانات (سواء تم إرساله أم لا)
      const emailData = {
        account_id: currentAccountId,
        from_email: fromEmail,
        to_email: recipients.join(', '),
        subject: composeData.subject,
        body: composeData.body,
        folder: 'sent',
        read: true,
        starred: false,
        date: new Date().toISOString(),
        attachments: composeData.attachments || []
      };

      // حفظ في Supabase
      const { data: savedEmail, error: emailError } = await supabase
        .from('emails')
        .insert([emailData])
        .select()
        .single();

      if (emailError) {
        console.error('Error saving email:', emailError);
        // إذا كان الخطأ بسبب عدم وجود الجدول، اعرض رسالة واضحة
        if (emailError.message?.includes('does not exist') || emailError.message?.includes('schema cache')) {
          toast({
            title: t({ ar: "خطأ في قاعدة البيانات", en: "Database Error" }),
            description: t({ ar: "جدول البريد غير موجود. يرجى إنشاء الجدول من إعدادات Supabase", en: "Emails table does not exist. Please create the table from Supabase settings" }),
            variant: "destructive",
          });
        }
        throw emailError;
      }

      // إضافة البريد إلى القائمة المحلية فوراً
      if (savedEmail) {
        const newEmail: Email = {
          id: savedEmail.id,
          from: savedEmail.from_email,
          to: savedEmail.to_email,
          subject: savedEmail.subject,
          body: savedEmail.body,
          folder: savedEmail.folder as any,
          read: savedEmail.read,
          starred: savedEmail.starred,
          date: savedEmail.date,
          attachments: savedEmail.attachments || []
        };
        setEmails([newEmail, ...emails]);
      }

      toast({
        title: emailSent ? t({ ar: "تم الإرسال", en: "Sent" }) : t({ ar: "تم الحفظ", en: "Saved" }),
        description: emailSent 
          ? t({ ar: `تم إرسال البريد بنجاح إلى ${recipients.join(', ')}`, en: `Email sent successfully to ${recipients.join(', ')}` })
          : t({ ar: `تم حفظ البريد محلياً. لم يتم إرساله`, en: `Email saved locally. It was not sent` }),
      });

      setIsComposeOpen(false);
      setComposeData({ to: "", subject: "", body: "", attachments: [], customerIds: [], templateId: null });
      setSelectedCustomers([]);
      fetchEmails();
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: error.message || t({ ar: "حدث خطأ أثناء إرسال البريد", en: "An error occurred while sending email" }),
        variant: "destructive",
      });
    }
  };

  const handleShareBooking = async (bookingId: string) => {
    // فتح نافذة البريد مع ربط الطلب
    setComposeData({
      to: "",
      subject: t({ ar: `مشاركة طلب حجز #${bookingId}`, en: `Share booking request #${bookingId}` }),
      body: t({ ar: `تم مشاركة طلب الحجز رقم ${bookingId}`, en: `Booking request #${bookingId} has been shared` }),
      attachments: [],
      customerIds: [],
      templateId: null
    });
    setIsComposeOpen(true);
  };

  const handleDeleteEmail = (emailId: string) => {
    // لا يتم حذف البريد نهائياً، فقط يتم أرشفته
    setEmails(emails.map(email => 
      email.id === emailId ? { ...email, isArchived: true, folder: 'archive' as const } : email
    ));
    if (selectedEmail?.id === emailId) {
      setSelectedEmail(null);
    }
    toast({
      title: t({ ar: "تم الأرشفة", en: "Archived" }),
      description: t({ ar: "تم أرشفة البريد (لم يتم حذفه نهائياً)", en: "Email archived (not permanently deleted)" }),
    });
  };

  const handleMoveToSpam = (emailId: string) => {
    setEmails(emails.map(email => 
      email.id === emailId ? { ...email, folder: 'spam' as const } : email
    ));
    if (selectedEmail?.id === emailId) {
      setSelectedEmail(null);
    }
    toast({
      title: t({ ar: "تم النقل", en: "Moved" }),
      description: t({ ar: "تم نقل البريد إلى البريد المزعج", en: "Email moved to spam" }),
    });
  };

  const handleStarEmail = (emailId: string) => {
    setEmails(emails.map(email => 
      email.id === emailId ? { ...email, starred: !email.starred } : email
    ));
  };

  const handleMarkAsRead = (emailId: string) => {
    setEmails(emails.map(email => 
      email.id === emailId ? { ...email, read: true } : email
    ));
  };

  const folderLabels: Record<string, { ar: string; en: string }> = {
    inbox: { ar: 'الوارد', en: 'Inbox' },
    sent: { ar: 'المرسل', en: 'Sent' },
    drafts: { ar: 'المسودات', en: 'Drafts' },
    trash: { ar: 'المهملات', en: 'Trash' },
    archive: { ar: 'الأرشيف', en: 'Archive' },
    spam: { ar: 'البريد المزعج', en: 'Spam' }
  };
  
  const getFolderLabel = (folder: string) => {
    const label = folderLabels[folder];
    return label ? (language === 'ar' ? label.ar : label.en) : folder;
  };

  if (loading || loadingEmails) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {t({ ar: 'البريد', en: 'Email' })}
              </h1>
              <p className="text-muted-foreground">
                {t({ ar: 'إدارة البريد الإلكتروني', en: 'Email Management' })}
              </p>
            </div>
            {userRole === 'admin' && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/email-settings')}
                className="gap-2"
              >
                <Settings className="w-4 h-4" />
                {t({ ar: 'إعدادات البريد', en: 'Email Settings' })}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* مربع تبديل البريد */}
            {emailAccounts.length > 1 && (
              <Select value={currentAccountId} onValueChange={setCurrentAccountId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue>
                    {emailAccounts.find(a => a.id === currentAccountId)?.email || 
                     emailAccounts.find(a => a.id === currentAccountId)?.incoming?.username || 
                     t({ ar: 'اختر البريد', en: 'Select Email' })}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {emailAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.email || account.incoming?.username || account.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {emailAccounts.length === 1 && emailAccounts[0] && (
              <Badge variant="outline" className="px-3 py-1">
                {emailAccounts[0].email || emailAccounts[0].incoming?.username || t({ ar: 'البريد الحالي', en: 'Current Email' })}
              </Badge>
            )}
            <Button onClick={() => setIsComposeOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              {t({ ar: 'رسالة جديدة', en: 'New Message' })}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Sidebar - Folders */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  {(['inbox', 'sent', 'drafts', 'archive', 'trash', 'spam'] as const).map((folder) => (
                    <Button
                      key={folder}
                      variant={currentFolder === folder ? "secondary" : "ghost"}
                      className="w-full justify-start gap-2"
                      onClick={() => setCurrentFolder(folder)}
                    >
                      {folder === 'inbox' && <Inbox className="w-4 h-4" />}
                      {folder === 'sent' && <Send className="w-4 h-4" />}
                      {folder === 'drafts' && <FileText className="w-4 h-4" />}
                      {folder === 'archive' && <Archive className="w-4 h-4" />}
                      {folder === 'trash' && <Trash2 className="w-4 h-4" />}
                      {folder === 'spam' && <Mail className="w-4 h-4" />}
                      {getFolderLabel(folder)}
                      {folder === 'inbox' && (
                        <Badge variant="secondary" className="ml-auto">
                          {emails.filter(e => e.folder === 'inbox' && !e.read).length}
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>
                
                {/* الفلاتر العمودية */}
                {availableFilters.filter(f => f.type === 'vertical').length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <p className="text-sm font-medium mb-2">{t({ ar: 'الفلاتر', en: 'Filters' })}</p>
                    <div className="space-y-2">
                      {availableFilters.filter(f => f.type === 'vertical').map((filter) => {
                        const FilterIcon = Filter;
                        const emailCount = getFilterEmailCount(filter.id);
                        const isSelected = selectedFilter === filter.id;
                        return (
                          <DroppableFilterBadge
                            key={filter.id}
                            filter={filter}
                            emailCount={emailCount}
                            isSelected={isSelected}
                            isVertical={true}
                            onSelect={() => {
                              if (selectedFilter === filter.id) {
                                setSelectedFilter(null);
                              } else {
                                setSelectedFilter(filter.id);
                              }
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder={t({ ar: 'ابحث في البريد...', en: 'Search emails...' })}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* الفلاتر الأفقية - أعلى قائمة البريد */}
            {availableFilters.filter(f => f.type === 'horizontal').length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {availableFilters.filter(f => f.type === 'horizontal').map((filter) => {
                  const FilterIcon = Filter;
                  const emailCount = getFilterEmailCount(filter.id);
                  const isSelected = selectedFilter === filter.id;
                  return (
                    <DroppableFilterBadge
                      key={filter.id}
                      filter={filter}
                      emailCount={emailCount}
                      isSelected={isSelected}
                      onSelect={() => {
                        if (selectedFilter === filter.id) {
                          setSelectedFilter(null);
                        } else {
                          setSelectedFilter(filter.id);
                        }
                      }}
                    />
                  );
                })}
              </div>
            )}

            {/* Email List */}
            {selectedEmail ? (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="mb-2">{selectedEmail.subject}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{selectedEmail.from}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{new Date(selectedEmail.date).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleStarEmail(selectedEmail.id)}
                      >
                        <Star className={`w-4 h-4 ${selectedEmail.starred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteEmail(selectedEmail.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedEmail(null)}
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none whitespace-pre-wrap">
                    {selectedEmail.body}
                  </div>
                  {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-medium mb-2">{t({ ar: 'المرفقات', en: 'Attachments' })}:</p>
                      <div className="space-y-2">
                        {selectedEmail.attachments.map((att, idx) => {
                          // تحديد نوع الملف واللون
                          const getFileType = (filename: string) => {
                            const ext = filename.split('.').pop()?.toLowerCase();
                            if (['pdf'].includes(ext || '')) return { type: 'PDF', color: '#ef4444' };
                            if (['doc', 'docx'].includes(ext || '')) return { type: 'DOC', color: '#3b82f6' };
                            if (['xls', 'xlsx'].includes(ext || '')) return { type: 'XLS', color: '#10b981' };
                            if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) return { type: 'IMG', color: '#f59e0b' };
                            if (['zip', 'rar', '7z'].includes(ext || '')) return { type: 'ZIP', color: '#8b5cf6' };
                            return { type: 'FILE', color: '#6b7280' };
                          };
                          const fileInfo = getFileType(att);
                          
                          return (
                            <div 
                              key={idx} 
                              className="flex items-center gap-2 text-sm p-2 rounded-lg border"
                              style={{ 
                                backgroundColor: `${fileInfo.color}15`,
                                borderColor: `${fileInfo.color}40`
                              }}
                            >
                              <Paperclip className="w-4 h-4" style={{ color: fileInfo.color }} />
                              <span className="flex-1">{att}</span>
                              <Badge 
                                variant="outline" 
                                className="text-xs"
                                style={{ 
                                  backgroundColor: fileInfo.color,
                                  color: 'white',
                                  borderColor: fileInfo.color
                                }}
                              >
                                {fileInfo.type}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div className="mt-6 flex gap-2">
                    <Button variant="outline" className="gap-2">
                      <Reply className="w-4 h-4" />
                      {t({ ar: 'رد', en: 'Reply' })}
                    </Button>
                    <Button variant="outline" className="gap-2">
                      <ReplyAll className="w-4 h-4" />
                      {t({ ar: 'رد على الكل', en: 'Reply All' })}
                    </Button>
                    <Button variant="outline" className="gap-2">
                      <Forward className="w-4 h-4" />
                      {t({ ar: 'إعادة توجيه', en: 'Forward' })}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  {filteredEmails.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>{t({ ar: 'لا توجد رسائل', en: 'No emails' })}</p>
                    </div>
                  ) : (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCorners}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                    >
                      <div className="divide-y">
                        {filteredEmails.map((email) => {
                          // تطبيق الفلاتر على البريد
                          const emailFilters = availableFilters.filter(f => 
                            email.filterIds?.includes(f.id)
                          );
                          
                          return (
                          <DraggableEmail 
                            key={email.id} 
                            email={email} 
                            emailFilters={emailFilters} 
                            onSelect={() => {
                              setSelectedEmail(email);
                              handleMarkAsRead(email.id);
                            }}
                            onStar={() => handleStarEmail(email.id)}
                            onDelete={() => handleDeleteEmail(email.id)}
                            onSpam={() => handleMoveToSpam(email.id)}
                          />
                        );
                      })}
                      </div>
                      <DragOverlay>
                        {draggedEmail ? (
                          <div className="p-4 bg-background border rounded-lg shadow-lg opacity-90 max-w-md">
                            <p className="font-medium truncate">{draggedEmail.subject}</p>
                            <p className="text-sm text-muted-foreground truncate">{draggedEmail.from}</p>
                          </div>
                        ) : null}
                      </DragOverlay>
                    </DndContext>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Compose Dialog */}
      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t({ ar: 'رسالة جديدة', en: 'New Message' })}</DialogTitle>
            <DialogDescription>
              {t({ ar: 'اكتب رسالتك وأرسلها', en: 'Write and send your message' })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                {t({ ar: 'اختيار العملاء', en: 'Select Customers' })}
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="w-4 h-4 mr-2" />
                    {selectedCustomers.length > 0 
                      ? `${selectedCustomers.length} ${t({ ar: 'عميل محدد', en: 'customers selected' })}`
                      : t({ ar: 'اختر العملاء...', en: 'Select customers...' })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput placeholder={t({ ar: 'ابحث عن عميل...', en: 'Search customer...' })} />
                    <div className="flex items-center justify-between p-2 border-b">
                      <div className="text-sm text-muted-foreground">
                        {selectedCustomers.length > 0 
                          ? `${selectedCustomers.length} ${t({ ar: 'محدد', en: 'selected' })}`
                          : t({ ar: 'لم يتم التحديد', en: 'None selected' })}
                      </div>
                      <div className="flex gap-2">
                        {selectedCustomers.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedCustomers([])}
                            className="h-7 text-xs"
                          >
                            {t({ ar: 'إلغاء تحديد الكل', en: 'Deselect All' })}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (selectedCustomers.length === customers.length) {
                              setSelectedCustomers([]);
                            } else {
                              setSelectedCustomers(customers.map(c => c.id));
                            }
                          }}
                          className="h-7 text-xs"
                        >
                          {selectedCustomers.length === customers.length 
                            ? t({ ar: 'إلغاء تحديد الكل', en: 'Deselect All' })
                            : t({ ar: 'تحديد الكل', en: 'Select All' })}
                        </Button>
                      </div>
                    </div>
                    <CommandList>
                      <CommandEmpty>{t({ ar: 'لا يوجد عملاء', en: 'No customers found' })}</CommandEmpty>
                      <CommandGroup>
                        {customers.map((customer) => (
                          <CommandItem
                            key={customer.id}
                            onSelect={() => {
                              if (selectedCustomers.includes(customer.id)) {
                                setSelectedCustomers(selectedCustomers.filter(id => id !== customer.id));
                              } else {
                                setSelectedCustomers([...selectedCustomers, customer.id]);
                              }
                            }}
                          >
                            <Checkbox
                              checked={selectedCustomers.includes(customer.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedCustomers([...selectedCustomers, customer.id]);
                                } else {
                                  setSelectedCustomers(selectedCustomers.filter(id => id !== customer.id));
                                }
                              }}
                            />
                            <div className="ml-2">
                              <p className="font-medium">{customer.full_name}</p>
                              <p className="text-xs text-muted-foreground">{customer.email}</p>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                {t({ ar: 'إلى', en: 'To' })}
              </label>
              <Input
                value={composeData.to}
                onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
                placeholder={t({ ar: 'البريد الإلكتروني', en: 'Email address' })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                {t({ ar: 'الموضوع', en: 'Subject' })}
              </label>
              <Input
                value={composeData.subject}
                onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                placeholder={t({ ar: 'موضوع الرسالة', en: 'Message subject' })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                {t({ ar: 'المحتوى', en: 'Content' })}
              </label>
              <Textarea
                value={composeData.body}
                onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
                placeholder={t({ ar: 'اكتب رسالتك هنا...', en: 'Write your message here...' })}
                rows={10}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsComposeOpen(false)}>
              {t({ ar: 'إلغاء', en: 'Cancel' })}
            </Button>
            <Button onClick={handleSendEmail} className="gap-2">
              <Send className="w-4 h-4" />
              {t({ ar: 'إرسال', en: 'Send' })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// مكون الفلتر القابل للإفلات
function DroppableFilterBadge({ 
  filter, 
  emailCount, 
  isSelected, 
  isVertical = false,
  onSelect 
}: { 
  filter: any; 
  emailCount: number; 
  isSelected: boolean; 
  isVertical?: boolean;
  onSelect: () => void;
}) {
  const { t } = useLanguage();
  const { setNodeRef, isOver } = useDroppable({
    id: filter.id,
  });
  const FilterIcon = Filter;

  return (
    <div
      ref={setNodeRef}
      id={filter.id}
      className={`${isVertical ? 'w-full' : ''} ${isOver ? 'ring-2 ring-primary ring-offset-2 transition-all' : ''}`}
    >
      <Badge
        variant="outline"
        className={`${isVertical ? 'w-full justify-start' : ''} cursor-pointer hover:opacity-80 transition-opacity p-2 relative ${isSelected ? 'ring-2 ring-offset-2' : ''}`}
        style={{
          backgroundColor: isVertical 
            ? (isSelected ? `${filter.color}30` : `${filter.color}15`)
            : filter.color,
          color: isVertical ? filter.color : 'white',
          borderColor: filter.color,
          borderTopWidth: !isVertical ? '4px' : undefined,
          borderLeftWidth: isVertical ? '4px' : undefined
        }}
        onClick={onSelect}
      >
        <FilterIcon className={`w-3 h-3 ${isVertical ? 'mr-2' : 'mr-1'}`} />
        <span className={isVertical ? 'flex-1' : ''}>{filter.name}</span>
        {emailCount > 0 && (
          <span 
            className={`ml-2 px-1.5 py-0.5 rounded-full text-xs font-semibold ${isVertical ? 'bg-white' : 'bg-white/20'}`}
            style={{ color: isVertical ? filter.color : undefined }}
          >
            {emailCount}
          </span>
        )}
      </Badge>
    </div>
  );
}

// مكون البريد القابل للسحب
function DraggableEmail({ 
  email, 
  emailFilters, 
  onSelect,
  onStar,
  onDelete,
  onSpam
}: { 
  email: Email; 
  emailFilters: any[]; 
  onSelect: () => void;
  onStar: () => void;
  onDelete: () => void;
  onSpam: () => void;
}) {
  const { t, language } = useLanguage();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: email.id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const borderStyle = {
    borderLeft: emailFilters.find(f => f.type === 'vertical') 
      ? `4px solid ${emailFilters.find(f => f.type === 'vertical')?.color || 'transparent'}` 
      : undefined,
    borderTop: emailFilters.find(f => f.type === 'horizontal') 
      ? `4px solid ${emailFilters.find(f => f.type === 'horizontal')?.color || 'transparent'}` 
      : undefined
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        ...borderStyle
      }}
      className={`p-4 hover:bg-muted/50 transition-colors relative ${
        !email.read ? 'bg-muted/30 font-semibold' : ''
      } ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start justify-between gap-4" onClick={onSelect}>
        <div 
          className="cursor-move flex-shrink-0 mr-2 opacity-50 hover:opacity-100"
          {...listeners}
          {...attributes}
        >
          <GripVertical className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium truncate">
              {email.from}
            </span>
            {email.starred && (
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            )}
            {!email.read && (
              <Badge variant="default" className="h-2 w-2 p-0 rounded-full" />
            )}
          </div>
          <p className="text-sm font-medium mb-1 truncate">
            {email.subject}
          </p>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {email.body}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-muted-foreground">
            {new Date(email.date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onStar}>
                <Star className="w-4 h-4 mr-2" />
                {t({ ar: email.starred ? 'إلغاء التمييز' : 'تمييز', en: email.starred ? 'Unstar' : 'Star' })}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                {t({ ar: 'أرشفة', en: 'Archive' })}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onSpam}>
                <Mail className="w-4 h-4 mr-2" />
                {t({ ar: 'نقل إلى Spam', en: 'Move to Spam' })}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {/* Display filter badges on email */}
      {emailFilters.length > 0 && (
        <div className="absolute top-2 left-2 flex gap-1 flex-wrap z-10">
          {emailFilters.map((filter) => (
            <Badge
              key={filter.id}
              variant="outline"
              className="text-xs"
              style={{
                backgroundColor: filter.color,
                color: 'white',
                borderColor: filter.color
              }}
            >
              {filter.name}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

