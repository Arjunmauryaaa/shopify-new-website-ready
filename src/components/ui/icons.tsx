type P = { className?: string };
const base = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

export const SearchIcon = ({ className }: P) => (
  <svg {...base} className={className}><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></svg>
);
export const BagIcon = ({ className }: P) => (
  <svg {...base} className={className}><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></svg>
);
export const CloseIcon = ({ className }: P) => (
  <svg {...base} className={className}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
export const MenuIcon = ({ className }: P) => (
  <svg {...base} className={className}><path d="M4 8h16M4 16h16" /></svg>
);
export const HeartIcon = ({ className, filled }: P & { filled?: boolean }) => (
  <svg {...base} className={className} fill={filled ? "currentColor" : "none"}><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" /></svg>
);
export const ArrowIcon = ({ className }: P) => (
  <svg {...base} className={className}><path d="M5 12h14m-5-5 5 5-5 5" /></svg>
);
export const ChevronIcon = ({ className }: P) => (
  <svg {...base} className={className}><path d="m6 9 6 6 6-6" /></svg>
);
export const HomeIcon = ({ className }: P) => (
  <svg {...base} className={className}><path d="M4 11 12 4l8 7v9h-5v-6H9v6H4v-9Z" /></svg>
);
export const GridIcon = ({ className }: P) => (
  <svg {...base} className={className}><rect x="4" y="4" width="6.5" height="6.5" /><rect x="13.5" y="4" width="6.5" height="6.5" /><rect x="4" y="13.5" width="6.5" height="6.5" /><rect x="13.5" y="13.5" width="6.5" height="6.5" /></svg>
);
export const SunIcon = ({ className }: P) => (
  <svg {...base} className={className}><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" /></svg>
);
export const MoonIcon = ({ className }: P) => (
  <svg {...base} className={className}><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" /></svg>
);
