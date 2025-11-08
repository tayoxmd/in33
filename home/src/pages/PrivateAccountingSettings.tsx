import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Shield, Users, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GoogleSheetsUploader } from '@/components/GoogleSheetsUploader';

export default function PrivateAccountingSettings() {
  const { t } = useLanguage();
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [accessList, setAccessList] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    checkAccess();
    loadUsers();
    loadAccessList();
  }, [user]);

  const checkAccess = () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (userRole !== 'manager' && userRole !== 'admin') {
      toast.error(t({ ar: 'ليس لديك صلاحية الوصول', en: 'You do not have access permission' }));
      navigate('/private-accounting');
    }
  };

  const loadUsers = async () => {
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, phone');

      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .neq('role', 'customer');

      if (profiles && roles) {
        const usersWithRoles = profiles.map(profile => {
          const userRoles = roles.filter(r => r.user_id === profile.id);
          return {
            ...profile,
            roles: userRoles.map(r => r.role)
          };
        }).filter(user => user.roles.length > 0 && user.roles.some(role => 
          ['manager', 'employee', 'company'].includes(role)
        ));

        setUsers(usersWithRoles);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error(t({ ar: 'خطأ في تحميل المستخدمين', en: 'Error loading users' }));
    } finally {
      setLoading(false);
    }
  };

  const loadAccessList = async () => {
    try {
      const { data } = await supabase
        .from('private_account_access')
        .select('user_id');

      if (data) {
        setAccessList(new Set(data.map(item => item.user_id)));
      }
    } catch (error) {
      console.error('Error loading access list:', error);
    }
  };

  const toggleAccess = async (userId: string, hasAccess: boolean) => {
    try {
      if (hasAccess) {
        // Grant access
        const { error } = await supabase
          .from('private_account_access')
          .insert({
            user_id: userId,
            granted_by: user?.id
          });

        if (error) throw error;
        setAccessList(prev => new Set([...prev, userId]));
        toast.success(t({ ar: 'تم منح الصلاحية بنجاح', en: 'Access granted successfully' }));
      } else {
        // Revoke access
        const { error } = await supabase
          .from('private_account_access')
          .delete()
          .eq('user_id', userId);

        if (error) throw error;
        setAccessList(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
        toast.success(t({ ar: 'تم إلغاء الصلاحية بنجاح', en: 'Access revoked successfully' }));
      }
    } catch (error) {
      console.error('Error updating access:', error);
      toast.error(t({ ar: 'خطأ في تحديث الصلاحية', en: 'Error updating access' }));
    }
  };

  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, { ar: string; en: string }> = {
      manager: { ar: 'مدير', en: 'Manager' },
      employee: { ar: 'موظف', en: 'Employee' },
      company: { ar: 'شركة', en: 'Company' }
    };
    return t(roleLabels[role] || { ar: role, en: role });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">{t({ ar: 'جاري التحميل...', en: 'Loading...' })}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/private-accounting')}
            className="hover:bg-accent"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {t({ ar: 'إعدادات الحسابات الخاصة', en: 'Private Accounting Settings' })}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t({ ar: 'إدارة صلاحيات الوصول', en: 'Manage access permissions' })}
            </p>
          </div>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="access" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="access" className="gap-2">
              <Shield className="h-4 w-4" />
              {t({ ar: 'الصلاحيات', en: 'Access' })}
            </TabsTrigger>
            <TabsTrigger value="customers" className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              {t({ ar: 'رفع العملاء', en: 'Upload Customers' })}
            </TabsTrigger>
            <TabsTrigger value="hotels" className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              {t({ ar: 'رفع الفنادق', en: 'Upload Hotels' })}
            </TabsTrigger>
            <TabsTrigger value="owners" className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              {t({ ar: 'رفع الملاك', en: 'Upload Owners' })}
            </TabsTrigger>
          </TabsList>

          {/* Access Control Tab */}
          <TabsContent value="access">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">
                    {t({ ar: 'صلاحية الوصول', en: 'Access Control' })}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {t({ ar: 'اختر المستخدمين الذين يمكنهم الوصول إلى الحسابات الخاصة', en: 'Select users who can access private accounting' })}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {users.map(user => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                      <div>
                        <p className="font-medium">{user.full_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-sm text-muted-foreground">{user.phone}</p>
                          <span className="text-muted-foreground">•</span>
                          <div className="flex gap-1 flex-wrap">
                            {user.roles.map((role: string, index: number) => (
                              <span key={index} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                {getRoleLabel(role)}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`access-${user.id}`}
                        checked={accessList.has(user.id) || user.roles.includes('manager')}
                        disabled={user.roles.includes('manager')}
                        onCheckedChange={(checked) => toggleAccess(user.id, checked as boolean)}
                      />
                      <Label htmlFor={`access-${user.id}`} className="cursor-pointer">
                        {accessList.has(user.id) || user.roles.includes('manager')
                          ? t({ ar: 'لديه صلاحية', en: 'Has Access' })
                          : t({ ar: 'بدون صلاحية', en: 'No Access' })}
                      </Label>
                    </div>
                  </div>
                ))}
              </div>

              {users.length === 0 && (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {t({ ar: 'لا يوجد مستخدمون', en: 'No users found' })}
                  </p>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Customers Upload Tab */}
          <TabsContent value="customers">
            <GoogleSheetsUploader
              title={t({ ar: 'رفع بيانات العملاء', en: 'Upload Customers Data' })}
              description={t({ ar: 'قم برفع بيانات العملاء من Google Sheets أو ملف CSV', en: 'Upload customer data from Google Sheets or CSV file' })}
              onUpload={async (data) => {
                const { error } = await supabase.from('private_customers' as any).insert(data);
                if (error) throw error;
              }}
            />
          </TabsContent>

          {/* Hotels Upload Tab */}
          <TabsContent value="hotels">
            <GoogleSheetsUploader
              title={t({ ar: 'رفع بيانات الفنادق', en: 'Upload Hotels Data' })}
              description={t({ ar: 'قم برفع بيانات الفنادق من Google Sheets أو ملف CSV', en: 'Upload hotel data from Google Sheets or CSV file' })}
              onUpload={async (data) => {
                const { error } = await supabase.from('private_hotels' as any).insert(data);
                if (error) throw error;
              }}
            />
          </TabsContent>

          {/* Owners Upload Tab */}
          <TabsContent value="owners">
            <GoogleSheetsUploader
              title={t({ ar: 'رفع بيانات الملاك', en: 'Upload Owners Data' })}
              description={t({ ar: 'قم برفع بيانات الملاك من Google Sheets أو ملف CSV', en: 'Upload owner data from Google Sheets or CSV file' })}
              onUpload={async (data) => {
                const { error } = await supabase.from('private_owners' as any).insert(data);
                if (error) throw error;
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}