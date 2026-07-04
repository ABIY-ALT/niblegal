/**
 * Maps a Role table display name to the lowercase role slug the app's route
 * guards + getCurrentUser expect (UserRole). Custom roles fall back to a
 * derived slug that simply won't match the built-in role guards — i.e. least
 * privilege until fine-grained permission checks are wired in.
 */
const ROLE_SLUGS: Record<string, string> = {
  Admin: 'admin_assistant',
  Administrator: 'admin_assistant',
  'Admin Assistant': 'admin_assistant',
  'Administrative Assistant': 'admin_assistant',
  'Legal Officer': 'legal_officer',
  Manager: 'manager',
  'Requesting Organ': 'requesting_organ',
};

export function roleNameToSlug(name: string): string {
  return ROLE_SLUGS[name] ?? name.toLowerCase().replace(/\s+/g, '_');
}
