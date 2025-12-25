'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';

interface CityAutocompleteProps {
    value?: string;
    onChange: (city: string) => void;
    countryCode?: string | null;
    placeholder?: string;
    className?: string;
}

interface City {
    name: string;
    region?: string;
}

// Cache for loaded city data
const cityCache: Record<string, City[]> = {};

export default function CityAutocomplete({
    value = '',
    onChange,
    countryCode,
    placeholder = 'Buscar ciudad...',
    className = '',
}: CityAutocompleteProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState(value);
    const [cities, setCities] = useState<City[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Load cities when country changes
    useEffect(() => {
        if (!countryCode) {
            setCities([]);
            return;
        }

        const code = countryCode; // Capture non-null value for closure

        // Check cache first
        if (cityCache[code]) {
            setCities(cityCache[code]);
            return;
        }

        // Load cities for this country
        async function loadCities() {
            setLoading(true);
            setError(null);

            try {
                const response = await fetch(`/data/cities/${code}.json`);
                if (!response.ok) {
                    // No city file for this country - that's OK, allow free text
                    setCities([]);
                    return;
                }

                const data: City[] = await response.json();
                cityCache[code] = data;
                setCities(data);
            } catch (err) {
                console.log(`No city data for ${code}, allowing free text`);
                setCities([]);
            } finally {
                setLoading(false);
            }
        }

        loadCities();
    }, [countryCode]);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Sync external value
    useEffect(() => {
        setSearch(value);
    }, [value]);

    // Filter cities based on search
    const filteredCities = cities.filter(city =>
        city.name.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 20); // Limit to 20 results

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearch(val);
        onChange(val);
        setIsOpen(val.length > 0 && cities.length > 0);
    };

    const handleSelect = (city: City) => {
        setSearch(city.name);
        onChange(city.name);
        setIsOpen(false);
    };

    const showSuggestions = isOpen && filteredCities.length > 0 && search.length > 0;

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* Input */}
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={search}
                    onChange={handleInputChange}
                    onFocus={() => search.length > 0 && cities.length > 0 && setIsOpen(true)}
                    placeholder={placeholder}
                    disabled={!countryCode}
                    className={`w-full p-3 pl-10 border rounded-lg outline-none text-foreground transition-colors
            ${countryCode
                            ? 'bg-card focus:ring-2 focus:ring-violet-500 focus:border-violet-500'
                            : 'bg-slate-50 cursor-not-allowed text-slate-400'
                        }`}
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    {loading ? (
                        <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                    ) : (
                        <MapPin className="w-4 h-4 text-slate-400" />
                    )}
                </div>
            </div>

            {/* Hint when no country selected */}
            {!countryCode && (
                <p className="text-xs text-slate-400 mt-1">Selecciona primero un país</p>
            )}

            {/* Suggestions dropdown */}
            {showSuggestions && (
                <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredCities.map((city, index) => (
                        <div
                            key={`${city.name}-${index}`}
                            onClick={() => handleSelect(city)}
                            className="p-3 cursor-pointer hover:bg-violet-50 transition-colors flex items-center gap-2"
                        >
                            <MapPin className="w-4 h-4 text-violet-400" />
                            <span className="text-foreground">{city.name}</span>
                            {city.region && (
                                <span className="text-xs text-slate-400">({city.region})</span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
