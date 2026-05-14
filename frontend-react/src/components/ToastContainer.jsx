import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { TOAST_EVENT } from '../utils/toast';

const ICONS = {
  success: { Icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', bar: 'bg-emerald-500' },
  error:   { Icon: XCircle,      color: 'text-rose-400',    bg: 'bg-rose-500/10 border-rose-500/20',       bar: 'bg-rose-500' },
  warning: { Icon: AlertTriangle, color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20',     bar: 'bg-amber-500' },
  info:    { Icon: Info,          color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20',       bar: 'bg-blue-500' },
};

const ToastItem = ({ id, message, type, duration, onRemove }) => {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const { Icon, color, bg, bar } = ICONS[type] || ICONS.info;

  const dismiss = useCallback(() => {
    setLeaving(true);
    setTimeout(() => onRemove(id), 300);
  }, [id, onRemove]);

  useEffect(() => {
    // Entrada
    const t1 = setTimeout(() => setVisible(true), 10);
    // Auto saída
    const t2 = setTimeout(dismiss, duration);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [dismiss, duration]);

  return (
    <div
      className={`
        relative flex items-start gap-3 w-80 max-w-full rounded-2xl border px-4 py-3.5 shadow-2xl
        backdrop-blur-sm overflow-hidden cursor-pointer select-none
        transition-all duration-300
        ${bg}
        ${visible && !leaving ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}
      `}
      onClick={dismiss}
    >
      <Icon size={18} className={`${color} flex-shrink-0 mt-0.5`} />
      <p className="text-xs font-bold text-brand-text flex-1 leading-relaxed">{message}</p>
      <button className="text-brand-muted hover:text-brand-text transition-colors flex-shrink-0">
        <X size={14} />
      </button>
      {/* Barra de progresso */}
      <div
        className={`absolute bottom-0 left-0 h-[2px] ${bar} opacity-60`}
        style={{
          animation: `toast-progress ${duration}ms linear forwards`,
        }}
      />
      <style>{`
        @keyframes toast-progress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
};

const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    const handler = (e) => {
      setToasts(prev => [...prev.slice(-4), e.detail]); // máx 5 toasts visíveis
    };
    window.addEventListener(TOAST_EVENT, handler);
    return () => window.removeEventListener(TOAST_EVENT, handler);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 items-end">
      {toasts.map(t => (
        <ToastItem key={t.id} {...t} onRemove={removeToast} />
      ))}
    </div>
  );
};

export default ToastContainer;
