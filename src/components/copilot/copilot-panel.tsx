"use client";

import { useMemo, useState } from "react";
import { Bot, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { AnalyzeSkeleton } from "@/components/copilot/analyze-skeleton";
import { FallbackForm } from "@/components/copilot/fallback-form";
import { TriageCards } from "@/components/copilot/triage-cards";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { analyzeException } from "@/app/actions/exceptions";
import { ShipmentStatus } from "@/lib/types";
import { useDispatchStore } from "@/store/use-dispatch-store";

const SAMPLE_PROMPTS = [
  "el van 3etlit 3a tari2 Zahle, battery mfassakha, ma fini kammel",
  "zboun mish mawjoud bel beit w ma byjaweb 3al telephone",
  "fi 3asfe w shté ktir 3a Tripoli, el tari2 ma2tou3",
];

export function CopilotPanel({ onExecuted }: { onExecuted: () => void }) {
  const shipments = useDispatchStore((state) => state.shipments);
  const selectedShipmentId = useDispatchStore(
    (state) => state.selectedShipmentId,
  );
  const selectShipment = useDispatchStore((state) => state.selectShipment);
  const isProcessing = useDispatchStore((state) => state.isProcessing);
  const isFallbackMode = useDispatchStore((state) => state.isFallbackMode);
  const activeTriage = useDispatchStore((state) => state.activeExceptionTriage);
  const setProcessing = useDispatchStore((state) => state.setProcessing);
  const setTriage = useDispatchStore((state) => state.setTriage);
  const enterFallback = useDispatchStore((state) => state.enterFallback);
  const clearTriage = useDispatchStore((state) => state.clearTriage);

  const [rawInput, setRawInput] = useState("");

  // Only shipments that can still receive an exception (not delivered).
  const eligibleShipments = useMemo(
    () =>
      shipments.filter(
        (shipment) => shipment.status !== ShipmentStatus.DELIVERED,
      ),
    [shipments],
  );

  const selectedShipment = useMemo(
    () => shipments.find((shipment) => shipment.id === selectedShipmentId),
    [shipments, selectedShipmentId],
  );

  async function handleAnalyze() {
    if (!selectedShipmentId || !selectedShipment) {
      toast.error("Select a shipment to attach this exception to.");
      return;
    }
    if (!rawInput.trim()) {
      toast.error("Type the courier update before analyzing.");
      return;
    }

    clearTriage();
    setProcessing(true);

    const result = await analyzeException(rawInput, selectedShipmentId);

    if (!result.ok) {
      // AI failed -> drop into manual fallback mode.
      enterFallback();
      toast.warning("AI analysis failed", {
        description: "Switched to manual triage. Build the record by hand.",
      });
      return;
    }

    setTriage({
      shipmentId: selectedShipmentId,
      trackingNumber: selectedShipment.trackingNumber,
      rawInput,
      analysis: result.data,
      source: "AI",
    });
  }

  function handleExecuted() {
    setRawInput("");
    onExecuted();
  }

  const showComposer = !isProcessing && !activeTriage && !isFallbackMode;

  return (
    <section className="console-panel flex h-full min-h-[720px] flex-col overflow-hidden rounded-xl motion-safe:animate-panel-in">
      <div className="border-b border-primary-foreground/10 p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md border border-primary-foreground/10 bg-primary-foreground/10 text-accent shadow-[0_0_0_1px_hsl(var(--accent)_/_0.12)]">
              <Bot className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary-foreground/50">
                Triage console
              </p>
              <h2 className="font-display text-xl font-semibold tracking-[-0.02em] text-primary-foreground">
                Exception CoPilot
              </h2>
            </div>
          </div>
          <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-accent">
            Mock AI
          </span>
        </div>
        <div className="trace-line h-px opacity-60 motion-safe:animate-[trace-flow_1.8s_linear_infinite]" />
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        {/* Composer */}
        {showComposer && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="shipment-select"
                className="text-primary-foreground/75"
              >
                Shipment
              </Label>
              <Select
                value={selectedShipmentId ?? undefined}
                onValueChange={selectShipment}
              >
                <SelectTrigger id="shipment-select" className="console-field">
                  <SelectValue placeholder="Select an active shipment" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleShipments.length === 0 && (
                    <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                      No eligible shipments.
                    </div>
                  )}
                  {eligibleShipments.map((shipment) => (
                    <SelectItem key={shipment.id} value={shipment.id}>
                      {shipment.trackingNumber} — {shipment.customerName} (
                      {shipment.destinationCity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="raw-input" className="text-primary-foreground/75">
                Courier update
              </Label>
              <Textarea
                id="raw-input"
                placeholder="e.g. el van 3etlit 3a tari2 Zahle, battery mfassakha…"
                value={rawInput}
                onChange={(event) => setRawInput(event.target.value)}
                className="console-field min-h-[160px] resize-y leading-relaxed shadow-[0_1px_0_hsl(42_45%_96%_/_0.06)_inset] focus-visible:ring-accent"
              />
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-foreground/50">
                Sample signal
              </p>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_PROMPTS.map((sample, index) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => setRawInput(sample)}
                    className="rounded-full border border-primary-foreground/10 bg-primary-foreground/10 px-3 py-1.5 text-left text-xs font-medium text-primary-foreground/70 transition-colors hover:border-accent/40 hover:bg-accent/10 hover:text-primary-foreground"
                  >
                    {index === 0 && "Vehicle"}
                    {index === 1 && "Customer"}
                    {index === 2 && "Weather"}
                  </button>
                ))}
              </div>
              <p className="text-xs text-primary-foreground/50">
                Include{" "}
                <code className="rounded bg-primary-foreground/10 px-1 py-0.5 text-primary-foreground/80">
                  fail
                </code>{" "}
                to enter manual fallback.
              </p>
            </div>

            <Button
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={handleAnalyze}
              disabled={isProcessing}
            >
              <Sparkles className="h-4 w-4" />
              Analyze
            </Button>
          </div>
        )}

        {/* Loading */}
        {isProcessing && <AnalyzeSkeleton />}

        {/* AI result */}
        {!isProcessing && activeTriage && (
          <TriageCards draft={activeTriage} onExecuted={handleExecuted} />
        )}

        {/* Fallback */}
        {!isProcessing && isFallbackMode && !activeTriage && selectedShipment && (
          <FallbackForm
            shipmentId={selectedShipment.id}
            trackingNumber={selectedShipment.trackingNumber}
            rawInput={rawInput}
            onExecuted={handleExecuted}
          />
        )}
      </div>
    </section>
  );
}
