import { Metadata } from 'next';
import '../../globals.css';

export const metadata: Metadata = {
    title: 'Psychedelic.TherapyOS - Investor Pitch',
    description: 'Sistema Operativo de Seguridad Clínica para el Renacimiento Psicodélico',
};

export default function PitchLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="es">
            <body className="antialiased">
                {children}
            </body>
        </html>
    );
}
