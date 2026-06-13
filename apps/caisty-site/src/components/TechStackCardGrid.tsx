/** Simple Icons CDN — https://simpleicons.org/ (MIT) */
export const ICON_COLORS: Record<string, string> = {
  react: "61DAFB",
  typescript: "3178C6",
  vite: "646CFF",
  tailwindcss: "06B6D4",
  nodedotjs: "339933",
  fastify: "000000",
  postgresql: "4169E1",
  stripe: "635BFF",
  paypal: "003087",
  vercel: "000000",
  hetzner: "D50C2D",
  tauri: "24C8DB",
};

export type TechStackItem = { slug: string; label: string };

export function TechStackCardGrid(props: {
  title: string;
  items: TechStackItem[];
  isLight: boolean;
  /** Smaller cells for secondary placement (e.g. company page). */
  compact?: boolean;
}) {
  const compact = props.compact ?? false;
  return (
    <div>
      {props.title ? (
        <h3
          className={`text-sm font-bold tracking-tight mb-4 ${props.isLight ? "text-slate-900" : "text-white"}`}
        >
          {props.title}
        </h3>
      ) : null}
      <div
        className={
          compact
            ? "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-2.5"
            : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
        }
      >
        {props.items.map((item) => {
          const hex = ICON_COLORS[item.slug] ?? "64748B";
          const iconSize = compact ? 22 : 32;
          const iconClass = compact ? "h-5 w-5 shrink-0" : "h-8 w-8 shrink-0";
          const pad = compact ? "px-2 py-2.5 gap-1.5" : "px-3 py-4 gap-2";
          const innerPad = compact ? "p-1.5" : "p-2";
          const labelClass = compact
            ? `text-[10px] font-semibold leading-tight ${props.isLight ? "text-slate-800" : "text-slate-200"}`
            : `text-[11px] font-semibold leading-tight ${props.isLight ? "text-slate-800" : "text-slate-200"}`;
          return (
            <div
              key={item.slug}
              className={`flex flex-col items-center justify-center rounded-xl border text-center transition-shadow ${pad} ${
                props.isLight
                  ? "border-slate-200/90 bg-white shadow-sm hover:shadow-md hover:border-slate-300"
                  : "border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.06]"
              }`}
            >
              <div className={`rounded-lg bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] ${innerPad}`}>
                <img
                  src={`https://cdn.simpleicons.org/${item.slug}/${hex}`}
                  alt=""
                  width={iconSize}
                  height={iconSize}
                  className={iconClass}
                  loading="lazy"
                />
              </div>
              <span className={labelClass}>{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
