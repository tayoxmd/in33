import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MealBadgeSettings {
  color: string;
  textColor: string;
  widthMobile: number;
  heightMobile: number;
  autoWidthMobile: boolean;
  widthTablet: number;
  heightTablet: number;
  autoWidthTablet: boolean;
  widthDesktop: number;
  heightDesktop: number;
  autoWidthDesktop: boolean;
  fontSize: number;
  borderRadius: number;
}

interface MealDescriptionSettings {
  bgColor: string;
  textColor: string;
  fontSize: number;
  borderRadius: number;
  borderColor: string;
}

interface MealSettingsContextType {
  mealBadgeSettings: MealBadgeSettings;
  mealDescriptionSettings: MealDescriptionSettings;
  loading: boolean;
}

const MealSettingsContext = createContext<MealSettingsContextType | undefined>(undefined);

export const MealSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [mealBadgeSettings, setMealBadgeSettings] = useState<MealBadgeSettings>({
    color: '#007dff',
    textColor: '#ffffff',
    widthMobile: 120,
    heightMobile: 24,
    autoWidthMobile: false,
    widthTablet: 150,
    heightTablet: 32,
    autoWidthTablet: false,
    widthDesktop: 180,
    heightDesktop: 36,
    autoWidthDesktop: false,
    fontSize: 12,
    borderRadius: 8,
  });

  const [mealDescriptionSettings, setMealDescriptionSettings] = useState<MealDescriptionSettings>({
    bgColor: '#f0fdf4',
    textColor: '#15803d',
    fontSize: 12,
    borderRadius: 8,
    borderColor: '#86efac',
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await supabase
          .from('site_settings')
          .select('meal_badge_color, meal_badge_text_color, meal_badge_width_mobile, meal_badge_height_mobile, meal_badge_auto_width_mobile, meal_badge_width_tablet, meal_badge_height_tablet, meal_badge_auto_width_tablet, meal_badge_width_desktop, meal_badge_height_desktop, meal_badge_auto_width_desktop, meal_badge_font_size, meal_badge_border_radius, meal_description_bg_color, meal_description_text_color, meal_description_font_size, meal_description_border_radius, meal_description_border_color')
          .order('created_at', { ascending: false })
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (data) {
          setMealBadgeSettings({
            color: data.meal_badge_color || '#007dff',
            textColor: data.meal_badge_text_color || '#ffffff',
            widthMobile: data.meal_badge_width_mobile || 120,
            heightMobile: data.meal_badge_height_mobile || 24,
            autoWidthMobile: data.meal_badge_auto_width_mobile || false,
            widthTablet: data.meal_badge_width_tablet || 150,
            heightTablet: data.meal_badge_height_tablet || 32,
            autoWidthTablet: data.meal_badge_auto_width_tablet || false,
            widthDesktop: data.meal_badge_width_desktop || 180,
            heightDesktop: data.meal_badge_height_desktop || 36,
            autoWidthDesktop: data.meal_badge_auto_width_desktop || false,
            fontSize: data.meal_badge_font_size || 12,
            borderRadius: data.meal_badge_border_radius || 8,
          });
          setMealDescriptionSettings({
            bgColor: data.meal_description_bg_color || '#f0fdf4',
            textColor: data.meal_description_text_color || '#15803d',
            fontSize: data.meal_description_font_size || 12,
            borderRadius: data.meal_description_border_radius || 8,
            borderColor: data.meal_description_border_color || '#86efac',
          });
        }
      } catch (error) {
        console.error('Error fetching meal settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return (
    <MealSettingsContext.Provider value={{ mealBadgeSettings, mealDescriptionSettings, loading }}>
      {children}
    </MealSettingsContext.Provider>
  );
};

export const useMealSettings = () => {
  const context = useContext(MealSettingsContext);
  if (context === undefined) {
    throw new Error('useMealSettings must be used within a MealSettingsProvider');
  }
  return context;
};
