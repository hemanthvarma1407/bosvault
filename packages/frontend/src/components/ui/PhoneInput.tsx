import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import { countryService } from '@/lib/api/services';

interface CountryCode {
    code: string;
    country: string;
    flag: string;
}

const FALLBACK_COUNTRY_CODES: CountryCode[] = [
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
];

export interface PhoneInputProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    error?: string;
    required?: boolean;
    disabled?: boolean;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
    label,
    value = '',
    onChange,
    placeholder = '',
    className,
    error,
    required,
    disabled
}) => {
    const [countryCodes, setCountryCodes] = useState<CountryCode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    // Fetch dynamic country codes
    useEffect(() => {
        let mounted = true;
        const fetchCountries = async () => {
            try {
                const fetchedCountries = await countryService.getAllCountryCodes();
                if (mounted) {
                    if (fetchedCountries.length > 0) {
                        setCountryCodes(fetchedCountries);
                    } else {
                        setCountryCodes(FALLBACK_COUNTRY_CODES);
                    }
                }
            } catch (err) {
                console.error('PhoneInput: Failed to load countries, using fallback', err);
                if (mounted) setCountryCodes(FALLBACK_COUNTRY_CODES);
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        fetchCountries();
        return () => { mounted = false; };
    }, []);

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
                setSearchQuery('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const effectiveCountryCodes = countryCodes.length > 0 ? countryCodes : FALLBACK_COUNTRY_CODES;

    const sortedCountryCodes = useMemo(() => {
        return [...effectiveCountryCodes].sort((a, b) => b.code.length - a.code.length);
    }, [effectiveCountryCodes]);

    const filteredCountries = useMemo(() => {
        if (!searchQuery) return effectiveCountryCodes;
        const q = searchQuery.toLowerCase();
        return effectiveCountryCodes.filter((c: CountryCode) =>
            c.country.toLowerCase().includes(q) ||
            c.code.toLowerCase().includes(q)
        );
    }, [searchQuery, effectiveCountryCodes]);

    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        setActiveIndex(0);
    }, [searchQuery]);

    // Parse initial value
    const { initialCode, initialNumber } = useMemo(() => {
        const found = sortedCountryCodes.find(c => value.startsWith(c.code));
        if (found) {
            return {
                initialCode: found.code,
                initialNumber: value.slice(found.code.length).trim()
            };
        }
        return { initialCode: '+91', initialNumber: value };
    }, [value, sortedCountryCodes]);

    const [selectedCode, setSelectedCode] = useState(initialCode);
    const [phoneNumber, setPhoneNumber] = useState(initialNumber);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        // Only update local state if value actually changed from outside
        const combined = value.startsWith(selectedCode) ? value : `${selectedCode} ${phoneNumber}`.trim();
        if (value !== combined) {
            const found = sortedCountryCodes.find(c => value.startsWith(c.code));
            if (found) {
                setSelectedCode(found.code);
                setPhoneNumber(value.slice(found.code.length).trim());
            } else {
                setPhoneNumber(value);
            }
        }
    }, [value, selectedCode, phoneNumber, sortedCountryCodes]);

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        const isManualCodeEntry = raw.startsWith('+');

        // Auto-detect country code from input
        if (isManualCodeEntry) {
            const potentialCodeMatch = sortedCountryCodes.find(c => raw.startsWith(c.code));
            if (potentialCodeMatch && potentialCodeMatch.code !== selectedCode) {
                setSelectedCode(potentialCodeMatch.code);
                const newNumber = raw.slice(potentialCodeMatch.code.length).replace(/\D/g, '').trim();
                setPhoneNumber(newNumber);
                onChange(`${potentialCodeMatch.code} ${newNumber}`.trim());
                return;
            }
        } else {
            // Check if what they typed (without +) matches a code
            // (Only if the field was empty or they are typing at the start)
            if (phoneNumber.length === 0 && raw.length > 0) {
                const potentialCodeMatch = sortedCountryCodes.find((c: CountryCode) => `+${raw}`.startsWith(c.code));
                if (potentialCodeMatch) {
                    setSelectedCode(potentialCodeMatch.code);
                    const newNumber = `+${raw}`.slice(potentialCodeMatch.code.length).replace(/\D/g, '').trim();
                    setPhoneNumber(newNumber);
                    onChange(`${potentialCodeMatch.code} ${newNumber}`.trim());
                    return;
                }
            }
        }

        const digitsOnly = raw.replace(/\D/g, '').slice(0, 10);
        setPhoneNumber(digitsOnly);
        onChange(`${selectedCode} ${digitsOnly}`.trim());
    };

    const handleCodeSelect = (code: string) => {
        setSelectedCode(code);
        onChange(`${code} ${phoneNumber}`.trim());
        setIsDropdownOpen(false);
        setSearchQuery('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isDropdownOpen) {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
                setIsDropdownOpen(true);
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setActiveIndex(prev => (prev + 1) % filteredCountries.length);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setActiveIndex(prev => (prev - 1 + filteredCountries.length) % filteredCountries.length);
                break;
            case 'Enter':
                e.preventDefault();
                if (filteredCountries[activeIndex]) {
                    handleCodeSelect(filteredCountries[activeIndex].code);
                }
                break;
            case 'Escape':
                setIsDropdownOpen(false);
                setSearchQuery('');
                break;
        }
    };

    const currentCountry = effectiveCountryCodes.find((c: CountryCode) => c.code === selectedCode);

    return (
        <div className={cn("w-full space-y-1.5", className)} ref={dropdownRef} onKeyDown={handleKeyDown}>
            <div className="relative">
                <div className={cn(
                    "flex h-14 w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl transition-all duration-200",
                    (isFocused || isDropdownOpen) && "border-primary-500 ring-4 ring-primary-500/10 dark:ring-primary-400/10",
                    error && "border-rose-500 ring-rose-500/10",
                    disabled && "opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900"
                )}>
                    {/* Country Code Selector */}
                    <div className="relative flex items-center border-r border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 px-3 min-w-[95px]">
                        <button
                            type="button"
                            onClick={() => !disabled && !isLoading && setIsDropdownOpen(!isDropdownOpen)}
                            disabled={disabled || isLoading}
                            className="flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-300 w-full disabled:cursor-not-allowed outline-none"
                        >
                            {isLoading ? (
                                <div className="animate-spin h-3.5 w-3.5 border-2 border-primary-500 border-t-transparent rounded-full" />
                            ) : (
                                <>
                                    <span className="text-lg">{currentCountry?.flag}</span>
                                    <span>{selectedCode}</span>
                                    <ChevronDown className={cn("h-3.5 w-3.5 opacity-50 transition-transform duration-200", isDropdownOpen && "rotate-180")} />
                                </>
                            )}
                        </button>

                        {/* Searchable Dropdown Menu */}
                        {isDropdownOpen && (
                            <div className="absolute top-full left-0 mt-2 w-[280px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                {/* Search Input */}
                                <div className="p-3 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
                                    <div className="relative">
                                        <input
                                            autoFocus
                                            type="text"
                                            placeholder="Search country or code..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-3 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white dark:placeholder:text-slate-500"
                                        />
                                    </div>
                                </div>

                                {/* List */}
                                <div className="max-h-[300px] overflow-y-auto p-2 custom-scrollbar">
                                    {filteredCountries.length === 0 ? (
                                        <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
                                            No countries found for "{searchQuery}"
                                        </div>
                                    ) : (
                                        filteredCountries.map((c: CountryCode, idx: number) => (
                                            <button
                                                key={`${c.code}-${idx}`}
                                                type="button"
                                                onClick={() => handleCodeSelect(c.code)}
                                                onMouseEnter={() => setActiveIndex(idx)}
                                                className={cn(
                                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-left",
                                                    (selectedCode === c.code || activeIndex === idx)
                                                        ? "bg-primary-50 dark:bg-primary-900/40 text-primary-600 dark:text-primary-300"
                                                        : "hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300"
                                                )}
                                            >
                                                <span className="text-xl shrink-0 group-hover:scale-110 transition-transform">{c.flag}</span>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-xs font-bold truncate">{c.country}</span>
                                                    <span className="text-[10px] font-medium opacity-60">{c.code}</span>
                                                </div>
                                                {selectedCode === c.code && (
                                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                                )}
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Phone Number Input */}
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={phoneNumber}
                            onChange={handleNumberChange}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            placeholder={label && isFocused ? '' : placeholder}
                            disabled={disabled}
                            required={required}
                            className={cn(
                                "w-full h-full px-4 bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none",
                                label && "pt-6 text-sm font-semibold"
                            )}
                        />
                        {label && (
                            <label className={cn(
                                "absolute left-4 transition-all duration-200 pointer-events-none",
                                (isFocused || isDropdownOpen || phoneNumber || value)
                                    ? "top-2 text-xs text-primary-600 font-medium"
                                    : "top-1/2 -translate-y-1/2 text-sm text-slate-500"
                            )}>
                                {label}
                            </label>
                        )}
                    </div>
                </div>

                {error && (
                    <p className="mt-1 text-xs text-rose-500 animate-in fade-in slide-in-from-top-1">
                        {error}
                    </p>
                )}
            </div>
        </div>
    );
};
