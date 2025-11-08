import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { countries } from "@/data/countries";
import { Search, UserCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface BookingAuthDialogProps {
  open: boolean;
  onClose: () => void;
  onGuestContinue: (phone: string, countryCode: string) => void;
}

export function BookingAuthDialog({ open, onClose, onGuestContinue }: BookingAuthDialogProps) {
  const { t, language } = useLanguage();
  const { signIn } = useAuth();
  const [mode, setMode] = useState<'main' | 'guest' | 'login' | 'signup'>('main');
  const [countryCode, setCountryCode] = useState('+966');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  const selectedCountry = countries.find(c => c.dialCode === countryCode) || countries[0];

  const filteredCountries = countries.filter(country => 
    country.nameAr.includes(searchQuery) || 
    country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.dialCode.includes(searchQuery)
  );

  const validatePhoneNumber = (number: string) => {
    if (number.startsWith('0')) {
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: t({ ar: "الرجاء إدخال الرقم بدون الصفر في البداية", en: "Please enter the number without leading zero" }),
        variant: "destructive",
      });
      return false;
    }
    
    if (number.length !== selectedCountry.maxLength) {
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: t({ 
          ar: `رقم الهاتف يجب أن يكون ${selectedCountry.maxLength} أرقام`, 
          en: `Phone number must be ${selectedCountry.maxLength} digits` 
        }),
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  const handleGuestSubmit = () => {
    if (!phoneNumber.trim()) {
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: t({ ar: "الرجاء إدخال رقم الهاتف", en: "Please enter phone number" }),
        variant: "destructive",
      });
      return;
    }

    if (validatePhoneNumber(phoneNumber)) {
      const fullPhone = `${countryCode}${phoneNumber}`;
      onGuestContinue(fullPhone, countryCode);
      onClose();
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: t({ ar: "الرجاء ملء جميع الحقول", en: "Please fill all fields" }),
        variant: "destructive",
      });
      return;
    }

    const { error } = await signIn(email, password);
    if (error) {
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: error.message,
        variant: "destructive",
      });
    } else {
      onClose();
    }
  };

  const handleSignup = async () => {
    if (!email || !password || !fullName || !phone) {
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: t({ ar: "الرجاء ملء جميع الحقول", en: "Please fill all fields" }),
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: fullName,
          phone: phone
        }
      }
    });

    if (error) {
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: t({ ar: "تم بنجاح", en: "Success" }),
        description: t({ ar: "تم إنشاء الحساب بنجاح", en: "Account created successfully" }),
      });
      setMode('login');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            {mode === 'main' && t({ ar: "اختر طريقة المتابعة", en: "Choose how to continue" })}
            {mode === 'guest' && t({ ar: "الاستمرار كضيف", en: "Continue as Guest" })}
            {mode === 'login' && t({ ar: "تسجيل الدخول", en: "Login" })}
            {mode === 'signup' && t({ ar: "إنشاء حساب جديد", en: "Sign Up" })}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {mode === 'main' && (
            <>
                <Button
                  variant="outline"
                  className="w-full h-14 text-lg gap-3"
                  style={{ backgroundColor: '#0076ff', color: 'white', borderColor: '#0076ff' }}
                  onClick={() => setMode('guest')}
                >
                  <UserCircle className="w-6 h-6" />
                  {t({ ar: "الاستمرار كضيف", en: "Continue as Guest" })}
                </Button>

                {/* Twitter Login Button */}
                <Button
                  variant="outline"
                  className="w-full h-14 text-lg gap-3"
                  onClick={async () => {
                    const { error } = await supabase.auth.signInWithOAuth({
                      provider: 'twitter',
                      options: {
                        redirectTo: `${window.location.origin}/booking`,
                      }
                    });
                    if (error) {
                      toast({
                        title: t({ ar: "خطأ", en: "Error" }),
                        description: error.message,
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  {t({ ar: "الدخول عبر Twitter", en: "Sign in with Twitter" })}
                </Button>

                {/* WhatsApp Login Button */}
                <Button
                  variant="outline"
                  className="w-full h-14 text-lg gap-3"
                  style={{ backgroundColor: '#25D366', color: 'white', borderColor: '#25D366' }}
                  onClick={() => {
                    toast({
                      title: t({ ar: "قريباً", en: "Coming Soon" }),
                      description: t({ ar: "التحقق عبر واتساب سيكون متاحاً قريباً", en: "WhatsApp verification will be available soon" }),
                    });
                  }}
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  {t({ ar: "التحقق عبر واتساب", en: "WhatsApp Verification" })}
                </Button>

              <Button
                variant="outline"
                className="w-full h-14 text-lg"
                onClick={() => setMode('login')}
              >
                {t({ ar: "تسجيل الدخول", en: "Login" })}
              </Button>

              <Button
                variant="default"
                className="w-full h-14 text-lg"
                onClick={() => setMode('signup')}
              >
                {t({ ar: "إنشاء حساب جديد", en: "Sign Up" })}
              </Button>
            </>
          )}

          {mode === 'guest' && (
            <>
              <div className="space-y-2">
                <Label>{t({ ar: "رقم الهاتف", en: "Phone Number" })}</Label>
                <div className="flex gap-2" dir="ltr">
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue>
                        {selectedCountry.dialCode}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <div className="p-2 sticky top-0 bg-background z-10">
                        <div className="relative">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder={t({ ar: "بحث...", en: "Search..." })}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8"
                          />
                        </div>
                      </div>
                      {filteredCountries.map((country) => (
                        <SelectItem key={country.code} value={country.dialCode}>
                          {country.dialCode} - {language === 'ar' ? country.nameAr : country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="tel"
                    className="flex-1"
                    value={phoneNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= selectedCountry.maxLength) {
                        setPhoneNumber(value);
                      }
                    }}
                    placeholder={selectedCountry.placeholder}
                    maxLength={selectedCountry.maxLength}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {t({ 
                    ar: `يجب أن يكون ${selectedCountry.maxLength} رقم بدون الصفر`, 
                    en: `Must be ${selectedCountry.maxLength} digits without leading zero` 
                  })}
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setMode('main')} className="flex-1">
                  {t({ ar: "رجوع", en: "Back" })}
                </Button>
                <Button onClick={handleGuestSubmit} className="flex-1">
                  {t({ ar: "متابعة", en: "Continue" })}
                </Button>
              </div>
            </>
          )}

          {mode === 'login' && (
            <>
              <div className="space-y-2">
                <Label>{t({ ar: "البريد الإلكتروني", en: "Email" })}</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label>{t({ ar: "كلمة المرور", en: "Password" })}</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setMode('main')} className="flex-1">
                  {t({ ar: "رجوع", en: "Back" })}
                </Button>
                <Button onClick={handleLogin} className="flex-1">
                  {t({ ar: "دخول", en: "Login" })}
                </Button>
              </div>
            </>
          )}

          {mode === 'signup' && (
            <>
              <div className="space-y-2">
                <Label>{t({ ar: "الاسم الكامل", en: "Full Name" })}</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t({ ar: "أدخل اسمك الكامل", en: "Enter your full name" })}
                />
              </div>

              <div className="space-y-2">
                <Label>{t({ ar: "رقم الجوال", en: "Phone" })}</Label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+966 5XX XXX XXX"
                />
              </div>

              <div className="space-y-2">
                <Label>{t({ ar: "البريد الإلكتروني", en: "Email" })}</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label>{t({ ar: "كلمة المرور", en: "Password" })}</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setMode('main')} className="flex-1">
                  {t({ ar: "رجوع", en: "Back" })}
                </Button>
                <Button onClick={handleSignup} className="flex-1">
                  {t({ ar: "تسجيل", en: "Sign Up" })}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
