const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const toNullableString = (value) => {
  if (value === undefined || value === null || value === '') return null;
  return String(value);
};

const toNumericValue = (value) => {
  if (value === undefined || value === null || value === '') return 0;
  const parsed = Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
};

const extractWeekNumber = (value) => {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? Math.trunc(value) : null;
  const match = String(value).match(/([0-9]+)/);
  return match ? parseInt(match[1], 10) : null;
};

const Objectif = sequelize.define('Objectif', {
  ID_Objectif: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
    field: 'IdObj'
  },
  IdCont: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'IdCont'
  },
  TypeObjectif: {
    type: DataTypes.STRING(250),
    allowNull: true,
    field: 'TypeObj'
  },
  TypePeriode: {
    type: DataTypes.STRING(30),
    allowNull: true,
    field: 'type',
    get() {
      return this.getDataValue('TypePeriode') || (this.getDataValue('Numsem') ? 'Hebdomadaire' : 'Mensuel');
    }
  },
  DateDebut: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'DateD'
  },
  DateFin: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'DateF'
  },
  Mois: {
    type: DataTypes.STRING(30),
    allowNull: true,
    field: 'Mois',
    get() {
      const value = this.getDataValue('Mois');
      if (value === undefined || value === null || value === '') return null;
      const parsed = parseInt(value, 10);
      return Number.isNaN(parsed) ? value : parsed;
    },
    set(value) {
      this.setDataValue('Mois', toNullableString(value));
    }
  },
  // Gestion robuste de la colonne Annee/Anne
  Annee: {
    type: DataTypes.STRING(30),
    allowNull: true,
    field: 'Anne', // Doit correspondre à la colonne SQL exacte
    get() {
      // Fallback : si la colonne n'existe pas, retourne null
      try {
        const value = this.getDataValue('Annee');
        if (value === undefined || value === null || value === '') return null;
        const parsed = parseInt(value, 10);
        return Number.isNaN(parsed) ? value : parsed;
      } catch (e) {
        return null;
      }
    },
    set(value) {
      try {
        this.setDataValue('Annee', toNullableString(value));
      } catch (e) {
        // ignore si la colonne n'existe pas
      }
    }
  },
  Numsem: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'Numsem'
  },
  MontantCible: {
    type: DataTypes.STRING(30),
    allowNull: true,
    field: 'autObj',
    get() {
      return toNumericValue(this.getDataValue('MontantCible'));
    },
    set(value) {
      this.setDataValue('MontantCible', toNullableString(value));
    }
  },
  Montant_Realise_Actuel: {
    type: DataTypes.STRING(30),
    allowNull: true,
    field: 'autVal',
    get() {
      return toNumericValue(this.getDataValue('Montant_Realise_Actuel'));
    },
    set(value) {
      this.setDataValue('Montant_Realise_Actuel', toNullableString(value));
    }
  },
  autObj: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.get('MontantCible');
    }
  },
  autVal: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.get('Montant_Realise_Actuel');
    }
  },
  CodTiers: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'CodTiers'
  },
  DateCreation: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'DateCreation',
    defaultValue: DataTypes.NOW
  },
  StatutObjectif: {
    type: DataTypes.STRING(30),
    allowNull: true,
    field: 'StatutObjectif'
  },
  DateClotureAdmin: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'DateClotureAdmin'
  },
  IdUtilisateurClotureAdmin: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'IdUtilisateurClotureAdmin'
  },
  DateArchivage: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'DateArchivage',
    comment: 'Date archivage automatique (date fin dépassée ou montant atteint)'
  },
  NombreReglementsLies: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'NombreReglementsLies'
  },
  Libelle_Indicateur: {
    type: DataTypes.STRING(1000),
    allowNull: true,
    field: 'Discription'
  },
  ID_Utilisateur: {
    type: DataTypes.VIRTUAL,
    get() {
      if (this.utilisateur?.UserID !== undefined) return this.utilisateur.UserID;
      return this.getDataValue('ID_Utilisateur') ?? null;
    },
    set(value) {
      if (value === undefined || value === null || value === '') {
        this.setDataValue('ID_Utilisateur', null);
        return;
      }
      const parsed = parseInt(value, 10);
      this.setDataValue('ID_Utilisateur', Number.isNaN(parsed) ? null : parsed);
    }
  },
  Semaine: {
    type: DataTypes.VIRTUAL,
    get() {
      const weekNumber = this.getDataValue('Numsem');
      return weekNumber == null ? null : `Semaine ${weekNumber}`;
    },
    set(value) {
      this.setDataValue('Numsem', extractWeekNumber(value));
    }
  },
  Description: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.getDataValue('Libelle_Indicateur') || null;
    },
    set(value) {
      this.setDataValue('Libelle_Indicateur', value || null);
    }
  },
  Titre: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.getDataValue('TypeObjectif') || this.getDataValue('Libelle_Indicateur') || null;
    }
  },
  Valeur_Cible: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.get('MontantCible');
    }
  },
  Valeur_Actuelle: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.get('Montant_Realise_Actuel');
    }
  },
  Unite: {
    type: DataTypes.VIRTUAL,
    get() {
      return 'DT';
    }
  },
  Avancement: {
    type: DataTypes.VIRTUAL,
    get() {
      const target = Number(this.get('MontantCible'));
      const actual = Number(this.get('Montant_Realise_Actuel'));
      if (!target || isNaN(target)) return 0;
      return Math.min(Math.round((actual / target) * 100), 100);
    }
  },
  Statut: {
    type: DataTypes.VIRTUAL,
    get() {
      const target = Number(this.get('MontantCible'));
      const actual = Number(this.get('Montant_Realise_Actuel'));
      if (!target || isNaN(target)) return 'En cours';
      return actual >= target ? 'Terminé' : 'En cours';
    }
  }
  ,
  AutObjAffiche: {
    type: DataTypes.VIRTUAL,
    get() {
      const format = (v) => {
        const n = Number(v) || 0;
        return n.toFixed(2).replace('.', ',');
      };
      const actual = format(this.get('Montant_Realise_Actuel'));
      const cible = format(this.get('MontantCible'));
      return `${actual} / ${cible} TND`;
    }
  }
}, {
  tableName: 'Objectif',
  timestamps: false,
  freezeTableName: true
});

module.exports = Objectif;
