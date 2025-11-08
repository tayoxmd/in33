import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Pencil, Plus, Trash2, ArrowLeft, UserCog } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { logAuditEvent } from "@/utils/auditLogger";

interface UserProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string;
  role: string;
}

export default function ManageEmployees() {
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    role: "customer" as string
  });

  useEffect(() => {
    if (userRole !== 'admin') {
      navigate('/');
      return;
    }
    fetchUsers();
  }, [userRole, navigate]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, phone');

      if (profilesError) {
        console.error('Profiles error:', profilesError);
        throw profilesError;
      }

      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        console.error('Roles error:', rolesError);
        throw rolesError;
      }

      // Use edge function to list users
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('No active session found');
        throw new Error('No active session. Please log in again.');
      }

      console.log('Fetching users from edge function...');
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'listUsers' })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Edge function error response:', response.status, errorText);
        
        // Try to parse error JSON
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || `Server error: ${response.status}`);
        } catch {
          throw new Error(`Failed to fetch users: ${response.status} - ${errorText}`);
        }
      }

      const responseData = await response.json();
      console.log('Edge function response:', responseData);
      const authUsers = responseData.users || [];

      const combinedUsers: UserProfile[] = profilesData?.map(profile => {
        const authUser = authUsers?.find((u: any) => u.id === profile.id);
        const userRole = rolesData?.find((r: any) => r.user_id === profile.id);
        
        return {
          id: profile.id,
          full_name: profile.full_name,
          phone: profile.phone,
          email: authUser?.email || '',
          role: userRole?.role || 'customer'
        };
      }) || [];

      // Sort users: admin first, then employee, then customer
      const roleOrder = { admin: 1, employee: 2, customer: 3 };
      combinedUsers.sort((a, b) => {
        const aOrder = roleOrder[a.role as keyof typeof roleOrder] || 999;
        const bOrder = roleOrder[b.role as keyof typeof roleOrder] || 999;
        return aOrder - bOrder;
      });

      console.log('Successfully fetched and combined users:', combinedUsers.length);
      setUsers(combinedUsers);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: error.message || t({ ar: "فشل في تحميل المستخدمين. يرجى المحاولة مرة أخرى.", en: "Failed to load users. Please try again." }),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!formData.email || !formData.password) {
      toast({
        title: t({ ar: "تنبيه", en: "Warning" }),
        description: t({ ar: "يرجى ملء جميع الحقول المطلوبة", en: "Please fill all required fields" }),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'createUser',
          email: formData.email,
          password: formData.password,
          metadata: {
            full_name: formData.full_name,
            phone: formData.phone
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create user');
      }

      const { user: newUser } = await response.json();

      if (formData.role !== 'customer' && newUser) {
        await supabase
          .from('user_roles')
          .update({ role: formData.role as any })
          .eq('user_id', newUser.id);
        
        // Log audit event for role assignment (non-blocking)
        logAuditEvent(
          'assign_user_role',
          'user',
          newUser.id,
          { role: formData.role }
        ).catch(() => {}); // Ignore audit logging errors
      }

      toast({
        title: t({ ar: "نجح", en: "Success" }),
        description: t({ ar: "تمت إضافة المستخدم بنجاح", en: "User added successfully" }),
      });

      setIsAddDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      console.error('Error adding user:', error);
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: error.message || t({ ar: "فشل في إضافة المستخدم", en: "Failed to add user" }),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    setLoading(true);
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone
        })
        .eq('id', selectedUser.id);

      if (profileError) throw profileError;

      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ role: formData.role as any })
        .eq('user_id', selectedUser.id);

      if (roleError) throw roleError;

      // Log audit event for role change (non-blocking)
      logAuditEvent(
        'update_user_role',
        'user',
        selectedUser.id,
        { 
          old_role: selectedUser.role,
          new_role: formData.role
        }
      ).catch(() => {}); // Ignore audit logging errors

      if (formData.password) {
        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'updateUser',
            userId: selectedUser.id,
            password: formData.password
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update password');
        }
      }

      toast({
        title: t({ ar: "نجح", en: "Success" }),
        description: t({ ar: "تم تحديث المستخدم بنجاح", en: "User updated successfully" }),
      });

      setIsEditDialogOpen(false);
      setSelectedUser(null);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: error.message || t({ ar: "فشل في تحديث المستخدم", en: "Failed to update user" }),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm(t({ ar: "هل أنت متأكد من حذف هذا المستخدم؟", en: "Are you sure you want to delete this user?" }))) {
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'deleteUser',
          userId
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }

      toast({
        title: t({ ar: "نجح", en: "Success" }),
        description: t({ ar: "تم حذف المستخدم بنجاح", en: "User deleted successfully" }),
      });

      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: error.message || t({ ar: "فشل في حذف المستخدم", en: "Failed to delete user" }),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (user: UserProfile) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      password: "",
      full_name: user.full_name || "",
      phone: user.phone || "",
      role: user.role as any
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      full_name: "",
      phone: "",
      role: "customer"
    });
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, { ar: string; en: string }> = {
      admin: { ar: "مدير", en: "Admin" },
      manager: { ar: "مدير", en: "Manager" },
      employee: { ar: "موظف", en: "Employee" },
      company: { ar: "شركات", en: "Company" },
      customer: { ar: "عميل", en: "Customer" },
    };
    return language === 'ar' ? labels[role]?.ar || role : labels[role]?.en || role;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 pt-24">
        <Button variant="outline" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t({ ar: "العودة", en: "Back" })}
        </Button>
        <Card className="card-luxury">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-2xl">
              {t({ ar: "إدارة المستخدمين", en: "Manage Users" })}
            </CardTitle>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="btn-luxury">
                  <Plus className="w-4 h-4 ml-2" />
                  {t({ ar: "إضافة مستخدم", en: "Add User" })}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t({ ar: "إضافة مستخدم جديد", en: "Add New User" })}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>{t({ ar: "البريد الإلكتروني", en: "Email" })}</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{t({ ar: "كلمة المرور", en: "Password" })}</Label>
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{t({ ar: "الاسم الكامل", en: "Full Name" })}</Label>
                    <Input
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{t({ ar: "رقم الهاتف", en: "Phone" })}</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{t({ ar: "الدور", en: "Role" })}</Label>
                    <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="customer">{t({ ar: "عميل", en: "Customer" })}</SelectItem>
                        <SelectItem value="company">{t({ ar: "شركات", en: "Company" })}</SelectItem>
                        <SelectItem value="employee">{t({ ar: "موظف", en: "Employee" })}</SelectItem>
                        <SelectItem value="manager">{t({ ar: "مدير", en: "Manager" })}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddUser} disabled={loading} className="w-full btn-luxury">
                    {t({ ar: "إضافة", en: "Add" })}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">{t({ ar: "الاسم", en: "Name" })}</TableHead>
                  <TableHead className="text-right">{t({ ar: "البريد الإلكتروني", en: "Email" })}</TableHead>
                  <TableHead className="text-right">{t({ ar: "الهاتف", en: "Phone" })}</TableHead>
                  <TableHead className="text-right">{t({ ar: "الدور", en: "Role" })}</TableHead>
                  <TableHead className="text-right">{t({ ar: "الإجراءات", en: "Actions" })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="text-right">{user.full_name}</TableCell>
                    <TableCell className="text-right">{user.email}</TableCell>
                    <TableCell className="text-right">{user.phone}</TableCell>
                    <TableCell className="text-right">{getRoleLabel(user.role)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(user)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => navigate(`/permissions?userId=${user.id}`)}>
                          <UserCog className="w-4 h-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(user.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t({ ar: "تعديل المستخدم", en: "Edit User" })}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{t({ ar: "البريد الإلكتروني", en: "Email" })}</Label>
                <Input
                  type="email"
                  value={formData.email}
                  disabled
                />
              </div>
              <div>
                <Label>{t({ ar: "كلمة المرور الجديدة (اختياري)", en: "New Password (Optional)" })}</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <div>
                <Label>{t({ ar: "الاسم الكامل", en: "Full Name" })}</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>
              <div>
                <Label>{t({ ar: "رقم الهاتف", en: "Phone" })}</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label>{t({ ar: "الدور", en: "Role" })}</Label>
                <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">{t({ ar: "عميل", en: "Customer" })}</SelectItem>
                    <SelectItem value="employee">{t({ ar: "موظف", en: "Employee" })}</SelectItem>
                    <SelectItem value="admin">{t({ ar: "مدير", en: "Admin" })}</SelectItem>
                    <SelectItem value="company">{t({ ar: "شركات", en: "Company" })}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleEditUser} disabled={loading} className="w-full btn-luxury">
                {t({ ar: "حفظ التغييرات", en: "Save Changes" })}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Footer />
    </div>
  );
}
