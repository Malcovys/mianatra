import { AppCard } from "./AppCard";
import { AppText } from "./AppText";

type EmptyStateCardProps = {
  title: string;
  description: string;
};

export function EmptyStateCard({ title, description }: EmptyStateCardProps) {
  return (
    <AppCard
      className="gap-2 rounded-xl p-4"
      style={{
        shadowColor: "#6E442A",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 2,
      }}
    >
      <AppText variant="label" className="text-[16px] leading-5">
        {title}
      </AppText>
      <AppText tone="secondary" className="text-[14px] leading-5">
        {description}
      </AppText>
    </AppCard>
  );
}