type SectionHeaderProps = {
  title: string;
  subline?: string;
  pill?: string;
};

export function SectionHeader({ title, subline, pill }: SectionHeaderProps) {
  return (
    <div className="ds-section-header">
      <div>
        <h2 className="ds-section-title">{title}</h2>
        {subline ? <p className="ds-section-subline">{subline}</p> : null}
      </div>
      {pill ? <span className="ds-section-pill">{pill}</span> : null}
    </div>
  );
}
