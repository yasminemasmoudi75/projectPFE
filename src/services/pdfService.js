const PDFDocument = require('pdfkit');

// Design tokens (match the web page)
const BLUE      = '#0062AF';
const BLUE_LIGHT = '#e0f0ff';
const SKY       = '#38bdf8';
const TEAL      = '#2dd4bf';
const SLATE_900 = '#0f172a';
const SLATE_700 = '#334155';
const SLATE_500 = '#64748b';
const SLATE_400 = '#94a3b8';
const SLATE_200 = '#e2e8f0';
const SLATE_100 = '#f1f5f9';
const WHITE     = '#ffffff';
const ROSE      = '#e11d48';

const PAGE_W    = 595.28;   // A4 width pt
const PAGE_H    = 841.89;   // A4 height pt
const MARGIN    = 48;
const CONTENT_W = PAGE_W - MARGIN * 2;

class PDFService {

    static async generateCommercialPDF(docData, socData, docType = 'BON DE COMMANDE') {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 0, size: 'A4', autoFirstPage: true });
                const buffers = [];
                doc.on('data', (b) => buffers.push(b));
                doc.on('end',  () => resolve(Buffer.concat(buffers)));
                doc.on('error', reject);

                this._drawPage(doc, docData, socData, docType);

                doc.end();
            } catch (err) {
                reject(err);
            }
        });
    }

    // ─────────────────────────────────────────────
    // Main page layout
    // ─────────────────────────────────────────────
    static _drawPage(doc, data, soc, docType) {
        // White background
        doc.rect(0, 0, PAGE_W, PAGE_H).fill(WHITE);

        // Top gradient accent bar (3 pt)
        this._drawGradientBar(doc, 0, 3);

        let y = MARGIN + 10;

        y = this._drawHeader(doc, soc, y);
        y = this._drawDocumentTitle(doc, docType, y);
        y = this._drawMetaAndClient(doc, data, y);
        y = this._drawArticlesTable(doc, data.details || [], y);
        y = this._drawTotals(doc, data, y);
        y = this._drawSignatureSection(doc, data, soc, docType, y);
        this._drawFooter(doc, data);
    }

    // ─────────────────────────────────────────────
    // Top accent bar (simulated gradient: blue → sky → teal)
    // ─────────────────────────────────────────────
    static _drawGradientBar(doc, y, h) {
        const stops = [
            { x: 0,           color: BLUE  },
            { x: PAGE_W / 2,  color: SKY   },
            { x: PAGE_W,      color: TEAL  },
        ];
        const steps = 60;
        for (let i = 0; i < steps; i++) {
            const x0 = (PAGE_W / steps) * i;
            const x1 = (PAGE_W / steps) * (i + 1);
            const t  = i / (steps - 1);
            const color = t < 0.5
                ? this._lerpColor(BLUE, SKY,  t * 2)
                : this._lerpColor(SKY,  TEAL, (t - 0.5) * 2);
            doc.rect(x0, y, x1 - x0 + 0.5, h).fill(color);
        }
    }

    // ─────────────────────────────────────────────
    // Company header + NEXUS branding
    // ─────────────────────────────────────────────
    static _drawHeader(doc, soc, y) {
        const company = soc?.DENOMINATION || soc?.NomSoc || 'AMS-LABO';
        const address = soc?.ADRESSE      || soc?.Adresse || 'Rue Taher Kammoun';
        const city    = `${soc?.CP || '3000'} ${soc?.VILLE || soc?.Ville || 'Sfax'}, Tunisie`;
        const tel     = soc?.TELEPHONE    || soc?.Tel     || '74 407 194';
        const email   = soc?.EMAIL        || soc?.Email   || 'contact@amslabo.com';

        // Company name
        doc.font('Helvetica-Bold').fontSize(18).fillColor(SLATE_900)
            .text(company, MARGIN, y, { lineBreak: false });

        // NEXUS block (right)
        const blockX = PAGE_W - MARGIN - 100;
        doc.font('Helvetica').fontSize(7).fillColor(SLATE_400)
            .text('PROPULSÉ PAR', blockX, y, { width: 100, align: 'right' });
        doc.font('Helvetica-Bold').fontSize(16).fillColor(BLUE)
            .text('NEXUS', blockX, y + 10, { width: 100, align: 'right' });
        doc.font('Helvetica').fontSize(7).fillColor(SLATE_400)
            .text('CRM Suite', blockX, y + 28, { width: 100, align: 'right' });

        // Company details
        let dy = y + 26;
        doc.font('Helvetica').fontSize(8.5).fillColor(SLATE_500)
            .text(address, MARGIN, dy);
        dy += 13;
        doc.text(city, MARGIN, dy);
        dy += 13;
        doc.fillColor(SLATE_700).font('Helvetica-Bold').text('Tél : ', MARGIN, dy, { continued: true })
            .font('Helvetica').fillColor(SLATE_500).text(tel);
        dy += 13;
        doc.fillColor(SLATE_700).font('Helvetica-Bold').text('Email : ', MARGIN, dy, { continued: true })
            .font('Helvetica').fillColor(SLATE_500).text(email);

        dy += 24;
        // Divider
        doc.rect(MARGIN, dy, CONTENT_W, 0.5).fill(SLATE_200);
        return dy + 16;
    }

    // ─────────────────────────────────────────────
    // Centered document title + decorative line
    // ─────────────────────────────────────────────
    static _drawDocumentTitle(doc, title, y) {
        doc.font('Helvetica-Bold').fontSize(15).fillColor(SLATE_900)
            .text(title, MARGIN, y, { width: CONTENT_W, align: 'center', characterSpacing: 3 });

        // Thin centered line under title
        const lineW = 80;
        const lineX = (PAGE_W - lineW) / 2;
        const lineY = y + 22;
        this._drawGradientBar(doc, lineY, 1.5);
        // clip to center
        doc.rect(lineX, lineY, lineW, 1.5).fill(BLUE);

        return lineY + 16;
    }

    // ─────────────────────────────────────────────
    // 2-column: document details (left) + client (right)
    // ─────────────────────────────────────────────
    static _drawMetaAndClient(doc, data, y) {
        const ref  = `${data.Prfx || 'BC'}${data.Nf}`;
        const colW = CONTENT_W / 2 - 12;
        const col2 = MARGIN + colW + 24;

        const startY = y;

        // ── Left: document details ──
        doc.font('Helvetica-Bold').fontSize(7).fillColor(SLATE_400)
            .text('DÉTAILS DU DOCUMENT', MARGIN, y, { characterSpacing: 1 });
        y += 14;

        const rows = [
            { label: 'Référence',       value: ref,   valueColor: BLUE, valueBold: true, mono: true },
            { label: 'Date',            value: data.DatUser ? new Date(data.DatUser).toLocaleDateString('fr-TN') : '—' },
            { label: 'Livraison prévue', value: data.DatLiv ? new Date(data.DatLiv).toLocaleDateString('fr-TN') : '—' },
        ];

        for (const row of rows) {
            doc.font('Helvetica').fontSize(8.5).fillColor(SLATE_500)
                .text(row.label, MARGIN, y, { width: colW / 2, lineBreak: false });
            doc.font(row.valueBold ? 'Helvetica-Bold' : 'Helvetica')
                .fillColor(row.valueColor || SLATE_700)
                .text(row.value, MARGIN + colW / 2, y, { width: colW / 2, align: 'right', lineBreak: false });
            y += 15;
        }

        if (data.Remarq) {
            y += 4;
            doc.rect(MARGIN, y, colW, 0.5).fill(SLATE_200);
            y += 8;
            doc.font('Helvetica-Bold').fontSize(7).fillColor(SLATE_400).text('REMARQUES', MARGIN, y, { characterSpacing: 1 });
            y += 12;
            doc.font('Helvetica').fontSize(8).fillColor(SLATE_500).text(data.Remarq, MARGIN, y, { width: colW });
            y += doc.heightOfString(data.Remarq, { width: colW, fontSize: 8 });
        }

        // ── Right: client block ──
        const clientY = startY;
        // Light background box
        const boxH = Math.max(y - startY + 4, 70);
        doc.roundedRect(col2 - 8, clientY - 4, colW + 16, boxH, 8).fill(SLATE_100);

        doc.font('Helvetica-Bold').fontSize(7).fillColor(BLUE)
            .text('DESTINATAIRE', col2, clientY, { characterSpacing: 1 });

        const clientName = data.LibTiers || data.client?.Raisoc || '—';
        doc.font('Helvetica-Bold').fontSize(13).fillColor(SLATE_900)
            .text(clientName, col2, clientY + 14, { width: colW });

        let cy = clientY + 14 + doc.heightOfString(clientName, { width: colW, fontSize: 13 }) + 4;

        if (data.Adresse || data.client?.Adresse) {
            doc.font('Helvetica').fontSize(8.5).fillColor(SLATE_500)
                .text(data.Adresse || data.client?.Adresse || '', col2, cy, { width: colW });
            cy += 13;
        }
        if (data.Ville || data.client?.Ville) {
            doc.font('Helvetica-Bold').fontSize(8.5).fillColor(SLATE_700)
                .text(data.Ville || data.client?.Ville || '', col2, cy, { width: colW });
            cy += 13;
        }
        if (data.Cin || data.client?.Cin) {
            doc.font('Helvetica').fontSize(7.5).fillColor(SLATE_400)
                .text(`ID : ${data.Cin || data.client?.Cin}`, col2, cy, { width: colW });
        }

        const sectionBottom = Math.max(y, cy) + 16;
        doc.rect(MARGIN, sectionBottom, CONTENT_W, 0.5).fill(SLATE_200);
        return sectionBottom + 16;
    }

    // ─────────────────────────────────────────────
    // Articles table with bordered style
    // ─────────────────────────────────────────────
    static _drawArticlesTable(doc, details, y) {
        // Section label
        doc.font('Helvetica-Bold').fontSize(7).fillColor(SLATE_400)
            .text('ARTICLES', MARGIN, y, { characterSpacing: 1 });
        y += 14;

        const cols = [
            { label: 'CODE',        x: MARGIN,       w: 70,  align: 'left'  },
            { label: 'DÉSIGNATION', x: MARGIN + 70,  w: 210, align: 'left'  },
            { label: 'P.U HT',      x: MARGIN + 280, w: 80,  align: 'right' },
            { label: 'QTÉ',         x: MARGIN + 360, w: 50,  align: 'center'},
            { label: 'TOTAL HT',    x: MARGIN + 410, w: 89,  align: 'right' },
        ];

        const tableRight = MARGIN + CONTENT_W;
        const rowH = 26;
        const headerH = 28;

        // Table outer border + rounded corners
        doc.roundedRect(MARGIN, y, CONTENT_W, headerH, 4).fill(SLATE_100);

        // Header labels
        for (const col of cols) {
            doc.font('Helvetica-Bold').fontSize(7.5).fillColor(SLATE_500)
                .text(col.label, col.x + 4, y + 9, { width: col.w - 8, align: col.align, characterSpacing: 0.5 });
        }
        y += headerH;

        // Rows
        const items = details.filter(d => d.CodArt);
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const rowY = y;
            const isLast = i === items.length - 1;

            // Alternating very light row background
            if (i % 2 === 0) {
                doc.rect(MARGIN, rowY, CONTENT_W, rowH).fill('#f8fafc');
            }

            // Row divider
            if (!isLast) {
                doc.rect(MARGIN, rowY + rowH, CONTENT_W, 0.5).fill(SLATE_200);
            }

            // Code
            doc.font('Helvetica-Bold').fontSize(8).fillColor(SLATE_500)
                .text(item.CodArt || '—', cols[0].x + 4, rowY + 8, { width: cols[0].w - 8, lineBreak: false });

            // Désignation (may wrap)
            const libArt = item.LibArt || '';
            doc.font('Helvetica-Bold').fontSize(8.5).fillColor(SLATE_900)
                .text(libArt.length > 40 ? libArt.substring(0, 40) + '…' : libArt,
                    cols[1].x + 4, rowY + 8, { width: cols[1].w - 8, lineBreak: false });

            if (item.ExLibArt) {
                doc.font('Helvetica').fontSize(7.5).fillColor(SLATE_400)
                    .text(item.ExLibArt.substring(0, 45), cols[1].x + 4, rowY + 18, { width: cols[1].w - 8, lineBreak: false });
            }

            // P.U HT
            doc.font('Helvetica').fontSize(8.5).fillColor(SLATE_700)
                .text(this._fmt(item.PuHT) + ' DT', cols[2].x + 4, rowY + 8, { width: cols[2].w - 8, align: 'right', lineBreak: false });

            // Qté
            doc.font('Helvetica-Bold').fontSize(9).fillColor(SLATE_900)
                .text(String(item.Qt || 0), cols[3].x + 4, rowY + 8, { width: cols[3].w - 8, align: 'center', lineBreak: false });

            // Total HT
            const mntHT = item.MntHT || ((item.Qt || 0) * (item.PuHT || 0));
            doc.font('Helvetica-Bold').fontSize(8.5).fillColor(SLATE_900)
                .text(this._fmt(mntHT) + ' DT', cols[4].x + 4, rowY + 8, { width: cols[4].w - 8, align: 'right', lineBreak: false });

            y += rowH;
        }

        if (items.length === 0) {
            doc.font('Helvetica').fontSize(9).fillColor(SLATE_400)
                .text('Aucun article.', MARGIN, y + 10, { width: CONTENT_W, align: 'center' });
            y += 30;
        }

        // Table bottom border
        doc.rect(MARGIN, y, CONTENT_W, 0.5).fill(SLATE_200);

        return y + 20;
    }

    // ─────────────────────────────────────────────
    // Totals block (right-aligned)
    // ─────────────────────────────────────────────
    static _drawTotals(doc, data, y) {
        const blockW = 200;
        const blockX = PAGE_W - MARGIN - blockW;

        const totHT  = Number(data.TotHT  || 0);
        const totTVA = Number(data.TotTva || 0);
        const totRem = Number(data.TotRem || 0);
        const totTTC = Number(data.TotTTC || 0);
        const tvaRate = data.details?.[0]?.Tva ?? 19;

        const rows = [
            { label: 'Sous-total HT',      value: this._fmt(totHT)  + ' DT' },
            { label: `TVA (${tvaRate}%)`,  value: this._fmt(totTVA) + ' DT' },
        ];
        if (totRem > 0) rows.push({ label: 'Remise', value: '− ' + this._fmt(totRem) + ' DT', red: true });

        for (const row of rows) {
            doc.font('Helvetica-Bold').fontSize(7.5).fillColor(SLATE_400)
                .text(row.label.toUpperCase(), blockX, y, { width: blockW / 2, characterSpacing: 0.5 });
            doc.font('Helvetica-Bold').fontSize(8.5).fillColor(row.red ? ROSE : SLATE_700)
                .text(row.value, blockX + blockW / 2, y, { width: blockW / 2, align: 'right', lineBreak: false });
            y += 16;
        }

        // Divider
        doc.rect(blockX, y, blockW, 0.5).fill(SLATE_200);
        y += 10;

        // TOTAL TTC
        doc.font('Helvetica-Bold').fontSize(8).fillColor(SLATE_500)
            .text('TOTAL TTC', blockX, y);
        doc.font('Helvetica').fontSize(7.5).fillColor(SLATE_400)
            .text('Toutes taxes comprises', blockX, y + 12);

        // Big blue amount
        const amountText = this._fmt(totTTC);
        doc.font('Helvetica-Bold').fontSize(22).fillColor(BLUE)
            .text(amountText, blockX, y - 4, { width: blockW - 20, align: 'right', lineBreak: false });
        doc.font('Helvetica-Bold').fontSize(9).fillColor(SLATE_400)
            .text('TND', PAGE_W - MARGIN - 2, y + 10, { align: 'right', lineBreak: false });

        return y + 40;
    }

    // ─────────────────────────────────────────────
    // Signature par-dessus le cachet — une seule image
    // ─────────────────────────────────────────────
    static _drawSignatureSection(doc, data, soc, docType, y) {
        const sigData   = data.SignatureData || null;
        const cachetBuf = soc?.CACHET ? Buffer.from(soc.CACHET) : null;

        if (!sigData && !cachetBuf) return y;

        const imgX = MARGIN;
        const imgY = y + 28;
        const imgW = 160;
        const imgH = 130;

        y += 16;
        doc.rect(MARGIN, y, CONTENT_W, 0.5).fill(SLATE_200);
        y += 12;

        doc.font('Helvetica-Bold').fontSize(7).fillColor(SLATE_400)
            .text('SIGNATURE DU RESPONSABLE', MARGIN, y, { characterSpacing: 0.8 });

        // 1. Cachet en dessous
        if (cachetBuf) {
            try {
                doc.image(cachetBuf, imgX, imgY, { fit: [imgW, imgH], align: 'center', valign: 'center' });
            } catch { /* cachet invalide */ }
        }

        // 2. Signature par-dessus
        if (sigData) {
            try {
                const base64 = sigData.replace(/^data:image\/\w+;base64,/, '');
                const imgBuf = Buffer.from(base64, 'base64');
                doc.image(imgBuf, imgX, imgY, { fit: [imgW, imgH], align: 'center', valign: 'center' });
            } catch { /* signature invalide */ }
        }

        return imgY + imgH + 16;
    }

    // ─────────────────────────────────────────────
    // Footer
    // ─────────────────────────────────────────────
    static _drawFooter(doc, data) {
        const y = PAGE_H - 36;
        doc.rect(MARGIN, y - 8, CONTENT_W, 0.5).fill(SLATE_200);

        const ref = `${data.Prfx || 'BC'}${data.Nf}`;
        const date = data.DatUser ? new Date(data.DatUser).toLocaleDateString('fr-TN') : '';

        doc.font('Helvetica').fontSize(7.5).fillColor(SLATE_400)
            .text('NexusCRM — Document généré automatiquement', MARGIN, y, { width: CONTENT_W / 2 });
        doc.font('Helvetica').fontSize(7.5).fillColor(SLATE_400)
            .text(`${ref} · ${date}`, MARGIN, y, { width: CONTENT_W, align: 'right' });
    }

    // ─────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────
    static _fmt(amount) {
        return Number(amount || 0).toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
    }

    static _lerpColor(a, b, t) {
        const parse = (hex) => {
            const n = parseInt(hex.replace('#', ''), 16);
            return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
        };
        const ca = parse(a), cb = parse(b);
        const r = Math.round(ca[0] + (cb[0] - ca[0]) * t);
        const g = Math.round(ca[1] + (cb[1] - ca[1]) * t);
        const bv = Math.round(ca[2] + (cb[2] - ca[2]) * t);
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bv.toString(16).padStart(2, '0')}`;
    }
}

module.exports = PDFService;
