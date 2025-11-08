import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Webhook, CheckCircle, XCircle, TestTube, Save, Copy } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Badge } from "@/components/ui/badge";

export default function LovableWebhookSettings() {
  const { t } = useLanguage();
  const { userRole, loading } = useAuth();
  const navigate = useNavigate();
  const [webhookUrl, setWebhookUrl] = useState("http://10.88.50.181:3001/webhook");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [isEnabled, setIsEnabled] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle");

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
        .select('lovable_webhook_url, lovable_webhook_secret, lovable_webhook_enabled')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setWebhookUrl(data.lovable_webhook_url || "http://10.88.50.181:3001/webhook");
        setWebhookSecret(data.lovable_webhook_secret || "");
        setIsEnabled(data.lovable_webhook_enabled !== false);
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingSettings(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setConnectionStatus("idle");
    
    try {
      const response = await fetch(`${webhookUrl.replace('/webhook', '')}/sync-status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setConnectionStatus("success");
        toast({
          title: t({ ar: "نجح الاتصال", en: "Connection Successful" }),
          description: t({ ar: "تم الاتصال بنجاح مع سيرفر المزامنة", en: "Successfully connected to sync server" }),
        });
      } else {
        throw new Error('Connection failed');
      }
    } catch (error: any) {
      setConnectionStatus("error");
      toast({
        title: t({ ar: "فشل الاتصال", en: "Connection Failed" }),
        description: t({ ar: "تعذر الاتصال مع سيرفر المزامنة. تأكد من أن السيرفر يعمل", en: "Could not connect to sync server. Make sure the server is running" }),
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const saveSettings = async () => {
    try {
      const { data: existingSettings } = await supabase
        .from('site_settings')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const updateData = {
        lovable_webhook_url: webhookUrl,
        lovable_webhook_secret: webhookSecret,
        lovable_webhook_enabled: isEnabled,
        updated_at: new Date().toISOString()
      };

      if (existingSettings) {
        const { error } = await supabase
          .from('site_settings')
          .update(updateData)
          .eq('id', existingSettings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert(updateData);
        if (error) throw error;
      }

      toast({
        title: t({ ar: "تم الحفظ", en: "Saved" }),
        description: t({ ar: "تم حفظ إعدادات Webhook بنجاح", en: "Webhook settings saved successfully" }),
      });
    } catch (error: any) {
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: t({ ar: "تم النسخ", en: "Copied" }),
      description: t({ ar: "تم نسخ الرابط إلى الحافظة", en: "Link copied to clipboard" }),
    });
  };

  if (loading || loadingSettings) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/site-settings')}
            className="h-10 w-10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Webhook className="w-6 h-6 md:w-8 md:w-8" />
              {t({ ar: 'إعدادات ربط Lovable', en: 'Lovable Webhook Settings' })}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t({ 
                ar: 'إعدادات المزامنة مع Lovable', 
                en: 'Sync settings with Lovable' 
              })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Webhook Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>{t({ ar: 'إعدادات Webhook', en: 'Webhook Settings' })}</CardTitle>
              <CardDescription>
                {t({ 
                  ar: 'أدخل معلومات Webhook للربط مع Lovable', 
                  en: 'Enter Webhook information to connect with Lovable' 
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="webhook-url">
                  {t({ ar: 'Webhook URL', en: 'Webhook URL' })} *
                </Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="webhook-url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="http://10.88.50.181:3001/webhook"
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(webhookUrl)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {t({ 
                    ar: 'URL الذي سيستقبل التحديثات من Lovable', 
                    en: 'URL that will receive updates from Lovable' 
                  })}
                </p>
              </div>

              <div>
                <Label htmlFor="webhook-secret">
                  {t({ ar: 'Webhook Secret (اختياري)', en: 'Webhook Secret (Optional)' })}
                </Label>
                <Input
                  id="webhook-secret"
                  type="password"
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  placeholder={t({ ar: 'أدخل Secret إذا كان مطلوباً', en: 'Enter Secret if required' })}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {t({ 
                    ar: 'Secret للتحقق من صحة الطلبات (اختياري)', 
                    en: 'Secret to verify request authenticity (optional)' 
                  })}
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <Label htmlFor="enabled" className="text-base">
                    {t({ ar: 'تفعيل المزامنة', en: 'Enable Sync' })}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t({ 
                      ar: 'تفعيل المزامنة التلقائية مع Lovable', 
                      en: 'Enable automatic sync with Lovable' 
                    })}
                  </p>
                </div>
                <input
                  id="enabled"
                  type="checkbox"
                  checked={isEnabled}
                  onChange={(e) => setIsEnabled(e.target.checked)}
                  className="w-5 h-5"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={testConnection}
                  disabled={testing}
                  variant="outline"
                  className="flex-1"
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  {testing ? t({ ar: 'جاري الاختبار...', en: 'Testing...' }) : t({ ar: 'اختبار الاتصال', en: 'Test Connection' })}
                </Button>
                <Button
                  onClick={saveSettings}
                  className="flex-1"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {t({ ar: 'حفظ', en: 'Save' })}
                </Button>
              </div>

              {connectionStatus !== "idle" && (
                <div className={`flex items-center gap-2 p-3 rounded-lg ${
                  connectionStatus === "success" 
                    ? "bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800" 
                    : "bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800"
                }`}>
                  {connectionStatus === "success" ? (
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  )}
                  <span className={`text-sm ${
                    connectionStatus === "success" 
                      ? "text-green-900 dark:text-green-100" 
                      : "text-red-900 dark:text-red-100"
                  }`}>
                    {connectionStatus === "success" 
                      ? t({ ar: "الاتصال ناجح", en: "Connection successful" })
                      : t({ ar: "فشل الاتصال", en: "Connection failed" })
                    }
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>{t({ ar: 'تعليمات الإعداد', en: 'Setup Instructions' })}</CardTitle>
              <CardDescription>
                {t({ 
                  ar: 'كيفية إعداد Webhook في Lovable', 
                  en: 'How to setup Webhook in Lovable' 
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">1</Badge>
                  <div>
                    <p className="font-medium">{t({ ar: 'انسخ Webhook URL', en: 'Copy Webhook URL' })}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t({ 
                        ar: 'انسخ الرابط أعلاه أو استخدم: http://10.88.50.181:3001/webhook', 
                        en: 'Copy the link above or use: http://10.88.50.181:3001/webhook' 
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">2</Badge>
                  <div>
                    <p className="font-medium">{t({ ar: 'في Lovable', en: 'In Lovable' })}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t({ 
                        ar: 'اذهب إلى Settings → Cloud → Secrets', 
                        en: 'Go to Settings → Cloud → Secrets' 
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">3</Badge>
                  <div>
                    <p className="font-medium">{t({ ar: 'أضف Secret جديد', en: 'Add New Secret' })}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t({ 
                        ar: 'Name: LOVABLE_WEBHOOK_URL', 
                        en: 'Name: LOVABLE_WEBHOOK_URL' 
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t({ 
                        ar: 'Value: http://10.88.50.181:3001/webhook', 
                        en: 'Value: http://10.88.50.181:3001/webhook' 
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">4</Badge>
                  <div>
                    <p className="font-medium">{t({ ar: 'استخدم في الكود', en: 'Use in Code' })}</p>
                    <div className="bg-muted p-3 rounded-lg mt-2">
                      <code className="text-xs">
                        {`const webhookUrl = process.env.LOVABLE_WEBHOOK_URL;
await fetch(webhookUrl, {
  method: 'POST',
  body: JSON.stringify({ files: [...] })
});`}
                      </code>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>{t({ ar: 'ملاحظة:', en: 'Note:' })}</strong> {t({ 
                    ar: 'إذا لم يكن Webhook متاحاً في Lovable، يمكنك استخدام API مباشر من الكود', 
                    en: 'If Webhook is not available in Lovable, you can use direct API from code' 
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

