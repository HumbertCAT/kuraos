"""Notification dispatcher - abstraction layer for email/SMS/WhatsApp.

This service provides a unified interface for sending patient notifications.
Currently implements email via Brevo. WhatsApp/SMS to be added when Meta Cloud API
is integrated (see ADR-004).
"""

import logging
from datetime import datetime
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from app.db.models import Booking, User, Patient

logger = logging.getLogger(__name__)


class NotificationService:
    """Central dispatcher for patient notifications.

    This abstraction ensures that booking.py never knows about email/SMS/WhatsApp
    specifics. When Meta Cloud API is integrated, we only modify this service.
    """

    async def notify_booking_cancelled(
        self,
        booking: "Booking",
        patient: "Patient",
        therapist: "User",
        service_title: str,
        reason: Optional[str] = None,
    ) -> bool:
        """
        Notify patient about cancelled booking.

        Returns True if at least one notification channel succeeded.
        """
        from app.services.email import email_service

        success = False

        logger.info(
            f"[NOTIFY] notify_booking_cancelled called for patient_id={patient.id}, email={patient.email}"
        )

        # Email notification
        if patient.email:
            email_sent = await email_service.send_booking_cancelled(
                to_email=patient.email,
                to_name=f"{patient.first_name} {patient.last_name}".strip(),
                booking_date=booking.start_time,
                booking_time=booking.start_time.strftime("%H:%M"),
                service_title=service_title,
                therapist_name=therapist.full_name or therapist.email,
                reason=reason,
            )
            if email_sent:
                success = True
                logger.info(f"Cancellation email sent to {patient.email}")
        else:
            logger.warning(
                f"Patient {patient.id} has no email - skipping patient notification"
            )

        # Always send copy to therapist as confirmation
        if therapist.email:
            await email_service.send_booking_cancelled(
                to_email=therapist.email,
                to_name=therapist.full_name or "Terapeuta",
                booking_date=booking.start_time,
                booking_time=booking.start_time.strftime("%H:%M"),
                service_title=service_title,
                therapist_name=f"Confirmación - {patient.first_name} {patient.last_name}".strip(),
                reason=reason,
            )
            logger.info(
                f"Cancellation confirmation sent to therapist {therapist.email}"
            )
            success = True

        # TODO: Add WhatsApp/SMS integration (Meta Cloud API - ADR-004)
        # if patient.phone and patient.prefers_whatsapp:
        #     await whatsapp_service.send_booking_cancelled(...)

        return success

    async def notify_booking_rescheduled(
        self,
        old_booking: "Booking",
        new_booking: "Booking",
        patient: "Patient",
        therapist: "User",
        service_title: str,
        reason: Optional[str] = None,
    ) -> bool:
        """
        Notify patient about rescheduled booking.

        Returns True if at least one notification channel succeeded.
        """
        from app.services.email import email_service

        success = False

        logger.info(
            f"[NOTIFY] notify_booking_rescheduled called for patient_id={patient.id}, email={patient.email}"
        )

        # Email notification
        if patient.email:
            email_sent = await email_service.send_booking_rescheduled(
                to_email=patient.email,
                to_name=f"{patient.first_name} {patient.last_name}".strip(),
                old_date=old_booking.start_time,
                old_time=old_booking.start_time.strftime("%H:%M"),
                new_date=new_booking.start_time,
                new_time=new_booking.start_time.strftime("%H:%M"),
                service_title=service_title,
                therapist_name=therapist.full_name or therapist.email,
                reason=reason,
            )
            if email_sent:
                success = True
                logger.info(f"Reschedule email sent to {patient.email}")
        else:
            logger.warning(
                f"Patient {patient.id} has no email - skipping patient notification"
            )

        # Always send copy to therapist as confirmation
        if therapist.email:
            await email_service.send_booking_rescheduled(
                to_email=therapist.email,
                to_name=therapist.full_name or "Terapeuta",
                old_date=old_booking.start_time,
                old_time=old_booking.start_time.strftime("%H:%M"),
                new_date=new_booking.start_time,
                new_time=new_booking.start_time.strftime("%H:%M"),
                service_title=service_title,
                therapist_name=f"Confirmación - {patient.first_name} {patient.last_name}".strip(),
                reason=reason,
            )
            logger.info(f"Reschedule confirmation sent to therapist {therapist.email}")
            success = True

        # TODO: Add WhatsApp/SMS integration (Meta Cloud API - ADR-004)
        # if patient.phone and patient.prefers_whatsapp:
        #     await whatsapp_service.send_booking_rescheduled(...)

        return success


# Singleton instance
notification_service = NotificationService()
