import { StyleSheet, Text, View } from "react-native";

import { formatCoordinates } from "../lib/maps";
import { COLORS, RADIUS, SPACING } from "../theme/tokens";
import type { ListingMapProps } from "./ListingMap";

export function ListingMap({ coordinates, editable = false, height = 220 }: ListingMapProps) {
  return (
    <View style={[styles.wrapper, { height }]}>
      <View style={styles.content}>
        <Text style={styles.title}>
          {coordinates ? "Map preview available" : "Map pin not set yet"}
        </Text>
        <Text style={styles.body}>
          {coordinates
            ? `Coordinates: ${formatCoordinates(coordinates)}`
            : "Use current location or enter latitude and longitude to save an exact pickup point."}
        </Text>
        <Text style={styles.caption}>
          {editable
            ? "Web fallback: the native map pin editor is replaced with coordinate inputs and an OpenStreetMap link."
            : "Open the listing in OpenStreetMap to verify the exact pickup point."}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: COLORS.surfaceMuted,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  content: {
    flex: 1,
    gap: SPACING.xs,
    justifyContent: "center",
    padding: SPACING.md,
  },
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "800",
  },
  body: {
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 22,
  },
  caption: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
});
