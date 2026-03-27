import { useEffect, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { createInquiry, subscribeToListing } from "../lib/firestore";
import { ListingMap } from "../components/ListingMap";
import {
  formatListingAddOns,
  groupListingAddOns,
  normalizeListingAddOns,
  sumListingAddOns,
} from "../lib/listingOptions";
import { buildOpenStreetMapUrl, formatCoordinates, isValidCoordinates } from "../lib/maps";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useAuthStore } from "../store/authStore";
import { useToastStore } from "../store/toastStore";
import type { ListingAddOn, MarketplaceListing } from "../types/domain";
import { COLORS, RADIUS, SPACING } from "../theme/tokens";

type Props = NativeStackScreenProps<RootStackParamList, "ListingDetail">;

function formatCreatedAt(listing: MarketplaceListing | null) {
  const date = listing?.createdAt?.toDate?.();

  if (!date) {
    return "Just now";
  }

  return date.toLocaleString();
}

export function ListingDetailScreen({ navigation, route }: Props) {
  const profile = useAuthStore((state) => state.profile);
  const showToast = useToastStore((state) => state.showToast);
  const user = useAuthStore((state) => state.user);
  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [busy, setBusy] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);

  useEffect(() => {
    return subscribeToListing(
      route.params.listingId,
      (nextListing) => {
        setListing(nextListing);
        setFetchError(null);
      },
      (error) => setFetchError(error.message)
    );
  }, [route.params.listingId]);

  useEffect(() => {
    setSelectedAddOnIds([]);
  }, [listing?.id]);

  const isOwner = useMemo(() => {
    return Boolean(user?.uid && listing?.sellerId === user.uid);
  }, [listing?.sellerId, user?.uid]);

  async function handleSendInquiry() {
    if (!user || !profile || !listing) {
      showToast("You need an active profile to send an inquiry.", "error");
      return;
    }

    const requestedQuantity = Number(quantity);

    if (!Number.isInteger(requestedQuantity) || requestedQuantity <= 0) {
      showToast("Inquiry quantity must be a whole number.", "error");
      return;
    }

    setBusy(true);

    try {
      await createInquiry({
        buyerEmail: user.email ?? profile.email,
        buyerId: user.uid,
        buyerName: profile.displayName,
        listingId: listing.id,
        message: note.trim(),
        requestedQuantity,
        selectedAddOnIds,
      });

      setNote("");
      setQuantity("1");
      setSelectedAddOnIds([]);
      showToast("Inquiry sent. Track the response in Inbox.", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Inquiry failed.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleOpenMap() {
    const coordinates = listing?.coordinates ?? null;

    if (!isValidCoordinates(coordinates)) {
      showToast("This listing does not have a map pin yet.", "error");
      return;
    }

    try {
      await Linking.openURL(buildOpenStreetMapUrl(coordinates));
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to open the map.", "error");
    }
  }

  if (fetchError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{fetchError}</Text>
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.accent} />
      </View>
    );
  }

  const unavailable = listing.status !== "active" || listing.quantity <= 0;
  const listingAddOns = normalizeListingAddOns(listing.addOns);
  const listingCoordinates = isValidCoordinates(listing.coordinates ?? null)
    ? listing.coordinates ?? null
    : null;
  const groupedAddOns = groupListingAddOns(listingAddOns);
  const selectedAddOns = listingAddOns.filter((item) => selectedAddOnIds.includes(item.id));
  const selectedAddOnTotal = sumListingAddOns(selectedAddOns);
  const requestedQuantity = Number(quantity);
  const validQuantity = Number.isInteger(requestedQuantity) && requestedQuantity > 0 ? requestedQuantity : 1;
  const totalPrice = (listing.price + selectedAddOnTotal) * validQuantity;

  function handleToggleAddOn(addOn: ListingAddOn) {
    setSelectedAddOnIds((current) =>
      current.includes(addOn.id)
        ? current.filter((item) => item !== addOn.id)
        : [...current, addOn.id]
    );
  }

  return (
    <ScrollView style={styles.safeArea} contentContainerStyle={styles.container}>
      {listing.imageUrl ? (
        <Image source={{ uri: listing.imageUrl }} style={styles.heroImage} />
      ) : null}
      <View style={styles.card}>
        <View style={styles.locationRow}>
          <Ionicons color={COLORS.textMuted} name="location" size={16} />
          <Text style={styles.meta}>{listing.locationSummary}</Text>
        </View>
        <View style={styles.pickupRow}>
          <Text style={styles.pickupLabel}>Pickup point</Text>
          <Text style={styles.pickupValue}>
            {listing.pickupPoint?.trim() || listing.locationSummary}
          </Text>
        </View>
        <Text style={styles.title}>{listing.title}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{listing.quantity}</Text>
            <Text style={styles.statLabel}>available</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{listing.category}</Text>
            <Text style={styles.statLabel}>category</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{listing.sellerName}</Text>
            <Text style={styles.statLabel}>seller</Text>
          </View>
        </View>
        <Text style={styles.price}>ZMW {listing.price.toFixed(2)}</Text>
        {listingAddOns.length ? (
          <Text style={styles.meta}>
            Extras available: {listingAddOns.length} optional side or drink choices
          </Text>
        ) : null}
        <Text style={styles.description}>{listing.description}</Text>
        <Text style={styles.published}>Posted {formatCreatedAt(listing)}</Text>
      </View>

      {listingAddOns.length ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Available extras</Text>
          <Text style={styles.body}>
            This meal has optional sides and drinks you can add before sending your inquiry.
          </Text>
          {groupedAddOns.sides.length ? (
            <View style={styles.previewGroup}>
              <Text style={styles.previewGroupTitle}>Sides</Text>
              {groupedAddOns.sides.map((item) => (
                <View key={item.id} style={styles.previewRow}>
                  <Text style={styles.previewLabel}>{item.label}</Text>
                  <Text style={styles.previewPrice}>+ ZMW {item.price.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          ) : null}
          {groupedAddOns.drinks.length ? (
            <View style={styles.previewGroup}>
              <Text style={styles.previewGroupTitle}>Drinks</Text>
              {groupedAddOns.drinks.map((item) => (
                <View key={item.id} style={styles.previewRow}>
                  <Text style={styles.previewLabel}>{item.label}</Text>
                  <Text style={styles.previewPrice}>+ ZMW {item.price.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Map</Text>
        <Text style={styles.body}>
          {listingCoordinates
            ? "Use the pinned pickup point to verify the handover location before sending an inquiry."
            : "The seller has not added an exact map pin for this listing yet."}
        </Text>
        <ListingMap coordinates={listingCoordinates} height={220} />
        {listingCoordinates ? (
          <>
            <View style={styles.locationRow}>
              <Ionicons color={COLORS.textMuted} name="navigate-outline" size={16} />
              <Text style={styles.meta}>{formatCoordinates(listingCoordinates)}</Text>
            </View>
            <Pressable onPress={handleOpenMap} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Open in OpenStreetMap</Text>
            </Pressable>
          </>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Inquiry</Text>

        {isOwner ? (
          <>
            <Text style={styles.body}>
              This is your listing. Manage buyer requests from the inbox.
            </Text>
            <Pressable
              onPress={() => navigation.navigate("App", { screen: "Inbox" })}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Open Inbox</Text>
            </Pressable>
          </>
        ) : unavailable ? (
          <Text style={styles.body}>
            This listing is currently unavailable for new inquiries.
          </Text>
        ) : (
          <>
            <Text style={styles.body}>
              Choose quantity, add or remove any listed sides and drinks, then send the final request to the seller.
            </Text>
            {listingAddOns.length ? (
              <View style={styles.extrasPanel}>
                <Text style={styles.extrasTitle}>Meal extras</Text>
                <Text style={styles.body}>
                  Tap an option to add it. Tap again to remove it.
                </Text>
                {groupedAddOns.sides.length ? (
                  <View style={styles.extrasGroup}>
                    <Text style={styles.extrasGroupTitle}>Sides</Text>
                    <View style={styles.extraChipRow}>
                      {groupedAddOns.sides.map((item) => {
                        const active = selectedAddOnIds.includes(item.id);

                        return (
                          <Pressable
                            key={item.id}
                            onPress={() => handleToggleAddOn(item)}
                            style={[styles.extraChip, active ? styles.extraChipActive : null]}
                          >
                            <Text
                              style={[
                                styles.extraChipText,
                                active ? styles.extraChipTextActive : null,
                              ]}
                            >
                              {item.label} (+ZMW {item.price.toFixed(2)})
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                ) : null}
                {groupedAddOns.drinks.length ? (
                  <View style={styles.extrasGroup}>
                    <Text style={styles.extrasGroupTitle}>Drinks</Text>
                    <View style={styles.extraChipRow}>
                      {groupedAddOns.drinks.map((item) => {
                        const active = selectedAddOnIds.includes(item.id);

                        return (
                          <Pressable
                            key={item.id}
                            onPress={() => handleToggleAddOn(item)}
                            style={[styles.extraChip, active ? styles.extraChipActive : null]}
                          >
                            <Text
                              style={[
                                styles.extraChipText,
                                active ? styles.extraChipTextActive : null,
                              ]}
                            >
                              {item.label} (+ZMW {item.price.toFixed(2)})
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                ) : null}
                <View style={styles.extrasSummary}>
                  <Text style={styles.meta}>
                    Selected: {formatListingAddOns(selectedAddOns)}
                  </Text>
                  <Text style={styles.summaryPrice}>
                    Total: ZMW {totalPrice.toFixed(2)}
                  </Text>
                </View>
              </View>
            ) : null}
            <TextInput
              keyboardType="number-pad"
              onChangeText={setQuantity}
              placeholder="Requested quantity"
              placeholderTextColor={COLORS.textMuted}
              style={styles.input}
              value={quantity}
            />
            <TextInput
              multiline
              onChangeText={setNote}
              placeholder="Message for the seller"
              placeholderTextColor={COLORS.textMuted}
              style={[styles.input, styles.textArea]}
              value={note}
            />
            <Pressable
              disabled={busy}
              onPress={handleSendInquiry}
              style={styles.primaryButton}
            >
              {busy ? (
                <ActivityIndicator color={COLORS.text} />
              ) : (
                <Text style={styles.primaryButtonText}>Send Inquiry</Text>
              )}
            </Pressable>
          </>
        )}

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    gap: SPACING.md,
    padding: SPACING.lg,
  },
  centered: {
    alignItems: "center",
    backgroundColor: COLORS.background,
    flex: 1,
    justifyContent: "center",
    padding: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
    padding: SPACING.lg,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 14,
    },
    shadowOpacity: 0.06,
    shadowRadius: 24,
  },
  heroImage: {
    borderRadius: RADIUS.lg,
    height: 290,
    width: "100%",
  },
  locationRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  title: {
    color: COLORS.text,
    fontSize: 34,
    fontWeight: "800",
    lineHeight: 38,
  },
  price: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: "800",
  },
  meta: {
    color: COLORS.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  pickupRow: {
    gap: 2,
  },
  pickupLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  pickupValue: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 24,
  },
  statsRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  statCard: {
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.md,
    flex: 1,
    gap: 2,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  statValue: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  description: {
    color: COLORS.text,
    fontSize: 16,
    lineHeight: 24,
  },
  published: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  previewGroup: {
    gap: SPACING.xs,
  },
  previewGroupTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
  },
  previewRow: {
    alignItems: "center",
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.md,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  previewLabel: {
    color: COLORS.text,
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  previewPrice: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: "700",
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "800",
  },
  extrasPanel: {
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  extrasTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "800",
  },
  extrasGroup: {
    gap: SPACING.xs,
  },
  extrasGroupTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
  },
  extraChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
  },
  extraChip: {
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  extraChipActive: {
    backgroundColor: COLORS.accent,
  },
  extraChipText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
  },
  extraChipTextActive: {
    color: COLORS.text,
  },
  extrasSummary: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    gap: 4,
    padding: SPACING.sm,
  },
  body: {
    color: COLORS.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  summaryPrice: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
  },
  input: {
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.md,
    color: COLORS.text,
    fontSize: 16,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
  },
  textArea: {
    minHeight: 110,
    textAlignVertical: "top",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.md,
    minHeight: 52,
    justifyContent: "center",
    paddingHorizontal: SPACING.md,
  },
  primaryButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
  },
  secondaryButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceMuted,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "700",
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
});
