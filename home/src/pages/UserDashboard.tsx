import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { User, Mail, Phone, Lock, ArrowRight, Save, UserPlus, Trash2 } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { countries } from "@/data/countries";

interface Guest {
  id: string;
  guest_name: string;
  guest_phone: string | null;
  guest_country_code: string;
}

export default function UserDashboard() {
  const { user, loading } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  
  // Profile states
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  
  // Guests states
  const [guests, setGuests] = useState<Guest[]>([]);
  const [newGuestName, setNewGuestName] = useState("");
  const [newGuestPhone, setNewGuestPhone] = useState("");
  const [newGuestCountryCode, setNewGuestCountryCode] = useState("+966");
  const [addingGuest, setAddingGuest] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }
    
    if (user) {
      fetchProfile();
      fetchGuests();
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

  const fetchGuests = async () => {
    try {
      const { data, error } = await supabase
        .from('user_guests')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setGuests(data || []);
    } catch (error) {
      console.error('Error fetching guests:', error);
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

  const handleAddGuest = async () => {
    if (!newGuestName.trim()) {
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: t({ ar: "يرجى إدخال اسم الضيف", en: "Please enter guest name" }),
        variant: "destructive",
      });
      return;
    }

    setAddingGuest(true);
    try {
      const { error } = await supabase
        .from('user_guests')
        .insert([{
          user_id: user!.id,
          guest_name: newGuestName.trim(),
          guest_phone: newGuestPhone.trim() || null,
          guest_country_code: newGuestCountryCode,
        }]);

      if (error) throw error;

      toast({
        title: t({ ar: "تم الإضافة", en: "Added" }),
        description: t({ ar: "تم إضافة الضيف بنجاح", en: "Guest added successfully" }),
      });

      setNewGuestName("");
      setNewGuestPhone("");
      setNewGuestCountryCode("+966");
      fetchGuests();
    } catch (error: any) {
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAddingGuest(false);
    }
  };

  const handleDeleteGuest = async (guestId: string) => {
    try {
      const { error } = await supabase
        .from('user_guests')
        .delete()
        .eq('id', guestId);

      if (error) throw error;

      toast({
        title: t({ ar: "تم الحذف", en: "Deleted" }),
        description: t({ ar: "تم حذف الضيف بنجاح", en: "Guest deleted successfully" }),
      });

      fetchGuests();
    } catch (error: any) {
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: error.message,
        variant: "destructive",
      });
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
          <ArrowRight className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
          {t({ ar: 'العودة', en: 'Back' })}
        </Button>

        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              {t({ ar: "لوحة التحكم", en: "Dashboard" })}
            </h1>
            <p className="text-muted-foreground">
              {t({ ar: "إدارة معلوماتك الشخصية والضيوف", en: "Manage your personal information and guests" })}
            </p>
          </div>

          <div className="space-y-6">
            {/* Personal Information Card */}
            <Card className="card-luxury">
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

            {/* Change Password Card */}
            <Card className="card-luxury">
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

            {/* Guests Management Card */}
            <Card className="card-luxury">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  {t({ ar: "إدارة الضيوف", en: "Manage Guests" })}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add New Guest */}
                <div className="p-4 border rounded-lg space-y-3">
                  <h3 className="font-semibold text-sm">
                    {t({ ar: "إضافة ضيف جديد", en: "Add New Guest" })}
                  </h3>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="guestName">
                        {t({ ar: "اسم الضيف", en: "Guest Name" })}
                      </Label>
                      <Input
                        id="guestName"
                        value={newGuestName}
                        onChange={(e) => setNewGuestName(e.target.value)}
                        placeholder={t({ ar: "أدخل اسم الضيف", en: "Enter guest name" })}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="guestPhone">
                          {t({ ar: "رقم الجوال", en: "Phone Number" })}
                        </Label>
                        <span className="text-xs text-muted-foreground">
                          ({t({ ar: "اختياري", en: "Optional" })})
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <Select
                          value={newGuestCountryCode}
                          onValueChange={setNewGuestCountryCode}
                        >
                          <SelectTrigger className="col-span-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {countries.map((country) => (
                              <SelectItem key={country.dialCode} value={country.dialCode}>
                                {country.dialCode} ({language === 'ar' ? country.nameAr : country.name})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          id="guestPhone"
                          className="col-span-2"
                          value={newGuestPhone}
                          onChange={(e) => setNewGuestPhone(e.target.value)}
                          placeholder={t({ ar: "رقم الجوال", en: "Phone number" })}
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleAddGuest}
                      disabled={addingGuest}
                      className="w-full"
                    >
                      {addingGuest ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <>
                          <UserPlus className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                          {t({ ar: "إضافة ضيف", en: "Add Guest" })}
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Guests List */}
                {guests.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">
                      {t({ ar: "الضيوف المسجلين", en: "Registered Guests" })}
                    </h3>
                    <div className="space-y-2">
                      {guests.map((guest) => (
                        <div
                          key={guest.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{guest.guest_name}</p>
                            {guest.guest_phone && (
                              <p className="text-sm text-muted-foreground">
                                {guest.guest_country_code} {guest.guest_phone}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteGuest(guest.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button 
                onClick={handleSaveProfile}
                disabled={saving}
                className="btn-luxury px-8"
              >
                <Save className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
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
