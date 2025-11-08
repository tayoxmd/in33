import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { NotificationBell } from "./NotificationBell";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ThemeSelector } from "@/components/ThemeSelector";
import { useIsMobile } from "@/hooks/use-mobile";
import logo from "@/assets/logo.png";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, signOut, userRole } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobileOrTablet = useIsMobile() || (typeof window !== 'undefined' && window.innerWidth <= 1024);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getDashboardPath = () => {
    if (userRole === 'admin') return '/admin';
    if (userRole === 'manager') return '/admin';
    if (userRole === 'employee') return '/employee';
    if (userRole === 'company') return '/employee';
    return '/dashboard';
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-card/40 backdrop-blur-lg border-b border-border/30 shadow-elegant">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 sm:gap-3">
              <img 
                src={logo} 
                alt="IN33 Logo" 
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain logo-3d-rotate"
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-foreground hover:text-primary transition-colors font-medium">
                {t('الرئيسية', 'Home')}
              </Link>
              <a href="/#hotels" className="text-foreground hover:text-primary transition-colors font-medium">
                {t('الفنادق', 'Hotels')}
              </a>
              <a href="/#offers" className="text-foreground hover:text-primary transition-colors font-medium">
                {t('العروض', 'Offers')}
              </a>
              <a href="/#about" className="text-foreground hover:text-primary transition-colors font-medium">
                {t('من نحن', 'About')}
              </a>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Theme Selector - Always visible, scaled down on mobile */}
              <div className="scale-75 sm:scale-90 md:scale-100">
                <ThemeSelector />
              </div>
              
              {/* Language Selector - Always visible, scaled down on mobile */}
              <div className="scale-75 sm:scale-90 md:scale-100">
                <LanguageSelector />
              </div>
              
              {/* Notification Bell */}
              <NotificationBell />

                {user ? (
                <>
                  <div className="hidden lg:flex items-center gap-2">
              {(userRole === 'admin' || userRole === 'manager' || userRole === 'employee' || userRole === 'company') && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-green-500 hover:bg-green-600 text-white border-green-500 relative"
                  onClick={() => navigate('/my-tasks')}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  {t({ ar: 'المهام', en: 'Tasks' })}
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                </Button>
              )}

                    {(userRole === 'admin' || userRole === 'employee') && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          style={{ backgroundColor: '#237bff', color: 'white', borderColor: '#237bff' }}
                          onClick={() => navigate(getDashboardPath())}
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          {t('الإدارة', 'Management')}
                        </Button>
                      </>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => navigate('/customer-dashboard')}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      {t({ ar: "الحجوزات", en: "Bookings" })}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => signOut()}
                    >
                      <LogOut className="w-4 h-4" />
                      {t('تسجيل الخروج', 'Sign Out')}
                    </Button>
                  </div>
                  
                  {/* Mobile/Tablet Quick Actions - Outside Menu */}
                  <div className="lg:hidden flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => navigate('/customer-dashboard')}
                    >
                      {t({ ar: "الحجوزات", en: "Bookings" })}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="hidden sm:inline-flex"
                    onClick={() => navigate('/auth?mode=login')}
                  >
                    {t('تسجيل الدخول', 'Sign In')}
                  </Button>

                  <Button
                    size="sm"
                    className="btn-luxury hidden sm:inline-flex"
                    onClick={() => navigate('/auth?mode=signup')}
                  >
                    {t('سجل الآن', 'Sign Up')}
                  </Button>
                </>
              )}

              {/* Mobile Menu Button */}
              <Button
                variant="outline"
                size="sm"
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden py-4 animate-fade-in">
              <nav className="flex flex-col gap-4">
                <Link to="/" className="text-foreground hover:text-primary transition-colors font-medium py-2">
                  {t('الرئيسية', 'Home')}
                </Link>
                <a href="/#hotels" className="text-foreground hover:text-primary transition-colors font-medium py-2">
                  {t('الفنادق', 'Hotels')}
                </a>
                <a href="/#offers" className="text-foreground hover:text-primary transition-colors font-medium py-2">
                  {t('العروض', 'Offers')}
                </a>
                <a href="/#about" className="text-foreground hover:text-primary transition-colors font-medium py-2">
                  {t('من نحن', 'About')}
                </a>
                {user ? (
                  <>
                    {/* Mobile: Tasks and Management in one row */}
                    <div className="md:hidden grid grid-cols-2 gap-2">
                      {(userRole === 'admin' || userRole === 'manager' || userRole === 'employee' || userRole === 'company') && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="justify-start gap-2 bg-green-500 hover:bg-green-600 text-white border-green-500 relative"
                          onClick={() => navigate('/my-tasks')}
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          {t({ ar: 'المهام', en: 'Tasks' })}
                          <span className="absolute top-1 right-1 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                          </span>
                        </Button>
                      )}
                      
                      {(userRole === 'admin' || userRole === 'employee') && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="justify-start gap-2"
                          style={{ backgroundColor: '#237bff', color: 'white', borderColor: '#237bff' }}
                          onClick={() => navigate(getDashboardPath())}
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          {t('الإدارة', 'Management')}
                        </Button>
                      )}
                    </div>

                    {/* Desktop/Tablet: Original layout */}
                    <div className="hidden md:block space-y-2">
                      {(userRole === 'admin' || userRole === 'manager' || userRole === 'employee' || userRole === 'company') && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="justify-start gap-2 bg-green-500 hover:bg-green-600 text-white border-green-500 relative w-full"
                          onClick={() => navigate('/my-tasks')}
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          {t({ ar: 'المهام', en: 'Tasks' })}
                          <span className="absolute top-1 right-1 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                          </span>
                        </Button>
                      )}
                      
                      {(userRole === 'admin' || userRole === 'employee') && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="justify-start gap-2 w-full"
                          style={{ backgroundColor: '#237bff', color: 'white', borderColor: '#237bff' }}
                          onClick={() => navigate(getDashboardPath())}
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          {t('الإدارة', 'Management')}
                        </Button>
                      )}
                    </div>

                    {/* Mobile: Dashboard and Logout in one row */}
                    <div className="md:hidden grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="justify-start gap-2"
                        onClick={() => navigate('/dashboard')}
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        {t({ ar: "لوحة التحكم", en: "Dashboard" })}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="justify-start gap-2"
                        onClick={() => signOut()}
                      >
                        <LogOut className="w-4 h-4" />
                        {t('تسجيل الخروج', 'Sign Out')}
                      </Button>
                    </div>

                    {/* Desktop/Tablet: Original layout */}
                    <div className="hidden md:block space-y-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="justify-start gap-2 w-full"
                        onClick={() => navigate('/dashboard')}
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        {t({ ar: "لوحة التحكم", en: "Dashboard" })}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="justify-start gap-2 w-full"
                        onClick={() => signOut()}
                      >
                        <LogOut className="w-4 h-4" />
                        {t('تسجيل الخروج', 'Sign Out')}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex gap-2 pt-2 border-t border-border">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => navigate('/auth?mode=login')}
                    >
                      {t('تسجيل الدخول', 'Sign In')}
                    </Button>
                    <Button 
                      size="sm" 
                      className="btn-luxury flex-1"
                      onClick={() => navigate('/auth?mode=signup')}
                    >
                      {t('سجل الآن', 'Sign Up')}
                    </Button>
                  </div>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

    </>
  );
}
