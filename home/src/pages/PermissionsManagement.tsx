import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { toast } from "sonner";
import { Shield, User, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSearchParams } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Permission {
  id: string;
  name_ar: string;
  name_en: string;
  permission_key: string;
  description_ar: string;
  description_en: string;
  category: string;
}

interface UserProfile {
  id: string;
  full_name: string;
  phone: string;
}

const PermissionsManagement = () => {
  const { user, userRole } = useAuth();
  const { language, t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [userPermissions, setUserPermissions] = useState<string[]>([]);

useEffect(() => {
    if (userRole === 'admin') {
      fetchData();
    }
  }, [userRole]);

  useEffect(() => {
    const userId = searchParams.get('userId');
    if (userId) {
      setSelectedUser(userId);
      fetchUserPermissions(userId);
    }
  }, [searchParams]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all permissions
      const { data: permsData, error: permsError } = await supabase
        .from('permissions' as any)
        .select('*')
        .order('category', { ascending: true });

      if (permsError) throw permsError;
      setPermissions(permsData as any || []);

      // Fetch all users (non-admin)
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .neq('role', 'admin');

      if (rolesError) throw rolesError;

      const userIds = [...new Set(rolesData?.map(r => r.user_id) || [])];
      
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, phone')
          .in('id', userIds);

        if (profilesError) throw profilesError;
        setUsers(profilesData || []);
      }

    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error(t('حدث خطأ أثناء تحميل البيانات', 'Error loading data'));
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPermissions = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_permissions' as any)
        .select('permission_key')
        .eq('user_id', userId);

      if (error) throw error;
      setUserPermissions(data?.map((p: any) => p.permission_key) || []);
    } catch (error: any) {
      console.error('Error fetching user permissions:', error);
      toast.error(t('حدث خطأ أثناء تحميل الصلاحيات', 'Error loading permissions'));
    }
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUser(userId);
    if (userId) {
      fetchUserPermissions(userId);
    } else {
      setUserPermissions([]);
    }
  };

  const handlePermissionToggle = async (permissionKey: string, checked: boolean) => {
    if (!selectedUser) return;

    try {
      setSaving(true);

      if (checked) {
        // Add permission
        const { error } = await supabase
          .from('user_permissions' as any)
          .insert({
            user_id: selectedUser,
            permission_key: permissionKey,
            granted_by: user?.id
          });

        if (error) throw error;
        setUserPermissions([...userPermissions, permissionKey]);
      } else {
        // Remove permission
        const { error } = await supabase
          .from('user_permissions' as any)
          .delete()
          .eq('user_id', selectedUser)
          .eq('permission_key', permissionKey);

        if (error) throw error;
        setUserPermissions(userPermissions.filter(p => p !== permissionKey));
      }

      toast.success(t('تم تحديث الصلاحيات بنجاح', 'Permissions updated successfully'));
    } catch (error: any) {
      console.error('Error updating permission:', error);
      toast.error(t('حدث خطأ أثناء تحديث الصلاحيات', 'Error updating permissions'));
    } finally {
      setSaving(false);
    }
  };

  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  const getCategoryName = (category: string) => {
    const categories: Record<string, { ar: string; en: string }> = {
      general: { ar: "عام", en: "General" },
      hotels: { ar: "الفنادق", en: "Hotels" },
      bookings: { ar: "الحجوزات", en: "Bookings" },
      users: { ar: "المستخدمون", en: "Users" },
      employees: { ar: "الموظفون", en: "Employees" },
      content: { ar: "المحتوى", en: "Content" },
      marketing: { ar: "التسويق", en: "Marketing" },
      pricing: { ar: "التسعير", en: "Pricing" },
      settings: { ar: "الإعدادات", en: "Settings" },
      technical: { ar: "تقنية", en: "Technical" },
      security: { ar: "الأمان", en: "Security" },
      tasks: { ar: "المهام", en: "Tasks" },
      finance: { ar: "المالية", en: "Finance" }
    };
    return language === 'ar' ? categories[category]?.ar || category : categories[category]?.en || category;
  };

  if (userRole !== 'admin') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-24">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t('ليس لديك صلاحية الوصول لهذه الصفحة', 'You do not have permission to access this page')}
            </AlertDescription>
          </Alert>
        </div>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-24 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">{t('إدارة الصلاحيات', 'Permissions Management')}</h1>
              <p className="text-muted-foreground">
                {t('تحكم في صلاحيات المستخدمين والموظفين', 'Control user and employee permissions')}
              </p>
            </div>
          </div>

          <Card className="p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <User className="w-5 h-5 text-primary" />
              <Label className="text-lg font-semibold">
                {t('اختر المستخدم', 'Select User')}
              </Label>
            </div>
            <Select value={selectedUser} onValueChange={handleUserSelect}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('اختر مستخدماً...', 'Select a user...')} />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name} - {user.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>

          {selectedUser && (
            <div className="space-y-6">
              {Object.entries(groupedPermissions).map(([category, perms]) => (
                <Card key={category} className="p-6">
                  <h3 className="text-xl font-bold mb-4 text-primary">
                    {getCategoryName(category)}
                  </h3>
                  <div className="space-y-4">
                    {perms.map((perm) => (
                      <div key={perm.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                        <Checkbox
                          id={perm.id}
                          checked={userPermissions.includes(perm.permission_key)}
                          onCheckedChange={(checked) => handlePermissionToggle(perm.permission_key, checked as boolean)}
                          disabled={saving}
                        />
                        <div className="flex-1">
                          <Label htmlFor={perm.id} className="font-medium cursor-pointer">
                            {language === 'ar' ? perm.name_ar : perm.name_en}
                          </Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            {language === 'ar' ? perm.description_ar : perm.description_en}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {!selectedUser && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t('الرجاء اختيار مستخدم لعرض وتعديل صلاحياته', 'Please select a user to view and modify their permissions')}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PermissionsManagement;