export function formatDate(dateString: string | undefined): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    // Si le format n'est pas une date valide, essayer de l'interpréter comme MM/YYYY
    const parts = dateString.split(/[\/\-]/);
    if (parts.length === 2) {
      const month = parseInt(parts[0] || '', 10);
      const year = parseInt(parts[1] || '', 10);
      
      if (!isNaN(month) && !isNaN(year) && month >= 1 && month <= 12) {
        const months = [
          'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
          'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
        ];
        return `${months[month - 1]} ${year}`;
      }
    }
    return dateString; // Retourner tel quel si non reconnu
  }
  
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
  }).format(date);
}

export function formatMonthYear(month: string | undefined, year: string | undefined): string {
  if (!month || !year) return '';
  
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  
  // Assurez-vous que le mois est un nombre entre 1 et 12
  const monthNum = parseInt(month, 10);
  if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    return year; // Retourne seulement l'année si le mois n'est pas valide
  }
  
  return `${months[monthNum - 1]} ${year}`;
}

export function formatDateRange(startDate: string | undefined, endDate: string | undefined): string {
  if (!startDate) return '';
  
  const formattedStart = formatDate(startDate);
  
  if (!endDate || endDate === 'Present') {
    return `${formattedStart} - Présent`;
  }
  
  const formattedEnd = formatDate(endDate);
  return `${formattedStart} - ${formattedEnd}`;
}

export function formatExperienceDateRange(
  startMonth: string | undefined, 
  startYear: string | undefined,
  endMonth: string | undefined,
  endYear: string | undefined,
  isCurrent: boolean | undefined
): string {
  if (!startMonth || !startYear) return '';
  
  const formattedStart = formatMonthYear(startMonth, startYear);
  
  if (isCurrent) {
    return `${formattedStart} - Présent`;
  }
  
  if (!endMonth || !endYear) {
    return formattedStart;
  }
  
  const formattedEnd = formatMonthYear(endMonth, endYear);
  return `${formattedStart} - ${formattedEnd}`;
}

export async function generatePDF(element: HTMLElement, filename: string): Promise<void> {
  try {
    // Import dynamiquement html2pdf seulement quand la fonction est appelée
    const html2pdf = (await import('html2pdf.js')).default;
    
    if (!element) {
      throw new Error('Element not provided for PDF generation');
    }
    
    // Options améliorées pour une meilleure qualité et une échelle correcte
    const opt = {
      margin: 0,
      filename: filename,
      image: { type: 'png', quality: 1 },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        allowTaint: true,
        logging: false,
        windowWidth: 210 * 3.78, // Conversion mm to px pour A4
        windowHeight: 297 * 3.78
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait' as 'portrait',
        compress: true
      }
    };
    
    // Utiliser une promesse pour mieux gérer les erreurs
    return await html2pdf().set(opt).from(element).save();
  } catch (error) {
    throw error;
  }
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

// Map dial codes to country codes for phone formatting
const dialCodeToCountryMap: { [key: string]: string } = {
  '+1': 'US',
  '+33': 'FR',
  '+30': 'GR',
  '+44': 'GB',
  '+49': 'DE',
  '+39': 'IT',
  '+34': 'ES',
  '+31': 'NL',
  '+32': 'BE',
  '+41': 'CH',
  '+81': 'JP',
  '+61': 'AU',
};

// Format phone number for display in CV templates (matches input formatting)
const formatPhoneForDisplay = (phone: string, countryCode: string): string => {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Country-specific formatting (same as input component)
  switch (countryCode) {
    case 'FR': // France: 01 23 45 67 89
      if (digits.length <= 2) return digits;
      if (digits.length <= 4) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
      if (digits.length <= 6) return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4)}`;
      if (digits.length <= 8) return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6)}`;
      return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
    
    case 'US': // United States: (123) 456-7890
    case 'CA': // Canada: (123) 456-7890
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    
    case 'GB': // United Kingdom: 01234 567890
      if (digits.length <= 5) return digits;
      return `${digits.slice(0, 5)} ${digits.slice(5, 11)}`;
    
    case 'DE': // Germany: 030 12345678
      if (digits.length <= 3) return digits;
      if (digits.length <= 4) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
      return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    
    case 'IT': // Italy: 06 1234 5678
      if (digits.length <= 2) return digits;
      if (digits.length <= 6) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
      return `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6, 10)}`;
    
    case 'ES': // Spain: 91 123 45 67
      if (digits.length <= 2) return digits;
      if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
      if (digits.length <= 7) return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
      return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`;
    
    case 'GR': // Greece: 123 456 7890
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
    
    case 'NL': // Netherlands: 06-12345678
      if (digits.length <= 2) return digits;
      return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    
    case 'BE': // Belgium: 0123 45 67 89
      if (digits.length <= 4) return digits;
      if (digits.length <= 6) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
      if (digits.length <= 8) return `${digits.slice(0, 4)} ${digits.slice(4, 6)} ${digits.slice(6)}`;
      return `${digits.slice(0, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
    
    case 'CH': // Switzerland: 012 345 67 89
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
      if (digits.length <= 8) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
    
    case 'JP': // Japan: 03-1234-5678
      if (digits.length <= 2) return digits;
      if (digits.length <= 6) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
      return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
    
    case 'AU': // Australia: 02 1234 5678
      if (digits.length <= 2) return digits;
      if (digits.length <= 6) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
      return `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6, 10)}`;
    
    default:
      // Generic format for other countries
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
};

export function formatPhoneDisplay(phone: string | undefined, phoneCountryCode: string | undefined): string {
  if (!phone) {
    return "123 456 7890"; // Generic example without country code
  }
  
  // Special case: if phone starts with +00 (default placeholder), replace with actual country code
  if (phone.startsWith('+00')) {
    const countryCode = phoneCountryCode || '+1';
    const formattedCountryCode = countryCode.startsWith('+') ? countryCode : `+${countryCode}`;
    const phoneWithoutPlus00 = phone.replace(/^\+00\s*/, '');
    const cleanPhone = phoneWithoutPlus00.replace(/[\s\-\.]/g, '');
    
    // Get country code for formatting
    const countryCodeForFormatting = dialCodeToCountryMap[formattedCountryCode] || 'US';
    
    // Format the phone number using country-specific formatting
    let formattedPhone = formatPhoneForDisplay(cleanPhone, countryCodeForFormatting);
    
    // For French numbers, remove leading zero if present
    if (countryCodeForFormatting === 'FR' && cleanPhone.startsWith('0')) {
      const phoneWithoutLeadingZero = cleanPhone.substring(1);
      formattedPhone = formatPhoneForDisplay(phoneWithoutLeadingZero, countryCodeForFormatting);
    }
    
    return `${formattedCountryCode} ${formattedPhone}`;
  }
  
  // If number already contains country code or formatting, return as-is
  if (phone.includes('+') || phone.startsWith('(')) {
    return phone;
  }
  
  // Clean the phone number (remove spaces, dashes, etc.)
  const cleanPhone = phone.replace(/[\s\-\.]/g, '');
  
  // Add country code
  const countryCode = phoneCountryCode || '+1';
  const formattedCountryCode = countryCode.startsWith('+') ? countryCode : `+${countryCode}`;
  
  // Get country code for formatting
  const countryCodeForFormatting = dialCodeToCountryMap[formattedCountryCode] || 'US';
  
  // Format the phone number using country-specific formatting
  let formattedPhone = formatPhoneForDisplay(cleanPhone, countryCodeForFormatting);
  
  // For French numbers, remove leading zero if present
  if (countryCodeForFormatting === 'FR' && cleanPhone.startsWith('0')) {
    const phoneWithoutLeadingZero = cleanPhone.substring(1);
    formattedPhone = formatPhoneForDisplay(phoneWithoutLeadingZero, countryCodeForFormatting);
  }
  
  return `${formattedCountryCode} ${formattedPhone}`;
}

export function suggestAlternativeSubdomains(
  subdomain: string,
  max: number = 5
): string[] {
  const alternatives = [];
  const base = subdomain.replace(/\d+$/, '');
  
  // Ajouter des suffixes numériques
  for (let i = 1; i <= max; i++) {
    alternatives.push(`${base}${i}`);
  }
  
  return alternatives.filter(alt => alt !== subdomain);
}