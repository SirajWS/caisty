export class InvalidPullCursorError extends Error {
  readonly code = "invalid_request" as const;

  constructor(message = "Pull cursor is invalid.") {
    super(message);
    this.name = "InvalidPullCursorError";
  }
}

export class PullCursorOrgMismatchError extends Error {
  readonly code = "cursor_org_mismatch" as const;

  constructor(message = "Pull cursor belongs to a different organization.") {
    super(message);
    this.name = "PullCursorOrgMismatchError";
  }
}
