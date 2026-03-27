import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";

import { firebaseApp } from "./firebase";
import { normalizeListingAddOns, sumListingAddOns } from "./listingOptions";
import type {
  ListingAddOn,
  ListingCoordinates,
  MarketplaceInquiry,
  MarketplaceListing,
  UserProfile,
} from "../types/domain";

const db = firebaseApp ? getFirestore(firebaseApp) : null;

function ensureDb() {
  if (!db) {
    throw new Error("Firestore is not configured.");
  }

  return db;
}

function sortByCreatedAt<T extends { createdAt?: { toMillis?: () => number } | null }>(
  items: T[]
) {
  return [...items].sort((left, right) => {
    const leftTime = left.createdAt?.toMillis?.() ?? 0;
    const rightTime = right.createdAt?.toMillis?.() ?? 0;
    return rightTime - leftTime;
  });
}

type CreateListingInput = {
  addOns: ListingAddOn[];
  category: string;
  coordinates: ListingCoordinates;
  description: string;
  imagePath: string | null;
  imageUrl: string | null;
  locationSummary: string;
  pickupPoint: string;
  price: number;
  quantity: number;
  sellerId: string;
  sellerName: string;
  title: string;
};

type UpdateListingInput = CreateListingInput & {
  listingId: string;
  status: MarketplaceListing["status"];
};

function toListingCoordinates(value: unknown): ListingCoordinates | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const latitude = Number((value as { latitude?: unknown }).latitude);
  const longitude = Number((value as { longitude?: unknown }).longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return { latitude, longitude };
}

function toMarketplaceListing(id: string, value: unknown): MarketplaceListing {
  const data = (value ?? {}) as Partial<MarketplaceListing>;

  return {
    addOns: normalizeListingAddOns(data.addOns),
    category: data.category ?? "",
    coordinates: toListingCoordinates(data.coordinates),
    createdAt: data.createdAt ?? null,
    description: data.description ?? "",
    id,
    imagePath: data.imagePath ?? null,
    imageUrl: data.imageUrl ?? null,
    locationSummary: data.locationSummary ?? "",
    pickupPoint: data.pickupPoint ?? data.locationSummary ?? "",
    price: typeof data.price === "number" ? data.price : Number(data.price ?? 0),
    quantity:
      typeof data.quantity === "number" ? data.quantity : Number(data.quantity ?? 0),
    sellerId: data.sellerId ?? "",
    sellerName: data.sellerName ?? "",
    status: data.status === "paused" ? "paused" : "active",
    title: data.title ?? "",
    updatedAt: data.updatedAt ?? null,
  };
}

export function subscribeToUserProfile(
  uid: string,
  onValue: (profile: UserProfile | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!db) {
    onValue(null);
    return () => undefined;
  }

  return onSnapshot(
    doc(db, "profiles", uid),
    (snapshot) => {
      onValue(snapshot.exists() ? (snapshot.data() as UserProfile) : null);
    },
    (error) => onError?.(error as Error)
  );
}

export async function upsertUserProfile(
  uid: string,
  email: string,
  profile: Pick<UserProfile, "accountType" | "displayName" | "district" | "province">
) {
  const firestore = ensureDb();
  const profileRef = doc(firestore, "profiles", uid);
  const existing = await getDoc(profileRef);

  await setDoc(
    profileRef,
    {
      ...profile,
      email,
      uid,
      updatedAt: serverTimestamp(),
      ...(existing.exists() ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true }
  );
}

export async function createListing(
  listing: CreateListingInput
) {
  const firestore = ensureDb();
  const timestamp = serverTimestamp();

  return addDoc(collection(firestore, "listings"), {
    ...listing,
    createdAt: timestamp,
    status: "active",
    updatedAt: timestamp,
  });
}

export async function updateListing(listing: UpdateListingInput) {
  const firestore = ensureDb();
  const listingRef = doc(firestore, "listings", listing.listingId);
  const existingSnapshot = await getDoc(listingRef);

  if (!existingSnapshot.exists()) {
    throw new Error("This listing no longer exists.");
  }

  const existingListing = toMarketplaceListing(existingSnapshot.id, existingSnapshot.data());

  if (existingListing.sellerId !== listing.sellerId) {
    throw new Error("Only the seller can update this listing.");
  }

  await updateDoc(listingRef, {
    addOns: listing.addOns,
    category: listing.category,
    coordinates: listing.coordinates,
    description: listing.description,
    imagePath: listing.imagePath,
    imageUrl: listing.imageUrl,
    locationSummary: listing.locationSummary,
    pickupPoint: listing.pickupPoint,
    price: listing.price,
    quantity: listing.quantity,
    sellerName: listing.sellerName,
    status: listing.status,
    title: listing.title,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteListing(input: { listingId: string; sellerId: string }) {
  const firestore = ensureDb();
  const listingRef = doc(firestore, "listings", input.listingId);
  const existingSnapshot = await getDoc(listingRef);

  if (!existingSnapshot.exists()) {
    throw new Error("This listing no longer exists.");
  }

  const existingListing = toMarketplaceListing(existingSnapshot.id, existingSnapshot.data());

  if (existingListing.sellerId !== input.sellerId) {
    throw new Error("Only the seller can remove this listing.");
  }

  await deleteDoc(listingRef);

  return existingListing;
}

export function subscribeToRecentListings(
  onValue: (listings: MarketplaceListing[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!db) {
    onValue([]);
    return () => undefined;
  }

  return onSnapshot(
    query(collection(db, "listings"), orderBy("createdAt", "desc"), limit(30)),
    (snapshot) => {
      const listings = snapshot.docs
        .map((item) => toMarketplaceListing(item.id, item.data()))
        .filter((item) => item.status === "active" && item.quantity > 0);

      onValue(listings);
    },
    (error) => onError?.(error as Error)
  );
}

export function subscribeToSellerListings(
  sellerId: string,
  onValue: (listings: MarketplaceListing[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!db) {
    onValue([]);
    return () => undefined;
  }

  return onSnapshot(
    query(collection(db, "listings"), where("sellerId", "==", sellerId)),
    (snapshot) => {
      const listings = snapshot.docs.map((item) => toMarketplaceListing(item.id, item.data()));

      onValue(sortByCreatedAt(listings));
    },
    (error) => onError?.(error as Error)
  );
}

export function subscribeToListing(
  listingId: string,
  onValue: (listing: MarketplaceListing | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!db) {
    onValue(null);
    return () => undefined;
  }

  return onSnapshot(
    doc(db, "listings", listingId),
    (snapshot) => {
      if (!snapshot.exists()) {
        onValue(null);
        return;
      }

      onValue({
        ...toMarketplaceListing(snapshot.id, snapshot.data()),
      });
    },
    (error) => onError?.(error as Error)
  );
}

export async function createInquiry(input: {
  buyerEmail: string;
  buyerId: string;
  buyerName: string;
  listingId: string;
  message: string;
  requestedQuantity: number;
  selectedAddOnIds: string[];
}) {
  const firestore = ensureDb();
  const listingRef = doc(firestore, "listings", input.listingId);
  const listingSnapshot = await getDoc(listingRef);

  if (!listingSnapshot.exists()) {
    throw new Error("This listing no longer exists.");
  }

  const listing = toMarketplaceListing(listingSnapshot.id, listingSnapshot.data());

  if (listing.sellerId === input.buyerId) {
    throw new Error("You cannot send an inquiry on your own listing.");
  }

  if (listing.status !== "active" || listing.quantity <= 0) {
    throw new Error("This listing is no longer available.");
  }

  if (input.requestedQuantity > listing.quantity) {
    throw new Error("Requested quantity exceeds the available stock.");
  }

  const listingAddOns = normalizeListingAddOns(listing.addOns);
  const requestedIds = new Set(input.selectedAddOnIds);
  const selectedAddOns = listingAddOns.filter((item) => requestedIds.has(item.id));
  const addOnsTotal = sumListingAddOns(selectedAddOns);
  const unitPrice = listing.price + addOnsTotal;
  const timestamp = serverTimestamp();

  return addDoc(collection(firestore, "inquiries"), {
    buyerEmail: input.buyerEmail,
    buyerId: input.buyerId,
    buyerName: input.buyerName,
    createdAt: timestamp,
    listingId: listing.id,
    listingAddOnsTotal: addOnsTotal,
    listingImageUrl: listing.imageUrl,
    listingPrice: listing.price,
    listingTitle: listing.title,
    message: input.message.trim(),
    participants: [input.buyerId, listing.sellerId],
    paymentFailureReason: null,
    paymentMessage: null,
    paymentReference: null,
    paymentStatus: "not-started",
    paymentTransactionId: null,
    requestedQuantity: input.requestedQuantity,
    selectedAddOns,
    sellerId: listing.sellerId,
    sellerName: listing.sellerName,
    status: "pending",
    totalPrice: unitPrice * input.requestedQuantity,
    unitPrice,
    updatedAt: timestamp,
  });
}

export function subscribeToUserInquiries(
  userId: string,
  onValue: (inquiries: MarketplaceInquiry[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!db) {
    onValue([]);
    return () => undefined;
  }

  return onSnapshot(
    query(collection(db, "inquiries"), where("participants", "array-contains", userId)),
    (snapshot) => {
      const inquiries = snapshot.docs.map(
        (item) =>
          ({
            id: item.id,
            ...item.data(),
          }) as MarketplaceInquiry
      );

      onValue(sortByCreatedAt(inquiries));
    },
    (error) => onError?.(error as Error)
  );
}

export async function updateInquiryStatus(input: {
  inquiryId: string;
  sellerId: string;
  status: "accepted" | "declined";
}) {
  const firestore = ensureDb();
  const inquiryRef = doc(firestore, "inquiries", input.inquiryId);

  await runTransaction(firestore, async (transaction) => {
    const inquirySnapshot = await transaction.get(inquiryRef);

    if (!inquirySnapshot.exists()) {
      throw new Error("This inquiry no longer exists.");
    }

    const inquiry = {
      id: inquirySnapshot.id,
      ...inquirySnapshot.data(),
    } as MarketplaceInquiry;

    if (inquiry.sellerId !== input.sellerId) {
      throw new Error("Only the seller can update this inquiry.");
    }

    if (inquiry.status !== "pending") {
      throw new Error("Only pending inquiries can be updated.");
    }

    if (input.status === "accepted") {
      const listingRef = doc(firestore, "listings", inquiry.listingId);
      const listingSnapshot = await transaction.get(listingRef);

      if (!listingSnapshot.exists()) {
        throw new Error("The linked listing no longer exists.");
      }

      const listing = toMarketplaceListing(listingSnapshot.id, listingSnapshot.data());

      if (listing.status !== "active" || listing.quantity <= 0) {
        throw new Error("This listing is no longer available.");
      }

      if (inquiry.requestedQuantity > listing.quantity) {
        throw new Error("Available stock changed before this inquiry was accepted.");
      }

      const nextQuantity = listing.quantity - inquiry.requestedQuantity;

      transaction.update(listingRef, {
        quantity: nextQuantity,
        status: nextQuantity > 0 ? listing.status : "paused",
        updatedAt: serverTimestamp(),
      });
    }

    transaction.update(inquiryRef, {
      status: input.status,
      updatedAt: serverTimestamp(),
    });
  });
}
