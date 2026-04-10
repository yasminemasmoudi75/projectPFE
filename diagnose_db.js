const { sequelize, User, Tiers, Product, DevisMaster, BcvMaster, BlvMaster, FavMaster } = require('./src/models');
const { QueryTypes } = require('sequelize');

async function diagnose() {
    console.log('==================================================');
    console.log('   DIAGNOSTIC AVANCÉ DE LA BASE DE DONNÉES AA');
    console.log('==================================================\n');

    try {
        await sequelize.authenticate();
        console.log('✅ Status Connexion : OPÉRATIONNEL');
    } catch (err) {
        console.error('❌ Status Connexion : ÉCHOUÉ');
        console.error(err.message);
        return;
    }

    // 1. Statistiques Globales
    console.log('\n--- 📊 STATISTIQUES DES TABLES ---');
    const countModels = [
        { label: 'Utilisateurs', model: User },
        { label: 'Tiers (Clients)', model: Tiers },
        { label: 'Produits (Catalogue)', model: Product },
        { label: 'Devis (Ventes)', model: DevisMaster },
        { label: 'Bons de Commande (BCV)', model: BcvMaster },
        { label: 'Bons de Livraison (BLV)', model: BlvMaster },
        { label: 'Factures (FAV)', model: FavMaster }
    ];

    for (const m of countModels) {
        try {
            const count = await m.model.count();
            console.log(`${m.label.padEnd(30)} : ${count.toLocaleString()} lignes`);
        } catch (e) {
            console.log(`${m.label.padEnd(30)} : ❌ Erreur (${e.message})`);
        }
    }

    // 2. Vérification de l'Unicité des Numéros (Nf)
    console.log('\n--- 🔑 VÉRIFICATION DES CLÉS (Nf) ---');
    const checkUniq = [
        { name: 'Devis (TabDevm)', table: 'TabDevm' },
        { name: 'BCV (TabBcvm)', table: 'TabBcvm' },
        { name: 'BLV (TabBlvm)', table: 'TabBlvm' },
        { name: 'FAV (TabFavm)', table: 'TabFavm' }
    ];

    for (const c of checkUniq) {
        try {
            const query = `SELECT Nf, COUNT(*) as cnt FROM ${c.table} GROUP BY Nf HAVING COUNT(*) > 1`;
            const duplicates = await sequelize.query(query, { type: QueryTypes.SELECT });
            if (duplicates.length > 0) {
                console.log(`${c.name.padEnd(30)} : ⚠️ ${duplicates.length} doublons de Nf détectés !`);
            } else {
                console.log(`${c.name.padEnd(30)} : ✅ Nf unique`);
            }
        } catch (e) {
            console.log(`${c.name.padEnd(30)} : ❌ Erreur (${e.message})`);
        }
    }

    // 3. Intégrité Master-Detail
    console.log('\n--- 🔍 INTÉGRITÉ RELATIONNELLE (Orphelins) ---');
    const integrity = [
        { label: 'Détails Devis (TabDevd)', detail: 'TabDevd', master: 'TabDevm' },
        { label: 'Détails BCV (TabBcvd)', detail: 'TabBcvd', master: 'TabBcvm' },
        { label: 'Détails BLV (TabBlvd)', detail: 'TabBlvd', master: 'TabBlvm' },
        { label: 'Détails FAV (TabFavd)', detail: 'TabFavd', master: 'TabFavm' }
    ];

    for (const i of integrity) {
        try {
            // On compte les lignes où NF n'existe pas dans le master Nf
            const query = `SELECT COUNT(*) as count FROM ${i.detail} d WHERE NOT EXISTS (SELECT 1 FROM ${i.master} m WHERE m.Nf = d.NF)`;
            const res = await sequelize.query(query, { type: QueryTypes.SELECT });
            const orphanCount = res[0].count;

            const nullQuery = `SELECT COUNT(*) as count FROM ${i.detail} WHERE NF IS NULL OR NF = 0`;
            const resNull = await sequelize.query(nullQuery, { type: QueryTypes.SELECT });
            const nullCount = resNull[0].count;

            if (orphanCount === 0) {
                console.log(`${i.label.padEnd(30)} : ✅ Parfait`);
            } else {
                console.log(`${i.label.padEnd(30)} : ⚠️ ${orphanCount} orphelins (${nullCount} avec NF vide/0)`);
            }
        } catch (e) {
            console.log(`${i.label.padEnd(30)} : ❌ Erreur (${e.message})`);
        }
    }

    // 4. Dernières Activités
    console.log('\n--- 📅 DERNIÈRES OPÉRATIONS ---');
    const actModels = [
        { label: 'Dernier Devis', model: DevisMaster },
        { label: 'Dernier BCV', model: BcvMaster },
        { label: 'Dernier BLV', model: BlvMaster },
        { label: 'Dernière Facture', model: FavMaster }
    ];

    for (const a of actModels) {
        try {
            const last = await a.model.findOne({ order: [['DatUser', 'DESC']] });
            if (last) {
                console.log(`${a.label.padEnd(30)} : ${new Date(last.DatUser).toLocaleString()} (Nf: ${last.Nf})`);
            } else {
                console.log(`${a.label.padEnd(30)} : Aucune donnée`);
            }
        } catch (e) {
            console.log(`${a.label.padEnd(30)} : ❌ Erreur (${e.message})`);
        }
    }

    console.log('\n==================================================');
    console.log('               FIN DU DIAGNOSTIC');
    console.log('==================================================');
}

diagnose().catch(console.error).finally(() => process.exit());
