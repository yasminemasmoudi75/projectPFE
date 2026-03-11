const models = require('./src/models');
const { sequelize } = models;
const fs = require('fs');

async function performAudit() {
    const auditReport = {
        tables: {},
        foreignKeys: [],
        discrepancies: []
    };

    try {
        const modelKeys = Object.keys(models).filter(key => key !== 'sequelize' && key !== 'UserRole');

        for (const key of modelKeys) {
            const model = models[key];
            if (!model.tableName) continue;

            const tableName = model.tableName;
            const [tableInfo] = await sequelize.query(`
        SELECT COLUMN_NAME, DATA_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = '${tableName}'
      `);

            if (tableInfo.length === 0) {
                auditReport.tables[key] = { tableName, status: 'MISSING' };
                auditReport.discrepancies.push(`Table ${tableName} (${key}) is missing.`);
                continue;
            }

            const dbColumns = tableInfo.map(c => c.COLUMN_NAME.toLowerCase());
            const modelAttributes = model.rawAttributes;
            const missingColumns = [];

            for (const attrKey in modelAttributes) {
                const attr = modelAttributes[attrKey];
                if (attr.field && !dbColumns.includes(attr.field.toLowerCase())) {
                    missingColumns.push(attr.field);
                }
            }

            auditReport.tables[key] = {
                tableName,
                status: missingColumns.length > 0 ? 'COLUMN_MISMATCH' : 'OK',
                missingColumns
            };

            if (missingColumns.length > 0) {
                auditReport.discrepancies.push(`Table ${tableName} is missing columns: ${missingColumns.join(', ')}`);
            }
        }

        const [fks] = await sequelize.query(`
      SELECT 
        OBJECT_NAME(f.parent_object_id) AS TableName,
        COL_NAME(fc.parent_object_id, fc.parent_column_id) AS ColumnName,
        OBJECT_NAME (f.referenced_object_id) AS RefTable,
        COL_NAME(fc.referenced_object_id, fc.referenced_column_id) AS RefColumn
      FROM sys.foreign_keys AS f
      INNER JOIN sys.foreign_key_columns AS fc ON f.object_id = fc.constraint_object_id
    `);
        auditReport.foreignKeys = fks;

        fs.writeFileSync('audit_report.json', JSON.stringify(auditReport, null, 2));
        console.log('Audit completed. Results written to audit_report.json');

    } catch (error) {
        console.error('Audit failed:', error.message);
    } finally {
        await sequelize.close();
    }
}

performAudit();
