import * as Crypto from "expo-crypto";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

export type ParseSchema<T> = {
  parse(value: unknown): T;
};

export function createId() {
  return Crypto.randomUUID();
}

export function nowIso() {
  return new Date().toISOString();
}

export function serializeJson(value: JsonValue) {
  return JSON.stringify(value);
}

export function parseJson<T>(schema: ParseSchema<T>, rawValue: string) {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawValue);
  } catch (error) {
    throw new Error(`Invalid JSON value: ${error instanceof Error ? error.message : "unknown parse error"}`);
  }

  return schema.parse(parsed);
}
