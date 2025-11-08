import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from "@/contexts/LanguageContext";
import { Utensils } from "lucide-react";

interface MealPlan {
  regular_ar: string;
  regular_en: string;
  ramadan_ar?: string;
  ramadan_en?: string;
  price: number;
  max_persons: number;
  extra_meal_price: number;
}

interface MealPlansManagerProps {
  mealPlan: MealPlan | null;
  onChange: (mealPlan: MealPlan | null) => void;
}

const regularMealOptions = [
  { ar: "لا يتضمن وجبات", en: "Room Only" },
  { ar: "يشمل الإفطار", en: "Bed & Breakfast" },
  { ar: "يشمل الغداء", en: "Lunch Included" },
  { ar: "يشمل العشاء", en: "Dinner Included" },
  { ar: "يشمل الإفطار و الغداء", en: "Half Board (Breakfast + Lunch)" },
  { ar: "يشمل الإفطار و العشاء", en: "Half Board (Breakfast + Dinner)" },
  { ar: "يشمل الإفطار و وجبة الغداء أو العشاء", en: "Half Board (Breakfast + One Meal)" },
  { ar: "يشمل 3 وجبات", en: "Full Board" },
  { ar: "أخرى", en: "Another" },
];

const ramadanMealOptions = [
  { ar: "", en: "" },
  { ar: "يشمل الإفطار", en: "Iftar Included" },
  { ar: "يشمل السحور", en: "Suhoor Included" },
  { ar: "يشمل الإفطار و السحور", en: "Iftar & Suhoor Included" },
];

export function MealPlansManager({ mealPlan, onChange }: MealPlansManagerProps) {
  const { t, language } = useLanguage();
  const [selectedRegularIndex, setSelectedRegularIndex] = useState<number>(0);
  const [selectedRamadanIndex, setSelectedRamadanIndex] = useState<number>(0);
  const [customRegularAr, setCustomRegularAr] = useState("");
  const [customRegularEn, setCustomRegularEn] = useState("");
  const [customRamadanAr, setCustomRamadanAr] = useState("");
  const [customRamadanEn, setCustomRamadanEn] = useState("");
  const [hasPricing, setHasPricing] = useState(false);
  const [price, setPrice] = useState("");
  const [maxPersons, setMaxPersons] = useState("2");
  const [extraMealPrice, setExtraMealPrice] = useState("");

  useEffect(() => {
    if (mealPlan) {
      const regularIndex = regularMealOptions.findIndex(
        opt => opt.ar === mealPlan.regular_ar && opt.en === mealPlan.regular_en
      );
      setSelectedRegularIndex(regularIndex >= 0 ? regularIndex : 8);
      
      if (regularIndex === 8 || regularIndex === -1) {
        setCustomRegularAr(mealPlan.regular_ar);
        setCustomRegularEn(mealPlan.regular_en);
      }

      if (mealPlan.ramadan_ar && mealPlan.ramadan_en) {
        const ramadanIndex = ramadanMealOptions.findIndex(
          opt => opt.ar === mealPlan.ramadan_ar && opt.en === mealPlan.ramadan_en
        );
        setSelectedRamadanIndex(ramadanIndex >= 0 ? ramadanIndex : 0);
        
        if (ramadanIndex === -1 && mealPlan.ramadan_ar) {
          setCustomRamadanAr(mealPlan.ramadan_ar);
          setCustomRamadanEn(mealPlan.ramadan_en || "");
        }
      }

      setHasPricing(mealPlan.price > 0);
      setPrice(mealPlan.price > 0 ? mealPlan.price.toString() : "");
      setMaxPersons(mealPlan.max_persons.toString());
      setExtraMealPrice(mealPlan.extra_meal_price.toString());
    }
  }, []);

  const updateMealPlan = (updates: Partial<MealPlan>) => {
    const current = mealPlan || {
      regular_ar: "",
      regular_en: "",
      ramadan_ar: "",
      ramadan_en: "",
      price: 0,
      max_persons: 2,
      extra_meal_price: 0,
    };
    
    onChange({ ...current, ...updates });
  };

  const handleRegularChange = (index: number) => {
    setSelectedRegularIndex(index);
    if (index === 0) {
      onChange(null);
      return;
    }
    if (index < 8) {
      updateMealPlan({
        regular_ar: regularMealOptions[index].ar,
        regular_en: regularMealOptions[index].en,
      });
    }
  };

  const handleRamadanChange = (index: number) => {
    setSelectedRamadanIndex(index);
    if (index === 0) {
      updateMealPlan({
        ramadan_ar: "",
        ramadan_en: "",
      });
    } else {
      updateMealPlan({
        ramadan_ar: ramadanMealOptions[index].ar,
        ramadan_en: ramadanMealOptions[index].en,
      });
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <Utensils className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">
          {t({ ar: "إدارة الوجبات", en: "Meal Plans Management" })}
        </h3>
      </div>

      {/* Regular Meals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>{t({ ar: "الوجبات (عربي)", en: "Meals (Arabic)" })}</Label>
          <Select 
            value={selectedRegularIndex.toString()} 
            onValueChange={(val) => handleRegularChange(parseInt(val))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {regularMealOptions.map((option, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {option.ar}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>{t({ ar: "الوجبات (إنجليزي)", en: "Meals (English)" })}</Label>
          <Select 
            value={selectedRegularIndex.toString()} 
            onValueChange={(val) => handleRegularChange(parseInt(val))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {regularMealOptions.map((option, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {option.en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Custom Regular Meals */}
      {selectedRegularIndex === 8 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>{t({ ar: "اسم الوجبة (عربي)", en: "Meal Name (Arabic)" })}</Label>
            <Input
              value={customRegularAr}
              onChange={(e) => {
                setCustomRegularAr(e.target.value);
                updateMealPlan({ regular_ar: e.target.value });
              }}
              placeholder={t({ ar: "أدخل اسم الوجبة", en: "Enter meal name" })}
            />
          </div>
          <div>
            <Label>{t({ ar: "اسم الوجبة (إنجليزي)", en: "Meal Name (English)" })}</Label>
            <Input
              value={customRegularEn}
              onChange={(e) => {
                setCustomRegularEn(e.target.value);
                updateMealPlan({ regular_en: e.target.value });
              }}
              placeholder={t({ ar: "أدخل اسم الوجبة", en: "Enter meal name" })}
            />
          </div>
        </div>
      )}

      {/* Ramadan Meals */}
      {selectedRegularIndex > 0 && (
        <>
          <div className="pt-4 border-t">
            <h4 className="font-semibold mb-3">
              {t({ ar: "وجبات رمضان", en: "Ramadan Meals" })}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>{t({ ar: "وجبات رمضان (عربي)", en: "Ramadan Meals (Arabic)" })}</Label>
                <Select 
                  value={selectedRamadanIndex.toString()} 
                  onValueChange={(val) => handleRamadanChange(parseInt(val))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">{t({ ar: "بدون", en: "None" })}</SelectItem>
                    {ramadanMealOptions.slice(1).map((option, index) => (
                      <SelectItem key={index + 1} value={(index + 1).toString()}>
                        {option.ar}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{t({ ar: "وجبات رمضان (إنجليزي)", en: "Ramadan Meals (English)" })}</Label>
                <Select 
                  value={selectedRamadanIndex.toString()} 
                  onValueChange={(val) => handleRamadanChange(parseInt(val))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">{t({ ar: "بدون", en: "None" })}</SelectItem>
                    {ramadanMealOptions.slice(1).map((option, index) => (
                      <SelectItem key={index + 1} value={(index + 1).toString()}>
                        {option.en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="pt-4 border-t space-y-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox 
                id="has-pricing" 
                checked={hasPricing}
                onCheckedChange={(checked) => {
                  setHasPricing(checked as boolean);
                  if (!checked) {
                    setPrice("");
                    updateMealPlan({ price: 0 });
                  }
                }}
              />
              <Label htmlFor="has-pricing" className="cursor-pointer">
                {t({ ar: "تحديد سعر للوجبات", en: "Set meal pricing" })}
              </Label>
            </div>

            {hasPricing && (
              <div>
                <Label>{t({ ar: "سعر الوجبة", en: "Meal Price" })}</Label>
                <Input
                  type="number"
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value);
                    updateMealPlan({ price: parseFloat(e.target.value) || 0 });
                  }}
                  placeholder={t({ ar: "0.00", en: "0.00" })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t({ 
                    ar: "إذا تُرك فارغًا، فإن الوجبات مشمولة في سعر الغرفة", 
                    en: "If left empty, meals are included in room price" 
                  })}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>{t({ ar: "الحد الأقصى لعدد الوجبات", en: "Max Meals Per Room" })}</Label>
                <div className="space-y-2">
                  <Select
                    value={parseInt(maxPersons) > 6 ? "custom" : maxPersons}
                    onValueChange={(value) => {
                      if (value !== "custom") {
                        setMaxPersons(value);
                        updateMealPlan({ max_persons: parseInt(value) });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} {t({ ar: num === 1 ? 'شخص' : num === 2 ? 'شخصين' : 'أشخاص', en: num === 1 ? 'person' : 'persons' })}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">{t({ ar: 'إدخال عدد آخر', en: 'Enter another number' })}</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {parseInt(maxPersons) > 6 && (
                    <Input
                      type="number"
                      min="1"
                      value={maxPersons}
                      onChange={(e) => {
                        setMaxPersons(e.target.value);
                        updateMealPlan({ max_persons: parseInt(e.target.value) || 2 });
                      }}
                      placeholder={t({ ar: "أدخل العدد", en: "Enter number" })}
                    />
                  )}
                </div>
              </div>

              <div>
                <Label>{t({ ar: "سعر الوجبة الإضافية", en: "Extra Meal Price" })}</Label>
                <Input
                  type="number"
                  value={extraMealPrice}
                  onChange={(e) => {
                    setExtraMealPrice(e.target.value);
                    updateMealPlan({ extra_meal_price: parseFloat(e.target.value) || 0 });
                  }}
                  placeholder={t({ ar: "0.00", en: "0.00" })}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
