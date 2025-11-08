import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface GoogleSheetsUploaderProps {
  title: string;
  description: string;
  onUpload: (data: any[]) => Promise<void>;
}

export function GoogleSheetsUploader({ title, description, onUpload }: GoogleSheetsUploaderProps) {
  const { t } = useLanguage();
  const [uploading, setUploading] = useState(false);
  const [sheetsUrl, setSheetsUrl] = useState('');
  const [csvData, setCsvData] = useState('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error(t({ ar: 'يرجى رفع ملف CSV فقط', en: 'Please upload CSV files only' }));
      return;
    }

    setUploading(true);
    try {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',');
      
      const data = lines.slice(1).filter(line => line.trim()).map(line => {
        const values = line.split(',');
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header.trim()] = values[index]?.trim() || '';
        });
        return obj;
      });

      await onUpload(data);
      toast.success(t({ ar: 'تم رفع البيانات بنجاح', en: 'Data uploaded successfully' }));
      event.target.value = '';
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(t({ ar: 'خطأ في رفع الملف', en: 'Error uploading file' }));
    } finally {
      setUploading(false);
    }
  };

  const handleCsvPaste = async () => {
    if (!csvData.trim()) {
      toast.error(t({ ar: 'يرجى لصق البيانات أولاً', en: 'Please paste data first' }));
      return;
    }

    setUploading(true);
    try {
      const lines = csvData.split('\n');
      const headers = lines[0].split(',');
      
      const data = lines.slice(1).filter(line => line.trim()).map(line => {
        const values = line.split(',');
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header.trim()] = values[index]?.trim() || '';
        });
        return obj;
      });

      await onUpload(data);
      toast.success(t({ ar: 'تم رفع البيانات بنجاح', en: 'Data uploaded successfully' }));
      setCsvData('');
    } catch (error) {
      console.error('Error processing data:', error);
      toast.error(t({ ar: 'خطأ في معالجة البيانات', en: 'Error processing data' }));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-green-500/10">
          <FileSpreadsheet className="h-5 w-5 text-green-500" />
        </div>
        <div>
          <h3 className="text-lg font-bold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* File Upload */}
        <div>
          <Label>{t({ ar: 'رفع ملف CSV', en: 'Upload CSV File' })}</Label>
          <div className="mt-2">
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={uploading}
              className="cursor-pointer"
            />
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              {t({ ar: 'أو', en: 'Or' })}
            </span>
          </div>
        </div>

        {/* Manual Paste */}
        <div>
          <Label>{t({ ar: 'لصق البيانات من Google Sheets', en: 'Paste Data from Google Sheets' })}</Label>
          <Textarea
            value={csvData}
            onChange={(e) => setCsvData(e.target.value)}
            placeholder={t({ 
              ar: 'الصق البيانات هنا بصيغة CSV...', 
              en: 'Paste CSV data here...' 
            })}
            rows={8}
            className="mt-2 font-mono text-sm"
            disabled={uploading}
          />
          <Button
            onClick={handleCsvPaste}
            disabled={uploading || !csvData.trim()}
            className="mt-2 gap-2"
          >
            <Upload className="h-4 w-4" />
            {uploading ? t({ ar: 'جاري الرفع...', en: 'Uploading...' }) : t({ ar: 'رفع البيانات', en: 'Upload Data' })}
          </Button>
        </div>

        {/* Instructions */}
        <div className="flex gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p className="font-medium mb-1">
              {t({ ar: 'تعليمات الرفع:', en: 'Upload Instructions:' })}
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>{t({ ar: 'الصف الأول يجب أن يحتوي على عناوين الأعمدة', en: 'First row must contain column headers' })}</li>
              <li>{t({ ar: 'تأكد من تطابق أسماء الأعمدة مع الحقول المطلوبة', en: 'Ensure column names match required fields' })}</li>
              <li>{t({ ar: 'يمكنك نسخ البيانات مباشرة من Google Sheets', en: 'You can copy data directly from Google Sheets' })}</li>
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
}