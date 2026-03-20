import { useState, useRef } from 'react';
import { X, Upload, FileText, AlertCircle } from 'lucide-react';

interface ImportDialogProps {
  onImport: (file: File) => Promise<void>;
  onClose: () => void;
}

export default function ImportDialog({ onImport, onClose }: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (!selected.name.endsWith('.ged') && !selected.name.endsWith('.gedcom')) {
        setError('Please select a GEDCOM file (.ged or .gedcom)');
        setFile(null);
        return;
      }
      setFile(selected);
      setError(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      await onImport(file);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-bark-100 bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="font-serif text-xl font-semibold text-bark-800">
            Import GEDCOM
          </h3>
          <button onClick={onClose} className="btn-ghost !p-1.5">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-bark-600">
            Import a GEDCOM file (.ged) to add people and relationships to your
            tree. Most genealogy software can export in this format.
          </p>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-bark-200 bg-cream-50 p-8 transition-colors hover:border-sage-400 hover:bg-sage-50"
          >
            {file ? (
              <>
                <FileText className="h-8 w-8 text-sage-600" />
                <div className="text-center">
                  <p className="text-sm font-medium text-bark-700">
                    {file.name}
                  </p>
                  <p className="text-xs text-bark-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-bark-400" />
                <div className="text-center">
                  <p className="text-sm font-medium text-bark-700">
                    Click to select a file
                  </p>
                  <p className="text-xs text-bark-500">
                    Supports .ged and .gedcom files
                  </p>
                </div>
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".ged,.gedcom"
            onChange={handleFileSelect}
            className="hidden"
          />

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!file || loading}
              className="btn-primary flex-1"
            >
              {loading ? 'Importing...' : 'Import'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
