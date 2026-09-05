import { createId, nowIso } from "../helpers";

export function createBaseFields() {
  const now = nowIso();

  return {
    id: createId(),
    createdAt: now,
    updatedAt: now,
  };
}

export function createTimedIdFields() {
  return {
    id: createId(),
    createdAt: nowIso(),
  };
}

export function touchFields() {
  return {
    updatedAt: nowIso(),
  };
}

export function firstOrThrow<T>(rows: T[], message: string) {
  const row = rows[0];

  if (!row) {
    throw new Error(message);
  }

  return row;
}

export function assertNonEmpty(value: string, fieldName: string) {
  if (value.trim().length === 0) {
    throw new Error(`${fieldName} must not be empty.`);
  }
}

export function assertInteger(value: number, fieldName: string) {
  if (!Number.isInteger(value)) {
    throw new Error(`${fieldName} must be an integer.`);
  }
}

export function assertNonNegative(value: number, fieldName: string) {
  if (value < 0) {
    throw new Error(`${fieldName} must be greater than or equal to 0.`);
  }
}
