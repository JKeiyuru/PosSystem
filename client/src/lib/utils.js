import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/* Tailwind class merge helper (shadcn) */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/* Currency formatter */
export function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return "KSh 0.00";

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 2,
  }).format(amount);
}

/* Date only formatter */
export function formatDate(date) {
  if (!date) return "";

  const d = new Date(date);
  return d.toLocaleDateString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/* Date + time formatter */
export function formatDateTime(date) {
  if (!date) return "";

  const d = new Date(date);
  return d.toLocaleString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* Debounce helper */
export function debounce(fn, delay = 300) {
  let timer;

  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(null, args);
    }, delay);
  };
}
