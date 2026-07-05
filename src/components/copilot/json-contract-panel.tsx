import type { ExceptionTriageDraft } from "@/lib/types";

const EXAMPLE = {
  severity: "HIGH",
  category: "VEHICLE_ISSUE",
  etaImpact: "+6h, backup van dispatched",
  actionPlan: "1. Dispatch backup van...\n2. Escalate to ops lead",
  customerNotification: "Your delivery is delayed ~6h due to a vehicle issue.",
};

function Row({
  label,
  value,
  isEnum,
}: {
  label: string;
  value: string;
  isEnum?: boolean;
}) {
  return (
    <div className="leading-relaxed">
      <span className="text-primary-foreground/50">&quot;{label}&quot;</span>
      <span className="text-primary-foreground/30">: </span>
      <span className={isEnum ? "text-accent" : "text-emerald-300/80"}>
        &quot;{value}&quot;
      </span>
      <span className="text-primary-foreground/30">,</span>
    </div>
  );
}

export function JsonContractPanel({
  draft,
}: {
  draft: ExceptionTriageDraft | null;
}) {
  const record = draft?.analysis.structuredRecord;
  const isLive = Boolean(draft);

  const values = {
    severity: record?.severity ?? EXAMPLE.severity,
    category: record?.category ?? EXAMPLE.category,
    etaImpact: record?.etaImpact ?? EXAMPLE.etaImpact,
    actionPlan: draft?.analysis.actionPlan ?? EXAMPLE.actionPlan,
    customerNotification:
      draft?.analysis.customerNotification ?? EXAMPLE.customerNotification,
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-foreground/50">
          Strict JSON contract
        </p>
        {isLive && (
          <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-accent">
            Live
          </span>
        )}
      </div>

      <div className="triage-panel rounded-lg p-3 font-mono text-[11px]">
        <div className="text-primary-foreground/30">{"{"}</div>
        <div className="pl-3">
          <Row label="severity" value={values.severity} isEnum />
          <Row label="category" value={values.category} isEnum />
          <Row label="etaImpact" value={truncate(values.etaImpact, 34)} />
          <Row label="actionPlan" value={truncate(values.actionPlan, 34)} />
          <Row
            label="customerNotification"
            value={truncate(values.customerNotification, 34)}
          />
        </div>
        <div className="text-primary-foreground/30">{"}"}</div>
      </div>

      <p className="text-[11px] leading-relaxed text-primary-foreground/50">
        Every response, exactly these keys. Severity and category are fixed
        enums — the model can never invent a value outside the taxonomy.
      </p>
    </div>
  );
}

function truncate(value: string, max: number): string {
  const singleLine = value.replace(/\s+/g, " ").trim();
  return singleLine.length > max
    ? `${singleLine.slice(0, max - 1)}…`
    : singleLine;
}
