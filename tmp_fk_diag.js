const { sequelize } = require('./src/models');
(async () => {
  try {
    const [fkRows] = await sequelize.query(`
      SELECT TOP 10
        fk.name AS FKName,
        s1.name AS ChildSchema,
        t1.name AS ChildTable,
        c1.name AS ChildColumn,
        s2.name AS ParentSchema,
        t2.name AS ParentTable,
        c2.name AS ParentColumn
      FROM sys.foreign_keys fk
      JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
      JOIN sys.tables t1 ON fkc.parent_object_id = t1.object_id
      JOIN sys.schemas s1 ON t1.schema_id = s1.schema_id
      JOIN sys.columns c1 ON c1.object_id = t1.object_id AND c1.column_id = fkc.parent_column_id
      JOIN sys.tables t2 ON fkc.referenced_object_id = t2.object_id
      JOIN sys.schemas s2 ON t2.schema_id = s2.schema_id
      JOIN sys.columns c2 ON c2.object_id = t2.object_id AND c2.column_id = fkc.referenced_column_id
      WHERE t1.name = 'TabReclamation' AND c1.name = 'TechnicienID'
    `);
    console.log('FK rows:', JSON.stringify(fkRows, null, 2));

    const [sampleRec] = await sequelize.query("SELECT TOP 5 ID, NumTicket, TechnicienID, NomTechnicien FROM TabReclamation ORDER BY ID DESC");
    console.log('Sample claims:', JSON.stringify(sampleRec, null, 2));
    process.exit(0);
  } catch (e) {
    console.error('ERR', e.message);
    process.exit(1);
  }
})();
