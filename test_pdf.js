const { DevisMaster, DevisDetail, TabSociete, sequelize } = require('./src/models');
const PDFService = require('./src/services/pdfService');
const fs = require('fs');

async function testPDF() {
    try {
        console.log('--- PDF TEST START ---');
        console.log('Fetching devis...');
        const devis = await DevisMaster.findOne({
            include: [{ model: DevisDetail, as: 'details' }]
        });

        if (!devis) {
            console.log('No devis found to test.');
            return;
        }
        console.log('Devis found:', devis.Nf);

        console.log('Fetching society info...');
        const soc = await TabSociete.findOne();
        console.log('Soc info found:', soc?.DENOMINATION || 'None');

        console.log('Generating PDF buffer...');
        const buffer = await PDFService.generateCommercialPDF(devis, soc, 'DEVIS TEST');

        fs.writeFileSync('test_output.pdf', buffer);
        console.log('✅ Success! PDF saved to test_output.pdf (Size:', buffer.length, 'bytes)');
    } catch (err) {
        console.error('❌ PDF Test Failed:', err);
    } finally {
        await sequelize.close();
    }
}

testPDF();
