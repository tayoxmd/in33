export interface Country {
  code: string;
  name: string;
  nameAr: string;
  dialCode: string;
  maxLength: number;
  placeholder: string;
}

export const countries: Country[] = [
  { code: 'SA', name: 'Saudi Arabia', nameAr: 'السعودية', dialCode: '+966', maxLength: 9, placeholder: '5XX XXX XXX' },
  { code: 'AE', name: 'United Arab Emirates', nameAr: 'الإمارات', dialCode: '+971', maxLength: 9, placeholder: '5X XXX XXXX' },
  { code: 'KW', name: 'Kuwait', nameAr: 'الكويت', dialCode: '+965', maxLength: 8, placeholder: 'XXXX XXXX' },
  { code: 'QA', name: 'Qatar', nameAr: 'قطر', dialCode: '+974', maxLength: 8, placeholder: 'XXXX XXXX' },
  { code: 'BH', name: 'Bahrain', nameAr: 'البحرين', dialCode: '+973', maxLength: 8, placeholder: 'XXXX XXXX' },
  { code: 'OM', name: 'Oman', nameAr: 'عمان', dialCode: '+968', maxLength: 8, placeholder: 'XXXX XXXX' },
  { code: 'JO', name: 'Jordan', nameAr: 'الأردن', dialCode: '+962', maxLength: 9, placeholder: '7X XXX XXXX' },
  { code: 'LB', name: 'Lebanon', nameAr: 'لبنان', dialCode: '+961', maxLength: 8, placeholder: 'XX XXX XXX' },
  { code: 'EG', name: 'Egypt', nameAr: 'مصر', dialCode: '+20', maxLength: 10, placeholder: '1XX XXX XXXX' },
  { code: 'IQ', name: 'Iraq', nameAr: 'العراق', dialCode: '+964', maxLength: 10, placeholder: '7XX XXX XXXX' },
  { code: 'YE', name: 'Yemen', nameAr: 'اليمن', dialCode: '+967', maxLength: 9, placeholder: '7XX XXX XXX' },
  { code: 'SY', name: 'Syria', nameAr: 'سوريا', dialCode: '+963', maxLength: 9, placeholder: '9XX XXX XXX' },
  { code: 'PS', name: 'Palestine', nameAr: 'فلسطين', dialCode: '+970', maxLength: 9, placeholder: '5XX XXX XXX' },
  { code: 'SD', name: 'Sudan', nameAr: 'السودان', dialCode: '+249', maxLength: 9, placeholder: '9XX XXX XXX' },
  { code: 'LY', name: 'Libya', nameAr: 'ليبيا', dialCode: '+218', maxLength: 9, placeholder: '9X XXX XXXX' },
  { code: 'TN', name: 'Tunisia', nameAr: 'تونس', dialCode: '+216', maxLength: 8, placeholder: 'XX XXX XXX' },
  { code: 'DZ', name: 'Algeria', nameAr: 'الجزائر', dialCode: '+213', maxLength: 9, placeholder: '5XX XXX XXX' },
  { code: 'MA', name: 'Morocco', nameAr: 'المغرب', dialCode: '+212', maxLength: 9, placeholder: '6XX XXX XXX' },
  { code: 'MR', name: 'Mauritania', nameAr: 'موريتانيا', dialCode: '+222', maxLength: 8, placeholder: 'XXXX XXXX' },
  { code: 'SO', name: 'Somalia', nameAr: 'الصومال', dialCode: '+252', maxLength: 8, placeholder: 'XX XXX XXX' },
  { code: 'DJ', name: 'Djibouti', nameAr: 'جيبوتي', dialCode: '+253', maxLength: 8, placeholder: 'XX XX XX XX' },
  { code: 'KM', name: 'Comoros', nameAr: 'جزر القمر', dialCode: '+269', maxLength: 7, placeholder: 'XXX XXXX' },
  { code: 'US', name: 'United States', nameAr: 'الولايات المتحدة', dialCode: '+1', maxLength: 10, placeholder: 'XXX XXX XXXX' },
  { code: 'GB', name: 'United Kingdom', nameAr: 'بريطانيا', dialCode: '+44', maxLength: 10, placeholder: '7XXX XXXXXX' },
  { code: 'FR', name: 'France', nameAr: 'فرنسا', dialCode: '+33', maxLength: 9, placeholder: '6 XX XX XX XX' },
  { code: 'DE', name: 'Germany', nameAr: 'ألمانيا', dialCode: '+49', maxLength: 11, placeholder: '1XX XXXXXXXX' },
  { code: 'IT', name: 'Italy', nameAr: 'إيطاليا', dialCode: '+39', maxLength: 10, placeholder: '3XX XXX XXXX' },
  { code: 'ES', name: 'Spain', nameAr: 'إسبانيا', dialCode: '+34', maxLength: 9, placeholder: '6XX XXX XXX' },
  { code: 'TR', name: 'Turkey', nameAr: 'تركيا', dialCode: '+90', maxLength: 10, placeholder: '5XX XXX XX XX' },
  { code: 'PK', name: 'Pakistan', nameAr: 'باكستان', dialCode: '+92', maxLength: 10, placeholder: '3XX XXX XXXX' },
  { code: 'IN', name: 'India', nameAr: 'الهند', dialCode: '+91', maxLength: 10, placeholder: 'XXXXX XXXXX' },
  { code: 'BD', name: 'Bangladesh', nameAr: 'بنغلاديش', dialCode: '+880', maxLength: 10, placeholder: '1XXX XXXXXX' },
  { code: 'MY', name: 'Malaysia', nameAr: 'ماليزيا', dialCode: '+60', maxLength: 10, placeholder: '1X XXX XXXX' },
  { code: 'ID', name: 'Indonesia', nameAr: 'إندونيسيا', dialCode: '+62', maxLength: 11, placeholder: '8XX XXXX XXXX' },
  { code: 'CN', name: 'China', nameAr: 'الصين', dialCode: '+86', maxLength: 11, placeholder: '1XX XXXX XXXX' },
  { code: 'JP', name: 'Japan', nameAr: 'اليابان', dialCode: '+81', maxLength: 10, placeholder: '90 XXXX XXXX' },
  { code: 'KR', name: 'South Korea', nameAr: 'كوريا الجنوبية', dialCode: '+82', maxLength: 10, placeholder: '10 XXXX XXXX' },
  { code: 'AU', name: 'Australia', nameAr: 'أستراليا', dialCode: '+61', maxLength: 9, placeholder: '4XX XXX XXX' },
  { code: 'CA', name: 'Canada', nameAr: 'كندا', dialCode: '+1', maxLength: 10, placeholder: 'XXX XXX XXXX' },
  { code: 'BR', name: 'Brazil', nameAr: 'البرازيل', dialCode: '+55', maxLength: 11, placeholder: '(XX) XXXXX-XXXX' },
  { code: 'RU', name: 'Russia', nameAr: 'روسيا', dialCode: '+7', maxLength: 10, placeholder: 'XXX XXX-XX-XX' },
  { code: 'AF', name: 'Afghanistan', nameAr: 'أفغانستان', dialCode: '+93', maxLength: 9, placeholder: '7XX XXX XXX' },
  { code: 'IR', name: 'Iran', nameAr: 'إيران', dialCode: '+98', maxLength: 10, placeholder: '9XX XXX XXXX' },
];
