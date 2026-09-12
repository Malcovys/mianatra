import { db } from "@/src/database/client";
import { initializeDatabaseConnection, prepareDatabaseForMigrations } from "@/src/database/initialization";
import migrations from "@/src/database/migrations/migrations";
import { AppText } from "@/src/presentation/components/shared";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { useEffect } from "react";
import { View } from "react-native";

type MigrationGateProps = {
  children: React.ReactNode;
};  

// Prepare la db SQLite pour migration.
// Evaluer une seule fois
let databaseIsPreparedForMigration = false;

function ensureDatabasePreparedForMigration() {
  if(!databaseIsPreparedForMigration) {
    prepareDatabaseForMigrations();
    databaseIsPreparedForMigration = true;
  }
}

ensureDatabasePreparedForMigration();

/**
 * Initialize and database migration.
 */
export function MigrationGate({ children }: MigrationGateProps) {
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