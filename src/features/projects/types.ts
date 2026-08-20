export type HandoffChecklist = {
  businessInfo: boolean;
  understanding: boolean;
  requirements: boolean;
  finalQuotation: boolean;
  initialPayment: boolean;
  clientContacts: boolean;
  resources: boolean;
};

export type ProjectHandoffSnapshot = {
  checklist: HandoffChecklist;
  business: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    primaryContact: { name: string; email: string; phone: string | null } | null;
  };
  quotation: { id: string; version: number; subtotal: number; initialPayment: number } | null;
  payment: {
    receivedPaise: number;
    requiredPaise: number;
    count: number;
    contractTotalPaise?: number;
    fullyPaid?: boolean;
  };
  resourceCount: number;
  notes: string | null;
};
