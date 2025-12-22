import '../globals.css';

export const metadata = {
    title: 'TherapistOS - Sistema Operativo para Terapia Psicodélica',
    description: 'El primer SO diseñado para la realidad clínica de la terapia psicodélica. Gestiona preparación, dosificación e integración con AletheIA.',
};

export default function LandingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="es">
            <body className="antialiased">{children}</body>
        </html>
    );
}
