import { AppText } from "@/src/presentation/components/shared";
import { colors } from "@/src/theme";
import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";

type CourseProgressRingProps = {
  value: number;
  mastered?: number;
  progressing?: number;
  needsWork?: number;
  notStarted?: number;
  size?: number;
};

function finiteCount(value: number | undefined) {
  return Number.isFinite(value) ? Math.max(0, Math.round(value ?? 0)) : 0;
}

export function CourseProgressRing({
  value,
  mastered = 0,
  progressing = 0,
  needsWork = 0,
  notStarted = 0,
  size = 118,
}: CourseProgressRingProps) {
  const radius = size * 0.38;
  const strokeWidth = Math.max(8, size * 0.08);
  const circumference = 2 * Math.PI * radius;
  const normalizedValue = Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : 0;
  const segments = [
    { key: "mastered", count: finiteCount(mastered), color: colors.secondary },
    { key: "progressing", count: finiteCount(progressing), color: colors.accent },
    { key: "needsWork", count: finiteCount(needsWork), color: colors.primary },
    { key: "notStarted", count: finiteCount(notStarted), color: colors.surfaceSoft },
  ];
  const total = segments.reduce((sum, segment) => sum + segment.count, 0);
  let offset = 0;

  return (
    <View
      accessibilityLabel={`Progression du chapitre : ${normalizedValue} pour cent. ${finiteCount(mastered)} maîtrisées, ${finiteCount(progressing)} en progression, ${finiteCount(needsWork)} à renforcer, ${finiteCount(notStarted)} non commencées.`}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: normalizedValue }}
      className="items-center justify-center"
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.surfaceSoft}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {total > 0
          ? segments.map((segment) => {
              if (segment.count <= 0) {
                return null;
              }
              const length = (segment.count / total) * circumference;
              const dashOffset = -offset;
              offset += length;
              return (
                <Circle
                  key={segment.key}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={segment.color}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray={`${Math.max(0, length)} ${circumference}`}
                  strokeDashoffset={`${dashOffset}`}
                  strokeLinecap={segment.count === total ? "round" : "butt"}
                  rotation="-90"
                  origin={`${size / 2}, ${size / 2}`}
                />
              );
            })
          : null}
      </Svg>
      <View className="absolute">
        <AppText variant="heading">{normalizedValue}%</AppText>
      </View>
    </View>
  );
}
