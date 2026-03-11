/**
 * ================================================================
 * EXEMPLE D'IMPLÉMENTATION: DIController.js
 * ================================================================
 * Cet exemple montre exactement comment implémenter le controller
 * pour la gestion des Demandes d'Intervention (DI).
 * 
 * À copier/adapter pour BonTravailController, EquipementController, etc.
 */

'use strict';

const { DI, Equipement, Symptome, User, EquipDi, BonTravail } = require('../models');
const { Op } = require('sequelize');

// ============================================================
// 1. LISTER TOUTES LES DI (Avec pagination, recherche, filtres)
// ============================================================
exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, statut } = req.query;
    const offset = (page - 1) * limit;

    // Construire les conditions de recherche
    const where = {};
    if (search) {
      where[Op.or] = [
        { DescPanne: { [Op.like]: \`%\${search}%\` } },
        { CodServ: { [Op.like]: \`%\${search}%\` } },
        { NumDI: { [Op.eq]: parseInt(search) || null } }
      ];
    }
    
    // Filtrer par statut si fourni
    if (statut) {
      where.Statut = statut;
    }

    // Charger les DI avec relations
    const { count, rows } = await DI.findAndCountAll({
      where,
      offset,
      limit: parseInt(limit),
      include: [
        {
          model: Equipement,
          as: 'equipement',
          attributes: ['IDEquip', 'DesEquip', 'CodEquip']
        },
        {
          model: Symptome,
          as: 'symptome',
          attributes: ['CodSymp', 'DesSymp']
        },
        {
          model: EquipDi,
          as: 'assignations',
          include: [
            const pageNumber = Number.parseInt(page, 10) || 1;
            const limitNumber = Number.parseInt(limit, 10) || 10;
            const offset = (pageNumber - 1) * limitNumber;
              model: User,
              as: 'intervenant',
              const orConditions = [
                { DescPanne: { [Op.like]: `%${search}%` } },
                { CodServ: { [Op.like]: `%${search}%` } }
              ];
              const numericSearch = Number.parseInt(search, 10);
              if (!Number.isNaN(numericSearch)) {
                orConditions.push({ NumDI: { [Op.eq]: numericSearch } });
              }
              where[Op.or] = orConditions;
      order: [['DatCreate', 'DESC']]
    });

    res.status(200).json({
      success: true,
      message: 'DI chargées avec succès',
      total: count,
              limit: limitNumber,
      data: rows
    });

  } catch (error) {
    next(error);
  }
};

// ============================================================
// 2. VOIR UNE DI SPÉCIFIQUE (Avec tous les détails)
// ============================================================
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validation
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID de la DI est obligatoire'
      });
    }

    const di = await DI.findByPk(id, {
      include: [
        {
          model: Equipement,
          as: 'equipement',
          attributes: ['IDEquip', 'DesEquip', 'CodEquip', 'NumSeries', 'CodFam']
              pages: Math.ceil(count / limitNumber),
        {
          model: Symptome,
          as: 'symptome',
          attributes: ['CodSymp', 'DesSymp']
        },
        {
          model: EquipDi,
          as: 'assignations',
          attributes: ['ID', 'NumDI', 'IDInterv', 'NomInterv', 'CodInterv', 'DatDI'],
          include: [
            {
              model: User,
              as: 'intervenant',
              attributes: ['UserID', 'FullName', 'EmailPro', 'PosteOccupe']
            }
          ]
        },
        {
          model: BonTravail,
          as: 'bonsdetravail',
          attributes: ['IDBT', 'NumBT', 'DatBT', 'BTEncours', 'BTClotured']
        }
      ]
    });

    if (!di) {
      return res.status(404).json({
        success: false,
        message: 'DI non trouvée'
      });
    }

    res.status(200).json({
      success: true,
      message: 'DI récupérée avec succès',
      data: di
    });

  } catch (error) {
    next(error);
  }
};

// ============================================================
// 3. CRÉER UNE NOUVELLE DI (À partir d'une réclamation)
// ============================================================
exports.create = async (req, res, next) => {
  try {
    const {
      ReclamationID,
      DescPanne,
      CodSymp,
      IDEquip,
      CodServ,
      DatDI,
      Demandeur
    } = req.body;

    // Validation des champs obligatoires
    if (!DescPanne || !CodSymp) {
      return res.status(400).json({
        success: false,
        message: 'DescPanne et CodSymp sont obligatoires'
      });
    }

    // Vérifier que le symptôme existe
    const symptome = await Symptome.findByPk(CodSymp);
    if (!symptome) {
      return res.status(404).json({
        success: false,
        message: \`Symptôme '\${CodSymp}' non trouvé\`
      });
    }

    // Vérifier que l'équipement existe (s'il est fourni)
    if (IDEquip) {
      const equipement = await Equipement.findByPk(IDEquip);
      if (!equipement) {
        return res.status(404).json({
          success: false,
          message: \`Équipement '\${IDEquip}' non trouvé\`
        });
      }
    }

    // Créer la DI
    const di = await DI.create({
      ReclamationID,
      DescPanne,
      CodSymp,
      IDEquip: IDEquip || null,
      CodServ: CodServ || null,
      DatDI: DatDI || new Date(),
      Demandeur: Demandeur || req.user?.FullName || 'Administrateur',
      DatCreate: new Date()
    });

    // Récupérer la DI créée avec ses relations
    const diWithRelations = await DI.findByPk(di.IDDI, {
      include: [
        {
          model: Symptome,
          as: 'symptome',
          attributes: ['CodSymp', 'DesSymp']
        },
        {
          model: Equipement,
          as: 'equipement',
          attributes: ['IDEquip', 'DesEquip', 'CodEquip']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'DI créée avec succès',
      data: diWithRelations
    });

  } catch (error) {
    next(error);
  }
};

// ============================================================
// 4. MODIFIER UNE DI EXISTANTE
// ============================================================
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { DescPanne, CodSymp, IDEquip, Reponse, Comment } = req.body;

    // Validation du paramètre id
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID de la DI est obligatoire'
      });
    }

    const di = await DI.findByPk(id);
    if (!di) {
      return res.status(404).json({
        success: false,
        message: 'DI non trouvée'
      });
    }

    // Vérifier que les références existent si elles sont modifiées
    if (CodSymp) {
      const symptome = await Symptome.findByPk(CodSymp);
      if (!symptome) {
        return res.status(404).json({
          success: false,
          message: \`Symptôme '\${CodSymp}' non trouvé\`
        });
      }
    }

    if (IDEquip) {
      const equipement = await Equipement.findByPk(IDEquip);
      if (!equipement) {
        return res.status(404).json({
          success: false,
          message: \`Équipement '\${IDEquip}' non trouvé\`
        });
      }
    }

    // Mettre à jour les champs
    if (DescPanne) di.DescPanne = DescPanne;
    if (CodSymp) di.CodSymp = CodSymp;
    if (IDEquip) di.IDEquip = IDEquip;
    if (Reponse) di.Reponse = Reponse;
    if (Comment) di.Comment = Comment;
    
    di.DatModif = new Date();

    await di.save();

    // Retourner la DI avec ses relations
    const updatedDI = await DI.findByPk(id, {
      include: [
        {
          model: Equipement,
          as: 'equipement',
          attributes: ['IDEquip', 'DesEquip', 'CodEquip']
        },
        {
          model: Symptome,
          as: 'symptome',
          attributes: ['CodSymp', 'DesSymp']
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'DI mise à jour avec succès',
      data: updatedDI
    });

  } catch (error) {
    next(error);
  }
};

// ============================================================
// 5. ASSIGNER UN TECHNICIEN À UNE DI (Crée EquipDi)
// ============================================================
exports.assignTechnician = async (req, res, next) => {
  try {
    const { id } = req.params;  // id = IDDI
    const { IDInterv, DatDI } = req.body;

    // Validation des paramètres obligatoires
    if (!IDInterv) {
      return res.status(400).json({
        success: false,
        message: 'IDInterv (ID du technicien) est obligatoire'
      });
    }

    // Vérifier que la DI existe
    const di = await DI.findByPk(id);
    if (!di) {
      return res.status(404).json({
        success: false,
        message: 'DI non trouvée'
      });
    }

    // Vérifier que le technicien existe
    const technician = await User.findByPk(IDInterv);
    if (!technician) {
      return res.status(404).json({
        success: false,
        message: 'Technicien non trouvé'
      });
    }

    // Vérifier qu'un EquipDi n'existe pas déjà pour ce NumDI et technicien
    const existingAssignment = await EquipDi.findOne({
      where: { NumDI: di.NumDI, IDInterv }
    });
    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        message: 'Ce technicien est déjà assigné à cette DI'
      });
    }

    // Compter les assignations existantes pour générer le prochain ID
    const maxId = await EquipDi.max('ID', { where: { NumDI: di.NumDI } });
    const nextId = (maxId || 0) + 1;

    // Créer l'assignation EquipDi
    const equipDi = await EquipDi.create({
      NumDI: di.NumDI,
      ID: nextId,  // Auto-increment basé sur NumDI
      IDInterv,
      NomInterv: technician.FullName,
      CodInterv: technician.LoginName,
      DatDI: DatDI || new Date()
    });

    // AUTO-CRÉER LE BON DE TRAVAIL
    let bt = null;
    try {
      // Vérifier qu'un BT n'existe pas déjà
      const existingBT = await BonTravail.findOne({
        where: { IDDI: di.IDDI, IDInterv }
      });

      if (!existingBT) {
        bt = await BonTravail.create({
          NumDI: di.NumDI,
          IDDI: di.IDDI,
          IDInterv,
          DescPanne: di.DescPanne,
          CodSymp: di.CodSymp,
          IDEquip: di.IDEquip,
          DatBT: new Date(),
          BTEncours: 0,
          BTClotured: 0
        });
      } else {
        bt = existingBT;
      }
    } catch (btError) {
      console.error('Erreur lors de la création du BT:', btError.message);
      // Continuer même si BT ne peut pas être créé (EquipDi a été créé avec succès)
    }

    // NOTIFIER LE TECHNICIEN
    try {
      // TODO: Implémenter l'envoi d'email via emailService
      console.log(\`📧 Notification à \${technician.EmailPro}: Vous avez un BT assigné #\${bt?.NumBT || 'en attente'}\`);
      // Exemple (à décommenter après implémentation de emailService):
      // await emailService.sendAssignmentNotification(technician.EmailPro, di.NumDI, bt.NumBT);
    } catch (notificationError) {
      console.warn('Notification non envoyée:', notificationError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Technicien assigné à la DI. BT créé automatiquement.',
      data: {
        equipDi,
        bonTravail: bt
      }
    });

  } catch (error) {
    next(error);
  }
};

// ============================================================
// 6. SUPPRIMER UNE DI
// ============================================================
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validation
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID de la DI est obligatoire'
      });
    }

    const di = await DI.findByPk(id);
    if (!di) {
      return res.status(404).json({
        success: false,
        message: 'DI non trouvée'
      });
    }

    // Vérifier les bons de travail associés
    const btCount = await BonTravail.count({ where: { IDDI: id } });
    if (btCount > 0) {
      return res.status(400).json({
        success: false,
        message: \`Impossible de supprimer. \${btCount} bon(s) de travail existent. Supprimez-les d'abord.\`
      });
    }

    // Supprimer les assignations (EquipDi)
    const equipDiDeleted = await EquipDi.destroy({ where: { NumDI: di.NumDI } });
    console.log(\`Assignations supprimées: \${equipDiDeleted}\`);
    if (DescPanne !== undefined) di.DescPanne = DescPanne;
    if (CodSymp !== undefined) di.CodSymp = CodSymp;
    if (IDEquip !== undefined) di.IDEquip = IDEquip;
    if (Reponse !== undefined) di.Reponse = Reponse;
    if (Comment !== undefined) di.Comment = Comment;
      success: true,
      message: 'DI supprimée avec succès',
      data: {
        equipDiDeleted,
        diDeleted: true
      }
    });

  } catch (error) {
    next(error);
  }
};

// ============================================================
// 7. OBTENIR LES DI D'UN TECHNICIEN SPÉCIFIQUE
// ============================================================
exports.getTechnicianDI = async (req, res, next) => {
  try {
    const { technicianId } = req.params;
    
    // Validation
    if (!technicianId) {
      return res.status(400).json({
        success: false,
        message: 'technicianId est obligatoire'
      });
    }

    // Vérifier que le technicien existe
    const technician = await User.findByPk(technicianId);
    if (!technician) {
      return res.status(404).json({
        success: false,
        message: 'Technicien non trouvé'
      });
    }

    const dis = await DI.findAll({
      include: [
        {
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID de la DI est obligatoire'
        });
      }
          model: EquipDi,
          as: 'assignations',
          where: { IDInterv: technicianId },
          attributes: ['ID', 'NumDI', 'IDInterv', 'NomInterv', 'DatDI'],
          required: true
        },
        {
          model: Equipement,
          as: 'equipement',
          attributes: ['IDEquip', 'DesEquip', 'CodEquip']
        },
        {
          model: Symptome,
          as: 'symptome',
          attributes: ['CodSymp', 'DesSymp']
        },
        {
          model: BonTravail,
          as: 'bonsdetravail',
          attributes: ['IDBT', 'NumBT', 'DatBT', 'BTEncours', 'BTClotured'],
          where: { IDInterv: technicianId },
          required: false
        }
      ],
      order: [['DatCreate', 'DESC']]
    });

    res.status(200).json({
      success: true,
      message: 'DI du technicien récupérées avec succès',
      total: dis.length,
      data: dis
    });

  } catch (error) {
    next(error);
  }
};

// ============================================================
// EXPORT DE TOUTES LES FONCTIONS
// ============================================================

module.exports = exports;


// ════════════════════════════════════════════════════════════════════════════
// NOTES D'IMPLÉMENTATION:
// ════════════════════════════════════════════════════════════════════════════

/*
1. VALIDATIONS À AJOUTER:
   - Vérifier que CodSymp existe dans TabSymptome
   - Vérifier que IDEquip existe dans TabEquipement
   - Vérifier que IDInterv existe dans Sec_Users

2. AUTO-CRÉATIONS À IMPLÉMENTER:
   - Quand DI est créée → Auto-créer BT? (à décider)
   - Quand BT est clôturé → Auto-update Réclamation

3. FEATURES AVANCÉES:
   - Audit log: Tracker qui a modifié quoi
   - Notifications: Email/SMS au technicien
   - Escalade: Si DI pas terminée après N jours
   - Métriques: Temps moyen de résolution par type de panne

4. SÉCURITÉ:
   - Admin: Peut voir/modifier toutes les DI
   - Technicien: Peut voir seulement les siennes
   - Agent: Peut voir les DI de ses réclamations

5. PERFORMANCE:
   - Ajouter des indices sur NumDI, IDInterv, DatCreate
   - Pagination obligatoire pour les listes
   - Cache les symptômes/pannes/remèdes (petites tables)

*/
