import { useEffect, useMemo, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  createListing,
  deleteListing,
  subscribeToSellerListings,
  updateListing,
} from "../lib/firestore";
import {
  buildListingAddOn,
  groupListingAddOns,
  normalizeListingAddOns,
  sumListingAddOns,
} from "../lib/listingOptions";
import {
  buildOpenStreetMapUrl,
  formatCoordinates,
  isValidCoordinates,
  isValidLatitude,
  isValidLongitude,
} from "../lib/maps";
import { deleteListingImage, uploadListingImage } from "../lib/storage";
import { ListingMap } from "../components/ListingMap";
import { ScreenShell } from "../components/ScreenShell";
import { useAuthStore } from "../store/authStore";
import { useToastStore } from "../store/toastStore";
import type { ListingAddOn, ListingCoordinates, MarketplaceListing } from "../types/domain";
import { COLORS, RADIUS, SPACING } from "../theme/tokens";

type WorkspaceTab = "create" | "list" | "edit";

type ListingFormState = {
  category: string;
  description: string;
  latitude: string;
  locationSummary: string;
  longitude: string;
  pickupPoint: string;
  price: string;
  quantity: string;
  title: string;
};

type ListingImageState = {
  imagePath: string | null;
  imageUrl: string | null;
};

const EMPTY_IMAGE: ListingImageState = {
  imagePath: null,
  imageUrl: null,
};

const rawMealCategoryCatalog = require("../data/mealCategories.json") as {
  groups: Array<{
    items?: unknown;
    title?: unknown;
  }>;
};

type MealCategoryOption = {
  description: string;
  name: string;
};

type MealCategoryGroup = {
  items: MealCategoryOption[];
  title: string;
};

const mealCategoryCatalog = {
  groups: Array.isArray(rawMealCategoryCatalog?.groups)
    ? rawMealCategoryCatalog.groups
        .map((group) => {
          const title =
            typeof group?.title === "string" ? group.title.trim() : "";
          const items = Array.isArray(group?.items)
            ? group.items
                .map((item) => {
                  if (!item || typeof item !== "object") {
                    return null;
                  }

                  const name =
                    typeof (item as { name?: unknown }).name === "string"
                      ? (item as { name: string }).name.trim()
                      : "";
                  const description =
                    typeof (item as { description?: unknown }).description === "string"
                      ? (item as { description: string }).description.trim()
                      : "";

                  if (!name) {
                    return null;
                  }

                  return {
                    description,
                    name,
                  };
                })
                .filter((item): item is MealCategoryOption => Boolean(item))
            : [];

          if (!title || items.length === 0) {
            return null;
          }

          return { items, title };
        })
        .filter(
          (
            group
          ): group is {
            items: MealCategoryOption[];
            title: string;
          } => Boolean(group)
        )
    : [],
};

function findMealCategoryOption(category: string) {
  const normalizedCategory = category.trim().toLowerCase();

  if (!normalizedCategory) {
    return null;
  }

  for (const group of mealCategoryCatalog.groups) {
    for (const item of group.items) {
      if (item.name.trim().toLowerCase() === normalizedCategory) {
        return {
          groupTitle: group.title,
          ...item,
        };
      }
    }
  }

  return null;
}

function buildDefaultLocationSummary(
  profile: ReturnType<typeof useAuthStore.getState>["profile"]
) {
  if (!profile) {
    return "";
  }

  return `${profile.district}, ${profile.province}`;
}

function buildEmptyForm(
  profile: ReturnType<typeof useAuthStore.getState>["profile"]
): ListingFormState {
  return {
    category: "",
    description: "",
    latitude: "",
    locationSummary: buildDefaultLocationSummary(profile),
    longitude: "",
    pickupPoint: "",
    price: "",
    quantity: "",
    title: "",
  };
}

function buildFormFromListing(listing: MarketplaceListing): ListingFormState {
  return {
    category: listing.category,
    description: listing.description,
    latitude: listing.coordinates?.latitude?.toFixed(6) ?? "",
    locationSummary: listing.locationSummary,
    longitude: listing.coordinates?.longitude?.toFixed(6) ?? "",
    pickupPoint: listing.pickupPoint?.trim() || listing.locationSummary,
    price: String(listing.price),
    quantity: String(listing.quantity),
    title: listing.title,
  };
}

function buildTabCopy(tab: WorkspaceTab) {
  if (tab === "list") {
    return {
      body: "Review published meals, jump into edits, or remove listings that should no longer be visible.",
      title: "Your listings",
    };
  }

  if (tab === "edit") {
    return {
      body: "Adjust price, stock, pickup details, or the exact map pin without leaving the sell area.",
      title: "Edit listing",
    };
  }

  return {
    body: "Create a listing with a clear pickup point, accurate map pin, and a photo buyers can trust.",
    title: "Publish a new meal",
  };
}

async function confirmRemoval(title: string) {
  if (Platform.OS === "web") {
    return globalThis.confirm?.(`Remove "${title}"? This cannot be undone.`) ?? false;
  }

  return new Promise<boolean>((resolve) => {
    Alert.alert(
      "Remove listing",
      `Remove "${title}"? This cannot be undone.`,
      [
        {
          style: "cancel",
          text: "Cancel",
          onPress: () => resolve(false),
        },
        {
          style: "destructive",
          text: "Remove",
          onPress: () => resolve(true),
        },
      ]
    );
  });
}

export function SellScreen() {
  const profile = useAuthStore((state) => state.profile);
  const showToast = useToastStore((state) => state.showToast);
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("create");
  const [addOns, setAddOns] = useState<ListingAddOn[]>([]);
  const [busy, setBusy] = useState(false);
  const [busyListingId, setBusyListingId] = useState<string | null>(null);
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
  const [coordinates, setCoordinates] = useState<ListingCoordinates | null>(null);
  const [editingListingId, setEditingListingId] = useState<string | null>(null);
  const [form, setForm] = useState<ListingFormState>(() => buildEmptyForm(profile));
  const [listingImage, setListingImage] = useState<ListingImageState>(EMPTY_IMAGE);
  const [listingsLoaded, setListingsLoaded] = useState(false);
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [sellerListings, setSellerListings] = useState<MarketplaceListing[]>([]);

  const isSeller = profile?.accountType === "seller";
  const addOnsTotal = sumListingAddOns(addOns);
  const groupedAddOns = groupListingAddOns(addOns);
  const previewUri = selectedImage?.uri ?? listingImage.imageUrl ?? null;
  const selectedCategoryOption = findMealCategoryOption(form.category);
  const tabCopy = buildTabCopy(activeTab);

  const tabs = useMemo(() => {
    const baseTabs: Array<{ key: WorkspaceTab; label: string }> = [
      { key: "create", label: "Create" },
      { key: "list", label: `Listings (${sellerListings.length})` },
    ];

    if (editingListingId) {
      baseTabs.push({ key: "edit", label: "Edit" });
    }

    return baseTabs;
  }, [editingListingId, sellerListings.length]);

  useEffect(() => {
    if (!user?.uid || !isSeller) {
      setSellerListings([]);
      setListingsLoaded(true);
      return;
    }

    setListingsLoaded(false);

    return subscribeToSellerListings(
      user.uid,
      (nextListings) => {
        setSellerListings(nextListings);
        setListingsLoaded(true);
      },
      (error) => {
        setListingsLoaded(true);
        showToast(error.message, "error");
      }
    );
  }, [isSeller, showToast, user?.uid]);

  useEffect(() => {
    if (!editingListingId) {
      return;
    }

    const currentListing = sellerListings.find((item) => item.id === editingListingId);

    if (!currentListing) {
      setEditingListingId(null);
      setActiveTab("list");
    }
  }, [editingListingId, sellerListings]);

  useEffect(() => {
    if (!editingListingId && !form.locationSummary.trim()) {
      setForm((current) => ({
        ...current,
        locationSummary: buildDefaultLocationSummary(profile),
      }));
    }
  }, [editingListingId, form.locationSummary, profile]);

  function resetComposer(nextTab: WorkspaceTab = "create") {
    setActiveTab(nextTab);
    setAddOns([]);
    setCoordinates(null);
    setCategoryPickerVisible(false);
    setEditingListingId(null);
    setForm(buildEmptyForm(profile));
    setListingImage(EMPTY_IMAGE);
    setMessage(null);
    setSelectedImage(null);
  }

  function applyCoordinates(nextCoordinates: ListingCoordinates) {
    setCoordinates(nextCoordinates);
    setForm((current) => ({
      ...current,
      latitude: nextCoordinates.latitude.toFixed(6),
      longitude: nextCoordinates.longitude.toFixed(6),
    }));
    setMessage(null);
  }

  function updateField(field: keyof ListingFormState, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resolveCoordinatesInput() {
    if (!form.latitude.trim() && !form.longitude.trim()) {
      return coordinates;
    }

    if (!form.latitude.trim() || !form.longitude.trim()) {
      return null;
    }

    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);

    if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
      return null;
    }

    return { latitude, longitude };
  }

  function handleCoordinateBlur() {
    if (!form.latitude.trim() || !form.longitude.trim()) {
      return;
    }

    const nextCoordinates = resolveCoordinatesInput();

    if (!nextCoordinates) {
      setMessage("Enter valid latitude and longitude values for the pickup point.");
      return;
    }

    applyCoordinates(nextCoordinates);
  }

  async function handlePickImage() {
    if (Platform.OS !== "web") {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        setMessage("Photo access is required to attach listing images.");
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      base64: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
    });

    if (result.canceled) {
      return;
    }

    setSelectedImage(result.assets[0] ?? null);
    setMessage(null);
  }

  async function handleUseCurrentLocation() {
    setLocating(true);
    setMessage(null);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        setMessage("Location access is required to pin an exact pickup point.");
        return;
      }

      const currentPosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      applyCoordinates({
        latitude: currentPosition.coords.latitude,
        longitude: currentPosition.coords.longitude,
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to fetch your location.");
    } finally {
      setLocating(false);
    }
  }

  async function handleOpenMap() {
    const resolvedCoordinates = resolveCoordinatesInput();

    if (!isValidCoordinates(resolvedCoordinates)) {
      setMessage("Add valid coordinates before opening the map.");
      return;
    }

    try {
      await Linking.openURL(buildOpenStreetMapUrl(resolvedCoordinates));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to open the map.");
    }
  }

  function handleStartEditing(listing: MarketplaceListing) {
    setActiveTab("edit");
    setAddOns(normalizeListingAddOns(listing.addOns));
    setCoordinates(listing.coordinates ?? null);
    setEditingListingId(listing.id);
    setForm(buildFormFromListing(listing));
    setListingImage({
      imagePath: listing.imagePath,
      imageUrl: listing.imageUrl,
    });
    setMessage(null);
    setSelectedImage(null);
  }

  async function handleSubmit() {
    if (!profile || !user) {
      setMessage("Create your profile first.");
      return;
    }

    if (profile.accountType !== "seller") {
      setMessage("Only seller profiles can publish listings.");
      return;
    }

    if (
      !form.title.trim() ||
      !form.category.trim() ||
      !form.locationSummary.trim() ||
      !form.pickupPoint.trim() ||
      !form.description.trim()
    ) {
      setMessage("All fields are required.");
      return;
    }

    const parsedPrice = Number(form.price);
    const parsedQuantity = Number(form.quantity);

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setMessage("Price must be a positive number.");
      return;
    }

    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      setMessage("Quantity must be a positive number.");
      return;
    }

    const resolvedCoordinates = resolveCoordinatesInput();

    if (!isValidCoordinates(resolvedCoordinates)) {
      setMessage("Add an exact pickup point on the map before saving.");
      return;
    }

    applyCoordinates(resolvedCoordinates);
    setBusy(true);
    setMessage(null);

    try {
      let nextImage = listingImage;
      const previousImagePath = listingImage.imagePath;
      const normalizedAddOns = normalizeListingAddOns(addOns);

      if (selectedImage?.base64) {
        nextImage = await uploadListingImage({
          base64: selectedImage.base64,
          mimeType: selectedImage.mimeType ?? null,
          sellerId: profile.uid,
          uri: selectedImage.uri,
        });
      }

      const payload = {
        addOns: normalizedAddOns,
        category: form.category.trim(),
        coordinates: resolvedCoordinates,
        description: form.description.trim(),
        imagePath: nextImage.imagePath,
        imageUrl: nextImage.imageUrl,
        locationSummary: form.locationSummary.trim(),
        pickupPoint: form.pickupPoint.trim(),
        price: parsedPrice,
        quantity: parsedQuantity,
        sellerId: profile.uid,
        sellerName: profile.displayName,
        title: form.title.trim(),
      };

      if (editingListingId) {
        await updateListing({
          ...payload,
          listingId: editingListingId,
          status: parsedQuantity > 0 ? "active" : "paused",
        });
      } else {
        await createListing(payload);
      }

      if (selectedImage?.base64 && previousImagePath && previousImagePath !== nextImage.imagePath) {
        await deleteListingImage(previousImagePath);
      }

      showToast(editingListingId ? "Listing updated." : "Listing created.", "success");

      if (editingListingId) {
        resetComposer("list");
      } else {
        resetComposer("create");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save the listing.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveListing(listing: MarketplaceListing) {
    if (!user?.uid) {
      showToast("Sign in again before removing a listing.", "error");
      return;
    }

    const confirmed = await confirmRemoval(listing.title);

    if (!confirmed) {
      return;
    }

    setBusyListingId(listing.id);

    try {
      const removedListing = await deleteListing({
        listingId: listing.id,
        sellerId: user.uid,
      });

      await deleteListingImage(removedListing.imagePath);

      if (editingListingId === listing.id) {
        resetComposer("list");
      }

      showToast("Listing removed.", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to remove listing.", "error");
    } finally {
      setBusyListingId(null);
    }
  }

  if (!isSeller) {
    return (
      <ScreenShell
        eyebrow="Sell"
        title="Seller tools"
        body="Create a seller profile to publish meals, manage pickup points, and maintain your listings."
      >
        <View style={styles.emptyState}>
          <Ionicons color={COLORS.textMuted} name="storefront-outline" size={28} />
          <Text style={styles.emptyTitle}>Seller access required</Text>
          <Text style={styles.emptyBody}>
            This workspace is only available to seller accounts.
          </Text>
        </View>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell eyebrow="Sell" title={tabCopy.title} body={tabCopy.body}>
      <View style={styles.tabRow}>
        {tabs.map((tab) => {
          const active = tab.key === activeTab;

          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tabButton, active ? styles.tabButtonActive : null]}
            >
              <Text style={[styles.tabButtonText, active ? styles.tabButtonTextActive : null]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {activeTab === "list" ? (
        <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.summaryCard}>
            <View>
              <Text style={styles.summaryTitle}>Published meals</Text>
              <Text style={styles.summaryBody}>
                Jump into edits fast and remove listings that should no longer accept inquiries.
              </Text>
            </View>
            <Pressable onPress={() => resetComposer("create")} style={styles.summaryButton}>
              <Text style={styles.summaryButtonText}>New listing</Text>
            </Pressable>
          </View>

          {!listingsLoaded ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator color={COLORS.accentDeep} />
            </View>
          ) : sellerListings.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons color={COLORS.textMuted} name="basket-outline" size={28} />
              <Text style={styles.emptyTitle}>No listings yet</Text>
              <Text style={styles.emptyBody}>
                Publish your first meal to start showing up in Explore.
              </Text>
            </View>
          ) : (
            sellerListings.map((listing) => {
              const isRemoving = busyListingId === listing.id;

              return (
                <View key={listing.id} style={styles.listingCard}>
                  <View style={styles.listingHeader}>
                    {listing.imageUrl ? (
                      <Image source={{ uri: listing.imageUrl }} style={styles.listingImage} />
                    ) : (
                      <View style={styles.listingImageFallback}>
                        <Ionicons color={COLORS.surface} name="restaurant-outline" size={22} />
                      </View>
                    )}
                    <View style={styles.listingHeaderText}>
                      <Text style={styles.listingTitle}>{listing.title}</Text>
                      <Text style={styles.listingMeta}>
                        {listing.pickupPoint?.trim() || listing.locationSummary}
                      </Text>
                      <Text style={styles.listingMeta}>
                        ZMW {listing.price.toFixed(2)} · {listing.quantity} available
                      </Text>
                      {listing.addOns?.length ? (
                        <Text style={styles.listingMeta}>
                          {listing.addOns.length} extras available
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  <View style={styles.listingLocationRow}>
                    <Ionicons color={COLORS.textMuted} name="location-outline" size={16} />
                    <Text style={styles.listingLocationText}>{listing.locationSummary}</Text>
                  </View>

                  {listing.coordinates ? (
                    <Text style={styles.coordinatesText}>
                      Map pin: {formatCoordinates(listing.coordinates)}
                    </Text>
                  ) : null}

                  <View style={styles.listingActions}>
                    <Pressable
                      onPress={() => handleStartEditing(listing)}
                      style={styles.listingActionPrimary}
                    >
                      <Text style={styles.listingActionPrimaryText}>Edit</Text>
                    </Pressable>
                    <Pressable
                      disabled={isRemoving}
                      onPress={() => handleRemoveListing(listing)}
                      style={[
                        styles.listingActionSecondary,
                        isRemoving ? styles.buttonDisabled : null,
                      ]}
                    >
                      {isRemoving ? (
                        <ActivityIndicator color={COLORS.text} />
                      ) : (
                        <Text style={styles.listingActionSecondaryText}>Remove</Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.formContainer} showsVerticalScrollIndicator={false}>
          {activeTab === "edit" ? (
            <View style={styles.editBanner}>
              <View style={styles.editBannerText}>
                <Text style={styles.editBannerTitle}>Editing current listing</Text>
                <Text style={styles.editBannerBody}>
                  Update the details below, or return to your listings without saving.
                </Text>
              </View>
              <Pressable onPress={() => resetComposer("list")} style={styles.editBannerButton}>
                <Text style={styles.editBannerButtonText}>Back to listings</Text>
              </Pressable>
            </View>
          ) : null}

          <Pressable onPress={handlePickImage} style={styles.uploadCard}>
            {previewUri ? (
              <Image source={{ uri: previewUri }} style={styles.previewImage} />
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Ionicons color={COLORS.text} name="camera-outline" size={28} />
                <Text style={styles.uploadTitle}>
                  {activeTab === "edit" ? "Replace listing photo" : "Add listing photo"}
                </Text>
                <Text style={styles.uploadBody}>
                  Use a bright photo that makes the meal easy to recognise.
                </Text>
              </View>
            )}
          </Pressable>

          <TextInput
            onChangeText={(value) => updateField("title", value)}
            placeholder="Listing title"
            placeholderTextColor={COLORS.textMuted}
            style={styles.input}
            value={form.title}
          />
          <Pressable
            onPress={() => setCategoryPickerVisible(true)}
            style={styles.selectInput}
          >
            <View style={styles.selectInputText}>
              <Text style={form.category ? styles.selectInputValue : styles.selectInputPlaceholder}>
                {form.category || "Select meal category"}
              </Text>
              {selectedCategoryOption ? (
                <Text style={styles.selectInputMeta}>
                  {selectedCategoryOption.groupTitle} · {selectedCategoryOption.description}
                </Text>
              ) : null}
            </View>
            <Ionicons color={COLORS.textMuted} name="chevron-down" size={18} />
          </Pressable>

          <View style={styles.row}>
            <TextInput
              keyboardType="decimal-pad"
              onChangeText={(value) => updateField("price", value)}
              placeholder="Price in ZMW"
              placeholderTextColor={COLORS.textMuted}
              style={[styles.input, styles.halfInput]}
              value={form.price}
            />
            <TextInput
              keyboardType="number-pad"
              onChangeText={(value) => updateField("quantity", value)}
              placeholder="Quantity"
              placeholderTextColor={COLORS.textMuted}
              style={[styles.input, styles.halfInput]}
              value={form.quantity}
            />
          </View>

          <TextInput
            onChangeText={(value) => updateField("locationSummary", value)}
            placeholder="Selling point or area"
            placeholderTextColor={COLORS.textMuted}
            style={styles.input}
            value={form.locationSummary}
          />
          <TextInput
            onChangeText={(value) => updateField("pickupPoint", value)}
            placeholder="Pickup point name"
            placeholderTextColor={COLORS.textMuted}
            style={styles.input}
            value={form.pickupPoint}
          />

          <View style={styles.mapSection}>
            <View style={styles.mapHeader}>
              <View style={styles.mapHeaderText}>
                <Text style={styles.mapTitle}>Pickup map</Text>
                <Text style={styles.mapBody}>
                  Pin the exact handover point so buyers can open it directly on a map.
                </Text>
              </View>
              <Pressable
                disabled={busy || locating}
                onPress={handleUseCurrentLocation}
                style={styles.mapButton}
              >
                {locating ? (
                  <ActivityIndicator color={COLORS.text} />
                ) : (
                  <>
                    <Ionicons color={COLORS.text} name="locate-outline" size={16} />
                    <Text style={styles.mapButtonText}>Use current location</Text>
                  </>
                )}
              </Pressable>
            </View>

            <ListingMap
              coordinates={coordinates}
              editable
              height={220}
              onChangeCoordinates={applyCoordinates}
              showUserLocation
            />

            <View style={styles.row}>
              <TextInput
                keyboardType="numbers-and-punctuation"
                onBlur={handleCoordinateBlur}
                onChangeText={(value) => updateField("latitude", value)}
                placeholder="Latitude"
                placeholderTextColor={COLORS.textMuted}
                style={[styles.input, styles.halfInput]}
                value={form.latitude}
              />
              <TextInput
                keyboardType="numbers-and-punctuation"
                onBlur={handleCoordinateBlur}
                onChangeText={(value) => updateField("longitude", value)}
                placeholder="Longitude"
                placeholderTextColor={COLORS.textMuted}
                style={[styles.input, styles.halfInput]}
                value={form.longitude}
              />
            </View>

            <View style={styles.mapFooter}>
              <Text style={styles.mapMeta}>
                {isValidCoordinates(resolveCoordinatesInput())
                  ? `Pinned at ${formatCoordinates(resolveCoordinatesInput() as ListingCoordinates)}`
                  : "No exact pickup point pinned yet."}
              </Text>
              <Pressable
                disabled={!isValidCoordinates(resolveCoordinatesInput())}
                onPress={handleOpenMap}
                style={[
                  styles.secondaryButton,
                  !isValidCoordinates(resolveCoordinatesInput()) ? styles.buttonDisabled : null,
                ]}
              >
                <Text style={styles.secondaryButtonText}>Open in OpenStreetMap</Text>
              </Pressable>
            </View>
          </View>

          <TextInput
            multiline
            onChangeText={(value) => updateField("description", value)}
            placeholder="Description"
            placeholderTextColor={COLORS.textMuted}
            style={[styles.input, styles.textArea]}
            value={form.description}
          />

          <View style={styles.extrasSection}>
            <View style={styles.extrasHeader}>
              <View style={styles.extrasHeaderText}>
                <Text style={styles.extrasTitle}>Sides and drinks</Text>
                <Text style={styles.extrasBody}>
                  Buyers can add or remove these extras before sending an inquiry. The total price updates automatically.
                </Text>
              </View>
              <View style={styles.extrasActions}>
                <Pressable
                  onPress={() => setAddOns((current) => [...current, buildListingAddOn("side")])}
                  style={styles.extraActionButton}
                >
                  <Text style={styles.extraActionButtonText}>Add side</Text>
                </Pressable>
                <Pressable
                  onPress={() => setAddOns((current) => [...current, buildListingAddOn("drink")])}
                  style={styles.extraActionButton}
                >
                  <Text style={styles.extraActionButtonText}>Add drink</Text>
                </Pressable>
              </View>
            </View>

            {addOns.length === 0 ? (
              <Text style={styles.extrasEmptyText}>
                No extras added yet. Add optional sides or drinks to give buyers more choice.
              </Text>
            ) : (
              addOns.map((item) => (
                <View key={item.id} style={styles.extraRow}>
                  <View style={styles.extraRowHeader}>
                    <View
                      style={[
                        styles.extraKindBadge,
                        item.kind === "drink" ? styles.drinkBadge : styles.sideBadge,
                      ]}
                    >
                      <Text style={styles.extraKindBadgeText}>{item.kind}</Text>
                    </View>
                    <Pressable
                      onPress={() =>
                        setAddOns((current) => current.filter((entry) => entry.id !== item.id))
                      }
                      style={styles.extraRemoveButton}
                    >
                      <Ionicons color={COLORS.text} name="close" size={16} />
                    </Pressable>
                  </View>
                  <View style={styles.extraInputsRow}>
                    <TextInput
                      onChangeText={(value) =>
                        setAddOns((current) =>
                          current.map((entry) =>
                            entry.id === item.id ? { ...entry, label: value } : entry
                          )
                        )
                      }
                      placeholder={item.kind === "drink" ? "Drink name" : "Side name"}
                      placeholderTextColor={COLORS.textMuted}
                      style={[styles.input, styles.extraNameInput]}
                      value={item.label}
                    />
                    <TextInput
                      keyboardType="decimal-pad"
                      onChangeText={(value) =>
                        setAddOns((current) =>
                          current.map((entry) =>
                            entry.id === item.id
                              ? { ...entry, price: Number(value || "0") }
                              : entry
                          )
                        )
                      }
                      placeholder="Price"
                      placeholderTextColor={COLORS.textMuted}
                      style={[styles.input, styles.extraPriceInput]}
                      value={item.price ? String(item.price) : ""}
                    />
                  </View>
                </View>
              ))
            )}

            <View style={styles.extrasSummary}>
              <Text style={styles.extrasSummaryText}>
                {groupedAddOns.sides.length} sides · {groupedAddOns.drinks.length} drinks
              </Text>
              <Text style={styles.extrasSummaryText}>
                Optional extras total up to ZMW {addOnsTotal.toFixed(2)}
              </Text>
            </View>
          </View>

          {message ? <Text style={styles.message}>{message}</Text> : null}

          <View style={styles.formActions}>
            {activeTab === "edit" ? (
              <Pressable onPress={() => resetComposer("list")} style={styles.secondaryButtonWide}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
            ) : null}
            <Pressable disabled={busy} onPress={handleSubmit} style={styles.button}>
              {busy ? (
                <ActivityIndicator color={COLORS.text} />
              ) : (
                <>
                  <Ionicons
                    color={COLORS.text}
                    name={activeTab === "edit" ? "save-outline" : "add-circle"}
                    size={18}
                  />
                  <Text style={styles.buttonText}>
                    {activeTab === "edit" ? "Update Listing" : "Create Listing"}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </ScrollView>
      )}

      <Modal
        animationType="slide"
        onRequestClose={() => setCategoryPickerVisible(false)}
        transparent
        visible={categoryPickerVisible}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Select category</Text>
                <Text style={styles.modalBody}>
                  Choose a meal from the catalog. Its group and description are shown here.
                </Text>
              </View>
              <Pressable
                onPress={() => setCategoryPickerVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons color={COLORS.text} name="close" size={18} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.categorySection}>
                {mealCategoryCatalog.groups.map((group) => (
                  <View key={group.title} style={styles.categoryGroup}>
                    <Text style={styles.categoryGroupTitle}>{group.title}</Text>
                    <View style={styles.categoryList}>
                      {group.items.map((item) => {
                        const active =
                          form.category.trim().toLowerCase() === item.name.trim().toLowerCase();

                        return (
                          <Pressable
                            key={`${group.title}-${item.name}`}
                            onPress={() => {
                              updateField("category", item.name);
                              if (!form.description.trim()) {
                                updateField("description", item.description);
                              }
                              setCategoryPickerVisible(false);
                            }}
                            style={[
                              styles.categoryListItem,
                              active ? styles.categoryListItemActive : null,
                            ]}
                          >
                            <View style={styles.categoryListItemText}>
                              <Text
                                style={[
                                  styles.categoryListItemTitle,
                                  active ? styles.categoryListItemTitleActive : null,
                                ]}
                              >
                                {item.name}
                              </Text>
                              {item.description ? (
                                <Text
                                  style={[
                                    styles.categoryListItemBody,
                                    active ? styles.categoryListItemBodyActive : null,
                                  ]}
                                >
                                  {item.description}
                                </Text>
                              ) : null}
                            </View>
                            {active ? (
                              <Ionicons color={COLORS.text} name="checkmark-circle" size={18} />
                            ) : null}
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  tabButton: {
    alignItems: "center",
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 999,
    flex: 1,
    minHeight: 42,
    justifyContent: "center",
    paddingHorizontal: SPACING.sm,
  },
  tabButtonActive: {
    backgroundColor: COLORS.accent,
  },
  tabButtonText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: "700",
  },
  tabButtonTextActive: {
    color: COLORS.text,
  },
  formContainer: {
    gap: SPACING.md,
    paddingBottom: SPACING.md,
  },
  listContainer: {
    gap: SPACING.md,
    paddingBottom: SPACING.md,
  },
  summaryCard: {
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  summaryTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "800",
  },
  summaryBody: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  summaryButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: COLORS.accent,
    borderRadius: 999,
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: SPACING.md,
  },
  summaryButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
  },
  loadingCard: {
    alignItems: "center",
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.md,
    justifyContent: "center",
    minHeight: 180,
  },
  emptyState: {
    alignItems: "center",
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
    justifyContent: "center",
    minHeight: 200,
    paddingHorizontal: SPACING.lg,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "800",
  },
  emptyBody: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  listingCard: {
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  listingHeader: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  listingImage: {
    borderRadius: RADIUS.sm,
    height: 84,
    width: 84,
  },
  listingImageFallback: {
    alignItems: "center",
    backgroundColor: COLORS.darkCard,
    borderRadius: RADIUS.sm,
    height: 84,
    justifyContent: "center",
    width: 84,
  },
  listingHeaderText: {
    flex: 1,
    gap: 4,
    justifyContent: "center",
  },
  listingTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 24,
  },
  listingMeta: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  listingLocationRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  listingLocationText: {
    color: COLORS.text,
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  coordinatesText: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  listingActions: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  listingActionPrimary: {
    alignItems: "center",
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.md,
    flex: 1,
    minHeight: 46,
    justifyContent: "center",
  },
  listingActionPrimaryText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "800",
  },
  listingActionSecondary: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    flex: 1,
    minHeight: 46,
    justifyContent: "center",
  },
  listingActionSecondaryText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "700",
  },
  editBanner: {
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  editBannerText: {
    gap: 4,
  },
  editBannerTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "800",
  },
  editBannerBody: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  editBannerButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: SPACING.md,
  },
  editBannerButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
  },
  uploadCard: {
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.lg,
    minHeight: 210,
    overflow: "hidden",
  },
  uploadPlaceholder: {
    alignItems: "center",
    gap: SPACING.xs,
    justifyContent: "center",
    minHeight: 210,
    paddingHorizontal: SPACING.lg,
  },
  uploadTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "700",
  },
  uploadBody: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  previewImage: {
    height: 210,
    width: "100%",
  },
  input: {
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.md,
    color: COLORS.text,
    fontSize: 16,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
  },
  selectInput: {
    alignItems: "center",
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.md,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 52,
    paddingHorizontal: SPACING.md,
  },
  selectInputText: {
    flex: 1,
    gap: 4,
    paddingRight: SPACING.sm,
  },
  selectInputPlaceholder: {
    color: COLORS.textMuted,
    fontSize: 16,
  },
  selectInputValue: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "600",
  },
  selectInputMeta: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  categorySection: {
    gap: SPACING.sm,
  },
  categoryGroup: {
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  categoryGroupTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
  },
  categoryList: {
    gap: SPACING.xs,
  },
  categoryListItem: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    flexDirection: "row",
    gap: SPACING.sm,
    justifyContent: "space-between",
    padding: SPACING.md,
  },
  categoryListItemActive: {
    backgroundColor: COLORS.accent,
  },
  categoryListItemText: {
    flex: 1,
    gap: 4,
  },
  categoryListItemTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
  },
  categoryListItemTitleActive: {
    color: COLORS.text,
  },
  categoryListItemBody: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  categoryListItemBodyActive: {
    color: "#3F4A17",
  },
  modalBackdrop: {
    backgroundColor: "rgba(23, 25, 31, 0.32)",
    flex: 1,
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    maxHeight: "78%",
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  modalHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "800",
  },
  modalBody: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 4,
  },
  modalCloseButton: {
    alignItems: "center",
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  row: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  halfInput: {
    flex: 1,
  },
  mapSection: {
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.md,
    gap: SPACING.md,
    padding: SPACING.md,
  },
  mapHeader: {
    gap: SPACING.sm,
  },
  mapHeaderText: {
    gap: 4,
  },
  mapTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "800",
  },
  mapBody: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  mapButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: COLORS.accent,
    borderRadius: 999,
    flexDirection: "row",
    gap: SPACING.xs,
    minHeight: 40,
    paddingHorizontal: SPACING.md,
  },
  mapButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
  },
  mapFooter: {
    gap: SPACING.sm,
  },
  mapMeta: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  extrasSection: {
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.md,
    gap: SPACING.md,
    padding: SPACING.md,
  },
  extrasHeader: {
    gap: SPACING.sm,
  },
  extrasHeaderText: {
    gap: 4,
  },
  extrasTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "800",
  },
  extrasBody: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  extrasActions: {
    flexDirection: "row",
    gap: SPACING.sm,
    flexWrap: "wrap",
  },
  extraActionButton: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: SPACING.md,
  },
  extraActionButtonText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "800",
  },
  extrasEmptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  extraRow: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
    padding: SPACING.sm,
  },
  extraRowHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  extraInputsRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: SPACING.sm,
  },
  extraKindBadge: {
    borderRadius: 999,
    minWidth: 64,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  sideBadge: {
    backgroundColor: "#E8EFD2",
  },
  drinkBadge: {
    backgroundColor: "#D9ECF9",
  },
  extraKindBadgeText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    textTransform: "capitalize",
  },
  extraNameInput: {
    flex: 1,
    backgroundColor: COLORS.surfaceMuted,
  },
  extraPriceInput: {
    backgroundColor: COLORS.surfaceMuted,
    minWidth: 96,
    width: 96,
  },
  extraRemoveButton: {
    alignItems: "center",
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  extrasSummary: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    gap: 4,
    padding: SPACING.sm,
  },
  extrasSummaryText: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  message: {
    color: COLORS.danger,
    fontSize: 14,
    lineHeight: 20,
  },
  formActions: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  button: {
    alignItems: "center",
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.md,
    flex: 1,
    flexDirection: "row",
    gap: SPACING.xs,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: SPACING.md,
  },
  buttonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
  },
  secondaryButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: SPACING.md,
  },
  secondaryButtonWide: {
    alignItems: "center",
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.md,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: SPACING.md,
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
