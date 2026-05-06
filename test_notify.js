const { Message, sequelize } = require('./src/models');
const { QueryTypes } = require('sequelize');

async function testInsert() {
  try {
    console.log('--- Test Insert Notification ---');
    const now = new Date();
    const dateFormatted = now.toISOString().replace('T', ' ').replace('Z', '');
    const adminId = 14; // User testing
    
    await sequelize.query(`
      INSERT INTO MSGMessages (
        Subject, MessageText, SendingDate, 
        SenderID, RecipientID, 
        StatusRead, Priority, MessageType
      )
      VALUES (
        'TEST NOTIFICATION', 'Ceci est un test de notification manuelle.', :date, 
        1, :to, 
        0, 1, 1
      )
    `, {
      replacements: {
        date: dateFormatted,
        to: adminId
      },
      type: QueryTypes.INSERT
    });
    
    console.log('✅ Message de test inséré pour UserID 14.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur test insert:', err.message);
    process.exit(1);
  }
}

testInsert();
