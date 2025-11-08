import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { countries } from "@/data/countries";

interface GuestOTPVerificationProps {
  onVerified: (phone: string) => void;
}

export function GuestOTPVerification({ onVerified }: GuestOTPVerificationProps) {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [countryCode, setCountryCode] = useState("+966");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSendOTP = async () => {
    if (!phoneNumber) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رقم الهاتف",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Call edge function to send OTP via WhatsApp
      const { data, error } = await supabase.functions.invoke('send-whatsapp-otp', {
        body: { 
          phone: phoneNumber, 
          countryCode: countryCode 
        }
      });

      if (error) throw error;

      // Create hash of phone number for verification
      const fullPhone = `${countryCode}${phoneNumber}`;
      const encoder = new TextEncoder();
      const phoneData = encoder.encode(fullPhone);
      const hashBuffer = await crypto.subtle.digest('SHA-256', phoneData);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const phoneHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      setVerificationId(phoneHash);
      setStep("otp");
      
      toast({
        title: "تم إرسال رمز التحقق",
        description: "تم إرسال رمز التحقق عبر WhatsApp",
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل إرسال رمز التحقق",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode || !verificationId) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رمز التحقق",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const fullPhone = `${countryCode}${phoneNumber}`;
      
      // Hash the phone number
      const encoder = new TextEncoder();
      const data = encoder.encode(fullPhone);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const phoneHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      // Verify OTP
      const { data: verification, error } = await supabase
        .from('guest_verifications')
        .select()
        .eq('phone_hash', phoneHash)
        .eq('otp_code', otpCode)
        .eq('verified', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !verification) {
        throw new Error("رمز التحقق غير صحيح أو منتهي الصلاحية");
      }

      // Mark as verified
      await supabase
        .from('guest_verifications')
        .update({ verified: true, verified_at: new Date().toISOString() })
        .eq('phone_hash', phoneHash)
        .eq('otp_code', otpCode);

      toast({
        title: "تم التحقق بنجاح",
        description: "يمكنك الآن عرض حجوزاتك",
      });

      // Pass verified phone to parent
      onVerified(fullPhone);
    } catch (error: any) {
      toast({
        title: "خطأ في التحقق",
        description: error.message || "فشل التحقق من الرمز",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>التحقق من رقم الهاتف</CardTitle>
        <CardDescription>
          {step === "phone" 
            ? "أدخل رقم هاتفك لعرض حجوزاتك"
            : "أدخل رمز التحقق المرسل إلى هاتفك"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === "phone" ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف</Label>
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
                  placeholder="5xxxxxxxx"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
            </div>

            <Button 
              onClick={handleSendOTP} 
              disabled={loading}
              className="w-full"
            >
              {loading ? "جاري الإرسال..." : "إرسال رمز التحقق"}
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="otp">رمز التحقق</Label>
              <Input
                id="otp"
                type="text"
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                maxLength={6}
                dir="ltr"
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleVerifyOTP} 
                disabled={loading}
                className="flex-1"
              >
                {loading ? "جاري التحقق..." : "تحقق"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setStep("phone")}
                disabled={loading}
              >
                رجوع
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
