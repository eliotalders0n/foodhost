import type { Timestamp } from "firebase/firestore";

export type AccountType = "seller" | "buyer";

export type UserProfile = {
  accountType: AccountType;
  createdAt?: Timestamp | null;
  displayName: string;
  district: string;
  email: string;
  province: string;
  uid: string;
  updatedAt?: Timestamp | null;
};

export type ListingStatus = "active" | "paused";

export type ListingCoordinates = {
  latitude: number;
  longitude: number;
};

export type ListingAddOnKind = "side" | "drink";

export type ListingAddOn = {
  id: string;
  kind: ListingAddOnKind;
  label: string;
  price: number;
};

export type MarketplaceListing = {
  addOns?: ListingAddOn[] | null;
  category: string;
  coordinates?: ListingCoordinates | null;
  createdAt?: Timestamp | null;
  description: string;
  id: string;
  imagePath: string | null;
  imageUrl: string | null;
  locationSummary: string;
  pickupPoint?: string | null;
  price: number;
  quantity: number;
  sellerId: string;
  sellerName: string;
  status: ListingStatus;
  title: string;
  updatedAt?: Timestamp | null;
};

export type InquiryStatus = "pending" | "accepted" | "declined" | "cancelled";

export type InquiryPaymentStatus =
  | "not-started"
  | "awaiting-authorization"
  | "processing"
  | "completed"
  | "failed";

export type MarketplaceInquiry = {
  buyerEmail: string;
  buyerId: string;
  buyerName: string;
  createdAt?: Timestamp | null;
  id: string;
  listingId: string;
  listingAddOnsTotal?: number;
  listingImageUrl: string | null;
  listingPrice: number;
  listingTitle: string;
  message: string;
  participants: string[];
  paymentFailureReason: string | null;
  paymentMessage: string | null;
  paymentReference: string | null;
  paymentStatus: InquiryPaymentStatus;
  paymentTransactionId: string | null;
  requestedQuantity: number;
  selectedAddOns?: ListingAddOn[] | null;
  sellerId: string;
  sellerName: string;
  status: InquiryStatus;
  totalPrice: number;
  unitPrice?: number;
  updatedAt?: Timestamp | null;
};
