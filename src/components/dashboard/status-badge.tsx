import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ExceptionStatus,
  Severity,
  ShipmentStatus,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "success"
  | "warning";

const SHIPMENT_STATUS_VARIANT: Record<ShipmentStatus, BadgeVariant> = {
  [ShipmentStatus.HALTED]: "destructive",
  [ShipmentStatus.DELIVERED]: "success",
  [ShipmentStatus.IN_TRANSIT]: "warning",
  [ShipmentStatus.DISPATCHED]: "secondary",
};

const SHIPMENT_STATUS_LABEL: Record<ShipmentStatus, string> = {
  [ShipmentStatus.HALTED]: "Halted",
  [ShipmentStatus.DELIVERED]: "Delivered",
  [ShipmentStatus.IN_TRANSIT]: "In transit",
  [ShipmentStatus.DISPATCHED]: "Dispatched",
};

const SEVERITY_VARIANT: Record<Severity, BadgeVariant> = {
  [Severity.CRITICAL]: "destructive",
  [Severity.HIGH]: "warning",
  [Severity.LOW]: "secondary",
};

const EXCEPTION_STATUS_VARIANT: Record<ExceptionStatus, BadgeVariant> = {
  [ExceptionStatus.TRIAGE]: "warning",
  [ExceptionStatus.ACTIONING]: "default",
  [ExceptionStatus.RESOLVED]: "success",
};

export function ShipmentStatusBadge({
  status,
  className,
}: {
  status: ShipmentStatus;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant={SHIPMENT_STATUS_VARIANT[status]} className={cn(className)}>
          {SHIPMENT_STATUS_LABEL[status]}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        {status === ShipmentStatus.HALTED
          ? "This shipment is paused until exceptions are resolved or reassigned."
          : status === ShipmentStatus.IN_TRANSIT
            ? "The shipment is moving through the route and can still receive exception updates."
            : status === ShipmentStatus.DISPATCHED
              ? "The shipment has left dispatch and is waiting to be scanned into transit."
              : "The shipment has been delivered and can no longer receive new exceptions."}
      </TooltipContent>
    </Tooltip>
  );
}

export function SeverityBadge({
  severity,
  className,
}: {
  severity: Severity;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant={SEVERITY_VARIANT[severity]} className={cn(className)}>
          {severity}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        {severity === Severity.CRITICAL
          ? "Critical issues usually halt the shipment and need immediate action."
          : severity === Severity.HIGH
            ? "High severity issues are important enough to halt the shipment in the workflow."
            : "Low severity issues are useful context but usually do not stop the route."}
      </TooltipContent>
    </Tooltip>
  );
}

export function ExceptionStatusBadge({
  status,
  className,
}: {
  status: ExceptionStatus;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant={EXCEPTION_STATUS_VARIANT[status]}
          className={cn("font-medium", className)}
        >
          {status}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        {status === ExceptionStatus.TRIAGE
          ? "Queued for review. Nothing has been executed yet."
          : status === ExceptionStatus.ACTIONING
            ? "The issue is being handled and the shipment may still be paused."
            : "The issue has been closed and can release the shipment if no open items remain."}
      </TooltipContent>
    </Tooltip>
  );
}

const CATEGORY_LABEL: Record<string, string> = {
  VEHICLE_ISSUE: "Vehicle",
  CUSTOMER_ABSENT: "Customer absent",
  WEATHER: "Weather",
};

export function CategoryBadge({
  category,
  className,
}: {
  category: string;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" className={cn(className)}>
          {CATEGORY_LABEL[category] ?? category}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        {category === "VEHICLE_ISSUE"
          ? "Use for breakdowns, delays, and route interruptions tied to the vehicle."
          : category === "CUSTOMER_ABSENT"
            ? "Use when the driver cannot complete delivery because the recipient is unavailable."
            : category === "WEATHER"
              ? "Use for weather-related route disruption or safety constraints."
              : "Exception category."}
      </TooltipContent>
    </Tooltip>
  );
}
