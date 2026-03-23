import React, { useState } from 'react';

interface MediaViewerPdfProps {
  url: string;
  fileName: string;
}

export function MediaViewerPdf({ url, fileName }: MediaViewerPdfProps): React.JSX.Element {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="relative h-full w-full">
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
          <span className="text-sm text-white/50">Loading {fileName}…</span>
        </div>
      )}
      <iframe
        src={url}
        title={fileName}
        className={`h-full w-full border-0 bg-white ${isLoading ? 'invisible' : ''}`}
        onLoad={() => setIsLoading(false)}
      />
    </div>
  );
}
