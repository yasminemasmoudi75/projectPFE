const Mouvement = require('../models/Mouvement');
const { sequelize } = require('../config/database');
const { Op, fn, col, where, literal } = require('sequelize');

/**
 * Service pour enregistrer tous les mouvements/transformations de documents
 * ✅ Utilise la table réelle: dbo.MvtDocs (15 colonnes)
 * Enregistre: CRÉATION et TRANSFORMATION de documents
 */

/**
 * Enregistrer une transformation de document
 * Ex: Devis → BCV, BCV → BLV, BCV → FAV
 */
exports.enregistrerTransformation = async (sourceType, sourceNf, targetType, targetNf, montants = {}, userId = null) => {
    try {
        console.log(`📝 Transformation: ${sourceType} #${sourceNf} → ${targetType} #${targetNf}`);
        
        const mouvement = await Mouvement.create({
            NF: targetNf,
            Document: targetType,
            MDate: fn('GETDATE'),
            CodTiers: montants.codTiers || null,
            LibTiers: montants.libTiers || null,
            TotHT: montants.totalHT || 0,
            TotRem: montants.totalRem || 0,
            TotFodec: montants.totalFodec || 0,
            TotTva: montants.totalTVA || 0,
            TotTTC: montants.totalTTC || 0,
            Debit: 0,
            Credit: 0,
            Flags: 1,  // Flag = 1 pour indiquer une transformation
            UserId: userId
        });
        
        console.log(`✅ Mouvement transformation enregistré: ${targetType} #${targetNf}`);
        return mouvement;
    } catch (error) {
        console.error(`❌ Erreur transformation ${sourceType} #${sourceNf} → ${targetType} #${targetNf}:`, error);
        throw error;
    }
};

/**
 * Enregistrer une CRÉATION de document
 * Ex: Nouveau Devis, BCV, BLV, FAV
 */
exports.enregistrerCreation = async (docType, docNf, montants = {}, userId = null) => {
    try {
        const mouvement = await Mouvement.create({
            NF: docNf,
            Document: docType,
            MDate: fn('GETDATE'),
            CodTiers: montants.codTiers || null,
            LibTiers: montants.libTiers || null,
            TotHT: montants.totalHT || 0,
            TotRem: montants.totalRem || 0,
            TotFodec: montants.totalFodec || 0,
            TotTva: montants.totalTVA || 0,
            TotTTC: montants.totalTTC || 0,
            Debit: 0,
            Credit: 0,
            Flags: 0,  // Flag = 0 pour indiquer une création
            UserId: userId
        });
        
        console.log(`✅ Création enregistrée: ${docType} #${docNf}`);
        return mouvement;
    } catch (error) {
        console.error(`❌ Erreur création mouvement pour ${docType} #${docNf}:`, error);
        throw error;
    }
};

/**
 * Récupérer l'historique des mouvements d'un document
 * Retourne l'historique complet pour tracer les transformations
 */
exports.obtenirHistorique = async (docType, docNf) => {
    try {
        const historique = await Mouvement.findAll({
            where: {
                Document: docType,
                NF: docNf
            },
            order: [['MDate', 'DESC']],
            raw: false
        });
        
        console.log(`📊 Historique: ${historique.length} mouvement(s) trouvé(s)`);
        return historique;
    } catch (error) {
        console.error(`❌ Erreur récupération historique ${docType} #${docNf}:`, error);
        throw error;
    }
};

/**
 * Obtenir tous les mouvements avec pagination et filtres
 */
exports.obtenirTousMouvements = async (page = 1, limit = 50, filters = {}) => {
    try {
        const offset = (page - 1) * limit;
        const whereConditions = {};
        const andConditions = [];
        
        if (filters.docType) whereConditions.Document = filters.docType;
        if (filters.codTiers) whereConditions.CodTiers = filters.codTiers;
        if (filters.nf) whereConditions.NF = filters.nf;
        
        // Filtres de dates - utiliser CONVERT pour SQL Server (MSSQL syntax)
        if (filters.dateDebut) {
            console.log('🗓️ DateDebut filter:', filters.dateDebut);
            andConditions.push(
                sequelize.where(
                    sequelize.fn('CONVERT', sequelize.literal('DATE'), sequelize.col('MDate')),
                    Op.gte,
                    filters.dateDebut
                )
            );
        }
        
        if (filters.dateFin) {
            console.log('🗓️ DateFin filter:', filters.dateFin);
            andConditions.push(
                sequelize.where(
                    sequelize.fn('CONVERT', sequelize.literal('DATE'), sequelize.col('MDate')),
                    Op.lte,
                    filters.dateFin
                )
            );
        }
        
        // Ajouter les conditions AND si des filtres de date existent
        if (andConditions.length > 0) {
            whereConditions[Op.and] = andConditions;
        }
        
        console.log('🔍 WhereConditions prepared. DateDebut:', !!filters.dateDebut, 'DateFin:', !!filters.dateFin);
        
        const { count, rows } = await Mouvement.findAndCountAll({
            where: whereConditions,
            order: [['MDate', 'DESC']],
            limit,
            offset,
            raw: false
        });
        
        console.log('✅ Found', count, 'total movements, returning', rows.length);
        
        return {
            total: count,
            page,
            totalPages: Math.ceil(count / limit),
            limit,
            data: rows
        };
    } catch (error) {
        console.error('❌ Erreur récupération mouvements:', error);
        throw error;
    }
};

/**
 * Obtenir les statistiques par type de document
 */
exports.obtenirStatistiques = async (dateDebut, dateFin) => {
    try {
        const whereConditions = {};
        const andConditions = [];
        
        // Filtres de dates - utiliser CONVERT pour SQL Server
        if (dateDebut) {
            andConditions.push(
                sequelize.where(
                    sequelize.fn('CONVERT', sequelize.literal('DATE'), sequelize.col('MDate')),
                    Op.gte,
                    dateDebut
                )
            );
        }
        
        if (dateFin) {
            andConditions.push(
                sequelize.where(
                    sequelize.fn('CONVERT', sequelize.literal('DATE'), sequelize.col('MDate')),
                    Op.lte,
                    dateFin
                )
            );
        }
        
        // Ajouter les conditions AND si des filtres de date existent
        if (andConditions.length > 0) {
            whereConditions[Op.and] = andConditions;
        }
        
        const stats = await Mouvement.findAll({
            attributes: [
                'Document',
                [fn('COUNT', col('ID')), 'total'],
                [fn('SUM', col('TotHT')), 'totalHT'],
                [fn('SUM', col('TotTva')), 'totalTva'],
                [fn('SUM', col('TotTTC')), 'totalTTC']
            ],
            where: whereConditions,
            group: ['Document'],
            raw: true,
            subQuery: false
        });
        
        return stats;
    } catch (error) {
        console.error('❌ Erreur récupération statistiques:', error);
        throw error;
    }
};

/**
 * Obtenir les mouvements d'un client
 */
exports.obtenirMouvementsClient = async (codTiers, page = 1, limit = 50) => {
    try {
        const offset = (page - 1) * limit;
        
        const { count, rows } = await Mouvement.findAndCountAll({
            where: {
                CodTiers: codTiers
            },
            order: [['MDate', 'DESC']],
            limit,
            offset,
            raw: false
        });
        
        return {
            total: count,
            page,
            limit,
            data: rows
        };
    } catch (error) {
        console.error(`❌ Erreur mouvements client ${codTiers}:`, error);
        throw error;
    }
};
