"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";

import { prisma } from "@/lib/db";
import { analyzeExceptionText } from "@/lib/mock-ai";
import {
  Severity,
  ShipmentStatus,
  type ActionResult,
  type AnalysisResult,
  type ExceptionDTO,
} from "@/lib/types";
import {
  createExceptionInputSchema,
  describeValidationError,
  idSchema,
  resolvedSchema,
} from "@/lib/validation";

type CreateExceptionInput = z.infer<typeof createExceptionInputSchema>;

function isHaltingSeverity(severity: Severity): boolean {
  return severity === Severity.HIGH || severity === Severity.CRITICAL;
}

/**
 * Server-side wrapper around the mock AI so the model module stays server-only
 * and the client never imports it directly.
 */
export async function analyzeException(
  text: string,
  shipmentId: string,
): Promise<ActionResult<AnalysisResult>> {
  try {
    const analysis = await analyzeExceptionText(text, shipmentId);
    return { ok: true, data: analysis };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "AI analysis failed.",
    };
  }
}

/**
 * Persist a triaged exception and run the state machine.
 *
 * Rule B: a HIGH or CRITICAL exception forces the parent shipment to HALTED.
 * Rule C: both the exception creation and any shipment status change are
 *         written to the audit log.
 * All writes happen inside a single transaction so an audit entry can never be
 * orphaned from the state change it describes.
 */
export async function createExceptionFromTriage(
  input: CreateExceptionInput,
): Promise<ActionResult<ExceptionDTO>> {
  const parsed = createExceptionInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: describeValidationError(parsed.error) };
  }
  const { shipmentId, severity, category, rawInput, actionPlan, notificationText } =
    parsed.data;

  try {
    const created = await prisma.$transaction(async (tx) => {
      const shipment = await tx.shipment.findUnique({
        where: { id: shipmentId },
      });

      if (!shipment) {
        throw new Error("Shipment not found.");
      }

      if (shipment.status === ShipmentStatus.DELIVERED) {
        throw new Error(
          "Cannot log an exception against an already-delivered shipment.",
        );
      }

      // Persist the exception (defaults to unresolved per the schema).
      const exception = await tx.exception.create({
        data: {
          shipmentId,
          severity,
          category,
          rawInput,
          actionPlan,
          notificationText,
        },
      });


      // Rule B — HIGH/CRITICAL halts the parent shipment.
      if (isHaltingSeverity(severity) && shipment.status !== ShipmentStatus.HALTED) {
        await tx.shipment.update({
          where: { id: shipmentId },
          data: { status: ShipmentStatus.HALTED },
        });

      }

      return exception;
    });

    revalidatePath("/");

    return {
      ok: true,
      data: {
        id: created.id,
        shipmentId: created.shipmentId,
        severity: created.severity,
        category: created.category,
        resolved: created.resolved,
        rawInput: created.rawInput,
        actionPlan: created.actionPlan,
        notificationText: created.notificationText,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Failed to log exception.",
    };
  }
}

/**
 * Flip an exception's `resolved` flag.
 *
 * Rule C: audited. When the last open exception on a shipment is resolved and
 * the shipment is currently HALTED, it is released back to IN_TRANSIT so the
 * dispatcher can subsequently deliver it (Rule A then permits delivery).
 */
export async function updateExceptionResolution(
  exceptionId: string,
  resolved: boolean,
): Promise<ActionResult<ExceptionDTO>> {
  const parsedId = idSchema.safeParse(exceptionId);
  const parsedResolved = resolvedSchema.safeParse(resolved);
  if (!parsedId.success) {
    return { ok: false, error: describeValidationError(parsedId.error) };
  }
  if (!parsedResolved.success) {
    return { ok: false, error: describeValidationError(parsedResolved.error) };
  }
  exceptionId = parsedId.data;
  resolved = parsedResolved.data;

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const exception = await tx.exception.findUnique({
        where: { id: exceptionId },
      });

      if (!exception) {
        throw new Error("Exception not found.");
      }

      if (exception.resolved === resolved) {
        throw new Error(
          `Exception is already ${resolved ? "resolved" : "open"}.`,
        );
      }

      const next = await tx.exception.update({
        where: { id: exceptionId },
        data: { resolved },
      });


      // Auto-release a halted shipment once it has no more open exceptions.
      if (resolved) {
        const siblings = await tx.exception.findMany({
          where: { shipmentId: exception.shipmentId },
        });

        const stillOpen = siblings.some((sibling) => !sibling.resolved);

        const shipment = await tx.shipment.findUnique({
          where: { id: exception.shipmentId },
        });

        if (!stillOpen && shipment?.status === ShipmentStatus.HALTED) {
          await tx.shipment.update({
            where: { id: exception.shipmentId },
            data: { status: ShipmentStatus.IN_TRANSIT },
          });

        }
      }

      return next;
    });

    revalidatePath("/");

    return {
      ok: true,
      data: {
        id: updated.id,
        shipmentId: updated.shipmentId,
        severity: updated.severity,
        category: updated.category,
        resolved: updated.resolved,
        rawInput: updated.rawInput,
        actionPlan: updated.actionPlan,
        notificationText: updated.notificationText,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update exception status.",
    };
  }
}
