import axios from 'axios';

export interface CountryCode {
    code: string;
    country: string;
    flag: string;
}

export class CountryService {
    private readonly API_URL = 'https://restcountries.com/v3.1/all?fields=name,flags,idd,cca2';

    async getAllCountryCodes(): Promise<CountryCode[]> {
        return [
            { code: '+91', country: 'India', flag: '🇮🇳' },
            { code: '+1', country: 'USA/Canada', flag: '🇺🇸' },
            { code: '+44', country: 'UK', flag: '🇬🇧' },
            { code: '+61', country: 'Australia', flag: '🇦🇺' },
            { code: '+971', country: 'UAE', flag: '🇦🇪' },
            { code: '+65', country: 'Singapore', flag: '🇸🇬' },
            { code: '+49', country: 'Germany', flag: '🇩🇪' },
            { code: '+33', country: 'France', flag: '🇫🇷' },
            { code: '+81', country: 'Japan', flag: '🇯🇵' },
            { code: '+86', country: 'China', flag: '🇨🇳' },
            { code: '+55', country: 'Brazil', flag: '🇧🇷' },
            { code: '+7', country: 'Russia', flag: '🇷🇺' },
            { code: '+27', country: 'South Africa', flag: '🇿🇦' },
            { code: '+82', country: 'South Korea', flag: '🇰🇷' },
            { code: '+52', country: 'Mexico', flag: '🇲🇽' },
            { code: '+39', country: 'Italy', flag: '🇮🇹' },
            { code: '+34', country: 'Spain', flag: '🇪🇸' },
            { code: '+31', country: 'Netherlands', flag: '🇳🇱' },
            { code: '+41', country: 'Switzerland', flag: '🇨🇭' },
            { code: '+46', country: 'Sweden', flag: '🇸🇪' },
            { code: '+47', country: 'Norway', flag: '🇳🇴' },
            { code: '+45', country: 'Denmark', flag: '🇩🇰' },
            { code: '+358', country: 'Finland', flag: '🇫🇮' },
            { code: '+48', country: 'Poland', flag: '🇵🇱' },
            { code: '+43', country: 'Austria', flag: '🇦🇹' },
            { code: '+32', country: 'Belgium', flag: '🇧🇪' },
            { code: '+353', country: 'Ireland', flag: '🇮🇪' },
            { code: '+64', country: 'New Zealand', flag: '🇳🇿' },
            { code: '+972', country: 'Israel', flag: '🇮🇱' },
            { code: '+90', country: 'Turkey', flag: '🇹🇷' },
            { code: '+20', country: 'Egypt', flag: '🇪🇬' },
            { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
            { code: '+254', country: 'Kenya', flag: '🇰🇪' },
            { code: '+92', country: 'Pakistan', flag: '🇵🇰' },
            { code: '+880', country: 'Bangladesh', flag: '🇧🇩' },
            { code: '+94', country: 'Sri Lanka', flag: '🇱🇰' },
            { code: '+977', country: 'Nepal', flag: '🇳🇵' },
            { code: '+62', country: 'Indonesia', flag: '🇮🇩' },
            { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
            { code: '+66', country: 'Thailand', flag: '🇹🇭' },
            { code: '+84', country: 'Vietnam', flag: '🇻🇳' },
            { code: '+63', country: 'Philippines', flag: '🇵🇭' },
        ].sort((a, b) => a.country.localeCompare(b.country));
    }
}
