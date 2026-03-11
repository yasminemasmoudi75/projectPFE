const fs = require('fs');
const schema = JSON.parse(fs.readFileSync('database_schema.json', 'utf8'));

const relevantTables = [
    'UCS_USERS', 'UCS_USERINFO', 'UCS_PROFILES', 'TabAWProfileAccess', 'UCS_PACCESS', 'UCS_FORMINFO', 'UCS_LOGIN_TRACE', 'UCS_AUDIT',
    'Sec_Users', 'Sec_UserAccess', 'Sec_Permissions', 'Sec_Groups', 'Sec_GroupMembers',
    'TabTiers', 'TabTiersAdr', 'TabTiersContact', 'TabTiersHistory', 'TabTiersCateg', 'TabTiersArtPrix',
    'TabStock', 'TabStockD', 'TabStockComp', 'TabStockSeries', 'TabPrixCateg', 'TabPrixFamCateg', 'TabLot', 'TabStatArt',
    'TabDevm', 'TabDevd', 'TabBcvm', 'TabBcvd', 'TabBlvm', 'TabBlvd', 'TabFavm', 'TabFavd', 'TabDocGlobalLines', 'TabDocRemarq',
    'TabAchats', 'TabAchD',
    'TabReg', 'TabRegD', 'TabRegF',
    'TabComptab', 'TabComptabPlan', 'TabComptabModel',
    'TabProjet', 'TabActivite', 'Objectif',
    'TabReclamation', 'TabDI', 'TabBT', 'TabEquipement', 'TabSymptome', 'TabPanne', 'TabService', 'TabDevises', 'TabIntervPrevent',
    'MSGUsers', 'MSGContacts', 'MSGMessages',
    'MvtDocs', 'MvtStock', 'MvtVentes', 'MvtRepres'
];

const essentialKeywords = [
    'ID', 'GUID', 'COD', 'LIB', 'DATE', 'DAT', 'MNT', 'PRIX', 'QTE', 'RAISOC', 'NOM', 'TYPE', 'STATUT', 'USER', 'ADMIN', 'PROF', 'NF', 'PRFX', 'SUFX', 'MONTANT', 'TOTAL'
];

function isEssential(colName) {
    const name = colName.toUpperCase();
    return essentialKeywords.some(keyword => name.includes(keyword));
}

let puml = '@startuml AA_PROJECT_SIMPLIFIED\n';
puml += 'skinparam dpi 200\n';
puml += 'hide empty members\n';
puml += 'title AA_PROJECT - Diagramme de Classes Simplifie (Attributs Essentiels)\n\n';

for (const tableName of relevantTables) {
    if (schema[tableName]) {
        puml += `class "${tableName}" {\n`;
        let count = 0;
        for (const col of schema[tableName]) {
            if (isEssential(col.COLUMN_NAME) || count < 5) {
                let type = col.DATA_TYPE;
                if (col.CHARACTER_MAXIMUM_LENGTH && col.CHARACTER_MAXIMUM_LENGTH !== -1) {
                    type += `(${col.CHARACTER_MAXIMUM_LENGTH})`;
                } else if (col.CHARACTER_MAXIMUM_LENGTH === -1) {
                    type += "(MAX)";
                }
                puml += `  +${col.COLUMN_NAME} : ${type}\n`;
                count++;
            }
            if (count > 20) break;
        }
        puml += '}\n\n';
    }
}

puml += '\n\' ------------------- RELATIONS PHYSIQUES -------------------\n';
const physicalRelations = [
    ["UCS_USERINFO", "0..*", "1", "UCS_USERS", "appartient a"],
    ["UCS_LOGIN_TRACE", "0..*", "1", "UCS_USERS", "trace login"],
    ["UCS_AUDIT", "0..*", "1", "UCS_USERS", "audit"],
    ["UCS_USERINFO", "0..*", "1", "UCS_PROFILES", "profil"],
    ["UCS_PACCESS", "0..*", "1", "UCS_PROFILES", "acces"],
    ["UCS_FORMINFO", "0..*", "1", "UCS_PROFILES", "formulaire"],
    ["TabAWProfileAccess", "0..*", "1", "UCS_PROFILES", "droits"],
    ["Sec_UserAccess", "0..*", "1", "Sec_Users", "utilisateur"],
    ["Sec_UserAccess", "0..*", "1", "Sec_Permissions", "permission"],
    ["Sec_GroupMembers", "0..*", "1", "Sec_Groups", "groupe"],
    ["Sec_GroupMembers", "0..*", "1", "Sec_Users", "membre"],
    ["TabTiersAdr", "0..*", "1", "TabTiers", "adresse"],
    ["TabTiersContact", "0..*", "1", "TabTiers", "contact"],
    ["TabTiersHistory", "0..*", "1", "TabTiers", "historique"],
    ["TabTiers", "0..*", "1", "TabTiersCateg", "categorie"],
    ["TabTiersArtPrix", "0..*", "1", "TabTiers", "tarif client"],
    ["TabTiersArtPrix", "0..*", "1", "TabStock", "tarif article"],
    ["TabStockD", "0..*", "1", "TabStock", "detail"],
    ["TabStockComp", "0..*", "1", "TabStock", "composition"],
    ["TabStockSeries", "0..*", "1", "TabStock", "serie"],
    ["TabPrixCateg", "0..*", "1", "TabStock", "prix art"],
    ["TabPrixCateg", "0..*", "1", "TabTiersCateg", "prix categ"],
    ["TabPrixFamCateg", "0..*", "1", "TabTiersCateg", "famille categ"],
    ["TabStatArt", "0..*", "1", "TabStock", "stats article"],
    ["TabDevd", "0..*", "1", "TabDevm", "composition"],
    ["TabDevm", "0..*", "1", "TabTiers", "client"],
    ["TabDevd", "0..*", "1", "TabStock", "article"],
    ["TabBcvd", "0..*", "1", "TabBcvm", "composition"],
    ["TabBcvm", "0..*", "1", "TabTiers", "client"],
    ["TabBcvd", "0..*", "1", "TabStock", "article"],
    ["TabBlvd", "0..*", "1", "TabBlvm", "composition"],
    ["TabBlvm", "0..*", "1", "TabTiers", "client"],
    ["TabBlvd", "0..*", "1", "TabStock", "article"],
    ["TabFavd", "0..*", "1", "TabFavm", "composition"],
    ["TabFavm", "0..*", "1", "TabTiers", "client"],
    ["TabFavd", "0..*", "1", "TabStock", "article"],
    ["TabReg", "0..*", "1", "TabTiers", "payeur"],
    ["TabRegD", "0..*", "1", "TabReg", "detail"],
    ["TabRegF", "0..*", "1", "TabReg", "pieces"],
    ["TabRegF", "0..*", "1", "TabFavm", "regle"],
    ["TabComptab", "0..*", "1", "TabComptabPlan", "compte"],
    ["TabComptabModel", "1", "0..*", "TabComptab", "modele"],
    ["TabProjet", "0..*", "1", "TabTiers", "client"],
    ["TabActivite", "0..*", "1", "TabProjet", "projet"],
    ["TabActivite", "0..*", "1", "Sec_Users", "gestionnaire"],
    ["Objectif", "0..*", "1", "Sec_Users", "responsable"],
    ["Objectif", "0..*", "0..1", "Objectif", "parent enfant"],
    ["TabReclamation", "0..*", "1", "TabTiers", "client"],
    ["TabReclamation", "0..*", "1", "Sec_Users", "technicien"],
    ["TabBT", "0..*", "1", "TabDI", "incident"],
    ["TabDI", "0..*", "1", "TabEquipement", "equipement"],
    ["TabBT", "0..*", "1", "TabEquipement", "equipement"],
    ["TabDI", "0..*", "1", "TabSymptome", "Symptome"],
    ["TabBT", "0..*", "1", "TabPanne", "Panne"],
    ["TabBT", "0..*", "1", "TabService", "Service"],
    ["TabBT", "0..*", "0..1", "TabIntervPrevent", "Reference Preventif"],
    ["TabReclamation", "1", "0..*", "TabDI", "Generation DI"],
    ["TabDI", "0..*", "1", "TabPanne", "Panne"],
    ["TabDI", "0..*", "1", "TabService", "Service"],
    ["MSGContacts", "0..*", "1", "MSGUsers", "proprietaire"],
    ["MSGContacts", "0..*", "1", "MSGUsers", "contact"],
    ["MSGMessages", "0..*", "1", "MSGUsers", "expediteur"],
    ["MSGMessages", "0..*", "1", "MSGUsers", "destinataire"]
];

for (const rel of physicalRelations) {
    if (schema[rel[0]] && schema[rel[3]]) {
        puml += `"${rel[0]}" "${rel[1]}" -- "${rel[2]}" "${rel[3]}" : "${rel[4]}"\n`;
    }
}

puml += '\n\' ------------------- RELATIONS METIER / LOGIQUES -------------------\n';
const logicalRelations = [
    ["TabDevm", "1", "0..*", "TabBcvm", "devis->bc"],
    ["TabDevm", "1", "0..*", "TabBlvm", "devis->bl"],
    ["TabBcvm", "1", "0..*", "TabFavm", "bc->facture"],
    ["TabDocGlobalLines", "0..*", "1", "TabDevm", "source doc"],
    ["TabDocGlobalLines", "0..*", "1", "TabBcvm", "source doc"],
    ["TabDocGlobalLines", "0..*", "1", "TabBlvm", "source doc"],
    ["TabDocGlobalLines", "0..*", "1", "TabFavm", "source doc"],
    ["TabDocRemarq", "0..*", "1", "TabDevm", "remarques"],
    ["TabDocRemarq", "0..*", "1", "TabBcvm", "remarques"],
    ["TabDocRemarq", "0..*", "1", "TabBlvm", "remarques"],
    ["TabDocRemarq", "0..*", "1", "TabFavm", "remarques"],
    ["TabLot", "0..*", "1", "TabStock", "CodArt"],
    ["TabLot", "0..*", "1", "TabTiers", "CodTiers"],
    ["TabPrixFamCateg", "0..*", "1", "TabStock", "CodFam"],
    ["MvtDocs", "0..*", "1", "TabTiers", "stats"],
    ["MvtStock", "0..*", "1", "TabTiers", "stats"],
    ["MvtStock", "0..*", "1", "TabStock", "stats"],
    ["MvtVentes", "0..*", "1", "TabTiers", "stats"],
    ["MvtVentes", "0..*", "1", "TabStock", "stats"],
    ["MvtRepres", "0..*", "1", "TabStock", "stats"],
    ["Objectif", "0..*", "1", "TabTiers", "cible client"],
    ["TabDevm", "0..*", "1", "TabDevises", "Devise"],
    ["TabFavm", "0..*", "1", "TabDevises", "Devise"]
];

for (const rel of logicalRelations) {
    if (schema[rel[0]] && schema[rel[3]]) {
        puml += `"${rel[0]}" "${rel[1]}" .. "${rel[2]}" "${rel[3]}" : "${rel[4]}"\n`;
    }
}

puml += '@enduml';
fs.writeFileSync('diagram_final.puml', puml);
console.log('Diagramme complet genere avec succès.');
