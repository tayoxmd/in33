/**
 * ⚠️ مهم جداً - صفحة إعدادات البريد - Email Settings
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
 * ═══════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Mail, 
  Server, 
  Users, 
  Palette, 
  Filter,
  Archive,
  Smartphone,
  Monitor,
  Tablet,
  Save,
  ArrowLeft,
  Plus,
  X,
  GripVertical
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { HexColorPicker } from "react-colorful";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function EmailSettings() {
  const { userRole, loading, user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // صلاحيات الوصول
  const [accessPermissions, setAccessPermissions] = useState<string[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  
  // إعدادات البريد - دعم حسابات متعددة
  const [emailAccounts, setEmailAccounts] = useState<any[]>([{
    id: 'default',
    email: user?.email || "",
    incoming: {
      server: "",
      port: 993,
      security: "ssl" as "ssl" | "tls" | "none",
      username: user?.email || "",
      password: "",
      auth: "normal_password" as "normal_password" | "password" | "oauth2" | "outlook",
      normal_password: ""
    },
    outgoing: {
      server: "",
      port: 587,
      security: "tls" as "ssl" | "tls" | "none",
      username: user?.email || "",
      password: "",
      auth: "normal_password" as "normal_password" | "password" | "oauth2" | "outlook",
      normal_password: ""
    },
    verified: false,
    verification_status: "pending" as "pending" | "verified" | "failed",
    verification_message: ""
  }]);
  const [currentAccountId, setCurrentAccountId] = useState('default');
  
  // للتوافق مع الكود القديم
  const currentAccount = useMemo(() => {
    return emailAccounts.find(a => a.id === currentAccountId) || emailAccounts[0] || {
      id: 'default',
      email: user?.email || "",
      incoming: {
        server: "",
        port: 993,
        security: "ssl" as "ssl" | "tls" | "none",
        username: user?.email || "",
        password: "",
        auth: "normal_password" as "normal_password" | "password" | "oauth2" | "outlook",
        normal_password: ""
      },
      outgoing: {
        server: "",
        port: 587,
        security: "tls" as "ssl" | "tls" | "none",
        username: user?.email || "",
        password: "",
        auth: "normal_password" as "normal_password" | "password" | "oauth2" | "outlook",
        normal_password: ""
      },
      verified: false,
      verification_status: "pending" as "pending" | "verified" | "failed",
      verification_message: ""
    };
  }, [emailAccounts, currentAccountId, user?.email]);
  
  const incomingSettings = useMemo(() => {
    return currentAccount?.incoming || {
      server: "",
      port: 993,
      security: "ssl" as "ssl" | "tls" | "none",
      username: user?.email || "",
      password: "",
      auth: "normal_password" as "normal_password" | "password" | "oauth2" | "outlook",
      normal_password: ""
    };
  }, [currentAccount, user?.email]);
  
  const outgoingSettings = useMemo(() => {
    return currentAccount?.outgoing || {
      server: "",
      port: 587,
      security: "tls" as "ssl" | "tls" | "none",
      username: user?.email || "",
      password: "",
      auth: "normal_password" as "normal_password" | "password" | "oauth2" | "outlook",
      normal_password: ""
    };
  }, [currentAccount, user?.email]);
  
  const setIncomingSettings = (settings: any) => {
    setEmailAccounts(prev => prev.map(acc => 
      acc.id === currentAccountId 
        ? { ...acc, incoming: { ...acc.incoming, ...settings } }
        : acc
    ));
  };
  
  const setOutgoingSettings = (settings: any) => {
    setEmailAccounts(prev => prev.map(acc => 
      acc.id === currentAccountId 
        ? { ...acc, outgoing: { ...acc.outgoing, ...settings } }
        : acc
    ));
  };
  
  const handleAddEmailAccount = async () => {
    const newAccount = {
      id: `account-${Date.now()}`,
      email: "",
      incoming: {
        server: "",
        port: 993,
        security: "ssl" as "ssl" | "tls" | "none",
        username: "",
        password: "",
        auth: "normal_password" as "normal_password" | "password" | "oauth2" | "outlook",
        normal_password: ""
      },
      outgoing: {
        server: "",
        port: 587,
        security: "tls" as "ssl" | "tls" | "none",
        username: "",
        password: "",
        auth: "normal_password" as "normal_password" | "password" | "oauth2" | "outlook",
        normal_password: ""
      },
      verified: false,
      verification_status: "pending" as "pending" | "verified" | "failed",
      verification_message: ""
    };
    setEmailAccounts([...emailAccounts, newAccount]);
    setCurrentAccountId(newAccount.id);
    
    // التحقق من الإيميل تلقائياً عند إضافته
    if (newAccount.email) {
      await verifyEmailAccount(newAccount.id);
    }
  };

  const verifyEmailAccount = async (accountId: string) => {
    const account = emailAccounts.find(a => a.id === accountId);
    if (!account || !account.email) return;

    try {
      // تحديث حالة التحقق إلى "جاري التحقق"
      setEmailAccounts(prev => prev.map(a => 
        a.id === accountId 
          ? { ...a, verification_status: "pending", verification_message: t({ ar: "جاري التحقق...", en: "Verifying..." }) }
          : a
      ));

      // التحقق من صحة الإيميل
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(account.email)) {
        setEmailAccounts(prev => prev.map(a => 
          a.id === accountId 
            ? { ...a, verified: false, verification_status: "failed", verification_message: t({ ar: "البريد الإلكتروني غير صحيح", en: "Invalid email address" }) }
            : a
        ));
        return;
      }

      // التحقق من إعدادات SMTP
      if (account.outgoing && account.outgoing.server) {
        try {
          const { data, error } = await supabase.functions.invoke('verify-email', {
            body: {
              email: account.email,
              smtp_settings: account.outgoing
            }
          });

          if (error) throw error;

          if (data && data.verified) {
            setEmailAccounts(prev => prev.map(a => 
              a.id === accountId 
                ? { ...a, verified: true, verification_status: "verified", verification_message: t({ ar: "تم التحقق بنجاح", en: "Verified successfully" }) }
                : a
            ));
          } else {
            setEmailAccounts(prev => prev.map(a => 
              a.id === accountId 
                ? { ...a, verified: false, verification_status: "failed", verification_message: data?.message || t({ ar: "فشل التحقق", en: "Verification failed" }) }
                : a
            ));
          }
        } catch (verifyError: any) {
          setEmailAccounts(prev => prev.map(a => 
            a.id === accountId 
              ? { ...a, verified: false, verification_status: "failed", verification_message: verifyError.message || t({ ar: "خطأ في التحقق", en: "Verification error" }) }
              : a
          ));
        }
      } else {
        setEmailAccounts(prev => prev.map(a => 
          a.id === accountId 
            ? { ...a, verified: false, verification_status: "pending", verification_message: t({ ar: "يرجى إعداد SMTP أولاً", en: "Please configure SMTP first" }) }
            : a
        ));
      }
    } catch (error: any) {
      console.error('Error verifying email:', error);
      setEmailAccounts(prev => prev.map(a => 
        a.id === accountId 
          ? { ...a, verified: false, verification_status: "failed", verification_message: error.message || t({ ar: "خطأ في التحقق", en: "Verification error" }) }
          : a
      ));
    }
  };
  
  const handleRemoveEmailAccount = (accountId: string) => {
    if (emailAccounts.length === 1) {
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: t({ ar: "يجب أن يكون هناك حساب بريد واحد على الأقل", en: "At least one email account is required" }),
        variant: "destructive",
      });
      return;
    }
    setEmailAccounts(emailAccounts.filter(acc => acc.id !== accountId));
    if (currentAccountId === accountId) {
      setCurrentAccountId(emailAccounts[0].id);
    }
  };
  
  // ألوان البريد
  const [emailColors, setEmailColors] = useState({
    inbox: "#3b82f6",
    sent: "#10b981",
    drafts: "#f59e0b",
    archive: "#8b5cf6",
    trash: "#ef4444",
    spam: "#6b7280"
  });
  
  // الفلاتر
  const [filters, setFilters] = useState<any[]>([]);
  const [newFilter, setNewFilter] = useState({
    name: "",
    color: "#3b82f6",
    type: "horizontal" as "horizontal" | "vertical",
    conditions: [] as any[]
  });
  
  // القوالب
  const [templates, setTemplates] = useState<any[]>([]);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    content: "",
    variables: [] as string[]
  });
  
  // إعدادات التصميم حسب الجهاز
  const [deviceTemplates, setDeviceTemplates] = useState({
    mobile: "",
    desktop: "",
    tablet: ""
  });
  
  // الملفات الإضافية (Custom Folders)
  const [customFolders, setCustomFolders] = useState<any[]>([]);
  const [newCustomFolder, setNewCustomFolder] = useState({
    name: "",
    name_en: "",
    color: "#3b82f6"
  });
  
  // الأرشيف
  const [archivedEmails, setArchivedEmails] = useState<any[]>([]);
  const [loadingArchived, setLoadingArchived] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (userRole !== 'admin') {
        navigate('/');
      } else {
        // جلب البيانات بشكل متوازي
        const loadData = async () => {
          try {
            await Promise.all([
              fetchSettings().catch(err => {
                console.error('Error in fetchSettings:', err);
                setLoadingSettings(false);
              }),
              fetchEmployees().catch(err => {
                console.error('Error in fetchEmployees:', err);
              })
            ]);
          } catch (error) {
            console.error('Error loading data:', error);
            setLoadingSettings(false);
          }
        };
        loadData();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole, loading, navigate]);

  const fetchSettings = async () => {
    setLoadingSettings(true);
    try {
      // جلب من localStorage أولاً (أسرع)
      try {
        const savedFilters = localStorage.getItem('email_filters');
        const savedTemplates = localStorage.getItem('email_templates');
        const savedIncoming = localStorage.getItem('email_incoming_settings');
        const savedOutgoing = localStorage.getItem('email_outgoing_settings');
        const savedColors = localStorage.getItem('email_colors');
        const savedAccess = localStorage.getItem('email_access_permissions');
        const savedDeviceTemplates = localStorage.getItem('email_device_templates');
        const savedCustomFolders = localStorage.getItem('email_custom_folders');
        
        if (savedFilters) setFilters(JSON.parse(savedFilters));
        if (savedTemplates) setTemplates(JSON.parse(savedTemplates));
        if (savedIncoming) setIncomingSettings(JSON.parse(savedIncoming));
        if (savedOutgoing) setOutgoingSettings(JSON.parse(savedOutgoing));
        if (savedColors) setEmailColors(JSON.parse(savedColors));
        if (savedAccess) setAccessPermissions(JSON.parse(savedAccess));
        if (savedDeviceTemplates) setDeviceTemplates(JSON.parse(savedDeviceTemplates));
        if (savedCustomFolders) setCustomFolders(JSON.parse(savedCustomFolders));
      } catch (localError) {
        console.warn('Error loading from localStorage:', localError);
      }

      // ثم جلب من قاعدة البيانات (أحدث)
      try {
        const { data, error } = await supabase
          .from('email_settings')
          .select('*')
          .eq('id', 'main')
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.warn('Error fetching from database, using localStorage:', error);
        } else if (data) {
          // تحديث البيانات من قاعدة البيانات
          if (data.email_accounts && Array.isArray(data.email_accounts) && data.email_accounts.length > 0) {
            setEmailAccounts(data.email_accounts);
            setCurrentAccountId(data.email_accounts[0].id || 'default');
            localStorage.setItem('email_accounts', JSON.stringify(data.email_accounts));
            localStorage.setItem('current_account_id', data.email_accounts[0].id || 'default');
          }
          if (data.email_colors) {
            setEmailColors(data.email_colors);
            localStorage.setItem('email_colors', JSON.stringify(data.email_colors));
          }
          if (data.filters) {
            setFilters(data.filters);
            localStorage.setItem('email_filters', JSON.stringify(data.filters));
          }
          if (data.templates && Array.isArray(data.templates)) {
            setTemplates(data.templates);
            localStorage.setItem('email_templates', JSON.stringify(data.templates));
          } else {
            // إذا لم تكن هناك قوالب في قاعدة البيانات، استخدم localStorage
            const savedTemplates = localStorage.getItem('email_templates');
            if (savedTemplates) {
              try {
                const templates = JSON.parse(savedTemplates);
                if (Array.isArray(templates)) {
                  setTemplates(templates);
                }
              } catch (e) {
                console.warn('Error parsing templates from localStorage:', e);
              }
            }
          }
          if (data.device_templates) {
            setDeviceTemplates(data.device_templates);
            localStorage.setItem('email_device_templates', JSON.stringify(data.device_templates));
          }
          if (data.access_permissions) {
            setAccessPermissions(data.access_permissions);
            localStorage.setItem('email_access_permissions', JSON.stringify(data.access_permissions));
          }
          if (data.custom_folders) {
            setCustomFolders(data.custom_folders);
            localStorage.setItem('email_custom_folders', JSON.stringify(data.custom_folders));
          }
        }
      } catch (dbError) {
        console.warn('Could not fetch from database, using localStorage:', dbError);
      }

      setLoadingSettings(false);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setLoadingSettings(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      // جلب جميع المستخدمين من فئات الموظفين (employee, manager, company)
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['employee', 'manager', 'company'])
        .eq('active', true);
      
      if (rolesError) throw rolesError;
      
      if (rolesData && rolesData.length > 0) {
        const userIds = rolesData.map(r => r.user_id);
        
        // جلب بيانات المستخدمين من profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, phone')
          .in('id', userIds);
        
        if (profilesError) throw profilesError;
        
        // دمج البيانات
        const employeesWithRoles = profilesData?.map(profile => {
          const userRoles = rolesData.filter(r => r.user_id === profile.id);
          const primaryRole = userRoles[0]?.role || 'employee';
          return {
            id: profile.id,
            full_name: profile.full_name || '',
            email: (profile as any).email || '',
            phone: profile.phone || '',
            role: primaryRole,
            roles: userRoles.map(r => r.role)
          };
        }) || [];
        
        setEmployees(employeesWithRoles);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: t({ ar: "حدث خطأ أثناء تحميل الموظفين", en: "Error loading employees" }),
        variant: "destructive",
      });
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // حفظ الإعدادات في localStorage أولاً (لضمان الحفظ الفوري)
      localStorage.setItem('email_accounts', JSON.stringify(emailAccounts));
      localStorage.setItem('current_account_id', currentAccountId);
      localStorage.setItem('email_filters', JSON.stringify(filters));
      localStorage.setItem('email_templates', JSON.stringify(templates));
      localStorage.setItem('email_colors', JSON.stringify(emailColors));
      localStorage.setItem('email_access_permissions', JSON.stringify(accessPermissions));
      localStorage.setItem('email_device_templates', JSON.stringify(deviceTemplates));
      localStorage.setItem('email_custom_folders', JSON.stringify(customFolders));
      
      // حفظ في Supabase
      try {
        const settingsData = {
          email_accounts: emailAccounts,
          email_colors: emailColors,
          filters: filters,
          templates: templates,
          device_templates: deviceTemplates,
          access_permissions: accessPermissions,
          updated_at: new Date().toISOString()
        };

        const { error: settingsError } = await supabase
          .from('email_settings')
          .upsert({
            id: 'main',
            ...settingsData
          }, {
            onConflict: 'id'
          });

        if (settingsError) {
          console.error('Error saving to database:', settingsError);
          throw settingsError;
        }

        // استدعاء البريد تلقائياً من السيرفر بعد حفظ الإعدادات
        const currentAccount = emailAccounts.find(a => a.id === currentAccountId);
        if (currentAccount && currentAccount.incoming.server) {
          try {
            const { data: fetchResult, error: fetchError } = await supabase.functions.invoke('fetch-emails', {
              body: {
                account_id: currentAccountId,
                imap_settings: currentAccount.incoming,
                smtp_settings: currentAccount.outgoing
              }
            });

            if (!fetchError && fetchResult) {
              toast({
                title: t({ ar: "تم الحفظ والاستدعاء", en: "Saved and Fetched" }),
                description: t({ ar: `تم حفظ الإعدادات واستدعاء ${fetchResult.count || 0} بريد من السيرفر`, en: `Settings saved and ${fetchResult.count || 0} emails fetched from server` }),
              });
            }
          } catch (fetchErr) {
            console.warn('Could not fetch emails automatically:', fetchErr);
            // لا نوقف العملية إذا فشل الاستدعاء
          }
        }
      } catch (dbError: any) {
        console.error('Could not save to database:', dbError);
        toast({
          title: t({ ar: "تحذير", en: "Warning" }),
          description: t({ ar: "تم الحفظ محلياً فقط. قد لا تكون الإعدادات متاحة على أجهزة أخرى", en: "Saved locally only. Settings may not be available on other devices" }),
          variant: "destructive",
        });
      }

      toast({
        title: t({ ar: "تم الحفظ", en: "Saved" }),
        description: t({ ar: "تم حفظ إعدادات البريد بنجاح", en: "Email settings saved successfully" }),
      });
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: error.message || t({ ar: "حدث خطأ أثناء الحفظ", en: "An error occurred while saving" }),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddFilter = () => {
    if (!newFilter.name) {
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: t({ ar: "يرجى إدخال اسم الفلتر", en: "Please enter filter name" }),
        variant: "destructive",
      });
      return;
    }
    setFilters([...filters, { ...newFilter, id: Date.now().toString() }]);
    setNewFilter({ name: "", color: "#3b82f6", type: "horizontal", conditions: [] });
    toast({
      title: t({ ar: "تم الإضافة", en: "Added" }),
      description: t({ ar: "تم إضافة الفلتر بنجاح", en: "Filter added successfully" }),
    });
  };

  const handleAddTemplate = () => {
    if (!newTemplate.name || !newTemplate.content) {
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: t({ ar: "يرجى إدخال اسم القالب والمحتوى", en: "Please enter template name and content" }),
        variant: "destructive",
      });
      return;
    }
    const updatedTemplates = [...templates, { ...newTemplate, id: Date.now().toString() }];
    setTemplates(updatedTemplates);
    
    // حفظ فوري في localStorage
    localStorage.setItem('email_templates', JSON.stringify(updatedTemplates));
    
    setNewTemplate({ name: "", content: "", variables: [] });
    toast({
      title: t({ ar: "تم الإضافة", en: "Added" }),
      description: t({ ar: "تم إضافة القالب بنجاح", en: "Template added successfully" }),
    });
  };

  // إذا كان التحميل لا يزال جارياً، عرض spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // إذا لم يكن المستخدم admin، لا نعرض شيئاً (سيتم إعادة التوجيه)
  if (userRole !== 'admin') {
    return null;
  }

  // إذا كان التحميل لا يزال جارياً، عرض spinner
  if (loadingSettings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/email')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {t({ ar: 'إعدادات البريد', en: 'Email Settings' })}
              </h1>
              <p className="text-muted-foreground">
                {t({ ar: 'إدارة إعدادات البريد الإلكتروني', en: 'Manage email settings' })}
              </p>
            </div>
          </div>
          <Button onClick={handleSaveSettings} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />
            {saving ? t({ ar: 'جاري الحفظ...', en: 'Saving...' }) : t({ ar: 'حفظ', en: 'Save' })}
          </Button>
        </div>

        <Tabs defaultValue="access" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 gap-1 sm:gap-2">
            <TabsTrigger value="access" className="text-xs sm:text-sm">{t({ ar: 'الصلاحيات', en: 'Access' })}</TabsTrigger>
            <TabsTrigger value="mail" className="text-xs sm:text-sm">{t({ ar: 'إعدادات البريد', en: 'Mail Settings' })}</TabsTrigger>
            <TabsTrigger value="filters" className="text-xs sm:text-sm">{t({ ar: 'الفلاتر', en: 'Filters' })}</TabsTrigger>
            <TabsTrigger value="templates" className="text-xs sm:text-sm">{t({ ar: 'القوالب', en: 'Templates' })}</TabsTrigger>
            <TabsTrigger value="design" className="text-xs sm:text-sm">{t({ ar: 'التصميم', en: 'Design' })}</TabsTrigger>
            <TabsTrigger value="archive" className="text-xs sm:text-sm">{t({ ar: 'الأرشيف', en: 'Archive' })}</TabsTrigger>
          </TabsList>

          {/* صلاحيات الوصول */}
          <TabsContent value="access">
            <Card>
              <CardHeader>
                <CardTitle>{t({ ar: 'صلاحيات الوصول', en: 'Access Permissions' })}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="mb-2 block">
                    {t({ ar: 'الموظفون الذين يمكنهم الوصول للبريد', en: 'Employees with email access' })}
                  </Label>
                  <div className="space-y-2">
                    {employees.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {t({ ar: 'لا يوجد موظفون', en: 'No employees found' })}
                      </p>
                    ) : (
                      employees.map((employee) => (
                        <div key={employee.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{employee.full_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {employee.email || employee.phone || t({ ar: 'لا يوجد بريد', en: 'No email' })}
                              </p>
                              <Badge variant="outline" className="text-xs mt-1">
                                {employee.role === 'employee' ? t({ ar: 'موظف', en: 'Employee' }) :
                                 employee.role === 'manager' ? t({ ar: 'مدير', en: 'Manager' }) :
                                 employee.role === 'company' ? t({ ar: 'شركة', en: 'Company' }) : employee.role}
                              </Badge>
                            </div>
                          </div>
                          <Switch
                            checked={accessPermissions.includes(employee.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setAccessPermissions([...accessPermissions, employee.id]);
                              } else {
                                setAccessPermissions(accessPermissions.filter(id => id !== employee.id));
                              }
                            }}
                          />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mail Settings - دمج Incoming و Outgoing */}
          <TabsContent value="mail">
            <div className="space-y-6">
              {/* قائمة اختيار الحساب */}
              {emailAccounts.length > 1 && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <Label>{t({ ar: 'الحساب الحالي', en: 'Current Account' })}</Label>
                      <Select value={currentAccountId} onValueChange={setCurrentAccountId}>
                        <SelectTrigger className="w-[250px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {emailAccounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.email || account.incoming.username || t({ ar: 'حساب بدون بريد', en: 'Account without email' })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Mail Settings - دمج Incoming و Outgoing */}
              <Card>
                <CardHeader>
                  <CardTitle>{t({ ar: 'إعدادات البريد (IMAP & SMTP)', en: 'Mail Settings (IMAP & SMTP)' })}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* البريد الإلكتروني */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>{t({ ar: 'البريد الإلكتروني', en: 'Email Address' })}</Label>
                      {currentAccount.verification_status && (
                        <Badge 
                          variant={currentAccount.verification_status === "verified" ? "default" : 
                                  currentAccount.verification_status === "failed" ? "destructive" : "secondary"}
                        >
                          {currentAccount.verification_status === "verified" ? t({ ar: "✓ تم التحقق", en: "✓ Verified" }) :
                           currentAccount.verification_status === "failed" ? t({ ar: "✗ فشل التحقق", en: "✗ Failed" }) :
                           t({ ar: "⏳ جاري التحقق", en: "⏳ Verifying" })}
                        </Badge>
                      )}
                    </div>
                    <Input
                      value={currentAccount.email}
                      onChange={async (e) => {
                        const updatedAccounts = emailAccounts.map(acc =>
                          acc.id === currentAccountId ? { ...acc, email: e.target.value } : acc
                        );
                        setEmailAccounts(updatedAccounts);
                        
                        // التحقق من الإيميل عند تغييره
                        if (e.target.value) {
                          setTimeout(() => {
                            verifyEmailAccount(currentAccountId);
                          }, 1000);
                        }
                      }}
                      placeholder={user?.email || ""}
                    />
                    {currentAccount.verification_message && (
                      <p className={`text-xs mt-1 ${
                        currentAccount.verification_status === "verified" ? "text-green-600" :
                        currentAccount.verification_status === "failed" ? "text-red-600" :
                        "text-yellow-600"
                      }`}>
                        {currentAccount.verification_message}
                      </p>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => verifyEmailAccount(currentAccountId)}
                    >
                      {t({ ar: 'التحقق من البريد', en: 'Verify Email' })}
                    </Button>
                  </div>

                  {/* Incoming (IMAP) */}
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-4">{t({ ar: 'البريد الوارد (IMAP)', en: 'Incoming Mail (IMAP)' })}</h3>
                    <div className="space-y-4">
                      <div>
                        <Label>{t({ ar: 'خادم البريد', en: 'Mail Server' })}</Label>
                        <Input
                          value={incomingSettings.server}
                          onChange={(e) => setIncomingSettings({ ...incomingSettings, server: e.target.value })}
                          placeholder="imap.gmail.com"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>{t({ ar: 'المنفذ', en: 'Port' })}</Label>
                          <Input
                            type="number"
                            value={incomingSettings.port}
                            onChange={(e) => setIncomingSettings({ ...incomingSettings, port: parseInt(e.target.value) || 993 })}
                          />
                        </div>
                        <div>
                          <Label>{t({ ar: 'الأمان', en: 'Security' })}</Label>
                          <Select
                            value={incomingSettings.security}
                            onValueChange={(value: "ssl" | "tls" | "none") => 
                              setIncomingSettings({ ...incomingSettings, security: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem key="incoming-ssl" value="ssl">SSL</SelectItem>
                              <SelectItem key="incoming-tls" value="tls">TLS</SelectItem>
                              <SelectItem key="incoming-none" value="none">{t({ ar: 'بدون', en: 'None' })}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label>{t({ ar: 'طريقة المصادقة', en: 'Authentication' })}</Label>
                        <Select
                          value={(incomingSettings as any).auth || "normal_password"}
                          onValueChange={(value: "normal_password" | "password" | "oauth2" | "outlook") => 
                            setIncomingSettings({ ...incomingSettings, auth: value } as any)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem key="auth-normal-password" value="normal_password">{t({ ar: 'كلمة مرور عادية', en: 'Normal Password' })}</SelectItem>
                            <SelectItem key="auth-password" value="password">{t({ ar: 'كلمة مرور مشفرة', en: 'Encrypted Password' })}</SelectItem>
                            <SelectItem key="auth-oauth2" value="oauth2">OAuth2</SelectItem>
                            <SelectItem key="auth-outlook" value="outlook">Outlook</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>{t({ ar: 'اسم المستخدم / البريد الإلكتروني', en: 'Username / Email' })}</Label>
                        <Input
                          value={incomingSettings.username}
                          onChange={(e) => setIncomingSettings({ ...incomingSettings, username: e.target.value })}
                          placeholder={user?.email || ""}
                        />
                      </div>
                      {((incomingSettings as any).auth === "normal_password" || (incomingSettings as any).auth === "password") && (
                        <div>
                          <Label>
                            {(incomingSettings as any).auth === "normal_password" 
                              ? t({ ar: 'كلمة المرور العادية', en: 'Normal Password' })
                              : t({ ar: 'كلمة المرور المشفرة', en: 'Encrypted Password' })}
                          </Label>
                          <Input
                            type="password"
                            value={(incomingSettings as any).auth === "normal_password" 
                              ? (incomingSettings as any).normal_password || incomingSettings.password
                              : incomingSettings.password}
                            onChange={(e) => {
                              if ((incomingSettings as any).auth === "normal_password") {
                                setIncomingSettings({ ...incomingSettings, normal_password: e.target.value, password: e.target.value } as any);
                              } else {
                                setIncomingSettings({ ...incomingSettings, password: e.target.value });
                              }
                            }}
                            placeholder="••••••••"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Outgoing (SMTP) */}
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-4">{t({ ar: 'البريد الصادر (SMTP)', en: 'Outgoing Mail (SMTP)' })}</h3>
                    <div className="space-y-4">
                      <div>
                        <Label>{t({ ar: 'خادم البريد', en: 'Mail Server' })}</Label>
                        <Input
                          value={outgoingSettings.server}
                          onChange={(e) => setOutgoingSettings({ ...outgoingSettings, server: e.target.value })}
                          placeholder="smtp.gmail.com"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>{t({ ar: 'المنفذ', en: 'Port' })}</Label>
                          <Input
                            type="number"
                            value={outgoingSettings.port}
                            onChange={(e) => setOutgoingSettings({ ...outgoingSettings, port: parseInt(e.target.value) || 587 })}
                          />
                        </div>
                        <div>
                          <Label>{t({ ar: 'الأمان', en: 'Security' })}</Label>
                          <Select
                            value={outgoingSettings.security}
                            onValueChange={(value: "ssl" | "tls" | "none") => 
                              setOutgoingSettings({ ...outgoingSettings, security: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem key="incoming-ssl" value="ssl">SSL</SelectItem>
                              <SelectItem key="incoming-tls" value="tls">TLS</SelectItem>
                              <SelectItem key="incoming-none" value="none">{t({ ar: 'بدون', en: 'None' })}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label>{t({ ar: 'طريقة المصادقة', en: 'Authentication' })}</Label>
                        <Select
                          value={(outgoingSettings as any).auth || "normal_password"}
                          onValueChange={(value: "normal_password" | "password" | "oauth2" | "outlook") => 
                            setOutgoingSettings({ ...outgoingSettings, auth: value } as any)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem key="auth-normal-password" value="normal_password">{t({ ar: 'كلمة مرور عادية', en: 'Normal Password' })}</SelectItem>
                            <SelectItem key="auth-password" value="password">{t({ ar: 'كلمة مرور مشفرة', en: 'Encrypted Password' })}</SelectItem>
                            <SelectItem key="auth-oauth2" value="oauth2">OAuth2</SelectItem>
                            <SelectItem key="auth-outlook" value="outlook">Outlook</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>{t({ ar: 'اسم المستخدم / البريد الإلكتروني', en: 'Username / Email' })}</Label>
                        <Input
                          value={outgoingSettings.username}
                          onChange={(e) => setOutgoingSettings({ ...outgoingSettings, username: e.target.value })}
                          placeholder={user?.email || ""}
                        />
                      </div>
                      {((outgoingSettings as any).auth === "normal_password" || (outgoingSettings as any).auth === "password") && (
                        <div>
                          <Label>
                            {(outgoingSettings as any).auth === "normal_password" 
                              ? t({ ar: 'كلمة المرور العادية', en: 'Normal Password' })
                              : t({ ar: 'كلمة المرور المشفرة', en: 'Encrypted Password' })}
                          </Label>
                          <Input
                            type="password"
                            value={(outgoingSettings as any).auth === "normal_password" 
                              ? (outgoingSettings as any).normal_password || outgoingSettings.password
                              : outgoingSettings.password}
                            onChange={(e) => {
                              if ((outgoingSettings as any).auth === "normal_password") {
                                setOutgoingSettings({ ...outgoingSettings, normal_password: e.target.value, password: e.target.value } as any);
                              } else {
                                setOutgoingSettings({ ...outgoingSettings, password: e.target.value });
                              }
                            }}
                            placeholder="••••••••"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* زر إضافة بريد جديد */}
              {emailAccounts.length > 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <Button 
                      variant="outline" 
                      className="w-full gap-2"
                      onClick={handleAddEmailAccount}
                    >
                      <Plus className="w-4 h-4" />
                      {t({ ar: 'إضافة بريد إلكتروني جديد', en: 'Add New Email Account' })}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Filters */}
          <TabsContent value="filters">
            <Card>
              <CardHeader>
                <CardTitle>{t({ ar: 'فلاتر البريد', en: 'Email Filters' })}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border rounded-lg p-4 space-y-4">
                  <div>
                    <Label>{t({ ar: 'اسم الفلتر', en: 'Filter Name' })}</Label>
                    <Input
                      value={newFilter.name}
                      onChange={(e) => setNewFilter({ ...newFilter, name: e.target.value })}
                      placeholder={t({ ar: 'مثال: مهم، مدفوع، طلب جديد', en: 'Example: Important, Paid, New Request' })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{t({ ar: 'لون الفلتر', en: 'Filter Color' })}</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <div 
                              className="w-4 h-4 rounded mr-2" 
                              style={{ backgroundColor: newFilter.color }}
                            />
                            {newFilter.color}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent>
                          <HexColorPicker 
                            color={newFilter.color} 
                            onChange={(color) => setNewFilter({ ...newFilter, color })}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label>{t({ ar: 'نوع الفلتر', en: 'Filter Type' })}</Label>
                      <Select
                        value={newFilter.type}
                        onValueChange={(value: "horizontal" | "vertical") => 
                          setNewFilter({ ...newFilter, type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="horizontal">{t({ ar: 'أفقي', en: 'Horizontal' })}</SelectItem>
                          <SelectItem value="vertical">{t({ ar: 'عمودي', en: 'Vertical' })}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={handleAddFilter} className="w-full gap-2">
                    <Plus className="w-4 h-4" />
                    {t({ ar: 'إضافة فلتر', en: 'Add Filter' })}
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>{t({ ar: 'الفلاتر المضافة', en: 'Added Filters' })}</Label>
                  {filters.map((filter) => (
                    <div 
                      key={filter.id} 
                      className="flex items-center justify-between p-3 border rounded-lg"
                      style={{ borderLeftColor: filter.color, borderLeftWidth: '4px' }}
                    >
                      <div className="flex items-center gap-3">
                        <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                        <div 
                          className="w-4 h-4 rounded" 
                          style={{ backgroundColor: filter.color }}
                        />
                        <div>
                          <p className="font-medium">{filter.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {filter.type === 'horizontal' ? t({ ar: 'أفقي', en: 'Horizontal' }) : t({ ar: 'عمودي', en: 'Vertical' })}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setFilters(filters.filter(f => f.id !== filter.id))}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates */}
          <TabsContent value="templates">
            <Card>
              <CardHeader>
                <CardTitle>{t({ ar: 'قوالب البريد', en: 'Email Templates' })}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border rounded-lg p-4 space-y-4">
                  <div>
                    <Label>{t({ ar: 'اسم القالب', en: 'Template Name' })}</Label>
                    <Input
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                      placeholder={t({ ar: 'مثال: رد تلقائي، إشعار حجز', en: 'Example: Auto Reply, Booking Notification' })}
                    />
                  </div>
                  <div>
                    <Label>{t({ ar: 'محتوى القالب', en: 'Template Content' })}</Label>
                    <Textarea
                      value={newTemplate.content}
                      onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                      placeholder={t({ ar: 'اكتب محتوى القالب هنا...', en: 'Write template content here...' })}
                      rows={6}
                    />
                  </div>
                  <Button onClick={handleAddTemplate} className="w-full gap-2">
                    <Plus className="w-4 h-4" />
                    {t({ ar: 'إضافة قالب', en: 'Add Template' })}
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>{t({ ar: 'القوالب المضافة', en: 'Added Templates' })}</Label>
                  {templates.map((template) => (
                    <div 
                      key={template.id} 
                      className="flex items-center justify-between p-3 border rounded-lg cursor-move hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{template.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{template.content}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const updated = templates.filter(t => t.id !== template.id);
                            setTemplates(updated);
                            localStorage.setItem('email_templates', JSON.stringify(updated));
                            toast({
                              title: t({ ar: "تم الحذف", en: "Deleted" }),
                              description: t({ ar: "تم حذف القالب بنجاح", en: "Template deleted successfully" }),
                            });
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Archive */}
          <TabsContent value="archive">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Archive className="w-5 h-5" />
                  {t({ ar: 'الأرشيف المحفوظ', en: 'Archived Emails' })}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground mb-4">
                  {t({ ar: 'البريد المؤرشف (لم يتم حذفه نهائياً)', en: 'Archived emails (not permanently deleted)' })}
                </div>
                {loadingArchived ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner size="md" />
                  </div>
                ) : archivedEmails.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t({ ar: 'لا يوجد بريد مؤرشف', en: 'No archived emails' })}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {archivedEmails.map((email) => (
                      <div key={email.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{email.subject}</p>
                          <p className="text-sm text-muted-foreground">{email.from}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(email.date).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            {t({ ar: 'تحميل', en: 'Download' })}
                          </Button>
                          <Button variant="outline" size="sm">
                            {t({ ar: 'استعادة', en: 'Restore' })}
                          </Button>
                          <Button variant="outline" size="sm">
                            {t({ ar: 'تصدير', en: 'Export' })}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Design Settings */}
          <TabsContent value="design">
            <div className="space-y-6">
              {/* Email Colors */}
              <Card>
                <CardHeader>
                  <CardTitle>{t({ ar: 'ألوان ملفات البريد', en: 'Email Folder Colors' })}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* الملفات الأساسية */}
                  {Object.entries(emailColors).map(([folder, color]) => (
                    <div key={folder} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-6 h-6 rounded" 
                          style={{ backgroundColor: color }}
                        />
                        <Label className="font-medium">{t({ ar: folderLabels[folder]?.ar || folder, en: folderLabels[folder]?.en || folder })}</Label>
                      </div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="w-32 justify-start">
                            <div 
                              className="w-4 h-4 rounded mr-2" 
                              style={{ backgroundColor: color }}
                            />
                            {color}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent>
                          <HexColorPicker 
                            color={color} 
                            onChange={(newColor) => setEmailColors({ ...emailColors, [folder]: newColor })}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  ))}
                  
                  {/* الملفات الإضافية */}
                  {customFolders.length > 0 && (
                    <div className="mt-6 pt-6 border-t">
                      <div className="flex items-center justify-between mb-4">
                        <Label className="font-semibold">{t({ ar: 'الملفات الإضافية', en: 'Custom Folders' })}</Label>
                      </div>
                      <div className="space-y-3">
                        {customFolders.map((folder) => (
                          <div key={folder.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3 flex-1">
                              <div 
                                className="w-6 h-6 rounded" 
                                style={{ backgroundColor: folder.color }}
                              />
                              <div className="flex-1">
                                <Label className="font-medium">{language === 'ar' ? folder.name : folder.name_en}</Label>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" size="sm" className="w-24">
                                    <div 
                                      className="w-4 h-4 rounded mr-2" 
                                      style={{ backgroundColor: folder.color }}
                                    />
                                    {folder.color}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent>
                                  <HexColorPicker 
                                    color={folder.color} 
                                    onChange={(newColor) => {
                                      setCustomFolders(customFolders.map(f => 
                                        f.id === folder.id ? { ...f, color: newColor } : f
                                      ));
                                    }}
                                  />
                                </PopoverContent>
                              </Popover>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  const updated = customFolders.filter(f => f.id !== folder.id);
                                  setCustomFolders(updated);
                                }}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* إضافة ملف جديد */}
                  <div className="mt-6 pt-6 border-t">
                    <Label className="font-semibold mb-4 block">{t({ ar: 'إضافة ملف بريد جديد', en: 'Add New Email Folder' })}</Label>
                    <div className="space-y-4 p-4 border rounded-lg">
                      <div>
                        <Label>{t({ ar: 'اسم الملف (عربي)', en: 'Folder Name (Arabic)' })}</Label>
                        <Input
                          value={newCustomFolder.name}
                          onChange={(e) => setNewCustomFolder({ ...newCustomFolder, name: e.target.value })}
                          placeholder={t({ ar: 'مثال: مهم', en: 'Example: Important' })}
                        />
                      </div>
                      <div>
                        <Label>{t({ ar: 'اسم الملف (إنجليزي)', en: 'Folder Name (English)' })}</Label>
                        <Input
                          value={newCustomFolder.name_en}
                          onChange={(e) => setNewCustomFolder({ ...newCustomFolder, name_en: e.target.value })}
                          placeholder={t({ ar: 'Example: Important', en: 'Example: Important' })}
                        />
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <Label>{t({ ar: 'لون الملف', en: 'Folder Color' })}</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start">
                                <div 
                                  className="w-4 h-4 rounded mr-2" 
                                  style={{ backgroundColor: newCustomFolder.color }}
                                />
                                {newCustomFolder.color}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent>
                              <HexColorPicker 
                                color={newCustomFolder.color} 
                                onChange={(newColor) => setNewCustomFolder({ ...newCustomFolder, color: newColor })}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <Button
                          variant="default"
                          onClick={() => {
                            if (newCustomFolder.name || newCustomFolder.name_en) {
                              setCustomFolders([...customFolders, {
                                ...newCustomFolder,
                                id: `folder-${Date.now()}`
                              }]);
                              setNewCustomFolder({ name: "", name_en: "", color: "#3b82f6", icon: "Mail" });
                              toast({
                                title: t({ ar: "تم الإضافة", en: "Added" }),
                                description: t({ ar: "تم إضافة الملف بنجاح", en: "Folder added successfully" }),
                              });
                            }
                          }}
                          className="mt-6"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          {t({ ar: 'إضافة', en: 'Add' })}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Device Templates */}
              <Card>
                <CardHeader>
                  <CardTitle>{t({ ar: 'تصميم البريد حسب الجهاز', en: 'Email Design by Device' })}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <Smartphone className="w-4 h-4" />
                      {t({ ar: 'تصميم الجوال', en: 'Mobile Design' })}
                    </Label>
                    <Textarea
                      value={deviceTemplates.mobile}
                      onChange={(e) => setDeviceTemplates({ ...deviceTemplates, mobile: e.target.value })}
                      placeholder={t({ ar: 'HTML template للجوال...', en: 'HTML template for mobile...' })}
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <Monitor className="w-4 h-4" />
                      {t({ ar: 'تصميم الكمبيوتر', en: 'Desktop Design' })}
                    </Label>
                    <Textarea
                      value={deviceTemplates.desktop}
                      onChange={(e) => setDeviceTemplates({ ...deviceTemplates, desktop: e.target.value })}
                      placeholder={t({ ar: 'HTML template للكمبيوتر...', en: 'HTML template for desktop...' })}
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <Tablet className="w-4 h-4" />
                      {t({ ar: 'تصميم التابلت', en: 'Tablet Design' })}</Label>
                    <Textarea
                      value={deviceTemplates.tablet}
                      onChange={(e) => setDeviceTemplates({ ...deviceTemplates, tablet: e.target.value })}
                      placeholder={t({ ar: 'HTML template للتابلت...', en: 'HTML template for tablet...' })}
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

const folderLabels: Record<string, { ar: string; en: string }> = {
  inbox: { ar: 'الوارد', en: 'Inbox' },
  sent: { ar: 'المرسل', en: 'Sent' },
  drafts: { ar: 'المسودات', en: 'Drafts' },
  archive: { ar: 'الأرشيف', en: 'Archive' },
  trash: { ar: 'المهملات', en: 'Trash' },
  spam: { ar: 'البريد المزعج', en: 'Spam' }
};

