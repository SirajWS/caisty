/** Trace helper for provider order payment diagnosis (POS sync + webhook). */

export function traceProviderOrderStage(
  orderId: string,
  stage: string,
  fields: Record<string, unknown>,
): void {
  const targets = new Set([orderId, orderId.replace(/^T/, "")]);
  const haystacks = [
    String(fields.localOrderId ?? ""),
    String(fields.providerOrderId ?? ""),
    String(fields.id ?? ""),
  ];
  if (!haystacks.some((value) => targets.has(value))) return;
  console.info("[provider-order-trace]", { stage, ...fields });
}
