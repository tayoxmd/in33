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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, ArrowLeft, Percent, DollarSign } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  valid_from: string;
  valid_to: string;
  max_uses: number | null;
  current_uses: number;
  min_booking_amount: number;
  applicable_to: 'all' | 'specific_hotels' | 'specific_users';
  active: boolean;
  created_at: string;
}

export default function Coupons() {
  const { userRole, loading } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    discount_type: "percentage" as 'percentage' | 'fixed',
    discount_value: "",
    valid_from: "",
    valid_to: "",
    max_uses: "",
    min_booking_amount: "0",
    applicable_to: "all" as 'all' | 'specific_hotels' | 'specific_users',
    active: true,
  });

  useEffect(() => {
    if (!loading && userRole !== 'admin') {
      navigate('/');
    } else if (!loading) {
      fetchCoupons();
    }
  }, [userRole, loading, navigate]);

  const fetchCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons((data as any) || []);
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

  const handleSubmit = async () => {
    if (!formData.code || !formData.discount_value || !formData.valid_from || !formData.valid_to) {
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: t({ ar: "يرجى ملء جميع الحقول المطلوبة", en: "Please fill all required fields" }),
        variant: "destructive",
      });
      return;
    }

    try {
      const couponData = {
        code: formData.code.toUpperCase(),
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        valid_from: formData.valid_from,
        valid_to: formData.valid_to,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        min_booking_amount: parseFloat(formData.min_booking_amount),
        applicable_to: formData.applicable_to,
        active: formData.active,
      };

      if (editingCoupon) {
        const { error } = await supabase
          .from('coupons')
          .update(couponData)
          .eq('id', editingCoupon.id);

        if (error) throw error;

        toast({
          title: t({ ar: "تم التحديث", en: "Updated" }),
          description: t({ ar: "تم تحديث الكوبون بنجاح", en: "Coupon updated successfully" }),
        });
      } else {
        const { error } = await supabase
          .from('coupons')
          .insert([couponData]);

        if (error) throw error;

        toast({
          title: t({ ar: "تم الإضافة", en: "Added" }),
          description: t({ ar: "تم إضافة الكوبون بنجاح", en: "Coupon added successfully" }),
        });
      }

      setIsDialogOpen(false);
      setEditingCoupon(null);
      resetForm();
      fetchCoupons();
    } catch (error: any) {
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t({ ar: "هل أنت متأكد من حذف هذا الكوبون؟", en: "Are you sure you want to delete this coupon?" }))) {
      return;
    }

    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: t({ ar: "تم الحذف", en: "Deleted" }),
        description: t({ ar: "تم حذف الكوبون بنجاح", en: "Coupon deleted successfully" }),
      });

      fetchCoupons();
    } catch (error: any) {
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value.toString(),
      valid_from: coupon.valid_from,
      valid_to: coupon.valid_to,
      max_uses: coupon.max_uses?.toString() || "",
      min_booking_amount: coupon.min_booking_amount.toString(),
      applicable_to: coupon.applicable_to,
      active: coupon.active,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      code: "",
      discount_type: "percentage",
      discount_value: "",
      valid_from: "",
      valid_to: "",
      max_uses: "",
      min_booking_amount: "0",
      applicable_to: "all",
      active: true,
    });
  };

  if (loading || loadingData) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  }

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
                {t({ ar: "كوبونات الخصم", en: "Discount Coupons" })}
              </h1>
              <p className="text-muted-foreground">
                {t({ ar: "إدارة كوبونات الخصم", en: "Manage discount coupons" })}
              </p>
            </div>
          </div>
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="btn-luxury">
            <Plus className="w-4 h-4 mr-2" />
            {t({ ar: "إضافة كوبون", en: "Add Coupon" })}
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {coupons.map((coupon) => (
            <Card key={coupon.id} className="card-luxury">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold">{coupon.code}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={coupon.active ? "default" : "secondary"}>
                        {coupon.active ? t({ ar: "نشط", en: "Active" }) : t({ ar: "غير نشط", en: "Inactive" })}
                      </Badge>
                      {coupon.discount_type === 'percentage' ? (
                        <Badge variant="outline" className="gap-1">
                          <Percent className="w-3 h-3" />
                          {coupon.discount_value}%
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <DollarSign className="w-3 h-3" />
                          {coupon.discount_value} {t({ ar: "ر.س", en: "SAR" })}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => openEditDialog(coupon)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(coupon.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><span className="font-semibold">{t({ ar: "من:", en: "From:" })}</span> {new Date(coupon.valid_from).toLocaleDateString('ar-SA')}</p>
                  <p><span className="font-semibold">{t({ ar: "إلى:", en: "To:" })}</span> {new Date(coupon.valid_to).toLocaleDateString('ar-SA')}</p>
                  {coupon.max_uses && (
                    <p><span className="font-semibold">{t({ ar: "الاستخدامات:", en: "Uses:" })}</span> {coupon.current_uses} / {coupon.max_uses}</p>
                  )}
                  {coupon.min_booking_amount > 0 && (
                    <p><span className="font-semibold">{t({ ar: "الحد الأدنى:", en: "Min Amount:" })}</span> {coupon.min_booking_amount} {t({ ar: "ر.س", en: "SAR" })}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {coupons.length === 0 && (
          <Card className="card-luxury">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                {t({ ar: "لا توجد كوبونات حتى الآن", en: "No coupons yet" })}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCoupon ? t({ ar: "تعديل الكوبون", en: "Edit Coupon" }) : t({ ar: "إضافة كوبون", en: "Add Coupon" })}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>{t({ ar: "كود الكوبون", en: "Coupon Code" })}</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder={t({ ar: "مثال: SUMMER2025", en: "Example: SUMMER2025" })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>{t({ ar: "نوع الخصم", en: "Discount Type" })}</Label>
                  <Select value={formData.discount_type} onValueChange={(value: any) => setFormData({ ...formData, discount_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">{t({ ar: "نسبة مئوية", en: "Percentage" })}</SelectItem>
                      <SelectItem value="fixed">{t({ ar: "مبلغ ثابت", en: "Fixed Amount" })}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>{t({ ar: "قيمة الخصم", en: "Discount Value" })}</Label>
                  <Input
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                    placeholder={formData.discount_type === 'percentage' ? '10' : '50'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>{t({ ar: "صالح من", en: "Valid From" })}</Label>
                  <Input
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>{t({ ar: "صالح حتى", en: "Valid Until" })}</Label>
                  <Input
                    type="date"
                    value={formData.valid_to}
                    onChange={(e) => setFormData({ ...formData, valid_to: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>{t({ ar: "الحد الأقصى للاستخدام (اختياري)", en: "Max Uses (Optional)" })}</Label>
                  <Input
                    type="number"
                    value={formData.max_uses}
                    onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                    placeholder="100"
                  />
                </div>

                <div className="grid gap-2">
                  <Label>{t({ ar: "الحد الأدنى للحجز", en: "Min Booking Amount" })}</Label>
                  <Input
                    type="number"
                    value={formData.min_booking_amount}
                    onChange={(e) => setFormData({ ...formData, min_booking_amount: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>{t({ ar: "قابل للتطبيق على", en: "Applicable To" })}</Label>
                <Select value={formData.applicable_to} onValueChange={(value: any) => setFormData({ ...formData, applicable_to: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t({ ar: "الكل", en: "All" })}</SelectItem>
                    <SelectItem value="specific_hotels">{t({ ar: "فنادق محددة", en: "Specific Hotels" })}</SelectItem>
                    <SelectItem value="specific_users">{t({ ar: "مستخدمين محددين", en: "Specific Users" })}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                {t({ ar: "إلغاء", en: "Cancel" })}
              </Button>
              <Button onClick={handleSubmit} className="btn-luxury">
                {editingCoupon ? t({ ar: "تحديث", en: "Update" }) : t({ ar: "إضافة", en: "Add" })}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
