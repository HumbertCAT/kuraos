'use client';

import { useTranslations } from 'next-intl';

export default function UITestPage() {
    const t = useTranslations('Common');

    return (
        <div className="space-y-12">
            <div>
                <h1 className="text-3xl font-bold text-slate-800 mb-2">UI Demo</h1>
                <p className="text-slate-600">Explorando componentes y estilos disponibles</p>
            </div>

            {/* Colors */}
            <section>
                <h2 className="text-xl font-semibold text-slate-800 mb-4">🎨 Paleta de Colores</h2>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                    {['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'].map(shade => (
                        <div key={shade} className="text-center">
                            <div
                                className={`w-full h-16 rounded-lg bg-slate-${shade}`}
                                style={{ backgroundColor: `var(--tw-color-slate-${shade}, inherit)` }}
                            />
                            <span className="text-xs text-slate-600">{shade}</span>
                        </div>
                    ))}
                </div>
                <div className="flex gap-4 mt-4 flex-wrap">
                    <div className="w-16 h-16 bg-slate-50 rounded border flex items-center justify-center text-xs">50</div>
                    <div className="w-16 h-16 bg-slate-100 rounded flex items-center justify-center text-xs">100</div>
                    <div className="w-16 h-16 bg-slate-200 rounded flex items-center justify-center text-xs">200</div>
                    <div className="w-16 h-16 bg-slate-300 rounded flex items-center justify-center text-xs">300</div>
                    <div className="w-16 h-16 bg-slate-400 rounded flex items-center justify-center text-xs text-white">400</div>
                    <div className="w-16 h-16 bg-slate-500 rounded flex items-center justify-center text-xs text-white">500</div>
                    <div className="w-16 h-16 bg-slate-600 rounded flex items-center justify-center text-xs text-white">600</div>
                    <div className="w-16 h-16 bg-slate-700 rounded flex items-center justify-center text-xs text-white">700</div>
                    <div className="w-16 h-16 bg-slate-800 rounded flex items-center justify-center text-xs text-white">800</div>
                    <div className="w-16 h-16 bg-slate-900 rounded flex items-center justify-center text-xs text-white">900</div>
                </div>
                <div className="flex gap-4 mt-4 flex-wrap">
                    <div className="w-16 h-16 bg-red-500 rounded flex items-center justify-center text-xs text-white">Red</div>
                    <div className="w-16 h-16 bg-green-500 rounded flex items-center justify-center text-xs text-white">Green</div>
                    <div className="w-16 h-16 bg-blue-500 rounded flex items-center justify-center text-xs text-white">Blue</div>
                    <div className="w-16 h-16 bg-yellow-500 rounded flex items-center justify-center text-xs">Yellow</div>
                    <div className="w-16 h-16 bg-purple-500 rounded flex items-center justify-center text-xs text-white">Purple</div>
                    <div className="w-16 h-16 bg-pink-500 rounded flex items-center justify-center text-xs text-white">Pink</div>
                    <div className="w-16 h-16 bg-indigo-500 rounded flex items-center justify-center text-xs text-white">Indigo</div>
                    <div className="w-16 h-16 bg-teal-500 rounded flex items-center justify-center text-xs text-white">Teal</div>
                </div>
            </section>

            {/* Typography */}
            <section>
                <h2 className="text-xl font-semibold text-slate-800 mb-4">📝 Tipografía</h2>
                <div className="space-y-3 bg-white p-6 rounded-lg border">
                    <p className="text-5xl font-bold text-slate-900">Heading 1 - 5xl Bold</p>
                    <p className="text-4xl font-bold text-slate-900">Heading 2 - 4xl Bold</p>
                    <p className="text-3xl font-bold text-slate-800">Heading 3 - 3xl Bold</p>
                    <p className="text-2xl font-semibold text-slate-800">Heading 4 - 2xl Semibold</p>
                    <p className="text-xl font-semibold text-slate-800">Heading 5 - xl Semibold</p>
                    <p className="text-lg font-medium text-slate-700">Large Text - lg Medium</p>
                    <p className="text-base text-slate-600">Body Text - base</p>
                    <p className="text-sm text-slate-500">Small Text - sm</p>
                    <p className="text-xs text-slate-400">Extra Small - xs</p>
                </div>
            </section>

            {/* Buttons */}
            <section>
                <h2 className="text-xl font-semibold text-slate-800 mb-4">🔘 Botones</h2>
                <div className="flex flex-wrap gap-4">
                    <button className="px-6 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors cursor-pointer">
                        Primary Button
                    </button>
                    <button className="px-6 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-slate-700 cursor-pointer">
                        Secondary Button
                    </button>
                    <button className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors cursor-pointer">
                        Danger Button
                    </button>
                    <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors cursor-pointer">
                        Success Button
                    </button>
                    <button className="px-6 py-3 bg-slate-400 text-white rounded-lg cursor-not-allowed opacity-50">
                        Disabled
                    </button>
                </div>
                <div className="flex flex-wrap gap-4 mt-4">
                    <button className="px-4 py-2 text-sm bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors cursor-pointer">
                        Small
                    </button>
                    <button className="px-6 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors cursor-pointer">
                        Medium
                    </button>
                    <button className="px-8 py-4 text-lg bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors cursor-pointer">
                        Large
                    </button>
                </div>
            </section>

            {/* Forms */}
            <section>
                <h2 className="text-xl font-semibold text-slate-800 mb-4">📋 Formularios</h2>
                <div className="bg-white p-6 rounded-lg border space-y-4 max-w-md">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Input de texto</label>
                        <input
                            type="text"
                            placeholder="Escribe algo..."
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-slate-500 outline-none text-slate-900"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Textarea</label>
                        <textarea
                            placeholder="Escribe un mensaje largo..."
                            rows={3}
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-slate-500 outline-none text-slate-900 resize-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select</label>
                        <select className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-slate-500 outline-none text-slate-900 bg-white">
                            <option>Opción 1</option>
                            <option>Opción 2</option>
                            <option>Opción 3</option>
                        </select>
                    </div>
                </div>
            </section>

            {/* Cards */}
            <section>
                <h2 className="text-xl font-semibold text-slate-800 mb-4">🃏 Cards</h2>
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-lg border border-slate-200 hover:border-slate-400 transition-colors">
                        <h3 className="font-semibold text-slate-800 mb-2">Card Simple</h3>
                        <p className="text-slate-600 text-sm">Contenido de ejemplo para mostrar cómo se ve una card básica.</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h3 className="font-semibold text-slate-800 mb-2">Card con Sombra</h3>
                        <p className="text-slate-600 text-sm">Esta card tiene shadow-lg para destacar más.</p>
                    </div>
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-lg text-white">
                        <h3 className="font-semibold mb-2">Card Dark</h3>
                        <p className="text-slate-300 text-sm">Versión oscura con gradiente.</p>
                    </div>
                </div>
            </section>

            {/* Badges */}
            <section>
                <h2 className="text-xl font-semibold text-slate-800 mb-4">🏷️ Badges</h2>
                <div className="flex flex-wrap gap-3">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm">Default</span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">Success</span>
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">Error</span>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">Warning</span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">Info</span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">Purple</span>
                </div>
            </section>

            {/* Alerts */}
            <section>
                <h2 className="text-xl font-semibold text-slate-800 mb-4">⚠️ Alertas</h2>
                <div className="space-y-3">
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                        ✅ Success: Operación completada correctamente.
                    </div>
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        ❌ Error: Algo salió mal. Por favor, inténtalo de nuevo.
                    </div>
                    <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                        ⚠️ Warning: Acción requiere atención.
                    </div>
                    <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
                        ℹ️ Info: Información adicional disponible.
                    </div>
                </div>
            </section>

            {/* Iconos Emoji */}
            <section>
                <h2 className="text-xl font-semibold text-slate-800 mb-4">😀 Iconos (Emoji)</h2>
                <p className="text-slate-600 mb-3">Usamos emojis como iconos para simplicidad:</p>
                <div className="flex flex-wrap gap-4 text-2xl">
                    <span title="Session Note">📝</span>
                    <span title="Audio">🎙️</span>
                    <span title="Document">📄</span>
                    <span title="AI Analysis">🧠</span>
                    <span title="Assessment">📊</span>
                    <span title="Calendar">📅</span>
                    <span title="Patient">👤</span>
                    <span title="Settings">⚙️</span>
                    <span title="Search">🔍</span>
                    <span title="Success">✅</span>
                    <span title="Error">❌</span>
                    <span title="Warning">⚠️</span>
                </div>
            </section>

            {/* Spacing */}
            <section>
                <h2 className="text-xl font-semibold text-slate-800 mb-4">📏 Espaciado</h2>
                <div className="flex gap-2 items-end">
                    {[1, 2, 3, 4, 6, 8, 12, 16].map(size => (
                        <div key={size} className="text-center">
                            <div
                                className="bg-slate-800 rounded"
                                style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
                            />
                            <span className="text-xs text-slate-500 mt-1 block">{size}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Border Radius */}
            <section>
                <h2 className="text-xl font-semibold text-slate-800 mb-4">🔲 Border Radius</h2>
                <div className="flex gap-4">
                    <div className="w-16 h-16 bg-slate-800 rounded-none flex items-center justify-center text-white text-xs">none</div>
                    <div className="w-16 h-16 bg-slate-800 rounded-sm flex items-center justify-center text-white text-xs">sm</div>
                    <div className="w-16 h-16 bg-slate-800 rounded flex items-center justify-center text-white text-xs">default</div>
                    <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center text-white text-xs">lg</div>
                    <div className="w-16 h-16 bg-slate-800 rounded-xl flex items-center justify-center text-white text-xs">xl</div>
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-white text-xs">full</div>
                </div>
            </section>

            {/* Shadows */}
            <section>
                <h2 className="text-xl font-semibold text-slate-800 mb-4">🌑 Sombras</h2>
                <div className="flex gap-6">
                    <div className="w-24 h-24 bg-white shadow-sm flex items-center justify-center rounded-lg text-xs text-slate-500">sm</div>
                    <div className="w-24 h-24 bg-white shadow flex items-center justify-center rounded-lg text-xs text-slate-500">default</div>
                    <div className="w-24 h-24 bg-white shadow-md flex items-center justify-center rounded-lg text-xs text-slate-500">md</div>
                    <div className="w-24 h-24 bg-white shadow-lg flex items-center justify-center rounded-lg text-xs text-slate-500">lg</div>
                    <div className="w-24 h-24 bg-white shadow-xl flex items-center justify-center rounded-lg text-xs text-slate-500">xl</div>
                    <div className="w-24 h-24 bg-white shadow-2xl flex items-center justify-center rounded-lg text-xs text-slate-500">2xl</div>
                </div>
            </section>
        </div>
    );
}
