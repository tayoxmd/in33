import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Search, Users, Minus, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format, differenceInDays } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";
import type { DateRange } from "react-day-picker";

interface City {
  id: string;
  name_ar: string;
  name_en: string;
}

export function SearchBox({ initialValues, onSearch }: { initialValues?: any, onSearch?: () => void } = {}) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    if (initialValues?.checkIn && initialValues?.checkOut) {
      return {
        from: new Date(initialValues.checkIn),
        to: new Date(initialValues.checkOut)
      };
    }
    return undefined;
  });

  const handleDayClick = (day: Date) => {
    // 1st click: pick start, 2nd: pick end, 3rd: restart from clicked day, then repeat
    if (!dateRange?.from || (dateRange?.from && dateRange?.to)) {
      setDateRange({ from: day, to: undefined });
      return;
    }

    if (day < dateRange.from || day.getTime() === dateRange.from.getTime()) {
      setDateRange({ from: day, to: undefined });
    } else {
      setDateRange({ from: dateRange.from, to: day });
    }
  };
  const [rooms, setRooms] = useState(parseInt(initialValues?.rooms) || 1);
  const [adults, setAdults] = useState(parseInt(initialValues?.guests) || 2);
  const [children, setChildren] = useState(0);
  const [selectedCity, setSelectedCity] = useState<string>(initialValues?.city || "");
  const [cities, setCities] = useState<City[]>([]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isGuestsOpen, setIsGuestsOpen] = useState(false);

  const nights = dateRange?.from && dateRange?.to 
    ? differenceInDays(dateRange.to, dateRange.from)
    : 0;

  useEffect(() => {
    async function fetchCities() {
      const { data } = await supabase
        .from('cities')
        .select('*')
        .eq('active', true);
      if (data) setCities(data);
    }
    fetchCities();
  }, []);

  const handleSearch = () => {
    if (!selectedCity) {
      toast({
        title: t({ ar: "تنبيه", en: "Warning" }),
        description: t({ ar: "يرجى اختيار المدينة", en: "Please select a city" }),
        variant: "destructive",
      });
      return;
    }

    // Validate dates are selected
    if (!dateRange?.from || !dateRange?.to) {
      toast({
        title: t({ ar: "تنبيه", en: "Warning" }),
        description: t({ ar: "يرجى اختيار تاريخ الوصول والمغادرة", en: "Please select check-in and check-out dates" }),
        variant: "destructive",
      });
      return;
    }

    // Validate dates before search
    if (dateRange.to <= dateRange.from) {
      toast({
        title: t({ ar: "خطأ في التاريخ", en: "Date Error" }),
        description: t({ ar: "تاريخ المغادرة يجب أن يكون بعد تاريخ الوصول", en: "Check-out date must be after check-in date" }),
        variant: "destructive",
      });
      return;
    }

    const params = new URLSearchParams();
    params.set('city', selectedCity);
    if (dateRange?.from) params.set('checkIn', format(dateRange.from, 'yyyy-MM-dd'));
    if (dateRange?.to) params.set('checkOut', format(dateRange.to, 'yyyy-MM-dd'));
    params.set('guests', (adults + children).toString());
    params.set('rooms', rooms.toString());

    // Close calendar if open
    setIsCalendarOpen(false);

    navigate(`/search?${params.toString()}`);
    
    // Call onSearch callback if provided (for scrolling in SearchResults)
    if (onSearch) {
      onSearch();
    }
  };

  const numberOfDays = dateRange?.from && dateRange?.to 
    ? differenceInDays(dateRange.to, dateRange.from)
    : 0;

  const displayDateText = dateRange?.from && dateRange?.to
    ? `${format(dateRange.from, "dd MMMM yyyy", { locale: ar })} - ${format(dateRange.to, "dd MMMM yyyy", { locale: ar })} ${numberOfDays > 0 ? `(${t({ ar: numberOfDays === 1 ? "يوم واحد" : numberOfDays === 2 ? "يومان" : `${numberOfDays} أيام`, en: `${numberOfDays} ${numberOfDays === 1 ? "day" : "days"}` })})` : ''}`
    : t({ ar: "اختر التواريخ", en: "Pick dates" });

  const guestsDisplay = `${rooms} ${t({ ar: rooms === 1 ? "غرفة" : "غرف", en: rooms === 1 ? "Room" : "Rooms" })} - ${adults} ${t({ ar: adults === 1 ? "بالغ" : "بالغين", en: adults === 1 ? "Adult" : "Adults" })}${children > 0 ? ` - ${children} ${t({ ar: children === 1 ? "طفل" : "أطفال", en: children === 1 ? "Child" : "Children" })}` : ""}`;

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="bg-primary/55 backdrop-blur-md text-white shadow-elegant rounded-2xl p-3 md:p-4 animate-scale-in gap-2 border-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Location */}
          <div className="relative">
            <label className="text-sm font-medium text-white/90 mb-1.5 block">
              {t('الوجهة', 'Destination')}
            </label>
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="h-12 bg-white/35 border-white/20 text-white rounded-xl hover:bg-white/55 text-right">
                <SelectValue placeholder={t('اختر المدينة', 'Select City')} className="text-right" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.id} className="text-right">
                    {city.name_ar}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div>
            <label className="text-sm font-medium text-white/90 mb-1.5 block">
              {t('تاريخ الوصول والمغادرة', 'Check-in & Check-out')}
            </label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-12 justify-start text-right font-normal bg-white/35 border-white/20 text-white rounded-xl hover:bg-white/55",
                    !dateRange && "opacity-80"
                  )}
                >
                  <CalendarIcon className="ml-2 h-4 w-4" />
                  {displayDateText}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                <div>
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onDayClick={handleDayClick}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                    locale={ar}
                    className="pointer-events-auto"
                    numberOfMonths={1}
                  />
                  <div className="px-3 pb-3 border-t flex items-center justify-between">
                    <span className="text-sm">
                      {t('عدد الأيام', 'Number of days')}: <strong>{numberOfDays}</strong>
                    </span>
                    <Button 
                      size="default"
                      className="min-w-28 h-10 px-6 text-base rounded-xl"
                      onClick={() => setIsCalendarOpen(false)}
                    >
                      {t('موافق', 'OK')}
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Second Row: Guests and Search Button */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          {/* Rooms and Guests Combined */}
          <div>
            <label className="text-sm font-medium text-white/90 mb-1.5 block">
              {t('الغرف والضيوف', 'Rooms & Guests')}
            </label>
            <Popover open={isGuestsOpen} onOpenChange={setIsGuestsOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-12 justify-start text-right font-normal bg-white/35 border-white/20 text-white rounded-xl hover:bg-white/55"
                >
                  <Users className="ml-2 h-4 w-4" />
                  {guestsDisplay}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4 rounded-xl" align="start">
                <div className="space-y-4">
                  {/* Rooms */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t('الغرف', 'Rooms')}</span>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => setRooms(Math.max(1, rooms - 1))}
                        disabled={rooms <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">{rooms}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => setRooms(rooms + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Adults */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t('البالغين', 'Adults')}</span>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => setAdults(Math.max(1, adults - 1))}
                        disabled={adults <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">{adults}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => setAdults(adults + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Children */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t('الأطفال', 'Children')}</span>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => setChildren(Math.max(0, children - 1))}
                        disabled={children <= 0}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">{children}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => setChildren(children + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <Button 
                    className="w-full rounded-xl"
                    onClick={() => setIsGuestsOpen(false)}
                  >
                    {t('تم', 'Done')}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Search Button */}
          <div className="flex items-end">
            <Button onClick={handleSearch} className="w-full h-12 text-lg text-white rounded-xl font-semibold shadow-lg" style={{ backgroundColor: '#237bff' }}>
              <Search className="ml-2 w-5 h-5" />
              {t('ابحث الآن', 'Search Now')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
