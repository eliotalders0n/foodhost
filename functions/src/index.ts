import {initializeApp} from "firebase-admin/app";
import {FieldValue, getFirestore} from "firebase-admin/firestore";
import {defineSecret} from "firebase-functions/params";
import * as logger from "firebase-functions/logger";
import {
  onDocumentCreated,
  onDocumentUpdated,
} from "firebase-functions/v2/firestore";
import {HttpsError, onCall, onRequest} from "firebase-functions/v2/https";
import {setGlobalOptions} from "firebase-functions/v2/options";
import {createHash, createHmac} from "node:crypto";

initializeApp();

const db = getFirestore();
const lencoSecretKey = defineSecret("LENCO_SECRET_KEY");
const LENCO_API_BASE = "https://api.lenco.co/access/v2";
const DEFAULT_CURRENCY = "ZMW";

setGlobalOptions({
  maxInstances: 10,
  region: "us-central1",
});

type MobileMoneyOperator = "mtn" | "airtel" | "zamtel";

type InquiryPayload = {
  buyerEmail?: string;
  buyerId?: string;
  buyerName?: string;
  listingId?: string;
  listingTitle?: string;
  paymentFailureReason?: string | null;
  paymentMessage?: string | null;
  paymentReference?: string | null;
  paymentStatus?: string | null;
  paymentTransactionId?: string | null;
  requestedQuantity?: number;
  sellerId?: string;
  sellerName?: string;
  status?: string;
  totalPrice?: number;
};

type ListingPayload = {
  quantity?: number;
  status?: string;
};

type LencoCollectionStatus =
  | "not-started"
  | "awaiting-authorization"
  | "processing"
  | "completed"
  | "failed";

type ChargeInquiryMobileMoneyData = {
  inquiryId?: string;
  operator?: string;
  phone?: string;
};

type CheckInquiryPaymentStatusData = {
  inquiryId?: string;
  reference?: string;
  transactionId?: string;
};

type LencoCollectionPayload = {
  amount?: string;
  completedAt?: string | null;
  currency?: string;
  failureReason?: string | null;
  id?: string;
  lencoReference?: string | null;
  mobileMoneyDetails?: {
    operator?: string | null;
    phone?: string | null;
  } | null;
  reasonForFailure?: string | null;
  reference?: string | null;
  status?: string | null;
};

type WebhookEventPayload = {
  data?: {
    amount?: string;
    clientReference?: string | null;
    completedAt?: string | null;
    id?: string;
    reasonForFailure?: string | null;
    reference?: string | null;
    status?: string | null;
    transactionReference?: string | null;
  };
  event?: string;
};

/**
 * Creates a notification document for a single user.
 * @param {object} input Notification payload.
 */
async function createNotification(input: {
  body: string;
  inquiryId?: string;
  listingId?: string;
  title: string;
  type: "inquiry_created" | "inquiry_status_changed";
  userId: string;
}) {
  await db.collection("notifications").add({
    body: input.body,
    createdAt: FieldValue.serverTimestamp(),
    inquiryId: input.inquiryId ?? null,
    listingId: input.listingId ?? null,
    read: false,
    title: input.title,
    type: input.type,
    userId: input.userId,
  });
}

/**
 * Strips a phone number down to digits only.
 * @param {string} value Raw phone number input.
 * @return {string} Sanitized phone digits.
 */
function sanitizePhoneNumber(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Converts Zambian phone numbers to the 260-prefixed format required by Lenco.
 * @param {string} phone User-provided mobile money number.
 * @return {string} Formatted international phone number.
 */
function formatPhoneNumber(phone: string): string {
  const digits = sanitizePhoneNumber(phone);

  if (digits.length === 9) {
    return `260${digits}`;
  }

  if (digits.length === 10 && digits.startsWith("0")) {
    return `260${digits.slice(1)}`;
  }

  if (digits.length === 12 && digits.startsWith("260")) {
    return digits;
  }

  throw new HttpsError(
    "invalid-argument",
    "Enter a valid Zambian mobile money number."
  );
}

/**
 * Maps UI operator labels to the values expected by Lenco.
 * @param {string} value Operator label from the client.
 * @return {MobileMoneyOperator} Normalized operator code.
 */
function mapOperator(value: string): MobileMoneyOperator {
  const operator = value.trim().toLowerCase();

  if (["mtn", "mtn zm", "momo"].includes(operator)) {
    return "mtn";
  }

  if (["airtel", "airtel zm", "airtel money"].includes(operator)) {
    return "airtel";
  }

  if (["zamtel"].includes(operator)) {
    return "zamtel";
  }

  throw new HttpsError(
    "invalid-argument",
    "Select a supported mobile money operator."
  );
}

/**
 * Normalizes Lenco collection states into marketplace payment states.
 * @param {unknown} status Raw status from Lenco.
 * @return {LencoCollectionStatus} Marketplace payment status.
 */
function mapCollectionStatus(status: unknown): LencoCollectionStatus {
  const normalizedStatus = String(status ?? "").trim().toLowerCase();

  if (["successful", "completed", "success"].includes(normalizedStatus)) {
    return "completed";
  }

  if (["failed", "declined", "cancelled"].includes(normalizedStatus)) {
    return "failed";
  }

  if (normalizedStatus === "pay-offline") {
    return "awaiting-authorization";
  }

  if (normalizedStatus === "processing") {
    return "processing";
  }

  return "processing";
}

/**
 * Builds a client-facing message from a normalized payment status.
 * @param {LencoCollectionStatus} status Normalized payment status.
 * @return {string} Human-readable status message.
 */
function getMessageForStatus(status: LencoCollectionStatus): string {
  if (status === "completed") {
    return "Payment completed successfully.";
  }

  if (status === "failed") {
    return "Payment failed.";
  }

  if (status === "awaiting-authorization") {
    return "Approve the mobile money prompt on your phone.";
  }

  if (status === "processing") {
    return "Payment is processing. Refresh in a moment if needed.";
  }

  return "Payment has not started.";
}

/**
 * Extracts a human-readable failure reason when Lenco provides one.
 * @param {LencoCollectionPayload} payload Lenco response payload.
 * @return {string | null} Failure reason, when available.
 */
function getFailureReason(payload: LencoCollectionPayload): string | null {
  if (
    typeof payload.reasonForFailure === "string" &&
    payload.reasonForFailure.length > 0
  ) {
    return payload.reasonForFailure;
  }

  if (
    typeof payload.failureReason === "string" &&
    payload.failureReason.length > 0
  ) {
    return payload.failureReason;
  }

  return null;
}

/**
 * Generates a unique external reference for an inquiry payment.
 * @param {string} inquiryId Inquiry document id.
 * @return {string} External payment reference.
 */
function generateReference(inquiryId: string): string {
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  return `appetite_${inquiryId}_${Date.now()}_${randomSuffix}`;
}

/**
 * Performs an authenticated request against the Lenco API.
 * @param {string} path Relative API path.
 * @param {RequestInit} init Fetch options.
 * @param {string} secret Lenco secret key from Firebase Secrets.
 * @return {Promise<Record<string, unknown>>} Parsed response payload.
 */
async function lencoRequest(
  path: string,
  init: RequestInit,
  secret: string
): Promise<Record<string, unknown>> {
  const response = await fetch(`${LENCO_API_BASE}${path}`, {
    ...init,
    headers: {
      "Authorization": `Bearer ${secret}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  const parsedResponse = await response.json().catch(() => ({}));
  const responseData = parsedResponse as Record<string, unknown>;

  if (!response.ok) {
    logger.error("Lenco API request failed", {
      path,
      responseData,
      status: response.status,
    });

    const message =
      typeof responseData.message === "string" ?
        responseData.message :
        "Lenco request failed.";

    throw new HttpsError("internal", message);
  }

  if (responseData.status === false) {
    logger.error("Lenco API returned an application error.", {
      path,
      responseData,
      status: response.status,
    });

    const hasMessage =
      typeof responseData.message === "string" &&
      responseData.message.length > 0;
    const message = hasMessage ?
      responseData.message as string :
      "Lenco rejected the request.";

    throw new HttpsError("failed-precondition", message);
  }

  return responseData;
}

/**
 * Writes marketplace payment state to both the transaction doc and inquiry doc.
 * @param {object} input Payment sync input.
 * @return {Promise<void>} Completion promise.
 */
async function syncPaymentState(input: {
  amount: number | null;
  buyerId: string | null;
  completedAt: string | null;
  currency: string;
  failureReason: string | null;
  inquiryId: string;
  lencoReference: string | null;
  message: string;
  operator: string | null;
  phone: string | null;
  reference: string;
  sellerId: string | null;
  status: LencoCollectionStatus;
  transactionId: string;
}) {
  const paymentRef = db
    .collection("momo_transactions")
    .doc(input.transactionId);
  const inquiryRef = db.collection("inquiries").doc(input.inquiryId);
  const paymentSnapshot = await paymentRef.get();

  await paymentRef.set(
    {
      amount: input.amount,
      buyerId: input.buyerId,
      completedAt: input.completedAt,
      createdAt:
        paymentSnapshot.exists ?
          paymentSnapshot.get("createdAt") ?? null :
          FieldValue.serverTimestamp(),
      currency: input.currency,
      failureReason: input.failureReason,
      inquiryId: input.inquiryId,
      lencoReference: input.lencoReference,
      message: input.message,
      operator: input.operator,
      phone: input.phone,
      reference: input.reference,
      sellerId: input.sellerId,
      status: input.status,
      transactionId: input.transactionId,
      updatedAt: FieldValue.serverTimestamp(),
    },
    {merge: true}
  );

  await inquiryRef.set(
    {
      paymentFailureReason: input.failureReason,
      paymentMessage: input.message,
      paymentReference: input.reference,
      paymentStatus: input.status,
      paymentTransactionId: input.transactionId,
      updatedAt: FieldValue.serverTimestamp(),
    },
    {merge: true}
  );
}

/**
 * Loads and validates an inquiry for payment actions.
 * @param {string} inquiryId Inquiry document id.
 * @return {Promise<{id: string, data: InquiryPayload}>} Inquiry payload.
 */
async function getInquiryForPayment(inquiryId: string) {
  const inquiryRef = db.collection("inquiries").doc(inquiryId);
  const inquirySnapshot = await inquiryRef.get();

  if (!inquirySnapshot.exists) {
    throw new HttpsError("not-found", "Inquiry not found.");
  }

  return {
    data: inquirySnapshot.data() as InquiryPayload,
    id: inquirySnapshot.id,
  };
}

/**
 * Resolves the best available external payment reference from a webhook event.
 * @param {WebhookEventPayload} event Parsed webhook body.
 * @return {string | null} Payment reference when available.
 */
function getWebhookReference(event: WebhookEventPayload): string | null {
  const data = event.data;

  if (!data) {
    return null;
  }

  return (
    data.clientReference ??
    data.reference ??
    data.transactionReference ??
    null
  );
}

export const onInquiryCreated = onDocumentCreated(
  "inquiries/{inquiryId}",
  async (event) => {
    const snapshot = event.data;

    if (!snapshot) {
      logger.warn("Inquiry create trigger fired without snapshot data.", {
        inquiryId: event.params.inquiryId,
      });
      return;
    }

    const inquiry = snapshot.data() as InquiryPayload;

    if (!inquiry.sellerId || !inquiry.buyerName || !inquiry.listingTitle) {
      logger.warn("Inquiry payload missing seller notification fields.", {
        inquiryId: snapshot.id,
      });
      return;
    }

    await createNotification({
      body: `${inquiry.buyerName} requested ${
        inquiry.requestedQuantity ?? 0
      } for ${inquiry.listingTitle}.`,
      inquiryId: snapshot.id,
      listingId: inquiry.listingId,
      title: "New inquiry received",
      type: "inquiry_created",
      userId: inquiry.sellerId,
    });

    logger.info("Seller notification created for inquiry.", {
      inquiryId: snapshot.id,
      sellerId: inquiry.sellerId,
    });
  }
);

export const onInquiryStatusChanged = onDocumentUpdated(
  "inquiries/{inquiryId}",
  async (event) => {
    const before = event.data?.before.data() as InquiryPayload | undefined;
    const after = event.data?.after.data() as InquiryPayload | undefined;

    if (!before || !after || before.status === after.status) {
      return;
    }

    if (
      !after.buyerId ||
      !after.sellerName ||
      !after.listingTitle ||
      !after.status
    ) {
      logger.warn("Inquiry status payload missing buyer notification fields.", {
        inquiryId: event.params.inquiryId,
      });
      return;
    }

    await createNotification({
      body: `${after.sellerName} marked ${after.listingTitle} as ${
        after.status
      }.`,
      inquiryId: event.params.inquiryId,
      listingId: after.listingId,
      title: "Inquiry updated",
      type: "inquiry_status_changed",
      userId: after.buyerId,
    });

    logger.info("Buyer notification created for inquiry status change.", {
      inquiryId: event.params.inquiryId,
      buyerId: after.buyerId,
      status: after.status,
    });
  }
);

export const chargeInquiryMobileMoney = onCall(
  {
    cors: true,
    invoker: "public",
    secrets: [lencoSecretKey],
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "You must be signed in.");
    }

    const data = (request.data || {}) as ChargeInquiryMobileMoneyData;

    if (!data.inquiryId || !data.phone || !data.operator) {
      throw new HttpsError(
        "invalid-argument",
        "Inquiry, phone number, and operator are required."
      );
    }

    const inquiry = await getInquiryForPayment(data.inquiryId);

    if (inquiry.data.buyerId !== request.auth.uid) {
      throw new HttpsError(
        "permission-denied",
        "Only the buyer can start payment for this inquiry."
      );
    }

    if (inquiry.data.status !== "accepted") {
      throw new HttpsError(
        "failed-precondition",
        "The seller must accept the inquiry before payment."
      );
    }

    if (
      typeof inquiry.data.totalPrice !== "number" ||
      !Number.isFinite(inquiry.data.totalPrice) ||
      inquiry.data.totalPrice <= 0
    ) {
      throw new HttpsError(
        "failed-precondition",
        "This inquiry does not have a valid payable total."
      );
    }

    const phone = formatPhoneNumber(data.phone);
    const operator = mapOperator(data.operator);
    const reference = generateReference(inquiry.id);

    const responseData = await lencoRequest(
      "/collections/mobile-money",
      {
        body: JSON.stringify({
          amount: inquiry.data.totalPrice.toFixed(2),
          currency: DEFAULT_CURRENCY,
          operator,
          phone,
          reference,
        }),
        method: "POST",
      },
      lencoSecretKey.value()
    );

    const collection = (responseData.data || {}) as LencoCollectionPayload;
    const status = mapCollectionStatus(collection.status);
    const transactionId =
      typeof collection.id === "string" && collection.id.length > 0 ?
        collection.id :
        reference;
    const failureReason = getFailureReason(collection);
    const message = getMessageForStatus(status);

    await syncPaymentState({
      amount: inquiry.data.totalPrice,
      buyerId: inquiry.data.buyerId ?? request.auth.uid,
      completedAt: collection.completedAt ?? null,
      currency: collection.currency ?? DEFAULT_CURRENCY,
      failureReason,
      inquiryId: inquiry.id,
      lencoReference: collection.lencoReference ?? null,
      message,
      operator,
      phone,
      reference,
      sellerId: inquiry.data.sellerId ?? null,
      status,
      transactionId,
    });

    return {
      failureReason,
      message,
      reference,
      status,
      success: status === "completed",
      transactionId,
    };
  }
);

export const checkInquiryPaymentStatus = onCall(
  {
    cors: true,
    invoker: "public",
    secrets: [lencoSecretKey],
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "You must be signed in.");
    }

    const data = (request.data || {}) as CheckInquiryPaymentStatusData;

    if (!data.inquiryId) {
      throw new HttpsError("invalid-argument", "Inquiry id is required.");
    }

    const inquiry = await getInquiryForPayment(data.inquiryId);

    if (
      inquiry.data.buyerId !== request.auth.uid &&
      inquiry.data.sellerId !== request.auth.uid
    ) {
      throw new HttpsError(
        "permission-denied",
        "Only participants can check this payment."
      );
    }

    const reference =
      data.reference ??
      inquiry.data.paymentReference ??
      null;

    if (!reference) {
      throw new HttpsError(
        "failed-precondition",
        "There is no active payment reference for this inquiry."
      );
    }

    const responseData = await lencoRequest(
      `/collections/status/${reference}`,
      {method: "GET"},
      lencoSecretKey.value()
    );

    const collection = (responseData.data || {}) as LencoCollectionPayload;
    const status = mapCollectionStatus(collection.status);
    const transactionId =
      typeof collection.id === "string" && collection.id.length > 0 ?
        collection.id :
        (data.transactionId ?? inquiry.data.paymentTransactionId ?? reference);
    const failureReason = getFailureReason(collection);
    const message = getMessageForStatus(status);

    await syncPaymentState({
      amount:
        typeof collection.amount === "string" ?
          Number(collection.amount) :
          inquiry.data.totalPrice ?? null,
      buyerId: inquiry.data.buyerId ?? null,
      completedAt: collection.completedAt ?? null,
      currency: collection.currency ?? DEFAULT_CURRENCY,
      failureReason,
      inquiryId: inquiry.id,
      lencoReference: collection.lencoReference ?? null,
      message,
      operator: collection.mobileMoneyDetails?.operator ?? null,
      phone: collection.mobileMoneyDetails?.phone ?? null,
      reference,
      sellerId: inquiry.data.sellerId ?? null,
      status,
      transactionId,
    });

    return {
      failureReason,
      message,
      reference,
      status,
      success: status === "completed",
      transactionId,
    };
  }
);

export const lencoWebhook = onRequest(
  {
    secrets: [lencoSecretKey],
  },
  async (request, response) => {
    if (request.method !== "POST") {
      response.status(405).send("Method Not Allowed");
      return;
    }

    const rawBody =
      Buffer.isBuffer(request.rawBody) ?
        request.rawBody :
        Buffer.from(JSON.stringify(request.body ?? {}));
    const receivedSignature = request.get("x-lenco-signature") ?? "";
    const webhookHashKey = createHash("sha256")
      .update(lencoSecretKey.value())
      .digest("hex");
    const expectedSignature = createHmac("sha512", webhookHashKey)
      .update(rawBody)
      .digest("hex");

    if (!receivedSignature || receivedSignature !== expectedSignature) {
      logger.warn("Rejected Lenco webhook due to invalid signature.");
      response.status(401).send("Invalid signature");
      return;
    }

    const event = (request.body || {}) as WebhookEventPayload;
    const reference = getWebhookReference(event);

    if (!reference) {
      response.status(202).send("No usable reference");
      return;
    }

    const paymentQuery = await db
      .collection("momo_transactions")
      .where("reference", "==", reference)
      .limit(1)
      .get();

    if (paymentQuery.empty) {
      logger.warn("Received Lenco webhook for unknown reference.", {reference});
      response.status(202).send("Unknown reference");
      return;
    }

    const paymentDoc = paymentQuery.docs[0];
    const paymentData = paymentDoc.data();
    const status = mapCollectionStatus(event.data?.status);
    const failureReason =
      typeof event.data?.reasonForFailure === "string" ?
        event.data.reasonForFailure :
        null;
    const message = getMessageForStatus(status);

    await syncPaymentState({
      amount:
        typeof event.data?.amount === "string" ?
          Number(event.data.amount) :
          null,
      buyerId:
        typeof paymentData.buyerId === "string" ? paymentData.buyerId : null,
      completedAt:
        typeof event.data?.completedAt === "string" ?
          event.data.completedAt :
          null,
      currency:
        typeof paymentData.currency === "string" ?
          paymentData.currency :
          DEFAULT_CURRENCY,
      failureReason,
      inquiryId:
        typeof paymentData.inquiryId === "string" ? paymentData.inquiryId : "",
      lencoReference:
        typeof paymentData.lencoReference === "string" ?
          paymentData.lencoReference :
          null,
      message,
      operator:
        typeof paymentData.operator === "string" ? paymentData.operator : null,
      phone: typeof paymentData.phone === "string" ? paymentData.phone : null,
      reference,
      sellerId:
        typeof paymentData.sellerId === "string" ? paymentData.sellerId : null,
      status,
      transactionId:
        typeof paymentData.transactionId === "string" ?
          paymentData.transactionId :
          paymentDoc.id,
    });

    response.status(200).send("ok");
  }
);

export const syncListingAvailability = onDocumentUpdated(
  "listings/{listingId}",
  async (event) => {
    const after = event.data?.after;

    if (!after) {
      return;
    }

    const listing = after.data() as ListingPayload;

    if (typeof listing.quantity !== "number") {
      logger.warn("Listing payload missing numeric quantity.", {
        listingId: after.id,
      });
      return;
    }

    if (listing.quantity > 0 || listing.status === "paused") {
      return;
    }

    await after.ref.update({
      status: "paused",
      updatedAt: FieldValue.serverTimestamp(),
    });

    logger.info("Listing auto-paused after stock depletion.", {
      listingId: after.id,
      quantity: listing.quantity,
    });
  }
);
