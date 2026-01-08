"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Mail, Phone, Clock, TrendingUp, User, Calendar } from "lucide-react";

interface Identity {
    identity_id: string;
    primary_email: string | null;
    primary_phone: string | null;
    created_at: string;
    leads: any[];
    patients: any[];
    total_interactions: number;
    first_contact: string | null;
    last_activity: string | null;
}

export default function ContactDetailPage() {
    const params = useParams();
    const router = useRouter();
    const identityId = params.id as string;

    const [identity, setIdentity] = useState<Identity | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchIdentity() {
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/contacts/${identityId}`,
                    {
                        credentials: "include",
                    }
                );

                if (!response.ok) {
                    throw new Error("Failed to fetch contact");
                }

                const data = await response.json();
                setIdentity(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Unknown error");
            } finally {
                setLoading(false);
            }
        }

        fetchIdentity();
    }, [identityId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
            </div>
        );
    }

    if (error || !identity) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <div className="text-destructive type-h3">Error loading contact</div>
                <p className="text-muted-foreground">{error}</p>
                <button
                    onClick={() => router.back()}
                    className="px-4 py-2 bg-card hover:bg-muted rounded-lg transition-all active:scale-95"
                >
                    Go Back
                </button>
            </div>
        );
    }

    // Merge leads and patients for unified timeline
    const timeline = [
        ...identity.leads.map((lead: any) => ({
            ...lead,
            type: "lead",
            timestamp: lead.created_at,
        })),
        ...identity.patients.map((patient: any) => ({
            ...patient,
            type: "patient",
            timestamp: patient.created_at,
        })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="type-h1 flex items-center gap-3">
                            <User className="w-8 h-8 text-brand" />
                            Contacto 360°
                        </h1>
                        <p className="type-body text-muted-foreground mt-2">
                            Vista unificada de todas las interacciones
                        </p>
                    </div>
                    <button
                        onClick={() => router.back()}
                        className="px-4 py-2 bg-card hover:bg-muted border border-white/5 rounded-lg transition-all active:scale-95"
                    >
                        ← Volver
                    </button>
                </div>

                {/* Contact Info Card */}
                <div className="bg-card border border-white/5 rounded-xl p-6 shadow-lg">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* Email */}
                        <div className="flex items-start gap-3">
                            <Mail className="w-5 h-5 text-brand mt-1" />
                            <div>
                                <div className="text-xs text-muted-foreground mb-1">Email</div>
                                <div className="type-ui font-medium">
                                    {identity.primary_email || "No email"}
                                </div>
                            </div>
                        </div>

                        {/* Phone */}
                        <div className="flex items-start gap-3">
                            <Phone className="w-5 h-5 text-brand mt-1" />
                            <div>
                                <div className="text-xs text-muted-foreground mb-1">Teléfono</div>
                                <div className="type-ui font-medium">
                                    {identity.primary_phone || "No phone"}
                                </div>
                            </div>
                        </div>

                        {/* First Contact */}
                        <div className="flex items-start gap-3">
                            <Calendar className="w-5 h-5 text-brand mt-1" />
                            <div>
                                <div className="text-xs text-muted-foreground mb-1">Primer contacto</div>
                                <div className="type-ui font-medium">
                                    {identity.first_contact
                                        ? new Date(identity.first_contact).toLocaleDateString("es-ES")
                                        : "N/A"}
                                </div>
                            </div>
                        </div>

                        {/* Total Interactions */}
                        <div className="flex items-start gap-3">
                            <TrendingUp className="w-5 h-5 text-brand mt-1" />
                            <div>
                                <div className="text-xs text-muted-foreground mb-1">Interacciones</div>
                                <div className="type-ui font-medium text-2xl text-brand">
                                    {identity.total_interactions}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-card border border-white/5 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <div className="type-h3 text-blue-400">{identity.leads.length}</div>
                            <div className="text-sm text-muted-foreground">Leads (CRM)</div>
                        </div>
                    </div>
                </div>

                <div className="bg-card border border-white/5 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                            <User className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                            <div className="type-h3 text-green-400">{identity.patients.length}</div>
                            <div className="text-sm text-muted-foreground">Pacientes (Clínico)</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Timeline */}
            <div className="bg-card border border-white/5 rounded-xl p-6">
                <h2 className="type-h2 mb-6 flex items-center gap-2">
                    <Clock className="w-6 h-6 text-brand" />
                    Timeline Unificado
                </h2>

                <div className="space-y-4">
                    {timeline.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            No hay interacciones registradas
                        </div>
                    ) : (
                        timeline.map((item: any, index: number) => (
                            <div
                                key={`${item.type}-${item.id}`}
                                className="flex gap-4 p-4 bg-muted/30 hover:bg-muted/50 rounded-lg border border-white/5 transition-all"
                            >
                                {/* Timeline dot */}
                                <div className="flex flex-col items-center">
                                    <div
                                        className={`w-3 h-3 rounded-full ${item.type === "lead" ? "bg-blue-400" : "bg-green-400"
                                            }`}
                                    />
                                    {index < timeline.length - 1 && (
                                        <div className="w-0.5 h-full bg-white/10 mt-2" />
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span
                                            className={`px-2 py-1 rounded text-xs font-medium ${item.type === "lead"
                                                    ? "bg-blue-500/10 text-blue-400"
                                                    : "bg-green-500/10 text-green-400"
                                                }`}
                                        >
                                            {item.type === "lead" ? "Lead" : "Paciente"}
                                        </span>
                                        <span className="text-sm text-muted-foreground">
                                            {new Date(item.timestamp).toLocaleDateString("es-ES", {
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                            })}
                                        </span>
                                    </div>

                                    <div className="type-ui font-medium mb-1">
                                        {item.first_name} {item.last_name}
                                    </div>

                                    {item.type === "lead" && (
                                        <>
                                            <div className="text-sm text-muted-foreground">
                                                Origen: {item.source || "Desconocido"}
                                            </div>
                                            {item.status && (
                                                <div className="text-sm text-muted-foreground">
                                                    Estado: {item.status}
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {item.type === "patient" && (
                                        <>
                                            {item.email && (
                                                <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                    <Mail className="w-4 h-4" />
                                                    {item.email}
                                                </div>
                                            )}
                                            {item.phone && (
                                                <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                    <Phone className="w-4 h-4" />
                                                    {item.phone}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Action button */}
                                <div>
                                    <button
                                        onClick={() => {
                                            const path = item.type === "lead" ? "/leads" : "/patients";
                                            router.push(`/${path}?id=${item.id}`);
                                        }}
                                        className="px-3 py-1.5 bg-brand/10 hover:bg-brand/20 text-brand rounded-lg transition-all active:scale-95 text-sm"
                                    >
                                        Ver detalles →
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
