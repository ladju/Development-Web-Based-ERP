import React from 'react';
import { ErpAlert } from '../types/footwear';
import { AlertTriangle, AlertCircle, Info, ChevronRight, X } from 'lucide-react';

interface AlertBannerProps {
  alerts: ErpAlert[];
  onSelectAlert: (alert: ErpAlert) => void;
  onDismissAlert?: (alertId: string) => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  alerts,
  onSelectAlert,
  onDismissAlert,
}) => {
  if (alerts.length === 0) return null;

  // Show up to 2 top alerts in the banner bar
  const topAlert = alerts[0];
  const moreCount = alerts.length - 1;

  const getIcon = (type: ErpAlert['type']) => {
    switch (type) {
      case 'critical':
        return <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-sky-400 shrink-0" />;
    }
  };

  const getContainerBg = (type: ErpAlert['type']) => {
    switch (type) {
      case 'critical':
        return 'bg-red-950/40 border-red-800/60 text-red-200';
      case 'warning':
        return 'bg-amber-950/40 border-amber-800/60 text-amber-200';
      default:
        return 'bg-sky-950/40 border-sky-800/60 text-sky-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3">
      <div
        className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg border text-xs sm:text-sm ${getContainerBg(
          topAlert.type
        )} shadow-sm`}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          {getIcon(topAlert.type)}
          <div className="truncate">
            <span className="font-semibold text-white mr-1.5">{topAlert.title}:</span>
            <span className="text-slate-300">{topAlert.message}</span>
          </div>
          {moreCount > 0 && (
            <span className="shrink-0 text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-900/80 border border-slate-700 text-slate-300">
              +{moreCount} more risks
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onSelectAlert(topAlert)}
            className="flex items-center gap-1 font-semibold text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer text-xs"
          >
            <span>{topAlert.actionText || 'Investigate'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          {onDismissAlert && (
            <button
              onClick={() => onDismissAlert(topAlert.id)}
              aria-label="Dismiss alert"
              className="text-slate-400 hover:text-slate-200 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
