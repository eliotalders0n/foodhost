import { useEffect, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { ScreenShell } from "../components/ScreenShell";
import {
  chargeInquiryMobileMoney,
  checkInquiryPaymentStatus,
} from "../lib/payments";
import { formatListingAddOns } from "../lib/listingOptions";
import { subscribeToUserInquiries, updateInquiryStatus } from "../lib/firestore";
import { useAuthStore } from "../store/authStore";
import { useToastStore } from "../store/toastStore";
import type { MarketplaceInquiry } from "../types/domain";
import { COLORS, RADIUS, SPACING } from "../theme/tokens";

const MOBILE_MONEY_OPERATORS = [
  { label: "MTN", value: "mtn" },
  { label: "Airtel", value: "airtel" },
  { label: "Zamtel", value: "zamtel" },
] as const;

function formatInquiryTime(inquiry: MarketplaceInquiry) {
  const date = inquiry.createdAt?.toDate?.();
  if (!date) return "Just now";
  return date.toLocaleDateString();
}

function statusTone(status: MarketplaceInquiry["status"]) {
  if (status === "accepted") return COLORS.accentDeep;
  if (status === "declined" || status === "cancelled") return COLORS.textMuted;
  return COLORS.accent;
}

function paymentTone(status: MarketplaceInquiry["paymentStatus"]) {
  if (status === "completed") return COLORS.accentDeep;
  if (status === "failed") return COLORS.danger;
  if (status === "awaiting-authorization") return COLORS.accent;
  return COLORS.textMuted;
}

function paymentLabel(status: MarketplaceInquiry["paymentStatus"]) {
  if (status === "awaiting-authorization") return "Awaiting approval";
  if (status === "not-started") return "Not started";
  return status.replace("-", " ");
}

type InquiryCardProps = {
  inquiry: MarketplaceInquiry;
  isIncoming: boolean;
  onPress: () => void;
};

function InquiryCard({ inquiry, isIncoming, onPress }: InquiryCardProps) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.cardHeader}>
        <Text numberOfLines={1} style={styles.cardTitle}>
          {inquiry.listingTitle}
        </Text>
        <Text style={[styles.cardStatus, { color: statusTone(inquiry.status) }]}>
          {inquiry.status.toUpperCase()}
        </Text>
      </View>
      <Text style={styles.cardMeta}>
        {isIncoming ? inquiry.buyerName : inquiry.sellerName} · Qty {inquiry.requestedQuantity}
      </Text>
      <View style={styles.cardFooter}>
        <Text style={styles.cardPrice}>ZMW {inquiry.totalPrice.toFixed(2)}</Text>
        <Text style={styles.cardTime}>{formatInquiryTime(inquiry)}</Text>
      </View>
    </Pressable>
  );
}

export function InboxScreen() {
  const showToast = useToastStore((state) => state.showToast);
  const user = useAuthStore((state) => state.user);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [inquiries, setInquiries] = useState<MarketplaceInquiry[]>([]);
  const [selectedInquiry, setSelectedInquiry] = useState<MarketplaceInquiry | null>(null);
  const [phone, setPhone] = useState("");
  const [operator, setOperator] = useState("");

  const isIncoming = selectedInquiry?.sellerId === user?.uid;

  useEffect(() => {
    if (!user?.uid) {
      setInquiries([]);
      return;
    }
    return subscribeToUserInquiries(user.uid, setInquiries, (err) =>
      showToast(err.message, "error")
    );
  }, [user?.uid, showToast]);

  useEffect(() => {
    if (selectedInquiry) {
      const updated = inquiries.find((i) => i.id === selectedInquiry.id);
      if (updated) setSelectedInquiry(updated);
      else setSelectedInquiry(null);
    }
  }, [inquiries, selectedInquiry]);

  const incoming = useMemo(
    () => inquiries.filter((i) => i.sellerId === user?.uid),
    [inquiries, user?.uid]
  );
  const outgoing = useMemo(
    () => inquiries.filter((i) => i.buyerId === user?.uid),
    [inquiries, user?.uid]
  );

  function openInquiry(inquiry: MarketplaceInquiry) {
    setSelectedInquiry(inquiry);
    setPhone("");
    setOperator("");
  }

  async function handleStatusChange(status: "accepted" | "declined") {
    if (!user?.uid || !selectedInquiry) return;

    setBusyId(selectedInquiry.id);
    try {
      await updateInquiryStatus({
        inquiryId: selectedInquiry.id,
        sellerId: user.uid,
        status,
      });
      showToast(status === "accepted" ? "Inquiry accepted." : "Inquiry declined.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Update failed.", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function handleCharge() {
    if (!selectedInquiry || !phone.trim() || !operator) {
      showToast("Enter phone number and select operator.", "error");
      return;
    }

    setBusyId(selectedInquiry.id);
    try {
      const result = await chargeInquiryMobileMoney({
        inquiryId: selectedInquiry.id,
        operator,
        phone: phone.trim(),
      });
      if (result.status === "failed") {
        showToast(result.failureReason ?? result.message, "error");
      } else {
        showToast(result.message, result.status === "completed" ? "success" : "info");
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Payment failed.", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function handleRefresh() {
    if (!selectedInquiry) return;

    setBusyId(selectedInquiry.id);
    try {
      const result = await checkInquiryPaymentStatus({
        inquiryId: selectedInquiry.id,
        reference: selectedInquiry.paymentReference ?? undefined,
        transactionId: selectedInquiry.paymentTransactionId ?? undefined,
      });
      showToast(
        result.failureReason ?? result.message,
        result.status === "failed" ? "error" : result.status === "completed" ? "success" : "info"
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Refresh failed.", "error");
    } finally {
      setBusyId(null);
    }
  }

  const isBusy = busyId === selectedInquiry?.id;

  return (
    <ScreenShell
      eyebrow="Inbox"
      title="Orders and inquiries"
      body="Track buyer requests, accept orders, and complete mobile money payments."
    >
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{incoming.length}</Text>
          <Text style={styles.summaryLabel}>Incoming</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{outgoing.length}</Text>
          <Text style={styles.summaryLabel}>Outgoing</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {incoming.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Incoming</Text>
            {incoming.map((inquiry) => (
              <InquiryCard
                key={inquiry.id}
                inquiry={inquiry}
                isIncoming
                onPress={() => openInquiry(inquiry)}
              />
            ))}
          </View>
        )}

        {outgoing.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Outgoing</Text>
            {outgoing.map((inquiry) => (
              <InquiryCard
                key={inquiry.id}
                inquiry={inquiry}
                isIncoming={false}
                onPress={() => openInquiry(inquiry)}
              />
            ))}
          </View>
        )}

        {incoming.length === 0 && outgoing.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons color={COLORS.textMuted} name="mail-outline" size={28} />
            <Text style={styles.emptyTitle}>No inquiries yet</Text>
            <Text style={styles.emptyText}>
              Your order requests will appear here.
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal
        animationType="slide"
        onRequestClose={() => setSelectedInquiry(null)}
        transparent
        visible={!!selectedInquiry}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderText}>
                <Text style={styles.modalTitle}>{selectedInquiry?.listingTitle}</Text>
                <Text style={[styles.modalStatus, { color: statusTone(selectedInquiry?.status ?? "pending") }]}>
                  {selectedInquiry?.status.toUpperCase()}
                </Text>
              </View>
              <Pressable onPress={() => setSelectedInquiry(null)} style={styles.closeButton}>
                <Ionicons color={COLORS.text} name="close" size={20} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalContent}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{isIncoming ? "Buyer" : "Seller"}</Text>
                <Text style={styles.detailValue}>
                  {isIncoming ? selectedInquiry?.buyerName : selectedInquiry?.sellerName}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Quantity</Text>
                <Text style={styles.detailValue}>{selectedInquiry?.requestedQuantity}</Text>
              </View>
              {selectedInquiry?.selectedAddOns?.length ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Extras</Text>
                  <Text style={styles.detailValue}>
                    {formatListingAddOns(selectedInquiry.selectedAddOns)}
                  </Text>
                </View>
              ) : null}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total</Text>
                <Text style={styles.detailValueBold}>
                  ZMW {selectedInquiry?.totalPrice.toFixed(2)}
                </Text>
              </View>

              {selectedInquiry?.message ? (
                <View style={styles.messageBox}>
                  <Text style={styles.messageText}>{selectedInquiry.message}</Text>
                </View>
              ) : null}

              {/* Incoming: Accept/Decline */}
              {isIncoming && selectedInquiry?.status === "pending" && (
                <View style={styles.actions}>
                  <Pressable
                    disabled={isBusy}
                    onPress={() => handleStatusChange("accepted")}
                    style={styles.primaryButton}
                  >
                    {isBusy ? (
                      <ActivityIndicator color={COLORS.text} />
                    ) : (
                      <Text style={styles.primaryButtonText}>Accept</Text>
                    )}
                  </Pressable>
                  <Pressable
                    disabled={isBusy}
                    onPress={() => handleStatusChange("declined")}
                    style={styles.secondaryButton}
                  >
                    <Text style={styles.secondaryButtonText}>Decline</Text>
                  </Pressable>
                </View>
              )}

              {/* Outgoing: Payment */}
              {!isIncoming && selectedInquiry?.status === "accepted" && (
                <View style={styles.paymentSection}>
                  <View style={styles.paymentHeader}>
                    <Text style={styles.paymentTitle}>Payment</Text>
                    <Text style={[styles.paymentStatusBadge, { color: paymentTone(selectedInquiry.paymentStatus) }]}>
                      {paymentLabel(selectedInquiry.paymentStatus).toUpperCase()}
                    </Text>
                  </View>

                  {selectedInquiry.paymentStatus !== "completed" && (
                    <>
                      {selectedInquiry.paymentStatus === "awaiting-authorization" && (
                        <Text style={styles.paymentHint}>
                          Approve the mobile money prompt on your phone.
                        </Text>
                      )}

                      <TextInput
                        keyboardType="phone-pad"
                        onChangeText={setPhone}
                        placeholder="Mobile money phone number"
                        placeholderTextColor={COLORS.textMuted}
                        style={styles.input}
                        value={phone}
                      />

                      <View style={styles.operatorGroup}>
                        {MOBILE_MONEY_OPERATORS.map((op) => (
                          <Pressable
                            key={op.value}
                            onPress={() => setOperator(op.value)}
                            style={[
                              styles.operatorChip,
                              operator === op.value && styles.operatorChipSelected,
                            ]}
                          >
                            <Text
                              style={[
                                styles.operatorChipText,
                                operator === op.value && styles.operatorChipTextSelected,
                              ]}
                            >
                              {op.label}
                            </Text>
                          </Pressable>
                        ))}
                      </View>

                      <View style={styles.actions}>
                        <Pressable disabled={isBusy} onPress={handleCharge} style={styles.primaryButton}>
                          {isBusy ? (
                            <ActivityIndicator color={COLORS.text} />
                          ) : (
                            <Text style={styles.primaryButtonText}>Pay Now</Text>
                          )}
                        </Pressable>
                        <Pressable disabled={isBusy} onPress={handleRefresh} style={styles.secondaryButton}>
                          <Text style={styles.secondaryButtonText}>Refresh</Text>
                        </Pressable>
                      </View>
                    </>
                  )}

                  {selectedInquiry.paymentStatus === "completed" && (
                    <View style={styles.successBox}>
                      <Ionicons color={COLORS.accentDeep} name="checkmark-circle" size={24} />
                      <Text style={styles.successText}>Payment completed</Text>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  summaryCard: {
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.md,
    flex: 1,
    gap: 2,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  summaryNumber: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "800",
  },
  summaryLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  content: {
    gap: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  section: {
    gap: SPACING.sm,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "800",
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    gap: 6,
    padding: SPACING.sm,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
  },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: SPACING.sm,
  },
  cardTitle: {
    color: COLORS.text,
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
  },
  cardStatus: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  cardMeta: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  cardFooter: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardPrice: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
  },
  cardTime: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  emptyState: {
    alignItems: "center",
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
    justifyContent: "center",
    minHeight: 160,
    paddingHorizontal: SPACING.lg,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "700",
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: "center",
  },
  modalBackdrop: {
    backgroundColor: "rgba(0,0,0,0.4)",
    flex: 1,
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    maxHeight: "85%",
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  modalHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: SPACING.md,
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },
  modalHeaderText: {
    flex: 1,
    gap: 4,
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "800",
  },
  modalStatus: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  closeButton: {
    alignItems: "center",
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  modalContent: {
    flexGrow: 0,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceMuted,
  },
  detailLabel: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  detailValue: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
    marginLeft: SPACING.md,
  },
  detailValueBold: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "800",
  },
  messageBox: {
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.sm,
    marginTop: SPACING.md,
    padding: SPACING.sm,
  },
  messageText: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 19,
  },
  actions: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.md,
    flex: 1,
    justifyContent: "center",
    minHeight: 46,
  },
  primaryButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.md,
    flex: 1,
    justifyContent: "center",
    minHeight: 46,
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
  },
  paymentSection: {
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
    marginTop: SPACING.md,
    padding: SPACING.md,
  },
  paymentHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  paymentTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "800",
  },
  paymentStatusBadge: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  paymentHint: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    color: COLORS.text,
    fontSize: 14,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
  },
  operatorGroup: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  operatorChip: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    flex: 1,
    justifyContent: "center",
    minHeight: 42,
  },
  operatorChipSelected: {
    backgroundColor: COLORS.accent,
  },
  operatorChipText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
  },
  operatorChipTextSelected: {
    color: COLORS.text,
  },
  successBox: {
    alignItems: "center",
    flexDirection: "row",
    gap: SPACING.sm,
    justifyContent: "center",
    paddingVertical: SPACING.sm,
  },
  successText: {
    color: COLORS.accentDeep,
    fontSize: 14,
    fontWeight: "700",
  },
});
