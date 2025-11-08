import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { 
  Upload, 
  File, 
  Image as ImageIcon, 
  FileText, 
  Video, 
  Trash2, 
  Download,
  FolderOpen,
  Search
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface StudioFile {
  name: string;
  id: string;
  created_at: string;
  metadata: any;
  size?: number;
}

export default function Studio() {
  const { userRole, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [files, setFiles] = useState<StudioFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteFile, setDeleteFile] = useState<StudioFile | null>(null);

  useEffect(() => {
    if (!loading) {
      if (userRole !== 'admin') {
        navigate('/');
      } else {
        fetchFiles();
      }
    }
  }, [loading, userRole, navigate]);

  const fetchFiles = async () => {
    try {
      const { data, error } = await supabase
        .storage
        .from('studio-files')
        .list('', {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (error) throw error;
      setFiles(data || []);
    } catch (error: any) {
      console.error('Error fetching files:', error);
      toast.error(t({ ar: 'خطأ في تحميل الملفات', en: 'Error loading files' }));
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const fileName = `${Date.now()}-${file.name}`;
        
        const { error } = await supabase
          .storage
          .from('studio-files')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) throw error;
      }

      toast.success(t({ 
        ar: 'تم رفع الملفات بنجاح', 
        en: 'Files uploaded successfully' 
      }));
      fetchFiles();
    } catch (error: any) {
      console.error('Error uploading files:', error);
      toast.error(t({ ar: 'خطأ في رفع الملفات', en: 'Error uploading files' }));
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleDelete = async () => {
    if (!deleteFile) return;

    try {
      const { error } = await supabase
        .storage
        .from('studio-files')
        .remove([deleteFile.name]);

      if (error) throw error;

      toast.success(t({ ar: 'تم حذف الملف بنجاح', en: 'File deleted successfully' }));
      fetchFiles();
    } catch (error: any) {
      console.error('Error deleting file:', error);
      toast.error(t({ ar: 'خطأ في حذف الملف', en: 'Error deleting file' }));
    } finally {
      setDeleteFile(null);
    }
  };

  const handleDownload = async (file: StudioFile) => {
    try {
      const { data, error } = await supabase
        .storage
        .from('studio-files')
        .download(file.name);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(t({ ar: 'تم تحميل الملف', en: 'File downloaded' }));
    } catch (error: any) {
      console.error('Error downloading file:', error);
      toast.error(t({ ar: 'خطأ في تحميل الملف', en: 'Error downloading file' }));
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) {
      return <ImageIcon className="w-8 h-8 text-primary" />;
    }
    if (['pdf'].includes(ext || '')) {
      return <FileText className="w-8 h-8 text-red-500" />;
    }
    if (['mp4', 'mpeg', 'mov', 'avi', 'webm'].includes(ext || '')) {
      return <Video className="w-8 h-8 text-purple-500" />;
    }
    if (['csv', 'xlsx', 'xls'].includes(ext || '')) {
      return <FileText className="w-8 h-8 text-green-500" />;
    }
    return <File className="w-8 h-8 text-muted-foreground" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading || loadingFiles) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gradient-luxury">
              {t({ ar: 'الاستديو', en: 'Studio' })}
            </h1>
            <p className="text-muted-foreground mt-2">
              {t({ 
                ar: 'إدارة ملفات الوسائط والمستندات', 
                en: 'Manage your media files and documents' 
              })}
            </p>
          </div>
          
          <Button
            onClick={() => navigate('/admin')}
            variant="outline"
          >
            {t({ ar: 'العودة للوحة التحكم', en: 'Back to Dashboard' })}
          </Button>
        </div>

        {/* Upload Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              {t({ ar: 'رفع ملفات جديدة', en: 'Upload New Files' })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Input
                type="file"
                multiple
                onChange={handleFileUpload}
                disabled={uploading}
                className="flex-1"
                accept="image/*,video/*,.pdf,.csv,.xlsx,.xls"
              />
              {uploading && <LoadingSpinner />}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {t({ 
                ar: 'الصيغ المدعومة: الصور، الفيديو، PDF، CSV، Excel (حد أقصى 500 ميغابايت لكل ملف)', 
                en: 'Supported formats: Images, Videos, PDF, CSV, Excel (Max 500MB per file)' 
              })}
            </p>
          </CardContent>
        </Card>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder={t({ ar: 'بحث عن الملفات...', en: 'Search files...' })}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Files Grid */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              {t({ ar: 'الملفات المحفوظة', en: 'Saved Files' })}
              <span className="text-sm text-muted-foreground">
                ({filteredFiles.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredFiles.length === 0 ? (
              <div className="text-center py-12">
                <FolderOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {t({ ar: 'لا توجد ملفات', en: 'No files found' })}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredFiles.map((file) => (
                  <Card key={file.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center text-center">
                        <div className="mb-3">
                          {getFileIcon(file.name)}
                        </div>
                        <p className="text-sm font-medium truncate w-full mb-2" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground mb-1">
                          {formatFileSize(file.metadata?.size)}
                        </p>
                        <p className="text-xs text-muted-foreground mb-4">
                          {new Date(file.created_at).toLocaleDateString()}
                        </p>
                        <div className="flex gap-2 w-full">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(file)}
                            className="flex-1"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeleteFile(file)}
                            className="flex-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteFile} onOpenChange={() => setDeleteFile(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t({ ar: 'تأكيد الحذف', en: 'Confirm Delete' })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t({ 
                ar: 'هل أنت متأكد من حذف هذا الملف؟ لا يمكن التراجع عن هذا الإجراء.', 
                en: 'Are you sure you want to delete this file? This action cannot be undone.' 
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t({ ar: 'إلغاء', en: 'Cancel' })}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {t({ ar: 'حذف', en: 'Delete' })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
