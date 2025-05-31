import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { supabase, FileItem } from '../../lib/supabase';
import { Loader2 } from 'lucide-react';

interface FilePreviewModalProps {
  file: FileItem | null;
  open: boolean;
  onClose: () => void;
}

export function FilePreviewModal({ file, open, onClose }: FilePreviewModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file || file.type !== 'file') {
      setPreviewUrl(null);
      return;
    }
    setLoading(true);
    setError(null);
    supabase.storage.from('files').download(file.path)
      .then(({ data, error }) => {
        if (error || !data) {
          setError('Failed to load preview');
          setPreviewUrl(null);
        } else {
          setPreviewUrl(URL.createObjectURL(data));
        }
      })
      .catch(() => setError('Failed to load preview'))
      .finally(() => setLoading(false));
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line
  }, [file]);

  if (!file) return null;

  const isImage = file.mime_type?.startsWith('image/');
  const isPdf = file.mime_type === 'application/pdf';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-minecraft text-lg">{file.name}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          {loading && <Loader2 className="animate-spin w-8 h-8 text-muted-foreground" />}
          {error && <div className="text-destructive font-mono">{error}</div>}
          {!loading && !error && previewUrl && (
            isImage ? (
              <img
                src={previewUrl}
                alt={file.name}
                className="max-h-96 max-w-full rounded shadow border"
                style={{ imageRendering: 'pixelated' }}
              />
            ) : isPdf ? (
              <iframe
                src={previewUrl}
                title={file.name}
                className="w-full h-96 border rounded"
              />
            ) : (
              <div className="text-muted-foreground font-mono">No preview available for this file type.</div>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
