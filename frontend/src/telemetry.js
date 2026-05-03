import { BasicTracerProvider, ConsoleSpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { ZoneContextManager } from '@opentelemetry/context-zone';

// Initialize the OTel Provider
const provider = new BasicTracerProvider();

// For the hackathon, we'll export React spans to the browser console.
// If we had a true OTLP endpoint (e.g., Jaeger/GCP), we would use OTLPTraceExporter here.
const exporter = new ConsoleSpanExporter();
provider.addSpanProcessor(new SimpleSpanProcessor(exporter));

provider.register({
  contextManager: new ZoneContextManager()
});

// Instrument all native Fetch API calls to automatically inject tracing headers
registerInstrumentations({
  instrumentations: [
    new FetchInstrumentation({
      ignoreUrls: [/localhost:5731\/src/, /localhost:5731\/@vite/],
      clearTimingResources: true,
    }),
  ],
});

console.log("OpenTelemetry initialized for React Frontend.");
