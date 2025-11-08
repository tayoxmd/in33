import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppSettings = {
  disableAnimations: boolean;
  animationSpeedMultiplier: number; // 1.0 = default
  loaderEnabled: boolean;
  loaderSpeedMs: number; // e.g., 1000ms
  loaderType: 'spinner' | 'custom';
  loaderCustomHTML?: string | null;
  loaderCustomCSS?: string | null;
  loaderCustomJS?: string | null;
};

const defaultSettings: AppSettings = {
  disableAnimations: false,
  animationSpeedMultiplier: 1,
  loaderEnabled: true,
  loaderSpeedMs: 1000,
  loaderType: 'spinner',
  loaderCustomHTML: null,
  loaderCustomCSS: null,
  loaderCustomJS: null,
};

const SettingsContext = createContext<{ settings: AppSettings } | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  useEffect(() => {
    let mounted = true;
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('disable_animations, animation_speed_multiplier, loader_enabled, loader_speed_ms, loader_type, loader_custom_html, loader_custom_css, loader_custom_js')
        .maybeSingle();

      if (!mounted) return;

      if (data) {
        const s: AppSettings = {
          disableAnimations: !!data.disable_animations,
          animationSpeedMultiplier: Number(data.animation_speed_multiplier ?? 1) || 1,
          loaderEnabled: data.loader_enabled ?? true,
          loaderSpeedMs: Number(data.loader_speed_ms ?? 1000) || 1000,
          loaderType: (data.loader_type as 'spinner' | 'custom') ?? 'spinner',
          loaderCustomHTML: data.loader_custom_html ?? null,
          loaderCustomCSS: data.loader_custom_css ?? null,
          loaderCustomJS: data.loader_custom_js ?? null,
        };
        setSettings(s);
        applySettingsToDOM(s);
      } else {
        applySettingsToDOM(defaultSettings);
      }
    };

    fetchSettings();

    return () => { mounted = false; };
  }, []);

  const applySettingsToDOM = (s: Partial<AppSettings>) => {
    const body = document.body;
    // Toggle animations
    if (s.disableAnimations) body.classList.add('no-animations');
    else body.classList.remove('no-animations');

    // Loader speed CSS var
    const speed = s.loaderSpeedMs ?? defaultSettings.loaderSpeedMs;
    document.documentElement.style.setProperty('--loader-speed-ms', String(speed));

    // Optional: animation multiplier (can be used by components if needed)
    document.documentElement.style.setProperty('--animation-multiplier', String(s.animationSpeedMultiplier ?? 1));

    // Inject custom CSS
    const styleId = 'custom-loader-css';
    let styleTag = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }
    styleTag.textContent = s.loaderCustomCSS || '';

    // Inject custom JS
    const scriptId = 'custom-loader-js';
    let scriptTag = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = scriptId;
      document.body.appendChild(scriptTag);
    }
    scriptTag.textContent = s.loaderCustomJS || '';
  };

  const value = useMemo(() => ({ settings }), [settings]);

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
};
