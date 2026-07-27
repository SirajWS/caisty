export class InvalidPullCursorError extends Error {
  readonly code = "invalid_request" as const;

  constructor(message = "Pull cursor is invalid.") {
    super(message);
    this.name = "InvalidPullCursorError";
  }
}
