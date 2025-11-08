import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

type ThemeType = 'design1' | 'design2' | 'design3';
type AdminThemeType = 'design1' | 'admin-design2';

interface ThemeContextType {
  userTheme: ThemeType;
  adminTheme: AdminThemeType;
  setUserTheme: (theme: ThemeType) => void;
  setAdminTheme: (theme: AdminThemeType) => void;
  isAdmin: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children, isAdmin = false }: { children: ReactNode; isAdmin?: boolean }) {
  const [userTheme, setUserThemeState] = useState<ThemeType>('design1');
  const [adminTheme, setAdminThemeState] = useState<AdminThemeType>('design1');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadThemes() {
      const { data } = await supabase
        .from('site_settings')
        .select('user_theme, admin_theme, created_at, updated_at')
        .order('created_at', { ascending: false })
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setUserThemeState((data.user_theme as ThemeType) || 'design1');
        setAdminThemeState((data.admin_theme as AdminThemeType) || 'design1');
      }
      setLoading(false);
    }

    loadThemes();
  }, []);

  useEffect(() => {
    if (loading) return;

    const currentTheme = isAdmin ? adminTheme : userTheme;
    
    // Remove all theme classes
    document.documentElement.classList.remove('theme-design1', 'theme-design2', 'theme-design3', 'admin-design2');
    document.body.classList.remove('theme-design1', 'theme-design2', 'theme-design3', 'admin-design2');
    
    // Add current theme class to html and body for full cascade
    const themeClass = currentTheme.startsWith('admin-') ? currentTheme : `theme-${currentTheme}`;
    document.documentElement.classList.add(themeClass);
    document.body.classList.add(themeClass);
  }, [userTheme, adminTheme, isAdmin, loading]);

  const setUserTheme = (theme: ThemeType) => {
    setUserThemeState(theme);
  };

  const setAdminTheme = (theme: AdminThemeType) => {
    setAdminThemeState(theme);
  };

  if (loading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ userTheme, adminTheme, setUserTheme, setAdminTheme, isAdmin }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
