import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { CAISTY_DOCUMENT_BRAND } from "./branding";
import { formatDocumentDateTime } from "./formatters";
import type { DocumentMeta } from "./types";

type Rgb = [number, number, number];

function toRgb(color: readonly [number, number, number]): Rgb {
  return [color[0], color[1], color[2]];
}

type KeyValueRow = [label: string, value: string];

type TableSection = {
  head: string[];
  body: string[][];
  emptyMessage?: string;
};

export class CaistyPdfDocument {
  readonly doc: jsPDF;
  private cursorY: number;
  private readonly pageWidth: number;
  private readonly contentWidth: number;
  private readonly marginLeft: number;
  private readonly marginRight: number;
  private footerLabels: { generatedBy: string; website: string } | null = null;

  constructor() {
    const { page, font } = CAISTY_DOCUMENT_BRAND;
    this.doc = new jsPDF({
      orientation: page.orientation,
      unit: page.unit,
      format: page.format,
    });
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.marginLeft = page.marginLeft;
    this.marginRight = page.marginRight;
    this.contentWidth = page.contentWidth;
    this.cursorY = page.marginTop;
    this.doc.setFont(font.family, "normal");
  }

  drawBrandHeader(title: string, subtitle: string): void {
    const { colors, font, page } = CAISTY_DOCUMENT_BRAND;
    this.cursorY = page.marginTop;

    this.fillRect(
      this.marginLeft,
      this.cursorY - 4,
      this.contentWidth,
      1.2,
      colors.orange,
    );
    this.cursorY += 2;

    this.setText(colors.textMuted, font.metaSize);
    this.doc.text(CAISTY_DOCUMENT_BRAND.productName, this.marginLeft, this.cursorY);
    this.cursorY += 5;

    this.setText(colors.textDark, font.titleSize, "bold");
    this.doc.text(title, this.marginLeft, this.cursorY);
    this.cursorY += 6;

    this.setText(colors.textMuted, font.subtitleSize, "normal");
    this.doc.text(subtitle, this.marginLeft, this.cursorY);
    this.cursorY += 8;

    this.drawRule();
  }

  drawMetaBlock(
    meta: DocumentMeta,
    labels: {
      business: string;
      store: string;
      period: string;
      date: string;
      generatedAt: string;
      timezone: string;
      currency: string;
    },
    options?: { includeDate?: boolean },
  ): void {
    const rows: KeyValueRow[] = [
      [labels.business, meta.businessName],
      [labels.store, meta.storeName],
      [labels.period, meta.label],
    ];

    if (options?.includeDate) {
      rows.push([
        labels.date,
        formatDocumentDateTime(meta.generatedAt, meta.locale, meta.timezone).split(
          ",",
        )[0]?.trim() ?? "",
      ]);
    }

    rows.push(
      [
        labels.generatedAt,
        formatDocumentDateTime(meta.generatedAt, meta.locale, meta.timezone),
      ],
      [labels.timezone, meta.timezone],
      [labels.currency, meta.currency],
    );

    this.drawKeyValuePanel(rows);
  }

  drawSectionTitle(title: string): void {
    const { colors, font } = CAISTY_DOCUMENT_BRAND;
    this.ensureSpace(10);
    this.setText(colors.textDark, font.sectionSize, "bold");
    this.doc.text(title.toUpperCase(), this.marginLeft, this.cursorY);
    this.cursorY += 2;
    this.fillRect(this.marginLeft, this.cursorY, 28, 0.8, colors.orange);
    this.cursorY += 6;
  }

  drawKeyValueRows(rows: KeyValueRow[]): void {
    this.drawKeyValuePanel(rows);
  }

  drawMutedNote(text: string): void {
    const { colors, font } = CAISTY_DOCUMENT_BRAND;
    this.ensureSpace(8);
    this.setText(colors.textMuted, font.metaSize, "normal");
    const lines = this.doc.splitTextToSize(text, this.contentWidth);
    this.doc.text(lines, this.marginLeft, this.cursorY);
    this.cursorY += Math.max(lines.length, 1) * 4 + 4;
  }

  addPage(): void {
    this.doc.addPage();
    this.cursorY = CAISTY_DOCUMENT_BRAND.page.marginTop;
  }

  /** Compact bar chart for executive reports (values in minor currency units). */
  drawBarChart(
    points: Array<{ label: string; value: number; displayValue?: string }>,
  ): void {
    const { colors, font } = CAISTY_DOCUMENT_BRAND;
    if (!points.length) return;

    const chartHeight = 42;
    const labelHeight = 10;
    const maxBars = 24;
    const bars = points.length > maxBars ? points.slice(0, maxBars) : points;
    this.ensureSpace(chartHeight + labelHeight + 8);

    const maxValue = Math.max(...bars.map((point) => point.value), 1);
    const gap = bars.length > 16 ? 0.6 : 1.2;
    const barWidth = Math.max(
      (this.contentWidth - gap * (bars.length - 1)) / bars.length,
      1.5,
    );

    let x = this.marginLeft;
    const baseY = this.cursorY + chartHeight;

    this.strokeRect(
      this.marginLeft,
      this.cursorY,
      this.contentWidth,
      chartHeight,
      colors.border,
    );

    for (const point of bars) {
      const height =
        point.value > 0
          ? Math.max((point.value / maxValue) * (chartHeight - 4), 1.5)
          : 0;
      if (height > 0) {
        this.fillRect(
          x,
          baseY - height,
          barWidth,
          height,
          colors.orange,
        );
      }
      x += barWidth + gap;
    }

    this.cursorY = baseY + 4;

    // Sparse x labels to avoid clutter
    const step = bars.length <= 8 ? 1 : Math.ceil(bars.length / 8);
    this.setText(colors.textMuted, font.footerSize, "normal");
    for (let i = 0; i < bars.length; i += step) {
      const labelX =
        this.marginLeft + i * (barWidth + gap) + barWidth / 2;
      this.doc.text(bars[i]!.label, labelX, this.cursorY + 3, {
        align: "center",
        maxWidth: barWidth + gap * 2,
      });
    }
    this.cursorY += labelHeight;
  }

  drawTable(section: TableSection): void {
    const { colors, font } = CAISTY_DOCUMENT_BRAND;

    if (!section.body.length) {
      if (section.emptyMessage) {
        this.ensureSpace(8);
        this.setText(colors.textMuted, font.bodySize, "normal");
        this.doc.text(section.emptyMessage, this.marginLeft, this.cursorY);
        this.cursorY += 8;
      }
      return;
    }

    this.ensureSpace(16);

    autoTable(this.doc, {
      startY: this.cursorY,
      margin: { left: this.marginLeft, right: this.marginRight },
      head: [section.head],
      body: section.body,
      theme: "plain",
      showHead: "everyPage",
      styles: {
        font: font.family,
        fontSize: font.bodySize,
        textColor: toRgb(colors.textDark),
        cellPadding: { top: 2.2, right: 2, bottom: 2.2, left: 2 },
        lineColor: toRgb(colors.border),
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: toRgb(colors.surface),
        textColor: toRgb(colors.textMuted),
        fontStyle: "bold",
        fontSize: font.metaSize,
      },
      alternateRowStyles: {
        fillColor: toRgb(colors.white),
      },
      bodyStyles: {
        fillColor: toRgb(colors.white),
      },
      didDrawPage: () => {
        this.cursorY = this.doc.lastAutoTable?.finalY ?? this.cursorY;
      },
    });

    this.cursorY = (this.doc.lastAutoTable?.finalY ?? this.cursorY) + 6;
  }

  setFooterLabels(labels: { generatedBy: string; website: string }): void {
    this.footerLabels = labels;
  }

  save(filename: string): void {
    this.paintFooters();
    this.doc.save(filename);
  }

  private drawKeyValuePanel(rows: KeyValueRow[]): void {
    const { colors, font } = CAISTY_DOCUMENT_BRAND;
    this.ensureSpace(rows.length * 5 + 6);

    const panelTop = this.cursorY;
    const panelHeight = rows.length * 5.2 + 4;
    this.fillRect(
      this.marginLeft,
      panelTop,
      this.contentWidth,
      panelHeight,
      colors.surface,
    );
    this.strokeRect(
      this.marginLeft,
      panelTop,
      this.contentWidth,
      panelHeight,
      colors.border,
    );

    let rowY = panelTop + 5;
    for (const [label, value] of rows) {
      this.setText(colors.textMuted, font.metaSize, "bold");
      this.doc.text(label, this.marginLeft + 3, rowY);
      this.setText(colors.textDark, font.bodySize, "normal");
      const lines = this.doc.splitTextToSize(value, this.contentWidth * 0.58);
      this.doc.text(lines, this.marginLeft + this.contentWidth * 0.34, rowY);
      rowY += 5.2;
    }

    this.cursorY = panelTop + panelHeight + 6;
  }

  private ensureSpace(height: number): void {
    const { page } = CAISTY_DOCUMENT_BRAND;
    if (this.cursorY + height <= page.footerY - 6) return;
    this.doc.addPage();
    this.cursorY = page.marginTop;
  }

  private paintFooters(): void {
    if (!this.footerLabels) return;

    const { colors, font, page } = CAISTY_DOCUMENT_BRAND;
    const totalPages = this.doc.getNumberOfPages();

    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
      this.doc.setPage(pageNumber);
      const footerY = page.footerY;
      this.drawRule(footerY - 4);
      this.setText(colors.textFaint, font.footerSize, "normal");
      this.doc.text(this.footerLabels.generatedBy, this.marginLeft, footerY);
      this.doc.text(
        this.footerLabels.website,
        this.pageWidth - this.marginRight,
        footerY,
        { align: "right" },
      );
      this.doc.text(
        `${pageNumber} / ${totalPages}`,
        this.pageWidth / 2,
        footerY,
        { align: "center" },
      );
    }
  }

  private drawRule(y = this.cursorY): void {
    const { colors } = CAISTY_DOCUMENT_BRAND;
    this.strokeRect(this.marginLeft, y, this.contentWidth, 0, colors.border);
    this.cursorY = y + 4;
  }

  private setText(
    color: readonly [number, number, number],
    size: number,
    style: "normal" | "bold" = "normal",
  ): void {
    const { font } = CAISTY_DOCUMENT_BRAND;
    this.doc.setTextColor(color[0], color[1], color[2]);
    this.doc.setFont(font.family, style);
    this.doc.setFontSize(size);
  }

  private fillRect(
    x: number,
    y: number,
    width: number,
    height: number,
    color: readonly [number, number, number],
  ): void {
    this.doc.setFillColor(color[0], color[1], color[2]);
    this.doc.rect(x, y, width, height, "F");
  }

  private strokeRect(
    x: number,
    y: number,
    width: number,
    height: number,
    color: readonly [number, number, number],
  ): void {
    this.doc.setDrawColor(color[0], color[1], color[2]);
    this.doc.setLineWidth(0.2);
    this.doc.rect(x, y, width, height, "S");
  }
}

declare module "jspdf" {
  interface jsPDF {
    lastAutoTable?: {
      finalY: number;
    };
  }
}
