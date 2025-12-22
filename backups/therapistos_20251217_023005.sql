--
-- PostgreSQL database dump
--

\restrict rImlKCzQvY6xEWZeFOcw1VnTmgB74upav6ACkLT1P0m1ZUax9XL2SMXg5Jio9NA

-- Dumped from database version 15.15
-- Dumped by pg_dump version 15.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: attendeestatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.attendeestatus AS ENUM (
    'REGISTERED',
    'CANCELED',
    'ATTENDED',
    'WAITLIST'
);


ALTER TYPE public.attendeestatus OWNER TO postgres;

--
-- Name: bookingstatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.bookingstatus AS ENUM (
    'PENDING',
    'CONFIRMED',
    'CANCELLED',
    'COMPLETED',
    'NO_SHOW'
);


ALTER TYPE public.bookingstatus OWNER TO postgres;

--
-- Name: entrytype; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.entrytype AS ENUM (
    'SESSION_NOTE',
    'AUDIO',
    'DOCUMENT',
    'AI_ANALYSIS',
    'ASSESSMENT',
    'FORM_SUBMISSION'
);


ALTER TYPE public.entrytype OWNER TO postgres;

--
-- Name: eventstatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.eventstatus AS ENUM (
    'PENDING',
    'PROCESSED',
    'IGNORED',
    'FAILED'
);


ALTER TYPE public.eventstatus OWNER TO postgres;

--
-- Name: formassignmentstatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.formassignmentstatus AS ENUM (
    'SENT',
    'OPENED',
    'COMPLETED',
    'EXPIRED'
);


ALTER TYPE public.formassignmentstatus OWNER TO postgres;

--
-- Name: formtype; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.formtype AS ENUM (
    'INTAKE',
    'PRE_SESSION',
    'POST_SESSION',
    'FEEDBACK'
);


ALTER TYPE public.formtype OWNER TO postgres;

--
-- Name: messagedirection; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.messagedirection AS ENUM (
    'INBOUND',
    'OUTBOUND'
);


ALTER TYPE public.messagedirection OWNER TO postgres;

--
-- Name: orgtier; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.orgtier AS ENUM (
    'BUILDER',
    'PRO',
    'TRIAL',
    'CENTER'
);


ALTER TYPE public.orgtier OWNER TO postgres;

--
-- Name: orgtype; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.orgtype AS ENUM (
    'SOLO',
    'CLINIC'
);


ALTER TYPE public.orgtype OWNER TO postgres;

--
-- Name: outputlanguage; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.outputlanguage AS ENUM (
    'AUTO',
    'ES',
    'EN'
);


ALTER TYPE public.outputlanguage OWNER TO postgres;

--
-- Name: processingstatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.processingstatus AS ENUM (
    'IDLE',
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'FAILED'
);


ALTER TYPE public.processingstatus OWNER TO postgres;

--
-- Name: risklevel; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.risklevel AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);


ALTER TYPE public.risklevel OWNER TO postgres;

--
-- Name: schedulingtype; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.schedulingtype AS ENUM (
    'CALENDAR',
    'FIXED_DATE'
);


ALTER TYPE public.schedulingtype OWNER TO postgres;

--
-- Name: servicemode; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.servicemode AS ENUM (
    'ONE_ON_ONE',
    'GROUP'
);


ALTER TYPE public.servicemode OWNER TO postgres;

--
-- Name: therapytype; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.therapytype AS ENUM (
    'GENERAL',
    'ASTROLOGY',
    'SOMATIC',
    'PSYCHEDELIC',
    'INTEGRATION'
);


ALTER TYPE public.therapytype OWNER TO postgres;

--
-- Name: userrole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.userrole AS ENUM (
    'OWNER',
    'THERAPIST',
    'ASSISTANT'
);


ALTER TYPE public.userrole OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ai_usage_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_usage_logs (
    id uuid NOT NULL,
    organization_id uuid NOT NULL,
    user_id uuid NOT NULL,
    entry_id uuid,
    credits_cost integer NOT NULL,
    activity_type character varying(50) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ai_usage_logs OWNER TO postgres;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO postgres;

--
-- Name: attendees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attendees (
    id uuid NOT NULL,
    status public.attendeestatus NOT NULL,
    event_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.attendees OWNER TO postgres;

--
-- Name: automation_execution_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.automation_execution_logs (
    id uuid NOT NULL,
    automation_rule_id uuid NOT NULL,
    organization_id uuid NOT NULL,
    patient_id uuid,
    trigger_event character varying(100) NOT NULL,
    trigger_payload jsonb NOT NULL,
    status character varying(20) NOT NULL,
    actions_executed jsonb NOT NULL,
    error_message text,
    execution_time_ms integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.automation_execution_logs OWNER TO postgres;

--
-- Name: automation_rules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.automation_rules (
    id uuid NOT NULL,
    organization_id uuid,
    name character varying(255) NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    icon character varying(50) DEFAULT 'Zap'::character varying NOT NULL,
    trigger_event character varying(100) NOT NULL,
    conditions jsonb DEFAULT '{}'::jsonb NOT NULL,
    actions jsonb DEFAULT '[]'::jsonb NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    is_system_template boolean DEFAULT false NOT NULL,
    priority integer DEFAULT 100 NOT NULL,
    cloned_from_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.automation_rules OWNER TO postgres;

--
-- Name: availability_blocks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.availability_blocks (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    day_of_week integer NOT NULL,
    start_time character varying(5) NOT NULL,
    end_time character varying(5) NOT NULL,
    effective_from timestamp with time zone DEFAULT now() NOT NULL,
    effective_until timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    schedule_id uuid
);


ALTER TABLE public.availability_blocks OWNER TO postgres;

--
-- Name: availability_schedules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.availability_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    is_default boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.availability_schedules OWNER TO postgres;

--
-- Name: bookings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bookings (
    id uuid NOT NULL,
    organization_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    service_type_id uuid NOT NULL,
    therapist_id uuid NOT NULL,
    event_id uuid,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    status public.bookingstatus NOT NULL,
    stripe_payment_intent_id character varying(255),
    stripe_payment_status character varying(50),
    amount_paid double precision NOT NULL,
    currency character varying(3) NOT NULL,
    patient_notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    google_calendar_event_id character varying(255),
    target_timezone character varying(64),
    public_token character varying(64) NOT NULL,
    cancellation_reason text,
    cancelled_at timestamp with time zone,
    cancelled_by character varying(20),
    rescheduled_from_id uuid
);


ALTER TABLE public.bookings OWNER TO postgres;

--
-- Name: calendar_integrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.calendar_integrations (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    provider character varying(50) NOT NULL,
    access_token text NOT NULL,
    refresh_token text,
    token_expiry timestamp with time zone,
    calendar_id character varying(255) NOT NULL,
    sync_bookings_to_gcal boolean NOT NULL,
    check_gcal_busy boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.calendar_integrations OWNER TO postgres;

--
-- Name: clinical_entries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clinical_entries (
    id uuid NOT NULL,
    patient_id uuid NOT NULL,
    author_id uuid,
    entry_type public.entrytype NOT NULL,
    content text,
    entry_metadata jsonb,
    is_private boolean NOT NULL,
    happened_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    processing_status public.processingstatus DEFAULT 'IDLE'::public.processingstatus NOT NULL,
    processing_error text
);


ALTER TABLE public.clinical_entries OWNER TO postgres;

--
-- Name: daily_conversation_analyses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.daily_conversation_analyses (
    id uuid NOT NULL,
    organization_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    date timestamp with time zone NOT NULL,
    summary text NOT NULL,
    sentiment_score double precision NOT NULL,
    emotional_state character varying(50),
    risk_flags jsonb NOT NULL,
    suggestion text,
    message_count integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.daily_conversation_analyses OWNER TO postgres;

--
-- Name: events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.events (
    id uuid NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    capacity integer NOT NULL,
    price double precision NOT NULL,
    organization_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.events OWNER TO postgres;

--
-- Name: form_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.form_assignments (
    id uuid NOT NULL,
    patient_id uuid NOT NULL,
    template_id uuid NOT NULL,
    status public.formassignmentstatus NOT NULL,
    token character varying(64) NOT NULL,
    valid_until timestamp with time zone NOT NULL,
    opened_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.form_assignments OWNER TO postgres;

--
-- Name: form_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.form_templates (
    id uuid NOT NULL,
    organization_id uuid,
    title character varying(255) NOT NULL,
    description text,
    schema jsonb NOT NULL,
    risk_level public.risklevel NOT NULL,
    therapy_type public.therapytype NOT NULL,
    form_type public.formtype NOT NULL,
    is_active boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    service_mode public.servicemode DEFAULT 'ONE_ON_ONE'::public.servicemode NOT NULL,
    scheduling_type public.schedulingtype DEFAULT 'CALENDAR'::public.schedulingtype NOT NULL,
    public_token character varying(64),
    config jsonb
);


ALTER TABLE public.form_templates OWNER TO postgres;

--
-- Name: journey_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.journey_logs (
    id uuid NOT NULL,
    patient_id uuid NOT NULL,
    journey_key character varying(100) NOT NULL,
    from_stage character varying(50),
    to_stage character varying(50) NOT NULL,
    changed_at timestamp with time zone DEFAULT now() NOT NULL,
    trigger_event_id uuid
);


ALTER TABLE public.journey_logs OWNER TO postgres;

--
-- Name: journey_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.journey_templates (
    id uuid NOT NULL,
    organization_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    key character varying(100) NOT NULL,
    allowed_stages jsonb NOT NULL,
    initial_stage character varying(50) NOT NULL,
    is_active boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.journey_templates OWNER TO postgres;

--
-- Name: message_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.message_logs (
    id uuid NOT NULL,
    organization_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    direction public.messagedirection NOT NULL,
    content text NOT NULL,
    provider_id character varying(100),
    status character varying(20) NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.message_logs OWNER TO postgres;

--
-- Name: organizations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organizations (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    type public.orgtype NOT NULL,
    referral_code character varying(50) NOT NULL,
    referred_by_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    tier public.orgtier DEFAULT 'BUILDER'::public.orgtier NOT NULL,
    ai_credits_monthly_quota integer DEFAULT 100 NOT NULL,
    ai_credits_purchased integer DEFAULT 0 NOT NULL,
    ai_credits_used_this_month integer DEFAULT 0 NOT NULL,
    credits_reset_at timestamp with time zone,
    settings jsonb,
    stripe_customer_id character varying(255),
    stripe_subscription_id character varying(255),
    stripe_connect_id character varying(255),
    stripe_connect_enabled boolean DEFAULT false NOT NULL
);


ALTER TABLE public.organizations OWNER TO postgres;

--
-- Name: patients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.patients (
    id uuid NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    email character varying(255),
    phone character varying(50),
    organization_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    language character varying(10) DEFAULT 'es'::character varying NOT NULL,
    birth_date timestamp with time zone,
    birth_time character varying(10),
    birth_place character varying(255),
    journey_status jsonb DEFAULT '{}'::jsonb NOT NULL,
    last_insight_json jsonb,
    last_insight_at timestamp with time zone,
    profile_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    profile_image_url character varying(512)
);


ALTER TABLE public.patients OWNER TO postgres;

--
-- Name: schedule_calendar_syncs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.schedule_calendar_syncs (
    id uuid NOT NULL,
    schedule_id uuid NOT NULL,
    blocking_calendar_ids jsonb,
    booking_calendar_id character varying(255) NOT NULL,
    sync_enabled boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.schedule_calendar_syncs OWNER TO postgres;

--
-- Name: service_therapist_link; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.service_therapist_link (
    service_type_id uuid NOT NULL,
    user_id uuid NOT NULL
);


ALTER TABLE public.service_therapist_link OWNER TO postgres;

--
-- Name: service_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.service_types (
    id uuid NOT NULL,
    organization_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    kind public.servicemode NOT NULL,
    duration_minutes integer NOT NULL,
    price double precision NOT NULL,
    currency character varying(3) NOT NULL,
    capacity integer NOT NULL,
    intake_form_id uuid,
    requires_approval boolean NOT NULL,
    is_active boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    schedule_id uuid,
    scheduling_type character varying(20) DEFAULT 'CALENDAR'::character varying,
    cancellation_policy jsonb
);


ALTER TABLE public.service_types OWNER TO postgres;

--
-- Name: specific_availability; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.specific_availability (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    start_datetime timestamp with time zone NOT NULL,
    end_datetime timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    schedule_id uuid
);


ALTER TABLE public.specific_availability OWNER TO postgres;

--
-- Name: system_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_events (
    id uuid NOT NULL,
    organization_id uuid NOT NULL,
    event_type character varying(100) NOT NULL,
    payload jsonb NOT NULL,
    status public.eventstatus NOT NULL,
    error_message text,
    entity_type character varying(50),
    entity_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.system_events OWNER TO postgres;

--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_settings (
    key character varying(100) NOT NULL,
    value jsonb NOT NULL,
    description text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.system_settings OWNER TO postgres;

--
-- Name: time_off; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.time_off (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    start_datetime timestamp with time zone NOT NULL,
    end_datetime timestamp with time zone NOT NULL,
    reason character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    schedule_id uuid
);


ALTER TABLE public.time_off OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    email character varying(255) NOT NULL,
    hashed_password character varying(255) NOT NULL,
    full_name character varying(255),
    role public.userrole NOT NULL,
    is_active boolean NOT NULL,
    organization_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_superuser boolean DEFAULT false NOT NULL,
    locale character varying(10) DEFAULT 'es'::character varying NOT NULL,
    ai_output_preference public.outputlanguage DEFAULT 'AUTO'::public.outputlanguage NOT NULL,
    phone character varying(50),
    website character varying(255),
    country character varying(100),
    city character varying(100),
    profile_image_url character varying(512),
    social_media jsonb
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Data for Name: ai_usage_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ai_usage_logs (id, organization_id, user_id, entry_id, credits_cost, activity_type, created_at) FROM stdin;
\.


--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alembic_version (version_num) FROM stdin;
9a6493d7ef99
\.


--
-- Data for Name: attendees; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attendees (id, status, event_id, patient_id, created_at) FROM stdin;
\.


--
-- Data for Name: automation_execution_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.automation_execution_logs (id, automation_rule_id, organization_id, patient_id, trigger_event, trigger_payload, status, actions_executed, error_message, execution_time_ms, created_at) FROM stdin;
91f24b52-9be1-4652-9384-36e1cb018df7	93f7aed4-0f57-430f-9a3d-023cb4389a4e	4946f21f-9235-431b-b98f-a247ff1931a2	\N	PAYMENT_FAILED	{}	SUCCESS	[{"action": "notify", "detail": "Email y WhatsApp de recordatorio enviados. Factura #INV-2024-001 pendiente."}]	\N	150	2025-12-12 01:10:23.352771+00
\.


--
-- Data for Name: automation_rules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.automation_rules (id, organization_id, name, description, icon, trigger_event, conditions, actions, is_active, is_system_template, priority, cloned_from_id, created_at, updated_at) FROM stdin;
93f7aed4-0f57-430f-9a3d-023cb4389a4e	4946f21f-9235-431b-b98f-a247ff1931a2	Cobrador Automático	Envía recordatorio de pago.	Zap	PAYMENT_FAILED	{}	[]	t	f	100	\N	2025-12-17 01:10:23.352771+00	2025-12-17 01:10:23.352771+00
8a367100-c434-4725-8301-73d9c4382274	\N	Escudo de Seguridad	Bloquea automáticamente pacientes con riesgo alto y alerta al equipo clínico por email.	ShieldAlert	FORM_SUBMISSION_COMPLETED	{"logic": "OR", "rules": [{"field": "risk_analysis.level", "value": "HIGH", "operator": "equals"}, {"field": "risk_analysis.level", "value": "CRITICAL", "operator": "equals"}]}	[{"type": "update_journey_status", "params": {"key": "intake", "status": "BLOCKED_HIGH_RISK"}}, {"type": "send_email", "params": {"to": "therapist", "template": "risk_alert"}}]	f	t	10	\N	2025-12-17 01:17:28.805234+00	2025-12-17 01:17:28.805234+00
5bc7ec47-1501-4b40-88d2-cefa690e2780	\N	Cobrador Automático	Envía recordatorios de pago a las 24h y 48h si el paciente no completa su reserva.	Banknote	JOURNEY_STAGE_TIMEOUT	{"logic": "AND", "rules": [{"field": "journey_key", "value": "intake", "operator": "equals"}, {"field": "current_stage", "value": "AWAITING_PAYMENT", "operator": "equals"}, {"field": "hours_elapsed", "value": 48, "operator": "gte"}]}	[{"type": "send_email", "params": {"to": "patient", "template": "payment_reminder"}}]	f	t	50	\N	2025-12-17 01:17:28.805234+00	2025-12-17 01:17:28.805234+00
cce09dd4-e714-4cf0-939e-3ddf32d16795	\N	Fidelización Post-Retiro	Envía una encuesta de satisfacción 7 días después de completar el retiro.	HeartHandshake	JOURNEY_STAGE_TIMEOUT	{"logic": "AND", "rules": [{"field": "current_stage", "value": "COMPLETED", "operator": "equals"}, {"field": "hours_elapsed", "value": 168, "operator": "gte"}]}	[{"type": "send_email", "params": {"to": "patient", "template": "satisfaction_survey"}}]	f	t	100	\N	2025-12-17 01:17:28.805234+00	2025-12-17 01:17:28.805234+00
\.


--
-- Data for Name: availability_blocks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.availability_blocks (id, user_id, day_of_week, start_time, end_time, effective_from, effective_until, created_at, schedule_id) FROM stdin;
6025f667-c258-4e3d-be68-44fcf26e9151	74ff0a7a-b6bf-4c9a-8dcd-97fb23702279	1	10:00	14:00	2025-12-17 01:04:30.764375+00	\N	2025-12-17 01:04:30.764375+00	58c01f1c-fa49-4278-aab7-3bf15b46d44f
19efdd76-f04f-4e16-8788-08746596d1f0	74ff0a7a-b6bf-4c9a-8dcd-97fb23702279	1	16:00	20:00	2025-12-17 01:04:30.764375+00	\N	2025-12-17 01:04:30.764375+00	58c01f1c-fa49-4278-aab7-3bf15b46d44f
2dbd4d57-fc8a-4105-bf38-454316a1918b	74ff0a7a-b6bf-4c9a-8dcd-97fb23702279	2	10:00	14:00	2025-12-17 01:04:30.764375+00	\N	2025-12-17 01:04:30.764375+00	58c01f1c-fa49-4278-aab7-3bf15b46d44f
c87f1ac0-cd57-418d-ae3a-191837b549ac	74ff0a7a-b6bf-4c9a-8dcd-97fb23702279	2	16:00	20:00	2025-12-17 01:04:30.764375+00	\N	2025-12-17 01:04:30.764375+00	58c01f1c-fa49-4278-aab7-3bf15b46d44f
f051da1e-5443-4ea3-8585-3fc76abcd611	74ff0a7a-b6bf-4c9a-8dcd-97fb23702279	3	10:00	14:00	2025-12-17 01:04:30.764375+00	\N	2025-12-17 01:04:30.764375+00	58c01f1c-fa49-4278-aab7-3bf15b46d44f
cc5fdc8c-4b2a-46ad-a3c5-8cdb9bb7c814	74ff0a7a-b6bf-4c9a-8dcd-97fb23702279	3	16:00	20:00	2025-12-17 01:04:30.764375+00	\N	2025-12-17 01:04:30.764375+00	58c01f1c-fa49-4278-aab7-3bf15b46d44f
5371b6ed-c437-47f9-8257-fbd0c7e0cd61	74ff0a7a-b6bf-4c9a-8dcd-97fb23702279	4	10:00	14:00	2025-12-17 01:04:30.764375+00	\N	2025-12-17 01:04:30.764375+00	58c01f1c-fa49-4278-aab7-3bf15b46d44f
730fac28-2cd0-432d-8e38-ccbff3e4f330	74ff0a7a-b6bf-4c9a-8dcd-97fb23702279	4	16:00	20:00	2025-12-17 01:04:30.764375+00	\N	2025-12-17 01:04:30.764375+00	58c01f1c-fa49-4278-aab7-3bf15b46d44f
8a33aea8-3fb0-496e-9718-0b7398399ad9	74ff0a7a-b6bf-4c9a-8dcd-97fb23702279	5	10:00	14:00	2025-12-17 01:04:30.764375+00	\N	2025-12-17 01:04:30.764375+00	58c01f1c-fa49-4278-aab7-3bf15b46d44f
3315198b-9649-4774-baa5-3fdbf8c0c087	74ff0a7a-b6bf-4c9a-8dcd-97fb23702279	5	16:00	20:00	2025-12-17 01:04:30.764375+00	\N	2025-12-17 01:04:30.764375+00	58c01f1c-fa49-4278-aab7-3bf15b46d44f
b27375b3-42da-40cb-b8a6-167e82c829f3	74ff0a7a-b6bf-4c9a-8dcd-97fb23702279	6	10:00	14:00	2025-12-17 01:04:30.764375+00	\N	2025-12-17 01:04:30.764375+00	58c01f1c-fa49-4278-aab7-3bf15b46d44f
\.


--
-- Data for Name: availability_schedules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.availability_schedules (id, user_id, name, is_default, created_at) FROM stdin;
58c01f1c-fa49-4278-aab7-3bf15b46d44f	74ff0a7a-b6bf-4c9a-8dcd-97fb23702279	Horario Consulta	t	2025-12-17 01:04:30.764375+00
\.


--
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bookings (id, organization_id, patient_id, service_type_id, therapist_id, event_id, start_time, end_time, status, stripe_payment_intent_id, stripe_payment_status, amount_paid, currency, patient_notes, created_at, updated_at, google_calendar_event_id, target_timezone, public_token, cancellation_reason, cancelled_at, cancelled_by, rescheduled_from_id) FROM stdin;
d3d9f05f-a9c4-47fa-9822-141f7f42a2a0	4946f21f-9235-431b-b98f-a247ff1931a2	192273cc-6c1d-4fe8-9520-da516d4f7f05	3a8030b4-a313-4017-8242-18e19c7365a2	74ff0a7a-b6bf-4c9a-8dcd-97fb23702279	\N	2026-01-31 10:00:00.830019+00	2026-02-02 10:00:00.830019+00	CANCELLED	\N	\N	0	EUR	Cancelado por contraindicación médica (ISRS)	2025-12-17 01:17:24.802934+00	2025-12-17 01:17:24.802934+00	\N	Europe/Madrid	Mtm4hMFvjJMaOQlbt8kRLHkC10xskm84ap4tn_Ceo1A	\N	\N	\N	\N
cbe88550-50bb-4253-99a7-8f7c58a17449	4946f21f-9235-431b-b98f-a247ff1931a2	5fe170f7-c5c0-4b56-8eab-0212636d6d3a	3a8030b4-a313-4017-8242-18e19c7365a2	74ff0a7a-b6bf-4c9a-8dcd-97fb23702279	\N	2026-01-31 10:00:00.830698+00	2026-02-02 10:00:00.830698+00	CONFIRMED	\N	\N	450	EUR	Preparación pre-retiro en curso	2025-12-17 01:17:24.802934+00	2025-12-17 01:17:24.802934+00	\N	Europe/Madrid	rifSmLXJNTcB54gbafinhzUI_5XzJwM5WyRoD3OLL8I	\N	\N	\N	\N
56d4fdb6-6520-4fe1-8082-d0139b46a8a9	4946f21f-9235-431b-b98f-a247ff1931a2	1a1477c1-473b-4f57-a655-2f04410b6598	3a8030b4-a313-4017-8242-18e19c7365a2	74ff0a7a-b6bf-4c9a-8dcd-97fb23702279	\N	2026-01-31 10:00:00.831195+00	2026-02-02 10:00:00.831195+00	PENDING	\N	\N	0	EUR	Depósito pendiente - recordatorio enviado	2025-12-17 01:17:24.802934+00	2025-12-17 01:17:24.802934+00	\N	Europe/Madrid	n6vIehCOXxmRvaMEL-0FbbuFtIa0NST75BkgJciVv6I	\N	\N	\N	\N
a98f4dc1-10a9-467b-92b8-9acff24a7b34	4946f21f-9235-431b-b98f-a247ff1931a2	4e0cf80e-39eb-4d7f-97a5-a01cbeb381fe	3f0ddc7f-ba6b-432f-926d-3cd4ba117a28	74ff0a7a-b6bf-4c9a-8dcd-97fb23702279	\N	2025-12-24 12:00:00.831663+00	2025-12-24 13:00:00.831663+00	PENDING	\N	\N	120	EUR	Esperando datos de nacimiento exactos	2025-12-17 01:17:24.802934+00	2025-12-17 01:17:24.802934+00	\N	Europe/Madrid	k2tIEhIQPNAbk4LrufyLOD3BvvTWaJSipn3O-soXjLA	\N	\N	\N	\N
4afa7538-5093-411c-83d9-14e280b6e067	4946f21f-9235-431b-b98f-a247ff1931a2	7716b42a-6c52-4856-9cd9-acb57689c499	3f0ddc7f-ba6b-432f-926d-3cd4ba117a28	74ff0a7a-b6bf-4c9a-8dcd-97fb23702279	\N	2025-12-20 10:00:00.832105+00	2025-12-20 11:00:00.832105+00	CONFIRMED	\N	\N	120	EUR	Carta natal preparada, sesión de revisión programada	2025-12-17 01:17:24.802934+00	2025-12-17 01:17:24.802934+00	\N	Europe/Madrid	zsKcjWTDptZZfKLfKpXSNzJ_J2TPy0yPeS5WjZx_p0M	\N	\N	\N	\N
7c6fe549-6900-450a-88ba-df2548fca88d	4946f21f-9235-431b-b98f-a247ff1931a2	89619fa2-2eb0-45ae-b3cb-b17940b45c02	65cf425c-420e-4848-be0a-aa0abdf9892d	74ff0a7a-b6bf-4c9a-8dcd-97fb23702279	\N	2025-12-19 10:00:00.832449+00	2025-12-19 11:30:00.832449+00	CONFIRMED	\N	\N	800	EUR	Sesión 2 de 8 - Onboarding completado	2025-12-17 01:17:24.802934+00	2025-12-17 01:17:24.802934+00	\N	Europe/Madrid	mUruP5H7MmVNW3RoLEl8iC87PNGHGpvxXie9I0J9JvY	\N	\N	\N	\N
76d374f8-0e2d-419d-91f1-9b34fffadc4e	4946f21f-9235-431b-b98f-a247ff1931a2	3aaf24b8-0c35-4dd3-8421-e6e5e54d60f7	65cf425c-420e-4848-be0a-aa0abdf9892d	74ff0a7a-b6bf-4c9a-8dcd-97fb23702279	\N	2025-12-03 15:00:00.83295+00	2025-12-03 16:30:00.83295+00	CONFIRMED	\N	\N	800	EUR	Sesión 5 de 8 - SIN ASISTIR - Requiere seguimiento	2025-12-17 01:17:24.802934+00	2025-12-17 01:17:24.802934+00	\N	Europe/Madrid	RHAcqHDgd9qq89Rl2Mvd1ZpISSEHorSyCrOIJ0m3Ffg	\N	\N	\N	\N
f1b70931-74a5-432f-90b2-1c264be4b9e8	4946f21f-9235-431b-b98f-a247ff1931a2	687a9f1b-047c-4cd2-be04-f0ed33f682b8	65cf425c-420e-4848-be0a-aa0abdf9892d	74ff0a7a-b6bf-4c9a-8dcd-97fb23702279	\N	2025-11-17 10:00:00.833312+00	2025-11-17 11:30:00.833312+00	COMPLETED	\N	\N	800	EUR	✅ Programa completado con éxito - Graduado	2025-12-17 01:17:24.802934+00	2025-12-17 01:17:24.802934+00	\N	Europe/Madrid	Io0mAUzTFz8AYGH8OnbYTinqTLZ0-BZeaVtNK6anBzQ	\N	\N	\N	\N
48ed1741-ab6a-4c97-afbf-f4a1b09bc387	4946f21f-9235-431b-b98f-a247ff1931a2	9197203b-a4bf-4d67-80fd-e0f642c5587e	44f1459b-ae79-4613-915a-057dd9331a33	74ff0a7a-b6bf-4c9a-8dcd-97fb23702279	\N	2025-12-18 19:00:00.833744+00	2025-12-18 20:15:00.833744+00	PENDING	\N	\N	15	EUR	Waiver pendiente de firma	2025-12-17 01:17:24.802934+00	2025-12-17 01:17:24.802934+00	\N	Europe/Madrid	a4cbQhC01rs9QBa1pmQzJwvdEdmZwO3xv9Z8Sw5n1JY	\N	\N	\N	\N
85c5f7c1-59f0-4de7-a5a4-f55e9e470f46	4946f21f-9235-431b-b98f-a247ff1931a2	ef83d0fa-14e0-4933-89eb-68f2febcea2a	44f1459b-ae79-4613-915a-057dd9331a33	74ff0a7a-b6bf-4c9a-8dcd-97fb23702279	\N	2025-12-18 19:00:00.834048+00	2025-12-18 20:15:00.834048+00	CONFIRMED	\N	\N	15	EUR	Estudiante regular - 3er clase este mes	2025-12-17 01:17:24.802934+00	2025-12-17 01:17:24.802934+00	\N	Europe/Madrid	t0fCDZHFPk0njiSp9Q_LayH2CmX2EvVSXYWVlwzbmxE	\N	\N	\N	\N
\.


--
-- Data for Name: calendar_integrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.calendar_integrations (id, user_id, provider, access_token, refresh_token, token_expiry, calendar_id, sync_bookings_to_gcal, check_gcal_busy, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: clinical_entries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.clinical_entries (id, patient_id, author_id, entry_type, content, entry_metadata, is_private, happened_at, created_at, updated_at, processing_status, processing_error) FROM stdin;
\.


--
-- Data for Name: daily_conversation_analyses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.daily_conversation_analyses (id, organization_id, patient_id, date, summary, sentiment_score, emotional_state, risk_flags, suggestion, message_count, created_at) FROM stdin;
75810877-f0ac-491c-ad0f-411ac71aec01	4946f21f-9235-431b-b98f-a247ff1931a2	3aaf24b8-0c35-4dd3-8421-e6e5e54d60f7	2025-12-11 00:00:00+00	Paciente reporta bienestar post-sesión. Sueño reparador. Estado emocional positivo.	0.5	Esperanzado	[]	Continuar con journaling para integración.	3	2025-12-17 01:19:25.803944+00
a96bb3fa-f2f9-4e66-9a5b-f59e0281f16d	4946f21f-9235-431b-b98f-a247ff1931a2	3aaf24b8-0c35-4dd3-8421-e6e5e54d60f7	2025-12-12 00:00:00+00	Procesamiento emocional activo. Emergencia de material de infancia. Paciente maneja bien la vulnerabilidad.	0.35	Reflexivo	[]	Validar la normalidad del proceso. Sugerir técnicas de grounding.	3	2025-12-17 01:19:25.803944+00
28520442-e172-45d3-a560-f6e4ea96421a	4946f21f-9235-431b-b98f-a247ff1931a2	3aaf24b8-0c35-4dd3-8421-e6e5e54d60f7	2025-12-13 00:00:00+00	Insomnio leve por actividad onírica. Procesando relación paterna. Sin indicadores de riesgo.	0.1	Cansado	[]	Considerar sesión de seguimiento si persiste el insomnio.	3	2025-12-17 01:19:25.803944+00
34449318-3f89-4554-adff-2b5f912a4296	4946f21f-9235-431b-b98f-a247ff1931a2	3aaf24b8-0c35-4dd3-8421-e6e5e54d60f7	2025-12-14 00:00:00+00	Irritabilidad generalizada. Cuestionamiento existencial emergiendo. Fase normal post-experiencia.	-0.15	Ansioso	[]	Recordar: la confusión es parte del proceso de reconstrucción del sentido.	3	2025-12-17 01:19:25.803944+00
0d33c12a-b42e-4c06-bc88-1668c9b9ada3	4946f21f-9235-431b-b98f-a247ff1931a2	3aaf24b8-0c35-4dd3-8421-e6e5e54d60f7	2025-12-15 00:00:00+00	Aislamiento social incipiente. Anhedonia leve. Apetito reducido.	-0.35	Desanimado	[]	Importante: monitorear patrón alimenticio. Sugerir check-in telefónico.	3	2025-12-17 01:19:25.803944+00
9eccefee-d777-48d6-92a7-2bf1ca8ccdf4	4946f21f-9235-431b-b98f-a247ff1931a2	3aaf24b8-0c35-4dd3-8421-e6e5e54d60f7	2025-12-16 00:00:00+00	ALERTA: Aislamiento prolongado. Duda sobre eficacia del proceso. Necesita intervención.	-0.5	Desesperanzado	["Aislamiento Social"]	URGENTE: Llamar al paciente. Evaluar ideación negativa.	3	2025-12-17 01:19:25.803944+00
61db908e-0061-4894-906c-cbaea27d0a13	4946f21f-9235-431b-b98f-a247ff1931a2	3aaf24b8-0c35-4dd3-8421-e6e5e54d60f7	2025-12-17 00:00:00+00	CRISIS: Verbalización de desesperanza. Uso de palabras 'oscuro' y 'sin salida'. Requiere intervención inmediata.	-0.65	Crisis	["Desesperanza", "Aislamiento Severo"]	ALERTAR TERAPEUTA INMEDIATAMENTE. Considerar contacto de emergencia.	3	2025-12-17 01:19:25.803944+00
\.


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.events (id, title, description, start_time, end_time, capacity, price, organization_id, created_at) FROM stdin;
\.


--
-- Data for Name: form_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.form_assignments (id, patient_id, template_id, status, token, valid_until, opened_at, completed_at, created_at) FROM stdin;
3f9cd427-ca8d-4422-b750-92d90e45fdbc	192273cc-6c1d-4fe8-9520-da516d4f7f05	828a8cc9-1bb3-42bb-925d-fdd66d947c37	COMPLETED	7etQ09088qLlW0q6opw2RQ	2026-01-16 01:17:27.802084+00	2025-12-14 01:17:27.802084+00	2025-12-15 01:17:27.802084+00	2025-12-17 01:17:27.78078+00
b0744e27-65f9-459e-afe4-d16b436002c1	5fe170f7-c5c0-4b56-8eab-0212636d6d3a	828a8cc9-1bb3-42bb-925d-fdd66d947c37	COMPLETED	KQhj6zPl0ybQohc0mKkT3w	2026-01-16 01:17:27.802557+00	2025-12-07 01:17:27.802557+00	2025-12-09 01:17:27.802557+00	2025-12-17 01:17:27.78078+00
915168b7-c297-4f89-a2f4-583195a7d7e5	1a1477c1-473b-4f57-a655-2f04410b6598	828a8cc9-1bb3-42bb-925d-fdd66d947c37	OPENED	EaSGsNluAZ6L6gvt6uXWpA	2026-01-16 01:17:27.803078+00	2025-12-16 01:17:27.803078+00	\N	2025-12-17 01:17:27.78078+00
e0cac203-0b1e-493e-8679-a44eecc839cb	4e0cf80e-39eb-4d7f-97a5-a01cbeb381fe	a325fcf3-87f2-4c9c-a369-acc9da768c25	SENT	MazawHZF19lcSlkxgBE_eg	2026-01-16 01:17:27.803404+00	\N	\N	2025-12-17 01:17:27.78078+00
6c835c69-9107-4c2a-81e8-1233f455d82f	7716b42a-6c52-4856-9cd9-acb57689c499	a325fcf3-87f2-4c9c-a369-acc9da768c25	COMPLETED	pib0KmcSAGggmwjYAY0ypQ	2026-01-16 01:17:27.803863+00	2025-12-12 01:17:27.803863+00	2025-12-12 01:17:27.803863+00	2025-12-17 01:17:27.78078+00
678a0032-7a7a-4c68-8fcd-c4f6837fc11a	89619fa2-2eb0-45ae-b3cb-b17940b45c02	14006cd5-84ee-4918-911f-a119ba278414	SENT	ZST5nJWRry7EwiHZWgZpag	2026-01-16 01:17:27.804202+00	\N	\N	2025-12-17 01:17:27.78078+00
9f86a28d-2833-4ec5-ae71-4f8f78a41f5c	3aaf24b8-0c35-4dd3-8421-e6e5e54d60f7	14006cd5-84ee-4918-911f-a119ba278414	EXPIRED	10_sMkxjLw1AMid-0qJmQA	2026-01-16 01:17:27.804506+00	2025-12-07 01:17:27.804506+00	\N	2025-12-17 01:17:27.78078+00
a07df104-ed18-4398-ad0d-3af000294e2c	9197203b-a4bf-4d67-80fd-e0f642c5587e	1e300b4b-03b9-4596-a8a9-9ec1ff0ba44c	SENT	r0cSHj0zhZvLYdugakZF0w	2026-01-16 01:17:27.804771+00	\N	\N	2025-12-17 01:17:27.78078+00
dfb21b3e-0d54-4e7a-9f9f-b3604540603c	ef83d0fa-14e0-4933-89eb-68f2febcea2a	1e300b4b-03b9-4596-a8a9-9ec1ff0ba44c	COMPLETED	XXADB3esvT2ZHXTZOJMA2g	2026-01-16 01:17:27.805131+00	2025-11-17 01:17:27.805131+00	2025-11-17 01:17:27.805131+00	2025-12-17 01:17:27.78078+00
d1eb5c44-0f49-4981-98f2-93cf7bf30840	687a9f1b-047c-4cd2-be04-f0ed33f682b8	ec7dea15-cbac-49c7-a4a4-0267b733531f	COMPLETED	JyiT6KV4DTnpeloMUzlkEQ	2026-01-16 01:17:27.805452+00	2025-12-16 01:17:27.805452+00	2025-12-16 01:17:27.805452+00	2025-12-17 01:17:27.78078+00
\.


--
-- Data for Name: form_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.form_templates (id, organization_id, title, description, schema, risk_level, therapy_type, form_type, is_active, created_at, updated_at, service_mode, scheduling_type, public_token, config) FROM stdin;
1ca1b5ac-10a1-4e70-97fa-044d9f89b8f7	4946f21f-9235-431b-b98f-a247ff1931a2	Cuestionario Médico y Consentimiento	Evaluación de seguridad médica y psicológica obligatoria antes de cualquier experiencia.	{"fields": [{"id": "medication", "type": "textarea", "label": "¿Tomas medicación actual? Detalla dosis.", "required": true}, {"id": "history_psychosis", "type": "boolean", "label": "¿Antecedentes familiares de psicosis o esquizofrenia?", "required": true}, {"id": "cardio", "type": "boolean", "label": "¿Problemas cardíacos o hipertensión?", "required": true}, {"id": "consent", "type": "boolean", "label": "Acepto los riesgos y responsabilidades.", "required": true}]}	CRITICAL	PSYCHEDELIC	INTAKE	t	2025-12-17 01:05:30.51392+00	2025-12-17 01:05:30.51392+00	ONE_ON_ONE	CALENDAR	8a69e67e50	\N
c8eb8c3f-d574-481f-a50f-8af78785b4e1	4946f21f-9235-431b-b98f-a247ff1931a2	Intención y Preparación	Para alinear el propósito de tu experiencia.	{"fields": [{"id": "intention", "type": "textarea", "label": "¿Cuál es tu intención principal para esta sesión?", "required": true}, {"id": "fear", "type": "textarea", "label": "¿Hay algún miedo o preocupación presente?", "required": false}, {"id": "diet", "type": "select", "label": "¿Has seguido la dieta preparatoria?", "options": ["Sí, estricta", "Parcialmente", "No"], "required": true}]}	MEDIUM	PSYCHEDELIC	PRE_SESSION	t	2025-12-17 01:05:30.51392+00	2025-12-17 01:05:30.51392+00	ONE_ON_ONE	CALENDAR	f9c654192a	\N
b967722e-da8a-4791-a6dc-80c36517ee85	4946f21f-9235-431b-b98f-a247ff1931a2	Check-in de Integración (48h)	Seguimiento posterior a la experiencia.	{"fields": [{"id": "emotional_state", "max": 10, "min": 1, "type": "scale", "label": "Estado emocional general (1-10)", "required": true}, {"id": "insights", "type": "textarea", "label": "Comparte tus insights o revelaciones principales.", "required": true}, {"id": "difficulty", "type": "textarea", "label": "¿Estás experimentando alguna dificultad de integración?", "required": false}]}	LOW	INTEGRATION	FEEDBACK	t	2025-12-17 01:05:30.51392+00	2025-12-17 01:05:30.51392+00	ONE_ON_ONE	CALENDAR	f152fbfacf	\N
828a8cc9-1bb3-42bb-925d-fdd66d947c37	4946f21f-9235-431b-b98f-a247ff1931a2	Screening Médico Riguroso	Evaluación de seguridad obligatoria antes de participar en ceremonias con psilocibina. Tu bienestar es nuestra prioridad.	{"fields": [{"id": "medication_ssri", "type": "MEDICAL_BOOLEAN", "label": "¿Estás tomando actualmente antidepresivos ISRS (Prozac, Zoloft, Lexapro, etc.)?", "required": true, "risk_flag": true, "risk_reason": "Interacción peligrosa con psilocibina (síndrome serotoninérgico)"}, {"id": "medication_maoi", "type": "MEDICAL_BOOLEAN", "label": "¿Estás tomando inhibidores MAO o medicación para Parkinson?", "required": true, "risk_flag": true, "risk_reason": "Contraindicación absoluta con psilocibina"}, {"id": "history_psychosis", "type": "MEDICAL_BOOLEAN", "label": "¿Tienes historial personal o familiar de psicosis, esquizofrenia o trastorno bipolar tipo I?", "required": true, "risk_flag": true, "risk_reason": "Riesgo de descompensación psicótica"}, {"id": "heart_condition", "type": "MEDICAL_BOOLEAN", "label": "¿Padeces alguna enfermedad cardíaca o hipertensión no controlada?", "required": true, "risk_flag": true, "risk_reason": "Psilocibina puede elevar presión arterial"}, {"id": "pregnancy", "type": "MEDICAL_BOOLEAN", "label": "¿Estás embarazada o en período de lactancia?", "required": true, "risk_flag": true, "risk_reason": "No hay datos de seguridad en embarazo"}, {"id": "mental_health_history", "type": "TEXTAREA", "label": "Describe brevemente tu historial de salud mental (diagnósticos, tratamientos previos, etc.)", "required": true, "placeholder": "Incluye cualquier diagnóstico, medicación actual o pasada, y experiencias relevantes..."}, {"id": "experience_psychedelics", "type": "SELECT", "label": "¿Cuál es tu experiencia previa con sustancias psicodélicas?", "options": [{"label": "Ninguna - Esta será mi primera vez", "value": "none"}, {"label": "Mínima - 1-2 experiencias", "value": "minimal"}, {"label": "Moderada - 3-10 experiencias", "value": "moderate"}, {"label": "Extensa - Más de 10 experiencias", "value": "extensive"}], "required": true}, {"id": "intentions", "type": "TEXTAREA", "label": "¿Cuáles son tus intenciones para esta ceremonia?", "required": true, "placeholder": "¿Qué esperas explorar, sanar o comprender?"}, {"id": "emergency_contact", "type": "TEXT", "label": "Contacto de emergencia (nombre y teléfono)", "required": true}]}	HIGH	PSYCHEDELIC	INTAKE	t	2025-12-17 01:17:14.267571+00	2025-12-17 01:17:14.267571+00	ONE_ON_ONE	CALENDAR	\N	\N
a325fcf3-87f2-4c9c-a369-acc9da768c25	4946f21f-9235-431b-b98f-a247ff1931a2	Coordenadas de Nacimiento	Para preparar tu lectura de carta natal, necesito tus datos de nacimiento exactos. Cuanto más precisos, mejor será la interpretación.	{"fields": [{"id": "birth_date", "type": "DATE", "label": "Fecha de nacimiento", "required": true}, {"id": "birth_time", "type": "TIME", "label": "Hora de nacimiento (lo más exacta posible)", "required": true, "helper_text": "Puedes consultar tu certificado de nacimiento o preguntar a familiares"}, {"id": "birth_time_accuracy", "type": "SELECT", "label": "¿Qué tan seguro/a estás de la hora?", "options": [{"label": "Exacta (certificado de nacimiento)", "value": "exact"}, {"label": "Aproximada (me lo dijeron)", "value": "approximate"}, {"label": "Incierta (no estoy seguro/a)", "value": "uncertain"}], "required": true}, {"id": "birth_city", "type": "TEXT", "label": "Ciudad de nacimiento", "required": true, "placeholder": "Ej: Barcelona, Madrid, Buenos Aires..."}, {"id": "birth_country", "type": "TEXT", "label": "País de nacimiento", "required": true}, {"id": "current_focus", "type": "TEXTAREA", "label": "¿Qué áreas de tu vida te gustaría explorar en la lectura?", "required": false, "placeholder": "Amor, carrera, propósito, relaciones familiares..."}]}	LOW	ASTROLOGY	PRE_SESSION	t	2025-12-17 01:17:14.267571+00	2025-12-17 01:17:14.267571+00	ONE_ON_ONE	CALENDAR	\N	\N
14006cd5-84ee-4918-911f-a119ba278414	4946f21f-9235-431b-b98f-a247ff1931a2	Check-in Semanal	Tu reflexión semanal para maximizar el progreso en tu proceso de transformación.	{"fields": [{"id": "energy_level", "max": 10, "min": 1, "type": "SCALE", "label": "¿Cómo está tu nivel de energía esta semana?", "required": true, "max_label": "En mi mejor momento", "min_label": "Agotado"}, {"id": "goals_progress", "type": "SELECT", "label": "¿Cumpliste los objetivos que acordamos la semana pasada?", "options": [{"label": "✅ Sí, todos", "value": "all"}, {"label": "🟡 La mayoría", "value": "most"}, {"label": "🟠 Algunos", "value": "some"}, {"label": "🔴 Ninguno", "value": "none"}], "required": true}, {"id": "biggest_win", "type": "TEXTAREA", "label": "¿Cuál fue tu mayor victoria esta semana?", "required": true, "placeholder": "Puede ser algo grande o pequeño..."}, {"id": "biggest_challenge", "type": "TEXTAREA", "label": "¿Cuál fue tu mayor desafío?", "required": true, "placeholder": "¿Qué te costó más? ¿Qué te frenó?"}, {"id": "insights", "type": "TEXTAREA", "label": "¿Qué aprendiste sobre ti mismo/a esta semana?", "required": false, "placeholder": "Reflexiones, patrones que notaste, revelaciones..."}, {"id": "next_week_focus", "type": "TEXT", "label": "¿En qué te quieres enfocar la próxima semana?", "required": true}]}	LOW	GENERAL	FEEDBACK	t	2025-12-17 01:17:14.267571+00	2025-12-17 01:17:14.267571+00	ONE_ON_ONE	CALENDAR	\N	\N
1e300b4b-03b9-4596-a8a9-9ec1ff0ba44c	4946f21f-9235-431b-b98f-a247ff1931a2	Exención de Responsabilidad (Waiver)	Documento legal obligatorio antes de participar en clases de yoga. Por favor, léelo con atención.	{"fields": [{"id": "health_conditions", "type": "TEXTAREA", "label": "¿Tienes alguna condición médica, lesión o limitación física que debamos conocer?", "required": true, "placeholder": "Lesiones de espalda, rodillas, embarazo, condiciones cardíacas, etc. Escribe 'Ninguna' si no aplica."}, {"id": "waiver_understanding", "type": "CHECKBOX", "label": "Entiendo que el yoga implica esfuerzo físico y que participo bajo mi propia responsabilidad", "required": true}, {"id": "waiver_injuries", "type": "CHECKBOX", "label": "Me comprometo a informar al instructor de cualquier lesión o incomodidad durante la clase", "required": true}, {"id": "waiver_liability", "type": "CHECKBOX", "label": "Eximo al estudio Urban Om y sus instructores de responsabilidad por lesiones que puedan ocurrir durante la práctica", "required": true}, {"id": "photo_consent", "type": "SELECT", "label": "¿Autorizas el uso de fotografías de las clases en redes sociales?", "options": [{"label": "Sí, autorizo", "value": "yes"}, {"label": "No, prefiero no aparecer", "value": "no"}], "required": true}, {"id": "signature", "type": "TEXT", "label": "Nombre completo (como firma digital)", "required": true, "placeholder": "Escribe tu nombre completo"}, {"id": "signature_date", "type": "DATE", "label": "Fecha de firma", "required": true}]}	LOW	GENERAL	INTAKE	t	2025-12-17 01:17:14.267571+00	2025-12-17 01:17:14.267571+00	ONE_ON_ONE	CALENDAR	\N	\N
ec7dea15-cbac-49c7-a4a4-0267b733531f	4946f21f-9235-431b-b98f-a247ff1931a2	Encuesta de Satisfacción	Tu feedback es muy valioso para seguir mejorando. ¡Gracias por tomarte un momento!	{"fields": [{"id": "overall_rating", "max": 5, "min": 1, "type": "SCALE", "label": "¿Cómo calificarías tu experiencia general?", "required": true, "max_label": "Muy satisfecho", "min_label": "Muy insatisfecho"}, {"id": "expectations_met", "type": "SELECT", "label": "¿Se cumplieron tus expectativas?", "options": [{"label": "🌟 Superadas", "value": "exceeded"}, {"label": "✅ Cumplidas", "value": "met"}, {"label": "🟡 Parcialmente", "value": "partially"}, {"label": "🔴 No cumplidas", "value": "not_met"}], "required": true}, {"id": "most_valuable", "type": "TEXTAREA", "label": "¿Qué fue lo más valioso de la experiencia?", "required": false, "placeholder": "Lo que más te impactó, ayudó o gustó..."}, {"id": "improvement_suggestions", "type": "TEXTAREA", "label": "¿Qué podríamos mejorar?", "required": false, "placeholder": "Cualquier sugerencia es bienvenida..."}, {"id": "would_recommend", "type": "SELECT", "label": "¿Recomendarías este servicio a un amigo o familiar?", "options": [{"label": "Definitivamente sí", "value": "definitely"}, {"label": "Probablemente sí", "value": "probably"}, {"label": "No estoy seguro/a", "value": "not_sure"}, {"label": "Probablemente no", "value": "no"}], "required": true}, {"id": "testimonial", "type": "TEXTAREA", "label": "¿Te gustaría dejar un testimonial que podamos compartir? (opcional)", "required": false, "placeholder": "Si prefieres mantenerlo privado, déjalo en blanco"}]}	LOW	GENERAL	POST_SESSION	t	2025-12-17 01:17:14.267571+00	2025-12-17 01:17:14.267571+00	ONE_ON_ONE	CALENDAR	\N	\N
\.


--
-- Data for Name: journey_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.journey_logs (id, patient_id, journey_key, from_stage, to_stage, changed_at, trigger_event_id) FROM stdin;
467e6365-5477-48e0-b72a-ba96a00343f9	192273cc-6c1d-4fe8-9520-da516d4f7f05	retreat_ibiza_2025	\N	BLOCKED_MEDICAL	2025-12-16 23:17:02.662525+00	\N
8678fb4e-5021-4472-94f2-3d94a19287d7	5fe170f7-c5c0-4b56-8eab-0212636d6d3a	retreat_ibiza_2025	AWAITING_SCREENING	PREPARATION_PHASE	2025-12-15 01:17:02.664866+00	\N
f9755d9b-5887-488e-8135-c6e4c1591082	1a1477c1-473b-4f57-a655-2f04410b6598	retreat_ibiza_2025	PREPARATION_PHASE	AWAITING_PAYMENT	2025-12-14 01:17:02.66642+00	\N
995b3610-cd9a-432c-8137-7576ca7cb5d7	4e0cf80e-39eb-4d7f-97a5-a01cbeb381fe	carta_natal	\N	AWAITING_BIRTH_DATA	2025-12-16 19:17:02.667865+00	\N
89fe8c83-095a-4de7-91f6-645bd05a10e1	7716b42a-6c52-4856-9cd9-acb57689c499	carta_natal	AWAITING_BIRTH_DATA	ANALYSIS_IN_PROGRESS	2025-12-16 01:17:02.669378+00	\N
e972160c-ea78-4f7f-84c9-2f8c570730f3	89619fa2-2eb0-45ae-b3cb-b17940b45c02	despertar_8s	\N	ONBOARDING	2025-12-10 01:17:02.670732+00	\N
647eab35-00aa-4074-ae09-996c01796625	3aaf24b8-0c35-4dd3-8421-e6e5e54d60f7	despertar_8s	DEEP_DIVE	STAGNATION_ALERT	2025-12-02 01:17:02.67205+00	\N
e75b5e44-a365-4c73-9b55-18cad4f1263b	687a9f1b-047c-4cd2-be04-f0ed33f682b8	despertar_8s	DEEP_DIVE	GRADUATED	2025-12-14 01:17:02.673527+00	\N
8bd0090f-fdfe-4c4d-b106-3a31324a7aaa	9197203b-a4bf-4d67-80fd-e0f642c5587e	yoga_urban_om	\N	AWAITING_WAIVER	2025-12-17 00:17:02.67487+00	\N
67249d8c-ca76-402a-ae0e-a11a1ab22aea	ef83d0fa-14e0-4933-89eb-68f2febcea2a	yoga_urban_om	AWAITING_WAIVER	ACTIVE_STUDENT	2025-11-17 01:17:02.676149+00	\N
\.


--
-- Data for Name: journey_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.journey_templates (id, organization_id, name, key, allowed_stages, initial_stage, is_active, created_at) FROM stdin;
4c7fdf5a-44be-4f55-a569-831bfa40e830	4946f21f-9235-431b-b98f-a247ff1931a2	Retiro Ibiza 2025 (Psilocibina)	retreat_ibiza_2025	["AWAITING_SCREENING", "BLOCKED_MEDICAL", "PREPARATION_PHASE", "AWAITING_PAYMENT", "CONFIRMED", "COMPLETED"]	AWAITING_SCREENING	t	2025-12-17 01:17:02.645124+00
ddcaab48-f158-4310-9206-10dd4289e6e9	4946f21f-9235-431b-b98f-a247ff1931a2	Lectura Carta Natal	carta_natal	["AWAITING_BIRTH_DATA", "ANALYSIS_IN_PROGRESS", "READY_FOR_SESSION", "COMPLETED"]	AWAITING_BIRTH_DATA	t	2025-12-17 01:17:02.645124+00
ab0689ab-c1c7-4179-bec3-070fe870b781	4946f21f-9235-431b-b98f-a247ff1931a2	Programa El Despertar (8 sesiones)	despertar_8s	["ONBOARDING", "DEEP_DIVE", "STAGNATION_ALERT", "GRADUATED", "CANCELLED"]	ONBOARDING	t	2025-12-17 01:17:02.645124+00
f90d38c7-8695-43e9-a4a8-e75c6c73df0e	4946f21f-9235-431b-b98f-a247ff1931a2	Urban Om Yoga	yoga_urban_om	["AWAITING_WAIVER", "ACTIVE_STUDENT", "PAUSED", "INACTIVE"]	AWAITING_WAIVER	t	2025-12-17 01:17:02.645124+00
\.


--
-- Data for Name: message_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.message_logs (id, organization_id, patient_id, direction, content, provider_id, status, "timestamp") FROM stdin;
2b4d0b84-f602-42ef-90a1-03075176ad79	4946f21f-9235-431b-b98f-a247ff1931a2	3aaf24b8-0c35-4dd3-8421-e6e5e54d60f7	INBOUND	Buenos días! La sesión del fin de semana fue increíble. Me siento muy conectado.	demo_3aaf24b8-0c35-4dd3-8421-e6e5e54d60f7_0_0	RECEIVED	2025-12-11 10:00:00+00
c76a6d19-bdc2-49c9-a0d8-5aa22a0a5db2	4946f21f-9235-431b-b98f-a247ff1931a2	3aaf24b8-0c35-4dd3-8421-e6e5e54d60f7	OUTBOUND	Me alegra mucho leer eso, Javier. ¿Cómo has dormido?	demo_3aaf24b8-0c35-4dd3-8421-e6e5e54d60f7_0_1	SENT	2025-12-11 10:15:00+00
67468e4c-fe10-46f3-a51c-654db7efcda0	4946f21f-9235-431b-b98f-a247ff1931a2	3aaf24b8-0c35-4dd3-8421-e6e5e54d60f7	INBOUND	Muy bien, casi 8 horas. Hace tiempo que no dormía así.	demo_3aaf24b8-0c35-4dd3-8421-e6e5e54d60f7_0_2	RECEIVED	2025-12-11 10:30:00+00
d6979791-a9c6-4515-bddc-4992a82a0397	4946f21f-9235-431b-b98f-a247ff1931a2	3aaf24b8-0c35-4dd3-8421-e6e5e54d60f7	INBOUND	Hoy he tenido algunos recuerdos de infancia. Me puse a llorar en el trabajo.	demo_3aaf24b8-0c35-4dd3-8421-e6e5e54d60f7_1_0	RECEIVED	2025-12-12 10:00:00+00
9d644533-01a5-481c-af47-64037919056b	4946f21f-9235-431b-b98f-a247ff1931a2	3aaf24b8-0c35-4dd3-8421-e6e5e54d60f7	OUTBOUND	Es completamente normal. El proceso de integración mueve cosas profundas.	demo_3aaf24b8-0c35-4dd3-8421-e6e5e54d60f7_1_1	SENT	2025-12-12 10:15:00+00
de0cd433-94f8-446c-9af8-fd5a0f52c3f4	4946f21f-9235-431b-b98f-a247ff1931a2	3aaf24b8-0c35-4dd3-8421-e6e5e54d60f7	INBOUND	Sí, me sentí un poco vulnerable pero también liberado.	demo_3aaf24b8-0c35-4dd3-8421-e6e5e54d60f7_1_2	RECEIVED	2025-12-12 10:30:00+00
74fb9072-9e85-44e6-b819-71e1e86e98de	4946f21f-9235-431b-b98f-a247ff1931a2	3aaf24b8-0c35-4dd3-8421-e6e5e54d60f7	INBOUND	No he dormido muy bien anoche. Muchos sueños intensos.	demo_3aaf24b8-0c35-4dd3-8421-e6e5e54d60f7_2_0	RECEIVED	2025-12-13 10:00:00+00
1a77ea73-257e-4f01-9074-2e8f41124ea0	4946f21f-9235-431b-b98f-a247ff1931a2	3aaf24b8-0c35-4dd3-8421-e6e5e54d60f7	OUTBOUND	Los sueños vívidos son comunes en integración. ¿Qué temas aparecían?	demo_3aaf24b8-0c35-4dd3-8421-e6e5e54d60f7_2_1	SENT	2025-12-13 10:15:00+00
8df8bc73-fae6-4862-9db7-f0b3277cceb4	4946f21f-9235-431b-b98f-a247ff1931a2	3aaf24b8-0c35-4dd3-8421-e6e5e54d60f7	INBOUND	Mi padre, sobre todo. Cosas que nunca hablamos.	demo_3aaf24b8-0c35-4dd3-8421-e6e5e54d60f7_2_2	RECEIVED	2025-12-13 10:30:00+00
aaff01cc-d364-4e43-b11e-1dd1d3234c99	4946f21f-9235-431b-b98f-a247ff1931a2	3aaf24b8-0c35-4dd3-8421-e6e5e54d60f7	INBOUND	Hoy todo me irrita. Mi jefe, el tráfico, todo.	demo_3aaf24b8-0c35-4dd3-8421-e6e5e54d60f7_3_0	RECEIVED	2025-12-14 10:00:00+00
7220e604-5828-4c24-b4ae-741da58575e5	4946f21f-9235-431b-b98f-a247ff1931a2	3aaf24b8-0c35-4dd3-8421-e6e5e54d60f7	OUTBOUND	¿Puedes identificar qué hay debajo de esa irritación?	demo_3aaf24b8-0c35-4dd3-8421-e6e5e54d60f7_3_1	SENT	2025-12-14 10:15:00+00
9fc10c6c-8049-4221-943c-e340b98c425e	4946f21f-9235-431b-b98f-a247ff1931a2	3aaf24b8-0c35-4dd3-8421-e6e5e54d60f7	INBOUND	No sé... me siento como perdido. Antes tenía todo claro y ahora no sé qué quiero.	demo_3aaf24b8-0c35-4dd3-8421-e6e5e54d60f7_3_2	RECEIVED	2025-12-14 10:30:00+00
92f46a00-c203-480f-81b7-4087b15209cc	4946f21f-9235-431b-b98f-a247ff1931a2	3aaf24b8-0c35-4dd3-8421-e6e5e54d60f7	INBOUND	No tengo ganas de nada. He cancelado planes con amigos.	demo_3aaf24b8-0c35-4dd3-8421-e6e5e54d60f7_4_0	RECEIVED	2025-12-15 10:00:00+00
a2b06221-5211-4039-b068-df7408d5cdfb	4946f21f-9235-431b-b98f-a247ff1931a2	3aaf24b8-0c35-4dd3-8421-e6e5e54d60f7	OUTBOUND	Entiendo. ¿Estás cuidando lo básico? Alimentación, movimiento...	demo_3aaf24b8-0c35-4dd3-8421-e6e5e54d60f7_4_1	SENT	2025-12-15 10:15:00+00
7fb445e9-4b46-4405-af0d-92b7497f3bb5	4946f21f-9235-431b-b98f-a247ff1931a2	3aaf24b8-0c35-4dd3-8421-e6e5e54d60f7	INBOUND	Más o menos. Ayer me salté la cena porque no tenía hambre.	demo_3aaf24b8-0c35-4dd3-8421-e6e5e54d60f7_4_2	RECEIVED	2025-12-15 10:30:00+00
e90878e9-3c25-45da-8c12-9e7289906640	4946f21f-9235-431b-b98f-a247ff1931a2	3aaf24b8-0c35-4dd3-8421-e6e5e54d60f7	INBOUND	Llevo 3 días sin hablar con nadie. No tiene sentido.	demo_3aaf24b8-0c35-4dd3-8421-e6e5e54d60f7_5_0	RECEIVED	2025-12-16 10:00:00+00
c1e14aef-f8fe-429c-b174-5d5115a7d2ec	4946f21f-9235-431b-b98f-a247ff1931a2	3aaf24b8-0c35-4dd3-8421-e6e5e54d60f7	OUTBOUND	Javier, me preocupa lo que escribes. ¿Podemos hablar por teléfono?	demo_3aaf24b8-0c35-4dd3-8421-e6e5e54d60f7_5_1	SENT	2025-12-16 10:15:00+00
119d2574-d8db-40b8-be2d-22024b212fd2	4946f21f-9235-431b-b98f-a247ff1931a2	3aaf24b8-0c35-4dd3-8421-e6e5e54d60f7	INBOUND	No sé. Siento que nada de lo que hice en la sesión sirvió. Estoy peor que antes.	demo_3aaf24b8-0c35-4dd3-8421-e6e5e54d60f7_5_2	RECEIVED	2025-12-16 10:30:00+00
0acdd4d6-30e2-4da2-aa6a-cfce556db6e2	4946f21f-9235-431b-b98f-a247ff1931a2	3aaf24b8-0c35-4dd3-8421-e6e5e54d60f7	INBOUND	No puedo más. Todo está oscuro. No veo salida.	demo_3aaf24b8-0c35-4dd3-8421-e6e5e54d60f7_6_0	RECEIVED	2025-12-17 10:00:00+00
ea066ad6-a54d-4bc3-b7b0-fdbcb7fb8b27	4946f21f-9235-431b-b98f-a247ff1931a2	3aaf24b8-0c35-4dd3-8421-e6e5e54d60f7	OUTBOUND	Javier, esto es importante. Estoy aquí contigo. ¿Estás en un lugar seguro?	demo_3aaf24b8-0c35-4dd3-8421-e6e5e54d60f7_6_1	SENT	2025-12-17 10:15:00+00
f0a3db4e-47f2-4647-b364-394dc8e8fa82	4946f21f-9235-431b-b98f-a247ff1931a2	3aaf24b8-0c35-4dd3-8421-e6e5e54d60f7	INBOUND	Sí, en casa. Pero siento que todo fue un error. La sesión solo me abrió heridas que no puedo cerrar.	demo_3aaf24b8-0c35-4dd3-8421-e6e5e54d60f7_6_2	RECEIVED	2025-12-17 10:30:00+00
\.


--
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.organizations (id, name, type, referral_code, referred_by_id, created_at, updated_at, tier, ai_credits_monthly_quota, ai_credits_purchased, ai_credits_used_this_month, credits_reset_at, settings, stripe_customer_id, stripe_subscription_id, stripe_connect_id, stripe_connect_enabled) FROM stdin;
4946f21f-9235-431b-b98f-a247ff1931a2	Humbert	SOLO	Hr28TX-Xul0	\N	2025-12-10 02:19:59.14104+00	2025-12-16 18:02:07.765016+00	CENTER	100	100	10	\N	\N	cus_Tc6ZtxpogGpWwc	\N	acct_1SesRoDkXPa07ciZ	f
\.


--
-- Data for Name: patients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.patients (id, first_name, last_name, email, phone, organization_id, created_at, language, birth_date, birth_time, birth_place, journey_status, last_insight_json, last_insight_at, profile_data, profile_image_url) FROM stdin;
192273cc-6c1d-4fe8-9520-da516d4f7f05	Elena	Torres Medicación	elena.torres@demo.com	+34 612 345 678	4946f21f-9235-431b-b98f-a247ff1931a2	2025-12-17 01:17:02.645124+00	es	\N	\N	\N	{"retreat_ibiza_2025": "BLOCKED_MEDICAL"}	\N	\N	{}	/demo-avatars/elena.png
5fe170f7-c5c0-4b56-8eab-0212636d6d3a	Miguel	Sánchez Aprobado	miguel.sanchez@demo.com	+34 623 456 789	4946f21f-9235-431b-b98f-a247ff1931a2	2025-12-17 01:17:02.645124+00	es	\N	\N	\N	{"retreat_ibiza_2025": "PREPARATION_PHASE"}	\N	\N	{}	/demo-avatars/miguel.png
1a1477c1-473b-4f57-a655-2f04410b6598	Sofía	Blanco Espera	sofia.blanco@demo.com	+34 634 567 890	4946f21f-9235-431b-b98f-a247ff1931a2	2025-12-17 01:17:02.645124+00	es	\N	\N	\N	{"retreat_ibiza_2025": "AWAITING_PAYMENT"}	\N	\N	{}	/demo-avatars/sofia.png
4e0cf80e-39eb-4d7f-97a5-a01cbeb381fe	Carmen	Luna Datos	carmen.luna@demo.com	+34 645 678 901	4946f21f-9235-431b-b98f-a247ff1931a2	2025-12-17 01:17:02.645124+00	es	\N	\N	\N	{"carta_natal": "AWAITING_BIRTH_DATA"}	\N	\N	{}	/demo-avatars/carmen.png
7716b42a-6c52-4856-9cd9-acb57689c499	Pablo	Estrella Análisis	pablo.estrella@demo.com	+34 656 789 012	4946f21f-9235-431b-b98f-a247ff1931a2	2025-12-17 01:17:02.645124+00	es	1985-03-15 00:00:00+00	14:32	Barcelona, España	{"carta_natal": "ANALYSIS_IN_PROGRESS"}	\N	\N	{}	/demo-avatars/pablo.png
89619fa2-2eb0-45ae-b3cb-b17940b45c02	David	Guerrero Onboarding	david.guerrero@demo.com	+34 667 890 123	4946f21f-9235-431b-b98f-a247ff1931a2	2025-12-17 01:17:02.645124+00	es	\N	\N	\N	{"despertar_8s": "ONBOARDING"}	\N	\N	{}	/demo-avatars/david.png
3aaf24b8-0c35-4dd3-8421-e6e5e54d60f7	Javier	Roca Estancado	javier.roca@demo.com	+34 678 901 234	4946f21f-9235-431b-b98f-a247ff1931a2	2025-12-17 01:17:02.645124+00	es	\N	\N	\N	{"despertar_8s": "STAGNATION_ALERT"}	\N	\N	{}	/demo-avatars/javier.png
687a9f1b-047c-4cd2-be04-f0ed33f682b8	Andrés	Valiente Graduado	andres.valiente@demo.com	+34 689 012 345	4946f21f-9235-431b-b98f-a247ff1931a2	2025-12-17 01:17:02.645124+00	es	\N	\N	\N	{"despertar_8s": "GRADUATED"}	\N	\N	{}	/demo-avatars/andres.png
9197203b-a4bf-4d67-80fd-e0f642c5587e	Laura	Paz Waiver	laura.paz@demo.com	+34 690 123 456	4946f21f-9235-431b-b98f-a247ff1931a2	2025-12-17 01:17:02.645124+00	es	\N	\N	\N	{"yoga_urban_om": "AWAITING_WAIVER"}	\N	\N	{}	/demo-avatars/laura.png
ef83d0fa-14e0-4933-89eb-68f2febcea2a	Ana	Om Activa	ana.om@demo.com	+34 601 234 567	4946f21f-9235-431b-b98f-a247ff1931a2	2025-12-17 01:17:02.645124+00	es	\N	\N	\N	{"yoga_urban_om": "ACTIVE_STUDENT"}	\N	\N	{}	/demo-avatars/ana.png
\.


--
-- Data for Name: schedule_calendar_syncs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.schedule_calendar_syncs (id, schedule_id, blocking_calendar_ids, booking_calendar_id, sync_enabled, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: service_therapist_link; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.service_therapist_link (service_type_id, user_id) FROM stdin;
3a17de2b-9af2-455f-8239-8e4e90b48ed1	74ff0a7a-b6bf-4c9a-8dcd-97fb23702279
00de9a4c-b631-4dd5-97db-69d3c3f0dd0a	74ff0a7a-b6bf-4c9a-8dcd-97fb23702279
0f957488-f8cf-4032-8704-ff1ef532804e	74ff0a7a-b6bf-4c9a-8dcd-97fb23702279
65879c23-96f8-4813-8269-503b98029828	74ff0a7a-b6bf-4c9a-8dcd-97fb23702279
42dc3749-93e2-43c6-b975-d7c0dbd4bab2	74ff0a7a-b6bf-4c9a-8dcd-97fb23702279
ada61100-916e-4dd3-9c54-b183f6bab804	74ff0a7a-b6bf-4c9a-8dcd-97fb23702279
32bd6efb-7cd8-43b4-82aa-335d2ce9b85b	74ff0a7a-b6bf-4c9a-8dcd-97fb23702279
\.


--
-- Data for Name: service_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.service_types (id, organization_id, title, description, kind, duration_minutes, price, currency, capacity, intake_form_id, requires_approval, is_active, created_at, updated_at, schedule_id, scheduling_type, cancellation_policy) FROM stdin;
3a17de2b-9af2-455f-8239-8e4e90b48ed1	4946f21f-9235-431b-b98f-a247ff1931a2	Retiro Ayahuasca (Inmersión Profunda)	Retiro de fin de semana con dos ceremonias de Ayahuasca. Incluye alojamiento, dieta preparatoria y acompañamiento integral. Viernes 18h a Domingo 15h.	GROUP	2700	490	EUR	7	\N	t	t	2025-12-17 00:11:08.486483+00	2025-12-17 00:11:08.486483+00	58c01f1c-fa49-4278-aab7-3bf15b46d44f	FIXED_DATE	\N
00de9a4c-b631-4dd5-97db-69d3c3f0dd0a	4946f21f-9235-431b-b98f-a247ff1931a2	Viaje a la Selva (Master Plant Diet)	Inmersión de 10 días en la Amazonía con dieta de plantas maestras. Guiado por maestros shipibo. Fechas: Abril y Septiembre.	GROUP	14400	1900	EUR	7	\N	t	t	2025-12-17 00:11:08.486483+00	2025-12-17 00:11:08.486483+00	58c01f1c-fa49-4278-aab7-3bf15b46d44f	FIXED_DATE	\N
0f957488-f8cf-4032-8704-ff1ef532804e	4946f21f-9235-431b-b98f-a247ff1931a2	Sesión de Bufo Alvarius (5-MeO-DMT)	Experiencia individual con la medicina del sapo. Incluye preparación, ceremonia y espacio de integración inicial.	ONE_ON_ONE	240	190	EUR	1	\N	t	t	2025-12-17 00:11:08.486483+00	2025-12-17 00:11:08.486483+00	58c01f1c-fa49-4278-aab7-3bf15b46d44f	CALENDAR	\N
65879c23-96f8-4813-8269-503b98029828	4946f21f-9235-431b-b98f-a247ff1931a2	Sesión de Psilocibina (Alta Dosis)	Sesión guiada con hongos psilocibina en dosis alta (heroica). Jornada completa con preparación y cierre.	ONE_ON_ONE	480	390	EUR	1	\N	t	t	2025-12-17 00:11:08.486483+00	2025-12-17 00:11:08.486483+00	58c01f1c-fa49-4278-aab7-3bf15b46d44f	CALENDAR	\N
42dc3749-93e2-43c6-b975-d7c0dbd4bab2	4946f21f-9235-431b-b98f-a247ff1931a2	Sesión de Kambó (Purga)	Ceremonia de purificación con la medicina del sapo Kambó. Incluye preparación y acompañamiento post-sesión.	ONE_ON_ONE	240	190	EUR	1	\N	t	t	2025-12-17 00:11:08.486483+00	2025-12-17 00:11:08.486483+00	58c01f1c-fa49-4278-aab7-3bf15b46d44f	CALENDAR	\N
ada61100-916e-4dd3-9c54-b183f6bab804	4946f21f-9235-431b-b98f-a247ff1931a2	Sesión de Preparación e Integración	Sesión de acompañamiento terapéutico antes o después de una experiencia psicodélica. Trabajo de intención, integración de insights y seguimiento.	ONE_ON_ONE	90	90	EUR	1	\N	f	t	2025-12-17 00:11:08.486483+00	2025-12-17 00:11:08.486483+00	58c01f1c-fa49-4278-aab7-3bf15b46d44f	CALENDAR	\N
32bd6efb-7cd8-43b4-82aa-335d2ce9b85b	4946f21f-9235-431b-b98f-a247ff1931a2	Programa Microdosis (Protocolo Fadiman)	Programa de 10 semanas con microdosis de psilocibina. Incluye kit de microdosis, 3 sesiones de seguimiento y acceso a comunidad privada.	ONE_ON_ONE	600	690	EUR	1	\N	t	t	2025-12-17 00:11:08.486483+00	2025-12-17 00:11:08.486483+00	58c01f1c-fa49-4278-aab7-3bf15b46d44f	FIXED_DATE	\N
3a8030b4-a313-4017-8242-18e19c7365a2	4946f21f-9235-431b-b98f-a247ff1931a2	Ceremonia Grupal Psilocibina	Retiro de fin de semana en Ibiza con ceremonia guiada de psilocibina, integración terapéutica, alojamiento y comidas incluidas. Máximo 8 participantes para atención personalizada.	GROUP	2880	450	EUR	8	\N	f	t	2025-12-17 01:16:53.876041+00	2025-12-17 01:16:53.876041+00	\N	FIXED_DATE	\N
3f0ddc7f-ba6b-432f-926d-3cd4ba117a28	4946f21f-9235-431b-b98f-a247ff1931a2	Lectura de Carta Natal	Sesión personalizada de 60 minutos vía Zoom donde exploraremos tu carta natal completa: Sol, Luna, Ascendente, las 12 casas y los aspectos más relevantes para tu momento actual.	ONE_ON_ONE	60	120	EUR	1	\N	f	t	2025-12-17 01:16:53.876041+00	2025-12-17 01:16:53.876041+00	\N	CALENDAR	\N
65cf425c-420e-4848-be0a-aa0abdf9892d	4946f21f-9235-431b-b98f-a247ff1931a2	Programa El Despertar (8 sesiones)	Coaching transpersonal intensivo para hombres. 8 sesiones de 90 minutos a lo largo de 3 meses. Incluye ejercicios entre sesiones, acceso a grupo privado y materiales de trabajo.	ONE_ON_ONE	90	800	EUR	1	\N	f	t	2025-12-17 01:16:53.876041+00	2025-12-17 01:16:53.876041+00	\N	CALENDAR	\N
44f1459b-ae79-4613-915a-057dd9331a33	4946f21f-9235-431b-b98f-a247ff1931a2	Vinyasa Flow Sunset	Clase grupal dinámica al atardecer. Secuencias fluidas sincronizadas con la respiración. Apto para todos los niveles. Trae tu propia esterilla o usa las del estudio.	GROUP	75	15	EUR	15	\N	f	t	2025-12-17 01:16:53.876041+00	2025-12-17 01:16:53.876041+00	\N	FIXED_DATE	\N
\.


--
-- Data for Name: specific_availability; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.specific_availability (id, user_id, start_datetime, end_datetime, created_at, schedule_id) FROM stdin;
\.


--
-- Data for Name: system_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_events (id, organization_id, event_type, payload, status, error_message, entity_type, entity_id, created_at) FROM stdin;
\.


--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_settings (key, value, description, updated_at) FROM stdin;
FREE_PATIENT_LIMIT	5	Maximum patients for FREE tier	2025-12-17 01:15:18.615479+00
FREE_CREDITS_MONTHLY	100	Monthly AI credits for FREE tier	2025-12-17 01:15:18.615479+00
PRO_CREDITS_MONTHLY	500	Monthly AI credits for PRO tier	2025-12-17 01:15:18.615479+00
AI_COST_TEXT	1	Credits per text analysis	2025-12-17 01:15:18.615479+00
AI_COST_MULTIMODAL	5	Credits per audio/image analysis	2025-12-17 01:15:18.615479+00
AI_MODEL	"gemini-2.5-flash"	Default AI model	2025-12-17 01:15:18.615479+00
TIER_LIMIT_BUILDER	3	Max active patients for BUILDER tier	2025-12-17 01:15:18.615479+00
TIER_LIMIT_PRO	50	Max active patients for PRO tier	2025-12-17 01:15:18.615479+00
TIER_LIMIT_CENTER	150	Max active patients for CENTER tier	2025-12-17 01:15:18.615479+00
TIER_FEE_BUILDER	0.05	Commission rate for BUILDER tier (5%)	2025-12-17 01:15:18.615479+00
TIER_FEE_PRO	0.02	Commission rate for PRO tier (2%)	2025-12-17 01:15:18.615479+00
TIER_FEE_CENTER	0.01	Commission rate for CENTER tier (1%)	2025-12-17 01:15:18.615479+00
\.


--
-- Data for Name: time_off; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.time_off (id, user_id, start_datetime, end_datetime, reason, created_at, schedule_id) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, hashed_password, full_name, role, is_active, organization_id, created_at, updated_at, is_superuser, locale, ai_output_preference, phone, website, country, city, profile_image_url, social_media) FROM stdin;
74ff0a7a-b6bf-4c9a-8dcd-97fb23702279	humbert.torroella@gmail.com	$2b$12$LArU/OoqQ7KeVyLXL.0FOeyajzMSmUFoGZvXp5PdyKYqxyHVVUkVK	Humbert Torroella	OWNER	t	4946f21f-9235-431b-b98f-a247ff1931a2	2025-12-10 02:19:59.14104+00	2025-12-15 10:32:52.649162+00	t	es	AUTO	+34640912255	https://medicinasdelalma.com	ES	Barcelona	\N	\N
\.


--
-- Name: ai_usage_logs ai_usage_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_usage_logs
    ADD CONSTRAINT ai_usage_logs_pkey PRIMARY KEY (id);


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: attendees attendees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendees
    ADD CONSTRAINT attendees_pkey PRIMARY KEY (id);


--
-- Name: automation_execution_logs automation_execution_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.automation_execution_logs
    ADD CONSTRAINT automation_execution_logs_pkey PRIMARY KEY (id);


--
-- Name: automation_rules automation_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.automation_rules
    ADD CONSTRAINT automation_rules_pkey PRIMARY KEY (id);


--
-- Name: availability_blocks availability_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.availability_blocks
    ADD CONSTRAINT availability_blocks_pkey PRIMARY KEY (id);


--
-- Name: availability_schedules availability_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.availability_schedules
    ADD CONSTRAINT availability_schedules_pkey PRIMARY KEY (id);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: calendar_integrations calendar_integrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calendar_integrations
    ADD CONSTRAINT calendar_integrations_pkey PRIMARY KEY (id);


--
-- Name: clinical_entries clinical_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinical_entries
    ADD CONSTRAINT clinical_entries_pkey PRIMARY KEY (id);


--
-- Name: daily_conversation_analyses daily_conversation_analyses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_conversation_analyses
    ADD CONSTRAINT daily_conversation_analyses_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: form_assignments form_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.form_assignments
    ADD CONSTRAINT form_assignments_pkey PRIMARY KEY (id);


--
-- Name: form_templates form_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.form_templates
    ADD CONSTRAINT form_templates_pkey PRIMARY KEY (id);


--
-- Name: journey_logs journey_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.journey_logs
    ADD CONSTRAINT journey_logs_pkey PRIMARY KEY (id);


--
-- Name: journey_templates journey_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.journey_templates
    ADD CONSTRAINT journey_templates_pkey PRIMARY KEY (id);


--
-- Name: message_logs message_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.message_logs
    ADD CONSTRAINT message_logs_pkey PRIMARY KEY (id);


--
-- Name: message_logs message_logs_provider_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.message_logs
    ADD CONSTRAINT message_logs_provider_id_key UNIQUE (provider_id);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (id);


--
-- Name: schedule_calendar_syncs schedule_calendar_syncs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schedule_calendar_syncs
    ADD CONSTRAINT schedule_calendar_syncs_pkey PRIMARY KEY (id);


--
-- Name: service_therapist_link service_therapist_link_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_therapist_link
    ADD CONSTRAINT service_therapist_link_pkey PRIMARY KEY (service_type_id, user_id);


--
-- Name: service_types service_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_types
    ADD CONSTRAINT service_types_pkey PRIMARY KEY (id);


--
-- Name: specific_availability specific_availability_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.specific_availability
    ADD CONSTRAINT specific_availability_pkey PRIMARY KEY (id);


--
-- Name: system_events system_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_events
    ADD CONSTRAINT system_events_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (key);


--
-- Name: time_off time_off_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.time_off
    ADD CONSTRAINT time_off_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ix_ai_usage_logs_organization_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_ai_usage_logs_organization_id ON public.ai_usage_logs USING btree (organization_id);


--
-- Name: ix_ai_usage_logs_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_ai_usage_logs_user_id ON public.ai_usage_logs USING btree (user_id);


--
-- Name: ix_automation_execution_logs_automation_rule_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_automation_execution_logs_automation_rule_id ON public.automation_execution_logs USING btree (automation_rule_id);


--
-- Name: ix_automation_execution_logs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_automation_execution_logs_created_at ON public.automation_execution_logs USING btree (created_at);


--
-- Name: ix_automation_execution_logs_organization_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_automation_execution_logs_organization_id ON public.automation_execution_logs USING btree (organization_id);


--
-- Name: ix_automation_execution_logs_patient_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_automation_execution_logs_patient_id ON public.automation_execution_logs USING btree (patient_id);


--
-- Name: ix_automation_execution_logs_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_automation_execution_logs_status ON public.automation_execution_logs USING btree (status);


--
-- Name: ix_automation_rules_is_system_template; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_automation_rules_is_system_template ON public.automation_rules USING btree (is_system_template);


--
-- Name: ix_automation_rules_organization_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_automation_rules_organization_id ON public.automation_rules USING btree (organization_id);


--
-- Name: ix_automation_rules_trigger_event; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_automation_rules_trigger_event ON public.automation_rules USING btree (trigger_event);


--
-- Name: ix_availability_blocks_schedule_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_availability_blocks_schedule_id ON public.availability_blocks USING btree (schedule_id);


--
-- Name: ix_availability_blocks_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_availability_blocks_user_id ON public.availability_blocks USING btree (user_id);


--
-- Name: ix_availability_schedules_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_availability_schedules_user_id ON public.availability_schedules USING btree (user_id);


--
-- Name: ix_bookings_organization_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_bookings_organization_id ON public.bookings USING btree (organization_id);


--
-- Name: ix_bookings_patient_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_bookings_patient_id ON public.bookings USING btree (patient_id);


--
-- Name: ix_bookings_public_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_bookings_public_token ON public.bookings USING btree (public_token);


--
-- Name: ix_bookings_service_type_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_bookings_service_type_id ON public.bookings USING btree (service_type_id);


--
-- Name: ix_bookings_stripe_payment_intent_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_bookings_stripe_payment_intent_id ON public.bookings USING btree (stripe_payment_intent_id);


--
-- Name: ix_bookings_therapist_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_bookings_therapist_id ON public.bookings USING btree (therapist_id);


--
-- Name: ix_calendar_integrations_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_calendar_integrations_user_id ON public.calendar_integrations USING btree (user_id);


--
-- Name: ix_clinical_entries_patient_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_clinical_entries_patient_id ON public.clinical_entries USING btree (patient_id);


--
-- Name: ix_daily_analysis_patient_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_daily_analysis_patient_date ON public.daily_conversation_analyses USING btree (patient_id, date);


--
-- Name: ix_daily_conversation_analyses_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_daily_conversation_analyses_date ON public.daily_conversation_analyses USING btree (date);


--
-- Name: ix_daily_conversation_analyses_organization_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_daily_conversation_analyses_organization_id ON public.daily_conversation_analyses USING btree (organization_id);


--
-- Name: ix_daily_conversation_analyses_patient_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_daily_conversation_analyses_patient_id ON public.daily_conversation_analyses USING btree (patient_id);


--
-- Name: ix_form_assignments_patient_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_form_assignments_patient_id ON public.form_assignments USING btree (patient_id);


--
-- Name: ix_form_assignments_template_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_form_assignments_template_id ON public.form_assignments USING btree (template_id);


--
-- Name: ix_form_assignments_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_form_assignments_token ON public.form_assignments USING btree (token);


--
-- Name: ix_form_templates_organization_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_form_templates_organization_id ON public.form_templates USING btree (organization_id);


--
-- Name: ix_form_templates_public_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_form_templates_public_token ON public.form_templates USING btree (public_token);


--
-- Name: ix_journey_logs_journey_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_journey_logs_journey_key ON public.journey_logs USING btree (journey_key);


--
-- Name: ix_journey_logs_patient_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_journey_logs_patient_id ON public.journey_logs USING btree (patient_id);


--
-- Name: ix_journey_logs_patient_key_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_journey_logs_patient_key_time ON public.journey_logs USING btree (patient_id, journey_key, changed_at);


--
-- Name: ix_journey_templates_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_journey_templates_key ON public.journey_templates USING btree (key);


--
-- Name: ix_journey_templates_org_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_journey_templates_org_key ON public.journey_templates USING btree (organization_id, key);


--
-- Name: ix_journey_templates_organization_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_journey_templates_organization_id ON public.journey_templates USING btree (organization_id);


--
-- Name: ix_message_logs_organization_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_message_logs_organization_id ON public.message_logs USING btree (organization_id);


--
-- Name: ix_message_logs_patient_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_message_logs_patient_id ON public.message_logs USING btree (patient_id);


--
-- Name: ix_message_logs_patient_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_message_logs_patient_timestamp ON public.message_logs USING btree (patient_id, "timestamp");


--
-- Name: ix_message_logs_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_message_logs_timestamp ON public.message_logs USING btree ("timestamp");


--
-- Name: ix_organizations_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_organizations_name ON public.organizations USING btree (name);


--
-- Name: ix_organizations_referral_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_organizations_referral_code ON public.organizations USING btree (referral_code);


--
-- Name: ix_patients_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_patients_email ON public.patients USING btree (email);


--
-- Name: ix_schedule_calendar_syncs_schedule_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_schedule_calendar_syncs_schedule_id ON public.schedule_calendar_syncs USING btree (schedule_id);


--
-- Name: ix_service_types_organization_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_service_types_organization_id ON public.service_types USING btree (organization_id);


--
-- Name: ix_specific_availability_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_specific_availability_user_id ON public.specific_availability USING btree (user_id);


--
-- Name: ix_system_events_event_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_system_events_event_type ON public.system_events USING btree (event_type);


--
-- Name: ix_system_events_organization_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_system_events_organization_id ON public.system_events USING btree (organization_id);


--
-- Name: ix_time_off_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_time_off_user_id ON public.time_off USING btree (user_id);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: ai_usage_logs ai_usage_logs_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_usage_logs
    ADD CONSTRAINT ai_usage_logs_entry_id_fkey FOREIGN KEY (entry_id) REFERENCES public.clinical_entries(id) ON DELETE SET NULL;


--
-- Name: ai_usage_logs ai_usage_logs_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_usage_logs
    ADD CONSTRAINT ai_usage_logs_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: ai_usage_logs ai_usage_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_usage_logs
    ADD CONSTRAINT ai_usage_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: attendees attendees_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendees
    ADD CONSTRAINT attendees_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id);


--
-- Name: attendees attendees_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendees
    ADD CONSTRAINT attendees_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: automation_execution_logs automation_execution_logs_automation_rule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.automation_execution_logs
    ADD CONSTRAINT automation_execution_logs_automation_rule_id_fkey FOREIGN KEY (automation_rule_id) REFERENCES public.automation_rules(id) ON DELETE CASCADE;


--
-- Name: automation_execution_logs automation_execution_logs_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.automation_execution_logs
    ADD CONSTRAINT automation_execution_logs_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: automation_execution_logs automation_execution_logs_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.automation_execution_logs
    ADD CONSTRAINT automation_execution_logs_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE SET NULL;


--
-- Name: automation_rules automation_rules_cloned_from_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.automation_rules
    ADD CONSTRAINT automation_rules_cloned_from_id_fkey FOREIGN KEY (cloned_from_id) REFERENCES public.automation_rules(id);


--
-- Name: automation_rules automation_rules_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.automation_rules
    ADD CONSTRAINT automation_rules_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: availability_blocks availability_blocks_schedule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.availability_blocks
    ADD CONSTRAINT availability_blocks_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.availability_schedules(id);


--
-- Name: availability_blocks availability_blocks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.availability_blocks
    ADD CONSTRAINT availability_blocks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: availability_schedules availability_schedules_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.availability_schedules
    ADD CONSTRAINT availability_schedules_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: bookings bookings_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id);


--
-- Name: bookings bookings_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: bookings bookings_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: bookings bookings_service_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_service_type_id_fkey FOREIGN KEY (service_type_id) REFERENCES public.service_types(id);


--
-- Name: bookings bookings_therapist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES public.users(id);


--
-- Name: calendar_integrations calendar_integrations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calendar_integrations
    ADD CONSTRAINT calendar_integrations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: clinical_entries clinical_entries_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinical_entries
    ADD CONSTRAINT clinical_entries_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id);


--
-- Name: clinical_entries clinical_entries_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinical_entries
    ADD CONSTRAINT clinical_entries_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: daily_conversation_analyses daily_conversation_analyses_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_conversation_analyses
    ADD CONSTRAINT daily_conversation_analyses_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: daily_conversation_analyses daily_conversation_analyses_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_conversation_analyses
    ADD CONSTRAINT daily_conversation_analyses_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: events events_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: bookings fk_bookings_rescheduled_from; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT fk_bookings_rescheduled_from FOREIGN KEY (rescheduled_from_id) REFERENCES public.bookings(id);


--
-- Name: form_assignments form_assignments_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.form_assignments
    ADD CONSTRAINT form_assignments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: form_assignments form_assignments_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.form_assignments
    ADD CONSTRAINT form_assignments_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.form_templates(id);


--
-- Name: form_templates form_templates_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.form_templates
    ADD CONSTRAINT form_templates_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: journey_logs journey_logs_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.journey_logs
    ADD CONSTRAINT journey_logs_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: journey_logs journey_logs_trigger_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.journey_logs
    ADD CONSTRAINT journey_logs_trigger_event_id_fkey FOREIGN KEY (trigger_event_id) REFERENCES public.system_events(id);


--
-- Name: journey_templates journey_templates_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.journey_templates
    ADD CONSTRAINT journey_templates_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: message_logs message_logs_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.message_logs
    ADD CONSTRAINT message_logs_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: message_logs message_logs_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.message_logs
    ADD CONSTRAINT message_logs_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: organizations organizations_referred_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_referred_by_id_fkey FOREIGN KEY (referred_by_id) REFERENCES public.organizations(id);


--
-- Name: patients patients_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: schedule_calendar_syncs schedule_calendar_syncs_schedule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schedule_calendar_syncs
    ADD CONSTRAINT schedule_calendar_syncs_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.availability_schedules(id) ON DELETE CASCADE;


--
-- Name: service_therapist_link service_therapist_link_service_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_therapist_link
    ADD CONSTRAINT service_therapist_link_service_type_id_fkey FOREIGN KEY (service_type_id) REFERENCES public.service_types(id) ON DELETE CASCADE;


--
-- Name: service_therapist_link service_therapist_link_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_therapist_link
    ADD CONSTRAINT service_therapist_link_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: service_types service_types_intake_form_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_types
    ADD CONSTRAINT service_types_intake_form_id_fkey FOREIGN KEY (intake_form_id) REFERENCES public.form_templates(id);


--
-- Name: service_types service_types_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_types
    ADD CONSTRAINT service_types_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: service_types service_types_schedule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_types
    ADD CONSTRAINT service_types_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.availability_schedules(id);


--
-- Name: specific_availability specific_availability_schedule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.specific_availability
    ADD CONSTRAINT specific_availability_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.availability_schedules(id);


--
-- Name: specific_availability specific_availability_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.specific_availability
    ADD CONSTRAINT specific_availability_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: system_events system_events_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_events
    ADD CONSTRAINT system_events_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: time_off time_off_schedule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.time_off
    ADD CONSTRAINT time_off_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.availability_schedules(id);


--
-- Name: time_off time_off_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.time_off
    ADD CONSTRAINT time_off_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: users users_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- PostgreSQL database dump complete
--

\unrestrict rImlKCzQvY6xEWZeFOcw1VnTmgB74upav6ACkLT1P0m1ZUax9XL2SMXg5Jio9NA

