import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { 
  Users, 
  DollarSign, 
  Clock, 
  TrendingUp, 
  Calendar,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle
} from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";

interface Employee {
  id: string;
  full_name: string;
  phone: string;
}

interface Salary {
  id: string;
  employee_id: string;
  monthly_salary: number;
  bonus: number;
  deductions: number;
  payment_date: string;
  payment_status: string;
  notes: string;
}

interface Attendance {
  id: string;
  employee_id: string;
  check_in: string;
  check_out: string | null;
  attendance_date: string;
}

export default function EmployeeManagement() {
  const { userRole, loading } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [isSalaryDialogOpen, setIsSalaryDialogOpen] = useState(false);
  const [salaryFormData, setSalaryFormData] = useState({
    monthly_salary: "",
    bonus: "0",
    deductions: "0",
    payment_date: format(new Date(), 'yyyy-MM-dd'),
    notes: "",
  });

  useEffect(() => {
    if (!loading && userRole !== 'admin') {
      navigate('/');
    } else if (!loading) {
      fetchEmployees();
    }
  }, [userRole, loading, navigate]);

  const fetchEmployees = async () => {
    try {
      const { data: employeeRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['employee', 'company']);

      if (rolesError) throw rolesError;

      if (employeeRoles && employeeRoles.length > 0) {
        const employeeIds = employeeRoles.map(r => r.user_id);
        
        const { data: employeeProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, phone')
          .in('id', employeeIds);

        if (profilesError) throw profilesError;
        setEmployees(employeeProfiles || []);
      }
    } catch (error: any) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchEmployeeSalaries = async (employeeId: string) => {
    try {
      const { data, error } = await supabase
        .from('employee_salaries')
        .select('*')
        .eq('employee_id', employeeId)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      setSalaries(data || []);
    } catch (error: any) {
      console.error('Error fetching salaries:', error);
    }
  };

  const fetchEmployeeAttendance = async (employeeId: string) => {
    try {
      const { data, error } = await supabase
        .from('employee_attendance')
        .select('*')
        .eq('employee_id', employeeId)
        .order('attendance_date', { ascending: false })
        .limit(30);

      if (error) throw error;
      setAttendance(data || []);
    } catch (error: any) {
      console.error('Error fetching attendance:', error);
    }
  };

  const handleAddSalary = async () => {
    if (!selectedEmployee) return;

    try {
      const { error } = await supabase
        .from('employee_salaries')
        .insert([{
          employee_id: selectedEmployee,
          monthly_salary: parseFloat(salaryFormData.monthly_salary),
          bonus: parseFloat(salaryFormData.bonus),
          deductions: parseFloat(salaryFormData.deductions),
          payment_date: salaryFormData.payment_date,
          payment_status: 'pending',
          notes: salaryFormData.notes,
        }]);

      if (error) throw error;

      toast({
        title: t({ ar: "تم الإضافة", en: "Added" }),
        description: t({ ar: "تم إضافة الراتب بنجاح", en: "Salary added successfully" }),
      });

      setIsSalaryDialogOpen(false);
      setSalaryFormData({
        monthly_salary: "",
        bonus: "0",
        deductions: "0",
        payment_date: format(new Date(), 'yyyy-MM-dd'),
        notes: "",
      });
      fetchEmployeeSalaries(selectedEmployee);
    } catch (error: any) {
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateSalaryStatus = async (salaryId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('employee_salaries')
        .update({ payment_status: status })
        .eq('id', salaryId);

      if (error) throw error;

      toast({
        title: t({ ar: "تم التحديث", en: "Updated" }),
        description: t({ ar: "تم تحديث حالة الراتب", en: "Salary status updated" }),
      });

      if (selectedEmployee) {
        fetchEmployeeSalaries(selectedEmployee);
      }
    } catch (error: any) {
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEmployeeSelect = (employeeId: string) => {
    setSelectedEmployee(employeeId);
    fetchEmployeeSalaries(employeeId);
    fetchEmployeeAttendance(employeeId);
  };

  if (loading || loadingData) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  }

  const selectedEmployeeData = employees.find(e => e.id === selectedEmployee);
  const totalSalaries = salaries.reduce((sum, s) => sum + s.monthly_salary + s.bonus - s.deductions, 0);
  const paidSalaries = salaries.filter(s => s.payment_status === 'paid').length;
  const pendingSalaries = salaries.filter(s => s.payment_status === 'pending').length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {t({ ar: "شؤون الموظفين", en: "Employee Management" })}
          </h1>
          <p className="text-muted-foreground">
            {t({ ar: "إدارة رواتب وحضور الموظفين", en: "Manage employee salaries and attendance" })}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Stats Cards */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-2 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t({ ar: "إجمالي الموظفين", en: "Total Employees" })}</p>
                  <p className="text-3xl font-bold">{employees.length}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-2 border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t({ ar: "رواتب مدفوعة", en: "Paid Salaries" })}</p>
                  <p className="text-3xl font-bold">{paidSalaries}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-2 border-orange-200 dark:border-orange-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t({ ar: "رواتب معلقة", en: "Pending Salaries" })}</p>
                  <p className="text-3xl font-bold">{pendingSalaries}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-orange-500 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-2 border-purple-200 dark:border-purple-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t({ ar: "إجمالي الرواتب", en: "Total Salaries" })}</p>
                  <p className="text-2xl font-bold">{totalSalaries.toLocaleString()} {t({ ar: 'ر.س', en: 'SAR' })}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-purple-500 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Employees List */}
          <Card className="card-luxury">
            <CardHeader>
              <CardTitle>{t({ ar: "قائمة الموظفين", en: "Employees List" })}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {employees.map((employee) => (
                  <button
                    key={employee.id}
                    onClick={() => handleEmployeeSelect(employee.id)}
                    className={`w-full p-4 rounded-lg text-right transition-all ${
                      selectedEmployee === employee.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/50 hover:bg-muted'
                    }`}
                  >
                    <div className="font-medium">{employee.full_name}</div>
                    <div className="text-sm opacity-80">{employee.phone}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Employee Details */}
          <div className="lg:col-span-2 space-y-6">
            {selectedEmployee ? (
              <>
                {/* Salaries Section */}
                <Card className="card-luxury">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        {t({ ar: "الرواتب", en: "Salaries" })}
                      </CardTitle>
                      <Button onClick={() => setIsSalaryDialogOpen(true)} size="sm" className="gap-2">
                        <Plus className="w-4 h-4" />
                        {t({ ar: "إضافة راتب", en: "Add Salary" })}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {salaries.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        {t({ ar: "لا توجد رواتب مسجلة", en: "No salaries recorded" })}
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {salaries.map((salary) => (
                          <Card key={salary.id} className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-bold text-lg">
                                    {(salary.monthly_salary + salary.bonus - salary.deductions).toLocaleString()} {t({ ar: 'ر.س', en: 'SAR' })}
                                  </span>
                                  {salary.payment_status === 'paid' && (
                                    <Badge className="bg-green-500 text-white">{t({ ar: 'مدفوع', en: 'Paid' })}</Badge>
                                  )}
                                  {salary.payment_status === 'pending' && (
                                    <Badge className="bg-orange-500 text-white">{t({ ar: 'معلق', en: 'Pending' })}</Badge>
                                  )}
                                  {salary.payment_status === 'cancelled' && (
                                    <Badge className="bg-red-500 text-white">{t({ ar: 'ملغي', en: 'Cancelled' })}</Badge>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground space-y-1">
                                  <p>{t({ ar: 'التاريخ', en: 'Date' })}: {format(new Date(salary.payment_date), 'yyyy-MM-dd')}</p>
                                  <p>{t({ ar: 'الراتب الأساسي', en: 'Base' })}: {salary.monthly_salary} | {t({ ar: 'مكافأة', en: 'Bonus' })}: {salary.bonus} | {t({ ar: 'خصومات', en: 'Deductions' })}: {salary.deductions}</p>
                                  {salary.notes && <p className="text-xs">{salary.notes}</p>}
                                </div>
                              </div>
                              {salary.payment_status === 'pending' && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-1"
                                    onClick={() => updateSalaryStatus(salary.id, 'paid')}
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    {t({ ar: 'دفع', en: 'Pay' })}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => updateSalaryStatus(salary.id, 'cancelled')}
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Attendance Section */}
                <Card className="card-luxury">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      {t({ ar: "سجل الحضور والانصراف", en: "Attendance Record" })}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {attendance.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground mb-4">
                          {t({ ar: "لا توجد سجلات حضور", en: "No attendance records" })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t({ ar: "يمكن للموظف تسجيل الحضور من لوحة التحكم الخاصة به", en: "Employee can clock in from their dashboard" })}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {attendance.map((record) => (
                          <div key={record.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Calendar className="w-5 h-5 text-primary" />
                              <div>
                                <p className="font-medium">{format(new Date(record.attendance_date), 'yyyy-MM-dd')}</p>
                                <p className="text-sm text-muted-foreground">
                                  {t({ ar: 'دخول', en: 'In' })}: {format(new Date(record.check_in), 'HH:mm')}
                                  {record.check_out && (
                                    <> | {t({ ar: 'خروج', en: 'Out' })}: {format(new Date(record.check_out), 'HH:mm')}</>
                                  )}
                                </p>
                              </div>
                            </div>
                            {record.check_out ? (
                              <Badge className="bg-green-500 text-white">{t({ ar: 'مكتمل', en: 'Complete' })}</Badge>
                            ) : (
                              <Badge className="bg-blue-500 text-white">{t({ ar: 'جاري العمل', en: 'Working' })}</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="card-luxury lg:col-span-2">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Users className="w-16 h-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-lg">
                    {t({ ar: "اختر موظفاً لعرض التفاصيل", en: "Select an employee to view details" })}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Add Salary Dialog */}
        <Dialog open={isSalaryDialogOpen} onOpenChange={setIsSalaryDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t({ ar: "إضافة راتب جديد", en: "Add New Salary" })}</DialogTitle>
              <DialogDescription>
                {selectedEmployeeData && `${selectedEmployeeData.full_name} - ${selectedEmployeeData.phone}`}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>{t({ ar: "الراتب الشهري", en: "Monthly Salary" })}</Label>
                <Input
                  type="number"
                  value={salaryFormData.monthly_salary}
                  onChange={(e) => setSalaryFormData({ ...salaryFormData, monthly_salary: e.target.value })}
                  placeholder="0"
                />
              </div>

              <div>
                <Label>{t({ ar: "المكافأة", en: "Bonus" })}</Label>
                <Input
                  type="number"
                  value={salaryFormData.bonus}
                  onChange={(e) => setSalaryFormData({ ...salaryFormData, bonus: e.target.value })}
                  placeholder="0"
                />
              </div>

              <div>
                <Label>{t({ ar: "الخصومات", en: "Deductions" })}</Label>
                <Input
                  type="number"
                  value={salaryFormData.deductions}
                  onChange={(e) => setSalaryFormData({ ...salaryFormData, deductions: e.target.value })}
                  placeholder="0"
                />
              </div>

              <div>
                <Label>{t({ ar: "تاريخ الدفع", en: "Payment Date" })}</Label>
                <Input
                  type="date"
                  value={salaryFormData.payment_date}
                  onChange={(e) => setSalaryFormData({ ...salaryFormData, payment_date: e.target.value })}
                />
              </div>

              <div>
                <Label>{t({ ar: "ملاحظات", en: "Notes" })}</Label>
                <Input
                  value={salaryFormData.notes}
                  onChange={(e) => setSalaryFormData({ ...salaryFormData, notes: e.target.value })}
                  placeholder={t({ ar: "ملاحظات اختيارية", en: "Optional notes" })}
                />
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">{t({ ar: "الإجمالي بعد المكافأة والخصومات", en: "Total after bonus and deductions" })}</p>
                <p className="text-2xl font-bold text-primary">
                  {(parseFloat(salaryFormData.monthly_salary || "0") + parseFloat(salaryFormData.bonus || "0") - parseFloat(salaryFormData.deductions || "0")).toLocaleString()} {t({ ar: 'ر.س', en: 'SAR' })}
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSalaryDialogOpen(false)}>
                {t({ ar: "إلغاء", en: "Cancel" })}
              </Button>
              <Button onClick={handleAddSalary}>
                {t({ ar: "حفظ", en: "Save" })}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Footer />
    </div>
  );
}
