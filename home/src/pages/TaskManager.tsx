import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Settings, ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function TaskManager() {
  const { t } = useLanguage();
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  const canManageSettings = userRole === 'admin';

  useEffect(() => {
    checkAccess();
  }, [user, userRole]);

  const checkAccess = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      // Admin, manager, and assistant_manager always have access
      const hasAdminAccess = ['admin', 'manager', 'assistant_manager'].includes(userRole || '');
      
      if (hasAdminAccess) {
        setHasAccess(true);
        setLoading(false);
        return;
      }

      // Check if user has full task manager access
      const { data, error } = await supabase
        .from('task_full_access_users')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setHasAccess(true);
      } else {
        toast.error(t({ ar: 'ليس لديك صلاحية الوصول لهذه الصفحة', en: 'You do not have access to this page' }));
        navigate('/my-tasks');
      }
    } catch (error) {
      console.error('Error checking access:', error);
      toast.error(t({ ar: 'حدث خطأ', en: 'An error occurred' }));
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-background via-muted/30 to-background overflow-hidden">
      <div className="h-full flex flex-col">
        {/* Compact Header */}
        <div className="flex-shrink-0 px-3 md:px-6 py-2 md:py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="h-6 w-6"
              >
                <ArrowLeft className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="h-6 w-6"
              >
                <Home className="w-3 h-3" />
              </Button>
              <h1 className="text-base md:text-lg font-semibold">
                {t({ ar: 'المهام', en: 'Tasks' })}
              </h1>
            </div>
            {canManageSettings && userRole === 'admin' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/task-settings')}
                className="h-8 gap-1.5"
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-xs">
                  {t({ ar: 'إعدادات المهام', en: 'Settings' })}
                </span>
              </Button>
            )}
          </div>
        </div>

        {/* Kanban Board - Full remaining space */}
        <div className="flex-1 overflow-hidden">
          <KanbanBoard />
        </div>
      </div>
    </div>
  );
}