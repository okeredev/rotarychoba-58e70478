import { QRCodeSVG } from "qrcode.react";
import { ShieldCheck } from "lucide-react";

/**
 * Diagonal repeating watermark stamped across the receipt body. Sits behind
 * content via absolute positioning + low opacity so it can't be cleanly
 * cropped or removed without destroying the slip.
 */
export function ReceiptWatermark({ label }: { label: string }) {
  const text = ` ${label} · ${label} · ${label} `;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden select-none"
      style={{ zIndex: 0 }}
    >
      <div
        className="absolute -inset-1/4 flex flex-col gap-6 opacity-[0.07] text-primary font-display font-black uppercase tracking-[0.4em] whitespace-nowrap"
        style={{ transform: "rotate(-22deg)", fontSize: "2.25rem", lineHeight: 1 }}
      >
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i}>{text.repeat(6)}</div>
        ))}
      </div>
    </div>
  );
}

/**
 * Verification block: QR code that points to the public lookup endpoint with
 * the reference pre-filled, plus a "verified" seal and an issued-at timestamp.
 * Anyone at the door can scan the QR to confirm the slip is authentic — they
 * don't have to trust the printed pixels.
 */
export function ReceiptVerifyBlock({
  reference,
  email,
  issuedAt,
  status,
}: {
  reference: string;
  email: string;
  issuedAt: string;
  status: "PROVISIONAL" | "OFFICIAL";
}) {
  const origin = "https://www.rotaryclubofchobauniport.org";
  const verifyUrl = `${origin}/receipt?ref=${encodeURIComponent(reference)}`;
  const isOfficial = status === "OFFICIAL";

  return (
    <div className="relative z-10 rounded-lg border-2 border-dashed border-primary/40 bg-background/80 backdrop-blur-sm p-4 flex items-center gap-4">
      <div className="bg-white p-2 rounded shrink-0 border border-border">
        <QRCodeSVG value={verifyUrl} size={96} level="M" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <ShieldCheck className={`size-4 ${isOfficial ? "text-gold" : "text-primary"}`} />
          <p className="font-display font-bold text-primary text-sm uppercase tracking-widest">
            {isOfficial ? "Verified · Official Slip" : "Provisional Receipt"}
          </p>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground leading-snug">
          Scan the QR at the door to verify this slip against our records. Any
          alteration of the printed details (name, tier, amount, reference)
          invalidates this receipt — only the live database record is binding.
        </p>
        <div className="mt-2 grid grid-cols-2 gap-x-3 text-[10px] text-muted-foreground">
          <span>Ref&nbsp;<strong className="font-mono text-primary">{reference}</strong></span>
          <span className="truncate">Issued&nbsp;<strong>{issuedAt}</strong></span>
          <span className="col-span-2 truncate">Email&nbsp;<strong>{email}</strong></span>
        </div>
      </div>
    </div>
  );
}

/** Tailwind-friendly class to disable text selection / context menu on the slip. */
export const RECEIPT_LOCKED_CLASS =
  "select-none [-webkit-user-select:none] [-webkit-touch-callout:none]";
