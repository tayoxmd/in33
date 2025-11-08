import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Phone, Mail } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { authSchema } from "@/lib/validations";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Separator } from "@/components/ui/separator";
import { countries } from "@/data/countries";
import { useLanguage } from "@/contexts/LanguageContext";
import { WhatsAppAuth } from "@/components/WhatsAppAuth";
import logo from "@/assets/logo.png";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect');
  const [isLogin, setIsLogin] = useState(searchParams.get('mode') !== 'signup');
  const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone');
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+966");
  const [loading, setLoading] = useState(false);
  const [whatsappAuthOpen, setWhatsappAuthOpen] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleWhatsAppSignup = () => {
    setWhatsappAuthOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Login logic
        if (loginMethod === 'email') {
          const { error } = await signIn(emailOrPhone, password, redirectUrl || undefined);
          if (error) {
            toast({
              title: t({ ar: "خطأ في تسجيل الدخول", en: "Login Error" }),
              description: error.message,
              variant: "destructive",
            });
          } else {
            toast({
              title: t({ ar: "تم تسجيل الدخول بنجاح", en: "Logged in successfully" }),
              description: t({ ar: "مرحباً بك في IN33", en: "Welcome to IN33" }),
            });
          }
        } else {
          // Login with phone
          const fullPhone = `${countryCode}${phone}`;
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('phone', fullPhone)
            .single();
          
          if (profileError || !profileData) {
            toast({
              title: t({ ar: "خطأ في تسجيل الدخول", en: "Login Error" }),
              description: t({ ar: "رقم الهاتف غير مسجل", en: "Phone number not registered" }),
              variant: "destructive",
            });
            setLoading(false);
            return;
          }

          const { data: userData } = await supabase.auth.admin.getUserById(profileData.id);
          
          if (userData?.user?.email) {
            const { error } = await signIn(userData.user.email, password, redirectUrl || undefined);
            if (error) {
              toast({
                title: t({ ar: "خطأ في تسجيل الدخول", en: "Login Error" }),
                description: error.message,
                variant: "destructive",
              });
            } else {
              toast({
                title: t({ ar: "تم تسجيل الدخول بنجاح", en: "Logged in successfully" }),
                description: t({ ar: "مرحباً بك في IN33", en: "Welcome to IN33" }),
              });
            }
          }
        }
      } else {
        // Sign up
        const fullPhone = `${countryCode}${phone}`;
        
        // Email is optional
        if (!fullName || !phone || !password) {
          toast({
            title: t({ ar: "خطأ في البيانات", en: "Data Error" }),
            description: t({ ar: "يرجى ملء الحقول الإلزامية", en: "Please fill required fields" }),
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // If email is provided, use it, otherwise generate a unique email
        const emailToUse = email.trim() || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@in33.temp`;

        const { error } = await signUp(
          emailToUse,
          password,
          fullName,
          fullPhone,
          redirectUrl || undefined
        );
        
        if (error) {
          toast({
            title: t({ ar: "خطأ في التسجيل", en: "Signup Error" }),
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: t({ ar: "تم التسجيل بنجاح", en: "Signed up successfully" }),
            description: t({ ar: "تم إنشاء حسابك بنجاح", en: "Your account has been created" }),
          });
          if (!redirectUrl) {
            setIsLogin(true);
          }
        }
      }
    } catch (error: any) {
      toast({
        title: t({ ar: "حدث خطأ", en: "An error occurred" }),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary via-primary-glow to-primary">
      <Card className="w-full max-w-md bg-card shadow-luxury border-0 rounded-2xl">
        <CardHeader className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-4">
            <div className="absolute inset-0 blur-2xl bg-gradient-to-r from-amber-100/30 via-amber-50/40 to-amber-100/30 animate-pulse" />
            <img 
              src={logo} 
              alt="إثراء" 
              className="relative w-full h-full object-contain drop-shadow-2xl"
              style={{
                filter: "drop-shadow(0 0 25px rgba(245, 222, 179, 0.6)) drop-shadow(0 0 12px rgba(222, 184, 135, 0.4))",
                animation: "logoFloat 6s ease-in-out infinite"
              }}
            />
          </div>
          <CardTitle className="text-2xl text-primary font-bold">
            {isLogin ? t({ ar: "تسجيل الدخول", en: "Sign In" }) : t({ ar: "إنشاء حساب جديد", en: "Create Account" })}
          </CardTitle>
          <CardDescription>
            {isLogin
              ? t({ ar: "أدخل بياناتك للدخول إلى حسابك", en: "Enter your details to sign in" })
              : t({ ar: "املأ البيانات التالية لإنشاء حساب جديد", en: "Fill in the details to create a new account" })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            {isLogin && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                <Button
                  type="button"
                  variant={loginMethod === 'phone' ? 'default' : 'outline'}
                  onClick={() => setLoginMethod('phone')}
                  className="gap-2"
                >
                  <Phone className="w-4 h-4" />
                  {t({ ar: "رقم الجوال", en: "Phone" })}
                </Button>
                <Button
                  type="button"
                  variant={loginMethod === 'email' ? 'default' : 'outline'}
                  onClick={() => setLoginMethod('email')}
                  className="gap-2"
                >
                  <Mail className="w-4 h-4" />
                  {t({ ar: "البريد", en: "Email" })}
                </Button>
              </div>
            )}

            {!isLogin && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-sm">
                    {t({ ar: "الاسم الكامل", en: "Full Name" })} *
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder={t({ ar: "أدخل اسمك الكامل", en: "Enter your full name" })}
                    className="h-10"
                  />
                </div>
                
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm">
                  {t({ ar: "رقم الجوال", en: "Phone Number" })} *
                </Label>
                <div className="flex gap-2" dir="ltr">
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.dialCode} value={country.dialCode}>
                          {country.dialCode}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="phone"
                    type="tel"
                    className="flex-1"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder={t({ ar: "5XX XXX XXX", en: "5XX XXX XXX" })}
                  />
                </div>
              </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email" className="text-sm">
                      {t({ ar: "البريد الإلكتروني", en: "Email" })}
                    </Label>
                    <span className="text-xs text-muted-foreground">
                      ({t({ ar: "اختياري", en: "Optional" })})
                    </span>
                  </div>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="h-10"
                  />
                </div>
              </>
            )}

            {isLogin && loginMethod === 'phone' && (
              <div className="space-y-1.5">
                <Label htmlFor="loginPhone" className="text-sm">
                  {t({ ar: "رقم الجوال", en: "Phone Number" })}
                </Label>
                <div className="flex gap-2" dir="ltr">
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.dialCode} value={country.dialCode}>
                          {country.dialCode}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="loginPhone"
                    type="tel"
                    className="flex-1"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder={t({ ar: "5XX XXX XXX", en: "5XX XXX XXX" })}
                  />
                </div>
              </div>
            )}

            {isLogin && loginMethod === 'email' && (
              <div className="space-y-1.5">
                <Label htmlFor="emailOrPhone" className="text-sm">
                  {t({ ar: "البريد الإلكتروني", en: "Email" })}
                </Label>
                <Input
                  id="emailOrPhone"
                  type="email"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  required
                  placeholder="example@email.com"
                  className="h-10"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm">
                {t({ ar: "كلمة المرور", en: "Password" })}
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={6}
                className="h-10"
              />
            </div>

            <Button
              type="submit"
              className="w-full btn-luxury h-11"
              disabled={loading}
            >
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : isLogin ? (
                t({ ar: "تسجيل الدخول", en: "Sign In" })
              ) : (
                t({ ar: "إنشاء حساب", en: "Create Account" })
              )}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  {t({ ar: "أو", en: "Or" })}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Button
                type="button"
                onClick={handleWhatsAppSignup}
                disabled={loading}
                className="w-full h-12 gap-2 bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span className="font-semibold text-base">
                  {t({ ar: "دخول سريع عبر واتساب", en: "Quick Sign in with WhatsApp" })}
                </span>
              </Button>
            </div>
          </div>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                navigate(isLogin ? '/auth?mode=signup' : '/auth?mode=login');
              }}
              className="text-sm text-primary hover:underline"
            >
              {isLogin
                ? t({ ar: "ليس لديك حساب؟ سجل الآن", en: "Don't have an account? Sign Up" })
                : t({ ar: "لديك حساب بالفعل؟ سجل الدخول", en: "Already have an account? Sign In" })}
            </button>
          </div>
        </CardContent>
      </Card>
      
      <WhatsAppAuth 
        open={whatsappAuthOpen} 
        onOpenChange={setWhatsappAuthOpen}
        redirectUrl={redirectUrl || undefined}
      />
      
      <style>{`
        @keyframes logoFloat {
          0%, 100% {
            transform: perspective(1000px) translateY(0) rotateX(0deg);
          }
          50% {
            transform: perspective(1000px) translateY(-10px) rotateX(10deg);
          }
        }

        @keyframes logoRotate {
          0% {
            transform: perspective(1000px) rotateY(0deg);
          }
          100% {
            transform: perspective(1000px) rotateY(360deg);
          }
        }
      `}</style>
    </div>
  );
}
