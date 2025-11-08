import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Palette, Moon, Sun } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

interface ThemeSelectorProps {
  isAdmin?: boolean;
}

export function ThemeSelector({ isAdmin = false }: ThemeSelectorProps) {
  const { t } = useLanguage();
  const [currentTheme, setCurrentTheme] = useState('design1');
  const [isDark, setIsDark] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCurrentTheme();
  }, [isAdmin]);

  const loadCurrentTheme = async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('admin_theme, user_theme')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      const theme = isAdmin ? (data as any).admin_theme : (data as any).user_theme;
      if (theme) {
        const isDarkTheme = theme.includes('-dark');
        setIsDark(isDarkTheme);
        setCurrentTheme(theme.replace('-dark', ''));
      }
    }
  };

  const applyTheme = async (theme: string, dark: boolean) => {
    setLoading(true);
    try {
      const { data: existingSettings } = await supabase
        .from('site_settings')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const finalTheme = dark ? `${theme}-dark` : theme;
      const updateData = isAdmin 
        ? { admin_theme: finalTheme }
        : { user_theme: finalTheme };

      if (existingSettings) {
        const { error } = await supabase
          .from('site_settings')
          .update(updateData)
          .eq('id', existingSettings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert(updateData);
        if (error) throw error;
      }

      setCurrentTheme(theme);
      setIsDark(dark);

      toast({
        title: t({ ar: "تم التطبيق", en: "Applied" }),
        description: t({ ar: "جاري تحديث التصميم...", en: "Updating theme..." }),
      });

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const themes = isAdmin 
    ? [
        { id: 'design1', name: t({ ar: 'تصميم 1 (الحالي)', en: 'Design 1 (Current)' }) },
        { id: 'admin-design2', name: t({ ar: 'تصميم 2 (إنفوجرافيك)', en: 'Design 2 (Infographic)' }) },
      ]
    : [
        { id: 'design1', name: t({ ar: 'تصميم 1 (الحالي)', en: 'Design 1 (Current)' }) },
        { id: 'design2', name: t({ ar: 'تصميم 2 (أزرق)', en: 'Design 2 (Blue)' }) },
        { id: 'design3', name: t({ ar: 'تصميم 3 (قريباً)', en: 'Design 3 (Soon)' }) },
      ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={loading}
        >
          <Palette className="w-4 h-4" />
          {t({ ar: 'التصميم', en: 'Theme' })}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          {t({ ar: 'اختر التصميم', en: 'Select Theme' })}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {themes.map((theme) => (
          <DropdownMenuItem
            key={theme.id}
            onClick={() => applyTheme(theme.id, isDark)}
            disabled={theme.id === 'design3'}
            className={currentTheme === theme.id ? 'bg-accent' : ''}
          >
            {theme.name}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          {t({ ar: 'الوضع', en: 'Mode' })}
        </DropdownMenuLabel>
        
        <DropdownMenuItem
          onClick={() => applyTheme(currentTheme, false)}
          className={!isDark ? 'bg-accent' : ''}
        >
          <Sun className="w-4 h-4 ml-2" />
          {t({ ar: 'فاتح', en: 'Light' })}
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => applyTheme(currentTheme, true)}
          className={isDark ? 'bg-accent' : ''}
        >
          <Moon className="w-4 h-4 ml-2" />
          {t({ ar: 'داكن', en: 'Dark' })}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
