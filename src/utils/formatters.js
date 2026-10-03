// Currency and Date formatting utilities for Anusha Enterprises CRM

export const roundCurrency = (val) => Math.round((Number(val) || 0) * 100) / 100;

export const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  const hasDecimals = Math.abs(num % 1) > 0.0001;
  return '₹' + num.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: hasDecimals ? 2 : 0
  });
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

export const formatDateTime = (dateStr, timeStr) => {
  const d = formatDate(dateStr);
  if (!timeStr) return d;
  return `${d} at ${timeStr}`;
};

export const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getCurrentTimeString = () => {
  const now = new Date();
  return now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

export const generateId = (prefix = 'TXN') => {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${rand}`;
};
