import { AppButton, AppText } from "@/src/presentation/components/shared";
import { Input, InputField, InputSlot } from "@/src/presentation/components/ui/input";
import { ALLOWED_GEMMA_MODELS, type GemmaModel } from "@/src/services/ai";
import { colors, fonts } from "@/src/theme";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, Switch, View } from "react-native";
import {
    getAIConfiguration,
    removeGeminiApiKey,
    setAIEnabled,
    setGeminiApiKey,
    setGemmaModel,
    testGeminiConfiguration,
    type AIConfiguration,
} from "../services/ai-settings.service";

type TestState = {
  tone: "primary" | "secondary" | "error";
  message: string;
} | null;

function modelLabel(model: GemmaModel) {
  return model === "gemma-4-26b-a4b-it" ? "Gemma 4 26B - plus rapide" : "Gemma 4 31B";
}

function statusLabel(config: AIConfiguration | null) {
  if (!config) {
    return "Chargement";
  }
  if (!config.geminiApiKeyConfigured) {
    return "Aucune clé configurée";
  }
  return `Clé enregistrée ${config.geminiApiKeyPreview ?? ""}`.trim();
}

function statusTone(config: AIConfiguration | null) {
  if (!config?.geminiApiKeyConfigured) {
    return { backgroundColor: "#FAF1E2", color: colors.textSecondary };
  }
  return { backgroundColor: "#EAF0E3", color: colors.secondary };
}

export function AISettingsCard() {
  const [config, setConfig] = useState<AIConfiguration | null>(null);
  const [apiKeyDraft, setApiKeyDraft] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState<GemmaModel>("gemma-4-26b-a4b-it");
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testState, setTestState] = useState<TestState>(null);

  const reload = useCallback(async () => {
    const nextConfig = await getAIConfiguration();
    setConfig(nextConfig);
    setSelectedModel(nextConfig.gemmaModel);
    setEnabled(nextConfig.aiEnabled);
  }, []);

  useEffect(() => {
    reload().catch(() => setTestState({ tone: "error", message: "Impossible de charger les paramètres IA." }));
  }, [reload]);

  async function handleSave() {
    setSaving(true);
    setTestState(null);
    try {
      await setAIEnabled(enabled);
      await setGemmaModel(selectedModel);
      if (apiKeyDraft.trim().length > 0) {
        await setGeminiApiKey(apiKeyDraft);
        setApiKeyDraft("");
      }
      await reload();
      setTestState({ tone: "secondary", message: "Paramètres IA enregistrés." });
    } catch {
      setTestState({ tone: "error", message: "Enregistrement impossible." });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteKey() {
    setSaving(true);
    setTestState(null);
    try {
      await removeGeminiApiKey();
      setApiKeyDraft("");
      await reload();
      setTestState({ tone: "secondary", message: "Clé Gemini supprimée." });
    } catch {
      setTestState({ tone: "error", message: "Suppression impossible." });
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setTestState({ tone: "secondary", message: "Test de connexion en cours..." });
    try {
      if (apiKeyDraft.trim().length > 0) {
        await setGeminiApiKey(apiKeyDraft);
        setApiKeyDraft("");
      }
      await setAIEnabled(enabled);
      await setGemmaModel(selectedModel);
      const result = await testGeminiConfiguration();
      await reload();
      setTestState({
        tone: result.success ? "secondary" : "error",
        message: result.success ? `${result.message} ${result.latencyMs} ms.` : result.message,
      });
    } catch {
      setTestState({ tone: "error", message: "Test de connexion impossible." });
    } finally {
      setTesting(false);
    }
  }

  function confirmDeleteKey() {
    Alert.alert("Supprimer la clé Gemini", "La clé enregistrée sera supprimée de cet appareil.", [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: () => void handleDeleteKey() },
    ]);
  }

  return (
    <View className="gap-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1 gap-1">
          <AppText className="text-[17px] leading-6 text-[#2F241F]" style={{ fontFamily: fonts.bold }}>
            Intelligence artificielle
          </AppText>
          <AppText className="text-[12px] leading-4" tone="secondary">
            Génération avec Gemini
          </AppText>
        </View>
        <View className="rounded-full px-3 py-1" style={{ backgroundColor: statusTone(config).backgroundColor }}>
          <AppText numberOfLines={1} className="max-w-[150px] text-[11px] leading-4" style={{ color: statusTone(config).color, fontFamily: fonts.bold }}>
            {statusLabel(config)}
          </AppText>
        </View>
      </View>

      <View className="flex-row items-center justify-between gap-4 rounded-2xl bg-[#FAF1E2] px-3.5 py-2.5">
        <View className="flex-1">
          <AppText className="text-[14px] leading-5 text-[#2F241F]" style={{ fontFamily: fonts.bold }}>
            {"Activer l'IA"}
          </AppText>
          <AppText className="text-[12px] leading-4" tone="secondary">
            {enabled ? "Active pour les prochains tests" : "Désactivée"}
          </AppText>
        </View>
        <Switch
          value={enabled}
          onValueChange={setEnabled}
          trackColor={{ false: colors.border, true: colors.secondary }}
          thumbColor={colors.white}
          accessibilityLabel="Activer l'IA"
        />
      </View>

      <View className="gap-2">
        <AppText className="text-[14px] leading-5 text-[#2F241F]" style={{ fontFamily: fonts.bold }}>
          Clé API Gemini
        </AppText>
        <Input variant="rounded" size="xl" className="min-h-[48px] border-[#E8D9C7] bg-[#FFFDF8]">
          <InputField
            value={apiKeyDraft}
            onChangeText={setApiKeyDraft}
            placeholder={config?.geminiApiKeyConfigured ? "Clé enregistrée" : "Coller une clé Gemini"}
            secureTextEntry={!showKey}
            autoCapitalize="none"
            autoCorrect={false}
            className="text-[14px] text-[#2F241F]"
            style={{ fontFamily: fonts.medium }}
            accessibilityLabel="Clé API Gemini"
          />
          <InputSlot className="px-4" onPress={() => setShowKey((value) => !value)}>
            <FontAwesome5 name={showKey ? "eye-slash" : "eye"} size={16} color={colors.textSecondary} />
          </InputSlot>
        </Input>
      </View>

      <View className="gap-2">
        <AppText className="text-[14px] leading-5 text-[#2F241F]" style={{ fontFamily: fonts.bold }}>
          Modèle
        </AppText>
        <View className="flex-row rounded-full border border-[#E8D9C7] bg-[#FAF1E2] p-1">
          {ALLOWED_GEMMA_MODELS.map((model) => {
            const selected = selectedModel === model;
            return (
              <Pressable
                key={model}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setSelectedModel(model)}
                className={[
                  "min-h-[42px] flex-1 items-center justify-center rounded-full px-3",
                  selected ? "bg-[#D94B24]" : "bg-transparent",
                ].join(" ")}
              >
                <AppText tone={selected ? "inverse" : "primary"} numberOfLines={2} className="text-center text-[12px] leading-4" style={{ fontFamily: fonts.bold }}>
                  {modelLabel(model)}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      {testState ? (
        <AppText className="text-[12px] leading-4" tone={testState.tone}>
          {testState.message}
        </AppText>
      ) : null}

      <View className="gap-2.5">
        <AppButton title="Enregistrer" iconName="save" className="min-h-[50px]" onPress={handleSave} loading={saving} />
        <View className="flex-row gap-2.5">
          <AppButton title="Tester" iconName="bolt" variant="secondary" className="min-h-[46px] flex-1 px-4" onPress={handleTest} loading={testing} />
          <AppButton title="Supprimer" iconName="trash-alt" variant="tertiary" className="min-h-[46px] flex-1 px-4" onPress={confirmDeleteKey} disabled={!config?.geminiApiKeyConfigured && apiKeyDraft.length === 0} />
        </View>
      </View>
    </View>
  );
}
