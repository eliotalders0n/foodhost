import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import type { MarketplaceListing } from "../types/domain";
import { COLORS, RADIUS, SPACING } from "../theme/tokens";

type Props = {
  listing: MarketplaceListing;
  onPress?: (listing: MarketplaceListing) => void;
  variant?: "grid" | "full";
};

export function ListingCard({ listing, onPress, variant = "grid" }: Props) {
  const isGrid = variant === "grid";
  const pickupPoint = listing.pickupPoint?.trim() || listing.locationSummary;

  const content = (
    <View style={[styles.card, isGrid ? styles.cardGrid : styles.cardFull]}>
      {listing.imageUrl ? (
        <Image
          source={{ uri: listing.imageUrl }}
          style={[styles.image, isGrid ? styles.imageGrid : styles.imageFull]}
        />
      ) : (
        <View style={[styles.placeholder, isGrid ? styles.imageGrid : styles.imageFull]}>
          <Ionicons color={COLORS.surface} name="restaurant-outline" size={28} />
          <Text style={styles.placeholderText}>{listing.category}</Text>
        </View>
      )}
      <View style={[styles.content, isGrid ? styles.contentGrid : null]}>
        <View style={styles.locationRow}>
          <Ionicons color={COLORS.textMuted} name="location" size={12} />
          <Text numberOfLines={1} style={styles.location}>
            {listing.sellerName}
          </Text>
        </View>
        <Text numberOfLines={2} style={[styles.title, isGrid ? styles.titleGrid : null]}>
          {listing.title}
        </Text>
        {!isGrid ? (
          <>
            <Text numberOfLines={1} style={styles.pickupPoint}>
              Pickup: {pickupPoint}
            </Text>
            <Text numberOfLines={3} style={styles.description}>
              {listing.description}
            </Text>
          </>
        ) : null}
        <View style={styles.footer}>
          <Text style={styles.price}>ZMW {listing.price.toFixed(2)}</Text>
          <View style={styles.ctaChip}>
            <Ionicons color={COLORS.text} name="arrow-forward" size={14} />
          </View>
        </View>
      </View>
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable onPress={() => onPress(listing)} style={styles.pressable}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    width: "48%",
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    overflow: "hidden",
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.05,
    shadowRadius: 16,
  },
  cardGrid: {
    height: 195,
  },
  cardFull: {
    minHeight: 280,
  },
  image: {
    width: "100%",
  },
  imageGrid: {
    height: 100,
  },
  imageFull: {
    height: 200,
  },
  placeholder: {
    alignItems: "center",
    backgroundColor: COLORS.darkCard,
    gap: SPACING.xs,
    justifyContent: "center",
  },
  placeholderText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: "700",
  },
  content: {
    gap: 4,
    padding: 10,
  },
  contentGrid: {
    flex: 1,
    justifyContent: "space-between",
  },
  locationRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 3,
  },
  location: {
    color: COLORS.textMuted,
    flex: 1,
    fontSize: 10,
    fontWeight: "600",
  },
  title: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 17,
  },
  pickupPoint: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 16,
  },
  titleGrid: {
    minHeight: 34,
  },
  price: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "800",
  },
  meta: {
    color: COLORS.textMuted,
    fontSize: 10,
    lineHeight: 14,
  },
  description: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 17,
    minHeight: 34,
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  ctaChip: {
    alignItems: "center",
    backgroundColor: COLORS.accent,
    borderRadius: 999,
    height: 26,
    justifyContent: "center",
    width: 26,
  },
});
