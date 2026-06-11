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

export function TechStackCardGrid(props: { title: string; items: TechStackItem[]; isLight: boolean }) {
  return (
    <div>
      {props.title ? (
        <h3
          className={`text-sm font-bold tracking-tight mb-4 ${props.isLight ? "text-slate-900" : "text-white"}`}
        >
          {props.title}
        </h3>
      ) : null}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {props.items.map((item) => {
          const hex = ICON_COLORS[item.slug] ?? "64748B";
          return (
            <div
              key={item.slug}
              className={`flex flex-col items-center justify-center gap-2 rounded-xl border px-3 py-4 text-center transition-shadow ${
                props.isLight
                  ? "border-slate-200/90 bg-white shadow-sm hover:shadow-md hover:border-slate-300"
                  : "border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.06]"
              }`}
            >
              <div className="rounded-lg bg-white p-2 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)]">
                <img
                  src={`https://cdn.simpleicons.org/${item.slug}/${hex}`}
                  alt=""
                  width={32}
                  height={32}
                  className="h-8 w-8 shrink-0"
                  loading="lazy"
                />
              </div>
              <span className={`text-[11px] font-semibold leading-tight ${props.isLight ? "text-slate-800" : "text-slate-200"}`}>
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
