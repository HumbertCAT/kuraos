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
                    <code className="text-xs font-mono text-muted-foreground w-24">.type-h4</code>
                    <span className="type-h4">Heading 4: Component Title</span>
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
import { CyberButton } from '@/components/ui/CyberButton';
import { Sparkles } from 'lucide-react';

function ButtonsSection() {
    return (
        <section className="space-y-6">
            <h2 className="type-h2 text-foreground border-b border-border pb-2">
                🔘 Buttons - CRYSTAL & STEEL
            </h2>

            <div className="bg-card rounded-lg p-6 space-y-6">
                {/* Material Metaphors */}
                <div>
                    <h3 className="type-ui text-muted-foreground tracking-widest mb-1">MATERIAL METAPHORS</h3>
                    <p className="text-xs text-muted-foreground mb-4">Premium feel through material design language.</p>
                    <div className="flex flex-wrap gap-6 items-start">
                        <div className="text-center space-y-2">
                            <CyberButton variant="default" size="lg">Guardar</CyberButton>
                            <p className="text-[10px] text-muted-foreground font-medium">⚙️ STEEL</p>
                            <p className="text-[9px] text-muted-foreground">#004F53 • Solid, Matte</p>
                        </div>
                        <div className="text-center space-y-2">
                            <CyberButton variant="highlight" size="lg">Start Session</CyberButton>
                            <p className="text-[10px] text-muted-foreground font-medium">🔮 CRYSTAL</p>
                            <p className="text-[9px] text-muted-foreground">#247C7D • ring-inset</p>
                        </div>
                        <div className="text-center space-y-2">
                            <CyberButton variant="surface" size="lg">Configurar</CyberButton>
                            <p className="text-[10px] text-muted-foreground font-medium">🪟 GLASS</p>
                            <p className="text-[9px] text-muted-foreground">zinc-700 • Visible</p>
                        </div>
                    </div>
                </div>

                {/* Action Mapping */}
                <div className="pt-4 border-t border-border">
                    <h3 className="type-ui text-muted-foreground tracking-widest mb-3">ACTION MAPPING</h3>
                    <div className="flex flex-wrap gap-4 items-center">
                        <CyberButton variant="default">Guardar</CyberButton>
                        <CyberButton variant="highlight">Iniciar Sesión</CyberButton>
                        <CyberButton variant="secondary">Editar</CyberButton>
                        <CyberButton variant="ghost">Cancelar</CyberButton>
                        <CyberButton variant="danger">Eliminar</CyberButton>
                        <CyberButton variant="ai"><Sparkles className="w-4 h-4 text-yellow-300" />Analizar</CyberButton>
                    </div>
                </div>

                {/* Size Variants */}
                <div className="pt-4 border-t border-border">
                    <h3 className="type-ui text-muted-foreground tracking-widest mb-3">SIZE VARIANTS</h3>
                    <div className="flex flex-wrap gap-4 items-center">
                        <CyberButton variant="highlight" size="sm">Small</CyberButton>
                        <CyberButton variant="highlight" size="md">Medium</CyberButton>
                        <CyberButton variant="highlight" size="lg">Large</CyberButton>
                    </div>
                </div>

                {/* Usage Guide */}
                <div className="pt-4 border-t border-border bg-brand/10 rounded-lg p-4">
                    <h3 className="type-ui text-brand tracking-widest mb-2">HIERARCHY GUIDE</h3>
                    <ul className="text-xs text-muted-foreground space-y-1">
                        <li><code className="text-brand font-semibold">default</code> → STEEL: Guardar, Crear, Confirmar (commitment actions)</li>
                        <li><code className="text-brand font-semibold">highlight</code> → CRYSTAL: Start Session, Book Now (Hero CTAs)</li>
                        <li><code className="text-zinc-400 font-semibold">surface</code> → GLASS: Vista Previa, Configurar (support actions)</li>
                        <li><code className="text-zinc-500 font-semibold">ghost</code> → Cancelar, Cerrar (dismissive actions)</li>
                        <li><code className="text-rose-500 font-semibold">danger</code> → Eliminar (destructive actions)</li>
                    </ul>
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

// ============ LOGIC & FLOWS SECTION ============
function LogicFlowsSection() {
    return (
        <section className="space-y-6">
            <h2 className="type-h2 text-foreground border-b border-border pb-2">
                🧩 Logic & Flows (Neural Circuit Components)
            </h2>

            <p className="type-body text-muted-foreground">
                Reusable visual language for <strong>automation flows, patient timelines, campaign funnels</strong>, and any sequential logic.
            </p>

            {/* Individual Nodes */}
            <div className="bg-card rounded-lg p-6 space-y-6">
                <h3 className="type-ui text-muted-foreground tracking-widest">INDIVIDUAL NODES</h3>

                <div className="grid grid-cols-3 gap-6">
                    {/* Trigger Node */}
                    <div className="space-y-3">
                        <code className="text-xs font-mono text-ai">FlowNode.trigger</code>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-ai to-ai/70 rounded-xl flex items-center justify-center text-white shadow-lg shadow-ai/20">
                                <span className="text-lg">⚡</span>
                            </div>
                            <div className="flex-1 card border-l-4 border-l-ai p-3">
                                <p className="type-ui text-ai tracking-wider">CUANDO</p>
                                <p className="type-body text-foreground text-sm mt-1">"Evento disparador"</p>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">AI/Purple. Icono Zap. border-l-ai</p>
                    </div>

                    {/* Condition Node */}
                    <div className="space-y-3">
                        <code className="text-xs font-mono text-warning">FlowNode.condition</code>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-warning to-warning/70 rounded-xl flex items-center justify-center text-white shadow-lg shadow-warning/20 rotate-45">
                                <span className="text-lg -rotate-45">🛡️</span>
                            </div>
                            <div className="flex-1 card border-l-4 border-l-warning p-3">
                                <p className="type-ui text-warning tracking-wider">SI</p>
                                <p className="type-body text-foreground text-sm mt-1">"Condición lógica"</p>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">Warning/Orange. Diamond rotate-45</p>
                    </div>

                    {/* Action Node */}
                    <div className="space-y-3">
                        <code className="text-xs font-mono text-success">FlowNode.action</code>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-success to-success/70 rounded-xl flex items-center justify-center text-white shadow-lg shadow-success/20">
                                <span className="text-lg">✉️</span>
                            </div>
                            <div className="flex-1 card border-l-4 border-l-success p-3">
                                <p className="type-ui text-success tracking-wider">ENTONCES</p>
                                <p className="type-body text-foreground text-sm mt-1">"Acción ejecutada"</p>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">Success/Green. border-l-success</p>
                    </div>
                </div>
            </div>

            {/* Connector Line */}
            <div className="bg-card rounded-lg p-6 space-y-4">
                <h3 className="type-ui text-muted-foreground tracking-widest">CONNECTOR LINE</h3>

                <div className="flex gap-8">
                    {/* Dashed */}
                    <div className="space-y-2">
                        <code className="text-xs font-mono text-muted-foreground">border-l-2 border-dashed border-border</code>
                        <div className="h-24 w-0.5 border-l-2 border-dashed border-border ml-5"></div>
                        <p className="text-xs text-muted-foreground">Standard connector</p>
                    </div>

                    {/* Solid */}
                    <div className="space-y-2">
                        <code className="text-xs font-mono text-muted-foreground">border-l-2 border-solid border-success</code>
                        <div className="h-24 w-0.5 border-l-2 border-solid border-success ml-5"></div>
                        <p className="text-xs text-muted-foreground">Completed path</p>
                    </div>

                    {/* Gradient */}
                    <div className="space-y-2">
                        <code className="text-xs font-mono text-muted-foreground">bg-gradient-to-b from-ai to-success</code>
                        <div className="h-24 w-0.5 bg-gradient-to-b from-ai to-success ml-5"></div>
                        <p className="text-xs text-muted-foreground">Transition path</p>
                    </div>
                </div>
            </div>

            {/* Connected Flow Example */}
            <div className="bg-card rounded-lg p-6 space-y-4">
                <h3 className="type-ui text-muted-foreground tracking-widest">CONNECTED FLOW EXAMPLE</h3>

                {/* The Circuit Board */}
                <div className="relative pl-6">
                    {/* Vertical connector line */}
                    <div className="absolute left-[23px] top-6 bottom-6 w-0.5 border-l-2 border-dashed border-border"></div>

                    {/* Trigger */}
                    <div className="relative flex items-start gap-4 mb-6">
                        <div className="absolute -left-6 w-12 h-12 bg-gradient-to-br from-ai to-ai/70 rounded-xl flex items-center justify-center text-white shadow-lg shadow-ai/20 z-10">
                            <span>⚡</span>
                        </div>
                        <div className="ml-10 flex-1 card border-l-4 border-l-ai p-4">
                            <p className="type-ui text-ai tracking-wider">CUANDO</p>
                            <p className="type-body text-foreground mt-1">"Nuevo lead recibido"</p>
                            <span className="badge badge-ai mt-2">LEAD_CREATED</span>
                        </div>
                    </div>

                    {/* Condition */}
                    <div className="relative flex items-start gap-4 mb-6">
                        <div className="absolute -left-6 w-12 h-12 bg-gradient-to-br from-warning to-warning/70 rounded-xl flex items-center justify-center text-white shadow-lg shadow-warning/20 z-10 rotate-45">
                            <span className="-rotate-45">🛡️</span>
                        </div>
                        <div className="ml-10 flex-1 card border-l-4 border-l-warning p-4">
                            <p className="type-ui text-warning tracking-wider">SI</p>
                            <p className="type-body text-foreground mt-1">"El formulario es de tipo intake"</p>
                            <span className="badge badge-warning mt-2">form_type = intake</span>
                        </div>
                    </div>

                    {/* Action */}
                    <div className="relative flex items-start gap-4 mb-6">
                        <div className="absolute -left-6 w-12 h-12 bg-gradient-to-br from-success to-success/70 rounded-xl flex items-center justify-center text-white shadow-lg shadow-success/20 z-10">
                            <span>✉️</span>
                        </div>
                        <div className="ml-10 flex-1 card border-l-4 border-l-success p-4">
                            <p className="type-ui text-success tracking-wider">ENTONCES</p>
                            <p className="type-body text-foreground mt-1">"Enviar email de bienvenida"</p>
                        </div>
                    </div>

                    {/* End */}
                    <div className="relative flex items-start gap-4">
                        <div className="absolute -left-6 w-12 h-12 bg-muted rounded-xl flex items-center justify-center z-10">
                            <span className="text-muted-foreground">✓</span>
                        </div>
                        <div className="ml-10 flex-1 card bg-muted/50 p-4">
                            <p className="type-body text-muted-foreground font-medium">Completado</p>
                        </div>
                    </div>
                </div>

                <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border">
                    <strong>Usage:</strong> Agent flows, Campaign funnels, Patient timelines, Booking sequences.
                    Nodes positioned on the line with <code className="text-brand">z-10</code>.
                </p>
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
                    Internal Kitchen Sink for KURA OS v1.0.12.1. All components use semantic tokens from globals.css.
                </p>
            </header>

            <TypographySection />
            <ColorPaletteSection />
            <ButtonsSection />
            <BadgesSection />
            <CardsSection />
            <InputsSection />
            <AletheiaSection />
            <LogicFlowsSection />

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
