'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, Check, X, Search } from 'lucide-react';

// Import countries data
import countriesData from '@/data/countries.json';

interface Country {
    code: string;
    name: string;
    flag: string;
}

interface CountrySelectProps {
    value?: string;
    onChange: (countryCode: string | null) => void;
    placeholder?: string;
    className?: string;
}

export default function CountrySelect({
    value,
    onChange,
    placeholder = 'Seleccionar país...',
    className = '',
}: CountrySelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const countries: Country[] = [...countriesData].sort((a, b) => {
        if (a.code === 'ES') return -1;
        if (b.code === 'ES') return 1;
        return a.name.localeCompare(b.name);
    });

    // Initialize selected country from value
    useEffect(() => {
        if (value) {
            const country = countries.find(c => c.code === value);
            setSelectedCountry(country || null);
        } else {
            setSelectedCountry(null);
        }
    }, [value, countries]);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearch('');
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter countries based on search
    const filteredCountries = countries.filter(country =>
        country.name.toLowerCase().includes(search.toLowerCase()) ||
        country.code.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = useCallback((country: Country) => {
        setSelectedCountry(country);
        onChange(country.code);
        setIsOpen(false);
        setSearch('');
    }, [onChange]);

    const handleClear = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedCountry(null);
        onChange(null);
        setSearch('');
    }, [onChange]);

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* Selected value / Input */}
            <div
                onClick={() => {
                    setIsOpen(true);
                    setTimeout(() => inputRef.current?.focus(), 0);
                }}
                className="w-full p-3 border rounded-lg bg-card cursor-pointer flex items-center justify-between hover:border-violet-300 focus-within:ring-2 focus-within:ring-violet-500 focus-within:border-violet-500 transition-colors"
            >
                {isOpen ? (
                    <div className="flex items-center gap-2 flex-1">
                        <Search className="w-4 h-4 text-slate-400" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar país..."
                            className="flex-1 outline-none text-foreground placeholder:text-slate-400"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                ) : selectedCountry ? (
                    <span className="text-foreground flex items-center gap-2">
                        <span className="text-lg">{selectedCountry.flag}</span>
                        {selectedCountry.name}
                    </span>
                ) : (
                    <span className="text-slate-400">{placeholder}</span>
                )}

                <div className="flex items-center gap-1">
                    {selectedCountry && !isOpen && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="p-1 hover:bg-slate-100 rounded"
                        >
                            <X className="w-4 h-4 text-slate-400" />
                        </button>
                    )}
                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredCountries.length === 0 ? (
                        <div className="p-3 text-foreground/60 text-center">
                            No se encontraron países
                        </div>
                    ) : (
                        filteredCountries.map((country) => (
                            <div
                                key={country.code}
                                onClick={() => handleSelect(country)}
                                className={`p-3 cursor-pointer flex items-center justify-between hover:bg-violet-50 transition-colors ${selectedCountry?.code === country.code ? 'bg-violet-100' : ''
                                    }`}
                            >
                                <span className="flex items-center gap-2">
                                    <span className="text-lg">{country.flag}</span>
                                    <span className="text-foreground">{country.name}</span>
                                    <span className="text-xs text-slate-400">{country.code}</span>
                                </span>
                                {selectedCountry?.code === country.code && (
                                    <Check className="w-4 h-4 text-violet-600" />
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
