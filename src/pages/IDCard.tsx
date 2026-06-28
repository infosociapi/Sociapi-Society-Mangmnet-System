import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button, Card } from "../components/ui";
import { useApp } from "../context/AppContext";
import { Download, FileImage, Printer, Sparkles } from "lucide-react";
import jsPDF from "jspdf";

export default function IDCard() {
  const { currentUser } = useApp();
  const [qr, setQr] = useState<string>("");
  const [error, setError] = useState("");
  const initials = currentUser?.name.replace(/\(.+?\)/g, "").trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "SS";

  useEffect(() => {
    if (!currentUser) return;
    const url = `${window.location.origin}${window.location.pathname}#/member/${currentUser.memberId}`;
    QRCode.toDataURL(url, { width: 320, margin: 1, color: { dark: "#0f172a", light: "#ffffff" } })
      .then(setQr)
      .catch(() => setQr(""));
  }, [currentUser]);

  if (!currentUser) return null;

  const buildCanvas = async (scale = 4) => {
    const w = 420;
    const h = 260;
    const canvas = document.createElement("canvas");
    canvas.width = w * scale;
    canvas.height = h * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not available");
    ctx.scale(scale, scale);

    const radius = 24;
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(w - radius, 0);
    ctx.quadraticCurveTo(w, 0, w, radius);
    ctx.lineTo(w, h - radius);
    ctx.quadraticCurveTo(w, h, w - radius, h);
    ctx.lineTo(radius, h);
    ctx.quadraticCurveTo(0, h, 0, h - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.clip();

    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#111827");
    grad.addColorStop(0.58, "#14B8A6");
    grad.addColorStop(1, "#F97316");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    if (currentUser.photoUrl) {
      try {
        const p = await loadImage(currentUser.photoUrl);
        ctx.save();
        ctx.beginPath();
        ctx.arc(61, 119, 36, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(p, 25, 83, 72, 72);
        ctx.restore();
      } catch {
        // Fallback initials
      }
    } else {
        ctx.fillStyle = "rgba(255,255,255,0.18)";
        roundRect(ctx, 25, 83, 72, 72, 18);
        ctx.fill();
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "800 25px Arial";
        ctx.textAlign = "center";
        ctx.fillText(initials, 61, 128);
        ctx.textAlign = "left";
    }

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "800 18px Arial";
    ctx.fillText(currentUser.name, 118, 119, 178);
    ctx.font = "12px Arial";
    ctx.fillText(currentUser.role, 118, 139, 180);
    ctx.fillText(`${currentUser.department} Department · ${currentUser.position}`, 118, 157, 180);

    if (qr) {
      const img = await loadImage(qr);
      ctx.fillStyle = "#FFFFFF";
      roundRect(ctx, 318, 86, 78, 78, 14);
      ctx.fill();
      ctx.drawImage(img, 323, 91, 68, 68);
    }
    
    return canvas;
  };

  const downloadPNG = async () => {
    try {
      const canvas = await buildCanvas(4);
      canvas.toBlob((blob) => {
        if (!blob) throw new Error("PNG failed");
        const link = document.createElement("a");
        link.download = `${currentUser.memberId}-id-card.png`;
        link.href = URL.createObjectURL(blob);
        link.click();
      }, "image/png", 1);
    } catch (e) { setError("PNG export failed"); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Digital ID Card</h1>
      <Card className="p-6 h-fit">
        <Button className="w-full" icon={<FileImage className="h-4 w-4" />} onClick={downloadPNG}>Download PNG</Button>
        {error && <p className="text-xs text-red-600 mt-3">{error}</p>}
      </Card>
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
