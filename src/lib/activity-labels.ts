/** Human labels for ActivityLog.action. Client-safe. */
export const ACTIVITY_LABELS: Record<string, string> = {
  "business.created": "created this business",
  "business.updated": "updated the business info",
  "contact.created": "added a contact",
  "contact.created_primary": "added a primary contact",
  "contact.updated": "updated a contact",
  "contact.primary_changed": "changed the primary contact",
  "pipeline.created": "created this pipeline",
  "pipeline.promoted": "promoted the pipeline",
  "pipeline.deactivated": "deactivated the pipeline",
  "pipeline.completed": "completed the pipeline",
  "task.created": "created a task",
  "task.updated": "updated a task",
  "task.completed": "completed a task",
  "task.cancelled": "cancelled a task",
  "task.reassigned": "reassigned a task",
  "followup.created": "scheduled a follow-up",
  "followup.completed": "completed a follow-up",
  "followup.updated": "updated a follow-up",
  "followup.rescheduled": "rescheduled a follow-up",
  "resource.created": "uploaded a resource",
  "resource.deleted": "deleted a resource",
  "phase.discovery.saved": "saved discovery notes",
  "phase.understanding.saved": "saved business understanding",
  "phase.requirement.saved": "saved requirements",
  "phase.research.saved": "updated business research",
  "quotation.created": "created a quotation version",
  "quotation.published": "published a quotation",
  "quotation.accepted": "recorded quotation acceptance",
  "quotation.rejected": "recorded quotation rejection",
  "quotation.deferred": "deferred the quotation decision",
};

export function activityLabel(action: string): string {
  return ACTIVITY_LABELS[action] ?? action.replace(/[._]/g, " ");
}
