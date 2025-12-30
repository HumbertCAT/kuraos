'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Calendar, Clock, CreditCard, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

/* eslint-disable @next/next/no-img-element */

interface Service {
    id: string;
    title: string;
    description: string;
    duration_minutes: number;
    price: number;
    currency: string;
    kind: 'ONE_ON_ONE' | 'GROUP';
}

export default function BookingPage() {
    // We don't have translations for this public page yet, using hardcoded fallback or minimal t
    // const t = useTranslations('Booking'); 
    const params = useParams();
    const therapistId = params.id as string;
    const locale = params.locale as string;

    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedService, setSelectedService] = useState<string | null>(null);

    useEffect(() => {
        if (therapistId) {
            loadServices();
        }
    }, [therapistId]);

    async function loadServices() {
        try {
            const data = await api.publicBooking.listServices(therapistId);
            setServices(data);
        } catch (err: any) {
            setError('Therapist not found or no services available.');
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
                    <div className="text-4xl mb-4">😕</div>
                    <h1 className="text-xl font-bold text-slate-800 mb-2">Oops!</h1>
                    <p className="text-slate-600">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-slate-900">Book a Session</h1>
                    <p className="mt-2 text-slate-600">Select a service to continue</p>
                </div>

                <div className="space-y-4">
                    {services.map((service) => (
                        <div
                            key={service.id}
                            onClick={() => {
                                // For now, just show alert as step 2 (slots) is next task
                                alert(`Booking flow for ${service.title} coming next!`);
                                setSelectedService(service.id);
                            }}
                            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-6 cursor-pointer border border-transparent hover:border-indigo-200 group relative"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                        {service.title}
                                    </h3>
                                    {service.description && (
                                        <p className="text-slate-500 mt-1 text-sm">{service.description}</p>
                                    )}

                                    <div className="flex items-center gap-4 mt-4 text-sm text-slate-600">
                                        <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded">
                                            <Clock size={16} className="text-indigo-500" />
                                            {service.duration_minutes} min
                                        </span>
                                        <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded font-medium text-slate-900">
                                            <CreditCard size={16} className="text-emerald-500" />
                                            {service.price} {service.currency}
                                        </span>
                                    </div>
                                </div>
                                <div className="ml-4 flex items-center self-center text-slate-300 group-hover:text-indigo-500">
                                    <ChevronRight size={24} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {services.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-slate-500">This therapist has no active services listed.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
