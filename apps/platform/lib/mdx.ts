import fs from 'fs';
import path from 'path';
import { compileMDX } from 'next-mdx-remote/rsc';

const contentDir = path.join(process.cwd(), 'content/help');

export interface HelpFrontmatter {
  title?: string;
  description?: string;
  icon?: string;
}

/**
 * Get a single help article by locale and slug.
 * Uses process.cwd() for Vercel compatibility.
 */
export async function getHelpPost(locale: string, slug: string) {
  // Try requested locale first, fallback to 'es'
  let filePath = path.join(contentDir, locale, `${slug}.mdx`);
  
  if (!fs.existsSync(filePath)) {
    // Fallback to Spanish
    filePath = path.join(contentDir, 'es', `${slug}.mdx`);
  }
  
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const source = fs.readFileSync(filePath, 'utf8');
  
  try {
    const result = await compileMDX<HelpFrontmatter>({
      source,
      options: { parseFrontmatter: true }
    });
    return result;
  } catch (error) {
    console.error(`Failed to compile MDX for ${slug}:`, error);
    return null;
  }
}

/**
 * Get all available help slugs for a locale.
 */
export function getHelpSlugs(locale: string): string[] {
  // Try requested locale, fallback to 'es'
  let dir = path.join(contentDir, locale);
  
  if (!fs.existsSync(dir)) {
    dir = path.join(contentDir, 'es');
  }
  
  if (!fs.existsSync(dir)) return [];
  
  return fs.readdirSync(dir)
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => file.replace('.mdx', ''));
}

/**
 * Chapter metadata for navigation.
 */
export const HELP_CHAPTERS = [
  { slug: 'primeros-pasos', title: 'Primeros Pasos', icon: '🚀', description: 'Configura tu cuenta en 5 minutos' },
  { slug: 'pacientes', title: 'Pacientes', icon: '👥', description: 'Soul Record y perfiles de pacientes' },
  { slug: 'diario-clinico', title: 'Diario Clínico', icon: '📝', description: 'Notas, audio y análisis IA' },
  { slug: 'formularios', title: 'Formularios', icon: '📋', description: 'Crea y envía formularios' },
  { slug: 'reservas', title: 'Reservas', icon: '📅', description: 'Calendario y servicios' },
  { slug: 'automatizaciones', title: 'Automatizaciones', icon: '⚡', description: 'Playbooks y reglas' },
  { slug: 'whatsapp', title: 'WhatsApp & AletheIA', icon: '💬', description: 'Monitorización y alertas' },
  { slug: 'facturacion', title: 'Facturación', icon: '💳', description: 'Planes y créditos' },
];
