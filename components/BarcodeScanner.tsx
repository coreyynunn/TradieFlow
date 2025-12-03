// @ts-nocheck
"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

type BarcodeScannerProps = {
  onResult: (code: string) => void;
  onClose: () => void;
};

export default function BarcodeScanner({ onResult, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    let cancelled = false;

    async function start() {
      try {
        const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
        const deviceId = videoInputDevices[0]?.deviceId;

        await codeReader.decodeFromVideoDevice(
          deviceId || undefined,
          videoRef.current!,
          (result, err) => {
            if (cancelled) return;
            if (result) {
              const code = result.getText();
              if (code) {
                onResult(code);
                cancelled = true;
                codeReader.reset();
                onClose();
              }
            }
          }
        );
      } catch (e: any) {
        console.error(e);
        setError("Could not access camera. Check permissions and HTTPS.");
      }
    }

    start();

    return () => {
      cancelled = true;
      codeReader.reset();
    };
  }, [onResult, onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center">
      <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-semibold text-neutral-50">Scan barcode</h2>
          <button
            onClick={onClose}
            className="text-xs text-neutral-400 hover:text-neutral-200"
          >
            Close
          </button>
        </div>

        {error && (
          <div className="text-xs text-red-400 bg-red-950/40 border border-red-500/40 px-2 py-1 rounded">
            {error}
          </div>
        )}

        <div className="rounded-lg overflow-hidden border border-neutral-800">
          <video
            ref={videoRef}
            style={{ width: "100%", height: "auto" }}
            muted
            playsInline
          />
        </div>

        <p className="text-[11px] text-neutral-400">
          Point the camera at the barcode and hold steady for a moment.
        </p>
      </div>
    </div>
  );
}
