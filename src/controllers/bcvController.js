const { BcvMaster, BcvDetail, Tiers, DevisMaster, DevisDetail, TabSociete, BlvMaster, BlvDetail, FavMaster, FavDetail, sequelize } = require('../models');
const { Op } = require('sequelize');
const PDFService = require('../services/pdfService');
const { randomUUID } = require('crypto');

/**
 * Récupérer tous les bons de commande (master)
 * Inclut à la fois les BCV (TabBcvm) et les devis convertis (TabDevm avec bTransf = true)
 */
exports.getAllBcv = async (req, res, next) => {
    try {
        const { search = '', page = 1, limit = 100 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const where = {
            // Exclure les BCV déjà transférés (comme les devis transférés en BC)
            bTransf: false
        };

        if (search) {
            where[Op.or] = [
                { LibTiers: { [Op.like]: `%${search}%` } },
                { CodTiers: { [Op.like]: `%${search}%` } },
            ];
        }

        // Récupérer les BCV de TabBcvm (non transférés)
        const { count: bcvCount, rows: bcvRows } = await BcvMaster.findAndCountAll({
            where,
            order: [['DatUser', 'DESC']],
            limit: parseInt(limit),
            offset,
        });

        // Récupérer les devis convertis de TabDevm (bTransf = true)
        const devisWhere = { ...where, bTransf: true };
        const { count: devisCount, rows: devisRows } = await DevisMaster.findAndCountAll({
            where: devisWhere,
            order: [['DatUser', 'DESC']],
            limit: parseInt(limit),
            offset,
        });

        // Combiner les deux listes et marquer la source
        const bcvWithSource = bcvRows.map(bcv => ({
            ...bcv.toJSON(),
            _source: 'TabBcvm',
            Prfx: bcv.Prfx || 'BC'
        }));

        const devisWithSource = devisRows.map(devis => ({
            ...devis.toJSON(),
            _source: 'TabDevm',
            Prfx: 'BC' // Afficher comme BC au lieu de DV
        }));

        // Fusionner et trier par date
        const allOrders = [...bcvWithSource, ...devisWithSource].sort((a, b) => {
            const dateA = new Date(a.DatUser || 0);
            const dateB = new Date(b.DatUser || 0);
            return dateB - dateA; // Tri décroissant
        });

        const totalCount = bcvCount + devisCount;

        return res.status(200).json({
            status: 'success',
            pagination: {
                total: totalCount,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(totalCount / parseInt(limit)),
            },
            data: allOrders,
        });
    } catch (error) {
        console.error('❌ Error getAllBcv:', error);
        next(error);
    }
};

/**
 * Récupérer un bon de commande par Guid (avec ses détails)
 */
exports.getBcvById = async (req, res, next) => {
    try {
        const { id } = req.params;

        let bcv = await BcvMaster.findOne({
            where: { Guid: id },
            include: [
                {
                    model: BcvDetail,
                    as: 'details',
                },
            ],
        });

        if (bcv) {
            return res.status(200).json({ status: 'success', data: bcv.toJSON() });
        }

        // 2. Si non trouvé dans TabBcvm, chercher dans TabDevm (devis convertis)
        const devis = await DevisMaster.findOne({
            where: { Guid: id },
            include: [
                {
                    model: DevisDetail,
                    as: 'details'
                }
            ]
        });

        if (devis && devis.bTransf) {
            const bcvJson = devis.toJSON();
            bcvJson._source = 'TabDevm';
            bcvJson.Prfx = 'BC'; // Forcer le préfixe BC pour l'affichage
            return res.status(200).json({ status: 'success', data: bcvJson });
        }

        return res.status(404).json({ status: 'error', message: 'Bon de commande non trouvé' });
    } catch (error) {
        console.error('❌ Error getBcvById:', error);
        next(error);
    }
};

/**
 * Générer le PDF d'un bon de commande
 */
exports.generateBcvPDF = async (req, res, next) => {
    try {
        const { id } = req.params;

        // 1. Chercher d'abord dans TabBcvm
        let bcv = await BcvMaster.findOne({
            where: { Guid: id },
            include: [
                {
                    model: BcvDetail,
                    as: 'details'
                },
                {
                    model: Tiers,
                    as: 'client'
                }
            ]
        });

        let docData = null;

        if (bcv) {
            docData = bcv.toJSON();
        } else {
            // 2. Si non trouvé, chercher dans TabDevm
            const devis = await DevisMaster.findOne({
                where: { Guid: id },
                include: [
                    {
                        model: DevisDetail,
                        as: 'details'
                    },
                    {
                        model: Tiers,
                        as: 'tiers'
                    }
                ]
            });

            if (devis && devis.bTransf) {
                docData = devis.toJSON();
                docData.client = docData.tiers; // Mapper tiers vers client pour le template
                docData.Prfx = docData.Prfx || 'BC';
            }
        }

        if (!docData) {
            return res.status(404).json({ status: 'error', message: 'Bon de commande non trouvé' });
        }

        // 3. Récupérer les infos société
        const soc = await TabSociete.findOne();

        // 4. Générer le PDF via le service
        const pdfBuffer = await PDFService.generateCommercialPDF(docData, soc, 'BON DE COMMANDE');

        // 5. Envoyer le PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=bc_${docData.Prfx || 'BC'}${docData.Nf}.pdf`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('❌ Error generateBcvPDF:', error);
        next(error);
    }
};

/**
 * Transférer un bon de commande vers un BL ou une Facture
 */
exports.transferBcv = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { targetType } = req.body; // 'BL' ou 'FAC'

        if (!['BL', 'FAC'].includes(targetType)) {
            return res.status(400).json({ status: 'error', message: 'Type de transfert invalide' });
        }

        // 1. Chercher le BCV (soit dans TabBcvm, soit dans TabDevm)
        let sourceData = await BcvMaster.findOne({
            where: { Guid: id },
            include: [{ model: BcvDetail, as: 'details' }]
        });

        if (!sourceData) {
            const devis = await DevisMaster.findOne({
                where: { Guid: id },
                include: [{ model: DevisDetail, as: 'details' }]
            });
            if (devis && devis.bTransf) {
                sourceData = devis;
            }
        }

        if (!sourceData) {
            return res.status(404).json({ status: 'error', message: 'Bon de commande source non trouvé' });
        }

        const data = sourceData.toJSON();
        const details = data.details || [];

        // 2. Préparer les nouveaux objets
        const newGuid = randomUUID();

        // Trouver le prochain numéro (Nf)
        const MasterModel = targetType === 'BL' ? BlvMaster : FavMaster;
        const DetailModel = targetType === 'BL' ? BlvDetail : FavDetail;

        const maxNf = await MasterModel.max('Nf', { transaction: t }) || 0;
        const nextNf = maxNf + 1;

        // Mapper explicitement les champs pour éviter les incompatibilités
        // EXCLURE les colonnes calculées (NetHT, Rest, etc.)
        const masterData = {
            Guid: newGuid,
            Prfx: targetType === 'BL' ? 'BL' : 'FA',
            Nf: nextNf,
            CodTiers: data.CodTiers,
            LibTiers: data.LibTiers,
            IDContact: data.IDContact,
            Adresse: data.Adresse,
            Remarq: data.Remarq,
            AssujTiers: data.AssujTiers,
            TotHT: data.TotHT,
            TotTva: data.TotTva,
            TotTTC: data.TotTTC,
            TotRem: data.TotRem,
            Timbre: data.Timbre,
            MntDebit: data.MntDebit,
            MntCredit: data.MntCredit,
            CodMag: data.CodMag,
            CodRepres: data.CodRepres,
            CodDev: data.CodDev,
            DatUser: sequelize.fn('GETDATE'),
            Valid: false,
            bTransf: false,
            bLivr: targetType === 'BL'
        };

        // 3. Créer le Master
        await MasterModel.create(masterData, { transaction: t });

        // 4. Créer les Détails
        // EXCLURE les colonnes calculées (MntHT, MntTVA, MntTTC, MntFodec)
        const newDetails = details.map((d) => ({
            Guid: randomUUID(),
            NF: nextNf,
            CodArt: d.CodArt,
            LibArt: d.LibArt,
            Qt: d.Qt,
            PuHT: d.PuHT,
            PuTTC: d.PuTTC,
            MntRem: d.MntRem,
            MntTVA: d.MntTVA, // Normalement calculé mais parfois on veut forcer
            Codabar: d.Codabar,
            IDArt: d.IDArt,
            ID: targetType === 'BL' ? 'BL' : 'FA'
        }));

        // Si SQL Server râle encore sur MntTVA/MntHT, on les retire complètement
        const sanitizedDetails = newDetails.map(d => {
            const { MntHT, MntTVA, MntTTC, MntFodec, ...rest } = d;
            return rest;
        });

        await DetailModel.bulkCreate(sanitizedDetails, { transaction: t });

        // 5. Marquer le BC source comme transféré (disparaît de la liste BC)
        await sourceData.constructor.update(
            { bTransf: true },
            { where: { Guid: id }, transaction: t }
        );

        await t.commit();

        return res.status(201).json({
            status: 'success',
            message: `Bon de commande transféré vers ${targetType === 'BL' ? 'Bon de Livraison' : 'Facture'} avec succès`,
            data: {
                Guid: newGuid,
                Nf: nextNf,
                type: targetType
            }
        });

    } catch (error) {
        if (t) await t.rollback();
        console.error('❌ Error transferBcv:', error);
        next(error);
    }
};
