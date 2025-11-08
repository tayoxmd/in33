import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Palette, Type, Languages, Layout, Percent, Key, Loader2, Code, Utensils, MessageCircle, Download, Database, Save, Webhook } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Switch } from "@/components/ui/switch";
import { HexColorPicker } from "react-colorful";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { BackupManager } from "@/components/BackupManager";

export default function SiteSettings() {
  const { t } = useLanguage();
  const { userRole, loading } = useAuth();
  const navigate = useNavigate();
  const [primaryColor, setPrimaryColor] = useState("#F59E0B");
  const [fontFamily, setFontFamily] = useState("Cairo");
  const [fontSize, setFontSize] = useState("16");
  const [taxPercentage, setTaxPercentage] = useState("15");
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [socialMedia, setSocialMedia] = useState({
    facebook_url: '',
    twitter_url: '',
    instagram_url: '',
    whatsapp_number: '+966505731136',
    email: 'in@in33.in',
    phone: '0505731136'
  });
  const [exceptionColors, setExceptionColors] = useState({
    owner_room_color: '#87CEEB',
    hotel_room_color: '' as string
  });
  const [mealBadgeSettings, setMealBadgeSettings] = useState({
    meal_badge_color: '#007dff',
    meal_badge_text_color: '#ffffff',
    meal_badge_width_mobile: 120,
    meal_badge_height_mobile: 24,
    meal_badge_auto_width_mobile: false,
    meal_badge_width_tablet: 150,
    meal_badge_height_tablet: 32,
    meal_badge_auto_width_tablet: false,
    meal_badge_width_desktop: 180,
    meal_badge_height_desktop: 36,
    meal_badge_auto_width_desktop: false,
    meal_badge_font_size: 12,
    meal_badge_border_radius: 8,
  });
  const [mealDescriptionSettings, setMealDescriptionSettings] = useState({
    meal_description_bg_color: '#f0fdf4',
    meal_description_text_color: '#15803d',
    meal_description_font_size: 12,
    meal_description_border_radius: 8,
    meal_description_border_color: '#86efac',
  });
  const [chatCodes, setChatCodes] = useState({
    chat_widget_code: '',
    tidio_widget_code: '',
    custom_head_code: '',
    custom_body_code: ''
  });
  const [tidioSettings, setTidioSettings] = useState({
    tidio_public_key: '',
    tidio_private_key: '',
    tidio_client_id: '',
    tidio_client_secret: ''
  });
  const [animationSettings, setAnimationSettings] = useState({
    disable_animations: false,
    animation_speed_multiplier: '1',
    loader_enabled: true,
    loader_speed_ms: '1000',
    loader_type: 'spinner' as 'spinner' | 'custom',
    loader_custom_html: '',
    loader_custom_css: '',
    loader_custom_js: ''
  });
  const [whatsappSettings, setWhatsappSettings] = useState({
    send_confirmation: true,
    send_reminder: true,
    reminder_hours: 24,
    send_to_group: true,
    group_link: '',
    no_booking_alert_hours: 24
  });
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupInfo, setBackupInfo] = useState<{
    created_at: string | null;
    version: number | null;
  }>({ created_at: null, version: null });
  const [showBackupManager, setShowBackupManager] = useState(false);

  useEffect(() => {
    if (!loading && userRole !== 'admin') {
      navigate('/');
    } else if (!loading) {
      fetchSettings();
    }
  }, [userRole, loading, navigate]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setTaxPercentage(data.tax_percentage?.toString() || "0");
        setSocialMedia({
          facebook_url: data.facebook_url || '',
          twitter_url: data.twitter_url || '',
          instagram_url: data.instagram_url || '',
          whatsapp_number: data.whatsapp_number || '+966505731136',
          email: data.email || 'in@in33.in',
          phone: data.phone || '0505731136'
        });
        setExceptionColors({
          owner_room_color: data.owner_room_color || '#87CEEB',
          hotel_room_color: data.hotel_room_color || ''
        });
        setMealBadgeSettings({
          meal_badge_color: data.meal_badge_color || '#007dff',
          meal_badge_text_color: data.meal_badge_text_color || '#ffffff',
          meal_badge_width_mobile: data.meal_badge_width_mobile || 120,
          meal_badge_height_mobile: data.meal_badge_height_mobile || 24,
          meal_badge_auto_width_mobile: data.meal_badge_auto_width_mobile || false,
          meal_badge_width_tablet: data.meal_badge_width_tablet || 150,
          meal_badge_height_tablet: data.meal_badge_height_tablet || 32,
          meal_badge_auto_width_tablet: data.meal_badge_auto_width_tablet || false,
          meal_badge_width_desktop: data.meal_badge_width_desktop || 180,
          meal_badge_height_desktop: data.meal_badge_height_desktop || 36,
          meal_badge_auto_width_desktop: data.meal_badge_auto_width_desktop || false,
          meal_badge_font_size: data.meal_badge_font_size || 12,
          meal_badge_border_radius: data.meal_badge_border_radius || 8,
        });
        setMealDescriptionSettings({
          meal_description_bg_color: data.meal_description_bg_color || '#f0fdf4',
          meal_description_text_color: data.meal_description_text_color || '#15803d',
          meal_description_font_size: data.meal_description_font_size || 12,
          meal_description_border_radius: data.meal_description_border_radius || 8,
          meal_description_border_color: data.meal_description_border_color || '#86efac',
        });
        setChatCodes({
          chat_widget_code: data.chat_widget_code || '',
          tidio_widget_code: data.tidio_widget_code || '',
          custom_head_code: data.custom_head_code || '',
          custom_body_code: data.custom_body_code || ''
        });
        setTidioSettings({
          tidio_public_key: data.tidio_public_key || '',
          tidio_private_key: data.tidio_private_key || '',
          tidio_client_id: data.tidio_client_id || '',
          tidio_client_secret: data.tidio_client_secret || ''
        });
        setAnimationSettings({
          disable_animations: !!data.disable_animations,
          animation_speed_multiplier: data.animation_speed_multiplier?.toString() || '1',
          loader_enabled: data.loader_enabled ?? true,
          loader_speed_ms: data.loader_speed_ms?.toString() || '1000',
          loader_type: (data.loader_type as 'spinner' | 'custom') || 'spinner',
          loader_custom_html: data.loader_custom_html || '',
          loader_custom_css: data.loader_custom_css || '',
          loader_custom_js: data.loader_custom_js || ''
        });
      }

      // Fetch WhatsApp settings
      const { data: whatsappData } = await supabase
        .from('whatsapp_settings')
        .select('*')
        .single();

      if (whatsappData) {
        setWhatsappSettings({
          send_confirmation: whatsappData.send_confirmation ?? true,
          send_reminder: whatsappData.send_reminder ?? true,
          reminder_hours: whatsappData.reminder_hours || 24,
          send_to_group: whatsappData.send_to_group ?? true,
          group_link: whatsappData.group_link || '',
          no_booking_alert_hours: whatsappData.no_booking_alert_hours || 24
        });
      }

      // Fetch backup info
      if (data) {
        setBackupInfo({
          created_at: data.backup_created_at || null,
          version: data.backup_version || null
        });
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleSaveColors = () => {
    toast({
      title: t({ ar: "تم الحفظ", en: "Saved" }),
      description: t({ ar: "تم حفظ إعدادات الألوان", en: "Color settings saved" }),
    });
  };

  const handleSaveExceptionColors = async () => {
    try {
      const { data: existingSettings } = await supabase
        .from('site_settings')
        .select('id')
        .order('created_at', { ascending: false })
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingSettings) {
        const { error } = await supabase
          .from('site_settings')
          .update({
            owner_room_color: exceptionColors.owner_room_color,
            hotel_room_color: exceptionColors.hotel_room_color || null,
          })
          .eq('id', existingSettings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert({
            tax_percentage: parseFloat(taxPercentage),
            owner_room_color: exceptionColors.owner_room_color,
            hotel_room_color: exceptionColors.hotel_room_color || null,
          });
        if (error) throw error;
      }

      toast({
        title: t({ ar: 'تم الحفظ', en: 'Saved' }),
        description: t({ ar: 'تم حفظ الألوان الاستثنائية', en: 'Exceptional colors saved' }),
      });
    } catch (error: any) {
      toast({
        title: t({ ar: 'خطأ', en: 'Error' }),
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSaveFonts = () => {
    toast({
      title: t({ ar: "تم الحفظ", en: "Saved" }),
      description: t({ ar: "تم حفظ إعدادات الخطوط", en: "Font settings saved" }),
    });
  };

  const handleSaveTax = async () => {
    try {
      const { data: existingSettings } = await supabase
        .from('site_settings')
        .select('id')
        .order('created_at', { ascending: false })
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingSettings) {
        const { error } = await supabase
          .from('site_settings')
          .update({ tax_percentage: parseFloat(taxPercentage) })
          .eq('id', existingSettings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert({ tax_percentage: parseFloat(taxPercentage) });

        if (error) throw error;
      }

      toast({
        title: t({ ar: "تم الحفظ", en: "Saved" }),
        description: t({ ar: "تم حفظ إعدادات الضريبة", en: "Tax settings saved" }),
      });
    } catch (error: any) {
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSaveSocialMedia = async () => {
    try {
      const { data: existingSettings } = await supabase
        .from('site_settings')
        .select('id')
        .order('created_at', { ascending: false })
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingSettings) {
        const { error } = await supabase
          .from('site_settings')
          .update(socialMedia)
          .eq('id', existingSettings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert({ ...socialMedia, tax_percentage: parseFloat(taxPercentage) });

        if (error) throw error;
      }

      toast({
        title: t({ ar: "تم الحفظ", en: "Saved" }),
        description: t({ ar: "تم حفظ إعدادات وسائل التواصل", en: "Social media settings saved" }),
      });
    } catch (error: any) {
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSaveChatCodes = async () => {
    try {
      const { data: existingSettings } = await supabase
        .from('site_settings')
        .select('id')
        .order('created_at', { ascending: false })
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingSettings) {
        const { error } = await supabase
          .from('site_settings')
          .update({
            chat_widget_code: chatCodes.chat_widget_code,
            tidio_widget_code: chatCodes.tidio_widget_code,
            custom_head_code: chatCodes.custom_head_code,
            custom_body_code: chatCodes.custom_body_code,
            tidio_public_key: tidioSettings.tidio_public_key,
            tidio_private_key: tidioSettings.tidio_private_key,
            tidio_client_id: tidioSettings.tidio_client_id,
            tidio_client_secret: tidioSettings.tidio_client_secret,
          })
          .eq('id', existingSettings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert({
            ...chatCodes,
            ...tidioSettings,
            tax_percentage: parseFloat(taxPercentage)
          });

        if (error) throw error;
      }

      toast({
        title: t({ ar: "تم الحفظ", en: "Saved" }),
        description: t({ ar: "تم حفظ إعدادات الدردشة والأكواد", en: "Chat & custom code settings saved" }),
      });
    } catch (error: any) {
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSaveAnimationSettings = async () => {
    try {
      const { data: existingSettings } = await supabase
        .from('site_settings')
        .select('id')
        .order('created_at', { ascending: false })
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingSettings) {
        const { error } = await supabase
          .from('site_settings')
          .update({
            disable_animations: animationSettings.disable_animations,
            animation_speed_multiplier: parseFloat(animationSettings.animation_speed_multiplier),
            loader_enabled: animationSettings.loader_enabled,
            loader_speed_ms: parseInt(animationSettings.loader_speed_ms),
            loader_type: animationSettings.loader_type,
            loader_custom_html: animationSettings.loader_custom_html,
            loader_custom_css: animationSettings.loader_custom_css,
            loader_custom_js: animationSettings.loader_custom_js,
          })
          .eq('id', existingSettings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert({
            tax_percentage: parseFloat(taxPercentage),
            disable_animations: animationSettings.disable_animations,
            animation_speed_multiplier: parseFloat(animationSettings.animation_speed_multiplier),
            loader_enabled: animationSettings.loader_enabled,
            loader_speed_ms: parseInt(animationSettings.loader_speed_ms),
            loader_type: animationSettings.loader_type,
            loader_custom_html: animationSettings.loader_custom_html,
            loader_custom_css: animationSettings.loader_custom_css,
            loader_custom_js: animationSettings.loader_custom_js,
          });

        if (error) throw error;
      }

      toast({
        title: t({ ar: "تم الحفظ", en: "Saved" }),
        description: t({ ar: "تم حفظ إعدادات التحريك والتحميل", en: "Animation & loader settings saved" }),
      });

      // Reload page to apply settings
      window.location.reload();
    } catch (error: any) {
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSaveWhatsappSettings = async () => {
    try {
      const { data: existingSettings } = await supabase
        .from('whatsapp_settings')
        .select('id')
        .single();

      if (existingSettings) {
        const { error } = await supabase
          .from('whatsapp_settings')
          .update({
            send_confirmation: whatsappSettings.send_confirmation,
            send_reminder: whatsappSettings.send_reminder,
            reminder_hours: whatsappSettings.reminder_hours,
            send_to_group: whatsappSettings.send_to_group,
            group_link: whatsappSettings.group_link,
            no_booking_alert_hours: whatsappSettings.no_booking_alert_hours
          })
          .eq('id', existingSettings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('whatsapp_settings')
          .insert({
            send_confirmation: whatsappSettings.send_confirmation,
            send_reminder: whatsappSettings.send_reminder,
            reminder_hours: whatsappSettings.reminder_hours,
            send_to_group: whatsappSettings.send_to_group,
            group_link: whatsappSettings.group_link,
            no_booking_alert_hours: whatsappSettings.no_booking_alert_hours
          });

        if (error) throw error;
      }

      toast({
        title: t({ ar: "تم الحفظ", en: "Saved" }),
        description: t({ ar: "تم حفظ إعدادات WhatsApp", en: "WhatsApp settings saved" }),
      });
    } catch (error: any) {
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: error.message,
        variant: "destructive",
      });
    }
  };


  const handleCreateBackup = async () => {
    setBackupLoading(true);
    try {
      const { data, error } = await supabase.rpc('create_system_backup');
      
      if (error) throw error;

      // Fetch updated backup info
      const { data: settingsData } = await supabase
        .from('site_settings')
        .select('backup_created_at, backup_version')
        .order('created_at', { ascending: false })
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (settingsData) {
        setBackupInfo({
          created_at: settingsData.backup_created_at,
          version: settingsData.backup_version
        });
      }

      toast({
        title: t({ ar: "تم إنشاء النسخة الاحتياطية", en: "Backup Created" }),
        description: t({ 
          ar: "تم إنشاء وحفظ النسخة الاحتياطية بنجاح", 
          en: "Backup created and saved successfully" 
        }),
      });
    } catch (error: any) {
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setBackupLoading(false);
    }
  };

  const handleDownloadBackup = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('backup_data, backup_created_at, backup_version')
        .order('created_at', { ascending: false })
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (!data?.backup_data) {
        toast({
          title: t({ ar: "لا توجد نسخة احتياطية", en: "No Backup Available" }),
          description: t({ 
            ar: "يجب إنشاء نسخة احتياطية أولاً", 
            en: "Please create a backup first" 
          }),
          variant: "destructive",
        });
        return;
      }

      // Create download link
      const dataStr = JSON.stringify(data.backup_data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      const date = new Date(data.backup_created_at).toISOString().split('T')[0];
      link.download = `backup-v${data.backup_version}-${date}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: t({ ar: "تم التحميل", en: "Downloaded" }),
        description: t({ 
          ar: "تم تحميل النسخة الاحتياطية بنجاح", 
          en: "Backup downloaded successfully" 
        }),
      });
    } catch (error: any) {
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading || loadingSettings) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        <h1 className="text-3xl font-bold mb-8">
          {t({ ar: 'إعدادات الموقع', en: 'Site Settings' })}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tax Settings Section */}
          <Card className="card-luxury">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="w-5 h-5" />
                {t({ ar: 'إعدادات الضريبة', en: 'Tax Settings' })}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{t({ ar: 'نسبة الضريبة المئوية', en: 'Tax Percentage' })}</Label>
                <div className="flex gap-2 mt-2 items-center">
                  <Input 
                    type="number" 
                    value={taxPercentage}
                    onChange={(e) => setTaxPercentage(e.target.value)}
                    min="0"
                    max="100"
                    step="0.1"
                    className="flex-1"
                  />
                  <span className="text-muted-foreground">%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {t({ ar: 'سيتم تطبيق هذه النسبة على جميع أسعار الفنادق', en: 'This percentage will be applied to all hotel prices' })}
                </p>
              </div>
              <Button onClick={handleSaveTax} className="w-full btn-luxury">
                {t({ ar: 'حفظ إعدادات الضريبة', en: 'Save Tax Settings' })}
              </Button>
            </CardContent>
          </Card>

          {/* Colors Section */}
          <Card className="card-luxury">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                {t({ ar: 'الألوان الأساسية', en: 'Primary Colors' })}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="mb-3 block">{t({ ar: 'اللون الأساسي', en: 'Primary Color' })}</Label>
                <div className="flex gap-3 items-start">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        className="w-20 h-20 rounded-lg border-2 border-border shadow-sm hover:scale-105 transition-transform cursor-pointer"
                        style={{ backgroundColor: primaryColor }}
                      />
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-3" align="start">
                      <HexColorPicker
                        color={primaryColor}
                        onChange={setPrimaryColor}
                      />
                      <div className="mt-3">
                        <Input
                          type="text"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="font-mono text-sm text-black dark:text-white"
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                  <div className="flex-1">
                    <Input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="font-mono"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {t({ ar: 'انقر على المربع الملون لفتح منتقي الألوان', en: 'Click the color box to open color picker' })}
                    </p>
                  </div>
                </div>
              </div>
              <Button onClick={handleSaveColors} className="w-full btn-luxury">
                {t({ ar: 'حفظ الألوان', en: 'Save Colors' })}
              </Button>
            </CardContent>
          </Card>

          {/* Exceptional Colors Section */}
          <Card className="card-luxury">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                {t({ ar: 'تغيير الألوان الاستثنائية', en: 'Exceptional Colors' })}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-3 block">{t({ ar: 'غرف مُلّاك', en: 'Owner Rooms' })}</Label>
                  <div className="flex gap-2 items-start">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          className="w-16 h-16 rounded-lg border-2 border-border shadow-sm hover:scale-105 transition-transform cursor-pointer flex-shrink-0"
                          style={{ backgroundColor: exceptionColors.owner_room_color }}
                        />
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-3" align="start">
                        <HexColorPicker
                          color={exceptionColors.owner_room_color}
                          onChange={(color) => setExceptionColors({ ...exceptionColors, owner_room_color: color })}
                        />
                        <div className="mt-3">
                          <Input
                            type="text"
                            value={exceptionColors.owner_room_color}
                            onChange={(e) => setExceptionColors({ ...exceptionColors, owner_room_color: e.target.value })}
                            className="font-mono text-sm text-black dark:text-white"
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                    <Input
                      type="text"
                      value={exceptionColors.owner_room_color}
                      onChange={(e) => setExceptionColors({ ...exceptionColors, owner_room_color: e.target.value })}
                      className="flex-1 font-mono"
                    />
                  </div>
                </div>
                <div>
                  <Label className="mb-3 block">{t({ ar: 'غرف فندقية', en: 'Hotel Rooms' })}</Label>
                  <div className="flex gap-2 items-start">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          className="w-16 h-16 rounded-lg border-2 border-border shadow-sm hover:scale-105 transition-transform cursor-pointer flex-shrink-0"
                          style={{ backgroundColor: exceptionColors.hotel_room_color || '#ffffff' }}
                        />
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-3" align="start">
                        <HexColorPicker
                          color={exceptionColors.hotel_room_color || '#ffffff'}
                          onChange={(color) => setExceptionColors({ ...exceptionColors, hotel_room_color: color })}
                        />
                        <div className="mt-3">
                          <Input
                            type="text"
                            value={exceptionColors.hotel_room_color}
                            onChange={(e) => setExceptionColors({ ...exceptionColors, hotel_room_color: e.target.value })}
                            className="font-mono text-sm text-black dark:text-white"
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                    <Input
                      type="text"
                      value={exceptionColors.hotel_room_color}
                      onChange={(e) => setExceptionColors({ ...exceptionColors, hotel_room_color: e.target.value })}
                      className="flex-1 font-mono"
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{t({ ar: 'تُستخدم هذه الألوان لتظليل بطاقات الفنادق والطلبات حسب النوع', en: 'These colors are used to highlight hotel and booking cards by type' })}</p>
              <Button onClick={handleSaveExceptionColors} className="w-full btn-luxury">
                {t({ ar: 'حفظ الألوان الاستثنائية', en: 'Save Exceptional Colors' })}
              </Button>
            </CardContent>
          </Card>


          {/* Meal Badge Settings */}
          <Card className="card-luxury lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="w-5 h-5" />
                {t({ ar: 'إعدادات شريط الوجبات', en: 'Meal Badge Settings' })}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-3 block">{t({ ar: 'لون خلفية شريط الوجبات', en: 'Meal Badge Background Color' })}</Label>
                  <div className="flex gap-3 items-start">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          className="w-20 h-20 rounded-lg border-2 border-border shadow-sm hover:scale-105 transition-transform cursor-pointer"
                          style={{ backgroundColor: mealBadgeSettings.meal_badge_color }}
                        />
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-3" align="start">
                        <HexColorPicker
                          color={mealBadgeSettings.meal_badge_color}
                          onChange={(color) => setMealBadgeSettings({ ...mealBadgeSettings, meal_badge_color: color })}
                        />
                        <div className="mt-3 flex gap-2">
                          <Input
                            type="text"
                            value={mealBadgeSettings.meal_badge_color}
                            onChange={(e) => setMealBadgeSettings({ ...mealBadgeSettings, meal_badge_color: e.target.value })}
                            className="font-mono text-sm text-black dark:text-white"
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                    <div className="flex-1">
                      <Input
                        type="text"
                        value={mealBadgeSettings.meal_badge_color}
                        onChange={(e) => setMealBadgeSettings({ ...mealBadgeSettings, meal_badge_color: e.target.value })}
                        className="font-mono"
                        placeholder="#007dff"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="mb-3 block">{t({ ar: 'لون نص شريط الوجبات', en: 'Meal Badge Text Color' })}</Label>
                  <div className="flex gap-3 items-start">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          className="w-20 h-20 rounded-lg border-2 border-border shadow-sm hover:scale-105 transition-transform cursor-pointer"
                          style={{ backgroundColor: mealBadgeSettings.meal_badge_text_color }}
                        />
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-3" align="start">
                        <HexColorPicker
                          color={mealBadgeSettings.meal_badge_text_color}
                          onChange={(color) => setMealBadgeSettings({ ...mealBadgeSettings, meal_badge_text_color: color })}
                        />
                        <div className="mt-3 flex gap-2">
                          <Input
                            type="text"
                            value={mealBadgeSettings.meal_badge_text_color}
                            onChange={(e) => setMealBadgeSettings({ ...mealBadgeSettings, meal_badge_text_color: e.target.value })}
                            className="font-mono text-sm text-black dark:text-white"
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                    <div className="flex-1">
                      <Input
                        type="text"
                        value={mealBadgeSettings.meal_badge_text_color}
                        onChange={(e) => setMealBadgeSettings({ ...mealBadgeSettings, meal_badge_text_color: e.target.value })}
                        className="font-mono"
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Sizes */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  📱 {t({ ar: 'أحجام الجوال', en: 'Mobile Sizes' })}
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>{t({ ar: 'عرض تلقائي', en: 'Auto Width' })}</Label>
                    <Switch
                      checked={mealBadgeSettings.meal_badge_auto_width_mobile}
                      onCheckedChange={(checked) => setMealBadgeSettings({ ...mealBadgeSettings, meal_badge_auto_width_mobile: checked })}
                    />
                  </div>
                  {!mealBadgeSettings.meal_badge_auto_width_mobile && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>{t({ ar: 'العرض (بكسل)', en: 'Width (px)' })}</Label>
                        <Input
                          type="number"
                          value={mealBadgeSettings.meal_badge_width_mobile}
                          onChange={(e) => setMealBadgeSettings({ ...mealBadgeSettings, meal_badge_width_mobile: parseInt(e.target.value) || 120 })}
                          min="50"
                          max="300"
                        />
                      </div>
                      <div>
                        <Label>{t({ ar: 'الارتفاع (بكسل)', en: 'Height (px)' })}</Label>
                        <Input
                          type="number"
                          value={mealBadgeSettings.meal_badge_height_mobile}
                          onChange={(e) => setMealBadgeSettings({ ...mealBadgeSettings, meal_badge_height_mobile: parseInt(e.target.value) || 24 })}
                          min="20"
                          max="100"
                        />
                      </div>
                    </div>
                  )}
                  {mealBadgeSettings.meal_badge_auto_width_mobile && (
                    <div>
                      <Label>{t({ ar: 'الارتفاع (بكسل)', en: 'Height (px)' })}</Label>
                      <Input
                        type="number"
                        value={mealBadgeSettings.meal_badge_height_mobile}
                        onChange={(e) => setMealBadgeSettings({ ...mealBadgeSettings, meal_badge_height_mobile: parseInt(e.target.value) || 24 })}
                        min="20"
                        max="100"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Tablet Sizes */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  📱 {t({ ar: 'أحجام التابلت', en: 'Tablet Sizes' })}
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>{t({ ar: 'عرض تلقائي', en: 'Auto Width' })}</Label>
                    <Switch
                      checked={mealBadgeSettings.meal_badge_auto_width_tablet}
                      onCheckedChange={(checked) => setMealBadgeSettings({ ...mealBadgeSettings, meal_badge_auto_width_tablet: checked })}
                    />
                  </div>
                  {!mealBadgeSettings.meal_badge_auto_width_tablet && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>{t({ ar: 'العرض (بكسل)', en: 'Width (px)' })}</Label>
                        <Input
                          type="number"
                          value={mealBadgeSettings.meal_badge_width_tablet}
                          onChange={(e) => setMealBadgeSettings({ ...mealBadgeSettings, meal_badge_width_tablet: parseInt(e.target.value) || 150 })}
                          min="50"
                          max="300"
                        />
                      </div>
                      <div>
                        <Label>{t({ ar: 'الارتفاع (بكسل)', en: 'Height (px)' })}</Label>
                        <Input
                          type="number"
                          value={mealBadgeSettings.meal_badge_height_tablet}
                          onChange={(e) => setMealBadgeSettings({ ...mealBadgeSettings, meal_badge_height_tablet: parseInt(e.target.value) || 32 })}
                          min="20"
                          max="100"
                        />
                      </div>
                    </div>
                  )}
                  {mealBadgeSettings.meal_badge_auto_width_tablet && (
                    <div>
                      <Label>{t({ ar: 'الارتفاع (بكسل)', en: 'Height (px)' })}</Label>
                      <Input
                        type="number"
                        value={mealBadgeSettings.meal_badge_height_tablet}
                        onChange={(e) => setMealBadgeSettings({ ...mealBadgeSettings, meal_badge_height_tablet: parseInt(e.target.value) || 32 })}
                        min="20"
                        max="100"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Desktop Sizes */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  💻 {t({ ar: 'أحجام سطح المكتب', en: 'Desktop Sizes' })}
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>{t({ ar: 'عرض تلقائي', en: 'Auto Width' })}</Label>
                    <Switch
                      checked={mealBadgeSettings.meal_badge_auto_width_desktop}
                      onCheckedChange={(checked) => setMealBadgeSettings({ ...mealBadgeSettings, meal_badge_auto_width_desktop: checked })}
                    />
                  </div>
                  {!mealBadgeSettings.meal_badge_auto_width_desktop && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>{t({ ar: 'العرض (بكسل)', en: 'Width (px)' })}</Label>
                         <Input
                          type="number"
                          value={mealBadgeSettings.meal_badge_width_desktop}
                          onChange={(e) => setMealBadgeSettings({ ...mealBadgeSettings, meal_badge_width_desktop: parseInt(e.target.value) || 180 })}
                          min="50"
                          max="300"
                        />
                      </div>
                      <div>
                        <Label>{t({ ar: 'الارتفاع (بكسل)', en: 'Height (px)' })}</Label>
                        <Input
                          type="number"
                          value={mealBadgeSettings.meal_badge_height_desktop}
                          onChange={(e) => setMealBadgeSettings({ ...mealBadgeSettings, meal_badge_height_desktop: parseInt(e.target.value) || 36 })}
                          min="20"
                          max="100"
                        />
                      </div>
                    </div>
                  )}
                  {mealBadgeSettings.meal_badge_auto_width_desktop && (
                    <div>
                      <Label>{t({ ar: 'الارتفاع (بكسل)', en: 'Height (px)' })}</Label>
                      <Input
                        type="number"
                        value={mealBadgeSettings.meal_badge_height_desktop}
                        onChange={(e) => setMealBadgeSettings({ ...mealBadgeSettings, meal_badge_height_desktop: parseInt(e.target.value) || 36 })}
                        min="20"
                        max="100"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Common Settings */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">
                  {t({ ar: 'إعدادات عامة', en: 'Common Settings' })}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t({ ar: 'حجم الخط (بكسل)', en: 'Font Size (px)' })}</Label>
                    <Input
                      type="number"
                      value={mealBadgeSettings.meal_badge_font_size}
                      onChange={(e) => setMealBadgeSettings({ ...mealBadgeSettings, meal_badge_font_size: parseInt(e.target.value) || 12 })}
                      min="8"
                      max="24"
                    />
                  </div>
                  <div>
                    <Label>{t({ ar: 'انحناء الزوايا (بكسل)', en: 'Border Radius (px)' })}</Label>
                    <Input
                      type="number"
                      value={mealBadgeSettings.meal_badge_border_radius}
                      onChange={(e) => setMealBadgeSettings({ ...mealBadgeSettings, meal_badge_border_radius: parseInt(e.target.value) || 8 })}
                      min="0"
                      max="50"
                    />
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mb-4">
                {t({ 
                  ar: 'يُستخدم هذا الشريط لعرض معلومات الوجبات على بطاقات الفنادق. يمكنك تحديد أحجام مختلفة لكل نوع جهاز', 
                  en: 'This badge is used to display meal information on hotel cards. You can set different sizes for each device type' 
                })}
              </p>

              {/* Meal Description Settings */}
              <div className="border-t pt-6 mt-6 space-y-4">
                <h4 className="font-semibold text-lg flex items-center gap-2">
                  📝 {t({ ar: 'إعدادات مربع وصف الوجبات', en: 'Meal Description Box Settings' })}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {t({ 
                    ar: 'يُستخدم لعرض وصف الوجبات أسفل بطاقات الفنادق وفي صفحة إكمال الحجز', 
                    en: 'Used to display meal descriptions under hotel cards and in the booking page' 
                  })}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Background Color */}
                  <div>
                    <Label className="mb-3 block">{t({ ar: 'لون خلفية المربع', en: 'Box Background Color' })}</Label>
                    <div className="flex gap-3 items-start">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            className="w-20 h-20 rounded-lg border-2 border-border shadow-sm hover:scale-105 transition-transform cursor-pointer"
                            style={{ backgroundColor: mealDescriptionSettings.meal_description_bg_color }}
                          />
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-3" align="start">
                          <HexColorPicker
                            color={mealDescriptionSettings.meal_description_bg_color}
                            onChange={(color) => setMealDescriptionSettings({ ...mealDescriptionSettings, meal_description_bg_color: color })}
                          />
                          <div className="mt-3">
                            <Input
                              type="text"
                              value={mealDescriptionSettings.meal_description_bg_color}
                              onChange={(e) => setMealDescriptionSettings({ ...mealDescriptionSettings, meal_description_bg_color: e.target.value })}
                              className="font-mono text-sm"
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                      <Input
                        type="text"
                        value={mealDescriptionSettings.meal_description_bg_color}
                        onChange={(e) => setMealDescriptionSettings({ ...mealDescriptionSettings, meal_description_bg_color: e.target.value })}
                        className="font-mono flex-1"
                        placeholder="#f0fdf4"
                      />
                    </div>
                  </div>

                  {/* Text Color */}
                  <div>
                    <Label className="mb-3 block">{t({ ar: 'لون النص', en: 'Text Color' })}</Label>
                    <div className="flex gap-3 items-start">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            className="w-20 h-20 rounded-lg border-2 border-border shadow-sm hover:scale-105 transition-transform cursor-pointer"
                            style={{ backgroundColor: mealDescriptionSettings.meal_description_text_color }}
                          />
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-3" align="start">
                          <HexColorPicker
                            color={mealDescriptionSettings.meal_description_text_color}
                            onChange={(color) => setMealDescriptionSettings({ ...mealDescriptionSettings, meal_description_text_color: color })}
                          />
                          <div className="mt-3">
                            <Input
                              type="text"
                              value={mealDescriptionSettings.meal_description_text_color}
                              onChange={(e) => setMealDescriptionSettings({ ...mealDescriptionSettings, meal_description_text_color: e.target.value })}
                              className="font-mono text-sm"
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                      <Input
                        type="text"
                        value={mealDescriptionSettings.meal_description_text_color}
                        onChange={(e) => setMealDescriptionSettings({ ...mealDescriptionSettings, meal_description_text_color: e.target.value })}
                        className="font-mono flex-1"
                        placeholder="#15803d"
                      />
                    </div>
                  </div>

                  {/* Border Color */}
                  <div>
                    <Label className="mb-3 block">{t({ ar: 'لون الحدود', en: 'Border Color' })}</Label>
                    <div className="flex gap-3 items-start">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            className="w-20 h-20 rounded-lg border-2 border-border shadow-sm hover:scale-105 transition-transform cursor-pointer"
                            style={{ backgroundColor: mealDescriptionSettings.meal_description_border_color }}
                          />
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-3" align="start">
                          <HexColorPicker
                            color={mealDescriptionSettings.meal_description_border_color}
                            onChange={(color) => setMealDescriptionSettings({ ...mealDescriptionSettings, meal_description_border_color: color })}
                          />
                          <div className="mt-3">
                            <Input
                              type="text"
                              value={mealDescriptionSettings.meal_description_border_color}
                              onChange={(e) => setMealDescriptionSettings({ ...mealDescriptionSettings, meal_description_border_color: e.target.value })}
                              className="font-mono text-sm"
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                      <Input
                        type="text"
                        value={mealDescriptionSettings.meal_description_border_color}
                        onChange={(e) => setMealDescriptionSettings({ ...mealDescriptionSettings, meal_description_border_color: e.target.value })}
                        className="font-mono flex-1"
                        placeholder="#86efac"
                      />
                    </div>
                  </div>

                  {/* Font Size */}
                  <div>
                    <Label>{t({ ar: 'حجم الخط (بكسل)', en: 'Font Size (px)' })}</Label>
                    <Input
                      type="number"
                      value={mealDescriptionSettings.meal_description_font_size}
                      onChange={(e) => setMealDescriptionSettings({ ...mealDescriptionSettings, meal_description_font_size: parseInt(e.target.value) || 12 })}
                      min="8"
                      max="24"
                    />
                  </div>

                  {/* Border Radius */}
                  <div>
                    <Label>{t({ ar: 'انحناء الزوايا (بكسل)', en: 'Border Radius (px)' })}</Label>
                    <Input
                      type="number"
                      value={mealDescriptionSettings.meal_description_border_radius}
                      onChange={(e) => setMealDescriptionSettings({ ...mealDescriptionSettings, meal_description_border_radius: parseInt(e.target.value) || 8 })}
                      min="0"
                      max="50"
                    />
                  </div>
                </div>
              </div>
              
              <Button onClick={async () => {
                try {
                  const { data: existingSettings } = await supabase
                    .from('site_settings')
                    .select('id')
                    .order('created_at', { ascending: false })
                    .order('updated_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                  if (existingSettings) {
                    const { error } = await supabase
                      .from('site_settings')
                      .update({
                        ...mealBadgeSettings,
                        ...mealDescriptionSettings
                      })
                      .eq('id', existingSettings.id);
                    if (error) throw error;
                  }

                  toast({
                    title: t({ ar: 'تم الحفظ', en: 'Saved' }),
                    description: t({ ar: 'تم حفظ إعدادات شريط الوجبات', en: 'Meal badge settings saved' }),
                  });
                  
                  window.location.reload();
                } catch (error: any) {
                  toast({
                    title: t({ ar: 'خطأ', en: 'Error' }),
                    description: error.message,
                    variant: 'destructive',
                  });
                }
              }} className="w-full btn-luxury">
                {t({ ar: 'حفظ إعدادات شريط الوجبات', en: 'Save Meal Badge Settings' })}
              </Button>
            </CardContent>
          </Card>

          {/* Fonts Section */}
          <Card className="card-luxury">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="w-5 h-5" />
                {t({ ar: 'إعدادات الخطوط', en: 'Font Settings' })}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{t({ ar: 'نوع الخط', en: 'Font Family' })}</Label>
                <Select value={fontFamily} onValueChange={setFontFamily}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cairo">Cairo</SelectItem>
                    <SelectItem value="Tajawal">Tajawal</SelectItem>
                    <SelectItem value="Almarai">Almarai</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t({ ar: 'حجم الخط', en: 'Font Size' })}</Label>
                <Input 
                  type="number" 
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value)}
                  min="12"
                  max="24"
                  className="mt-2"
                />
              </div>
              <Button onClick={handleSaveFonts} className="w-full btn-luxury">
                {t({ ar: 'حفظ الخطوط', en: 'Save Fonts' })}
              </Button>
            </CardContent>
          </Card>

          {/* Languages Section */}
          <Card className="card-luxury">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="w-5 h-5" />
                {t({ ar: 'إدارة اللغات', en: 'Language Management' })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                {t({ ar: 'اللغات المدعومة حالياً: العربية والإنجليزية', en: 'Currently supported languages: Arabic and English' })}
              </p>
              <p className="text-sm text-muted-foreground">
                {t({ ar: 'نظام الترجمة نشط ويعمل على جميع صفحات الموقع', en: 'Translation system is active and working across all site pages' })}
              </p>
            </CardContent>
          </Card>

          {/* Chat Widget & Custom Code Section */}
          <Card className="card-luxury lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="w-5 h-5" />
                {t({ ar: 'إعدادات الدردشة والأكواد المخصصة', en: 'Chat Widget & Custom Code Settings' })}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>{t({ ar: 'كود Tidio للدردشة المباشرة', en: 'Tidio Live Chat Code' })}</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  {t({ ar: 'الصق كود HTML/JavaScript الخاص بـ Tidio هنا', en: 'Paste your Tidio widget HTML/JavaScript code here' })}
                </p>
                <Textarea
                  value={chatCodes.tidio_widget_code}
                  onChange={(e) => setChatCodes({ ...chatCodes, tidio_widget_code: e.target.value })}
                  placeholder="<!-- كود Tidio -->"
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  {t({ ar: 'إعدادات Tidio API', en: 'Tidio API Settings' })}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t({ 
                    ar: 'معلومات API الخاصة بـ Tidio للربط والتكامل مع النظام', 
                    en: 'Tidio API credentials for integration with the system' 
                  })}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tidio_public_key">
                      {t({ ar: 'Public Key', en: 'Public Key' })}
                    </Label>
                    <Input
                      id="tidio_public_key"
                      value={tidioSettings.tidio_public_key}
                      onChange={(e) => setTidioSettings({ ...tidioSettings, tidio_public_key: e.target.value })}
                      placeholder="9not32hmrcpgn4r6i8d7of5o0c5ufab"
                      dir="ltr"
                      className="font-mono text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tidio_private_key">
                      {t({ ar: 'Private Key', en: 'Private Key' })}
                    </Label>
                    <Input
                      id="tidio_private_key"
                      type="password"
                      value={tidioSettings.tidio_private_key}
                      onChange={(e) => setTidioSettings({ ...tidioSettings, tidio_private_key: e.target.value })}
                      placeholder="wbwxuefxj8hbdvguuwj[6qikljjywck"
                      dir="ltr"
                      className="font-mono text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tidio_client_id">
                      {t({ ar: 'Client ID', en: 'Client ID' })}
                    </Label>
                    <Input
                      id="tidio_client_id"
                      value={tidioSettings.tidio_client_id}
                      onChange={(e) => setTidioSettings({ ...tidioSettings, tidio_client_id: e.target.value })}
                      placeholder="ci_617f73d3d986d426381bbb8450c0c2e9a"
                      dir="ltr"
                      className="font-mono text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tidio_client_secret">
                      {t({ ar: 'Client Secret', en: 'Client Secret' })}
                    </Label>
                    <Input
                      id="tidio_client_secret"
                      type="password"
                      value={tidioSettings.tidio_client_secret}
                      onChange={(e) => setTidioSettings({ ...tidioSettings, tidio_client_secret: e.target.value })}
                      placeholder="cs_ce2e8148033d4695a6889b1a6e4dcd68"
                      dir="ltr"
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label>{t({ ar: 'كود دردشة آخر (Tawk.to / etc)', en: 'Other Chat Code (Tawk.to / etc)' })}</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  {t({ ar: 'الصق كود HTML/JavaScript الخاص بالدردشة هنا', en: 'Paste your chat widget HTML/JavaScript code here' })}
                </p>
                <Textarea
                  value={chatCodes.chat_widget_code}
                  onChange={(e) => setChatCodes({ ...chatCodes, chat_widget_code: e.target.value })}
                  placeholder="<!-- كود الدردشة -->"
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>

              <div>
                <Label>{t({ ar: 'أكواد مخصصة للـ Head', en: 'Custom Head Code' })}</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  {t({ ar: 'أكواد Google Analytics أو Facebook Pixel أو أي أكواد أخرى', en: 'Google Analytics, Facebook Pixel or other codes' })}
                </p>
                <Textarea
                  value={chatCodes.custom_head_code}
                  onChange={(e) => setChatCodes({ ...chatCodes, custom_head_code: e.target.value })}
                  placeholder="<!-- أكواد Head -->"
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>

              <div>
                <Label>{t({ ar: 'أكواد مخصصة للـ Body', en: 'Custom Body Code' })}</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  {t({ ar: 'أكواد تُوضع قبل نهاية علامة body', en: 'Codes to be placed before the closing body tag' })}
                </p>
                <Textarea
                  value={chatCodes.custom_body_code}
                  onChange={(e) => setChatCodes({ ...chatCodes, custom_body_code: e.target.value })}
                  placeholder="<!-- أكواد Body -->"
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>

              <Button onClick={handleSaveChatCodes} className="w-full btn-luxury">
                {t({ ar: 'حفظ إعدادات الدردشة والأكواد', en: 'Save Chat & Custom Code Settings' })}
              </Button>
            </CardContent>
          </Card>

          {/* Social Media Section */}
          <Card className="card-luxury lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="w-5 h-5" />
                {t({ ar: 'وسائل التواصل الاجتماعي', en: 'Social Media' })}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>{t({ ar: 'رابط فيسبوك', en: 'Facebook URL' })}</Label>
                  <Input 
                    type="url"
                    value={socialMedia.facebook_url}
                    onChange={(e) => setSocialMedia({...socialMedia, facebook_url: e.target.value})}
                    placeholder="https://facebook.com/..."
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>{t({ ar: 'رابط تويتر', en: 'Twitter URL' })}</Label>
                  <Input 
                    type="url"
                    value={socialMedia.twitter_url}
                    onChange={(e) => setSocialMedia({...socialMedia, twitter_url: e.target.value})}
                    placeholder="https://twitter.com/..."
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>{t({ ar: 'رابط إنستقرام', en: 'Instagram URL' })}</Label>
                  <Input 
                    type="url"
                    value={socialMedia.instagram_url}
                    onChange={(e) => setSocialMedia({...socialMedia, instagram_url: e.target.value})}
                    placeholder="https://instagram.com/..."
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>{t({ ar: 'رقم واتساب', en: 'WhatsApp Number' })}</Label>
                  <Input 
                    type="tel"
                    value={socialMedia.whatsapp_number}
                    onChange={(e) => setSocialMedia({...socialMedia, whatsapp_number: e.target.value})}
                    placeholder="+966505731136"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>{t({ ar: 'البريد الإلكتروني', en: 'Email' })}</Label>
                  <Input 
                    type="email"
                    value={socialMedia.email}
                    onChange={(e) => setSocialMedia({...socialMedia, email: e.target.value})}
                    placeholder="in@in33.in"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>{t({ ar: 'رقم الهاتف', en: 'Phone' })}</Label>
                  <Input 
                    type="tel"
                    value={socialMedia.phone}
                    onChange={(e) => setSocialMedia({...socialMedia, phone: e.target.value})}
                    placeholder="0505731136"
                    className="mt-2"
                  />
                </div>
              </div>
              <Button onClick={handleSaveSocialMedia} className="w-full btn-luxury">
                {t({ ar: 'حفظ إعدادات وسائل التواصل', en: 'Save Social Media Settings' })}
              </Button>
            </CardContent>
          </Card>

          {/* Animation & Loader Settings Section */}
          <Card className="card-luxury lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Loader2 className="w-5 h-5" />
                {t({ ar: 'إعدادات التحريك ومؤشر التحميل', en: 'Animation & Loader Settings' })}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t({ ar: 'تعطيل جميع المؤثرات', en: 'Disable All Animations' })}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t({ ar: 'يجعل التنقل فوريًا بدون مؤثرات', en: 'Makes navigation instant without animations' })}
                    </p>
                  </div>
                  <Switch
                    checked={animationSettings.disable_animations}
                    onCheckedChange={(checked) => setAnimationSettings({ ...animationSettings, disable_animations: checked })}
                  />
                </div>

                <div>
                  <Label>{t({ ar: 'سرعة المؤثرات (مضاعف)', en: 'Animation Speed (Multiplier)' })}</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    {t({ ar: '1.0 = سرعة عادية، 0.5 = نصف السرعة، 2.0 = ضعف السرعة', en: '1.0 = normal, 0.5 = half speed, 2.0 = double speed' })}
                  </p>
                  <Input
                    type="number"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={animationSettings.animation_speed_multiplier}
                    onChange={(e) => setAnimationSettings({ ...animationSettings, animation_speed_multiplier: e.target.value })}
                  />
                </div>
              </div>

              <div className="border-t pt-4 space-y-4">
                <h3 className="font-semibold">{t({ ar: 'إعدادات مؤشر التحميل', en: 'Loading Spinner Settings' })}</h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t({ ar: 'تفعيل مؤشر التحميل', en: 'Enable Loading Spinner' })}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t({ ar: 'إظهار المؤشر عند التحميل', en: 'Show spinner during loading' })}
                    </p>
                  </div>
                  <Switch
                    checked={animationSettings.loader_enabled}
                    onCheckedChange={(checked) => setAnimationSettings({ ...animationSettings, loader_enabled: checked })}
                  />
                </div>

                <div>
                  <Label>{t({ ar: 'سرعة الدوران (ميلي ثانية)', en: 'Rotation Speed (ms)' })}</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    {t({ ar: 'المدة الزمنية لدورة كاملة (1000 = ثانية واحدة)', en: 'Duration for one full rotation (1000 = 1 second)' })}
                  </p>
                  <Input
                    type="number"
                    min="100"
                    max="5000"
                    step="100"
                    value={animationSettings.loader_speed_ms}
                    onChange={(e) => setAnimationSettings({ ...animationSettings, loader_speed_ms: e.target.value })}
                  />
                </div>

                <div>
                  <Label>{t({ ar: 'نوع المؤشر', en: 'Loader Type' })}</Label>
                  <Select value={animationSettings.loader_type} onValueChange={(value: 'spinner' | 'custom') => setAnimationSettings({ ...animationSettings, loader_type: value })}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spinner">{t({ ar: 'مؤشر افتراضي', en: 'Default Spinner' })}</SelectItem>
                      <SelectItem value="custom">{t({ ar: 'مؤشر مخصص', en: 'Custom Loader' })}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {animationSettings.loader_type === 'custom' && (
                  <>
                    <div>
                      <Label>{t({ ar: 'كود HTML المخصص', en: 'Custom HTML Code' })}</Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        {t({ ar: 'كود HTML لمؤشر التحميل المخصص', en: 'HTML code for custom loader' })}
                      </p>
                      <Textarea
                        value={animationSettings.loader_custom_html}
                        onChange={(e) => setAnimationSettings({ ...animationSettings, loader_custom_html: e.target.value })}
                        placeholder='<div class="custom-loader">...</div>'
                        rows={4}
                        className="font-mono text-sm"
                      />
                    </div>

                    <div>
                      <Label>{t({ ar: 'كود CSS المخصص', en: 'Custom CSS Code' })}</Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        {t({ ar: 'تنسيقات CSS للمؤشر المخصص', en: 'CSS styling for custom loader' })}
                      </p>
                      <Textarea
                        value={animationSettings.loader_custom_css}
                        onChange={(e) => setAnimationSettings({ ...animationSettings, loader_custom_css: e.target.value })}
                        placeholder='.custom-loader { animation: spin 1s linear infinite; }'
                        rows={6}
                        className="font-mono text-sm"
                      />
                    </div>

                    <div>
                      <Label>{t({ ar: 'كود JavaScript المخصص', en: 'Custom JavaScript Code' })}</Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        {t({ ar: 'كود JavaScript إضافي (اختياري)', en: 'Additional JavaScript code (optional)' })}
                      </p>
                      <Textarea
                        value={animationSettings.loader_custom_js}
                        onChange={(e) => setAnimationSettings({ ...animationSettings, loader_custom_js: e.target.value })}
                        placeholder='// Custom JavaScript'
                        rows={6}
                        className="font-mono text-sm"
                      />
                    </div>
                  </>
                )}
              </div>

              <Button onClick={handleSaveAnimationSettings} className="w-full btn-luxury">
                {t({ ar: 'حفظ إعدادات التحريك والتحميل', en: 'Save Animation & Loader Settings' })}
              </Button>
              <p className="text-xs text-muted-foreground">
                {t({ ar: 'ملاحظة: سيتم إعادة تحميل الصفحة لتطبيق الإعدادات', en: 'Note: Page will reload to apply settings' })}
              </p>
            </CardContent>
          </Card>

          {/* WhatsApp Settings Section */}
          <Card className="card-luxury lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                {t({ ar: 'إعدادات WhatsApp', en: 'WhatsApp Settings' })}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t({ ar: 'إرسال تأكيد الحجز', en: 'Send Booking Confirmation' })}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t({ ar: 'إرسال رسالة تأكيد تلقائية عند الحجز', en: 'Send automatic confirmation on booking' })}
                    </p>
                  </div>
                  <Switch
                    checked={whatsappSettings.send_confirmation}
                    onCheckedChange={(checked) => setWhatsappSettings({ ...whatsappSettings, send_confirmation: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t({ ar: 'إرسال تذكير قبل الوصول', en: 'Send Reminder Before Arrival' })}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t({ ar: 'إرسال تذكير للعميل قبل موعد الوصول', en: 'Send reminder before check-in' })}
                    </p>
                  </div>
                  <Switch
                    checked={whatsappSettings.send_reminder}
                    onCheckedChange={(checked) => setWhatsappSettings({ ...whatsappSettings, send_reminder: checked })}
                  />
                </div>

                <div>
                  <Label>{t({ ar: 'عدد الساعات قبل التذكير', en: 'Hours Before Reminder' })}</Label>
                  <Input
                    type="number"
                    min="1"
                    max="72"
                    value={whatsappSettings.reminder_hours}
                    onChange={(e) => setWhatsappSettings({ ...whatsappSettings, reminder_hours: parseInt(e.target.value) })}
                    className="mt-2"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t({ ar: 'إرسال للمجموعة', en: 'Send to Group' })}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t({ ar: 'إرسال الحجوزات الجديدة إلى مجموعة WhatsApp', en: 'Send new bookings to WhatsApp group' })}
                    </p>
                  </div>
                  <Switch
                    checked={whatsappSettings.send_to_group}
                    onCheckedChange={(checked) => setWhatsappSettings({ ...whatsappSettings, send_to_group: checked })}
                  />
                </div>
              </div>

              <div>
                <Label>{t({ ar: 'رابط المجموعة', en: 'Group Link' })}</Label>
                <Input
                  type="url"
                  value={whatsappSettings.group_link}
                  onChange={(e) => setWhatsappSettings({ ...whatsappSettings, group_link: e.target.value })}
                  placeholder="https://chat.whatsapp.com/..."
                  className="mt-2"
                />
              </div>

              <div>
                <Label>{t({ ar: 'تنبيه عدم وجود حجوزات (ساعات)', en: 'No Bookings Alert (Hours)' })}</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  {t({ ar: 'إرسال تنبيه إذا لم يتم إنشاء حجز جديد خلال المدة المحددة', en: 'Send alert if no booking in specified time' })}
                </p>
                <Input
                  type="number"
                  min="1"
                  max="168"
                  value={whatsappSettings.no_booking_alert_hours}
                  onChange={(e) => setWhatsappSettings({ ...whatsappSettings, no_booking_alert_hours: parseInt(e.target.value) })}
                />
              </div>

              <Button onClick={handleSaveWhatsappSettings} className="w-full btn-luxury">
                {t({ ar: 'حفظ إعدادات WhatsApp', en: 'Save WhatsApp Settings' })}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* API Settings Link */}
      <div className="container mx-auto px-4 pb-8">
        <Card className="card-luxury">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              {t({ ar: "إعدادات API", en: "API Settings" })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {t({ ar: "إدارة مفاتيح API والنطاقات المسموحة لربط موقعك بمواقع أخرى", en: "Manage API keys and allowed origins to connect your site with other platforms" })}
            </p>
            <Button onClick={() => navigate('/api-settings')} variant="outline">
              {t({ ar: "إدارة إعدادات API", en: "Manage API Settings" })}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Lovable Webhook Settings */}
      <div className="container mx-auto px-4 pb-8">
        <Card className="card-luxury">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="w-5 h-5" />
              {t({ ar: "إعدادات ربط Lovable", en: "Lovable Webhook Settings" })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {t({ ar: "إعدادات المزامنة مع Lovable - ربط التعديلات تلقائياً", en: "Sync settings with Lovable - automatically sync changes" })}
            </p>
            <Button onClick={() => navigate('/lovable-webhook-settings')} variant="outline" className="w-full">
              <Webhook className="w-4 h-4 mr-2" />
              {t({ ar: "إدارة إعدادات Lovable", en: "Manage Lovable Settings" })}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Backup System */}
      <div className="container mx-auto px-4 pb-8">
        <Card className="card-luxury">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              {t({ ar: "النسخ الاحتياطي", en: "Backup System" })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t({ 
                ar: "قم بإنشاء نسخة احتياطية كاملة من جميع البيانات المهمة في الموقع", 
                en: "Create a complete backup of all important site data" 
              })}
            </p>

            {backupInfo.created_at && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Save className="w-4 h-4" />
                  <span className="font-medium">
                    {t({ ar: "آخر نسخة احتياطية:", en: "Last Backup:" })}
                  </span>
                  <span className="text-muted-foreground">
                    {new Date(backupInfo.created_at).toLocaleString(t({ ar: 'ar-SA', en: 'en-US' }))}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">
                    {t({ ar: "الإصدار:", en: "Version:" })}
                  </span>
                  <span className="text-muted-foreground">v{backupInfo.version}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                onClick={handleCreateBackup} 
                disabled={backupLoading}
                className="btn-luxury"
              >
                {backupLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t({ ar: "جاري الإنشاء...", en: "Creating..." })}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {t({ ar: "إنشاء نسخة احتياطية جديدة", en: "Create New Backup" })}
                  </>
                )}
              </Button>

              <Button 
                onClick={handleDownloadBackup}
                variant="outline"
                disabled={!backupInfo.created_at}
              >
                <Download className="w-4 h-4 mr-2" />
                {t({ ar: "تحميل النسخة الاحتياطية", en: "Download Backup" })}
              </Button>
              
              <Button 
                onClick={() => setShowBackupManager(true)}
                variant="outline"
              >
                <Database className="w-4 h-4 mr-2" />
                {t({ ar: "إدارة جميع النسخ", en: "Manage All Backups" })}
              </Button>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-xs text-blue-900 dark:text-blue-100">
                {t({ 
                  ar: "تشمل النسخة الاحتياطية: المدن، الفنادق، الأسعار الموسمية، القسائم، والإعدادات. يتم حفظ نسخة في قاعدة البيانات ويمكنك تحميلها كملف JSON.", 
                  en: "Backup includes: cities, hotels, seasonal pricing, coupons, and settings. A copy is saved in the database and can be downloaded as a JSON file." 
                })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <BackupManager open={showBackupManager} onOpenChange={setShowBackupManager} />

      <Footer />
    </div>
  );
}