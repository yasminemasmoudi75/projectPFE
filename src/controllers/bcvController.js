const { BcvMaster, BcvDetail, Tiers, TabSociete, BlvMaster, BlvDetail, FavMaster, FavDetail, sequelize } = require('../models');
const { Op } = require('sequelize');
const PDFService = require('../services/pdfService');
const { randomUUID } = require('crypto');

/**
 * Récupérer tous les bons de commande (master)
 * Ne consulte que TabBcvm — les devis convertis créent de vrais enregistrements BcvMaster
 */
exports.getAllBcv = async (req, res, next) => {
    try {
        const { search = '', page = 1, limit = 100 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const where = {
            // Exclure les BCV déjà transférés en BLV/Facture
            bTransf: { [Op.ne]: true }
        };

        if (search) {
            where[Op.or] = [
                { LibTiers: { [Op.like]: `%${search}%` } },
                { CodTiers: { [Op.like]: `%${search}%` } },
            ];
        }

        const { count, rows } = await BcvMaster.findAndCountAll({
            where,
            include: [{ model: Tiers, as: 'client' }],
            order: [['DatUser', 'DESC']],
            limit: parseInt(limit),
            offset,
        });

        return res.status(200).json({
            status: 'success',
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / parseInt(limit)),
            },
            data: rows,
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

        const bcv = await BcvMaster.findOne({
            where: { Guid: id },
            include: [
                { model: BcvDetail, as: 'details' },
                { model: Tiers, as: 'client' }
            ],
        });

        if (!bcv) {
            return res.status(404).json({ status: 'error', message: 'Bon de commande non trouvé' });
        }

        return res.status(200).json({ status: 'success', data: bcv.toJSON() });
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

        const bcv = await BcvMaster.findOne({
            where: { Guid: id },
            include: [
                { model: BcvDetail, as: 'details' },
                { model: Tiers, as: 'client' }
            ]
        });

        if (!bcv) {
            return res.status(404).json({ status: 'error', message: 'Bon de commande non trouvé' });
        }

        const docData = bcv.toJSON();

        // Récupérer les infos société
        const soc = await TabSociete.findOne();

        // Générer le PDF via le service
        const pdfBuffer = await PDFService.generateCommercialPDF(docData, soc, 'BON DE COMMANDE');

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

        // 1. Chercher le BCV dans TabBcvm
        const sourceData = await BcvMaster.findOne({
            where: { Guid: id },
            include: [{ model: BcvDetail, as: 'details' }]
        });

        if (!sourceData) {
            await t.rollback();
            return res.status(404).json({ status: 'error', message: 'Bon de commande source non trouvé' });
        }

        if (sourceData.bTransf) {
            await t.rollback();
            return res.status(400).json({ status: 'error', message: 'Ce bon de commande a déjà été transféré' });
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
        await BcvMaster.update(
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
