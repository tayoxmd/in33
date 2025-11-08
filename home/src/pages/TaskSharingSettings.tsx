import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Share2, Mail, MessageCircle, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface SharingSettings {
  id: string;
  share_via_email: boolean;
  share_via_whatsapp: boolean;
  share_via_whatsapp_group: boolean;
  whatsapp_group_link: string;
  notify_on_create: boolean;
  notify_on_update: boolean;
  notify_on_status_change: boolean;
}

export default function TaskSharingSettings() {
  const { t } = useLanguage();
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SharingSettings>({
    id: '',
    share_via_email: false,
    share_via_whatsapp: false,
    share_via_whatsapp_group: false,
    whatsapp_group_link: '',
    notify_on_create: true,
    notify_on_update: true,
    notify_on_status_change: true
  });

  const canManage = userRole === 'admin' || userRole === 'manager' || userRole === 'assistant_manager';

  useEffect(() => {
    if (!canManage) {
      navigate('/task-manager');
      return;
    }
    fetchSettings();
  }, [canManage, navigate]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('task_sharing_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error(t({ ar: 'خطأ في جلب الإعدادات', en: 'Error fetching settings' }));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('task_sharing_settings')
        .upsert({
          ...settings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success(t({ ar: 'تم حفظ الإعدادات', en: 'Settings saved' }));
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(t({ ar: 'خطأ في الحفظ', en: 'Error saving' }));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="container mx-auto p-4 md:p-6 pt-10 md:pt-14">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/task-settings')}
            className="h-10 w-10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Share2 className="w-6 h-6 md:w-8 md:h-8 text-green-500" />
              {t({ ar: 'المشاركة والنشر', en: 'Sharing & Notifications' })}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t({ 
                ar: 'إعدادات إرسال إشعارات المهام عبر البريد و واتساب',
                en: 'Configure task notification settings via email and WhatsApp'
              })}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Email Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-500" />
                {t({ ar: 'البريد الإلكتروني', en: 'Email' })}
              </CardTitle>
              <CardDescription>
                {t({ ar: 'إرسال إشعارات المهام عبر البريد', en: 'Send task notifications via email' })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-share" className="flex-1">
                  {t({ ar: 'تفعيل إشعارات البريد', en: 'Enable email notifications' })}
                </Label>
                <Switch
                  id="email-share"
                  checked={settings.share_via_email}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, share_via_email: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* WhatsApp Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-green-500" />
                {t({ ar: 'واتساب', en: 'WhatsApp' })}
              </CardTitle>
              <CardDescription>
                {t({ ar: 'إرسال إشعارات المهام عبر واتساب', en: 'Send task notifications via WhatsApp' })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="whatsapp-share" className="flex-1">
                  {t({ ar: 'إرسال للأشخاص مباشرة', en: 'Send directly to assignees' })}
                </Label>
                <Switch
                  id="whatsapp-share"
                  checked={settings.share_via_whatsapp}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, share_via_whatsapp: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* WhatsApp Group Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-500" />
                {t({ ar: 'مجموعة واتساب', en: 'WhatsApp Group' })}
              </CardTitle>
              <CardDescription>
                {t({ ar: 'إرسال إشعارات لمجموعة واتساب', en: 'Send notifications to WhatsApp group' })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="group-share" className="flex-1">
                  {t({ ar: 'تفعيل إرسال للمجموعة', en: 'Enable group notifications' })}
                </Label>
                <Switch
                  id="group-share"
                  checked={settings.share_via_whatsapp_group}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, share_via_whatsapp_group: checked })
                  }
                />
              </div>

              {settings.share_via_whatsapp_group && (
                <div className="space-y-2">
                  <Label htmlFor="group-link">
                    {t({ ar: 'رابط المجموعة الدائم', en: 'Permanent Group Link' })}
                  </Label>
                  <Input
                    id="group-link"
                    value={settings.whatsapp_group_link || ''}
                    onChange={(e) => 
                      setSettings({ ...settings, whatsapp_group_link: e.target.value })
                    }
                    placeholder="https://chat.whatsapp.com/..."
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notification Events */}
          <Card>
            <CardHeader>
              <CardTitle>
                {t({ ar: 'متى يتم الإرسال', en: 'When to Send' })}
              </CardTitle>
              <CardDescription>
                {t({ ar: 'اختر الأحداث التي تريد إرسال إشعارات عنها', en: 'Choose events to send notifications for' })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="notify-create" className="flex-1">
                  {t({ ar: 'عند إنشاء مهمة جديدة', en: 'When creating new task' })}
                </Label>
                <Switch
                  id="notify-create"
                  checked={settings.notify_on_create}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, notify_on_create: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="notify-update" className="flex-1">
                  {t({ ar: 'عند تعديل المهمة', en: 'When updating task' })}
                </Label>
                <Switch
                  id="notify-update"
                  checked={settings.notify_on_update}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, notify_on_update: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="notify-status" className="flex-1">
                  {t({ ar: 'عند تغيير حالة المهمة', en: 'When changing task status' })}
                </Label>
                <Switch
                  id="notify-status"
                  checked={settings.notify_on_status_change}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, notify_on_status_change: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="mt-8 flex gap-4 justify-center">
          <Button
            variant="outline"
            onClick={() => navigate('/task-settings')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t({ ar: 'إلغاء', en: 'Cancel' })}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2"
          >
            {saving ? (
              <>
                <LoadingSpinner size="sm" />
                {t({ ar: 'جاري الحفظ...', en: 'Saving...' })}
              </>
            ) : (
              <>
                {t({ ar: 'حفظ الإعدادات', en: 'Save Settings' })}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
