/** Square vector mark: stacked tiles + C only (no raster; wordmark lives in HTML at call sites). */

const ORANGE = "#FF6200";

export type CaistyLogoProps = {
  className?: string;
};

export function CaistyLogo({ className }: CaistyLogoProps) {
  return (
    <svg
      viewBox="0 0 124 126"
      className={["block shrink-0", className].filter(Boolean).join(" ")}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Caisty"
    >
      <title>Caisty</title>
      {/* Back — drawn first, sits behind */}
      <rect
        x={4}
        y={26}
        width={88}
        height={88}
        rx={9}
        ry={9}
        fill="none"
        stroke={ORANGE}
        strokeWidth={3.5}
        opacity={0.45}
      />
      {/* Middle */}
      <rect
        x={14}
        y={16}
        width={88}
        height={88}
        rx={9}
        ry={9}
        fill="none"
        stroke={ORANGE}
        strokeWidth={3.5}
        opacity={0.75}
      />
      {/* Front — solid on top */}
      <rect x={24} y={6} width={88} height={88} rx={9} ry={9} fill={ORANGE} />
      <path
        d="M 96 34 A 28 28 0 1 0 96 66"
        fill="none"
        stroke="white"
        strokeWidth={8}
        strokeLinecap="round"
      />
    </svg>
  );
}
