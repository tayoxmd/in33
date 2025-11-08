import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Download, Upload, Database, Calendar, Clock, AlertCircle } from "lucide-react";
import { LoadingSpinner } from "./LoadingSpinner";

interface Backup {
  id: string;
  backup_data: any;
  backup_created_at: string;
  backup_version: number;
  created_at: string;
  updated_at: string;
}

interface BackupManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BackupManager({ open, onOpenChange }: BackupManagerProps) {
  const { t } = useLanguage();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (open) {
      fetchBackups();
    }
  }, [open]);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .not('backup_data', 'is', null)
        .order('backup_created_at', { ascending: false });

      if (error) {
        console.error('Fetch backups error:', error);
      }
      
      setBackups(data || []);
    } catch (error: any) {
      console.error('Fetch backups exception:', error);
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (backup: Backup) => {
    try {
      const dataStr = JSON.stringify(backup.backup_data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      const date = new Date(backup.backup_created_at).toISOString().split('T')[0];
      link.download = `backup-v${backup.backup_version}-${date}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: t({ ar: "تم التحميل", en: "Downloaded" }),
        description: t({ ar: "تم تحميل النسخة الاحتياطية", en: "Backup downloaded successfully" }),
      });
    } catch (error: any) {
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const callRestore = async (data: any) => {
    const { data: result, error } = await supabase.functions.invoke('restore-backup', {
      body: { backup: data }
    });
    
    if (error) {
      console.error('Restore error:', error);
      throw new Error(error.message || 'Failed to restore backup');
    }
    
    return result;
  };

  const handleRestore = async (backup: Backup) => {
    if (!confirm(t({ 
      ar: "هل أنت متأكد من استعادة هذه النسخة؟ سيتم استبدال البيانات الحالية.", 
      en: "Are you sure you want to restore this backup? Current data will be replaced." 
    }))) {
      return;
    }

    setRestoring(true);
    try {
      toast({
        title: t({ ar: "جاري الاستعادة", en: "Restoring" }),
        description: t({ 
          ar: "جاري استعادة النسخة الاحتياطية... قد يستغرق هذا بعض الوقت.", 
          en: "Restoring backup... This may take a while." 
        }),
      });

      await callRestore(backup.backup_data);

      toast({
        title: t({ ar: "تمت الاستعادة", en: "Restored" }),
        description: t({ ar: "تمت استعادة البيانات بنجاح", en: "Data restored successfully" }),
      });
      setRestoring(false);
    } catch (error: any) {
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: error.message,
        variant: "destructive",
      });
      setRestoring(false);
    }
  };

  const handleUploadRestore = async (file: File) => {
    setRestoring(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      await callRestore(parsed);
      toast({
        title: t({ ar: "تمت الاستعادة", en: "Restored" }),
        description: t({ ar: "تمت استعادة البيانات من الملف بنجاح", en: "Data restored from file successfully" }),
      });
    } catch (error: any) {
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setRestoring(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            {t({ ar: "إدارة النسخ الاحتياطية", en: "Backup Management" })}
          </DialogTitle>
          <DialogDescription>
            {t({ 
              ar: "عرض وإدارة جميع النسخ الاحتياطية المحفوظة", 
              en: "View and manage all saved backups" 
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-muted-foreground">
            {t({ ar: "يمكنك رفع ملف النسخة الاحتياطية لاستعادته", en: "You can upload a backup file to restore" })}
          </div>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files && handleUploadRestore(e.target.files[0])} />
            <Button variant="outline" size="sm" className="gap-1" disabled={restoring}>
              <Upload className="w-4 h-4" />
              {t({ ar: "رفع واستعادة", en: "Upload & Restore" })}
            </Button>
          </label>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : backups.length === 0 ? (
          <Card className="p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {t({ ar: "لا توجد نسخ احتياطية محفوظة", en: "No backups available" })}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {backups.map((backup) => (
              <Card key={backup.id} className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary">
                        {t({ ar: "نسخة", en: "Version" })} {backup.backup_version}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {formatDate(backup.backup_created_at)}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 inline mr-1" />
                      {t({ ar: "آخر تحديث:", en: "Last updated:" })} {formatDate(backup.updated_at)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(backup)}
                      className="gap-1"
                    >
                      <Download className="w-4 h-4" />
                      {t({ ar: "تحميل", en: "Download" })}
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleRestore(backup)}
                      disabled={restoring}
                      className="gap-1"
                    >
                      <Upload className="w-4 h-4" />
                      {t({ ar: "استعادة", en: "Restore" })}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t({ ar: "إغلاق", en: "Close" })}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}