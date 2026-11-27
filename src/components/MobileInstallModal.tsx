import React, { useState } from 'react';
import { 
  Smartphone, 
  Download, 
  Share2, 
  PlusSquare, 
  CheckCircle2, 
  Copy, 
  Check, 
  X, 
  Sparkles, 
  RefreshCw, 
  ArrowRight,
  ShieldCheck,
  ExternalLink,
  PackageCheck,
  FileCode2,
  Trash2,
  HelpCircle,
  AlertCircle,
  Layers,
  Terminal
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface MobileInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDataManagement?: () => void;
}

export const MobileInstallModal: React.FC<MobileInstallModalProps> = ({
  isOpen,
  onClose,
  onOpenDataManagement,
}) => {
  const { isInstallable, isInstalled, isIOS, isMobileDevice, install } = usePWAInstall();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'alpha' | 'apk' | 'ios' | 'faq'>('alpha');

  if (!isOpen) return null;

  const sharedProductionUrl = 'https://ais-pre-kzg2v6ihofavopv3dxp4mz-283826552234.asia-southeast1.run.app';
  const effectiveUrl = typeof window !== 'undefined' && window.location.href.includes('ais-pre-')
    ? window.location.href
    : sharedProductionUrl;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(effectiveUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      onClose();
    }
  };

  const pwaBuilderUrl = `https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(effectiveUrl)}`;

  // Generate a QR code API URL to make it super easy for desktop users to scan with their phone
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    effectiveUrl
  )}&bgcolor=0f-17-2a&color=34-d3-99&margin=6`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950/50 via-slate-900 to-slate-900 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Mobile Alpha Testing Guide
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Android & iOS
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Install as a full native app on your phone in seconds
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Clear Data Quick Banner */}
        {onOpenDataManagement && (
          <div className="mx-4 mt-3 p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-rose-300">
              <Trash2 className="w-4 h-4 shrink-0 text-rose-400" />
              <span>Alpha testing with your own data?</span>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenDataManagement();
              }}
              className="px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] shadow-sm transition active:scale-95 shrink-0"
            >
              Wipe Dummy Records
            </button>
          </div>
        )}

        {/* Status Notification if already installed */}
        {isInstalled && (
          <div className="mx-4 mt-2 p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>PaisaPulse is already installed as a standalone app on this device!</span>
          </div>
        )}

        {/* Tab Selection */}
        <div className="grid grid-cols-4 gap-1 p-1.5 mx-4 mt-3 bg-slate-950/60 rounded-2xl border border-slate-800/60 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('alpha')}
            className={`py-2 px-1 rounded-xl transition flex items-center justify-center gap-1 text-[11px] sm:text-xs ${
              activeTab === 'alpha'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Instant Mobile</span>
          </button>
          <button
            onClick={() => setActiveTab('apk')}
            className={`py-2 px-1 rounded-xl transition flex items-center justify-center gap-1 text-[11px] sm:text-xs ${
              activeTab === 'apk'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>APK Info</span>
          </button>
          <button
            onClick={() => setActiveTab('ios')}
            className={`py-2 px-1 rounded-xl transition flex items-center justify-center gap-1 text-[11px] sm:text-xs ${
              activeTab === 'ios'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>iPhone</span>
          </button>
          <button
            onClick={() => setActiveTab('faq')}
            className={`py-2 px-1 rounded-xl transition flex items-center justify-center gap-1 text-[11px] sm:text-xs ${
              activeTab === 'faq'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>FAQ</span>
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-sm text-slate-300">
          {/* TAB 1: INSTANT ALPHA TESTING ON MOBILE (100% RELIABLE) */}
          {activeTab === 'alpha' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs sm:text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>The Easiest & Best Way to Alpha Test on Mobile</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  You <strong className="text-white">do not need any external converter or builder</strong>. Chrome on Android has a built-in APK engine called <strong className="text-emerald-300">WebAPK</strong>. In 10 seconds, it installs PaisaPulse as a standalone app directly into your phone’s App Drawer!
                </p>
              </div>

              {isInstallable && (
                <div className="p-3 rounded-2xl bg-emerald-950/50 border border-emerald-500/30 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <Sparkles className="w-4 h-4" />
                    <span>One-Tap Install Ready!</span>
                  </div>
                  <button
                    onClick={handleInstallClick}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/25 transition active:scale-98 flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Install App on this Phone Now
                  </button>
                </div>
              )}

              <div className="space-y-2.5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Step-by-step for Android (Chrome / Brave / Samsung)
                </h4>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div className="w-6 h-6 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs mt-0.5">
                    1
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-white">Open this URL in Chrome on your Android mobile</span>
                    <div className="mt-1 flex items-center gap-2">
                      <input 
                        type="text" 
                        readOnly 
                        value={effectiveUrl} 
                        className="flex-1 bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-1 text-[11px] font-mono text-slate-300 select-all"
                      />
                      <button
                        onClick={handleCopyLink}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-medium flex items-center gap-1 shrink-0"
                      >
                        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div className="w-6 h-6 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs mt-0.5">
                    2
                  </div>
                  <div className="text-xs space-y-1">
                    <span className="font-bold text-white">Tap Chrome's 3 dots menu (⋮) at top-right</span>
                    <p className="text-slate-400">
                      Tap <strong className="text-emerald-400">"Install app"</strong> (or "Add to Home screen").
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div className="w-6 h-6 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs mt-0.5">
                    3
                  </div>
                  <div className="text-xs space-y-1">
                    <span className="font-bold text-white">Enjoy full native app experience!</span>
                    <p className="text-slate-400">
                      It gets its own home screen icon, splash screen, and full-screen view (no browser address bar).
                    </p>
                  </div>
                </div>
              </div>

              {/* QR Code section for desktop users */}
              {!isMobileDevice && (
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row items-center gap-4">
                  <div className="p-2 bg-slate-900 rounded-xl border border-slate-800 shrink-0">
                    <img 
                      src={qrCodeUrl} 
                      alt="Scan to open on phone" 
                      className="w-24 h-24 rounded-lg"
                      loading="lazy"
                    />
                  </div>
                  <div className="space-y-1.5 text-center sm:text-left flex-1">
                    <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-emerald-400">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Scan with Your Phone Camera</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Point your Android camera at this code to immediately open the link in Chrome.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: WHY PWABUILDER FAILED & REAL APK OPTIONS */}
          {activeTab === 'apk' && (
            <div className="space-y-4">
              {/* Explanation of why CLI / PWABuilder hits Google Login */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Why Did Bubblewrap / PWABuilder Return Unexpected &lt;?</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  The <code className="text-amber-300 font-mono text-[11px]">ais-pre-*.run.app</code> preview environment is hosted inside Google AI Studio with platform-level Identity-Aware Proxy (IAP) protection. When external CLI tools (<code className="text-amber-300 font-mono text-[11px]">curl</code>, <code className="text-amber-300 font-mono text-[11px]">bubblewrap</code>) call the URL without Google account cookies, Cloud Run redirects to an HTML Google login page (<code className="text-amber-300 font-mono text-[11px]">&lt;html&gt;...</code>).
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>Fix for Bubblewrap CLI (Bypass the Cloud Run Lock)</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Instead of fetching the manifest across the authenticated network, generate the TWA directly on your machine in <code className="text-slate-200 font-mono">/var/www/ai</code> using either method below:
                </p>

                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                    <span>Option A: Run local server for Bubblewrap (Fastest)</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-xl font-mono text-[11px] text-emerald-300 border border-slate-800 space-y-1 overflow-x-auto">
                    <div># 1. Clean the invalid HTML file</div>
                    <div>rm -f manifest.json</div>
                    <div># 2. Write valid manifest file</div>
                    <div>cat &lt;&lt; 'EOF' &gt; manifest.json</div>
                    <div>&#123;</div>
                    <div>&nbsp;&nbsp;"name": "PaisaPulse",</div>
                    <div>&nbsp;&nbsp;"short_name": "PaisaPulse",</div>
                    <div>&nbsp;&nbsp;"start_url": "{effectiveUrl}/",</div>
                    <div>&nbsp;&nbsp;"scope": "{effectiveUrl}/",</div>
                    <div>&nbsp;&nbsp;"display": "standalone",</div>
                    <div>&nbsp;&nbsp;"background_color": "#020617",</div>
                    <div>&nbsp;&nbsp;"theme_color": "#0f172a",</div>
                    <div>&nbsp;&nbsp;"icons": [&#123;"src": "https://img.icons8.com/color/512/wallet.png", "sizes": "512x512", "type": "image/png"&#125;]</div>
                    <div>&#125;</div>
                    <div>EOF</div>
                    <div># 3. Serve it on localhost:8080</div>
                    <div>python3 -m http.server 8080 &amp;</div>
                    <div># 4. Bubblewrap now reads the valid JSON cleanly!</div>
                    <div>bubblewrap init --manifest="http://localhost:8080/manifest.json"</div>
                    <div>bubblewrap build</div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <div className="text-[11px] font-bold text-teal-400 flex items-center gap-1.5">
                    <span>Option B: Direct twa-manifest.json (No web server needed)</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Create <code className="text-teal-300 font-mono">twa-manifest.json</code> directly in your terminal, then run <code className="text-teal-300 font-mono">bubblewrap build</code> to generate the APK immediately without running <code className="text-teal-300 font-mono">init</code>.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span>Alternative: Android's Native WebAPK (No CLI or SDK Needed)</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  When you open the app link in Chrome on your phone while logged into your Google account, Chrome has access to the authenticated session and will compile an actual native APK directly onto your phone when you tap <strong className="text-white">"Install app"</strong>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <ExternalLink className="w-4 h-4 text-indigo-400" />
                  <span>Public Alpha Testing (Zero Google Login for Testers)</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  If you want other testers to open the app or download the APK without needing Google AI Studio access, deploy the built frontend (<code className="text-indigo-300 font-mono">npm run build</code>) to a 100% public free host like <strong className="text-white">Firebase Hosting</strong> or <strong className="text-white">Vercel</strong>.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: IOS / IPHONE */}
          {activeTab === 'ios' && (
            <div className="space-y-3">
              <h3 className="font-semibold text-white text-xs uppercase tracking-wider text-slate-400">
                How to install on iPhone & iPad (Safari)
              </h3>

              <div className="space-y-2.5">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950/50 border border-slate-800">
                  <div className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-white">Open in Safari</span>
                    <p className="text-slate-400 mt-0.5">
                      Ensure you open the link inside iOS Safari.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950/50 border border-slate-800">
                  <div className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center shrink-0 text-xs">
                    <Share2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-white">Tap the Share button</span>
                    <p className="text-slate-400 mt-0.5">
                      At the bottom bar of Safari, tap the Share icon.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950/50 border border-slate-800">
                  <div className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center shrink-0 text-xs">
                    <PlusSquare className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-white">Tap "Add to Home Screen"</span>
                    <p className="text-slate-400 mt-0.5">
                      Select Add to Home Screen, then tap Add.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PUBLISH & FUTURE CHANGES FAQ */}
          {activeTab === 'faq' && (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Should we need to publish to Google Play Store?
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  <strong className="text-white">No, publishing is 100% optional!</strong> You can use and test the app completely privately on your device. Publishing to the Play Store is only necessary if you want random strangers on the internet to search for and download your app.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5 text-xs">
                  <RefreshCw className="w-4 h-4 text-emerald-400" />
                  How do future changes and updates work?
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  The app is equipped with an automated service worker cache. Whenever code updates are made, the moment you open the app on your phone, it <strong className="text-white">updates itself seamlessly in the background</strong>. You never need to reinstall.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5 text-xs">
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  What about the pre-filled demo data?
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Tap the red <strong className="text-rose-400">Clean Slate</strong> button in the top bar to wipe all sample transactions, sample loans, and sample RDs to zero so you can start with a fresh slate.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <button
            onClick={handleCopyLink}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium flex items-center gap-1.5 transition active:scale-95"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Link Copied' : 'Copy App Link'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition active:scale-95 shadow-sm shadow-emerald-500/20"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
