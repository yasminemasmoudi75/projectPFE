const { sequelize } = require('../src/config/database');

const ROLES = ['Admin', 'Commercial', 'Agent', 'Technicien', 'Client'];

const MODULE_CODES = {
  USERS: 1,              // Module Utilisateurs
  MESSAGES: 2,           // Module Messages
  PROJETS: 3,            // Module Projets
  DEVIS: 4,              // Module Devis
  COMMANDES: 5,          // Module Commande (BCV)
  LIVRAISONS: 6,         // Module Livraison (BLV)
  FACTURES: 7,           // Module Facture (FAV)
  CALENDRIER: 8,         // Module Calendrier
  CLIENTS: 30,           // Module Client
  REGLEMENT: 51,         // Module Reglement
  SAV: 31,               // Module Réclamations/SAV
  MENU: 32,              // Menu
  TOURNEE: 40,           // Module Tournée
  CHARGEMENT: 41,        // Module Chargement
  OBJECTIFS: 42,         // Module Objectif
  RECAP: 43,             // Module Recap
  RELEVE: 44,            // Module Relevé
  VISITES: 45,           // Module visite
  STOCK: 46,             // Stock
  SOLDE_CLIENT: 47,      // soldeClient
  MAPS: 52,              // Maps
};

const defaultPermissions = {
  Admin: { canAdd: 1, canEdit: 1, canDelt: 1, Actif: 1 },
  Commercial: { canAdd: 1, canEdit: 1, canDelt: 0, Actif: 1 }, // Default for commercials
  Agent: { canAdd: 0, canEdit: 0, canDelt: 0, Actif: 1 },
  Technicien: { canAdd: 0, canEdit: 1, canDelt: 0, Actif: 1 },
  Client: { canAdd: 0, canEdit: 0, canDelt: 0, Actif: 1 } 
};

// Exeptions per module per role
// You can adjust these defaults. For instance, Client can create SAV (claims).
const customOverrides = {
  Client: {
    [MODULE_CODES.SAV]: { canAdd: 1, canEdit: 0, canDelt: 0, Actif: 1 },
    [MODULE_CODES.DEVIS]: { canAdd: 1, canEdit: 0, canDelt: 0, Actif: 1 },
    // Only view certain modules
    [MODULE_CODES.FACTURES]: { canAdd: 0, canEdit: 0, canDelt: 0, Actif: 1 },
    [MODULE_CODES.COMMANDES]: { canAdd: 0, canEdit: 0, canDelt: 0, Actif: 1 },
    [MODULE_CODES.REGLEMENT]: { canAdd: 0, canEdit: 0, canDelt: 0, Actif: 1 }
  },
  Commercial: {
    [MODULE_CODES.USERS]: { canAdd: 0, canEdit: 0, canDelt: 0, Actif: 0 },
    [MODULE_CODES.CLIENTS]: { canAdd: 1, canEdit: 1, canDelt: 0, Actif: 1 },
    [MODULE_CODES.DEVIS]: { canAdd: 1, canEdit: 1, canDelt: 0, Actif: 1 },
    [MODULE_CODES.PROJETS]: { canAdd: 1, canEdit: 1, canDelt: 0, Actif: 1 }
  }
};

async function fixPermissions() {
  try {
    for (const role of ROLES) {
      for (const [key, codMod] of Object.entries(MODULE_CODES)) {
        // Base permission for this role
        const defaults = defaultPermissions[role] || { canAdd: 0, canEdit: 0, canDelt: 0, Actif: 0 };
        // Overrides
        const override = customOverrides[role]?.[codMod] || {};
        
        const perms = { ...defaults, ...override };

        const query = `
          MERGE INTO TabAWProfileAccess AS target
          USING (SELECT '${role}' AS ProfileUser, ${codMod} AS CodMod) AS source
          ON target.ProfileUser = source.ProfileUser AND target.CodMod = source.CodMod
          WHEN NOT MATCHED THEN
              INSERT (ProfileUser, CodMod, LibMod, Actif, canAdd, canEdit, canDelt)
              VALUES ('${role}', ${codMod}, 'Module ${key}', ${perms.Actif}, ${perms.canAdd}, ${perms.canEdit}, ${perms.canDelt});
        `;
        
        await sequelize.query(query);
      }
      console.log(`✅ Permissions updated for role: ${role}`);
    }
    console.log('🎉 All roles and permissions properly synchronized!');
  } catch (error) {
    console.error('❌ Error fixing permissions:', error);
  } finally {
    process.exit();
  }
}

fixPermissions();