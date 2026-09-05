import {
  AIAuthenticationError,
  AIError,
  AIInvalidResponseError,
  AIModelNotFoundError,
  AIProviderUnavailableError,
  AIRateLimitError,
  AITimeoutError,
  AIService,
  ALLOWED_GEMMA_MODELS,
  DEFAULT_GEMINI_TIMEOUT_MS,
  DEFAULT_GEMMA_MODEL,
  GeminiMobileProvider,
  getAIErrorCode,
  type AILogger,
  type GemmaModel,
  type GeminiFetch,
  type GeminiMobileTransport,
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

type SettingsRepository = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<unknown>;
  remove(key: string): Promise<void>;
};

export type AISettingsServiceDeps = {
  settings: SettingsRepository;
  transport?: GeminiMobileTransport;
  fetchFn?: GeminiFetch;
  logger?: AILogger;
  timeoutMs?: number;
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

export function createAISettingsService(deps: AISettingsServiceDeps) {
  async function getGeminiApiKey() {
    return normalizeApiKey(await deps.settings.get(AI_SETTING_KEYS.geminiApiKey));
  }

  async function setGeminiApiKey(value: string) {
    const normalized = normalizeApiKey(value);
    if (!normalized) {
      await deps.settings.remove(AI_SETTING_KEYS.geminiApiKey);
      return null;
    }
    await deps.settings.set(AI_SETTING_KEYS.geminiApiKey, normalized);
    return normalized;
  }

  async function removeGeminiApiKey() {
    await deps.settings.remove(AI_SETTING_KEYS.geminiApiKey);
  }

  async function getGemmaModel(): Promise<GemmaModel> {
    const value = await deps.settings.get(AI_SETTING_KEYS.gemmaModel);
    if (value === null || value.trim() === "") {
      return DEFAULT_GEMMA_MODEL;
    }
    if (!isGemmaModel(value)) {
      throw new GemmaModelUnsupportedError();
    }
    return value;
  }

  async function setGemmaModel(value: string) {
    if (!isGemmaModel(value)) {
      throw new GemmaModelUnsupportedError();
    }
    await deps.settings.set(AI_SETTING_KEYS.gemmaModel, value);
    return value;
  }

  async function isAIEnabled() {
    return parseBoolean(await deps.settings.get(AI_SETTING_KEYS.aiEnabled));
  }

  async function setAIEnabled(value: boolean) {
    await deps.settings.set(AI_SETTING_KEYS.aiEnabled, serializeBoolean(value));
    return value;
  }

  async function getAIConfiguration(): Promise<AIConfiguration> {
    const [apiKey, gemmaModel, aiEnabled] = await Promise.all([getGeminiApiKey(), getGemmaModel(), isAIEnabled()]);
    return {
      aiEnabled,
      geminiApiKeyConfigured: apiKey !== null,
      geminiApiKeyPreview: previewKey(apiKey),
      gemmaModel,
    };
  }

  async function createConfiguredMobileAIService() {
    const [enabled, apiKey, model] = await Promise.all([isAIEnabled(), getGeminiApiKey(), getGemmaModel()]);
    if (!enabled) {
      return null;
    }
    if (!apiKey) {
      throw new GeminiApiKeyMissingError();
    }
    try {
      return new AIService(
        new GeminiMobileProvider({
          apiKey,
          model,
          transport: deps.transport,
          fetchFn: deps.fetchFn,
          logger: deps.logger,
          timeoutMs: deps.timeoutMs ?? DEFAULT_GEMINI_TIMEOUT_MS,
        }),
      );
    } catch (error) {
      throw mapConfigurationError(error);
    }
  }

  async function testGeminiConfiguration(): Promise<GeminiConfigurationTestResult> {
    const startedAt = Date.now();
    const model = await getGemmaModel();
    try {
      const apiKey = await getGeminiApiKey();
      if (!apiKey) {
        throw new GeminiApiKeyMissingError();
      }
      const service = new AIService(
        new GeminiMobileProvider({
          apiKey,
          model,
          transport: deps.transport,
          fetchFn: deps.fetchFn,
          logger: deps.logger,
          timeoutMs: deps.timeoutMs ?? DEFAULT_GEMINI_TIMEOUT_MS,
        }),
      );
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

  return {
    createConfiguredMobileAIService,
    getAIConfiguration,
    getGeminiApiKey,
    setGeminiApiKey,
    removeGeminiApiKey,
    getGemmaModel,
    setGemmaModel,
    isAIEnabled,
    setAIEnabled,
    testGeminiConfiguration,
  };
}

async function getRepository() {
  return (await import("@/src/db")).settingsRepository;
}

async function createDefaultService() {
  return createAISettingsService({ settings: await getRepository() });
}

export async function getGeminiApiKey() {
  return (await createDefaultService()).getGeminiApiKey();
}

export async function setGeminiApiKey(value: string) {
  return (await createDefaultService()).setGeminiApiKey(value);
}

export async function removeGeminiApiKey() {
  return (await createDefaultService()).removeGeminiApiKey();
}

export async function getGemmaModel() {
  return (await createDefaultService()).getGemmaModel();
}

export async function setGemmaModel(value: string) {
  return (await createDefaultService()).setGemmaModel(value);
}

export async function isAIEnabled() {
  return (await createDefaultService()).isAIEnabled();
}

export async function setAIEnabled(value: boolean) {
  return (await createDefaultService()).setAIEnabled(value);
}

export async function getAIConfiguration() {
  return (await createDefaultService()).getAIConfiguration();
}

export async function createConfiguredMobileAIService() {
  return (await createDefaultService()).createConfiguredMobileAIService();
}

export async function testGeminiConfiguration() {
  return (await createDefaultService()).testGeminiConfiguration();
}

export const aiSettingsService = {
  createConfiguredMobileAIService,
  getAIConfiguration,
  getGeminiApiKey,
  setGeminiApiKey,
  removeGeminiApiKey,
  getGemmaModel,
  setGemmaModel,
  isAIEnabled,
  setAIEnabled,
  testGeminiConfiguration,
};
