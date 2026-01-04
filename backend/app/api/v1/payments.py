"""Stripe payment integration endpoints."""

import logging
import uuid
import stripe
from fastapi import APIRouter, Request, HTTPException, status, Header, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.db.base import get_db
from app.db.models import Booking, BookingStatus
from app.services.automation_engine import fire_event
from app.schemas.automation_types import TriggerEvent

router = APIRouter()

# Configure Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY


# ============ SCHEMAS ============


class CreatePaymentIntentRequest(BaseModel):
    """Request to create a payment intent for a booking."""

    booking_id: uuid.UUID


class PaymentIntentResponse(BaseModel):
    """Response when creating a payment intent."""

    client_secret: str
    payment_intent_id: str
    amount: int
    currency: str


# ============ ENDPOINTS ============


@router.post("/create-payment-intent", response_model=PaymentIntentResponse)
async def create_payment_intent(
    request: CreatePaymentIntentRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Create a Stripe PaymentIntent for a booking.

    The booking must be in PENDING status.
    If therapist has Stripe Connect enabled, uses split payment with application fee.
    """
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe is not configured",
        )

    # Get booking with organization
    from app.db.models import Organization

    result = await db.execute(select(Booking).where(Booking.id == request.booking_id))
    booking = result.scalar_one_or_none()

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )

    if booking.status != BookingStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Booking is not in PENDING status (current: {booking.status.value})",
        )

    # Get organization to check Connect status
    org_result = await db.execute(
        select(Organization).where(Organization.id == booking.organization_id)
    )
    org = org_result.scalar_one_or_none()

    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )

    # Check if therapist has Connect enabled
    # DEV BYPASS: In test mode (sk_test_*), allow direct payments without Connect
    has_connect = org.stripe_connect_enabled and org.stripe_connect_id
    is_test_mode = settings.STRIPE_SECRET_KEY and settings.STRIPE_SECRET_KEY.startswith(
        "sk_test_"
    )

    if not has_connect and not is_test_mode:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El terapeuta aún no ha configurado sus cobros. Pídele que conecte su cuenta bancaria.",
        )

    # Convert amount to cents (Stripe uses smallest currency unit)
    amount_cents = int(booking.amount_paid * 100)
    currency = booking.currency.lower()

    try:
        if not has_connect:
            # DEV BYPASS: Direct payment without Connect (no split)
            # TODO: Remove this in production or add proper flag
            payment_intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency=currency,
                metadata={
                    "booking_id": str(booking.id),
                    "patient_id": str(booking.patient_id),
                    "therapist_id": str(booking.therapist_id),
                    "org_id": str(org.id),
                    "dev_mode": "true",
                },
                automatic_payment_methods={"enabled": True},
            )
        else:
            # PRODUCTION: Connect split payment
            from app.services.stripe_service import StripeService

            stripe_service = StripeService(db)
            application_fee = stripe_service.calculate_application_fee(
                amount_cents, org.tier
            )

            payment_intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency=currency,
                metadata={
                    "booking_id": str(booking.id),
                    "patient_id": str(booking.patient_id),
                    "therapist_id": str(booking.therapist_id),
                    "org_id": str(org.id),
                },
                automatic_payment_methods={"enabled": True},
                # Stripe Connect: Send money to therapist's connected account
                transfer_data={
                    "destination": org.stripe_connect_id,
                },
                # Our platform commission
                application_fee_amount=application_fee,
            )

        # Store payment intent ID on booking
        booking.stripe_payment_intent_id = payment_intent.id
        await db.commit()

        return PaymentIntentResponse(
            client_secret=payment_intent.client_secret,
            payment_intent_id=payment_intent.id,
            amount=amount_cents,
            currency=currency,
        )

    except stripe.error.StripeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: Optional[str] = Header(None, alias="Stripe-Signature"),
    db: AsyncSession = Depends(get_db),
):
    """
    Handle Stripe webhook events.

    Events handled:
    - payment_intent.succeeded: Confirm booking
    - payment_intent.payment_failed: Cancel booking
    """
    if not settings.STRIPE_WEBHOOK_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe webhooks not configured",
        )

    # Get raw body
    payload = await request.body()

    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payload",
        )
    except stripe.error.SignatureVerificationError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid signature",
        )

    # Handle events
    if event.type == "payment_intent.succeeded":
        payment_intent = event.data.object
        booking_id = payment_intent.metadata.get("booking_id")

        if booking_id:
            from app.db.models import Patient, ServiceType, User
            from app.services.email import email_service

            result = await db.execute(
                select(Booking).where(Booking.id == uuid.UUID(booking_id))
            )
            booking = result.scalar_one_or_none()

            if booking and booking.status == BookingStatus.PENDING:
                booking.status = BookingStatus.CONFIRMED
                await db.commit()

                # Fire automation event (PAYMENT_SUCCEEDED)
                try:
                    await fire_event(
                        db=db,
                        event_type=TriggerEvent.PAYMENT_SUCCEEDED,
                        payload={
                            "booking_id": str(booking.id),
                            "patient_id": str(booking.patient_id)
                            if booking.patient_id
                            else None,
                            "amount": payment_intent.amount,
                            "currency": payment_intent.currency,
                        },
                        organization_id=booking.organization_id,
                        entity_type="booking",
                        entity_id=booking.id,
                    )
                except Exception as auto_err:
                    logging.warning(f"Automation event failed: {auto_err}")

                # Send confirmation email
                try:
                    # Get patient info
                    patient_result = await db.execute(
                        select(Patient).where(Patient.id == booking.patient_id)
                    )
                    patient = patient_result.scalar_one_or_none()

                    # Get service info
                    service_result = await db.execute(
                        select(ServiceType).where(
                            ServiceType.id == booking.service_type_id
                        )
                    )
                    service = service_result.scalar_one_or_none()

                    if patient and service and patient.email:
                        await email_service.send_booking_confirmation(
                            to_email=patient.email,
                            to_name=f"{patient.first_name} {patient.last_name}",
                            service_title=service.title,
                            booking_date=booking.start_time,
                            booking_time=booking.start_time.strftime("%H:%M"),
                            amount=booking.amount_paid,
                            currency=booking.currency,
                            booking_id=str(booking.id),
                        )

                    # Send copy to therapist
                    therapist_result = await db.execute(
                        select(User).where(User.id == booking.therapist_id)
                    )
                    therapist = therapist_result.scalar_one_or_none()

                    if therapist and therapist.email and service:
                        patient_name = (
                            f"{patient.first_name} {patient.last_name}"
                            if patient
                            else "Cliente"
                        )
                        await email_service.send_booking_confirmation(
                            to_email=therapist.email,
                            to_name=therapist.full_name or "Terapeuta",
                            service_title=f"Nueva reserva: {service.title}",
                            booking_date=booking.start_time,
                            booking_time=booking.start_time.strftime("%H:%M"),
                            amount=booking.amount_paid,
                            currency=booking.currency,
                            booking_id=f"Paciente: {patient_name}",
                        )

                    # Create Google Calendar event
                    try:
                        from app.services.google_calendar import GoogleCalendarService

                        gcal_service = GoogleCalendarService(db)

                        patient_name = (
                            f"{patient.first_name} {patient.last_name}".strip()
                            if patient
                            else "Cliente"
                        )
                        event_title = f"{service.title} - {patient_name}"
                        event_description = f"Reserva confirmada para {patient_name}\nServicio: {service.title}\nEmail: {patient.email if patient else 'N/A'}"

                        gcal_event_id = await gcal_service.create_booking_event(
                            user_id=booking.therapist_id,
                            schedule_id=service.schedule_id,
                            booking_calendar_id=service.booking_calendar_id,
                            event_title=event_title,
                            event_description=event_description,
                            start_time=booking.start_time,
                            end_time=booking.end_time,
                            attendee_email=patient.email if patient else None,
                        )

                        if gcal_event_id:
                            booking.google_calendar_event_id = gcal_event_id
                            await db.commit()
                    except Exception as gcal_error:
                        logging.warning(f"Failed to create GCal event: {gcal_error}")

                except Exception as e:
                    logging.error(f"Failed to send confirmation email: {e}")

    elif event.type == "payment_intent.payment_failed":
        payment_intent = event.data.object
        booking_id = payment_intent.metadata.get("booking_id")

        if booking_id:
            result = await db.execute(
                select(Booking).where(Booking.id == uuid.UUID(booking_id))
            )
            booking = result.scalar_one_or_none()

            if booking and booking.status == BookingStatus.PENDING:
                booking.status = BookingStatus.CANCELLED
                await db.commit()

                # Fire automation event (PAYMENT_FAILED)
                try:
                    await fire_event(
                        db=db,
                        event_type=TriggerEvent.PAYMENT_FAILED,
                        payload={
                            "booking_id": str(booking.id),
                            "patient_id": str(booking.patient_id)
                            if booking.patient_id
                            else None,
                            "error": payment_intent.last_payment_error.message
                            if payment_intent.last_payment_error
                            else "Unknown error",
                        },
                        organization_id=booking.organization_id,
                        entity_type="booking",
                        entity_id=booking.id,
                    )
                except Exception as auto_err:
                    logging.warning(f"Automation event failed: {auto_err}")

    # ============ SUBSCRIPTION WEBHOOKS (SaaS Billing) ============

    elif event.type == "checkout.session.completed":
        session = event.data.object

        # Only handle subscription checkouts
        if session.mode == "subscription":
            from app.services.stripe_service import handle_checkout_completed

            try:
                await handle_checkout_completed(db, session)
                logging.info(f"Subscription checkout completed: {session.id}")
            except Exception as e:
                logging.error(f"Checkout webhook error: {e}")

    elif event.type == "customer.subscription.deleted":
        subscription = event.data.object
        from app.services.stripe_service import handle_subscription_deleted

        try:
            await handle_subscription_deleted(db, subscription)
            logging.info(f"Subscription deleted: {subscription.id}")
        except Exception as e:
            logging.error(f"Subscription deletion webhook error: {e}")

    return {"status": "received"}
