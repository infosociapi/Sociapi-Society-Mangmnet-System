import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Button, Card } from "../components/ui";
import { useApp } from "../context/AppContext";
import { Download, FileImage, Printer } from "lucide-react";
import jsPDF from "jspdf";

export default function IDCard() {
  const { currentUser } = useApp();
  const [qr, setQr] = useState<string>("");
  const [error, setError] = useState("");
  const cardRef = useRef<HTMLDivElement | null>(null);
  const initials = currentUser?.name.replace(/\(.+?\)/g, "").trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "SS";

  useEffect(() => {
    if (!currentUser) return;
    const url = `${window.location.origin}${window.location.pathname}#/member/${currentUser.memberId}`;
    QRCode.toDataURL(url, { width: 320, margin: 1, color: { dark: "#111827", light: "#ffffff" } }).then(setQr).catch(() => setQr(""));
  }, [currentUser]);

  if (!currentUser) return null;

  const drawCanvas = async () => {
    const w = 860;
    const h = 520;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");

    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#111827");
    grad.addColorStop(0.58, "#14B8A6");
    grad.addColorStop(1, "#F97316");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "rgba(255,255,255,0.15)";
    roundRect(ctx, 40, 140, 180, 180, 28); ctx.fill();

    if (currentUser.photoUrl) {
      try {
        const img = await loadImage(currentUser.photoUrl);
        ctx.save();
        ctx.beginPath();
        ctx.arc(130, 230, 78, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, 52, 152, 156, 156);
        ctx.restore();
      } catch {
        drawInitials(ctx, initials);
      }
    } else {
      drawInitials(ctx, initials);
    }

    ctx.fillStyle = "#fff";
    ctx.font = "bold 56px Arial";
    ctx.fillText("SOCIAPI", 190, 96);
    ctx.font = "28px Arial";
    ctx.fillText("SOCIETY ERP · MEMBER", 190, 140);
    ctx.font = "bold 30px Arial";
    ctx.fillText("2026", 730, 90);

    ctx.font = "20px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText("NAME", 280, 220);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 52px Arial";
    ctx.fillText(currentUser.name.toUpperCase(), 280, 280, 380);
    ctx.font = "26px Arial";
    ctx.fillText(currentUser.role, 280, 340);
    ctx.fillText(`${currentUser.department} · ${currentUser.position}`, 280, 392);

    if (qr) {
      const qrImg = await loadImage(qr);
      ctx.fillStyle = "#fff";
      roundRect(ctx, 658, 170, 150, 150, 24); ctx.fill();
      ctx.drawImage(qrImg, 670, 182, 126, 126);
    }

    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "20px Arial";
    ctx.fillText("MEMBER ID", 40, 430);
    ctx.font = "bold 38px Arial";
    ctx.fillStyle = "#fff";
    ctx.fillText(currentUser.memberId, 40, 480);

    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "20px Arial";
    ctx.fillText("JOINED", 610, 430);
    ctx.font = "bold 34px Arial";
    ctx.fillStyle = "#fff";
    ctx.fillText(new Date(currentUser.joinDate).toLocaleDateString(undefined, { month: "short", year: "numeric" }), 610, 480);

    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "22px Arial";
    ctx.textAlign = "center";
    ctx.fillText("linktr.ee/sociapisociety", w / 2, 505);
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
      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [860, 520] });
      pdf.addImage(img, "PNG", 0, 0, 860, 520);
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
    w.document.write(`<html><body style="margin:0;display:flex;justify-content:center;align-items:center;height:100vh;background:#0F172A"><img src="${url}" style="max-width:100%"/></body></html>`);
    w.document.close();
    setTimeout(() => { w.print(); w.close(); }, 500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Digital Member ID Card</h1>
        <p className="text-sm text-slate-500">Profile picture, secure public QR and downloadable card.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start">
        <Card className="p-6 overflow-auto">
          <div ref={cardRef} className="mx-auto w-full max-w-[860px] rounded-[34px] overflow-hidden relative p-10 text-white" style={{ background: "linear-gradient(135deg, #111827 0%, #14B8A6 58%, #F97316 100%)", minHeight: 520 }}>
            <div className="absolute left-10 top-20 h-[180px] w-[180px] rounded-[28px] bg-white/15" />
            {currentUser.photoUrl ? (
              <img src={currentUser.photoUrl} alt={currentUser.name} className="absolute left-[52px] top-[152px] h-[156px] w-[156px] rounded-full object-cover" />
            ) : (
              <div className="absolute left-[52px] top-[152px] h-[156px] w-[156px] rounded-full bg-teal-600 flex items-center justify-center text-[92px] font-bold">{initials}</div>
            )}

            <div className="text-[56px] font-bold leading-none ml-[190px] mt-2">SOCIAPI</div>
            <div className="text-[28px] ml-[190px] mt-3">SOCIETY ERP · MEMBER</div>
            <div className="absolute right-14 top-10 text-[60px] font-bold">2026</div>

            <div className="ml-[280px] mt-[130px] text-[20px] text-white/85">NAME</div>
            <div className="ml-[280px] mt-2 text-[52px] font-bold leading-none max-w-[380px] break-words">{currentUser.name.toUpperCase()}</div>
            <div className="ml-[280px] mt-8 text-[26px]">{currentUser.role}</div>
            <div className="ml-[280px] mt-4 text-[26px]">{currentUser.department} · {currentUser.position}</div>

            <div className="absolute right-[52px] top-[170px] bg-white p-3 rounded-[24px]">
              {qr ? <img src={qr} alt="Member QR" className="h-[126px] w-[126px]" /> : <div className="h-[126px] w-[126px] bg-slate-200 rounded-xl" />}
            </div>

            <div className="absolute left-10 bottom-10">
              <div className="text-[20px] text-white/85">MEMBER ID</div>
              <div className="text-[38px] font-bold">{currentUser.memberId}</div>
            </div>
            <div className="absolute right-14 bottom-10 text-right">
              <div className="text-[20px] text-white/85">JOINED</div>
              <div className="text-[34px] font-bold">{new Date(currentUser.joinDate).toLocaleDateString(undefined, { month: "short", year: "numeric" })}</div>
            </div>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[22px] text-white/85">linktr.ee/sociapisociety</div>
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

function drawInitials(ctx: CanvasRenderingContext2D, initials: string) {
  ctx.fillStyle = "#14B8A6";
  ctx.beginPath();
  ctx.arc(130, 230, 78, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "800 92px Arial";
  ctx.textAlign = "center";
  ctx.fillText(initials, 130, 258);
  ctx.textAlign = "left";
}