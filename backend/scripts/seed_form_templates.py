"""Seed demo form templates for investor presentation.

Creates 5 form templates:
1. Screening Médico (Psychedelic) - HIGH risk
2. Coordenadas de Nacimiento (Astrology) - LOW risk
3. Check-in Semanal (Coaching) - LOW risk
4. Waiver/Exención (Yoga) - LOW risk
5. Encuesta de Satisfacción (Universal) - LOW risk

Run with:
    docker-compose exec backend python -c "exec(open('scripts/seed_form_templates.py').read())"
"""

import asyncio
import uuid
import sys

# Add /app to sys.path for internal imports
sys.path.insert(0, "/app")

# Form schemas with realistic fields
FORM_TEMPLATES = [
    # ===== 1. SCREENING MÉDICO (PSYCHEDELIC) =====
    {
        "title": "Screening Médico Riguroso",
        "description": "Evaluación de seguridad obligatoria antes de participar en ceremonias con psilocibina. Tu bienestar es nuestra prioridad.",
        "risk_level": "HIGH",
        "therapy_type": "PSYCHEDELIC",
        "form_type": "INTAKE",
        "schema": {
            "fields": [
                {
                    "id": "medication_ssri",
                    "type": "MEDICAL_BOOLEAN",
                    "label": "¿Estás tomando actualmente antidepresivos ISRS (Prozac, Zoloft, Lexapro, etc.)?",
                    "required": True,
                    "risk_flag": True,
                    "risk_reason": "Interacción peligrosa con psilocibina (síndrome serotoninérgico)",
                },
                {
                    "id": "medication_maoi",
                    "type": "MEDICAL_BOOLEAN",
                    "label": "¿Estás tomando inhibidores MAO o medicación para Parkinson?",
                    "required": True,
                    "risk_flag": True,
                    "risk_reason": "Contraindicación absoluta con psilocibina",
                },
                {
                    "id": "history_psychosis",
                    "type": "MEDICAL_BOOLEAN",
                    "label": "¿Tienes historial personal o familiar de psicosis, esquizofrenia o trastorno bipolar tipo I?",
                    "required": True,
                    "risk_flag": True,
                    "risk_reason": "Riesgo de descompensación psicótica",
                },
                {
                    "id": "heart_condition",
                    "type": "MEDICAL_BOOLEAN",
                    "label": "¿Padeces alguna enfermedad cardíaca o hipertensión no controlada?",
                    "required": True,
                    "risk_flag": True,
                    "risk_reason": "Psilocibina puede elevar presión arterial",
                },
                {
                    "id": "pregnancy",
                    "type": "MEDICAL_BOOLEAN",
                    "label": "¿Estás embarazada o en período de lactancia?",
                    "required": True,
                    "risk_flag": True,
                    "risk_reason": "No hay datos de seguridad en embarazo",
                },
                {
                    "id": "mental_health_history",
                    "type": "TEXTAREA",
                    "label": "Describe brevemente tu historial de salud mental (diagnósticos, tratamientos previos, etc.)",
                    "required": True,
                    "placeholder": "Incluye cualquier diagnóstico, medicación actual o pasada, y experiencias relevantes...",
                },
                {
                    "id": "experience_psychedelics",
                    "type": "SELECT",
                    "label": "¿Cuál es tu experiencia previa con sustancias psicodélicas?",
                    "required": True,
                    "options": [
                        {
                            "value": "none",
                            "label": "Ninguna - Esta será mi primera vez",
                        },
                        {"value": "minimal", "label": "Mínima - 1-2 experiencias"},
                        {"value": "moderate", "label": "Moderada - 3-10 experiencias"},
                        {
                            "value": "extensive",
                            "label": "Extensa - Más de 10 experiencias",
                        },
                    ],
                },
                {
                    "id": "intentions",
                    "type": "TEXTAREA",
                    "label": "¿Cuáles son tus intenciones para esta ceremonia?",
                    "required": True,
                    "placeholder": "¿Qué esperas explorar, sanar o comprender?",
                },
                {
                    "id": "emergency_contact",
                    "type": "TEXT",
                    "label": "Contacto de emergencia (nombre y teléfono)",
                    "required": True,
                },
            ],
        },
    },
    # ===== 2. COORDENADAS DE NACIMIENTO (ASTROLOGY) =====
    {
        "title": "Coordenadas de Nacimiento",
        "description": "Para preparar tu lectura de carta natal, necesito tus datos de nacimiento exactos. Cuanto más precisos, mejor será la interpretación.",
        "risk_level": "LOW",
        "therapy_type": "ASTROLOGY",
        "form_type": "PRE_SESSION",
        "schema": {
            "fields": [
                {
                    "id": "birth_date",
                    "type": "DATE",
                    "label": "Fecha de nacimiento",
                    "required": True,
                },
                {
                    "id": "birth_time",
                    "type": "TIME",
                    "label": "Hora de nacimiento (lo más exacta posible)",
                    "required": True,
                    "helper_text": "Puedes consultar tu certificado de nacimiento o preguntar a familiares",
                },
                {
                    "id": "birth_time_accuracy",
                    "type": "SELECT",
                    "label": "¿Qué tan seguro/a estás de la hora?",
                    "required": True,
                    "options": [
                        {
                            "value": "exact",
                            "label": "Exacta (certificado de nacimiento)",
                        },
                        {"value": "approximate", "label": "Aproximada (me lo dijeron)"},
                        {"value": "uncertain", "label": "Incierta (no estoy seguro/a)"},
                    ],
                },
                {
                    "id": "birth_city",
                    "type": "TEXT",
                    "label": "Ciudad de nacimiento",
                    "required": True,
                    "placeholder": "Ej: Barcelona, Madrid, Buenos Aires...",
                },
                {
                    "id": "birth_country",
                    "type": "TEXT",
                    "label": "País de nacimiento",
                    "required": True,
                },
                {
                    "id": "current_focus",
                    "type": "TEXTAREA",
                    "label": "¿Qué áreas de tu vida te gustaría explorar en la lectura?",
                    "required": False,
                    "placeholder": "Amor, carrera, propósito, relaciones familiares...",
                },
            ],
        },
    },
    # ===== 3. CHECK-IN SEMANAL (COACHING) =====
    {
        "title": "Check-in Semanal",
        "description": "Tu reflexión semanal para maximizar el progreso en tu proceso de transformación.",
        "risk_level": "LOW",
        "therapy_type": "GENERAL",
        "form_type": "FEEDBACK",
        "schema": {
            "fields": [
                {
                    "id": "energy_level",
                    "type": "SCALE",
                    "label": "¿Cómo está tu nivel de energía esta semana?",
                    "required": True,
                    "min": 1,
                    "max": 10,
                    "min_label": "Agotado",
                    "max_label": "En mi mejor momento",
                },
                {
                    "id": "goals_progress",
                    "type": "SELECT",
                    "label": "¿Cumpliste los objetivos que acordamos la semana pasada?",
                    "required": True,
                    "options": [
                        {"value": "all", "label": "✅ Sí, todos"},
                        {"value": "most", "label": "🟡 La mayoría"},
                        {"value": "some", "label": "🟠 Algunos"},
                        {"value": "none", "label": "🔴 Ninguno"},
                    ],
                },
                {
                    "id": "biggest_win",
                    "type": "TEXTAREA",
                    "label": "¿Cuál fue tu mayor victoria esta semana?",
                    "required": True,
                    "placeholder": "Puede ser algo grande o pequeño...",
                },
                {
                    "id": "biggest_challenge",
                    "type": "TEXTAREA",
                    "label": "¿Cuál fue tu mayor desafío?",
                    "required": True,
                    "placeholder": "¿Qué te costó más? ¿Qué te frenó?",
                },
                {
                    "id": "insights",
                    "type": "TEXTAREA",
                    "label": "¿Qué aprendiste sobre ti mismo/a esta semana?",
                    "required": False,
                    "placeholder": "Reflexiones, patrones que notaste, revelaciones...",
                },
                {
                    "id": "next_week_focus",
                    "type": "TEXT",
                    "label": "¿En qué te quieres enfocar la próxima semana?",
                    "required": True,
                },
            ],
        },
    },
    # ===== 4. WAIVER/EXENCIÓN (YOGA) =====
    {
        "title": "Exención de Responsabilidad (Waiver)",
        "description": "Documento legal obligatorio antes de participar en clases de yoga. Por favor, léelo con atención.",
        "risk_level": "LOW",
        "therapy_type": "GENERAL",
        "form_type": "INTAKE",
        "schema": {
            "fields": [
                {
                    "id": "health_conditions",
                    "type": "TEXTAREA",
                    "label": "¿Tienes alguna condición médica, lesión o limitación física que debamos conocer?",
                    "required": True,
                    "placeholder": "Lesiones de espalda, rodillas, embarazo, condiciones cardíacas, etc. Escribe 'Ninguna' si no aplica.",
                },
                {
                    "id": "waiver_understanding",
                    "type": "CHECKBOX",
                    "label": "Entiendo que el yoga implica esfuerzo físico y que participo bajo mi propia responsabilidad",
                    "required": True,
                },
                {
                    "id": "waiver_injuries",
                    "type": "CHECKBOX",
                    "label": "Me comprometo a informar al instructor de cualquier lesión o incomodidad durante la clase",
                    "required": True,
                },
                {
                    "id": "waiver_liability",
                    "type": "CHECKBOX",
                    "label": "Eximo al estudio Urban Om y sus instructores de responsabilidad por lesiones que puedan ocurrir durante la práctica",
                    "required": True,
                },
                {
                    "id": "photo_consent",
                    "type": "SELECT",
                    "label": "¿Autorizas el uso de fotografías de las clases en redes sociales?",
                    "required": True,
                    "options": [
                        {"value": "yes", "label": "Sí, autorizo"},
                        {"value": "no", "label": "No, prefiero no aparecer"},
                    ],
                },
                {
                    "id": "signature",
                    "type": "TEXT",
                    "label": "Nombre completo (como firma digital)",
                    "required": True,
                    "placeholder": "Escribe tu nombre completo",
                },
                {
                    "id": "signature_date",
                    "type": "DATE",
                    "label": "Fecha de firma",
                    "required": True,
                },
            ],
        },
    },
    # ===== 5. ENCUESTA DE SATISFACCIÓN (UNIVERSAL) =====
    {
        "title": "Encuesta de Satisfacción",
        "description": "Tu feedback es muy valioso para seguir mejorando. ¡Gracias por tomarte un momento!",
        "risk_level": "LOW",
        "therapy_type": "GENERAL",
        "form_type": "POST_SESSION",
        "schema": {
            "fields": [
                {
                    "id": "overall_rating",
                    "type": "SCALE",
                    "label": "¿Cómo calificarías tu experiencia general?",
                    "required": True,
                    "min": 1,
                    "max": 5,
                    "min_label": "Muy insatisfecho",
                    "max_label": "Muy satisfecho",
                },
                {
                    "id": "expectations_met",
                    "type": "SELECT",
                    "label": "¿Se cumplieron tus expectativas?",
                    "required": True,
                    "options": [
                        {"value": "exceeded", "label": "🌟 Superadas"},
                        {"value": "met", "label": "✅ Cumplidas"},
                        {"value": "partially", "label": "🟡 Parcialmente"},
                        {"value": "not_met", "label": "🔴 No cumplidas"},
                    ],
                },
                {
                    "id": "most_valuable",
                    "type": "TEXTAREA",
                    "label": "¿Qué fue lo más valioso de la experiencia?",
                    "required": False,
                    "placeholder": "Lo que más te impactó, ayudó o gustó...",
                },
                {
                    "id": "improvement_suggestions",
                    "type": "TEXTAREA",
                    "label": "¿Qué podríamos mejorar?",
                    "required": False,
                    "placeholder": "Cualquier sugerencia es bienvenida...",
                },
                {
                    "id": "would_recommend",
                    "type": "SELECT",
                    "label": "¿Recomendarías este servicio a un amigo o familiar?",
                    "required": True,
                    "options": [
                        {"value": "definitely", "label": "Definitivamente sí"},
                        {"value": "probably", "label": "Probablemente sí"},
                        {"value": "not_sure", "label": "No estoy seguro/a"},
                        {"value": "no", "label": "Probablemente no"},
                    ],
                },
                {
                    "id": "testimonial",
                    "type": "TEXTAREA",
                    "label": "¿Te gustaría dejar un testimonial que podamos compartir? (opcional)",
                    "required": False,
                    "placeholder": "Si prefieres mantenerlo privado, déjalo en blanco",
                },
            ],
        },
    },
    # ===== 6. CHEQUEO DE BIENESTAR EMOCIONAL (LEAD MAGNET) =====
    {
        "title": "Chequeo de Bienestar Emocional",
        "description": "¿Cómo te sientes hoy? Tómate 2 minutos para descubrir tu nivel actual de bienestar y recibe consejos personalizados.",
        "risk_level": "LOW",
        "therapy_type": "GENERAL",
        "form_type": "INTAKE",
        "target_entity": "LEAD",
        "public_token": "bienestar-check",
        "schema": {
            "fields": [
                {
                    "id": "name",
                    "type": "TEXT",
                    "label": "¿Cómo te llamas?",
                    "required": True,
                    "placeholder": "Tu nombre",
                },
                {
                    "id": "email",
                    "type": "EMAIL",
                    "label": "Tu mejor Email",
                    "required": True,
                    "placeholder": "tu@email.com",
                },
                {
                    "id": "whatsapp",
                    "type": "TEXT",
                    "label": "WhatsApp (opcional, para enviarte el resultado)",
                    "required": False,
                    "placeholder": "+34...",
                },
                {
                    "id": "main_concern",
                    "type": "SELECT",
                    "label": "¿Qué es lo que más te preocupa hoy?",
                    "required": True,
                    "options": [
                        {"value": "anxiety", "label": "Ansiedad / Estrés"},
                        {"value": "relationships", "label": "Relaciones / Pareja"},
                        {"value": "work", "label": "Trabajo / Propósito"},
                        {"value": "other", "label": "Otro"},
                    ],
                },
                {
                    "id": "urgency",
                    "type": "SCALE",
                    "label": "Nivel de urgencia (1 = Solo curiosidad, 10 = Necesito ayuda ya)",
                    "required": True,
                    "min": 1,
                    "max": 10,
                },
            ],
        },
    },
]


async def main():
    from sqlalchemy import select, text
    from app.db.base import AsyncSessionLocal
    from app.db.models import FormTemplate, User, RiskLevel, TherapyType, FormType

    async with AsyncSessionLocal() as db:
        # Find admin organization
        result = await db.execute(
            select(User).where(User.email == "humbert.torroella@gmail.com")
        )
        admin = result.scalar_one_or_none()

        if not admin:
            print("❌ Admin not found!")
            return

        org_id = admin.organization_id
        print(f"📝 Creating form templates for org: {org_id}")
        print()

        created = 0
        updated = 0

        for tpl_data in FORM_TEMPLATES:
            # Check if exists
            existing = await db.execute(
                select(FormTemplate).where(
                    FormTemplate.title == tpl_data["title"],
                    FormTemplate.organization_id == org_id,
                )
            )
            template = existing.scalar_one_or_none()

            risk_level = RiskLevel[tpl_data["risk_level"]]
            therapy_type = TherapyType[tpl_data["therapy_type"]]
            form_type = FormType[tpl_data["form_type"]]

            if template:
                # Update existing
                template.description = tpl_data["description"]
                template.schema = tpl_data["schema"]
                template.risk_level = risk_level
                template.therapy_type = therapy_type
                template.form_type = form_type
                template.target_entity = tpl_data.get("target_entity", "PATIENT")
                template.public_token = tpl_data.get("public_token")
                updated += 1
                print(f"📝 Updated: {tpl_data['title']}")
            else:
                # Create new
                template = FormTemplate(
                    organization_id=org_id,
                    title=tpl_data["title"],
                    description=tpl_data["description"],
                    schema=tpl_data["schema"],
                    risk_level=risk_level,
                    therapy_type=therapy_type,
                    form_type=form_type,
                    target_entity=tpl_data.get("target_entity", "PATIENT"),
                    public_token=tpl_data.get("public_token"),
                    is_active=True,
                )
                db.add(template)
                created += 1
                print(f"✅ Created: {tpl_data['title']}")

            print(
                f"   Type: {tpl_data['form_type']} | Risk: {tpl_data['risk_level']} | Fields: {len(tpl_data['schema']['fields'])}"
            )

        await db.commit()

        print()
        print("=" * 50)
        print(f"🎉 FORM TEMPLATES READY!")
        print(f"   Created: {created}")
        print(f"   Updated: {updated}")
        print()
        print("📋 Summary:")
        print("   1. Screening Médico Riguroso (PSYCHEDELIC, HIGH)")
        print("   2. Coordenadas de Nacimiento (HOLISTIC, LOW)")
        print("   3. Check-in Semanal (GENERAL, LOW)")
        print("   4. Exención/Waiver (GENERAL, LOW)")
        print("   5. Encuesta de Satisfacción (GENERAL, LOW)")


if __name__ == "__main__":
    asyncio.run(main())
