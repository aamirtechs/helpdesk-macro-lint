export const PLACEHOLDERS = new Set([
  "ticket.id","ticket.subject","ticket.description","ticket.status","ticket.priority","ticket.type",
  "ticket.brand","ticket.tags","ticket.url","ticket.external_id","ticket.created_at","ticket.updated_at","ticket.due_date",
  "ticket.requester.name","ticket.requester.email","ticket.requester.first_name","ticket.requester.last_name","ticket.requester.phone","ticket.requester.language","ticket.requester.time_zone",
  "ticket.assignee.name","ticket.assignee.email","ticket.assignee.first_name","ticket.assignee.last_name",
  "ticket.organization.name","ticket.organization.id",
  "ticket.group.name","ticket.group.id",
  "current_user.name","current_user.email","current_user.first_name","current_user.last_name",
  "ticket.in_business_hours","ticket.ticket_field_1"
]);
export function isKnownPlaceholder(name) {
  if (PLACEHOLDERS.has(name)) return true;
  if (/^ticket\.custom_field_\d+$/.test(name)) return true;
  if (/^ticket\.ticket_field_\d+$/.test(name)) return true;
  return false;
}
