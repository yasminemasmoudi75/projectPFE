/**
 * Migration SQL - Ajouter support pour logique métier d'objectifs
 * 
 * Date: 2026-05-04
 * Objectif: Ajouter colonnes critiques pour:
 * - Gestion d'un objectif ACTIF par commercial
 * - Trace des clôtures forcées par admin
 * - Compteur de paiements liés
 */

const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

async function up() {
  const queryInterface = sequelize.getQueryInterface();

  try {
    console.log('📋 [MIGRATION] Ajouter colonnes critiques à Objectif...');

    // 1. Ajouter colonne StatutObjectif
    try {
      await queryInterface.addColumn('Objectif', 'StatutObjectif', {
        type: 'VARCHAR(30)',
        allowNull: false,
        defaultValue: 'ACTIF',
        comment: 'ACTIF / ACHEVÉ / NON_ATTEINT / INACTIF'
      });
      console.log('✅ Colonne StatutObjectif ajoutée');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('ℹ️  Colonne StatutObjectif existe déjà');
      } else {
        throw e;
      }
    }

    // 2. Ajouter colonne DateClotureAdmin
    try {
      await queryInterface.addColumn('Objectif', 'DateClotureAdmin', {
        type: 'DATETIME',
        allowNull: true,
        comment: 'Date de clôture forcée par admin'
      });
      console.log('✅ Colonne DateClotureAdmin ajoutée');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('ℹ️  Colonne DateClotureAdmin existe déjà');
      } else {
        throw e;
      }
    }

    // 3. Ajouter colonne IdUtilisateurClotureAdmin
    try {
      await queryInterface.addColumn('Objectif', 'IdUtilisateurClotureAdmin', {
        type: 'INT',
        allowNull: true,
        comment: 'ID de l\'admin qui a forcé la clôture'
      });
      console.log('✅ Colonne IdUtilisateurClotureAdmin ajoutée');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('ℹ️  Colonne IdUtilisateurClotureAdmin existe déjà');
      } else {
        throw e;
      }
    }

    // 4. Ajouter colonne NombreReglementsLies
    try {
      await queryInterface.addColumn('Objectif', 'NombreReglementsLies', {
        type: 'INT',
        allowNull: false,
        defaultValue: 0,
        comment: 'Nombre de paiements liés à cet objectif'
      });
      console.log('✅ Colonne NombreReglementsLies ajoutée');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('ℹ️  Colonne NombreReglementsLies existe déjà');
      } else {
        throw e;
      }
    }

    // 5. Ajouter index sur (IdCont, StatutObjectif) pour trouver rapidement l'ACTIF
    try {
      await queryInterface.addIndex('Objectif', ['IdCont', 'StatutObjectif'], {
        name: 'idx_Objectif_Commercial_Statut'
      });
      console.log('✅ Index idx_Objectif_Commercial_Statut ajouté');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('ℹ️  Index existe déjà');
      } else {
        console.warn('⚠️  Erreur ajout index:', e.message);
      }
    }

    console.log('✅ [MIGRATION UP] Complétée avec succès');

  } catch (error) {
    console.error('❌ [MIGRATION UP] Erreur:', error.message);
    throw error;
  }
}

async function down() {
  const queryInterface = sequelize.getQueryInterface();

  try {
    console.log('🔄 [MIGRATION DOWN] Revert colonnes...');

    // Supprimer l'index
    try {
      await queryInterface.removeIndex('Objectif', 'idx_Objectif_Commercial_Statut');
    } catch (e) {
      console.warn('⚠️  Index non trouvé pour suppression');
    }

    // Supprimer les colonnes
    await queryInterface.removeColumn('Objectif', 'NombreReglementsLies');
    await queryInterface.removeColumn('Objectif', 'IdUtilisateurClotureAdmin');
    await queryInterface.removeColumn('Objectif', 'DateClotureAdmin');
    await queryInterface.removeColumn('Objectif', 'StatutObjectif');

    console.log('✅ [MIGRATION DOWN] Complétée');

  } catch (error) {
    console.error('❌ [MIGRATION DOWN] Erreur:', error.message);
    throw error;
  }
}

module.exports = { up, down };
