// client/src/components/layout/InstallPrompt.jsx

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Download, X } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`User response to install prompt: ${outcome}`);
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('installPromptDismissed', 'true');
  };

  // Don't show if user previously dismissed
  if (localStorage.getItem('installPromptDismissed') === 'true') {
    return null;
  }

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Alert className="shadow-lg border-2 border-blue-500">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Download className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold">Install Bekhal POS</h3>
            </div>
            <AlertDescription>
              Install this app on your device for quick access and offline support!
            </AlertDescription>
            <div className="flex space-x-2 mt-3">
              <Button onClick={handleInstall} size="sm">
                Install
              </Button>
              <Button onClick={handleDismiss} variant="outline" size="sm">
                Not Now
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Alert>
    </div>
  );
}