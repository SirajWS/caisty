/** Simple Icons CDN — https://simpleicons.org/ (MIT) */
export const ICON_COLORS: Record<string, string> = {
  react: "61DAFB",
  typescript: "3178C6",
  vite: "646CFF",
  tailwindcss: "06B6D4",
  nodedotjs: "339933",
  fastify: "000000",
  postgresql: "4169E1",
  docker: "2496ED",
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
  isLight?: boolean;
  compact?: boolean;
}) {
  const compact = props.compact ?? false;
  return (
    <div>
      {props.title ? (
        <h3 className="text-sm font-bold tracking-tight mb-4 m-0" style={{ color: "var(--mkt-text)" }}>
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
          const innerPad = compact ? "p-1.5" : "p-2";
          return (
            <div key={item.slug} className="mkt-tech-card">
              <div
                className={`rounded-lg ${innerPad}`}
                style={{ background: "var(--mkt-bg-elevated)", boxShadow: "inset 0 1px 2px color-mix(in srgb, var(--mkt-text) 6%, transparent)" }}
              >
                <img
                  src={`https://cdn.simpleicons.org/${item.slug}/${hex}`}
                  alt=""
                  width={iconSize}
                  height={iconSize}
                  className={iconClass}
                  loading="lazy"
                />
              </div>
              <span>{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
