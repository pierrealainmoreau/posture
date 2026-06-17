"use client";

import { useRef, useState } from "react";
import QRCode from "react-qr-code";
import { Copy, CheckCheck, Download } from "lucide-react";

// react-qr-code renders a class component; grab the SVG via a wrapper div ref.

interface QRShareProps {
  url: string;
  label?: string;
  filename?: string;
  /** Tailwind bg + border classes for both blocks */
  wrapperCls?: string;
  /** Tailwind text classes for labels */
  labelCls?: string;
  /** Tailwind text classes for the URL display */
  urlCls?: string;
  /** Full Tailwind classes for the copy button */
  copyBtnCls?: string;
}

export function QRShare({
  url,
  label = "Lien de partage",
  filename = "qrcode",
  wrapperCls = "bg-gray-50 dark:bg-gray-900/40 border-gray-200 dark:border-gray-700",
  labelCls = "text-gray-600 dark:text-gray-400",
  urlCls = "text-gray-800 dark:text-gray-200",
  copyBtnCls = "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700",
}: QRShareProps) {
  const qrWrapperRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  function copyLink() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function downloadJpg() {
    const svgEl = qrWrapperRef.current?.querySelector("svg");
    if (!svgEl) return;

    const svgStr = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgStr], { type: "image/svg+xml" });
    const objectUrl = URL.createObjectURL(blob);

    const img = new Image();
    img.onload = () => {
      const size = 600;
      const pad = 48;
      const canvas = document.createElement("canvas");
      canvas.width = size + pad * 2;
      canvas.height = size + pad * 2;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, pad, pad, size, size);
      URL.revokeObjectURL(objectUrl);
      const a = document.createElement("a");
      a.download = `${filename}.jpg`;
      a.href = canvas.toDataURL("image/jpeg", 0.95);
      a.click();
    };
    img.src = objectUrl;
  }

  return (
    <div className="flex flex-col gap-3">

      {/* ── Bloc 1 : QR code ───────────────────────────────────────────── */}
      <div className={`border rounded-2xl px-5 py-4 flex flex-col items-center gap-3 ${wrapperCls}`}>
        <p className={`text-xs font-semibold self-start ${labelCls}`}>
          QR Code à scanner
        </p>
        <div ref={qrWrapperRef} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <QRCode
            value={url}
            size={140}
            level="M"
            style={{ display: "block" }}
          />
        </div>
        <button
          onClick={downloadJpg}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          <Download size={12} />
          Enregistrer en .jpg
        </button>
      </div>

      {/* ── Bloc 2 : lien à copier ──────────────────────────────────────── */}
      <div className={`border rounded-2xl px-5 py-4 ${wrapperCls}`}>
        <p className={`text-xs font-semibold mb-2 ${labelCls}`}>{label}</p>
        <div className="flex items-center gap-2">
          <span className={`flex-1 text-xs font-mono truncate ${urlCls}`}>
            {url}
          </span>
          <button
            onClick={copyLink}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors ${copyBtnCls}`}
          >
            {copied ? (
              <CheckCheck size={12} className="text-emerald-500" />
            ) : (
              <Copy size={12} />
            )}
            {copied ? "Copié !" : "Copier le lien"}
          </button>
        </div>
      </div>

    </div>
  );
}
