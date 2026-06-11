"use client";

import { useState } from "react";
import { CheckCircle2, FileText, MessageSquare, X } from "lucide-react";
import { toast } from "sonner";

import { Markdown } from "@/components/copilot/markdown";
import {
  CategoryBadge,
  SeverityBadge,
} from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { createExceptionFromTriage } from "@/app/actions/exceptions";
import type { ExceptionTriageDraft } from "@/lib/types";
import { useDispatchStore } from "@/store/use-dispatch-store";

export function TriageCards({
  draft,
  onExecuted,
}: {
  draft: ExceptionTriageDraft;
  onExecuted: () => void;
}) {
  const clearTriage = useDispatchStore((state) => state.clearTriage);
  const setProcessing = useDispatchStore((state) => state.setProcessing);
  const isProcessing = useDispatchStore((state) => state.isProcessing);
  const [submitting, setSubmitting] = useState(false);

  const { structuredRecord, actionPlan, customerNotification } = draft.analysis;

  async function handleApprove() {
    setSubmitting(true);
    setProcessing(true);
    const result = await createExceptionFromTriage({
      shipmentId: draft.shipmentId,
      severity: structuredRecord.severity,
      category: structuredRecord.category,
      rawInput: draft.rawInput,
      actionPlan,
      notificationText: customerNotification,
    });
    setSubmitting(false);
    setProcessing(false);

    if (!result.ok) {
      toast.error("Could not execute", { description: result.error });
      return;
    }

    const halted =
      structuredRecord.severity === "HIGH" ||
      structuredRecord.severity === "CRITICAL";

    toast.success("Exception logged & executed", {
      description: halted
        ? `Shipment ${draft.trackingNumber} auto-HALTED (Rule B). Audit trail updated.`
        : `Exception filed for ${draft.trackingNumber}. Audit trail updated.`,
    });

    clearTriage();
    onExecuted();
  }

  return (
    <div className="space-y-4 text-primary-foreground">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-base font-semibold tracking-[-0.02em]">
            Proposed resolution
          </h3>
          <p className="text-xs text-primary-foreground/50">
            Three artifacts are staged for execution.
          </p>
        </div>
        <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-accent">
          AI draft
        </span>
      </div>

      {/* Card 1 — Structured record */}
      <article className="triage-panel rounded-lg p-4">
        <div className="mb-3">
          <h4 className="flex items-center gap-2 font-display text-base font-semibold">
            <CheckCircle2 className="h-4 w-4 text-accent" />
            Structured Record
          </h4>
          <p className="mt-1 text-xs text-primary-foreground/50">
            Normalized, machine-readable fields.
          </p>
        </div>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-primary-foreground/50">Severity</span>
            <SeverityBadge severity={structuredRecord.severity} />
            <Separator orientation="vertical" className="h-4 bg-primary-foreground/20" />
            <span className="text-xs text-primary-foreground/50">Category</span>
            <CategoryBadge
              category={structuredRecord.category}
              className="border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground"
            />
          </div>
          <div className="rounded-md border border-primary-foreground/10 bg-primary-foreground/10 px-3 py-2 text-sm text-primary-foreground/80">
            <span className="font-medium">ETA impact: </span>
            {structuredRecord.etaImpact}
          </div>
        </div>
      </article>

      {/* Card 2 — Action plan */}
      <article className="triage-panel rounded-lg p-4">
        <div className="mb-3">
          <h4 className="flex items-center gap-2 font-display text-base font-semibold">
            <FileText className="h-4 w-4 text-accent" />
            Action Plan
          </h4>
          <p className="mt-1 text-xs text-primary-foreground/50">
            Internal steps for the operations team.
          </p>
        </div>
        <Markdown content={actionPlan} />
      </article>

      {/* Card 3 — Customer notification */}
      <article className="triage-panel rounded-lg p-4">
        <div className="mb-3">
          <h4 className="flex items-center gap-2 font-display text-base font-semibold">
            <MessageSquare className="h-4 w-4 text-accent" />
            Customer Notification
          </h4>
          <p className="mt-1 text-xs text-primary-foreground/50">
            Outbound SMS shown to the customer.
          </p>
        </div>
          <div className="rounded-md border border-primary-foreground/10 bg-primary-foreground/10 px-3 py-2 text-sm leading-relaxed text-primary-foreground/80">
            {customerNotification}
          </div>
      </article>

      <div className="flex items-center gap-2">
        <Button
          variant="success"
          className="flex-1"
          onClick={handleApprove}
          disabled={submitting || isProcessing}
        >
          <CheckCircle2 className="h-4 w-4" />
          {submitting ? "Executing…" : "Approve & Execute"}
        </Button>
        <Button
          variant="outline"
          onClick={clearTriage}
          disabled={submitting}
          aria-label="Discard draft"
          className="border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground"
        >
          <X className="h-4 w-4" />
          Discard
        </Button>
      </div>
    </div>
  );
}
