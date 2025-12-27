'use client';

import { useState } from 'react';

/**
 * Design System Playground - v1.0.8
 * 
 * Internal "Kitchen Sink" page to visualize all UI tokens.
 * Use this as the reference for component styling.
 */

// ============ TYPOGRAPHY SECTION ============
function TypographySection() {
    return (
        <section className="space-y-6">
            <h2 className="type-h2 text-foreground border-b border-border pb-2">
                📝 Typography Scale
            </h2>

            <div className="space-y-4 bg-card rounded-lg p-6">
                <div className="flex items-baseline gap-4">
                    <code className="text-xs font-mono text-muted-foreground w-24">.type-h1</code>
                    <span className="type-h1">Heading 1: Clinical Clarity</span>
                </div>
                <div className="flex items-baseline gap-4">
                    <code className="text-xs font-mono text-muted-foreground w-24">.type-h2</code>
                    <span className="type-h2">Heading 2: Section Title</span>
                </div>
                <div className="flex items-baseline gap-4">
                    <code className="text-xs font-mono text-muted-foreground w-24">.type-h3</code>
                    <span className="type-h3">Heading 3: Subsection</span>
                </div>
                <div className="flex items-baseline gap-4">
                    <code className="text-xs font-mono text-muted-foreground w-24">.type-body</code>
                    <span className="type-body">Body text: The patient reported improvements in sleep patterns after the third session. Emotional regulation techniques are showing positive results.</span>
                </div>
                <div className="flex items-baseline gap-4">
                    <code className="text-xs font-mono text-muted-foreground w-24">.type-ui</code>
                    <span className="type-ui tracking-widest uppercase">UI Label: Active Status</span>
                </div>
            </div>
        </section>
    );
}

// ============ COLOR PALETTE SECTION ============
function ColorSwatch({ name, className }: { name: string; className: string }) {
    return (
        <div className="flex flex-col items-center gap-2">
            <div className={`w-16 h-16 rounded-lg border border-border ${className}`} />
            <code className="text-[10px] font-mono text-muted-foreground">{name}</code>
        </div>
    );
}

function ColorPaletteSection() {
    return (
        <section className="space-y-6">
            <h2 className="type-h2 text-foreground border-b border-border pb-2">
                🎨 Color Palette (Semantic Tokens)
            </h2>

            {/* Base Colors */}
            <div className="bg-card rounded-lg p-6 space-y-4">
                <h3 className="type-ui text-muted-foreground tracking-widest">BASE</h3>
                <div className="flex flex-wrap gap-4">
                    <ColorSwatch name="bg-background" className="bg-background" />
                    <ColorSwatch name="bg-foreground" className="bg-foreground" />
                    <ColorSwatch name="bg-card" className="bg-card" />
                    <ColorSwatch name="bg-sidebar" className="bg-sidebar" />
                    <ColorSwatch name="bg-muted" className="bg-muted" />
                    <ColorSwatch name="bg-accent" className="bg-accent" />
                </div>
            </div>

            {/* Brand Colors */}
            <div className="bg-card rounded-lg p-6 space-y-4">
                <h3 className="type-ui text-muted-foreground tracking-widest">BRAND & PRIMARY</h3>
                <div className="flex flex-wrap gap-4">
                    <ColorSwatch name="bg-brand" className="bg-brand" />
                    <ColorSwatch name="bg-brand/10" className="bg-brand/10" />
                    <ColorSwatch name="bg-primary" className="bg-primary" />
                    <ColorSwatch name="bg-secondary" className="bg-secondary" />
                    <ColorSwatch name="bg-ai" className="bg-ai" />
                </div>
            </div>

            {/* Status Colors */}
            <div className="bg-card rounded-lg p-6 space-y-4">
                <h3 className="type-ui text-muted-foreground tracking-widest">STATUS & FEEDBACK</h3>
                <div className="flex flex-wrap gap-4">
                    <ColorSwatch name="bg-risk" className="bg-risk" />
                    <ColorSwatch name="bg-success" className="bg-success" />
                    <ColorSwatch name="bg-warning" className="bg-warning" />
                    <ColorSwatch name="bg-destructive" className="bg-destructive" />
                </div>
            </div>
        </section>
    );
}

// ============ BUTTONS SECTION ============
function ButtonsSection() {
    return (
        <section className="space-y-6">
            <h2 className="type-h2 text-foreground border-b border-border pb-2">
                🔘 Buttons
            </h2>

            <div className="bg-card rounded-lg p-6 space-y-4">
                <div className="flex flex-wrap gap-4 items-center">
                    <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
                        Primary
                    </button>
                    <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors">
                        Secondary
                    </button>
                    <button className="px-4 py-2 bg-transparent text-foreground rounded-lg font-medium hover:bg-accent transition-colors">
                        Ghost
                    </button>
                    <button className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg font-medium hover:bg-destructive/90 transition-colors">
                        Destructive
                    </button>
                    <button className="px-4 py-2 bg-transparent border border-border text-foreground rounded-lg font-medium hover:bg-accent transition-colors">
                        Outline
                    </button>
                </div>

                {/* Brand Buttons */}
                <div className="flex flex-wrap gap-4 items-center pt-4 border-t border-border">
                    <button className="px-4 py-2 bg-brand text-primary-foreground rounded-lg font-medium hover:bg-brand/90 transition-colors">
                        Brand CTA
                    </button>
                    <button className="px-4 py-2 bg-brand/10 text-brand rounded-lg font-medium hover:bg-brand/20 transition-colors">
                        Brand Soft
                    </button>
                    <button className="px-4 py-2 bg-success text-primary-foreground rounded-lg font-medium hover:bg-success/90 transition-colors">
                        Success
                    </button>
                </div>
            </div>
        </section>
    );
}

// ============ BADGES SECTION ============
function BadgesSection() {
    return (
        <section className="space-y-6">
            <h2 className="type-h2 text-foreground border-b border-border pb-2">
                🏷️ Badges & Pills
            </h2>

            <div className="bg-card rounded-lg p-6">
                <div className="flex flex-wrap gap-3 items-center">
                    {/* Status Badges */}
                    <span className="px-2 py-0.5 text-xs font-medium bg-risk/10 text-risk rounded-full">
                        HIGH RISK
                    </span>
                    <span className="px-2 py-0.5 text-xs font-medium bg-warning/10 text-warning rounded-full">
                        MEDIUM
                    </span>
                    <span className="px-2 py-0.5 text-xs font-medium bg-success/10 text-success rounded-full">
                        LOW
                    </span>

                    {/* State Badges */}
                    <span className="px-2 py-0.5 text-xs font-medium bg-brand/10 text-brand rounded-full">
                        Nuevo
                    </span>
                    <span className="px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground rounded-full">
                        Contactado
                    </span>
                    <span className="px-2 py-0.5 text-xs font-medium bg-ai/10 text-ai rounded-full">
                        ✨ AI Análisis
                    </span>

                    {/* Semantic States */}
                    <span className="px-2 py-0.5 text-xs font-medium bg-risk text-destructive-foreground rounded-full">
                        Bloqueado
                    </span>
                    <span className="px-2 py-0.5 text-xs font-medium bg-success text-primary-foreground rounded-full">
                        Confirmado
                    </span>
                    <span className="px-2 py-0.5 text-xs font-medium bg-warning text-primary-foreground rounded-full">
                        Pendiente
                    </span>
                </div>
            </div>
        </section>
    );
}

// ============ CARDS SECTION ============
function CardsSection() {
    return (
        <section className="space-y-6">
            <h2 className="type-h2 text-foreground border-b border-border pb-2">
                🃏 Cards
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Metric Card */}
                <div className="bg-card rounded-xl p-4 border border-border">
                    <div className="flex items-center justify-between mb-2">
                        <span className="type-ui text-muted-foreground">INGRESOS MES</span>
                        <span className="text-brand">📊</span>
                    </div>
                    <p className="text-2xl font-bold font-mono text-foreground">€2,450</p>
                    <span className="text-xs text-success">+€450 pend.</span>
                </div>

                {/* Patient Card */}
                <div className="bg-card rounded-xl p-4 border border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand to-brand/70 flex items-center justify-center text-primary-foreground font-bold">
                            JP
                        </div>
                        <div>
                            <p className="font-medium text-foreground">Juan Pérez</p>
                            <p className="text-xs text-muted-foreground">juan@demo.com</p>
                        </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                        <span className="px-2 py-0.5 text-xs bg-success/10 text-success rounded">Activo</span>
                        <span className="px-2 py-0.5 text-xs bg-ai/10 text-ai rounded">En tratamiento</span>
                    </div>
                </div>

                {/* Alert Card */}
                <div className="bg-risk/5 border border-risk/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-risk mb-2">
                        <span>⚠️</span>
                        <span className="font-medium">Alerta de Riesgo</span>
                    </div>
                    <p className="type-body text-foreground">
                        El paciente ha mostrado señales de ideación negativa en la última sesión.
                    </p>
                </div>
            </div>
        </section>
    );
}

// ============ INPUTS SECTION ============
function InputsSection() {
    const [noteText, setNoteText] = useState('Organizar retiro de fin de año');

    return (
        <section className="space-y-6">
            <h2 className="type-h2 text-foreground border-b border-border pb-2">
                ✏️ Inputs & Forms
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Standard Input */}
                <div className="space-y-4">
                    <h3 className="type-ui text-muted-foreground tracking-widest">TEXT INPUT</h3>
                    <input
                        type="text"
                        placeholder="Buscar por nombre o email..."
                        className="w-full px-4 py-2 bg-muted/50 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/50"
                    />
                </div>

                {/* Quick Note (Post-it style) */}
                <div className="space-y-4">
                    <h3 className="type-ui text-muted-foreground tracking-widest">QUICK NOTE (POST-IT)</h3>
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800/30">
                        <div className="flex items-center gap-2 mb-2">
                            <span>📝</span>
                            <span className="type-ui text-amber-800 dark:text-amber-200">Nota Rápida</span>
                        </div>
                        <textarea
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            className="w-full bg-transparent font-mono text-sm text-amber-900 dark:text-amber-100 resize-none focus:outline-none"
                            rows={3}
                        />
                    </div>
                </div>

                {/* Checkboxes */}
                <div className="space-y-4">
                    <h3 className="type-ui text-muted-foreground tracking-widest">CHECKBOXES</h3>
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-border text-brand focus:ring-brand" />
                            <span className="text-foreground">Opción seleccionada</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="w-4 h-4 rounded border-border text-brand focus:ring-brand" />
                            <span className="text-foreground">Opción no seleccionada</span>
                        </label>
                    </div>
                </div>

                {/* Select */}
                <div className="space-y-4">
                    <h3 className="type-ui text-muted-foreground tracking-widest">SELECT</h3>
                    <select className="w-full px-4 py-2 bg-muted/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand/50">
                        <option>Todos los estados</option>
                        <option>Activo</option>
                        <option>Pendiente</option>
                        <option>Bloqueado</option>
                    </select>
                </div>
            </div>
        </section>
    );
}

// ============ ALETHEIA ELEMENTS ============
function AletheiaSection() {
    return (
        <section className="space-y-6">
            <h2 className="type-h2 text-foreground border-b border-border pb-2">
                ✨ AletheIA Elements
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Risk Assessment Widget */}
                <div className="bg-card rounded-lg p-4 border border-border">
                    <h3 className="type-ui text-muted-foreground tracking-widest mb-3">RISK ASSESSMENT</h3>
                    <div className="text-4xl font-mono font-bold text-risk">-0.90</div>
                    <p className="text-xs text-muted-foreground mt-1">HIGH • CACHED</p>
                </div>

                {/* Engagement Score Widget */}
                <div className="bg-card rounded-lg p-4 border border-border">
                    <h3 className="type-ui text-muted-foreground tracking-widest mb-3">ENGAGEMENT</h3>
                    <div className="flex items-center gap-4">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full w-[60%] bg-brand rounded-full" />
                        </div>
                        <span className="text-brand font-mono font-bold">60%</span>
                    </div>
                </div>

                {/* Active Flags */}
                <div className="bg-risk/5 border border-risk/20 rounded-lg p-4 md:col-span-2">
                    <h3 className="flex items-center gap-2 text-risk font-medium mb-2">
                        <span>⚠️</span>
                        ACTIVE FLAGS (1)
                    </h3>
                    <p className="type-body text-foreground">
                        El paciente está bloqueado médicamente en el "retreat ibiza 2025", lo que requiere atención inmediata.
                    </p>
                </div>
            </div>
        </section>
    );
}

// ============ MAIN PAGE ============
export default function DesignSystemPage() {
    return (
        <div className="p-6 space-y-12 max-w-6xl mx-auto">
            {/* Header */}
            <header className="space-y-2">
                <h1 className="type-h1">🎨 Design System Playground</h1>
                <p className="type-body text-muted-foreground">
                    Internal Kitchen Sink for KURA OS v1.0.8. All components use semantic tokens from globals.css.
                </p>
            </header>

            <TypographySection />
            <ColorPaletteSection />
            <ButtonsSection />
            <BadgesSection />
            <CardsSection />
            <InputsSection />
            <AletheiaSection />

            {/* Footer */}
            <footer className="text-center py-8 border-t border-border">
                <p className="type-ui text-muted-foreground">
                    Toggle Light/Dark mode to test theme compliance.
                </p>
                <p className="type-body text-muted-foreground mt-2">
                    If something "looks wrong", fix it in <code className="text-brand">globals.css</code>, not in the component.
                </p>
            </footer>
        </div>
    );
}
