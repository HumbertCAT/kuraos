"""Automation types and enums for v0.9.0 The Automator.

This module defines the vocabulary of events that the automation engine understands.
"""

from enum import Enum


class TriggerEvent(str, Enum):
    """Events that can trigger automation rules."""

    # Form events
    FORM_SUBMISSION_COMPLETED = "FORM_SUBMISSION_COMPLETED"

    # Booking lifecycle
    BOOKING_CREATED = "BOOKING_CREATED"
    BOOKING_CONFIRMED = "BOOKING_CONFIRMED"
    BOOKING_CANCELLED = "BOOKING_CANCELLED"
    BOOKING_COMPLETED = "BOOKING_COMPLETED"

    # Payment events
    PAYMENT_SUCCEEDED = "PAYMENT_SUCCEEDED"
    PAYMENT_FAILED = "PAYMENT_FAILED"

    # AI events
    RISK_ANALYSIS_COMPLETED = "RISK_ANALYSIS_COMPLETED"

    # Clinical events (v0.9.2)
    CLINICAL_ENTRY_CREATED = "CLINICAL_ENTRY_CREATED"
    CLINICAL_NOTE_CREATED = "CLINICAL_NOTE_CREATED"
    RISK_DETECTED_IN_NOTE = "RISK_DETECTED_IN_NOTE"
    NO_SHOW_DETECTED = "NO_SHOW_DETECTED"

    # Temporal events (v0.9.2 - APScheduler)
    JOURNEY_STAGE_TIMEOUT = "JOURNEY_STAGE_TIMEOUT"

    # Lead/CRM events (v0.9.9.9)
    LEAD_CREATED = "LEAD_CREATED"
    LEAD_STAGED_TIMEOUT = "LEAD_STAGED_TIMEOUT"
    LEAD_CONVERTED = "LEAD_CONVERTED"


class JourneyStatus(str, Enum):
    """Standard journey states for the hybrid state machine."""

    # Intake/Screening flow
    SCREENING_PENDING = "SCREENING_PENDING"
    SCREENING_COMPLETED = "SCREENING_COMPLETED"
    BLOCKED_HIGH_RISK = "BLOCKED_HIGH_RISK"

    # Booking flow
    AWAITING_PAYMENT = "AWAITING_PAYMENT"
    PAYMENT_PENDING = "PAYMENT_PENDING"
    CONFIRMED = "CONFIRMED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
