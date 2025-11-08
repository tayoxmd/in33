// Cairo font base64 - Arabic support
// This is a subset of Cairo font optimized for Arabic text in PDFs

export const cairoFontBase64 = "data:font/truetype;charset=utf-8;base64,AAEAAAASAQAABAAgRFNJRwAAAAEAAAlYAAAACEdERUYAKQA..."; // This will be replaced with actual font

// For now, we'll use a simpler approach with HTML entity conversion
export function prepareArabicText(text: string): string {
  // Reverse Arabic text for proper RTL display in PDF
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  
  if (arabicRegex.test(text)) {
    // Split text into words and reverse if contains Arabic
    const words = text.split(' ');
    const hasArabic = words.some(word => arabicRegex.test(word));
    
    if (hasArabic) {
      // Reverse the order of words for RTL
      return words.reverse().join(' ');
    }
  }
  
  return text;
}
