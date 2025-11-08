import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Users, Send, Mail, MessageSquare, Filter } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface Customer {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  total_bookings: number;
  total_spent: number;
  tier: string;
  points: number;
}

export default function LoyaltyProgram() {
  const { userRole, loading } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sendVia, setSendVia] = useState<{ email: boolean; whatsapp: boolean; sms: boolean }>({
    email: false,
    whatsapp: false,
    sms: false,
  });
  const [filterTier, setFilterTier] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("bookings");

  useEffect(() => {
    if (!loading && userRole !== 'admin') {
      navigate('/');
    } else if (!loading) {
      fetchCustomers();
    }
  }, [userRole, loading, navigate]);

  useEffect(() => {
    applyFilters();
  }, [customers, filterTier, sortBy]);

  const fetchCustomers = async () => {
    try {
      // Get all customer user IDs
      const { data: customerRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'customer');

      if (rolesError) throw rolesError;

      if (!customerRoles || customerRoles.length === 0) {
        setLoadingData(false);
        return;
      }

      const customerIds = customerRoles.map(r => r.user_id);

      // Get profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', customerIds);

      if (profilesError) throw profilesError;

      // Get loyalty points
      const { data: loyaltyData, error: loyaltyError } = await supabase
        .from('loyalty_points')
        .select('*')
        .in('user_id', customerIds);

      if (loyaltyError) throw loyaltyError;

      // Combine data
      const customersData = profiles?.map(profile => {
        const loyalty = loyaltyData?.find(l => l.user_id === profile.id);
        return {
          id: profile.id,
          full_name: profile.full_name || '',
          phone: profile.phone || '',
          email: (profile as any).email || '',
          total_bookings: loyalty?.total_bookings || 0,
          total_spent: loyalty?.total_spent || 0,
          tier: loyalty?.tier || 'bronze',
          points: loyalty?.points || 0,
        };
      }) || [];

      setCustomers(customersData);
    } catch (error: any) {
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...customers];

    // Filter by tier
    if (filterTier !== "all") {
      filtered = filtered.filter(c => c.tier === filterTier);
    }

    // Sort
    if (sortBy === "bookings") {
      filtered.sort((a, b) => b.total_bookings - a.total_bookings);
    } else if (sortBy === "spent") {
      filtered.sort((a, b) => b.total_spent - a.total_spent);
    } else if (sortBy === "points") {
      filtered.sort((a, b) => b.points - a.points);
    }

    setFilteredCustomers(filtered);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCustomers(filteredCustomers.map(c => c.id));
    } else {
      setSelectedCustomers([]);
    }
  };

  const handleSelectCustomer = (customerId: string, checked: boolean) => {
    if (checked) {
      setSelectedCustomers([...selectedCustomers, customerId]);
    } else {
      setSelectedCustomers(selectedCustomers.filter(id => id !== customerId));
    }
  };

  const handleSendMessage = async () => {
    if (selectedCustomers.length === 0) {
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: t({ ar: "يرجى تحديد عملاء", en: "Please select customers" }),
        variant: "destructive",
      });
      return;
    }

    if (!messageText.trim()) {
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: t({ ar: "يرجى إدخال الرسالة", en: "Please enter message" }),
        variant: "destructive",
      });
      return;
    }

    if (!sendVia.email && !sendVia.whatsapp && !sendVia.sms) {
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: t({ ar: "يرجى تحديد طريقة الإرسال", en: "Please select sending method" }),
        variant: "destructive",
      });
      return;
    }

    // Placeholder for future implementation
    toast({
      title: t({ ar: "قريباً", en: "Coming Soon" }),
      description: t({ ar: "ستتوفر هذه الميزة قريباً", en: "This feature will be available soon" }),
    });

    setIsMessageDialogOpen(false);
    setMessageText("");
    setSendVia({ email: false, whatsapp: false, sms: false });
  };

  if (loading || loadingData) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  }

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return 'bg-purple-500';
      case 'gold': return 'bg-yellow-500';
      case 'silver': return 'bg-gray-400';
      default: return 'bg-orange-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gradient-luxury">
                {t({ ar: "برنامج الولاء", en: "Loyalty Program" })}
              </h1>
              <p className="text-muted-foreground">
                {t({ ar: "إدارة العملاء والعروض", en: "Manage customers and offers" })}
              </p>
            </div>
          </div>
          <Button onClick={() => setIsMessageDialogOpen(true)} className="btn-luxury" disabled={selectedCustomers.length === 0}>
            <Send className="w-4 h-4 mr-2" />
            {t({ ar: `إرسال (${selectedCustomers.length})`, en: `Send (${selectedCustomers.length})` })}
          </Button>
        </div>

        {/* Filters */}
        <Card className="card-luxury mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t({ ar: "فلترة حسب الفئة", en: "Filter by Tier" })}</Label>
                <Select value={filterTier} onValueChange={setFilterTier}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t({ ar: "الكل", en: "All" })}</SelectItem>
                    <SelectItem value="bronze">{t({ ar: "برونزي", en: "Bronze" })}</SelectItem>
                    <SelectItem value="silver">{t({ ar: "فضي", en: "Silver" })}</SelectItem>
                    <SelectItem value="gold">{t({ ar: "ذهبي", en: "Gold" })}</SelectItem>
                    <SelectItem value="platinum">{t({ ar: "بلاتيني", en: "Platinum" })}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t({ ar: "ترتيب حسب", en: "Sort by" })}</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bookings">{t({ ar: "عدد الحجوزات", en: "Number of Bookings" })}</SelectItem>
                    <SelectItem value="spent">{t({ ar: "المبلغ المنفق", en: "Amount Spent" })}</SelectItem>
                    <SelectItem value="points">{t({ ar: "النقاط", en: "Points" })}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label>{t({ ar: "تحديد الكل", en: "Select All" })}</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customers List */}
        <div className="grid gap-4">
          {filteredCustomers.map((customer) => (
            <Card key={customer.id} className="card-luxury">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={selectedCustomers.includes(customer.id)}
                      onCheckedChange={(checked) => handleSelectCustomer(customer.id, checked as boolean)}
                    />
                    <div>
                      <h3 className="font-bold text-lg">{customer.full_name}</h3>
                      <p className="text-sm text-muted-foreground">{customer.phone}</p>
                      {customer.email && <p className="text-sm text-muted-foreground">{customer.email}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={getTierBadgeColor(customer.tier)}>
                      {t({ ar: customer.tier === 'bronze' ? 'برونزي' : customer.tier === 'silver' ? 'فضي' : customer.tier === 'gold' ? 'ذهبي' : 'بلاتيني', 
                           en: customer.tier.charAt(0).toUpperCase() + customer.tier.slice(1) })}
                    </Badge>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{customer.total_bookings} {t({ ar: "حجز", en: "bookings" })}</p>
                      <p className="text-sm text-muted-foreground">{customer.total_spent} {t({ ar: "ر.س", en: "SAR" })}</p>
                      <p className="text-sm text-primary">{customer.points} {t({ ar: "نقطة", en: "points" })}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredCustomers.length === 0 && (
            <Card className="card-luxury">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  {t({ ar: "لا توجد عملاء", en: "No customers found" })}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Message Dialog */}
        <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t({ ar: "إرسال رسالة", en: "Send Message" })}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>{t({ ar: "الرسالة", en: "Message" })}</Label>
                <Textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={t({ ar: "اكتب رسالتك هنا...", en: "Write your message here..." })}
                  rows={6}
                />
              </div>

              <div className="space-y-2">
                <Label>{t({ ar: "إرسال عبر", en: "Send via" })}</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={sendVia.email}
                      onCheckedChange={(checked) => setSendVia({ ...sendVia, email: checked as boolean })}
                    />
                    <Mail className="w-4 h-4" />
                    <Label>{t({ ar: "البريد الإلكتروني", en: "Email" })}</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={sendVia.whatsapp}
                      onCheckedChange={(checked) => setSendVia({ ...sendVia, whatsapp: checked as boolean })}
                    />
                    <MessageSquare className="w-4 h-4" />
                    <Label>{t({ ar: "واتساب", en: "WhatsApp" })}</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={sendVia.sms}
                      onCheckedChange={(checked) => setSendVia({ ...sendVia, sms: checked as boolean })}
                    />
                    <Send className="w-4 h-4" />
                    <Label>{t({ ar: "رسالة نصية", en: "SMS" })}</Label>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsMessageDialogOpen(false)}>
                {t({ ar: "إلغاء", en: "Cancel" })}
              </Button>
              <Button onClick={handleSendMessage} className="btn-luxury">
                {t({ ar: "إرسال", en: "Send" })}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
