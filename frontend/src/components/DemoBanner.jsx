import { USE_MOCK } from "../config";

// بتظهر بس في Demo mode علشان محدش يفتكر إن البيانات حقيقية.
export default function DemoBanner() {
  if (!USE_MOCK) return null;
  return (
    <div className="demo-banner" role="note">
      <strong>Demo mode.</strong> You're seeing sample data saved only in this browser. Nothing is sent to the StepUp
      server, and CV analysis and job matches are simulated.
    </div>
  );
}
