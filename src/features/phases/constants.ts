/** Internal questionnaire templates — no custom builder (PHASE_7 rule). */
export const QUESTIONNAIRE_TEMPLATES = {
  software_development: {
    label: "Software Development",
    sections: [
      { key: "business_problem", label: "Business Problem", questions: ["What problem are you trying to solve?", "Why now?"] },
      { key: "users", label: "Users", questions: ["Who will use the system?", "How many users?"] },
      { key: "features", label: "Features", questions: ["Must-have features?", "Nice-to-have features?"] },
      { key: "integrations", label: "Integrations", questions: ["Existing tools to integrate?", "APIs or data sources?"] },
      { key: "timeline", label: "Timeline", questions: ["Target launch date?", "Hard deadlines?"] },
      { key: "constraints", label: "Constraints", questions: ["Budget range?", "Technical constraints?"] },
    ],
  },
  automation: {
    label: "Automation / RPA",
    sections: [
      { key: "business_problem", label: "Business Problem", questions: ["Which process should be automated?", "Current pain points?"] },
      { key: "users", label: "Users", questions: ["Who operates the process today?"] },
      { key: "features", label: "Features", questions: ["Steps to automate?", "Expected outcomes?"] },
      { key: "integrations", label: "Integrations", questions: ["Systems involved?", "Data formats?"] },
      { key: "timeline", label: "Timeline", questions: ["Go-live target?"] },
      { key: "constraints", label: "Constraints", questions: ["Compliance requirements?", "Budget?"] },
    ],
  },
} as const;

export type QuestionnaireTemplateKey = keyof typeof QUESTIONNAIRE_TEMPLATES;

export const DEFAULT_CHECKLIST = {
  understandBusiness: false,
  painPoints: false,
  softwareOpportunity: false,
  canAddValue: false,
} as const;

export type DiscoveryChecklist = typeof DEFAULT_CHECKLIST;

export function formatINR(paise: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
    paise / 100,
  );
}

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function paiseToRupees(paise: number): number {
  return paise / 100;
}
