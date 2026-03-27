import { getFunctions, httpsCallable } from "firebase/functions";

import { firebaseApp } from "./firebase";

const functions = firebaseApp ? getFunctions(firebaseApp, "us-central1") : null;

function ensureFunctions() {
  if (!functions) {
    throw new Error("Firebase Functions is not configured.");
  }

  return functions;
}

type ChargeInquiryMobileMoneyInput = {
  inquiryId: string;
  operator: string;
  phone: string;
};

type ChargeInquiryMobileMoneyResult = {
  failureReason: string | null;
  message: string;
  reference: string;
  status: string;
  success: boolean;
  transactionId: string;
};

type CheckInquiryPaymentStatusInput = {
  inquiryId: string;
  reference?: string;
  transactionId?: string;
};

type CheckInquiryPaymentStatusResult = {
  failureReason: string | null;
  message: string;
  reference: string;
  status: string;
  success: boolean;
  transactionId: string;
};

export async function chargeInquiryMobileMoney(
  input: ChargeInquiryMobileMoneyInput
) {
  const call = httpsCallable<
    ChargeInquiryMobileMoneyInput,
    ChargeInquiryMobileMoneyResult
  >(ensureFunctions(), "chargeInquiryMobileMoney");

  const result = await call(input);
  return result.data;
}

export async function checkInquiryPaymentStatus(
  input: CheckInquiryPaymentStatusInput
) {
  const call = httpsCallable<
    CheckInquiryPaymentStatusInput,
    CheckInquiryPaymentStatusResult
  >(ensureFunctions(), "checkInquiryPaymentStatus");

  const result = await call(input);
  return result.data;
}
