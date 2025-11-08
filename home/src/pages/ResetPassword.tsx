import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2, Lock } from "lucide-react";

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        title: t("خطأ", "Error"),
        description: t("كلمات المرور غير متطابقة", "Passwords do not match"),
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: t("خطأ", "Error"),
        description: t("كلمة المرور يجب أن تكون 6 أحرف على الأقل", "Password must be at least 6 characters"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    setLoading(false);

    if (error) {
      toast({
        title: t("خطأ", "Error"),
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: t("نجح", "Success"),
        description: t("تم تغيير كلمة المرور بنجاح", "Password changed successfully"),
      });
      navigate('/dashboard');
    }
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-subtle pt-28">
      <Card className="w-full max-w-md card-luxury">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-lg bg-gradient-luxury flex items-center justify-center shadow-luxury mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl text-gradient-luxury">
            {t("إعادة تعيين كلمة المرور", "Reset Password")}
          </CardTitle>
          <CardDescription>
            {t("أدخل كلمة المرور الجديدة", "Enter your new password")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">
                {t("كلمة المرور الجديدة", "New Password")}
              </Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {t("تأكيد كلمة المرور", "Confirm Password")}
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={6}
              />
            </div>
            <Button
              type="submit"
              className="w-full btn-luxury"
              disabled={loading}
            >
              {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              {t("تغيير كلمة المرور", "Change Password")}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="text-sm"
            >
              {t("إلغاء", "Cancel")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
