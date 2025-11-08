// This file will be populated with Arabic font base64
// For now, we'll use a minimal implementation and load the font dynamically

export async function loadArabicFont(): Promise<string> {
  try {
    // Fetch Cairo font from Google Fonts
    const response = await fetch('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
    const css = await response.text();
    
    // Extract font URL from CSS
    const urlMatch = css.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.ttf)\)/);
    if (!urlMatch) {
      throw new Error('Could not find font URL');
    }
    
    const fontUrl = urlMatch[1];
    
    // Fetch the actual font file
    const fontResponse = await fetch(fontUrl);
    const fontBlob = await fontResponse.blob();
    
    // Convert to base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(fontBlob);
    });
  } catch (error) {
    console.error('Error loading Arabic font:', error);
    // Fallback: return empty string, PDF will use default font
    return '';
  }
}
