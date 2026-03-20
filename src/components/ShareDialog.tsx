import { useState } from 'react';
import { X, Link2, Copy, Check, RefreshCw, Unlink } from 'lucide-react';
import toast from 'react-hot-toast';

interface ShareDialogProps {
  shareId: string | null;
  onGenerateLink: () => Promise<string>;
  onRevokeLink: () => Promise<void>;
  onClose: () => void;
}

export default function ShareDialog({
  shareId,
  onGenerateLink,
  onRevokeLink,
  onClose,
}: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const shareUrl = shareId
    ? `${window.location.origin}/share/${shareId}`
    : null;

  const handleCopy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      await onGenerateLink();
      toast.success('Share link created');
    } catch {
      toast.error('Failed to create share link');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    setLoading(true);
    try {
      await onRevokeLink();
      toast.success('Share link revoked');
    } catch {
      toast.error('Failed to revoke share link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-bark-100 bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="font-serif text-xl font-semibold text-bark-800">
            Share Tree
          </h3>
          <button onClick={onClose} className="btn-ghost !p-1.5">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="mb-2 text-sm font-medium text-bark-700">
              Read-only Link
            </h4>
            <p className="mb-3 text-xs text-bark-500">
              Anyone with this link can view your family tree without needing to sign in.
            </p>
          </div>

          {shareUrl ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg border border-bark-200 bg-cream-50 p-3">
                <Link2 className="h-4 w-4 shrink-0 text-sage-600" />
                <span className="flex-1 truncate text-sm text-bark-700">
                  {shareUrl}
                </span>
                <button
                  onClick={handleCopy}
                  className="btn-ghost !p-1.5"
                  title="Copy link"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-sage-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="btn-secondary flex-1"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                  Regenerate
                </button>
                <button
                  onClick={handleRevoke}
                  disabled={loading}
                  className="btn-ghost flex-1 text-red-600 hover:bg-red-50"
                >
                  <Unlink className="h-3.5 w-3.5" />
                  Revoke
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="btn-primary w-full"
            >
              <Link2 className="h-4 w-4" />
              {loading ? 'Generating...' : 'Generate Share Link'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
