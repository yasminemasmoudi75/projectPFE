const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const TiersClasseAuto = sequelize.define('TiersClasseAuto', {
        CodTiers: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false,
            field: 'CodTiers'
        },
        CA: {
            type: DataTypes.FLOAT,
            field: 'CA'
        },
        ClasseCalculee: {
            type: DataTypes.STRING,
            field: 'ClasseCalculee'
        }
    }, {
        tableName: 'ViewCalculClasseTiers',
        timestamps: false,
        freezeTableName: true
    });

    return TiersClasseAuto;
};
