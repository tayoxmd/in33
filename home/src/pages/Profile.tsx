import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { User, Mail, Phone, Lock, ArrowRight, Save } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function Profile() {
  const { user, userRole, loading } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }
    
    if (user) {
      fetchProfile();
    }
  }, [user, loading, navigate]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();

      if (error) throw error;
      
      if (data) {
        setFullName(data.full_name || '');
        setPhone(data.phone || '');
      }
      
      setEmail(user?.email || '');
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone: phone,
        })
        .eq('id', user!.id);

      if (profileError) throw profileError;

      // Update password if provided
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          toast({
            title: t({ ar: "خطأ", en: "Error" }),
            description: t({ ar: "كلمات المرور غير متطابقة", en: "Passwords do not match" }),
            variant: "destructive",
          });
          setSaving(false);
          return;
        }

        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword
        });

        if (passwordError) throw passwordError;
      }

      toast({
        title: t({ ar: "تم الحفظ", en: "Saved" }),
        description: t({ ar: "تم حفظ التغييرات بنجاح", en: "Changes saved successfully" }),
      });
      
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: error.message,
        variant: "destructive",
      });
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
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowRight className="ml-2 w-4 h-4" />
          {t({ ar: 'العودة', en: 'Back' })}
        </Button>

        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              {t({ ar: "الملف الشخصي", en: "Profile" })}
            </h1>
            <p className="text-muted-foreground">
              {t({ ar: "إدارة معلوماتك الشخصية", en: "Manage your personal information" })}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="card-luxury md:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  {t({ ar: "المعلومات الشخصية", en: "Personal Information" })}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {t({ ar: "الاسم الكامل", en: "Full Name" })}
                    </Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={t({ ar: "أدخل الاسم الكامل", en: "Enter full name" })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {t({ ar: "رقم الجوال", en: "Phone Number" })}
                    </Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={t({ ar: "أدخل رقم الجوال", en: "Enter phone number" })}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {t({ ar: "البريد الإلكتروني", en: "Email" })}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t({ ar: "لا يمكن تعديل البريد الإلكتروني", en: "Email cannot be changed" })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-luxury md:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  {t({ ar: "تغيير كلمة المرور", en: "Change Password" })}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">
                      {t({ ar: "كلمة المرور الجديدة", en: "New Password" })}
                    </Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={t({ ar: "أدخل كلمة المرور الجديدة", en: "Enter new password" })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      {t({ ar: "تأكيد كلمة المرور", en: "Confirm Password" })}
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t({ ar: "أعد إدخال كلمة المرور", en: "Re-enter password" })}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t({ ar: "اترك فارغًا إذا لم ترغب في تغيير كلمة المرور", en: "Leave blank if you don't want to change password" })}
                </p>
              </CardContent>
            </Card>

            <div className="md:col-span-3 flex justify-end">
              <Button 
                onClick={handleSaveProfile}
                disabled={saving}
                className="btn-luxury px-8"
              >
                <Save className="ml-2 w-4 h-4" />
                {saving 
                  ? <LoadingSpinner size="sm" />
                  : t({ ar: "حفظ التغييرات", en: "Save Changes" })
                }
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
