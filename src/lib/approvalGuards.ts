/**
 * Maker–checker segregation of duty.
 *
 * The approval routes were role-gated and status-gated, but never checked *who*
 * the approver was. That left two holes in the control:
 *
 *   1. A manager could approve a record they themselves raised.
 *   2. A manager could approve stage 1 (Division Manager) and then approve
 *      stage 2 (Department/Legal Director) as well — one person satisfying a
 *      two-stage control, which defeats its purpose entirely.
 *
 * These helpers close both. They are deliberately strict: an approval must come
 * from someone who was not the maker and has not already signed off at an
 * earlier stage. That means director-stage approvals require a *second* user
 * holding the manager role.
 */

export interface SegregationSubject {
  /** Who raised the record. */
  requesterId?: string | null;
  /** Who drafted/worked it (contract assignee, advisory assignee). */
  assigneeId?: string | null;
}

export interface PriorApproval {
  approverId: string;
  decision: string;
  stage: string;
}

export class SegregationError extends Error {}

/**
 * Throws if `userId` may not act as checker on `subject`.
 *
 * @param priorApprovals Earlier approval records for the same item, used to
 *   stop the same person clearing more than one stage.
 */
export function assertCanApprove(
  userId: string,
  subject: SegregationSubject,
  priorApprovals: PriorApproval[] = [],
): void {
  if (subject.requesterId && subject.requesterId === userId) {
    throw new SegregationError(
      'You raised this item, so you cannot approve it. Maker–checker requires a different approver.',
    );
  }

  if (subject.assigneeId && subject.assigneeId === userId) {
    throw new SegregationError(
      'You are the assigned officer on this item, so you cannot also approve it. It must be checked by someone else.',
    );
  }

  const alreadySigned = priorApprovals.find(
    (a) => a.approverId === userId && a.decision === 'APPROVED',
  );
  if (alreadySigned) {
    throw new SegregationError(
      `You already approved this item at the ${alreadySigned.stage.replace(/_/g, ' ').toLowerCase()} stage. A second approval stage requires a different approver.`,
    );
  }
}

/** Same rule for the peer-review step: you cannot review your own drafting. */
export function assertCanReview(userId: string, subject: SegregationSubject): void {
  if (subject.assigneeId && subject.assigneeId === userId) {
    throw new SegregationError('You drafted this item, so it must be reviewed by someone else.');
  }
  if (subject.requesterId && subject.requesterId === userId) {
    throw new SegregationError('You raised this item, so it must be reviewed by someone else.');
  }
}
