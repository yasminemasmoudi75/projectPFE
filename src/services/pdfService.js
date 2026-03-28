const PDFDocument = require('pdfkit');

/**
 * Service de génération de PDF pour les documents commerciaux (Devis, BC)
 */
class PDFService {
    /**
     * Génère un PDF pour un document (Devis ou Bon de Commande)
     * @param {Object} docData - Les données du document (Master)
     * @param {Object} socData - Les données de la société (TabSociete)
     * @param {String} type - 'DEVIS' ou 'COMMANDE'
     * @returns {Promise<Buffer>}
     */
    static async generateCommercialPDF(docData, socData, type = 'DEVIS') {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50, size: 'A4' });
                let buffers = [];

                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => {
                    const pdfData = Buffer.concat(buffers);
                    resolve(pdfData);
                });
                doc.on('error', (err) => {
                    reject(err);
                });

                this.generateHeader(doc, socData);
                this.generateCustomerInformation(doc, docData, type);
                this.generateInvoiceTable(doc, docData);
                doc.end();
            } catch (err) {
                reject(err);
            }
        });
    }

    static generateHeader(doc, soc) {
        // En-tête : Informations Société (Gauche)
        doc.font('Helvetica-Bold')
            .fillColor('#444444')
            .fontSize(20)
            .text(soc?.DENOMINATION || 'NEXUS CRM', 50, 50)
            .font('Helvetica')
            .fontSize(10)
            .text(soc?.ADRESSE || '', 50, 80)
            .text(`${soc?.CP || ''} ${soc?.VILLE || ''}`, 50, 95)
            .text(`Tel: ${soc?.TELEPHONE || ''}`, 50, 110)
            .text(`Email: ${soc?.EMAIL || ''}`, 50, 125);

        // Bloc stylisé (Droite)
        doc.rect(400, 50, 150, 80)
            .fill('#f0f4f8');

        doc.fillColor('#334155')
            .font('Helvetica-Bold')
            .fontSize(15)
            .text('NEXUS', 445, 75)
            .font('Helvetica')
            .fontSize(8)
            .text('INNOVATION', 452, 95);

        doc.moveDown();
    }

    static generateCustomerInformation(doc, data, type) {
        doc.font('Helvetica-Bold')
            .fillColor('#444444')
            .fontSize(20)
            .text(type, 50, 180, { align: 'center' });

        this.generateHr(doc, 210);

        const customerInfoTop = 230;

        doc.fontSize(10)
            .font('Helvetica-Bold')
            .text(`Référence : ${data.Prfx || 'BC'}${data.Nf}`, 50, customerInfoTop)
            .font('Helvetica')
            .text(`Date : ${data.DatUser ? new Date(data.DatUser).toLocaleDateString() : ''}`, 50, customerInfoTop + 15)
            .text(`Validé : ${data.Valid ? 'OUI' : 'Brouillon'}`, 50, customerInfoTop + 30)

            .font('Helvetica-Bold')
            .text('DESTINATAIRE :', 300, customerInfoTop)
            .font('Helvetica')
            .text(data.LibTiers || data.tiers?.Raisoc || data.client?.LibTiers || '', 300, customerInfoTop + 15)
            .text(data.Adresse || data.client?.Adresse || '', 300, customerInfoTop + 30)
            .text(data.Ville || data.client?.Ville || '', 300, customerInfoTop + 45);

        this.generateHr(doc, 290);
    }

    static generateInvoiceTable(doc, data) {
        const invoiceTableTop = 330;

        doc.font('Helvetica-Bold');
        this.generateTableRow(
            doc,
            invoiceTableTop,
            'Article',
            'Description',
            'P.U HT',
            'Qté',
            'Total HT'
        );
        this.generateHr(doc, invoiceTableTop + 20);
        doc.font('Helvetica');

        let currentTop = invoiceTableTop + 30;
        let i = 0;
        const details = data.details || [];

        for (i = 0; i < details.length; i++) {
            const item = details[i];
            const position = currentTop + i * 30;

            this.generateTableRow(
                doc,
                position,
                item.CodArt || '',
                (item.LibArt || '').substring(0, 30),
                this.formatCurrency(item.PuHT),
                item.Qt || 0,
                this.formatCurrency(item.MntHT)
            );

            this.generateHr(doc, position + 20);
        }

        const subtotalPosition = currentTop + i * 35;
        this.generateTableRow(
            doc,
            subtotalPosition,
            '',
            '',
            'TOTAL HT',
            '',
            this.formatCurrency(data.TotHT)
        );

        const tvaPosition = subtotalPosition + 20;
        this.generateTableRow(
            doc,
            tvaPosition,
            '',
            '',
            'TVA (19%)',
            '',
            this.formatCurrency(data.TotTva)
        );

        const duePosition = tvaPosition + 25;
        doc.font('Helvetica-Bold');
        this.generateTableRow(
            doc,
            duePosition,
            '',
            '',
            'TOTAL TTC',
            '',
            this.formatCurrency(data.TotTTC)
        );
        doc.font('Helvetica');
    }

    static generateTableRow(doc, y, code, desc, unitPrice, qty, total) {
        doc.fontSize(10)
            .text(code, 50, y)
            .text(desc, 150, y)
            .text(unitPrice, 280, y, { width: 90, align: 'right' })
            .text(String(qty), 370, y, { width: 90, align: 'right' })
            .text(total, 470, y, { width: 70, align: 'right' });
    }

    static generateHr(doc, y) {
        doc.strokeColor('#aaaaaa')
            .lineWidth(1)
            .moveTo(50, y)
            .lineTo(550, y)
            .stroke();
    }

    static formatCurrency(amount) {
        try {
            return Number(amount || 0).toLocaleString('fr-FR', { minimumFractionDigits: 3 }) + ' TND';
        } catch (e) {
            return '0,000 TND';
        }
    }
}

module.exports = PDFService;
