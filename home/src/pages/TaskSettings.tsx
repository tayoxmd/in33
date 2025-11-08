import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Settings, Users, Shield, Archive } from 'lucide-react';

export default function TaskSettings() {
  const { t } = useLanguage();
  const { userRole } = useAuth();
  const navigate = useNavigate();

  const canManageSettings = userRole === 'admin';

  if (!canManageSettings) {
    navigate('/task-manager');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="container mx-auto p-4 md:p-6 pt-10 md:pt-14">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/task-manager')}
            className="h-10 w-10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Settings className="w-6 h-6 md:w-8 md:h-8" />
              {t({ ar: 'إعدادات المهام', en: 'Task Settings' })}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t({ 
                ar: 'تخصيص وإدارة إعدادات نظام المهام', 
                en: 'Customize and manage task system settings' 
              })}
            </p>
          </div>
        </div>

        {/* Settings Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Categories */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/task-categories')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-500" />
                {t({ ar: 'إعدادات الفئات', en: 'Categories Settings' })}
              </CardTitle>
              <CardDescription>
                {t({ ar: 'إدارة فئات المهام', en: 'Manage task categories' })}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Sharing Settings */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/task-sharing-settings')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-500" />
                {t({ ar: 'إعدادات المشاركة', en: 'Sharing Settings' })}
              </CardTitle>
              <CardDescription>
                {t({ ar: 'إعدادات المشاركة التلقائية', en: 'Auto-sharing settings' })}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Access Control */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/task-access-control')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-500" />
                {t({ ar: 'التحكم بالوصول', en: 'Access Control' })}
              </CardTitle>
              <CardDescription>
                {t({ ar: 'إدارة صلاحيات الوصول', en: 'Manage access permissions' })}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Archive */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/task-archive')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Archive className="w-5 h-5 text-orange-500" />
                {t({ ar: 'الأرشيف', en: 'Archive' })}
              </CardTitle>
              <CardDescription>
                {t({ ar: 'المهام المؤرشفة', en: 'Archived tasks' })}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Back Button */}
        <div className="mt-8 flex justify-center">
          <Button
            variant="outline"
            onClick={() => navigate('/task-manager')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t({ ar: 'العودة إلى المهام', en: 'Back to Tasks' })}
          </Button>
        </div>
      </div>
    </div>
  );
}
