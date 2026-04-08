import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import type { Project } from '../data/mockData';
import { buildInvestmentMapPayload, InvestmentMapLanguage } from '../utils/investmentMap';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';

interface InvestmentMapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Project[];
  language: InvestmentMapLanguage;
  title: string;
  description: string;
  detailBasePath?: string;
}

export function InvestmentMapModal({
  open,
  onOpenChange,
  projects,
  language,
  title,
  description,
  detailBasePath = '/investor/project',
}: InvestmentMapModalProps) {
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const payload = useMemo(
    () => buildInvestmentMapPayload(projects, language, detailBasePath),
    [detailBasePath, language, projects],
  );

  useEffect(() => {
    if (!open || !iframeLoaded || !iframeRef.current?.contentWindow) {
      return;
    }

    iframeRef.current.contentWindow.postMessage(payload, window.location.origin);
  }, [iframeLoaded, open, payload]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data?.type !== 'HCMINVESTMENT_MAP_VIEW_PROJECT' || typeof event.data.projectId !== 'string') {
        return;
      }

      onOpenChange(false);
      navigate(`${detailBasePath}/${event.data.projectId}`);
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [detailBasePath, navigate, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[92vh] w-[96vw] max-w-[96vw] flex-col gap-0 overflow-hidden rounded-none border border-slate-200 p-0 sm:max-w-[96vw]">
        <DialogHeader className="shrink-0 border-b border-slate-200 px-6 py-4 text-left">
          <DialogTitle className="text-xl font-semibold text-slate-900">{title}</DialogTitle>
          <DialogDescription className="pr-10 text-sm text-slate-600">
            {description} {projects.length > 0 ? `${projects.length} project${projects.length === 1 ? '' : 's'} in view.` : 'No projects in view.'}
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 bg-slate-100">
          <iframe
            ref={iframeRef}
            title={title}
            src="/investment-map/index.html"
            className="h-full w-full border-0"
            onLoad={() => setIframeLoaded(true)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
