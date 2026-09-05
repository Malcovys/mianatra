import { db } from "@/src/db/client";
import { initializeDatabaseConnection, prepareDatabaseForMigrations } from "@/src/db/initialization";
import migrations from "@/src/db/migrations/migrations";
import { AppButton, AppText } from "@/src/presentation/components/shared";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { useEffect, useState } from "react";
import { View } from "react-native";

type MigrationGateProps = {
  children: React.ReactNode;
};

export function MigrationGate({ children }: MigrationGateProps) {
  const [attempt, setAttempt] = useState(0);

  return (
    <MigrationRunner key={attempt} onRetry={() => setAttempt((value) => value + 1)}>
      {children}
    </MigrationRunner>
  );
}

type MigrationRunnerProps = MigrationGateProps & {
  onRetry: () => void;
};

function MigrationRunner({ children, onRetry }: MigrationRunnerProps) {
  const [isPrepared, setIsPrepared] = useState(false);

  useEffect(() => {
    prepareDatabaseForMigrations();
    setIsPrepared(true);
  }, []);

  if (!isPrepared) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-[#FFF7E8] p-6">
        <AppText variant="subtitle" className="text-center">Préparation des données</AppText>
        <AppText tone="secondary" className="text-center">Initialisation locale...</AppText>
      </View>
    );
  }

  return (
    <PreparedMigrationRunner onRetry={onRetry}>
      {children}
    </PreparedMigrationRunner>
  );
}

function PreparedMigrationRunner({ children, onRetry }: MigrationRunnerProps) {
  const { success, error } = useMigrations(db, migrations);

  useEffect(() => {
    if (success || error) {
      initializeDatabaseConnection();
    }
  }, [error, success]);

  if (error) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-[#FFF7E8] p-6">
        <AppText variant="subtitle" className="text-center">Erreur de migration</AppText>
        <AppText tone="secondary" className="text-center">{error.message}</AppText>
        <AppButton title="Réessayer" iconName="redo" onPress={onRetry} />
      </View>
    );
  }

  if (!success) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-[#FFF7E8] p-6">
        <AppText variant="subtitle" className="text-center">Préparation des données</AppText>
        <AppText tone="secondary" className="text-center">Migration locale en cours...</AppText>
      </View>
    );
  }

  return children;
}
