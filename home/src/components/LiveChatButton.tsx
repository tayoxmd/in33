import { MessageCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

export const LiveChatButton = () => {
  const { t } = useLanguage();

  const handleOpenChat = () => {
    // Open Tidio chat widget
    if (window.tidioChatApi) {
      window.tidioChatApi.open();
    }
  };

  return (
    <Button
      onClick={handleOpenChat}
      className="fixed left-4 top-24 z-40 shadow-lg flex items-center gap-2 bg-primary hover:bg-primary/90"
    >
      <MessageCircle className="w-5 h-5" />
      <span>{t('الدردشة المباشرة', 'Live Chat')}</span>
    </Button>
  );
};

// Declare Tidio API on window object
declare global {
  interface Window {
    tidioChatApi?: {
      open: () => void;
      close: () => void;
      show: () => void;
      hide: () => void;
    };
  }
}
