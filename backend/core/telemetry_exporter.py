import logging
from opentelemetry.sdk.trace.export import SpanExporter, SpanExportResult
from opentelemetry.sdk.trace import ReadableSpan
from typing import Sequence

from backend.database import SessionLocal
from backend.models import Telemetry

logger = logging.getLogger("ElectionBuddy.otel_exporter")

class SQLiteSpanExporter(SpanExporter):
    """
    A custom OpenTelemetry SpanExporter that intercepts spans
    and saves server request metrics into our local SQLite Telemetry table.
    This gives us OTel compliance while keeping the React Admin Dashboard functional.
    """
    def export(self, spans: Sequence[ReadableSpan]) -> SpanExportResult:
        try:
            db = SessionLocal()
            for span in spans:
                # We only care about SERVER spans (incoming HTTP requests to FastAPI)
                if span.kind.name == "SERVER":
                    attributes = span.attributes or {}
                    
                    # Extract standard semantic conventions for HTTP
                    endpoint = attributes.get("http.route") or attributes.get("http.target") or span.name
                    method = attributes.get("http.method", "UNKNOWN")
                    status_code = attributes.get("http.status_code", 500)
                    
                    # Calculate latency in milliseconds
                    latency_ms = (span.end_time - span.start_time) / 1000000.0 if span.end_time and span.start_time else 0
                    
                    # Skip noise
                    if endpoint and not endpoint.startswith("/assets") and endpoint != "/health":
                        telemetry_record = Telemetry(
                            endpoint=str(endpoint),
                            method=str(method),
                            status_code=int(status_code),
                            latency_ms=latency_ms
                        )
                        db.add(telemetry_record)
            db.commit()
            return SpanExportResult.SUCCESS
        except Exception as e:
            logger.error(f"Failed to export spans to SQLite: {e}")
            return SpanExportResult.FAILURE
        finally:
            db.close()

    def force_flush(self, timeout_millis: int = 30000) -> bool:
        return True

    def shutdown(self) -> None:
        pass
