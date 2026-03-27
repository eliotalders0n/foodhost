import { useEffect, useMemo, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { NavigationProp } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ListingCard } from "../components/ListingCard";
import { subscribeToRecentListings } from "../lib/firestore";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useAuthStore } from "../store/authStore";
import type { MarketplaceListing } from "../types/domain";
import { COLORS, RADIUS, SPACING } from "../theme/tokens";

export function ExploreScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const profile = useAuthStore((state) => state.profile);
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => subscribeToRecentListings(setListings), []);

  const filteredListings = useMemo(() => {
    const needle = search.trim().toLowerCase();

    if (!needle) {
      return listings;
    }

    return listings.filter((listing) =>
      [
        listing.title,
        listing.category,
        listing.locationSummary,
        listing.pickupPoint ?? "",
        listing.sellerName,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [listings, search]);

  const featuredListing = filteredListings[0] ?? listings[0] ?? null;
  const categories = useMemo(() => {
    return [...new Set(listings.map((listing) => listing.category.trim()).filter(Boolean))]
      .slice(0, 6);
  }, [listings]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <View style={styles.searchBar}>
            <Ionicons color={COLORS.textMuted} name="search" size={18} />
            <TextInput
              onChangeText={setSearch}
              placeholder="Search food, sellers, or areas"
              placeholderTextColor={COLORS.textMuted}
              style={styles.searchInput}
              value={search}
            />
          </View>
          <Pressable style={styles.iconButton}>
            <Ionicons color={COLORS.text} name="options-outline" size={20} />
          </Pressable>
        </View>

        <View style={styles.locationRow}>
          <View style={styles.locationBadge}>
            <Ionicons color={COLORS.accentDeep} name="location" size={16} />
            <Text style={styles.locationText}>
              {profile ? `${profile.district}, ${profile.province}` : "Set your location"}
            </Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>
              {featuredListing ? featuredListing.title : "Fresh local meals near you"}
            </Text>
            <Text style={styles.heroBody}>
              {featuredListing
                ? `From ${featuredListing.sellerName} at ${featuredListing.pickupPoint ?? featuredListing.locationSummary}`
                : "Discover nearby kitchens, place inquiries, and pay when your order is accepted."}
            </Text>
            <Pressable
              disabled={!featuredListing}
              onPress={() =>
                featuredListing
                  ? navigation.navigate("ListingDetail", { listingId: featuredListing.id })
                  : undefined
              }
              style={styles.heroButton}
            >
              <Text style={styles.heroButtonText}>
                {featuredListing ? "See Listing" : "Start Exploring"}
              </Text>
            </Pressable>
          </View>
          {featuredListing?.imageUrl ? (
            <Image source={{ uri: featuredListing.imageUrl }} style={styles.heroImage} />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Ionicons color={COLORS.accent} name="fast-food-outline" size={38} />
            </View>
          )}
        </View>

        {categories.length > 0 ? (
          <ScrollView
            contentContainerStyle={styles.categoryRow}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {categories.map((category) => (
              <View key={category} style={styles.categoryChip}>
                <Text style={styles.categoryText}>{category}</Text>
              </View>
            ))}
          </ScrollView>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recommended for you</Text>
          <Text style={styles.sectionLink}>{filteredListings.length} items</Text>
        </View>

        <View style={styles.feed}>
        {filteredListings.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No listings found.</Text>
            <Text style={styles.emptyBody}>
              Try another search term or check back when sellers publish new meals.
            </Text>
          </View>
        ) : (
          filteredListings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              variant="grid"
              onPress={() =>
                navigation.navigate("ListingDetail", { listingId: listing.id })
              }
            />
          ))
        )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    gap: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: SPACING.sm,
  },
  searchBar: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    flex: 1,
    flexDirection: "row",
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.04,
    shadowRadius: 20,
  },
  searchInput: {
    color: COLORS.text,
    fontSize: 16,
    flex: 1,
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  locationRow: {
    flexDirection: "row",
  },
  locationBadge: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  locationText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
  },
  heroCard: {
    backgroundColor: COLORS.darkCard,
    borderRadius: RADIUS.lg,
    flexDirection: "row",
    overflow: "hidden",
    padding: SPACING.lg,
  },
  heroContent: {
    flex: 1,
    gap: SPACING.sm,
    justifyContent: "space-between",
    paddingRight: SPACING.sm,
  },
  heroTitle: {
    color: COLORS.surface,
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 32,
  },
  heroBody: {
    color: "#C8CDD5",
    fontSize: 14,
    lineHeight: 21,
  },
  heroButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: COLORS.accent,
    borderRadius: 999,
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: SPACING.md,
  },
  heroButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
  },
  heroImage: {
    alignSelf: "center",
    borderRadius: RADIUS.md,
    height: 132,
    width: 132,
  },
  heroPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 112,
  },
  categoryRow: {
    gap: SPACING.sm,
  },
  categoryChip: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "800",
  },
  sectionLink: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: "700",
  },
  feed: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  emptyState: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    gap: SPACING.xs,
    padding: SPACING.lg,
    width: "100%",
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "700",
  },
  emptyBody: {
    color: COLORS.textMuted,
    fontSize: 15,
    lineHeight: 22,
    padding: SPACING.md,
  },
});
