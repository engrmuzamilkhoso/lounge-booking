'use client';

import { Camera, CameraOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { adminPassPath, readScanInput } from '@/lib/passes/scan-input';

/** How often a video frame is checked for a QR code. */
const SCAN_INTERVAL_MS = 300;

/**
 * Minimal typing for the browser's BarcodeDetector API (Chrome/Edge on Android, Windows and
 * macOS). It is not part of TypeScript's DOM library yet.
 */
interface DetectedBarcode {
  rawValue: string;
}
interface BarcodeDetectorInstance {
  detect(source: HTMLVideoElement): Promise<DetectedBarcode[]>;
}
type BarcodeDetectorConstructor = new (options: { formats: string[] }) => BarcodeDetectorInstance;

function findBarcodeDetector(): BarcodeDetectorConstructor | null {
  const candidate: unknown = Reflect.get(window, 'BarcodeDetector');
  // A function here is the BarcodeDetector constructor described above.
  return typeof candidate === 'function' ? (candidate as BarcodeDetectorConstructor) : null;
}

type ScannerState =
  | { kind: 'idle' }
  | { kind: 'unsupported' }
  | { kind: 'starting' }
  | { kind: 'scanning'; notice: string | null }
  | { kind: 'error'; message: string };

/**
 * Scans pass QR codes with the device camera and opens the verification page. Where the browser
 * cannot read QR codes (Safari, Firefox), staff use the phone's camera app instead: the QR code
 * is a link to the same verification page.
 */
export function CameraScanner() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const [state, setState] = useState<ScannerState>({ kind: 'idle' });

  function stopCamera() {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });
    streamRef.current = null;
  }

  useEffect(() => stopCamera, []);

  async function startCamera() {
    const BarcodeDetector = findBarcodeDetector();
    if (BarcodeDetector === null) {
      setState({ kind: 'unsupported' });
      return;
    }

    setState({ kind: 'starting' });
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
    } catch {
      setState({
        kind: 'error',
        message: 'The camera could not be opened. Allow camera access for this site and try again.',
      });
      return;
    }

    streamRef.current = stream;
    const video = videoRef.current;
    if (video === null) {
      stopCamera();
      return;
    }
    video.srcObject = stream;
    await video.play();
    setState({ kind: 'scanning', notice: null });

    const detector = new BarcodeDetector({ formats: ['qr_code'] });
    let isDetecting = false;
    timerRef.current = window.setInterval(() => {
      if (isDetecting || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        return;
      }
      isDetecting = true;
      detector
        .detect(video)
        .then((barcodes) => {
          const first = barcodes[0];
          if (first === undefined) {
            return;
          }
          const scan = readScanInput(first.rawValue);
          if (scan.kind !== 'pass') {
            setState({ kind: 'scanning', notice: 'That QR code is not a Majestic lounge pass.' });
            return;
          }
          stopCamera();
          router.push(adminPassPath(scan.token));
        })
        .catch(() => {
          // A frame that cannot be read is skipped; the next one is tried.
        })
        .finally(() => {
          isDetecting = false;
        });
    }, SCAN_INTERVAL_MS);
  }

  const isCameraOn = state.kind === 'starting' || state.kind === 'scanning';

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-square w-full overflow-hidden rounded-card bg-espresso-950">
        <video
          ref={videoRef}
          muted
          playsInline
          aria-label="Camera preview"
          className={isCameraOn ? 'size-full object-cover' : 'hidden'}
        />
        {isCameraOn && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-[15%] rounded-2xl border-4 border-gold-300/90"
          />
        )}
        {!isCameraOn && (
          <div className="flex size-full flex-col items-center justify-center gap-3 p-6 text-center text-stone-300">
            <CameraOff aria-hidden className="size-10" />
            <p className="text-sm">Camera is off</p>
          </div>
        )}
      </div>

      {state.kind === 'scanning' && (
        <p role="status" className="text-center text-sm text-stone-600">
          {state.notice ?? 'Hold the QR code inside the frame.'}
        </p>
      )}
      {state.kind === 'error' && <Alert tone="error">{state.message}</Alert>}
      {state.kind === 'unsupported' && (
        <Alert tone="info" title="Use your phone's camera app">
          This browser cannot read QR codes. Open the camera app and point it at the pass: the
          verification page opens automatically. You can also use the scan box above.
        </Alert>
      )}

      {isCameraOn ? (
        <Button
          variant="secondary"
          onClick={() => {
            stopCamera();
            setState({ kind: 'idle' });
          }}
        >
          Stop camera
        </Button>
      ) : (
        <Button
          size="lg"
          icon={<Camera aria-hidden className="size-5" />}
          onClick={() => {
            void startCamera();
          }}
        >
          Scan a pass
        </Button>
      )}
    </div>
  );
}
