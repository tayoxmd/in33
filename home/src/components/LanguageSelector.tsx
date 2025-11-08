import { Globe, ChevronDown } from "lucide-react";
import { useLanguage, languages, languageNames } from "@/contexts/LanguageContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const isMobile = useIsMobile();

  return (
    <Select value={language} onValueChange={setLanguage}>
      <SelectTrigger className={isMobile ? "w-[60px]" : "w-[180px]"}>
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4" />
          {!isMobile && <SelectValue />}
          {isMobile && <ChevronDown className="w-3 h-3" />}
        </div>
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang} value={lang}>
            {languageNames[lang]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
