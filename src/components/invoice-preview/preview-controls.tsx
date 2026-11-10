"use client";

import { Button } from "@/components/ui/button";
import {
  Printer,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  FileText,
} from "lucide-react";

interface PreviewControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onPrint: () => void;
  title?: string;
}

export function PreviewControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onPrint,
  title,
}: PreviewControlsProps) {
  return (
    <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shadow-sm sticky top-0 z-20 preview-toolbar">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
        <FileText className="w-4 h-4 text-cyan-600" />
        <span className="truncate max-w-[200px] sm:max-w-xs">{title || "A4 Document Preview"}</span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
          A4 Portrait
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Zoom Controls */}
        <div className="flex items-center bg-slate-100 rounded-md p-0.5 border border-slate-200 text-xs">
          <button
            type="button"
            onClick={onZoomOut}
            className="p-1 hover:bg-white rounded text-slate-600 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="px-2 font-mono font-medium text-[11px] text-slate-700 min-w-[42px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={onZoomIn}
            className="p-1 hover:bg-white rounded text-slate-600 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onResetZoom}
            className="p-1 hover:bg-white rounded text-slate-600 transition-colors ml-0.5"
            title="Reset Zoom"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>

        {/* Print / Download Button */}
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-xs h-8"
          onClick={onPrint}
        >
          <Printer className="w-3.5 h-3.5 text-slate-600" />
          <span>Print</span>
        </Button>

        <Button
          size="sm"
          variant="brand"
          className="gap-1.5 text-xs h-8"
          onClick={onPrint}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Save as PDF</span>
        </Button>
      </div>
    </div>
  );
}
