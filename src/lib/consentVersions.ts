/**
 * Consent and policy version constants.
 *
 * These are the versions of the Terms of Service and Privacy Notice
 * that are currently in force.  They are stored in user records when
 * the user accepts / acknowledges the relevant document.  A mismatch
 * between the stored version and the current version triggers the
 * non-blocking re-acknowledgement banner.
 *
 * Bump these strings ONLY when a meaningful change has been made to
 * the legal document (new data categories, new recipients, changed
 * retention period, change in processing purpose, etc.).  Minor
 * editorial/formatting changes do not require a version bump.
 *
 * IMPORTANT: these values are placeholder strings until real legal
 * documents are approved and published.  Do NOT promote to a real
 * version number until the corresponding page (/terms-and-conditions
 * and /privacy) contains real, legally reviewed content.
 */

/** Current Terms of Service version. */
export const CURRENT_TOS_VERSION = '1.0'

/** Current Privacy Notice version. */
export const CURRENT_PRIVACY_VERSION = '1.0'

/**
 * Sentinel value stored in user records when a user accepted the
 * relevant document before versioning was introduced.  Indicates that
 * acceptance is known to have occurred but the version and exact
 * timestamp are unavailable.
 */
export const LEGACY_VERSION_SENTINEL = 'legacy'
