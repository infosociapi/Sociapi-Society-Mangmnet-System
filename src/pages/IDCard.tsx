import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Button, Card } from "../components/ui";
import { useApp } from "../context/AppContext";
import { Download, FileImage, Printer } from "lucide-react";
import jsPDF from "jspdf";

// Canvas is drawn at 2x for crisp export, card UI dimensions below.
const CARD_W = 640;
const CARD_H = 400;
const SCALE = 2;

export default function IDCard() {
  const { currentUser } = useApp();
  const [qr, setQr] = useState<string>("");
  const [error, setError] = useState("");
  const cardRef = useRef<HTMLDivElement | null>(null);
  const initials =
    currentUser?.name
      .replace(/\(.+?\)/g, "")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "SS";

  useEffect(() => {
    if (!currentUser) return;
    const url = `${window.location.origin}${window.location.pathname}#/member/${currentUser.memberId}`;
    QRCode.toDataURL(url, { width: 320, margin: 1, color: { dark: "#111827", light: "#ffffff" } })
      .then(setQr)
      .catch(() => setQr(""));
  }, [currentUser]);

  if (!currentUser) return null;

  const drawCanvas = async () => {
    const w = CARD_W * SCALE;
    const h = CARD_H * SCALE;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");
    ctx.scale(SCALE, SCALE);

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
    grad.addColorStop(0, "#0F172A");
    grad.addColorStop(0.55, "#0E7490");
    grad.addColorStop(1, "#F97316");
    ctx.fillStyle = grad;
    roundRect(ctx, 0, 0, CARD_W, CARD_H, 24);
    ctx.fill();

    // subtle decorative circle
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.beginPath();
    ctx.arc(CARD_W - 60, -20, 140, 0, Math.PI * 2);
    ctx.fill();

    // Top bar: brand + year
    ctx.fillStyle = "#fff";
    ctx.font = "700 26px Arial";
    ctx.fillText("SOCIAPI", 28, 42);
    ctx.font = "500 12px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.fillText("SOCIETY ERP  ·  MEMBER", 28, 60);
    ctx.textAlign = "right";
    ctx.font = "700 18px Arial";
    ctx.fillStyle = "#fff";
    ctx.fillText("2026", CARD_W - 28, 42);
    ctx.textAlign = "left";

    // Divider
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(28, 76);
    ctx.lineTo(CARD_W - 28, 76);
    ctx.stroke();

    // Photo circle
    const photoCx = 92;
    const photoCy = 168;
    const photoR = 56;
    ctx.save();
    ctx.beginPath();
    ctx.arc(photoCx, photoCy, photoR + 4, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fill();
    ctx.restore();

    if (currentUser.photoUrl) {
      try {
        const img = await loadImage(currentUser.photoUrl);
        ctx.save();
        ctx.beginPath();
        ctx.arc(photoCx, photoCy, photoR, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, photoCx - photoR, photoCy - photoR, photoR * 2, photoR * 2);
        ctx.restore();
      } catch {
        drawInitials(ctx, initials, photoCx, photoCy, photoR);
      }
    } else {
      drawInitials(ctx, initials, photoCx, photoCy, photoR);
    }

    // Name + role block (right of photo)
    const textX = 168;
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = "600 11px Arial";
    ctx.fillText("MEMBER NAME", textX, 122);

    ctx.fillStyle = "#fff";
    ctx.font = "700 26px Arial";
    wrapText(ctx, currentUser.name.toUpperCase(), textX, 150, CARD_W - textX - 28, 28);

    ctx.font = "600 15px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.fillText(currentUser.role, textX, 200);
    ctx.font = "400 13px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fillText(`${currentUser.department} · ${currentUser.position}`, textX, 220);

    // Bottom info row
    const bottomY = 318;
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = "600 11px Arial";
    ctx.fillText("MEMBER ID", 28, bottomY);
    ctx.fillText("JOINED", 240, bottomY);

    ctx.fillStyle = "#fff";
    ctx.font = "700 20px Arial";
    ctx.fillText(currentUser.memberId, 28, bottomY + 26);
    ctx.font = "600 18px Arial";
    ctx.fillText(
      new Date(currentUser.joinDate).toLocaleDateString(undefined, { month: "short", year: "numeric" }),
      240,
      bottomY + 26
    );

    // QR code box (bottom-right)
    if (qr) {
      const qrImg = await loadImage(qr);
      const qrSize = 84;
      const qrX = CARD_W - 28 - qrSize;
      const qrY = bottomY - 56;
      ctx.fillStyle = "#fff";
      roundRect(ctx, qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 14);
      ctx.fill();
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
    }

    // Footer
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "500 11px Arial";
    ctx.fillText("linktr.ee/sociapisociety", CARD_W / 2, CARD_H - 14);
    ctx.textAlign = "left";

    return canvas;
  };

  const downloadPNG = async () => {
    try {
      const canvas = await drawCanvas();
      const link = document.createElement("a");
      link.download = `${currentUser.memberId}-id-card.png`;
      link.href = canvas.toDataURL("image/png", 1);
      link.click();
    } catch {
      setError("PNG export failed");
    }
  };

  const downloadPDF = async () => {
    try {
      const canvas = await drawCanvas();
      const img = canvas.toDataURL("image/png", 1);
      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [CARD_W, CARD_H] });
      pdf.addImage(img, "PNG", 0, 0, CARD_W, CARD_H);
      pdf.save(`${currentUser.memberId}-id-card.pdf`);
    } catch {
      setError("PDF export failed");
    }
  };

  const printCard = async () => {
    const canvas = await drawCanvas();
    const url = canvas.toDataURL("image/png", 1);
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(
      `<html><body style="margin:0;display:flex;justify-content:center;align-items:center;height:100vh;background:#0F172A"><img src="${url}" style="max-width:90%;border-radius:16px"/></body></html>`
    );
    w.document.close();
    setTimeout(() => {
      w.print();
      w.close();
    }, 500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Digital Member ID Card</h1>
        <p className="text-sm text-slate-500">Profile picture, secure public QR and downloadable card.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6 items-start">
        <Card className="p-6 flex items-center justify-center">
          <div
            ref={cardRef}
            className="w-full max-w-[640px] aspect-[640/400] rounded-3xl relative overflow-hidden text-white shadow-xl ring-1 ring-black/10"
            style={{ background: "linear-gradient(135deg, #0F172A 0%, #0E7490 55%, #F97316 100%)" }}
          >
            {/* decorative blur circle */}
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5 blur-2xl" />

            {/* Top bar */}
            <div className="absolute left-7 top-5 right-7 flex items-start justify-between">
              <div>
                <p className="text-2xl font-bold leading-none">SOCIAPI</p>
                <p className="text-[11px] tracking-widest text-white/75 mt-1">SOCIETY ERP · MEMBER</p>
              </div>
              <p className="text-lg font-bold">2026</p>
            </div>
            <div className="absolute left-7 right-7 top-[72px] h-px bg-white/15" />

            {/* Body */}
            <div className="absolute left-7 right-7 top-[92px] flex items-start gap-5">
              <div className="relative h-28 w-28 shrink-0 rounded-full bg-white/15 flex items-center justify-center overflow-hidden ring-2 ring-white/20">
                {currentUser.photoUrl ? (
                  <img src={currentUser.photoUrl} alt={currentUser.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold">{initials}</span>
                )}
              </div>
              <div className="min-w-0 pt-1">
                <p className="text-[11px] font-semibold tracking-wide text-white/75">MEMBER NAME</p>
                <p className="text-xl font-bold leading-snug mt-1 break-words">{currentUser.name.toUpperCase()}</p>
                <p className="text-sm font-semibold mt-2">{currentUser.role}</p>
                <p className="text-xs text-white/75 mt-1">{currentUser.department} · {currentUser.position}</p>
              </div>
            </div>

            {/* QR box */}
            <div className="absolute right-7 bottom-[64px] bg-white rounded-2xl p-2">
              {qr ? <img src={qr} alt="Member QR" className="h-[84px] w-[84px]" /> : <div className="h-[84px] w-[84px] bg-slate-200 rounded-xl" />}
            </div>

            {/* Bottom info */}
            <div className="absolute left-7 bottom-[34px] flex gap-10">
              <div>
                <p className="text-[11px] font-semibold tracking-wide text-white/75">MEMBER ID</p>
                <p className="text-lg font-bold mt-1">{currentUser.memberId}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold tracking-wide text-white/75">JOINED</p>
                <p className="text-base font-semibold mt-1">
                  {new Date(currentUser.joinDate).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                </p>
              </div>
            </div>

            {/* Footer */}
            <p className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[11px] text-white/70">linktr.ee/sociapisociety</p>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Card Actions</h3>
          <div className="space-y-2">
            <Button className="w-full" icon={<FileImage className="h-4 w-4" />} onClick={downloadPNG}>Download PNG</Button>
            <Button className="w-full" variant="outline" icon={<Download className="h-4 w-4" />} onClick={downloadPDF}>Download PDF</Button>
            <Button className="w-full" variant="ghost" icon={<Printer className="h-4 w-4" />} onClick={printCard}>Print Card</Button>
          </div>
          {error && <p className="text-xs text-red-600 mt-3">{error}</p>}
        </Card>
      </div>
    </div>
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawInitials(ctx: CanvasRenderingContext2D, initials: string, cx: number, cy: number, r: number) {
  ctx.fillStyle = "#0E7490";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "700 36px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(initials, cx, cy + 2);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

// Wraps text into at most 2 lines within maxWidth, truncating with ellipsis if needed.
function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(" ");
  let line = "";
  let lines: string[] = [];
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  lines = lines.slice(0, 2);
  if (lines.length === 2 && ctx.measureText(lines[1]).width > maxWidth) {
    while (ctx.measureText(lines[1] + "…").width > maxWidth && lines[1].length > 1) {
      lines[1] = lines[1].slice(0, -1);
    }
    lines[1] += "…";
  }
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
}