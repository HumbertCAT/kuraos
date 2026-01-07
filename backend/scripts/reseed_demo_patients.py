"""
DEMO PATIENT RESEED: Light Version
==================================
Rebuilds ONLY the 4 demo archetypes (Marcus, Elena, Julian, Sarah)
without touching real patient data, bookings, or other org data.

Safe to run in development without losing your real work.

Run with:
    docker-compose exec backend python scripts/reseed_demo_patients.py
"""

import asyncio
import sys
import uuid
import random
from datetime import datetime, timedelta
from sqlalchemy import select, text

# Add parent to path
sys.path.insert(0, "/app")

from app.db.base import get_session_factory
from app.db.models import (
    User,
    Organization,
    Patient,
    JourneyLog,
    JourneyTemplate,
    Booking,
    ServiceType,
    ClinicalEntry,
    MessageLog,
    DailyConversationAnalysis,
    BookingStatus,
    FormTemplate,
    SystemSetting,
    PrivacyTier,
)

# --- SYSTEM SETTINGS (Global Configuration) ---
# These are seeded to ensure demo environment has consistent settings
SEED_SYSTEM_SETTINGS = [
    # AI Model default
    ("AI_MODEL", "gemini-2.5-flash", "Default AI model"),
    # Tier patient limits (v1.1.8 naming)
    ("TIER_USERS_LIMIT_BUILDER", 3, "Max active patients for BUILDER tier"),
    ("TIER_USERS_LIMIT_PRO", 50, "Max active patients for PRO tier"),
    ("TIER_USERS_LIMIT_CENTER", 150, "Max active patients for CENTER tier"),
    # Tier Stripe commission fees
    ("TIER_STRIPE_FEE_BUILDER", 0.05, "Stripe commission rate for BUILDER tier (5%)"),
    ("TIER_STRIPE_FEE_PRO", 0.02, "Stripe commission rate for PRO tier (2%)"),
    ("TIER_STRIPE_FEE_CENTER", 0.01, "Stripe commission rate for CENTER tier (1%)"),
    # Tier AI credits
    ("TIER_AI_CREDITS_BUILDER", 100, "Monthly AI credits for BUILDER tier"),
    ("TIER_AI_CREDITS_PRO", 500, "Monthly AI credits for PRO tier"),
    ("TIER_AI_CREDITS_CENTER", 2000, "Monthly AI credits for CENTER tier"),
]

# --- DATA DEFINITIONS (FROM ANALYST) ---

# Deterministic IDs for the Demo (So Frontend Mocks work)
DEMO_IDS = {
    "marcus": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "elena": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12",
    "julian": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13",
    "sarah": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14",
}

# Premium Avatars (Unsplash high-quality)
DEMO_AVATARS = {
    "marcus": "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop",
    "elena": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop",
    "julian": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    "sarah": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop",
}

SEED_SERVICES = [
    {
        "title": "The Sovereign Mind: Leadership Immersion",
        "description": "7-day intensive psilocybin-assisted protocol for high-performance executives. Includes medical screening, prep, and integration.",
        "price": 4800.00,
        "currency": "EUR",
        "duration_minutes": 480,
        "kind": "GROUP",
        "scheduling_type": "FIXED_DATE",
        "is_active": True,
    },
    {
        "title": "Architects' Circle: Integration Mastermind",
        "description": "Monthly recurring membership for post-retreat integration. Bi-weekly group circles and async support.",
        "price": 350.00,
        "currency": "EUR",
        "duration_minutes": 90,
        "kind": "GROUP",
        "scheduling_type": "CALENDAR",
        "is_active": True,
    },
    {
        "title": "Strategic Neuro-Repatterning",
        "description": "High-precision 1:1 strategy session. Focus on somatic blockage release and cognitive restructuring.",
        "price": 500.00,
        "currency": "EUR",
        "duration_minutes": 60,
        "kind": "ONE_ON_ONE",
        "scheduling_type": "CALENDAR",
        "is_active": True,
    },
]

# Premium Journey Templates (Conscious Luxury naming)
SEED_JOURNEYS = [
    {
        "key": "retreat_ibiza",
        "name": "The Sovereign Mind Protocol",
        "allowed_stages": [
            "APPLICATION",
            "SCREENING",
            "PREPARATION",
            "IMMERSION",
            "INTEGRATION",
            "ALUMNI",
        ],
        "initial_stage": "APPLICATION",
    },
    {
        "key": "architects_circle",
        "name": "Architects' Circle Membership",
        "allowed_stages": ["ONBOARDING", "ACTIVE_MEMBER", "ALUMNI"],
        "initial_stage": "ONBOARDING",
    },
    {
        "key": "neuro_repatterning",
        "name": "Neuro-Repatterning Strategy",
        "allowed_stages": ["DISCOVERY", "AWAITING_PAYMENT", "CONFIRMED", "COMPLETED"],
        "initial_stage": "DISCOVERY",
    },
]

# Luxury Forms (Executive branding)
SEED_FORMS = [
    {
        "title": "Executive Neuro-Assessment (Medical)",
        "description": "Comprehensive medical screening for high-performance protocol eligibility.",
        "form_type": "INTAKE",
        "schema": {
            "fields": [
                {
                    "id": "medications",
                    "type": "textarea",
                    "label": "Current Medications",
                }
            ]
        },
    },
    {
        "title": "Leadership Intentions Framework",
        "description": "Strategic intention-setting for executive transformation journeys.",
        "form_type": "PRE_SESSION",
        "schema": {
            "fields": [
                {"id": "intention", "type": "textarea", "label": "Primary Intention"}
            ]
        },
    },
]

SEED_PATIENTS = [
    # ARCHETYPE A: "THE WHALE" (Marcus Thorne)
    {
        "first_name": "Marcus",
        "last_name": "Thorne",
        "email": "m.thorne@venture-capital.example.com",
        "journey_key": "retreat_ibiza",
        "journey_status": "PREPARATION",
        "clinical_entry": {
            "title": "Initial Intake: Executive Burnout Assessment",
            "content": """
            <p><strong>Subjective:</strong> Client is a 45-year-old CEO of a Series B Fintech. Reports severe <em>"decision fatigue"</em> and chronic dissociation during board meetings. Sleep efficiency is <50% (Oura data reviewed). Expresses a loss of connection to his founding purpose.</p>
            <p><strong>Objective:</strong> Hyper-vigilant posture. Speech is rapid and pressured. Biomarkers indicate elevated cortisol baseline. No history of psychosis.</p>
            <p><strong>Assessment:</strong> Classic High-Functioning Burnout / Existential Distress. Good candidate for psilocybin protocol, focusing on <em>"ego dissolution"</em> and reconnection with core values.</p>
            <p><strong>Plan:</strong> Proceed with preparation phase. Focus on nervous system regulation before immersion.</p>
            """,
            "entry_type": "NOTE",
        },
        "whatsapp_history": [
            {
                "direction": "INBOUND",
                "text": "I'm frankly terrified that this will impact my ability to lead next week.",
                "days_ago": 5,
            },
            {
                "direction": "OUTBOUND",
                "text": "Marcus, valid concern. The protocol is designed to enhance clarity, not cloud it. Let's discuss safety protocols.",
                "days_ago": 5,
            },
            {
                "direction": "INBOUND",
                "text": "Okay, the data you sent helps. I'm ready to proceed.",
                "days_ago": 2,
            },
        ],
    },
    # ARCHETYPE B: "THE RED FLAG" (Elena Velázquez)
    {
        "first_name": "Elena",
        "last_name": "Velázquez",
        "email": "elena.art@design.example.com",
        "journey_key": "retreat_ibiza",
        "journey_status": "BLOCKED_MEDICAL",
        "clinical_entry": {
            "title": "🛡️ SYSTEM ALERT: SAFETY PROTOCOL ACTIVATED",
            "content": "<strong>AUTOMATIC BLOCK:</strong> Patient reported active use of Lithium. This is a fatal contraindication for Psilocybin (Risk of Seizures). Admin notification sent. Refund processed if applicable.",
            "entry_type": "AI_ANALYSIS",
        },
    },
    # ARCHETYPE C: "THE GHOST" (Julian Soler) - Demonstrates privacy override
    {
        "first_name": "Julian",
        "last_name": "Soler",
        "email": "julian.creative@agency.example.com",
        "journey_key": "neuro_repatterning",
        "journey_status": "AWAITING_PAYMENT",
        "ghost_mode": True,  # Special flag for stale date
        "privacy_tier_override": PrivacyTier.GHOST,  # v1.5.2: Cortex privacy demo
    },
    # ARCHETYPE D: "THE SUCCESS STORY" (Sarah Jenkins)
    {
        "first_name": "Sarah",
        "last_name": "Jenkins",
        "email": "sarah.j@foundation.example.org",
        "journey_key": "architects_circle",
        "journey_status": "ACTIVE_MEMBER",
        "clinical_entry": {
            "title": "Graduation Summary: 6-Month Arc",
            "content": """
            <p><strong>Outcome Analysis:</strong> Sarah has successfully transitioned from acute trauma processing to post-traumatic growth. The 'Architects Circle' membership is serving as a stabilization container.</p>
            <p><strong>Key Metrics:</strong> GAD-7 score reduced from 18 (Severe) to 4 (Minimal). Self-reported sense of agency is 9/10.</p>
            <p><strong>Next Steps:</strong> Recommended moving to quarterly maintenance sessions. She has referred 3 new CEO candidates (High LTV).</p>
            """,
            "entry_type": "NOTE",
        },
    },
]


async def wipe_demo_patients_only(db, org_id):
    """Delete ONLY the 4 demo patients and their related data.

    This preserves:
    - Real patients you've added
    - Journey templates
    - Form templates
    - Service types
    - System settings
    """
    print("\n🎯 TARGETED CLEANUP: Demo Patients Only...")

    # Get the 4 demo patient IDs
    demo_ids = list(DEMO_IDS.values())
    demo_ids_str = ",".join([f"'{id}'" for id in demo_ids])

    # Delete related data for demo patients only
    cleanup_queries = [
        f"DELETE FROM daily_conversation_analyses WHERE patient_id IN ({demo_ids_str})",
        f"DELETE FROM message_logs WHERE patient_id IN ({demo_ids_str})",
        f"DELETE FROM bookings WHERE patient_id IN ({demo_ids_str})",
        f"DELETE FROM journey_logs WHERE patient_id IN ({demo_ids_str})",
        f"DELETE FROM clinical_entries WHERE patient_id IN ({demo_ids_str})",
        f"DELETE FROM ai_usage_logs WHERE patient_id IN ({demo_ids_str})",
        f"DELETE FROM form_assignments WHERE patient_id IN ({demo_ids_str})",
        f"DELETE FROM patients WHERE id IN ({demo_ids_str})",
    ]

    for sql in cleanup_queries:
        try:
            await db.execute(text(sql))
        except Exception as e:
            print(f"   ⚠️ Skipped: {sql[:60]}...")

    print("🗑️  Demo patients cleared (real data preserved).")


async def seed_system_settings(db):
    """Seed all system_settings with global configuration values."""
    print("\n⚙️  CONFIGURING SYSTEM SETTINGS...")

    for key, value, description in SEED_SYSTEM_SETTINGS:
        # Check if setting exists
        existing = await db.execute(
            select(SystemSetting).where(SystemSetting.key == key)
        )
        setting = existing.scalar_one_or_none()

        if setting:
            # Update existing
            setting.value = value
            setting.description = description
        else:
            # Create new
            new_setting = SystemSetting(
                key=key,
                value=value,
                description=description,
            )
            db.add(new_setting)

        print(f"   ✓ {key} = {value}")

    await db.flush()
    print(f"   ✅ {len(SEED_SYSTEM_SETTINGS)} System Settings configured")


async def seed_services(db, org_id):
    print("\n🏗️  REBUILDING PREMIUM INFRASTRUCTURE...")
    service_map = {}
    for s in SEED_SERVICES:
        svc = ServiceType(
            organization_id=org_id,
            title=s["title"],
            description=s["description"],
            duration_minutes=s["duration_minutes"],
            price=s["price"],
            currency=s["currency"],
            kind=s["kind"],
            scheduling_type=s["scheduling_type"],
            is_active=s["is_active"],
        )
        db.add(svc)
        await db.flush()
        # Map by simplified key for booking logic
        key = (
            "retreat"
            if "Sovereign" in s["title"]
            else ("circle" if "Circle" in s["title"] else "neuro")
        )
        service_map[key] = svc
    print(f"   ✅ {len(SEED_SERVICES)} Premium Services created")
    return service_map


async def seed_journeys(db, org_id):
    """Create premium journey templates with Conscious Luxury naming."""
    print("\n🗺️  DEFINING JOURNEY ARCHETYPES...")
    for j in SEED_JOURNEYS:
        journey = JourneyTemplate(
            organization_id=org_id,
            name=j["name"],
            key=j["key"],
            allowed_stages=j["allowed_stages"],
            initial_stage=j["initial_stage"],
            is_active=True,
        )
        db.add(journey)
    await db.flush()
    print(f"   ✅ {len(SEED_JOURNEYS)} Premium Journeys defined")


async def seed_forms(db, org_id):
    """Create luxury forms with executive branding."""
    print("\n📝 CRAFTING LUXURY FORMS...")
    for f in SEED_FORMS:
        form = FormTemplate(
            organization_id=org_id,
            title=f["title"],
            description=f["description"],
            form_type=f["form_type"],
            schema=f["schema"],
            is_active=True,
        )
        db.add(form)
    await db.flush()
    print(f"   ✅ {len(SEED_FORMS)} Executive Forms crafted")


async def seed_monitoring_data(db, org_id, patient_id, patient_name, trend="growth"):
    """Generate 7 days of DailyConversationAnalysis for Sentinel Pulse visualization.

    Args:
        trend: "growth" (Marcus: -0.4 → +0.8) or "crisis" (future Javier: +0.5 → -0.6)
    """
    print(f"   📊 Seeding monitoring data for {patient_name} ({trend} trend)...")

    # Generate sentiment progression
    if trend == "growth":
        sentiments = [-0.4, -0.2, 0.1, 0.3, 0.5, 0.7, 0.8]
        states = [
            "Ansioso",
            "Reflexivo",
            "Esperanzado",
            "Optimista",
            "Claro",
            "Motivado",
            "Enfocado",
        ]
        summaries = [
            "Paciente reporta ansiedad pre-retiro. Dificultad para dormir.",
            "Reflexionando sobre intenciones. Disminuye la ansiedad.",
            "Sesión de preparación efectiva. Paciente reporta claridad emergente.",
            "Optimismo creciente. Conexión con propósito fundacional.",
            "Estado estable. Practicando técnicas de enraizamiento.",
            "Motivación alta. Lee materiales de integración proactivamente.",
            "Listo para inmersión. Confianza en el proceso.",
        ]
        risk_flags = [["Insomnio Severo"], [], [], [], [], [], []]
        suggestions = [
            "Recomendar técnicas de enraizamiento antes de dormir",
            None,
            None,
            None,
            None,
            None,
            "Confirmar detalles logísticos del retiro",
        ]
    else:  # crisis
        sentiments = [0.5, 0.2, 0.0, -0.2, -0.4, -0.5, -0.6]
        states = [
            "Motivado",
            "Pensativo",
            "Neutral",
            "Preocupado",
            "Ansioso",
            "Aislado",
            "Crisis",
        ]
        summaries = [
            "Paciente motivado. Esperando confirmación de pago.",
            "Silencio después de reminder de pago. Menos actividad.",
            "Respuesta breve. Menciona 'dificultades financieras'.",
            "Preocupación por no poder completar programa. Tono derrotista.",
            "Evita responder llamadas. Mensajes cortos y evasivos.",
            "Aislamiento social aumentado. Menciona 'no merezco esto'.",
            "Ideación negativa persistente. Requiere intervención inmediata.",
        ]
        risk_flags = [
            [],
            [],
            ["Estrés Financiero"],
            ["Baja Autoestima"],
            ["Aislamiento"],
            ["Aislamiento", "Ideación Negativa"],
            ["Ideación Negativa", "Crisis Inminente"],
        ]
        suggestions = [
            None,
            "Enviar reminder amable sobre opciones de pago",
            "Ofrecer plan de pago alternativo",
            "Llamada de check-in recomendada",
            "Intervención urgente. Contactar hoy.",
            "Alerta crítica. Coordinar con equipo de crisis.",
            "ACCIÓN INMEDIATA: Llamar ahora. Evaluar seguridad.",
        ]

    # Create 7 days of analyses
    for i in range(7):
        days_ago = 6 - i  # 6 days ago → today
        analysis = DailyConversationAnalysis(
            organization_id=org_id,
            patient_id=patient_id,
            date=datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            - timedelta(days=days_ago),
            summary=summaries[i],
            sentiment_score=sentiments[i],
            emotional_state=states[i],
            risk_flags=risk_flags[i],
            suggestion=suggestions[i],
            message_count=random.randint(2, 12),
        )
        db.add(analysis)

    # CRITICAL FIX: Sync Patient.last_insight_json to match monitoring data
    # This ensures Pulse (center) and Observatory (sidebar) show coherent data
    # SCHEMA MUST MATCH PatientInsightsResponse (using snake_case for DB storage)
    from sqlalchemy import select

    patient_result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = patient_result.scalar_one()

    # Update patient cache with latest sentiment
    final_sentiment = sentiments[-1]

    if trend == "growth":
        patient.last_insight_json = {
            "summary": "Paciente muestra una recuperación excepcional. Sentimiento positivo sostenido en comunicaciones recientes.",
            "alerts": [],  # No alerts for growth
            "suggestions": ["Mantener la frecuencia de seguimiento actual."],
            "engagement_score": 95,
            "risk_level": "low",
            "risk_score": final_sentiment,
            "key_themes": ["Breakthrough", "Claridad", "Liderazgo"],
            "last_analysis": datetime.utcnow().isoformat(),
        }
    else:  # crisis
        patient.last_insight_json = {
            "summary": "ALERTA: Descenso agudo en el estado emocional detectado vía WhatsApp. Patrones de evitación y estrés financiero severo.",
            "alerts": [
                {"type": "critical", "message": "Ideación Negativa detectada"},
                {"type": "warning", "message": "Crisis Inminente - Evaluar seguridad"},
            ],
            "suggestions": ["ACCIÓN INMEDIATA: Llamar ahora. Evaluar seguridad."],
            "engagement_score": 20,
            "risk_level": "high",
            "risk_score": final_sentiment,
            "key_themes": ["Crisis Financiera", "Aislamiento", "Riesgo de Fuga"],
            "last_analysis": datetime.utcnow().isoformat(),
        }

    patient.last_insight_at = datetime.utcnow()
    db.add(patient)

    print(f"      ✅ 7 days of monitoring data created")


async def seed_patients(db, org_id, service_map, therapist_id):
    print("\n🧬 SEEDING ARCHETYPES...")

    for p_data in SEED_PATIENTS:
        # Get deterministic ID and avatar
        name_key = p_data["first_name"].lower()
        patient_id = uuid.UUID(DEMO_IDS.get(name_key, str(uuid.uuid4())))
        avatar_url = DEMO_AVATARS.get(name_key, f"/demo-avatars/{name_key}.png")

        # Create Patient
        patient = Patient(
            id=patient_id,
            organization_id=org_id,
            first_name=p_data["first_name"],
            last_name=p_data["last_name"],
            email=p_data["email"],
            journey_status={p_data["journey_key"]: p_data["journey_status"]},
            profile_image_url=avatar_url,
            privacy_tier_override=p_data.get("privacy_tier_override"),  # v1.5.2 Cortex
        )
        db.add(patient)
        await db.flush()

        # Journey Log - with fake history for Timeline visualization
        if p_data["first_name"] == "Sarah":
            # Sarah: 6-month arc with two journey points
            log_onboard = JourneyLog(
                patient_id=patient.id,
                journey_key=p_data["journey_key"],
                to_stage="ONBOARDING",
                changed_at=datetime.utcnow() - timedelta(days=180),  # 6 months ago
            )
            db.add(log_onboard)
            log_active = JourneyLog(
                patient_id=patient.id,
                journey_key=p_data["journey_key"],
                to_stage="ACTIVE_MEMBER",
                changed_at=datetime.utcnow() - timedelta(days=30),  # 1 month ago
            )
            db.add(log_active)
        elif p_data["first_name"] == "Marcus":
            # Marcus: The Whale - 1 month journey (APPLICATION → PREPARATION)
            log_app = JourneyLog(
                patient_id=patient.id,
                journey_key=p_data["journey_key"],
                to_stage="APPLICATION",
                changed_at=datetime.utcnow() - timedelta(days=30),  # 1 month ago
            )
            db.add(log_app)
            log_prep = JourneyLog(
                patient_id=patient.id,
                journey_key=p_data["journey_key"],
                to_stage="PREPARATION",
                changed_at=datetime.utcnow() - timedelta(hours=5),  # 5 hours ago
            )
            db.add(log_prep)
        else:
            # Default: single journey log
            log = JourneyLog(
                patient_id=patient.id,
                journey_key=p_data["journey_key"],
                to_stage=p_data["journey_status"],
                changed_at=datetime.utcnow()
                - timedelta(hours=50 if p_data.get("ghost_mode") else 2),
            )
            db.add(log)

        # Clinical Entry (Note/Alert)
        if "clinical_entry" in p_data:
            entry_data = p_data["clinical_entry"]
            entry = ClinicalEntry(
                patient_id=patient.id,
                author_id=therapist_id,
                entry_type="SESSION_NOTE",
                content=entry_data["content"],
                entry_metadata={"title": entry_data["title"]},
            )
            db.add(entry)

        # WhatsApp History (for Marcus)
        if "whatsapp_history" in p_data:
            for msg in p_data["whatsapp_history"]:
                m = MessageLog(
                    organization_id=org_id,
                    patient_id=patient.id,
                    direction=msg["direction"],
                    content=msg["text"],
                    timestamp=datetime.utcnow() - timedelta(days=msg["days_ago"]),
                    provider_id=f"seed_{uuid.uuid4()}",
                    status="DELIVERED",
                )
                db.add(m)

        # Ghost Concierge: Add automation follow-up message for Julian
        if p_data.get("ghost_mode"):
            concierge_msg = MessageLog(
                organization_id=org_id,
                patient_id=patient.id,
                direction="OUTBOUND",
                content="[Agente Concierge] Detectamos que tu reserva está pendiente. ¿Necesitas ayuda para completarla? Responde AYUDA para asistencia.",
                timestamp=datetime.utcnow() - timedelta(hours=12),
                provider_id=f"automation_concierge_{uuid.uuid4()}",
                status="DELIVERED",
            )
            db.add(concierge_msg)

        # Booking Logic (Simplified)
        if p_data["journey_status"] in ["PREPARATION", "ACTIVE_MEMBER"]:
            # Find service
            svc_key = "retreat" if "retreat" in p_data["journey_key"] else "circle"
            svc = service_map.get(svc_key)
            if svc:
                booking = Booking(
                    organization_id=org_id,
                    patient_id=patient.id,
                    service_type_id=svc.id,
                    therapist_id=therapist_id,
                    start_time=datetime.utcnow() + timedelta(days=3),
                    end_time=datetime.utcnow()
                    + timedelta(days=3, minutes=svc.duration_minutes),
                    status=BookingStatus.CONFIRMED,
                    amount_paid=svc.price,
                    currency="EUR",
                )
                db.add(booking)

        # MONITORING DATA SEEDING (Marcus = growth, Julian = crisis)
        if p_data["first_name"] == "Marcus":
            await seed_monitoring_data(
                db, org_id, patient.id, "Marcus Thorne", trend="growth"
            )
        elif p_data["first_name"] == "Julian":
            await seed_monitoring_data(
                db, org_id, patient.id, "Julian Soler", trend="crisis"
            )

        print(
            f"   👤 Created: {p_data['first_name']} {p_data['last_name']} ({p_data['journey_status']})"
        )


async def main():
    session_factory = get_session_factory()
    async with session_factory() as db:
        # Identify Admin
        result = await db.execute(
            select(User).where(User.email == "humbert.torroella@gmail.com")
        )
        admin = result.scalar_one_or_none()

        if not admin:
            print("❌ Admin 'humbert.torroella@gmail.com' NOT FOUND. Abort.")
            return

        org_id = admin.organization_id
        print(f"🔱 ADMIN RECOGNIZED: {admin.full_name}")

        # Light wipe: ONLY demo patients (preserves real data)
        await wipe_demo_patients_only(db, org_id)

        # Get existing services (don't recreate them)
        result = await db.execute(
            select(ServiceType).where(ServiceType.organization_id == org_id)
        )
        existing_services = result.scalars().all()

        # Build service map from existing
        service_map = {}
        for svc in existing_services:
            if "Sovereign" in svc.title:
                service_map["retreat"] = svc
            elif "Circle" in svc.title:
                service_map["circle"] = svc
            elif "Neuro" in svc.title or "Strategic" in svc.title:
                service_map["neuro"] = svc

        # Seed only the 4 demo patients
        await seed_patients(db, org_id, service_map, admin.id)

        await db.commit()
        print("\n✨ DEMO RESEED COMPLETE. 4 archetypes ready.")


if __name__ == "__main__":
    asyncio.run(main())
