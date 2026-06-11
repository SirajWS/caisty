// Optional WhatsApp for Tunisia marketing (E.164 digits only, no +). Leave empty to hide the link.
export const TN_WHATSAPP_E164_DIGITS = "";

export function tunisiaWhatsappUrl(): string | null {
  const d = TN_WHATSAPP_E164_DIGITS.trim();
  if (!/^\d{8,15}$/.test(d)) return null;
  return `https://wa.me/${d}`;
}
