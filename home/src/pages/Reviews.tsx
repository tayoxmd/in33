import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Star, Trash2, Reply, ArrowLeft } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface Review {
  id: string;
  rating: number;
  comment: string;
  admin_response: string | null;
  status: string;
  created_at: string;
  guest_name: string | null;
  guest_phone: string | null;
  user_id: string | null;
  hotel_id: string;
  hotels: {
    name_ar: string;
    name_en: string;
  };
  profiles: {
    full_name: string;
  } | null;
}

export default function Reviews() {
  const { userRole, loading } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    if (!loading && userRole !== 'admin') {
      navigate('/');
    } else if (!loading) {
      fetchReviews();
    }
  }, [userRole, loading, navigate]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          hotels (name_ar, name_en)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch user profiles separately
      const reviewsWithProfiles = await Promise.all(
        (data || []).map(async (review: any) => {
          if (review.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', review.user_id)
              .single();
            return { ...review, profiles: profile };
          }
          return { ...review, profiles: null };
        })
      );
      
      setReviews(reviewsWithProfiles as any);
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

  const handleDelete = async (id: string) => {
    if (!confirm(t({ ar: "هل أنت متأكد من حذف هذه المراجعة؟", en: "Are you sure you want to delete this review?" }))) {
      return;
    }

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: t({ ar: "تم الحذف", en: "Deleted" }),
        description: t({ ar: "تم حذف المراجعة بنجاح", en: "Review deleted successfully" }),
      });

      fetchReviews();
    } catch (error: any) {
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) {
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: t({ ar: "يرجى إدخال الرد", en: "Please enter a reply" }),
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('reviews')
        .update({ 
          admin_response: replyText,
          status: 'approved'
        })
        .eq('id', reviewId);

      if (error) throw error;

      toast({
        title: t({ ar: "تم الإضافة", en: "Added" }),
        description: t({ ar: "تم إضافة الرد بنجاح", en: "Reply added successfully" }),
      });

      setReplyingTo(null);
      setReplyText("");
      fetchReviews();
    } catch (error: any) {
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (reviewId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ status: newStatus })
        .eq('id', reviewId);

      if (error) throw error;

      toast({
        title: t({ ar: "تم التحديث", en: "Updated" }),
        description: t({ ar: "تم تحديث حالة المراجعة", en: "Review status updated" }),
      });

      fetchReviews();
    } catch (error: any) {
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading || loadingData) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  }

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gradient-luxury">
              {t({ ar: "التقييمات والمراجعات", en: "Reviews & Ratings" })}
            </h1>
            <p className="text-muted-foreground">
              {t({ ar: "إدارة تقييمات العملاء", en: "Manage customer reviews" })}
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          {reviews.map((review) => (
            <Card key={review.id} className="card-luxury">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-lg">
                        {review.profiles?.full_name || review.guest_name || t({ ar: "ضيف", en: "Guest" })}
                      </CardTitle>
                      <Badge variant={
                        review.status === 'approved' ? 'default' : 
                        review.status === 'rejected' ? 'destructive' : 
                        'secondary'
                      }>
                        {review.status === 'approved' ? t({ ar: "معتمد", en: "Approved" }) :
                         review.status === 'rejected' ? t({ ar: "مرفوض", en: "Rejected" }) :
                         t({ ar: "قيد الانتظار", en: "Pending" })}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      {renderStars(review.rating)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {language === 'ar' ? review.hotels.name_ar : review.hotels.name_en} • {new Date(review.created_at).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {review.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(review.id, 'approved')}
                        >
                          {t({ ar: "اعتماد", en: "Approve" })}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(review.id, 'rejected')}
                        >
                          {t({ ar: "رفض", en: "Reject" })}
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(review.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-foreground">{review.comment}</p>
                
                {review.admin_response ? (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Reply className="w-4 h-4" />
                      {t({ ar: "رد الإدارة:", en: "Admin Reply:" })}
                    </p>
                    <p className="text-sm">{review.admin_response}</p>
                  </div>
                ) : replyingTo === review.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={t({ ar: "اكتب ردك هنا...", en: "Write your reply here..." })}
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleReply(review.id)}>
                        {t({ ar: "إرسال", en: "Send" })}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setReplyingTo(null)}>
                        {t({ ar: "إلغاء", en: "Cancel" })}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setReplyingTo(review.id)}
                  >
                    <Reply className="w-4 h-4 mr-2" />
                    {t({ ar: "إضافة رد", en: "Add Reply" })}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}

          {reviews.length === 0 && (
            <Card className="card-luxury">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  {t({ ar: "لا توجد مراجعات حتى الآن", en: "No reviews yet" })}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
