// Sistema de Toast global — dispara eventos customizados escutados pelo ToastContainer
const TOAST_EVENT = 'app:toast';

const toast = (message, type = 'success', duration = 3500) => {
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, {
    detail: { message, type, duration, id: Date.now() + Math.random() }
  }));
};

toast.success = (msg, dur) => toast(msg, 'success', dur);
toast.error   = (msg, dur) => toast(msg, 'error', dur);
toast.info    = (msg, dur) => toast(msg, 'info', dur);
toast.warning = (msg, dur) => toast(msg, 'warning', dur);

export { TOAST_EVENT };
export default toast;
