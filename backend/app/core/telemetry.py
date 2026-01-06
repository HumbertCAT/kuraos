"""
Telemetry Module - Cloud Trace & Profiler for Kura OS.

ADR-019: Observability (X-Ray Vision)
Enables distributed tracing and CPU/memory profiling in production.

Usage:
    from app.core.telemetry import init_telemetry
    app = FastAPI(...)
    init_telemetry(app)
"""

import logging
import os

logger = logging.getLogger(__name__)


def init_telemetry(app):
    """
    Initialize Cloud Profiler and Cloud Trace for Kura OS.

    Handles failures silently to avoid crashing the app if APIs fail.
    Only activates in production (when running on Cloud Run).
    """
    # Skip telemetry in local development
    if os.getenv("K_SERVICE") is None:
        logger.info("⏭️ [Telemetry] Skipped (local development)")
        return

    # 1. Cloud Profiler (CPU/Memory)
    try:
        import googlecloudprofiler

        # Get version from environment or default
        version = os.getenv("K_REVISION", "dev")

        googlecloudprofiler.start(
            service="kura-api-prod",
            service_version=version,
            verbose=0,
        )
        logger.info("✅ [Telemetry] Cloud Profiler attached successfully.")
    except (ValueError, NotImplementedError) as exc:
        logger.warning(f"⚠️ [Telemetry] Profiler not started: {exc}")
    except Exception as e:
        logger.warning(f"⚠️ [Telemetry] Profiler failed to start: {e}")

    # 2. Cloud Trace (Distributed Latency)
    try:
        from opentelemetry import trace
        from opentelemetry.exporter.cloud_trace import CloudTraceSpanExporter
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.export import BatchSpanProcessor
        from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

        tracer_provider = TracerProvider()
        cloud_trace_exporter = CloudTraceSpanExporter()

        # BatchSpanProcessor for non-blocking export
        tracer_provider.add_span_processor(BatchSpanProcessor(cloud_trace_exporter))
        trace.set_tracer_provider(tracer_provider)

        # Auto-instrument FastAPI for HTTP request tracing
        FastAPIInstrumentor.instrument_app(app)
        logger.info("✅ [Telemetry] Distributed Tracing active.")
    except Exception as e:
        logger.warning(f"⚠️ [Telemetry] Cloud Trace failed to initialize: {e}")
