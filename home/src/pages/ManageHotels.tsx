import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { MapPin, Phone, Star, Calendar, Plus, Edit, Search, Upload, X, Image as ImageIcon, Trash2, Wifi, Coffee, Utensils, Users, Hotel as HotelIcon, Bus, MapPinned, Bed, ArrowLeft } from "lucide-react";
import { MealPlansManager } from "@/components/MealPlansManager";
import { ImageGallery } from "@/components/ImageGallery";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { BedIcon } from "@/components/BedIcons";

interface City {
  id: string;
  name_ar: string;
  name_en: string;
}

interface Employee {
  id: string;
  full_name: string;
}

interface Hotel {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  city_id: string;
  city_name_ar?: string;
  city_name_en?: string;
  location: string;
  location_url: string;
  contact_phone: string;
  contact_person: string;
  price_per_night: number;
  rating: number;
  images: any;
  active: boolean;
  created_at: string;
  bookings_count?: number;
  max_guests_per_room: number;
  extra_guest_price: number;
  room_type: 'hotel_rooms' | 'owner_rooms';
  pinned_to_homepage?: boolean;
}

export default function ManageHotels() {
  const { userRole, loading } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [filteredHotels, setFilteredHotels] = useState<Hotel[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [selectedResponsiblePersons, setSelectedResponsiblePersons] = useState<string[]>([]);
  const [highlightColors, setHighlightColors] = useState<{ owner: string; hotel: string | null }>({ owner: '#e0f2fe', hotel: null });
  const [uploadingImages, setUploadingImages] = useState(false);
  const [hotelImages, setHotelImages] = useState<string[]>([]);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name_ar: "",
    name_en: "",
    description_ar: "",
    description_en: "",
    city_id: "",
    location: "",
    location_url: "",
    contact_phone: "",
    contact_person: "",
    price_per_night: "",
    rating: "5",
    active: true,
    max_guests_per_room: "2",
    extra_guest_price: "0",
    total_rooms: "10",
    tax_percentage: "0",
    room_type: "hotel_rooms" as 'hotel_rooms' | 'owner_rooms',
    bed_type_single: "single" as 'single' | 'king',
    bed_type_double: "king" as 'king' | 'twin',
  });
  const [amenities, setAmenities] = useState({
    wifi: true,
    cafe: false,
    restaurant: false,
    parking: false,
    shuttle: false,
    walking_distance: "",
    walking_distance_unit: "m" as 'm' | 'km',
  });
  const [mealPlan, setMealPlan] = useState<{
    regular_ar: string;
    regular_en: string;
    ramadan_ar?: string;
    ramadan_en?: string;
    price: number;
    max_persons: number;
    extra_meal_price: number;
  } | null>(null);

  useEffect(() => {
    if (!loading && userRole !== 'admin') {
      navigate('/');
    } else if (!loading) {
      fetchCities();
      fetchEmployees();
      fetchHotels();
      fetchHighlightColors();
    }
  }, [userRole, loading, navigate]);

  const fetchCities = async () => {
    try {
      const { data, error } = await supabase
        .from('cities')
        .select('id, name_ar, name_en')
        .eq('active', true)
        .order('name_en', { ascending: true });

      if (error) throw error;
      setCities(data || []);
    } catch (error: any) {
      console.error('Error fetching cities:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      // Get all non-customer user IDs from user_roles table
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .neq('role', 'customer');

      if (rolesError) throw rolesError;

      if (userRoles && userRoles.length > 0) {
        const userIds = userRoles.map(r => r.user_id);
        
        // Get profiles for these users
        const { data: userProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);

        if (profilesError) throw profilesError;
        setEmployees(userProfiles || []);
      }
    } catch (error: any) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchHighlightColors = async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('owner_room_color, hotel_room_color')
      .single();
    if (data) {
      setHighlightColors({ 
        owner: data.owner_room_color || '#e0f2fe', 
        hotel: data.hotel_room_color || null 
      });
    }
  };

  const uploadHotelImages = async (files: FileList, hotelId?: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    const hotelFolder = hotelId || `temp-${Date.now()}`;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${hotelFolder}/${Date.now()}-${i}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('hotel-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('hotel-images')
        .getPublicUrl(fileName);

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    try {
      const urls = await uploadHotelImages(files);
      setHotelImages([...hotelImages, ...urls]);
      toast({
        title: t({ ar: "تم الرفع", en: "Uploaded" }),
        description: t({ ar: "تم رفع الصور بنجاح", en: "Images uploaded successfully" }),
      });
    } catch (error: any) {
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setHotelImages(hotelImages.filter((_, i) => i !== index));
  };

  const fetchHotels = async () => {
    try {
      const { data: hotelsData, error } = await supabase
        .from('hotels')
        .select(`
          *,
          cities (
            name_ar,
            name_en
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get booking counts for each hotel
      const hotelsWithCounts = await Promise.all(
        (hotelsData || []).map(async (hotel: any) => {
          const { count } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('hotel_id', hotel.id);
          
          return {
            ...hotel,
            city_name_ar: hotel.cities?.name_ar,
            city_name_en: hotel.cities?.name_en,
            bookings_count: count || 0
          };
        })
      );

      setHotels(hotelsWithCounts);
      setFilteredHotels(hotelsWithCounts);
    } catch (error: any) {
      toast({
        title: t({ ar: "خطأ", en: "Error", fr: "Erreur", es: "Error", ru: "Ошибка", id: "Kesalahan", ms: "Ralat" }),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const toggleHotelStatus = async (hotelId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('hotels')
        .update({ active: !currentStatus })
        .eq('id', hotelId);

      if (error) throw error;

      // Update local state instead of refetching
      const updatedHotels = hotels.map(h => 
        h.id === hotelId ? { ...h, active: !currentStatus } : h
      );
      setHotels(updatedHotels);
      setFilteredHotels(updatedHotels.filter(h => 
        searchQuery === "" || 
        h.name_ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.contact_person?.toLowerCase().includes(searchQuery.toLowerCase())
      ));

      toast({
        title: t({ ar: "تم التحديث", en: "Updated", fr: "Mis à jour", es: "Actualizado", ru: "Обновлено", id: "Diperbarui", ms: "Dikemas kini" }),
        description: t({ ar: "تم تحديث حالة الفندق", en: "Hotel status updated", fr: "Statut de l'hôtel mis à jour", es: "Estado del hotel actualizado", ru: "Статус отеля обновлен", id: "Status hotel diperbarui", ms: "Status hotel dikemas kini" }),
      });
    } catch (error: any) {
      toast({
        title: t({ ar: "خطأ", en: "Error", fr: "Erreur", es: "Error", ru: "Ошибка", id: "Kesalahan", ms: "Ralat" }),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const togglePinToHomepage = async (hotelId: string, currentPinned: boolean) => {
    try {
      const { error } = await supabase
        .from('hotels')
        .update({ pinned_to_homepage: !currentPinned })
        .eq('id', hotelId);

      if (error) throw error;

      const updatedHotels = hotels.map(h => 
        h.id === hotelId ? { ...h, pinned_to_homepage: !currentPinned } : h
      );
      setHotels(updatedHotels);
      setFilteredHotels(updatedHotels.filter(h => 
        searchQuery === "" || 
        h.name_ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.contact_person?.toLowerCase().includes(searchQuery.toLowerCase())
      ));

      toast({
        title: t({ ar: "تم التحديث", en: "Updated" }),
        description: !currentPinned 
          ? t({ ar: "تم تثبيت الفندق في الصفحة الرئيسية", en: "Hotel pinned to homepage" })
          : t({ ar: "تم إلغاء التثبيت", en: "Hotel unpinned from homepage" }),
      });
    } catch (error: any) {
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteHotel = async (hotelId: string) => {
    if (!confirm(t({ ar: "هل أنت متأكد من حذف هذا الفندق؟ سيتم حذف جميع البيانات المرتبطة به.", en: "Are you sure you want to delete this hotel? All associated data will be deleted." }))) {
      return;
    }

    try {
      const { error } = await supabase
        .from('hotels')
        .delete()
        .eq('id', hotelId);

      if (error) throw error;

      toast({
        title: t({ ar: "تم الحذف", en: "Deleted" }),
        description: t({ ar: "تم حذف الفندق بنجاح", en: "Hotel deleted successfully" }),
      });

      fetchHotels();
    } catch (error: any) {
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddHotel = async () => {
    try {
      if (!formData.city_id) {
        toast({
          title: t({ ar: "خطأ", en: "Error", fr: "Erreur", es: "Error", ru: "Ошибка", id: "Kesalahan", ms: "Ralat" }),
          description: t({ ar: "يرجى اختيار المدينة", en: "Please select a city", fr: "Veuillez sélectionner une ville", es: "Por favor seleccione una ciudad", ru: "Пожалуйста, выберите город", id: "Silakan pilih kota", ms: "Sila pilih bandar" }),
          variant: "destructive",
        });
        return;
      }

      const { bed_type_single, ...formPayloadBase } = formData;

      const { data: hotelData, error } = await supabase
        .from('hotels')
        .insert([{ 
          ...formPayloadBase,
          price_per_night: parseFloat(formData.price_per_night),
          rating: parseFloat(formData.rating),
          city_id: formData.city_id,
          max_guests_per_room: parseInt(formData.max_guests_per_room),
          extra_guest_price: parseFloat(formData.extra_guest_price),
          total_rooms: parseInt(formData.total_rooms),
          tax_percentage: parseFloat(formData.tax_percentage),
          room_type: formData.room_type,
          bed_type_double: formData.max_guests_per_room === "2" ? formData.bed_type_double : null,
          images: hotelImages,
          meal_plans: mealPlan,
          amenities: {
            ...amenities,
            walking_distance: amenities.walking_distance ? parseFloat(amenities.walking_distance) : null,
          },
        }])
        .select()
        .single();

      if (error) throw error;

      // Add responsible persons
      if (selectedResponsiblePersons.length > 0 && hotelData) {
        const responsiblePersonsData = selectedResponsiblePersons.map(personId => ({
          hotel_id: hotelData.id,
          employee_id: personId
        }));
        
        await supabase
          .from('hotel_responsible_persons')
          .insert(responsiblePersonsData);
      }

      toast({
        title: t({ ar: "تم الإضافة", en: "Added", fr: "Ajouté", es: "Agregado", ru: "Добавлено", id: "Ditambahkan", ms: "Ditambah" }),
        description: t({ ar: "تم إضافة الفندق بنجاح", en: "Hotel added successfully", fr: "Hôtel ajouté avec succès", es: "Hotel agregado con éxito", ru: "Отель успешно добавлен", id: "Hotel berhasil ditambahkan", ms: "Hotel berjaya ditambah" }),
      });

      setIsAddDialogOpen(false);
      setSelectedResponsiblePersons([]);
      setHotelImages([]);
      setMealPlan(null);
      resetForm();
      fetchHotels();
    } catch (error: any) {
      toast({
        title: t({ ar: "خطأ", en: "Error", fr: "Erreur", es: "Error", ru: "Ошибка", id: "Kesalahan", ms: "Ralat" }),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditHotel = async () => {
    if (!editingHotel) return;

    try {
      const { bed_type_single, ...formPayloadBase } = formData;
      const { error } = await supabase
        .from('hotels')
        .update({
          ...formPayloadBase,
          price_per_night: parseFloat(formData.price_per_night),
          rating: parseFloat(formData.rating),
          max_guests_per_room: parseInt(formData.max_guests_per_room),
          extra_guest_price: parseFloat(formData.extra_guest_price),
          total_rooms: parseInt(formData.total_rooms),
          tax_percentage: parseFloat(formData.tax_percentage),
          room_type: formData.room_type,
          bed_type_double: formData.max_guests_per_room === "2" ? formData.bed_type_double : null,
          images: hotelImages,
          meal_plans: mealPlan,
          amenities: {
            ...amenities,
            walking_distance: amenities.walking_distance ? parseFloat(amenities.walking_distance) : null,
          },
        })
        .eq('id', editingHotel.id);

      if (error) throw error;

      // Update responsible persons
      // First delete existing ones
      await supabase
        .from('hotel_responsible_persons')
        .delete()
        .eq('hotel_id', editingHotel.id);

      // Then add new ones
      if (selectedResponsiblePersons.length > 0) {
        const responsiblePersonsData = selectedResponsiblePersons.map(personId => ({
          hotel_id: editingHotel.id,
          employee_id: personId
        }));
        
        await supabase
          .from('hotel_responsible_persons')
          .insert(responsiblePersonsData);
      }

      toast({
        title: t({ ar: "تم التحديث", en: "Updated", fr: "Mis à jour", es: "Actualizado", ru: "Обновлено", id: "Diperbarui", ms: "Dikemas kini" }),
        description: t({ ar: "تم تحديث معلومات الفندق", en: "Hotel information updated", fr: "Informations de l'hôtel mises à jour", es: "Información del hotel actualizada", ru: "Информация об отеле обновлена", id: "Informasi hotel diperbarui", ms: "Maklumat hotel dikemas kini" }),
      });

      setIsEditDialogOpen(false);
      setEditingHotel(null);
      setSelectedResponsiblePersons([]);
      setHotelImages([]);
      setMealPlan(null);
      resetForm();
      fetchHotels();
    } catch (error: any) {
      toast({
        title: t({ ar: "خطأ", en: "Error", fr: "Erreur", es: "Error", ru: "Ошибка", id: "Kesalahan", ms: "Ralat" }),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openEditDialog = async (hotel: Hotel) => {
    setEditingHotel(hotel);
    setFormData({
      name_ar: hotel.name_ar,
      name_en: hotel.name_en,
      description_ar: hotel.description_ar || "",
      description_en: hotel.description_en || "",
      city_id: hotel.city_id || "",
      location: hotel.location || "",
      location_url: hotel.location_url || "",
      contact_phone: hotel.contact_phone || "",
      contact_person: hotel.contact_person || "",
      price_per_night: hotel.price_per_night.toString(),
      rating: hotel.rating.toString(),
      active: hotel.active,
      max_guests_per_room: hotel.max_guests_per_room.toString(),
      extra_guest_price: hotel.extra_guest_price.toString(),
      total_rooms: (hotel as any).total_rooms?.toString() || "0",
      tax_percentage: (hotel as any).tax_percentage?.toString() || "0",
      room_type: hotel.room_type || 'hotel_rooms',
      bed_type_single: 'single',
      bed_type_double: (hotel as any).bed_type_double === 'twin' ? 'twin' : 'king',
    });

    // Set existing images
    if (hotel.images && Array.isArray(hotel.images)) {
      setHotelImages(hotel.images);
    } else {
      setHotelImages([]);
    }

    // Set existing meal plans
    if ((hotel as any).meal_plans) {
      setMealPlan((hotel as any).meal_plans);
    } else {
      setMealPlan(null);
    }

    // Set existing amenities
    if ((hotel as any).amenities) {
      const hotelAmenities = (hotel as any).amenities;
      setAmenities({
        wifi: hotelAmenities.wifi ?? true,
        cafe: hotelAmenities.cafe ?? false,
        restaurant: hotelAmenities.restaurant ?? false,
        parking: hotelAmenities.parking ?? false,
        shuttle: hotelAmenities.shuttle ?? false,
        walking_distance: hotelAmenities.walking_distance?.toString() || "",
        walking_distance_unit: hotelAmenities.walking_distance_unit || "m",
      });
    } else {
      setAmenities({
        wifi: true,
        cafe: false,
        restaurant: false,
        parking: false,
        shuttle: false,
        walking_distance: "",
        walking_distance_unit: "m",
      });
    }

    // Fetch existing responsible persons
    const { data: responsiblePersons } = await supabase
      .from('hotel_responsible_persons')
      .select('employee_id')
      .eq('hotel_id', hotel.id);

    if (responsiblePersons) {
      setSelectedResponsiblePersons(responsiblePersons.map(rp => rp.employee_id));
    }

    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name_ar: "",
      name_en: "",
      description_ar: "",
      description_en: "",
      city_id: "",
      location: "",
      location_url: "",
      contact_phone: "",
      contact_person: "",
      price_per_night: "",
      rating: "5",
      active: true,
      max_guests_per_room: "2",
      extra_guest_price: "0",
      total_rooms: "0",
      tax_percentage: "0",
      room_type: "hotel_rooms" as 'hotel_rooms' | 'owner_rooms',
      bed_type_single: "single" as 'single' | 'king',
      bed_type_double: "king" as 'king' | 'twin',
    });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === "") {
      setFilteredHotels(hotels);
    } else {
      const filtered = hotels.filter((hotel) => {
        const searchLower = query.toLowerCase();
        return (
          hotel.name_ar.toLowerCase().includes(searchLower) ||
          hotel.name_en.toLowerCase().includes(searchLower) ||
          hotel.location.toLowerCase().includes(searchLower) ||
          hotel.contact_person?.toLowerCase().includes(searchLower)
        );
      });
      setFilteredHotels(filtered);
    }
  };

  if (loading || loadingData) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle p-4 pt-28">
      <div className="container mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t({ ar: "العودة", en: "Back", fr: "Retour", es: "Volver", ru: "Назад", id: "Kembali", ms: "Kembali" })}
            </Button>
            <h1 className="text-3xl font-bold text-gradient-luxury">{t({ ar: "إدارة الفنادق", en: "Manage Hotels", fr: "Gérer les hôtels", es: "Gestionar hoteles", ru: "Управление отелями", id: "Kelola Hotel", ms: "Urus Hotel" })}</h1>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t({ ar: "ابحث عن فندق...", en: "Search for a hotel...", fr: "Rechercher un hôtel...", es: "Buscar un hotel...", ru: "Искать отель...", id: "Cari hotel...", ms: "Cari hotel..." })}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pr-10 h-12"
              />
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)} className="h-12 whitespace-nowrap">
              <Plus className="w-5 h-5 ml-2" />
              {t({ ar: "إضافة فندق", en: "Add Hotel", fr: "Ajouter un hôtel", es: "Agregar hotel", ru: "Добавить отель", id: "Tambah Hotel", ms: "Tambah Hotel" })}
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          {filteredHotels.map((hotel) => (
            <Card 
              key={hotel.id}
              className="card-luxury"
              style={(hotel.room_type === 'owner_rooms' ? (highlightColors.owner ? { backgroundColor: highlightColors.owner } : undefined) : (highlightColors.hotel ? { backgroundColor: highlightColors.hotel } : undefined))}
            >
              <CardHeader>
                <CardTitle className="flex flex-col gap-4">
                  <span>{language === 'ar' ? hotel.name_ar : hotel.name_en}</span>
                  
                  {/* Mobile/Tablet Layout */}
                  <div className="flex flex-col gap-2 lg:hidden">
                    {/* Row 1: Status Badge, Activate/Deactivate, Pin and Delete Buttons */}
                    <div className="flex items-center gap-2">
                      <Badge 
                        style={{ 
                          backgroundColor: hotel.active ? '#40f086' : '#000000',
                          color: 'white'
                        }}
                      >
                        {hotel.active ? t({ ar: "نشط", en: "Active" }) : t({ ar: "غير نشط", en: "Inactive" })}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleHotelStatus(hotel.id, hotel.active)}
                      >
                        {hotel.active ? t({ ar: "إيقاف", en: "Deactivate" }) : t({ ar: "تفعيل", en: "Activate" })}
                      </Button>
                      <Button
                        variant={hotel.pinned_to_homepage ? "default" : "outline"}
                        size="sm"
                        onClick={() => togglePinToHomepage(hotel.id, hotel.pinned_to_homepage || false)}
                      >
                        {hotel.pinned_to_homepage ? "📌" : "📍"}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteHotel(hotel.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {/* Row 2: Pricing and Edit Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/seasonal-pricing?hotelId=${hotel.id}`)}
                        className="flex-1 gap-1"
                        style={{ backgroundColor: '#38b6ff', color: 'white', borderColor: '#38b6ff' }}
                      >
                        <Calendar className="w-4 h-4" />
                        {t({ ar: "تخصيص الأسعار", en: "Pricing" })}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(hotel)}
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 ml-1" />
                        {t({ ar: "تعديل", en: "Edit" })}
                      </Button>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden lg:flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <Badge 
                        style={{ 
                          backgroundColor: hotel.active ? '#40f086' : '#000000',
                          color: 'white'
                        }}
                      >
                        {hotel.active ? t({ ar: "نشط", en: "Active" }) : t({ ar: "غير نشط", en: "Inactive" })}
                      </Badge>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/seasonal-pricing?hotelId=${hotel.id}`)}
                          className="gap-1"
                          style={{ backgroundColor: '#38b6ff', color: 'white', borderColor: '#38b6ff' }}
                        >
                          <Calendar className="w-4 h-4" />
                          {t({ ar: "تخصيص الأسعار", en: "Pricing" })}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(hotel)}
                        >
                          <Edit className="w-4 h-4 ml-1" />
                          {t({ ar: "تعديل", en: "Edit" })}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleHotelStatus(hotel.id, hotel.active)}
                        >
                          {hotel.active ? t({ ar: "إيقاف", en: "Deactivate" }) : t({ ar: "تفعيل", en: "Activate" })}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteHotel(hotel.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={hotel.pinned_to_homepage ? "default" : "outline"}
                          size="sm"
                          onClick={() => togglePinToHomepage(hotel.id, hotel.pinned_to_homepage || false)}
                        >
                          {hotel.pinned_to_homepage ? "📌" : "📍"}
                          {hotel.pinned_to_homepage 
                            ? t({ ar: "مثبت", en: "Pinned" }) 
                            : t({ ar: "تثبيت", en: "Pin" })}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">{t({ ar: "معلومات الفندق", en: "Hotel Information", fr: "Informations sur l'hôtel", es: "Información del hotel", ru: "Информация об отеле", id: "Informasi Hotel", ms: "Maklumat Hotel" })}</h3>
                      <p className="text-sm text-muted-foreground">{language === 'ar' ? hotel.description_ar : hotel.description_en}</p>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>{language === 'ar' ? hotel.city_name_ar : hotel.city_name_en}</span>
                      {hotel.location_url && (
                        <a 
                          href={hotel.location_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          ({t({ ar: "عرض", en: "View", fr: "Voir", es: "Ver", ru: "Просмотр", id: "Lihat", ms: "Lihat" })})
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span>{hotel.rating} / 5</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <span className="text-primary">{hotel.price_per_night} {t({ ar: "ر.س", en: "SAR", fr: "SAR", es: "SAR", ru: "САР", id: "SAR", ms: "SAR" })}</span>
                      <span className="text-muted-foreground">/ {t({ ar: "ليلة", en: "night", fr: "nuit", es: "noche", ru: "ночь", id: "malam", ms: "malam" })}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">{t({ ar: "معلومات التواصل", en: "Contact Information", fr: "Informations de contact", es: "Información de contacto", ru: "Контактная информация", id: "Informasi Kontak", ms: "Maklumat Hubungan" })}</h3>
                      {hotel.contact_person && (
                        <p className="text-sm mb-2">
                          <span className="font-medium">{t({ ar: "الشخص المسؤول:", en: "Contact Person:", fr: "Personne de contact:", es: "Persona de contacto:", ru: "Контактное лицо:", id: "Orang yang Dapat Dihubungi:", ms: "Orang yang Boleh Dihubungi:" })}</span> {hotel.contact_person}
                        </p>
                      )}
                      {hotel.contact_phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-primary" />
                          <a href={`tel:${hotel.contact_phone}`} className="hover:text-primary">
                            {hotel.contact_phone}
                          </a>
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">{t({ ar: "الإحصائيات", en: "Statistics", fr: "Statistiques", es: "Estadísticas", ru: "Статистика", id: "Statistik", ms: "Statistik" })}</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-primary" />
                          <span>
                            {t({ ar: "عدد الحجوزات:", en: "Total Bookings:", fr: "Réservations totales:", es: "Reservas totales:", ru: "Всего бронирований:", id: "Total Pemesanan:", ms: "Jumlah Tempahan:" })} <strong>{hotel.bookings_count}</strong>
                          </span>
                        </div>
                        <p className="text-muted-foreground">
                          {t({ ar: "تاريخ الإضافة:", en: "Added on:", fr: "Ajouté le:", es: "Agregado el:", ru: "Добавлено:", id: "Ditambahkan pada:", ms: "Ditambah pada:" })} {new Date(hotel.created_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                        </p>
                      </div>
                    </div>

                    {hotel.images && hotel.images.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">{t({ ar: "الصور", en: "Images", fr: "Images", es: "Imágenes", ru: "Изображения", id: "Gambar", ms: "Imej" })}</h3>
                        <div className="flex gap-2 flex-wrap">
                          {hotel.images.slice(0, 3).map((img: string, idx: number) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setGalleryImages(hotel.images || []);
                                setGalleryOpen(true);
                              }}
                              className="relative group"
                            >
                              <img 
                                src={img} 
                                alt={`${hotel.name_en} ${idx + 1}`}
                                className="w-20 h-20 object-cover rounded-lg hover:opacity-80 transition-opacity cursor-pointer"
                              />
                            </button>
                          ))}
                          {hotel.images.length > 3 && (
                            <button
                              onClick={() => {
                                setGalleryImages(hotel.images || []);
                                setGalleryOpen(true);
                              }}
                              className="w-20 h-20 bg-secondary rounded-lg flex items-center justify-center text-sm hover:bg-secondary/80 transition-colors cursor-pointer"
                            >
                              <ImageIcon className="w-6 h-6 mb-1" />
                              <span>+{hotel.images.length - 3}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredHotels.length === 0 && hotels.length > 0 && (
            <Card className="card-luxury">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  {t({ ar: "لا توجد نتائج للبحث", en: "No search results", fr: "Aucun résultat de recherche", es: "No hay resultados de búsqueda", ru: "Нет результатов поиска", id: "Tidak ada hasil pencarian", ms: "Tiada hasil carian" })}
                </p>
              </CardContent>
            </Card>
          )}

          {hotels.length === 0 && (
            <Card className="card-luxury">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  {t({ ar: "لا توجد فنادق مسجلة حالياً", en: "No hotels registered yet", fr: "Aucun hôtel enregistré pour le moment", es: "No hay hoteles registrados aún", ru: "Пока нет зарегистрированных отелей", id: "Belum ada hotel yang terdaftar", ms: "Tiada hotel yang didaftarkan lagi" })}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <ImageGallery
          images={galleryImages}
          open={galleryOpen}
          onClose={() => setGalleryOpen(false)}
        />

        {/* Add Hotel Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t({ ar: "إضافة فندق جديد", en: "Add New Hotel", fr: "Ajouter un nouvel hôtel", es: "Agregar nuevo hotel", ru: "Добавить новый отель", id: "Tambah Hotel Baru", ms: "Tambah Hotel Baharu" })}</DialogTitle>
              <DialogDescription>
                {t({ ar: "أدخل معلومات الفندق الجديد", en: "Enter the new hotel information", fr: "Entrez les informations du nouvel hôtel", es: "Ingrese la información del nuevo hotel", ru: "Введите информацию о новом отеле", id: "Masukkan informasi hotel baru", ms: "Masukkan maklumat hotel baharu" })}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t({ ar: "الاسم بالعربية", en: "Name (Arabic)", fr: "Nom (arabe)", es: "Nombre (árabe)", ru: "Название (арабский)", id: "Nama (Arab)", ms: "Nama (Arab)" })}</Label>
                  <Input value={formData.name_ar} onChange={(e) => setFormData({...formData, name_ar: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>{t({ ar: "الاسم بالإنجليزية", en: "Name (English)", fr: "Nom (anglais)", es: "Nombre (inglés)", ru: "Название (английский)", id: "Nama (Inggris)", ms: "Nama (Inggeris)" })}</Label>
                  <Input value={formData.name_en} onChange={(e) => setFormData({...formData, name_en: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t({ ar: "الوصف بالعربية", en: "Description (Arabic)", fr: "Description (arabe)", es: "Descripción (árabe)", ru: "Описание (арабский)", id: "Deskripsi (Arab)", ms: "Penerangan (Arab)" })}</Label>
                <Textarea value={formData.description_ar} onChange={(e) => setFormData({...formData, description_ar: e.target.value})} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>{t({ ar: "الوصف بالإنجليزية", en: "Description (English)", fr: "Description (anglais)", es: "Descripción (inglés)", ru: "Описание (английский)", id: "Deskripsi (Inggris)", ms: "Penerangan (Inggeris)" })}</Label>
                <Textarea value={formData.description_en} onChange={(e) => setFormData({...formData, description_en: e.target.value})} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t({ ar: "المدينة", en: "City", fr: "Ville", es: "Ciudad", ru: "Город", id: "Kota", ms: "Bandar" })}</Label>
                  <Select value={formData.city_id} onValueChange={(value) => setFormData({...formData, city_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder={t({ ar: "اختر المدينة", en: "Select city", fr: "Sélectionner la ville", es: "Seleccionar ciudad", ru: "Выбрать город", id: "Pilih kota", ms: "Pilih bandar" })} />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map(city => (
                        <SelectItem key={city.id} value={city.id}>
                          {language === 'ar' ? city.name_ar : city.name_en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t({ ar: "الموقع التفصيلي", en: "Detailed Location", fr: "Emplacement détaillé", es: "Ubicación detallada", ru: "Подробное местоположение", id: "Lokasi Detail", ms: "Lokasi Terperinci" })}</Label>
                  <Input value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder={t({ ar: "مثال: حي النسيم", en: "Example: Al Naseem District", fr: "Exemple: Quartier Al Naseem", es: "Ejemplo: Distrito Al Naseem", ru: "Пример: Район Аль-Насим", id: "Contoh: Distrik Al Naseem", ms: "Contoh: Daerah Al Naseem" })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t({ ar: "رابط الموقع", en: "Location URL", fr: "URL de l'emplacement", es: "URL de ubicación", ru: "URL местоположения", id: "URL Lokasi", ms: "URL Lokasi" })}</Label>
                <Input value={formData.location_url} onChange={(e) => setFormData({...formData, location_url: e.target.value})} placeholder="https://maps.google.com/..." />
              </div>
              <div className="space-y-2">
                <Label>{t({ ar: "رقم الهاتف", en: "Phone", fr: "Téléphone", es: "Teléfono", ru: "Телефон", id: "Telepon", ms: "Telefon" })}</Label>
                <Input value={formData.contact_phone} onChange={(e) => setFormData({...formData, contact_phone: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t({ ar: "السعر لليلة", en: "Price per Night" })}</Label>
                  <Input type="number" value={formData.price_per_night} onChange={(e) => setFormData({...formData, price_per_night: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>{t({ ar: "التقييم", en: "Rating" })}</Label>
                  <Input type="number" min="0" max="5" step="0.1" value={formData.rating} onChange={(e) => setFormData({...formData, rating: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{t({ ar: "عدد الغرف المتاحة", en: "Total Rooms" })}</Label>
                  <Input type="number" min="0" value={formData.total_rooms || "0"} onChange={(e) => setFormData({...formData, total_rooms: e.target.value})} placeholder="0" />
                  <p className="text-xs text-muted-foreground">{t({ ar: "إذا كان 0 فلا توجد غرف متاحة", en: "If 0, no rooms available" })}</p>
                </div>
                <div className="space-y-2">
                  <Label>{t({ ar: "نسبة الضريبة %", en: "Tax %" })}</Label>
                  <Input type="number" min="0" max="100" step="0.1" value={formData.tax_percentage || "0"} onChange={(e) => setFormData({...formData, tax_percentage: e.target.value})} placeholder="0" />
                  <p className="text-xs text-muted-foreground">{t({ ar: "إذا كان 0 فلا توجد ضريبة", en: "If 0, no tax" })}</p>
                </div>
              </div>
              
              {/* Bed Type Selection */}
              <div className="space-y-2">
                <Label>{t({ ar: "عدد الأشخاص الأساسيين", en: "Base Guests" })}</Label>
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <Select value={formData.max_guests_per_room} onValueChange={(value) => setFormData({...formData, max_guests_per_room: value})}>
                      <SelectTrigger className="w-[120px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6].map(num => (
                          <SelectItem key={num} value={num.toString()}>
                            {language === 'ar' ? (num === 1 ? '1 شخص واحد' : num === 2 ? 'شخصين' : num >= 3 && num <= 10 ? `${num} أشخاص` : `${num} شخص`) : `${num} ${t({ ar: 'أشخاص', en: 'persons' })}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Single Guest - Single Bed or King Bed */}
                  {formData.max_guests_per_room === "1" && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, bed_type_single: 'single'})}
                        className={`p-1.5 border-2 rounded transition-all ${
                          formData.bed_type_single === 'single' 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        title={t({ ar: "سرير مفرد", en: "Single Bed" })}
                      >
                        <BedIcon type="single" className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, bed_type_single: 'king'})}
                        className={`p-1.5 border-2 rounded transition-all ${
                          formData.bed_type_single === 'king' 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        title={t({ ar: "سرير كينج كبير", en: "King Size Bed" })}
                      >
                        <BedIcon type="king" className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                  
                  {/* Two Guests - Twin Beds or King Bed or Double Bed */}
                  {formData.max_guests_per_room === "2" && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, bed_type_double: 'twin'})}
                        className={`p-1.5 border-2 rounded transition-all ${
                          formData.bed_type_double === 'twin' 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        title={t({ ar: "سريرين مفردين", en: "Twin Beds" })}
                      >
                        <BedIcon type="twin" className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, bed_type_double: 'king'})}
                        className={`p-1.5 border-2 rounded transition-all ${
                          formData.bed_type_double === 'king' 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        title={t({ ar: "سرير كينج كبير", en: "King Size Bed" })}
                      >
                        <BedIcon type="king" className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>{t({ ar: "سعر الشخص الإضافي لكل ليلة", en: "Extra Guest Price per Night" })}</Label>
                <Input type="number" min="0" value={formData.extra_guest_price} onChange={(e) => setFormData({...formData, extra_guest_price: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t({ ar: "نوع الغرف", en: "Room Type" })}</Label>
                  <Select value={formData.room_type} onValueChange={(value: 'hotel_rooms' | 'owner_rooms') => setFormData({...formData, room_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hotel_rooms">{t({ ar: "غرف فندقية", en: "Hotel Rooms" })}</SelectItem>
                      <SelectItem value="owner_rooms">{t({ ar: "غرف مُلّاك", en: "Owner Rooms" })}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
               </div>
              
              <div className="space-y-2">
                <Label>{t({ ar: "صور الفندق", en: "Hotel Images" })}</Label>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('hotel-image-upload')?.click()}
                      disabled={uploadingImages}
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 ml-2" />
                      {uploadingImages ? t({ ar: "جاري الرفع...", en: "Uploading..." }) : t({ ar: "رفع صور", en: "Upload Images" })}
                    </Button>
                    <input
                      id="hotel-image-upload"
                      type="file"
                      multiple
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                  {hotelImages.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {hotelImages.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={img}
                            alt={`صورة ${idx + 1}`}
                            className="w-full h-20 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {t({ ar: "يمكنك رفع عدد غير محدود من الصور بحجم أقصى 10 ميجابايت لكل صورة", en: "You can upload unlimited images with max 10MB per image" })}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t({ ar: "المسؤولون عن الفندق", en: "Hotel Managers" })}</Label>
                  <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                    {employees.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {t({ ar: "لا يوجد موظفون متاحون", en: "No employees available" })}
                      </p>
                    ) : (
                      employees.map(emp => (
                        <div key={emp.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`emp-${emp.id}`}
                            checked={selectedResponsiblePersons.includes(emp.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedResponsiblePersons([...selectedResponsiblePersons, emp.id]);
                              } else {
                                setSelectedResponsiblePersons(selectedResponsiblePersons.filter(id => id !== emp.id));
                              }
                            }}
                            className="rounded border-border"
                          />
                          <label htmlFor={`emp-${emp.id}`} className="text-sm cursor-pointer">
                            {emp.full_name || emp.id}
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t({ ar: "سيتم إرسال الطلبات إلى لوحة التحكم الخاصة بالموظفين المحددين", en: "Requests will be sent to selected employees' dashboards" })}
                  </p>
                </div>
              
              {/* Amenities Section */}
              <div className="space-y-4 pt-4 border-t">
                <Label className="text-base font-semibold">{t({ ar: "المرافق والخدمات", en: "Amenities & Services" })}</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="wifi"
                      checked={amenities.wifi}
                      onChange={(e) => setAmenities({ ...amenities, wifi: e.target.checked })}
                      className="w-4 h-4 rounded border-border"
                    />
                    <Label htmlFor="wifi" className="cursor-pointer flex items-center gap-2">
                      <Wifi className="w-4 h-4" />
                      {t({ ar: "واي فاي", en: "WiFi" })}
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="cafe"
                      checked={amenities.cafe}
                      onChange={(e) => setAmenities({ ...amenities, cafe: e.target.checked })}
                      className="w-4 h-4 rounded border-border"
                    />
                    <Label htmlFor="cafe" className="cursor-pointer flex items-center gap-2">
                      <Coffee className="w-4 h-4" />
                      {t({ ar: "مقهى", en: "Cafe" })}
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="restaurant"
                      checked={amenities.restaurant}
                      onChange={(e) => setAmenities({ ...amenities, restaurant: e.target.checked })}
                      className="w-4 h-4 rounded border-border"
                    />
                    <Label htmlFor="restaurant" className="cursor-pointer flex items-center gap-2">
                      <Utensils className="w-4 h-4" />
                      {t({ ar: "مطعم", en: "Restaurant" })}
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="parking"
                      checked={amenities.parking}
                      onChange={(e) => setAmenities({ ...amenities, parking: e.target.checked })}
                      className="w-4 h-4 rounded border-border"
                    />
                    <Label htmlFor="parking" className="cursor-pointer flex items-center gap-2">
                      <HotelIcon className="w-4 h-4" />
                      {t({ ar: "مواقف سيارات", en: "Parking" })}
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="shuttle"
                      checked={amenities.shuttle}
                      onChange={(e) => setAmenities({ ...amenities, shuttle: e.target.checked })}
                      className="w-4 h-4 rounded border-border"
                    />
                    <Label htmlFor="shuttle" className="cursor-pointer flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {t({ ar: "مواصلات", en: "Shuttle" })}
                    </Label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t({ ar: "المسافة إلى المنطقة المركزية", en: "Walking Distance to Center" })}</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder={t({ ar: "المسافة", en: "Distance" })}
                      value={amenities.walking_distance}
                      onChange={(e) => setAmenities({ ...amenities, walking_distance: e.target.value })}
                      className="flex-1"
                    />
                    <Select
                      value={amenities.walking_distance_unit}
                      onValueChange={(value: 'm' | 'km') => setAmenities({ ...amenities, walking_distance_unit: value })}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="m">{t({ ar: "متر", en: "m" })}</SelectItem>
                        <SelectItem value="km">{t({ ar: "كم", en: "km" })}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Meal Plans Section */}
              <div className="pt-4 border-t">
                <MealPlansManager 
                  mealPlan={mealPlan}
                  onChange={setMealPlan}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }}>
                {t({ ar: "إلغاء", en: "Cancel", fr: "Annuler", es: "Cancelar", ru: "Отмена", id: "Batal", ms: "Batal" })}
              </Button>
              <Button onClick={handleAddHotel}>
                {t({ ar: "إضافة", en: "Add", fr: "Ajouter", es: "Agregar", ru: "Добавить", id: "Tambah", ms: "Tambah" })}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Hotel Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t({ ar: "تعديل معلومات الفندق", en: "Edit Hotel Information", fr: "Modifier les informations de l'hôtel", es: "Editar información del hotel", ru: "Редактировать информацию об отеле", id: "Edit Informasi Hotel", ms: "Edit Maklumat Hotel" })}</DialogTitle>
              <DialogDescription>
                {t({ ar: "عدل معلومات الفندق", en: "Modify the hotel information", fr: "Modifiez les informations de l'hôtel", es: "Modifique la información del hotel", ru: "Измените информацию об отеле", id: "Ubah informasi hotel", ms: "Ubah maklumat hotel" })}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t({ ar: "الاسم بالعربية", en: "Name (Arabic)", fr: "Nom (arabe)", es: "Nombre (árabe)", ru: "Название (арабский)", id: "Nama (Arab)", ms: "Nama (Arab)" })}</Label>
                  <Input value={formData.name_ar} onChange={(e) => setFormData({...formData, name_ar: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>{t({ ar: "الاسم بالإنجليزية", en: "Name (English)", fr: "Nom (anglais)", es: "Nombre (inglés)", ru: "Название (английский)", id: "Nama (Inggris)", ms: "Nama (Inggeris)" })}</Label>
                  <Input value={formData.name_en} onChange={(e) => setFormData({...formData, name_en: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t({ ar: "الوصف بالعربية", en: "Description (Arabic)", fr: "Description (arabe)", es: "Descripción (árabe)", ru: "Описание (арабский)", id: "Deskripsi (Arab)", ms: "Penerangan (Arab)" })}</Label>
                <Textarea value={formData.description_ar} onChange={(e) => setFormData({...formData, description_ar: e.target.value})} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>{t({ ar: "الوصف بالإنجليزية", en: "Description (English)", fr: "Description (anglais)", es: "Descripción (inglés)", ru: "Описание (английский)", id: "Deskripsi (Inggris)", ms: "Penerangan (Inggeris)" })}</Label>
                <Textarea value={formData.description_en} onChange={(e) => setFormData({...formData, description_en: e.target.value})} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t({ ar: "المدينة", en: "City", fr: "Ville", es: "Ciudad", ru: "Город", id: "Kota", ms: "Bandar" })}</Label>
                  <Select value={formData.city_id} onValueChange={(value) => setFormData({...formData, city_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder={t({ ar: "اختر المدينة", en: "Select city", fr: "Sélectionner la ville", es: "Seleccionar ciudad", ru: "Выбрать город", id: "Pilih kota", ms: "Pilih bandar" })} />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map(city => (
                        <SelectItem key={city.id} value={city.id}>
                          {language === 'ar' ? city.name_ar : city.name_en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t({ ar: "الموقع التفصيلي", en: "Detailed Location", fr: "Emplacement détaillé", es: "Ubicación detallada", ru: "Подробное местоположение", id: "Lokasi Detail", ms: "Lokasi Terperinci" })}</Label>
                  <Input value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder={t({ ar: "مثال: حي النسيم", en: "Example: Al Naseem District", fr: "Exemple: Quartier Al Naseem", es: "Ejemplo: Distrito Al Naseem", ru: "Пример: Район Аль-Насим", id: "Contoh: Distrik Al Naseem", ms: "Contoh: Daerah Al Naseem" })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t({ ar: "رابط الموقع", en: "Location URL", fr: "URL de l'emplacement", es: "URL de ubicación", ru: "URL местоположения", id: "URL Lokasi", ms: "URL Lokasi" })}</Label>
                <Input value={formData.location_url} onChange={(e) => setFormData({...formData, location_url: e.target.value})} placeholder="https://maps.google.com/..." />
              </div>
              <div className="space-y-2">
                <Label>{t({ ar: "رقم الهاتف", en: "Phone", fr: "Téléphone", es: "Teléfono", ru: "Телефон", id: "Telepon", ms: "Telefon" })}</Label>
                <Input value={formData.contact_phone} onChange={(e) => setFormData({...formData, contact_phone: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t({ ar: "السعر لليلة", en: "Price per Night", fr: "Prix par nuit", es: "Precio por noche", ru: "Цена за ночь", id: "Harga per Malam", ms: "Harga setiap Malam" })}</Label>
                  <Input type="number" value={formData.price_per_night} onChange={(e) => setFormData({...formData, price_per_night: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>{t({ ar: "التقييم", en: "Rating", fr: "Évaluation", es: "Calificación", ru: "Рейтинг", id: "Penilaian", ms: "Penilaian" })}</Label>
                  <Input type="number" min="0" max="5" step="0.1" value={formData.rating} onChange={(e) => setFormData({...formData, rating: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t({ ar: "سعر الشخص الإضافي", en: "Extra Guest Price", fr: "Prix par invité supplémentaire", es: "Precio por huésped adicional", ru: "Цена за доп. гостя", id: "Harga Tamu Tambahan", ms: "Harga Tetamu Tambahan" })}</Label>
                  <Input type="number" min="0" value={formData.extra_guest_price} onChange={(e) => setFormData({...formData, extra_guest_price: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t({ ar: "عدد الغرف المتاحة", en: "Total Rooms" })}</Label>
                  <Input type="number" min="0" value={formData.total_rooms || "0"} onChange={(e) => setFormData({...formData, total_rooms: e.target.value})} placeholder="0" />
                  <p className="text-xs text-muted-foreground">{t({ ar: "إذا كان 0 فلا توجد غرف متاحة", en: "If 0, no rooms available" })}</p>
                </div>
                <div className="space-y-2">
                  <Label>{t({ ar: "نسبة الضريبة %", en: "Tax %" })}</Label>
                  <Input type="number" min="0" max="100" step="0.1" value={formData.tax_percentage || "0"} onChange={(e) => setFormData({...formData, tax_percentage: e.target.value})} placeholder="0" />
                  <p className="text-xs text-muted-foreground">{t({ ar: "إذا كان 0 فلا توجد ضريبة", en: "If 0, no tax" })}</p>
                </div>
              </div>
              
              {/* Bed Type Selection - Edit Dialog */}
              <div className="space-y-2">
                <Label>{t({ ar: "عدد الأشخاص الأساسيين", en: "Base Guests" })}</Label>
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <Select value={formData.max_guests_per_room} onValueChange={(value) => setFormData({...formData, max_guests_per_room: value})}>
                      <SelectTrigger className="w-[120px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6].map(num => (
                          <SelectItem key={num} value={num.toString()}>
                            {language === 'ar' ? (num === 1 ? '1 شخص واحد' : num === 2 ? 'شخصين' : `${num} شخص`) : `${num} ${t({ ar: 'أشخاص', en: 'persons' })}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Single Guest - Single Bed or King Bed */}
                  {formData.max_guests_per_room === "1" && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, bed_type_single: 'single'})}
                        className={`p-1.5 border-2 rounded transition-all ${
                          formData.bed_type_single === 'single' 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        title={t({ ar: "سرير مفرد", en: "Single Bed" })}
                      >
                        <BedIcon type="single" className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, bed_type_single: 'king'})}
                        className={`p-1.5 border-2 rounded transition-all ${
                          formData.bed_type_single === 'king' 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        title={t({ ar: "سرير كينج كبير", en: "King Size Bed" })}
                      >
                        <BedIcon type="king" className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                  
                  {/* Two Guests - Twin Beds or King Bed or Double Bed */}
                  {formData.max_guests_per_room === "2" && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, bed_type_double: 'twin'})}
                        className={`p-1.5 border-2 rounded transition-all ${
                          formData.bed_type_double === 'twin' 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        title={t({ ar: "سريرين مفردين", en: "Twin Beds" })}
                      >
                        <BedIcon type="twin" className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, bed_type_double: 'king'})}
                        className={`p-1.5 border-2 rounded transition-all ${
                          formData.bed_type_double === 'king' 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        title={t({ ar: "سرير كينج كبير", en: "King Size Bed" })}
                      >
                        <BedIcon type="king" className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>{t({ ar: "نوع الغرف", en: "Room Type" })}</Label>
                <Select value={formData.room_type} onValueChange={(value: 'hotel_rooms' | 'owner_rooms') => setFormData({...formData, room_type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hotel_rooms">{t({ ar: "غرف فندقية", en: "Hotel Rooms" })}</SelectItem>
                    <SelectItem value="owner_rooms">{t({ ar: "غرف مُلّاك", en: "Owner Rooms" })}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t({ ar: "صور الفندق", en: "Hotel Images" })}</Label>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('hotel-image-upload-edit')?.click()}
                      disabled={uploadingImages}
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 ml-2" />
                      {uploadingImages ? t({ ar: "جاري الرفع...", en: "Uploading..." }) : t({ ar: "رفع صور", en: "Upload Images" })}
                    </Button>
                    <input
                      id="hotel-image-upload-edit"
                      type="file"
                      multiple
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                  {hotelImages.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {hotelImages.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={img}
                            alt={`صورة ${idx + 1}`}
                            className="w-full h-20 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {t({ ar: "يمكنك رفع عدد غير محدود من الصور بحجم أقصى 10 ميجابايت لكل صورة", en: "You can upload unlimited images with max 10MB per image" })}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t({ ar: "المسؤولون عن الفندق", en: "Hotel Managers" })}</Label>
                <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                  {employees.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {t({ ar: "لا يوجد موظفون متاحون", en: "No employees available" })}
                    </p>
                  ) : (
                    employees.map(emp => (
                      <div key={emp.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`emp-edit-${emp.id}`}
                          checked={selectedResponsiblePersons.includes(emp.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedResponsiblePersons([...selectedResponsiblePersons, emp.id]);
                            } else {
                              setSelectedResponsiblePersons(selectedResponsiblePersons.filter(id => id !== emp.id));
                            }
                          }}
                          className="rounded border-border"
                        />
                        <label htmlFor={`emp-edit-${emp.id}`} className="text-sm cursor-pointer">
                          {emp.full_name || emp.id}
                        </label>
                      </div>
                    ))
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t({ ar: "سيتم إرسال الطلبات إلى لوحة التحكم الخاصة بالموظفين المحددين", en: "Requests will be sent to selected employees' dashboards" })}
                </p>
              </div>

              {/* Amenities Section - Edit Dialog */}
              <div className="space-y-4 pt-4 border-t">
                <Label className="text-base font-semibold">{t({ ar: "المرافق والخدمات", en: "Amenities & Services" })}</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="wifi-edit"
                      checked={amenities.wifi}
                      onChange={(e) => setAmenities({ ...amenities, wifi: e.target.checked })}
                      className="w-4 h-4 rounded border-border"
                    />
                    <Label htmlFor="wifi-edit" className="cursor-pointer flex items-center gap-2">
                      <Wifi className="w-4 h-4" />
                      {t({ ar: "واي فاي", en: "WiFi" })}
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="cafe-edit"
                      checked={amenities.cafe}
                      onChange={(e) => setAmenities({ ...amenities, cafe: e.target.checked })}
                      className="w-4 h-4 rounded border-border"
                    />
                    <Label htmlFor="cafe-edit" className="cursor-pointer flex items-center gap-2">
                      <Coffee className="w-4 h-4" />
                      {t({ ar: "مقهى", en: "Cafe" })}
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="restaurant-edit"
                      checked={amenities.restaurant}
                      onChange={(e) => setAmenities({ ...amenities, restaurant: e.target.checked })}
                      className="w-4 h-4 rounded border-border"
                    />
                    <Label htmlFor="restaurant-edit" className="cursor-pointer flex items-center gap-2">
                      <Utensils className="w-4 h-4" />
                      {t({ ar: "مطعم", en: "Restaurant" })}
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="parking-edit"
                      checked={amenities.parking}
                      onChange={(e) => setAmenities({ ...amenities, parking: e.target.checked })}
                      className="w-4 h-4 rounded border-border"
                    />
                    <Label htmlFor="parking-edit" className="cursor-pointer flex items-center gap-2">
                      <HotelIcon className="w-4 h-4" />
                      {t({ ar: "مواقف سيارات", en: "Parking" })}
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="shuttle-edit"
                      checked={amenities.shuttle}
                      onChange={(e) => setAmenities({ ...amenities, shuttle: e.target.checked })}
                      className="w-4 h-4 rounded border-border"
                    />
                    <Label htmlFor="shuttle-edit" className="cursor-pointer flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {t({ ar: "مواصلات", en: "Shuttle" })}
                    </Label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t({ ar: "المسافة إلى المنطقة المركزية", en: "Walking Distance to Center" })}</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder={t({ ar: "المسافة", en: "Distance" })}
                      value={amenities.walking_distance}
                      onChange={(e) => setAmenities({ ...amenities, walking_distance: e.target.value })}
                      className="flex-1"
                    />
                    <Select
                      value={amenities.walking_distance_unit}
                      onValueChange={(value: 'm' | 'km') => setAmenities({ ...amenities, walking_distance_unit: value })}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="m">{t({ ar: "متر", en: "m" })}</SelectItem>
                        <SelectItem value="km">{t({ ar: "كم", en: "km" })}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Meal Plans Section - Edit Dialog */}
              <div className="pt-4 border-t">
                <MealPlansManager 
                  mealPlan={mealPlan}
                  onChange={setMealPlan}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setEditingHotel(null); resetForm(); }}>
                {t({ ar: "إلغاء", en: "Cancel", fr: "Annuler", es: "Cancelar", ru: "Отмена", id: "Batal", ms: "Batal" })}
              </Button>
              <Button onClick={handleEditHotel}>
                {t({ ar: "حفظ", en: "Save", fr: "Enregistrer", es: "Guardar", ru: "Сохранить", id: "Simpan", ms: "Simpan" })}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
