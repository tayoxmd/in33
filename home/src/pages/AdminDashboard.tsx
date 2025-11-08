import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingManagement } from "@/components/BookingManagement";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, 
  FileText, 
  Clock, 
  Users, 
  UserCog, 
  Hotel,
  TrendingDown,
  TrendingUp,
  Settings,
  User,
  Home,
  LayoutDashboard,
  CheckCircle,
  Briefcase,
  Tag,
  Gift,
  Calendar,
  MessageSquare,
  Clapperboard,
  Mail
} from "lucide-react";
import { playNotificationSound } from "@/utils/notificationSound";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

export default function AdminDashboard() {
  const { userRole, loading, user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [stats, setStats] = useState({
    totalBookings: 0,
    pending: 0,
    confirmed: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    profits: 0,
    losses: 0,
    totalBookingsValue: 0,
    pendingPayments: 0,
  });

  const adminMenuItems = [
    { icon: Home, label: t({ ar: 'الصفحة الرئيسية', en: 'Home' }), path: '/' },
    { icon: LayoutDashboard, label: t({ ar: 'إدارة المهام', en: 'Task Manager' }), path: '/task-manager' },
    { icon: DollarSign, label: t({ ar: 'الحسابات الخاصة', en: 'Private Accounting' }), path: '/private-accounting' },
    { icon: Hotel, label: t({ ar: 'إدارة الفنادق', en: 'Manage Hotels' }), path: '/manage-hotels' },
    { icon: Users, label: t({ ar: 'إدارة المستخدمين', en: 'Manage Users' }), path: '/manage-employees' },
    { icon: Mail, label: t({ ar: 'البريد', en: 'Email' }), path: '/email' },
    { icon: Briefcase, label: t({ ar: 'شؤون الموظفين', en: 'Employee Management' }), path: '/employee-management' },
    { icon: FileText, label: t({ ar: 'التقييمات والمراجعات', en: 'Reviews & Ratings' }), path: '/reviews' },
    { icon: MessageSquare, label: t({ ar: 'الدردشة المباشرة', en: 'Live Chat' }), path: '/live-chat' },
    { icon: Tag, label: t({ ar: 'الكوبونات', en: 'Coupons' }), path: '/coupons' },
    { icon: Gift, label: t({ ar: 'العروض الخاصة', en: 'Special Offers' }), path: '/special-offers' },
    { icon: Calendar, label: t({ ar: 'الأسعار الموسمية', en: 'Seasonal Pricing' }), path: '/seasonal-pricing' },
    { icon: Briefcase, label: t({ ar: 'برنامج الولاء', en: 'Loyalty Program' }), path: '/loyalty-program' },
    { icon: Clapperboard, label: t({ ar: 'الاستديو', en: 'Studio' }), path: '/studio' },
    { icon: Settings, label: t({ ar: 'إعدادات الموقع', en: 'Site Settings' }), path: '/site-settings' },
    { icon: DollarSign, label: t({ ar: 'إعدادات API', en: 'API Settings' }), path: '/api-settings' },
    { icon: FileText, label: t({ ar: 'إعدادات PDF', en: 'PDF Settings' }), path: '/pdf-settings' },
    { icon: FileText, label: t({ ar: 'سجل التدقيق', en: 'Audit Logs' }), path: '/audit-logs' },
    { icon: User, label: t({ ar: 'الملف الشخصي', en: 'Profile' }), path: '/profile' },
  ];

  useEffect(() => {
    if (!loading) {
      if (userRole !== 'admin') {
        navigate('/');
      } else {
        fetchBookings();
        fetchStats();
        
        const channel = supabase
          .channel('admin-bookings')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'bookings'
            },
            (payload) => {
              console.log('New booking received:', payload);
              playNotificationSound();
              fetchBookings();
              fetchStats();
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      }
    }
  }, [userRole, loading, navigate]);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          profiles:user_id (full_name, phone),
          hotels:hotel_id (name_ar, name_en, location, location_url, price_per_night, max_guests_per_room, extra_guest_price, tax_percentage, room_type)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoadingBookings(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Total bookings count
      const { count: totalCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true });

      // Pending bookings count (new + pending)
      const { count: newCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'new');

      const { count: pendingCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Confirmed bookings count
      const { count: confirmedCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'confirmed');

      // Total customers
      const { data: customerRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'customer');

      // Financial stats
      const { data: allBookings } = await supabase
        .from('bookings')
        .select('total_amount, amount_paid, payment_status, status');

      let totalRevenue = 0;
      let totalBookingsValue = 0;
      let losses = 0;
      let pendingPayments = 0;

      if (allBookings) {
        allBookings.forEach(booking => {
          totalBookingsValue += booking.total_amount || 0;
          
          if (booking.payment_status === 'paid') {
            totalRevenue += booking.amount_paid || 0;
          } else if (booking.payment_status === 'partially_paid') {
            totalRevenue += booking.amount_paid || 0;
            // Calculate pending payment (remaining amount)
            pendingPayments += (booking.total_amount - (booking.amount_paid || 0));
          } else if (booking.payment_status === 'unpaid') {
            pendingPayments += booking.total_amount || 0;
          }
          
          if (booking.status === 'cancelled' || booking.status === 'rejected') {
            losses += (booking.total_amount - (booking.amount_paid || 0));
          }
        });
      }

      const profits = totalRevenue - losses;

      setStats({
        totalBookings: totalCount || 0,
        pending: (newCount || 0) + (pendingCount || 0),
        confirmed: confirmedCount || 0,
        totalCustomers: customerRoles?.length || 0,
        totalRevenue: Math.round(totalRevenue),
        profits: Math.round(profits),
        losses: Math.round(losses),
        totalBookingsValue: Math.round(totalBookingsValue),
        pendingPayments: Math.round(pendingPayments),
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  }

  // BigStatCard Component for main financial stats
  const BigStatCard = ({ title, value, icon: Icon, colorClass }: any) => (
    <Card className="card-luxury hover-lift transition-all">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-3xl font-bold">{value}</h3>
          </div>
          <div className={`p-4 rounded-lg ${colorClass}`}>
            <Icon className="w-8 h-8 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const StatCard = ({ title, value, icon: Icon, colorClass }: any) => (
    <Card className="card-luxury hover-lift transition-all rounded-md">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl lg:text-3xl font-bold">{value}</h3>
            </div>
          </div>
          <div className={`p-3 rounded-md ${colorClass}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Admin Sidebar Component (Desktop only)
  const sidebarSide = language === "ar" ? "right" : "left";
  const borderClass = language === "ar" ? "border-l" : "border-r";
  
  const AdminSidebar = () => (
    <Sidebar side={sidebarSide} className={`${borderClass} z-50`}>
      <SidebarContent>
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-primary-glow flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg">{t({ ar: "IN33", en: "IN33" })}</h2>
              <p className="text-xs text-muted-foreground">{t({ ar: "لوحة التحكم", en: "Dashboard" })}</p>
            </div>
          </div>
        </div>
        
        <SidebarGroup>
          <SidebarGroupLabel>{t({ ar: 'إدارة الموقع', en: 'Site Management' })}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminMenuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton onClick={() => navigate(item.path)}>
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      {isMobile ? (
        // Mobile: Sheet Menu
        <div className="flex h-screen">
          <main className="flex-1 overflow-y-auto">
            <div className="p-4 pt-24">
              {/* Header with Site Management Button */}
              <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2 text-gradient-luxury">
                    {t({ ar: "مرحباً بك في لوحة التحكم", en: "Welcome to Dashboard" })}
                  </h1>
                  <p className="text-muted-foreground">
                    {t({ ar: "نظرة عامة على أداء نظامك", en: "Overview of your system performance" })}
                  </p>
                </div>
                
                <Sheet open={adminMenuOpen} onOpenChange={setAdminMenuOpen}>
                  <SheetTrigger asChild>
                    <div className="flex gap-2">
                      <Button
                        className="gap-2 shadow-lg"
                        style={{ backgroundColor: '#237bff', color: 'white', borderColor: '#237bff' }}
                      >
                        <Settings className="w-4 h-4" />
                        {t({ ar: "إدارة الموقع", en: "Site Management" })}
                      </Button>
                      <Button variant="outline" className="gap-2" onClick={() => navigate('/')}> 
                        <Home className="w-4 h-4" />
                        {t({ ar: "الرئيسية", en: "Home" })}
                      </Button>
                    </div>
                  </SheetTrigger>
                  <SheetContent side={language === 'ar' ? 'right' : 'left'} className="w-[280px] sm:w-[350px] overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>{t({ ar: 'إدارة الموقع', en: 'Site Management' })}</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6 space-y-2 pb-6">
                      {adminMenuItems.map((item) => (
                        <Button
                          key={item.path}
                          variant="ghost"
                          className="w-full justify-start gap-3 h-12"
                          onClick={() => {
                            navigate(item.path);
                            setAdminMenuOpen(false);
                          }}
                        >
                          <item.icon className="w-5 h-5" />
                          <span className="text-base">{item.label}</span>
                        </Button>
                      ))}
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Financial Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <BigStatCard
                title={t({ ar: "الأرباح", en: "Profits" })}
                value={`${stats.profits || 0} ${t({ ar: "ر.س", en: "SAR" })}`}
                icon={TrendingUp}
                colorClass="bg-gradient-to-br from-emerald-500 to-emerald-600"
              />
              <BigStatCard
                title={t({ ar: "في انتظار الدفع", en: "Pending Payment" })}
                value={`${stats.pendingPayments || 0} ${t({ ar: "ر.س", en: "SAR" })}`}
                icon={Clock}
                colorClass="bg-gradient-to-br from-amber-500 to-amber-600"
              />
              <BigStatCard
                title={t({ ar: "إجمالي قيمة الطلبات", en: "Total Bookings Value" })}
                value={`${stats.totalBookingsValue || 0} ${t({ ar: "ر.س", en: "SAR" })}`}
                icon={FileText}
                colorClass="bg-gradient-to-br from-sky-500 to-sky-600"
              />
              <BigStatCard
                title={t({ ar: "الخسائر", en: "Losses" })}
                value={`${stats.losses || 0} ${t({ ar: "ر.س", en: "SAR" })}`}
                icon={TrendingDown}
                colorClass="bg-gradient-to-br from-rose-500 to-rose-600"
              />
            </div>

            {/* Stats Grid - Detailed */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
              <StatCard
                title={t({ ar: "إجمالي الحجوزات", en: "Total Bookings" })}
                value={stats.totalBookings}
                icon={Briefcase}
                colorClass="bg-gradient-to-br from-purple-500 to-purple-600"
              />
              <StatCard
                title={t({ ar: "قيد الانتظار", en: "Pending" })}
                value={stats.pending}
                icon={Clock}
                colorClass="bg-gradient-to-br from-orange-500 to-orange-600"
              />
              <StatCard
                title={t({ ar: "مؤكد", en: "Confirmed" })}
                value={stats.confirmed}
                icon={CheckCircle}
                colorClass="bg-gradient-to-br from-green-500 to-green-600"
              />
              <StatCard
                title={t({ ar: "عدد العملاء", en: "Customers" })}
                value={stats.totalCustomers}
                icon={Users}
                colorClass="bg-gradient-to-br from-blue-500 to-blue-600"
              />
            </div>

              {/* Recent Bookings */}
              <Card className="card-luxury">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    {t({ ar: "أحدث الحجوزات", en: "Recent Bookings" })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingBookings ? (
                    <div className="flex justify-center py-8"><LoadingSpinner size="md" /></div>
                  ) : (
                    <BookingManagement bookings={bookings} onUpdate={fetchBookings} />
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      ) : (
        // Desktop: Persistent Sidebar on Right
        <SidebarProvider defaultOpen={true}>
          <div className="flex min-h-screen w-full">
            <AdminSidebar />
            <main className="flex-1 overflow-y-auto w-full">
              <div className="p-8 w-full">

                {/* Header */}
                <div className="mb-8">
                  <h1 className="text-3xl font-bold mb-2 text-gradient-luxury">
                    {t({ ar: "مرحباً بك في لوحة التحكم", en: "Welcome to Dashboard" })}
                  </h1>
                  <p className="text-muted-foreground">
                    {t({ ar: "نظرة عامة على أداء نظامك", en: "Overview of your system performance" })}
                  </p>
                </div>

                {/* Financial Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <BigStatCard
                    title={t({ ar: "الأرباح", en: "Profits" })}
                    value={`${stats.profits || 0} ${t({ ar: "ر.س", en: "SAR" })}`}
                    icon={TrendingUp}
                    colorClass="bg-gradient-to-br from-emerald-500 to-emerald-600"
                  />
                  <BigStatCard
                    title={t({ ar: "في انتظار الدفع", en: "Pending Payment" })}
                    value={`${stats.pendingPayments || 0} ${t({ ar: "ر.س", en: "SAR" })}`}
                    icon={Clock}
                    colorClass="bg-gradient-to-br from-amber-500 to-amber-600"
                  />
                  <BigStatCard
                    title={t({ ar: "إجمالي قيمة الطلبات", en: "Total Bookings Value" })}
                    value={`${stats.totalBookingsValue || 0} ${t({ ar: "ر.س", en: "SAR" })}`}
                    icon={FileText}
                    colorClass="bg-gradient-to-br from-sky-500 to-sky-600"
                  />
                  <BigStatCard
                    title={t({ ar: "الخسائر", en: "Losses" })}
                    value={`${stats.losses || 0} ${t({ ar: "ر.س", en: "SAR" })}`}
                    icon={TrendingDown}
                    colorClass="bg-gradient-to-br from-rose-500 to-rose-600"
                  />
                </div>

                {/* Stats Grid - Detailed */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <StatCard
                    title={t({ ar: "إجمالي الحجوزات", en: "Total Bookings" })}
                    value={stats.totalBookings}
                    icon={Briefcase}
                    colorClass="bg-gradient-to-br from-purple-500 to-purple-600"
                  />
                  <StatCard
                    title={t({ ar: "قيد الانتظار", en: "Pending" })}
                    value={stats.pending}
                    icon={Clock}
                    colorClass="bg-gradient-to-br from-orange-500 to-orange-600"
                  />
                  <StatCard
                    title={t({ ar: "مؤكد", en: "Confirmed" })}
                    value={stats.confirmed}
                    icon={CheckCircle}
                    colorClass="bg-gradient-to-br from-green-500 to-green-600"
                  />
                  <StatCard
                    title={t({ ar: "عدد العملاء", en: "Customers" })}
                    value={stats.totalCustomers}
                    icon={Users}
                    colorClass="bg-gradient-to-br from-blue-500 to-blue-600"
                  />
                </div>

                {/* Recent Bookings */}
                <Card className="card-luxury">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      {t({ ar: "أحدث الحجوزات", en: "Recent Bookings" })}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingBookings ? (
                      <div className="flex justify-center py-8"><LoadingSpinner size="md" /></div>
                    ) : (
                      <BookingManagement bookings={bookings} onUpdate={fetchBookings} />
                    )}
                  </CardContent>
                </Card>
              </div>
            </main>
          </div>
        </SidebarProvider>
      )}
    </div>
  );
}
