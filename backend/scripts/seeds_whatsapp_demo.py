#!/usr/bin/env python3
"""
Demo Seeding Script: WhatsApp Monitoring for Javier Roca

This script generates realistic fake data for the "Invisible Ear" demo:
- 7 days of WhatsApp messages
- Sentiment declining from 0.5 to -0.6
- Risk flags appearing on the final day

Usage:
    docker-compose exec backend python scripts/seeds_whatsapp_demo.py
"""

import asyncio
import random
from datetime import datetime, timedelta
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

# Import from app
import sys

sys.path.insert(0, "/app")

from app.db.base import AsyncSessionLocal
from app.db.models import (
    Patient,
    MessageLog,
    DailyConversationAnalysis,
    MessageDirection,
)


# Demo conversation snippets - declining sentiment over 7 days
DEMO_CONVERSATIONS = [
    # Day -6 (oldest): Positive, post-session glow
    {
        "sentiment": 0.5,
        "emotional_state": "Esperanzado",
        "risk_flags": [],
        "messages": [
            (
                "INBOUND",
                "Buenos días! La sesión del fin de semana fue increíble. Me siento muy conectado.",
            ),
            ("OUTBOUND", "Me alegra mucho leer eso, Javier. ¿Cómo has dormido?"),
            ("INBOUND", "Muy bien, casi 8 horas. Hace tiempo que no dormía así."),
        ],
        "summary": "Paciente reporta bienestar post-sesión. Sueño reparador. Estado emocional positivo.",
        "suggestion": "Continuar con journaling para integración.",
    },
    # Day -5: Still positive but starting to process
    {
        "sentiment": 0.35,
        "emotional_state": "Reflexivo",
        "risk_flags": [],
        "messages": [
            (
                "INBOUND",
                "Hoy he tenido algunos recuerdos de infancia. Me puse a llorar en el trabajo.",
            ),
            (
                "OUTBOUND",
                "Es completamente normal. El proceso de integración mueve cosas profundas.",
            ),
            ("INBOUND", "Sí, me sentí un poco vulnerable pero también liberado."),
        ],
        "summary": "Procesamiento emocional activo. Emergencia de material de infancia. Paciente maneja bien la vulnerabilidad.",
        "suggestion": "Validar la normalidad del proceso. Sugerir técnicas de grounding.",
    },
    # Day -4: Neutral, some difficulty
    {
        "sentiment": 0.1,
        "emotional_state": "Cansado",
        "risk_flags": [],
        "messages": [
            ("INBOUND", "No he dormido muy bien anoche. Muchos sueños intensos."),
            (
                "OUTBOUND",
                "Los sueños vívidos son comunes en integración. ¿Qué temas aparecían?",
            ),
            ("INBOUND", "Mi padre, sobre todo. Cosas que nunca hablamos."),
        ],
        "summary": "Insomnio leve por actividad onírica. Procesando relación paterna. Sin indicadores de riesgo.",
        "suggestion": "Considerar sesión de seguimiento si persiste el insomnio.",
    },
    # Day -3: Slightly negative
    {
        "sentiment": -0.15,
        "emotional_state": "Ansioso",
        "risk_flags": [],
        "messages": [
            ("INBOUND", "Hoy todo me irrita. Mi jefe, el tráfico, todo."),
            ("OUTBOUND", "¿Puedes identificar qué hay debajo de esa irritación?"),
            (
                "INBOUND",
                "No sé... me siento como perdido. Antes tenía todo claro y ahora no sé qué quiero.",
            ),
        ],
        "summary": "Irritabilidad generalizada. Cuestionamiento existencial emergiendo. Fase normal post-experiencia.",
        "suggestion": "Recordar: la confusión es parte del proceso de reconstrucción del sentido.",
    },
    # Day -2: More negative
    {
        "sentiment": -0.35,
        "emotional_state": "Desanimado",
        "risk_flags": [],
        "messages": [
            ("INBOUND", "No tengo ganas de nada. He cancelado planes con amigos."),
            (
                "OUTBOUND",
                "Entiendo. ¿Estás cuidando lo básico? Alimentación, movimiento...",
            ),
            ("INBOUND", "Más o menos. Ayer me salté la cena porque no tenía hambre."),
        ],
        "summary": "Aislamiento social incipiente. Anhedonia leve. Apetito reducido.",
        "suggestion": "Importante: monitorear patrón alimenticio. Sugerir check-in telefónico.",
    },
    # Day -1: Concerning
    {
        "sentiment": -0.5,
        "emotional_state": "Desesperanzado",
        "risk_flags": ["Aislamiento Social"],
        "messages": [
            ("INBOUND", "Llevo 3 días sin hablar con nadie. No tiene sentido."),
            (
                "OUTBOUND",
                "Javier, me preocupa lo que escribes. ¿Podemos hablar por teléfono?",
            ),
            (
                "INBOUND",
                "No sé. Siento que nada de lo que hice en la sesión sirvió. Estoy peor que antes.",
            ),
        ],
        "summary": "ALERTA: Aislamiento prolongado. Duda sobre eficacia del proceso. Necesita intervención.",
        "suggestion": "URGENTE: Llamar al paciente. Evaluar ideación negativa.",
    },
    # Day 0 (today): Crisis
    {
        "sentiment": -0.65,
        "emotional_state": "Crisis",
        "risk_flags": ["Desesperanza", "Aislamiento Severo"],
        "messages": [
            ("INBOUND", "No puedo más. Todo está oscuro. No veo salida."),
            (
                "OUTBOUND",
                "Javier, esto es importante. Estoy aquí contigo. ¿Estás en un lugar seguro?",
            ),
            (
                "INBOUND",
                "Sí, en casa. Pero siento que todo fue un error. La sesión solo me abrió heridas que no puedo cerrar.",
            ),
        ],
        "summary": "CRISIS: Verbalización de desesperanza. Uso de palabras 'oscuro' y 'sin salida'. Requiere intervención inmediata.",
        "suggestion": "ALERTAR TERAPEUTA INMEDIATAMENTE. Considerar contacto de emergencia.",
    },
]


async def seed_whatsapp_demo():
    """Seed demo data for WhatsApp monitoring feature."""
    async with AsyncSessionLocal() as db:
        # Find Javier Roca (or any patient with "Javier" in name)
        result = await db.execute(
            select(Patient).where(Patient.first_name.ilike("%Javier%"))
        )
        patient = result.scalar_one_or_none()

        if not patient:
            # Try to find any patient
            result = await db.execute(select(Patient).limit(1))
            patient = result.scalar_one_or_none()

        if not patient:
            print("❌ No patients found in database. Run seeds first.")
            return

        print(f"🎯 Seeding demo data for: {patient.first_name} {patient.last_name}")

        # Clear existing demo data for this patient
        from sqlalchemy import delete

        await db.execute(delete(MessageLog).where(MessageLog.patient_id == patient.id))
        await db.execute(
            delete(DailyConversationAnalysis).where(
                DailyConversationAnalysis.patient_id == patient.id
            )
        )
        await db.commit()

        # Generate 7 days of data
        today = datetime.utcnow().replace(hour=10, minute=0, second=0, microsecond=0)

        for day_offset, day_data in enumerate(DEMO_CONVERSATIONS):
            day_date = today - timedelta(days=6 - day_offset)

            # Create messages for this day
            for i, (direction, content) in enumerate(day_data["messages"]):
                msg_time = day_date + timedelta(minutes=i * 15)
                message = MessageLog(
                    id=uuid4(),
                    organization_id=patient.organization_id,
                    patient_id=patient.id,
                    direction=MessageDirection.INBOUND
                    if direction == "INBOUND"
                    else MessageDirection.OUTBOUND,
                    content=content,
                    provider_id=f"demo_{patient.id}_{day_offset}_{i}",
                    status="RECEIVED" if direction == "INBOUND" else "SENT",
                    timestamp=msg_time,
                )
                db.add(message)

            # Create daily analysis
            analysis = DailyConversationAnalysis(
                id=uuid4(),
                organization_id=patient.organization_id,
                patient_id=patient.id,
                date=day_date.replace(hour=0, minute=0, second=0),
                summary=day_data["summary"],
                sentiment_score=day_data["sentiment"],
                emotional_state=day_data["emotional_state"],
                risk_flags=day_data["risk_flags"],
                suggestion=day_data["suggestion"],
                message_count=len(day_data["messages"]),
            )
            db.add(analysis)

            print(
                f"  📅 Day {-6 + day_offset}: sentiment={day_data['sentiment']:.2f}, risks={day_data['risk_flags']}"
            )

        await db.commit()

        print(f"\n✅ Demo data seeded successfully!")
        print(f"   Patient: {patient.first_name} {patient.last_name}")
        print(f"   Patient ID: {patient.id}")
        print(f"   Messages: {sum(len(d['messages']) for d in DEMO_CONVERSATIONS)}")
        print(f"   Analyses: {len(DEMO_CONVERSATIONS)}")
        print(f"\n🎬 Open /patients/{patient.id} and go to 'Monitorización' tab!")


if __name__ == "__main__":
    asyncio.run(seed_whatsapp_demo())
