import QRCode from "qrcode";
import { signTicketToken } from "./ticketToken";

/** Erzeugt den QR-Inhalt (signiertes Token) für ein Ticket. */
export function getTicketQrContent(ticketId: string): string {
  return signTicketToken(ticketId);
}

/** Rendert den QR-Code als Data-URL (PNG, base64) — für E-Mail & Erfolgsseite. */
export async function ticketQrDataUrl(ticketId: string): Promise<string> {
  const content = getTicketQrContent(ticketId);
  return QRCode.toDataURL(content, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 480,
    color: {
      dark: "#0a0a0a",
      light: "#f5f3eeff"
    }
  });
}

/** Rendert den QR-Code als PNG-Buffer — praktisch für E-Mail-Anhänge (cid-embed). */
export async function ticketQrBuffer(ticketId: string): Promise<Buffer> {
  const content = getTicketQrContent(ticketId);
  return QRCode.toBuffer(content, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 480,
    color: {
      dark: "#0a0a0a",
      light: "#f5f3eeff"
    }
  });
}
