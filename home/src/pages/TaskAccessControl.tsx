import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Shield, Users, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface UserAccess {
  user_id: string;
  full_name: string;
  role: string;
  role_name_ar: string;
  role_name_en: string;
  hasAccess: boolean;
}

export default function TaskAccessControl() {
  const { t, language } = useLanguage();
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userAccess, setUserAccess] = useState<UserAccess[]>([]);

  const canManage = userRole === 'admin';

  useEffect(() => {
    if (!canManage) {
      navigate('/task-settings');
      return;
    }
    fetchUserAccess();
  }, [canManage, navigate]);

  const fetchUserAccess = async () => {
    try {
      const roleMap = {
        employee: { name_ar: 'موظف', name_en: 'Employee' },
        company: { name_ar: 'شركة', name_en: 'Company' }
      };

      const allowedRoles = ['employee', 'company'] as const;

      // Get all users with allowed roles
      const { data: roleUsers, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id, role, profiles(full_name)')
        .in('role', allowedRoles)
        .eq('active', true);

      if (roleError) throw roleError;

      // Get users with full access
      const { data: fullAccessData } = await supabase
        .from('task_full_access_users')
        .select('user_id');

      const fullAccessUserIds = new Set(fullAccessData?.map(a => a.user_id) || []);

      // Format users with access status
      const users: UserAccess[] = roleUsers?.map(ru => ({
        user_id: ru.user_id,
        full_name: (ru.profiles as any)?.full_name || t({ ar: 'غير معروف', en: 'Unknown' }),
        role: ru.role,
        role_name_ar: roleMap[ru.role as keyof typeof roleMap]?.name_ar || ru.role,
        role_name_en: roleMap[ru.role as keyof typeof roleMap]?.name_en || ru.role,
        hasAccess: fullAccessUserIds.has(ru.user_id),
      })) || [];

      setUserAccess(users);
    } catch (error) {
      console.error('Error fetching user access:', error);
      toast.error(t({ ar: 'خطأ في جلب البيانات', en: 'Error fetching data' }));
    } finally {
      setLoading(false);
    }
  };

  const toggleUserAccess = async (userId: string) => {
    try {
      const currentAccess = userAccess.find(u => u.user_id === userId)?.hasAccess;

      if (currentAccess) {
        await supabase.from('task_full_access_users').delete().eq('user_id', userId);
      } else {
        await supabase.from('task_full_access_users').insert({ user_id: userId });
      }

      setUserAccess(prev => prev.map(u => 
        u.user_id === userId ? { ...u, hasAccess: !currentAccess } : u
      ));

      toast.success(t({ 
        ar: currentAccess ? 'تم إلغاء الصلاحية' : 'تم منح الصلاحية',
        en: currentAccess ? 'Access revoked' : 'Access granted'
      }));
    } catch (error) {
      console.error('Error:', error);
      toast.error(t({ ar: 'حدث خطأ', en: 'An error occurred' }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="container mx-auto p-4 md:p-6 pt-10 md:pt-14">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/task-settings')}
            className="h-10 w-10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6 md:w-8 md:h-8 text-blue-500" />
              {t({ ar: 'التحكم بالوصول للمهام', en: 'Task Access Control' })}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t({ 
                ar: 'تحديد صلاحيات الوصول للمهام حسب الرتبة الوظيفية',
                en: 'Set task access permissions by role'
              })}
            </p>
          </div>
        </div>

        {/* Info Card */}
        <Card className="mb-6 border-blue-500/20 bg-blue-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-blue-500 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {t({ ar: 'ملاحظة:', en: 'Note:' })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t({ 
                    ar: 'المدير ومدير الفرع لديهم صلاحية الوصول الكامل افتراضياً. هذه الصفحة للتحكم بصلاحيات الموظفين الآخرين.',
                    en: 'Admin and manager have full access by default. This page controls access for other staff members.'
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t({ ar: 'صلاحيات المستخدمين', en: 'User Permissions' })}
            </CardTitle>
            <CardDescription>
              {t({ 
                ar: 'انقر على الدوائر لتغيير صلاحيات الوصول للمهام',
                en: 'Click circles to change task access permissions'
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userAccess.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {t({ ar: 'لا يوجد مستخدمون', en: 'No users found' })}
              </p>
            ) : (
              <div className="space-y-3">
                {userAccess.map((user) => (
                  <div
                    key={user.user_id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleUserAccess(user.user_id)}
                        className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${
                          user.hasAccess 
                            ? 'bg-green-500 border-green-500' 
                            : 'border-muted hover:border-green-500'
                        }`}
                        title={t({ ar: 'الوصول للمهام', en: 'Task Access' })}
                      >
                        {user.hasAccess && <Eye className="w-4 h-4 text-white" />}
                      </button>

                      <div className="flex-1">
                        <p className="font-medium">{user.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {language === 'ar' ? user.role_name_ar : user.role_name_en}
                          {' • '}
                          {user.hasAccess 
                            ? t({ ar: 'لديه صلاحية', en: 'Has access' })
                            : t({ ar: 'ليس لديه صلاحية', en: 'No access' })
                          }
                        </p>
                      </div>
                      {user.hasAccess && (
                        <Shield className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="mt-8 flex justify-center">
          <Button
            variant="outline"
            onClick={() => navigate('/task-settings')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t({ ar: 'العودة', en: 'Back' })}
          </Button>
        </div>
      </div>
    </div>
  );
}
