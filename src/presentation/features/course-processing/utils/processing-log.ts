declare const __DEV__: boolean | undefined;

type LogValue = string | number | boolean | null | undefined;

function isDevelopment() {
  return typeof __DEV__ !== "undefined" ? __DEV__ : true;
}

function sanitize(value: Record<string, LogValue>) {
  const blocked = /api.?key|secret|prompt|response|imageBase64/i;
  return Object.fromEntries(Object.entries(value).filter(([key]) => !blocked.test(key)));
}

export function logCourseProcessing(event: string, payload: Record<string, LogValue>) {
  if (!isDevelopment()) {
    return;
  }
  console.info("[course-processing]", event, sanitize(payload));
}
