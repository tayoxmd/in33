import { cn } from "@/lib/utils";
import { useSettings } from "@/contexts/SettingsContext";
import DOMPurify from 'dompurify';

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const { settings } = useSettings();
  
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4"
  };

  // If loader is disabled, return null
  if (!settings.loaderEnabled) {
    return null;
  }

  // If custom loader is enabled and HTML is provided
  if (settings.loaderType === 'custom' && settings.loaderCustomHTML) {
    // Sanitize HTML to prevent XSS attacks
    const cleanHTML = DOMPurify.sanitize(settings.loaderCustomHTML, {
      ALLOWED_TAGS: ['div', 'span', 'svg', 'circle', 'path', 'rect', 'line', 'polyline', 'polygon', 'animate', 'animateTransform'],
      ALLOWED_ATTR: ['class', 'style', 'viewBox', 'd', 'cx', 'cy', 'r', 'x', 'y', 'width', 'height', 'fill', 'stroke', 'stroke-width', 'transform', 'opacity']
    });
    
    return (
      <div 
        className={cn("relative inline-block", className)}
        dangerouslySetInnerHTML={{ __html: cleanHTML }}
      />
    );
  }

  // Default spinner
  return (
    <div className={cn("relative inline-block", className)}>
      <div 
        className={cn(
          "rounded-full border-solid border-primary/20 animate-spin",
          sizeClasses[size]
        )}
        style={{
          borderTopColor: "hsl(var(--primary))",
          animationDuration: `${settings.loaderSpeedMs}ms`
        }}
      />
    </div>
  );
}
