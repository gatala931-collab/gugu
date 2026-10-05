import React, { useState } from "react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Download, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running inside standalone Android / iOS mobile app, don't show
  if (isInstalled) {
    return null;
  }

  // Android / Chromium / Desktop PWA install
  if (isInstallable) {
    return (
      <Button
        onClick={install}
        size={compact ? "sm" : "default"}
        variant="nourish"
        className="rounded-full shadow-md gap-2 font-bold"
      >
        <Smartphone className="size-4" />
        Install App
      </Button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <Button
          onClick={() => setShowIOSGuide(true)}
          size={compact ? "sm" : "default"}
          variant="outline"
          className="rounded-full gap-2 text-xs"
        >
          <Smartphone className="size-4" />
          Install on Phone
        </Button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-2xl border border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-foreground">Install Nutry AI</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="rounded-full p-1 text-muted-foreground hover:bg-muted"
                >
                  <X className="size-4" />
                </button>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                1. Tap the <strong>Share</strong> button in Safari toolbar.<br />
                2. Scroll down and tap <strong>Add to Home Screen</strong>.
              </p>
              <Button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-2xl"
              >
                Got it
              </Button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
