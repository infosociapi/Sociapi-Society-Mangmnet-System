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
    const payload = JSON.stringify({
      memberId: currentUser.memberId,
      username: currentUser.username,
      name: currentUser.name,
    });
    QRCode.toDataURL(payload, { width: 320, margin: 1, color: { dark: "#0f172a", light: "#ffffff" } })
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

    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.beginPath();
    ctx.arc(370, 20, 72, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(20, 270, 86, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "800 18px Arial";
    ctx.fillText("SOCIAPI", 60, 34);
    ctx.font = "10px Arial";
    ctx.fillText("SOCIETY ERP · MEMBER", 60, 49);
    ctx.font = "bold 14px Arial";
    ctx.fillText("2026", 348, 38);

    ctx.fillStyle = "rgba(255,255,255,0.20)";
    roundRect(ctx, 20, 20, 30, 30, 10);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 15px Arial";
    ctx.fillText("S", 30, 40);

    ctx.fillStyle = "rgba(255,255,255,0.18)";
    roundRect(ctx, 20, 78, 82, 82, 18);
    ctx.fill();
    const avatarGrad = ctx.createLinearGradient(25, 84, 95, 154);
    avatarGrad.addColorStop(0, "#111827");
    avatarGrad.addColorStop(1, "#14B8A6");
    ctx.fillStyle = avatarGrad;
    ctx.beginPath();
    ctx.arc(61, 119, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "800 25px Arial";
    ctx.textAlign = "center";
    ctx.fillText(initials, 61, 128);
    ctx.textAlign = "left";

    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = "10px Arial";
    ctx.fillText("NAME", 118, 96);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "800 18px Arial";
    ctx.fillText(currentUser.name, 118, 119, 178);
    ctx.font = "12px Arial";
    ctx.fillText(currentUser.role, 118, 139, 180);
    ctx.fillText(`${currentUser.department} · ${currentUser.position}`, 118, 157, 180);

    if (qr) {
      const img = await loadImage(qr);
      ctx.fillStyle = "#FFFFFF";
      roundRect(ctx, 318, 86, 78, 78, 14);
      ctx.fill();
      ctx.drawImage(img, 323, 91, 68, 68);
    }

    const footerY = 206;
    const items = [
      ["MEMBER ID", currentUser.memberId],
      ["SPECIAL NO", currentUser.specialNumber],
      ["JOINED", new Date(currentUser.joinDate).toLocaleDateString(undefined, { month: "short", year: "numeric" })],
    ];
    items.forEach(([label, value], i) => {
      const x = 24 + i * 132;
      ctx.fillStyle = "rgba(255,255,255,0.68)";
      ctx.font = "9px Arial";
      ctx.fillText(label, x, footerY);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 12px Arial";
      ctx.fillText(value, x, footerY + 18);
    });
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.font = "9px Arial";
    ctx.fillText("sociapi.org", 24, 248);
    ctx.fillText("Authorized credential - non-transferable", 246, 248);
    return canvas;
  };

  const downloadPNG = async () => {
    setError("");
    try {
      const canvas = await buildCanvas(4);
      canvas.toBlob((blob) => {
        if (!blob) throw new Error("Unable to generate PNG");
        const link = document.createElement("a");
        link.download = `${currentUser.memberId}-id-card.png`;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
      }, "image/png", 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "PNG export failed");
    }
  };

  const downloadPDF = async () => {
    setError("");
    try {
      const canvas = await buildCanvas(4);
      const img = canvas.toDataURL("image/png", 1);
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: [86, 54] });
      pdf.addImage(img, "PNG", 0, 0, 86, 54);
      pdf.save(`${currentUser.memberId}-id-card.pdf`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "PDF export failed");
    }
  };

  const printCard = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    buildCanvas(3).then((canvas) => {
      w.document.write(`<html><head><title>${currentUser.memberId} - ID Card</title><style>body{margin:0;display:flex;justify-content:center;align-items:center;height:100vh;background:#F8FAFC}</style></head><body><img src="${canvas.toDataURL("image/png")}" style="width:420px;height:260px" /></body></html>`);
      w.document.close();
      setTimeout(() => { w.print(); w.close(); }, 600);
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Digital Member ID Card</h1>
        <p className="text-sm text-slate-500">Your personal Sociapi Society credential. Download as PDF/PNG or print.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex justify-center">
          {/* Card */}
          <div
            style={{ width: 420, minHeight: 260 }}
            className="relative overflow-hidden rounded-3xl shadow-2xl text-white"
          >
            {/* Gradient background */}
            <div className="absolute inset-0" style={{
              background: "linear-gradient(135deg, #111827 0%, #14B8A6 58%, #F97316 100%)",
            }} />
            {/* Decorative orbs */}
            <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-white/15 blur-2xl" />
            <div className="absolute -bottom-16 -left-16 w-44 h-44 rounded-full bg-amber-300/20 blur-2xl" />
            {/* Pattern */}
            <svg className="absolute inset-0 opacity-10" width="100%" height="100%">
              <defs>
                <pattern id="pat" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1" fill="white" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#pat)" />
            </svg>

            <div className="relative p-5 h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-xl bg-white/20 ring-1 ring-white/30 flex items-center justify-center backdrop-blur">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-bold leading-none tracking-tight">SOCIAPI</p>
                    <p className="text-[10px] uppercase tracking-[0.2em] opacity-90">Society ERP · Member</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-widest opacity-80">Year</p>
                  <p className="font-bold text-sm">2026</p>
                </div>
              </div>

              {/* Body */}
              <div className="mt-4 flex items-center gap-4">
                <div className="rounded-2xl bg-white/15 ring-1 ring-white/30 p-1 backdrop-blur">
                  <div style={{ width: 72, height: 72, borderRadius: 999, background: "linear-gradient(135deg,#111827,#14B8A6)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 26 }}>
                    {initials}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-widest opacity-80">Name</p>
                  <p className="font-bold text-lg leading-tight truncate">{currentUser.name}</p>
                  <p className="text-xs opacity-90 truncate">{currentUser.position}</p>
                  <p className="text-xs opacity-90 truncate">{currentUser.department} Department</p>
                </div>
                <div className="bg-white p-1.5 rounded-xl shadow-md shrink-0">
                  {qr ? (
                    <img src={qr} alt="QR Code" width={72} height={72} />
                  ) : (
                    <div className="h-[72px] w-[72px] bg-slate-200 animate-pulse rounded-lg" />
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="mt-auto pt-4 grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <p className="uppercase tracking-widest opacity-70">Member ID</p>
                  <p className="font-bold text-xs">{currentUser.memberId}</p>
                </div>
                <div>
                  <p className="uppercase tracking-widest opacity-70">Joined</p>
                  <p className="font-bold text-xs">{new Date(currentUser.joinDate).toLocaleDateString(undefined, { month: "short", year: "numeric" })}</p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-[9px] opacity-80">
                <span>linktr.ee/sociapisociety</span>
                <span>Authorized credential — non-transferable</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <Card className="p-6 h-fit">
          <h3 className="font-semibold mb-1">Card Actions</h3>
          <p className="text-xs text-slate-500 mb-4">Generate a printable copy of your credential.</p>
          <div className="space-y-2">
            <Button className="w-full justify-start" icon={<FileImage className="h-4 w-4" />} onClick={downloadPNG}>Download PNG</Button>
            <Button className="w-full justify-start" variant="outline" icon={<Download className="h-4 w-4" />} onClick={downloadPDF}>Download PDF</Button>
            <Button className="w-full justify-start" variant="ghost" icon={<Printer className="h-4 w-4" />} onClick={printCard}>Print Card</Button>
          </div>
          {error && <p className="text-xs text-red-600 mt-3">{error}</p>}
          <hr className="my-4 border-slate-200 dark:border-white/10" />
          <h4 className="text-sm font-semibold mb-2">Your QR Payload</h4>
          <pre className="text-[10px] font-mono p-3 rounded-lg bg-slate-100 dark:bg-white/5 overflow-x-auto whitespace-pre-wrap break-all">
{JSON.stringify({ memberId: currentUser.memberId, specialNumber: currentUser.specialNumber, name: currentUser.name, org: "Sociapi Society ERP" }, null, 2)}
          </pre>
          <p className="text-xs text-slate-500 mt-3">Show this QR at any Sociapi event for instant attendance.</p>
        </Card>
      </div>
    </div>
  );
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
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
