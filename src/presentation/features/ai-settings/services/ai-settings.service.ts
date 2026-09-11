import { settingsRepository } from "@/src/database";
import {
  AIAuthenticationError,
  AIError,
  AIInvalidResponseError,
  AIModelNotFoundError,
  AIProviderUnavailableError,
  AIRateLimitError,
  AIService,
  AITimeoutError,
  ALLOWED_GEMMA_MODELS,
  DEFAULT_GEMINI_TIMEOUT_MS,
  DEFAULT_GEMMA_MODEL,
  GeminiMobileProvider,
  getAIErrorCode,
  type GemmaModel,
} from "@/src/services/ai";

export const AI_SETTING_KEYS = {
  geminiApiKey: "gemini_api_key",
  gemmaModel: "gemma_model",
  aiEnabled: "ai_enabled",
} as const;

export type AIConfiguration = {
  aiEnabled: boolean;
  geminiApiKeyConfigured: boolean;
  geminiApiKeyPreview: string | null;
  gemmaModel: GemmaModel;
};

export type GeminiConfigurationTestResult = {
  success: boolean;
  model: GemmaModel;
  latencyMs: number;
  message: string;
  errorCode: string | null;
};

export class GeminiApiKeyMissingError extends Error {
  constructor(message = "Gemini API key is missing.") {
    super(message);
    this.name = "GeminiApiKeyMissingError";
  }
}

export class GeminiApiKeyInvalidError extends Error {
  constructor(message = "Gemini API key is invalid.") {
    super(message);
    this.name = "GeminiApiKeyInvalidError";
  }
}

export class GemmaModelUnsupportedError extends Error {
  constructor(message = "Gemma model is unsupported.") {
    super(message);
    this.name = "GemmaModelUnsupportedError";
  }
}

function isGemmaModel(value: string): value is GemmaModel {
  return ALLOWED_GEMMA_MODELS.includes(value as GemmaModel);
}

function normalizeApiKey(value: string | null) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

function serializeBoolean(value: boolean) {
  return value ? "true" : "false";
}

function parseBoolean(value: string | null) {
  return value === "true";
}

function previewKey(value: string | null) {
  if (!value) {
    return null;
  }
  return value.length <= 8 ? "••••" : `${value.slice(0, 4)}••••${value.slice(-4)}`;
}

function mapConfigurationError(error: unknown) {
  if (error instanceof AIAuthenticationError) {
    return new GeminiApiKeyInvalidError();
  }
  if (error instanceof AIModelNotFoundError) {
    return new GemmaModelUnsupportedError();
  }
  return error;
}

function resultMessage(error: unknown) {
  if (error instanceof GeminiApiKeyMissingError) {
    return "Aucune clé Gemini configurée.";
  }
  if (error instanceof GeminiApiKeyInvalidError || error instanceof AIAuthenticationError) {
    return "Clé Gemini invalide.";
  }
  if (error instanceof GemmaModelUnsupportedError || error instanceof AIModelNotFoundError) {
    return "Modèle Gemma indisponible.";
  }
  if (error instanceof AIRateLimitError) {
    return "Quota Gemini dépassé.";
  }
  if (error instanceof AITimeoutError) {
    return "La demande Gemini a expiré.";
  }
  if (error instanceof AIInvalidResponseError) {
    return "Gemini a retourné une réponse vide.";
  }
  if (error instanceof AIProviderUnavailableError || error instanceof AIError) {
    return "Gemini est indisponible pour le moment.";
  }
  return "Erreur réseau pendant le test Gemini.";
}

function configurationErrorCode(error: unknown) {
  if (error instanceof GeminiApiKeyMissingError) {
    return "GEMINI_API_KEY_MISSING";
  }
  if (error instanceof GeminiApiKeyInvalidError) {
    return "GEMINI_API_KEY_INVALID";
  }
  if (error instanceof GemmaModelUnsupportedError) {
    return "GEMMA_MODEL_UNSUPPORTED";
  }
  return error instanceof Error ? getAIErrorCode(error) : "AI_UNKNOWN_ERROR";
}

export async function getGeminiApiKey() {
  return normalizeApiKey(await settingsRepository.get(AI_SETTING_KEYS.geminiApiKey));
}

export async function setGeminiApiKey(value: string) {
  const normalized = normalizeApiKey(value);
  if (!normalized) {
    await settingsRepository.remove(AI_SETTING_KEYS.geminiApiKey);
    return null;
  }
  await settingsRepository.set(AI_SETTING_KEYS.geminiApiKey, normalized);
  return normalized;
}

export async function removeGeminiApiKey() {
  await settingsRepository.remove(AI_SETTING_KEYS.geminiApiKey);
}

export async function getGemmaModel(): Promise<GemmaModel> {
  const value = await settingsRepository.get(AI_SETTING_KEYS.gemmaModel);
  if (value === null || value.trim() === "") {
    return DEFAULT_GEMMA_MODEL;
  }
  if (!isGemmaModel(value)) {
    throw new GemmaModelUnsupportedError();
  }
  return value;
}

export async function setGemmaModel(value: string) {
  if (!isGemmaModel(value)) {
    throw new GemmaModelUnsupportedError();
  }
  await settingsRepository.set(AI_SETTING_KEYS.gemmaModel, value);
  return value;
}

export async function isAIEnabled() {
  return parseBoolean(await settingsRepository.get(AI_SETTING_KEYS.aiEnabled));
}

export async function setAIEnabled(value: boolean) {
  await settingsRepository.set(AI_SETTING_KEYS.aiEnabled, serializeBoolean(value));
  return value;
}

export async function getAIConfiguration(): Promise<AIConfiguration> {
  const [apiKey, gemmaModel, aiEnabled] = await Promise.all([getGeminiApiKey(), getGemmaModel(), isAIEnabled()]);
  return {
    aiEnabled,
    geminiApiKeyConfigured: apiKey !== null,
    geminiApiKeyPreview: previewKey(apiKey),
    gemmaModel,
  };
}

function createGeminiService(apiKey: string, model: GemmaModel) {
  return new AIService(
    new GeminiMobileProvider({
      apiKey,
      model,
      timeoutMs: DEFAULT_GEMINI_TIMEOUT_MS,
    }),
  );
}

export async function createConfiguredMobileAIService() {
  const [enabled, apiKey, model] = await Promise.all([isAIEnabled(), getGeminiApiKey(), getGemmaModel()]);
  if (!enabled) {
    return null;
  }
  if (!apiKey) {
    throw new GeminiApiKeyMissingError();
  }
  try {
    return createGeminiService(apiKey, model);
  } catch (error) {
    throw mapConfigurationError(error);
  }
}

export async function testGeminiConfiguration(): Promise<GeminiConfigurationTestResult> {
    const startedAt = Date.now();
    const model = await getGemmaModel();
    try {
      const apiKey = await getGeminiApiKey();
      if (!apiKey) {
        throw new GeminiApiKeyMissingError();
      }
      const service = createGeminiService(apiKey, model);
      const response = await service.generateText({
        prompt: "Réponds uniquement par le mot OK.",
        options: { maxOutputTokens: 8, temperature: 0 },
      });
      if (!response.text.trim()) {
        throw new AIInvalidResponseError("Gemini returned an empty test response.");
      }
      return {
        success: true,
        model,
        latencyMs: Date.now() - startedAt,
        message: "Connexion Gemini validée.",
        errorCode: null,
      };
    } catch (error) {
      const mapped = mapConfigurationError(error);
      return {
        success: false,
        model,
        latencyMs: Date.now() - startedAt,
        message: resultMessage(mapped),
        errorCode: configurationErrorCode(mapped),
      };
    }
}
