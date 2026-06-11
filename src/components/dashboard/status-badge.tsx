import { Badge } from "@/components/ui/badge";
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
    <Badge variant={SHIPMENT_STATUS_VARIANT[status]} className={cn(className)}>
      {SHIPMENT_STATUS_LABEL[status]}
    </Badge>
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
    <Badge variant={SEVERITY_VARIANT[severity]} className={cn(className)}>
      {severity}
    </Badge>
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
    <Badge
      variant={EXCEPTION_STATUS_VARIANT[status]}
      className={cn("font-medium", className)}
    >
      {status}
    </Badge>
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
    <Badge variant="outline" className={cn(className)}>
      {CATEGORY_LABEL[category] ?? category}
    </Badge>
  );
}
