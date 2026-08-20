export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  BANK_TRANSFER: "Bank Transfer",
  UPI: "UPI",
  CARD: "Card",
  CASH: "Cash",
  OTHER: "Other",
};

export const PAYMENT_METHOD_OPTIONS = [
  "BANK_TRANSFER",
  "UPI",
  "CARD",
  "CASH",
  "OTHER",
] as const;
