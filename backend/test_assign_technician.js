const axios = require('axios');

const API = 'http://localhost:3066/api';

let token = '';
let reclamationID = null;
let technicienID = null;

async function test() {
    try {
        console.log('🔐 1. Connexion en tant qu\'admin...');
        const loginRes = await axios.post(`${API}/auth/login`, {
            email: 'admin@pfe.com',
            password: 'Admin1234'
        });
        token = loginRes.data.data.token;
        console.log('✅ Connecté, Token récupéré');

        console.log('\n👤 2. Récupération des utilisateurs (techniciens)...');
        const usersRes = await axios.get(`${API}/users`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const technicians = usersRes.data.data.filter(u => 
            u.UserRole === 'admin' || u.UserRole === 'user' || u.PosteOccupe?.includes('Technicien')
        );
        
        if (technicians.length === 0) {
            console.log('❌ Aucun technicien trouvé');
            return;
        }
        
        technicienID = technicians[0].UserID;
        console.log(`✅ Technicien trouvé: ${technicians[0].FullName} (ID: ${technicienID})`);

        console.log('\n📝 3. Création d\'une réclamation...');
        const createRes = await axios.post(`${API}/reclamations`, {
            LibTiers: 'Client Test',
            CodTiers: 'CLIENT001',
            Objet: 'Problème technique urgent',
            Description: 'Le système ne fonctionne pas correctement',
            TypeReclamation: 'Technique',
            Priorite: 'Haute'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        reclamationID = createRes.data.data.ID;
        console.log(`✅ Réclamation créée (ID: ${reclamationID}, Ticket: ${createRes.data.data.NumTicket})`);
        console.log(`   Statut initial: ${createRes.data.data.Statut}`);

        console.log(`\n👤 4. Affectation du technicien (ID: ${technicienID})...`);
        const assignRes = await axios.patch(`${API}/reclamations/${reclamationID}/assign-technician`, 
            {
                technicienID: technicienID
            },
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );
        
        console.log(`✅ Réclamation affectée`);
        console.log(`   Technicien: ${assignRes.data.data.NomTechnicien}`);
        console.log(`   Statut: ${assignRes.data.data.Statut}`);
        console.log(`   TechnicienID: ${assignRes.data.data.TechnicienID}`);

        console.log(`\n📋 5. Récupération des réclamations du technicien (ID: ${technicienID})...`);
        const techRecRes = await axios.get(`${API}/reclamations/technician/${technicienID}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log(`✅ Données du technicien:`);
        console.log(`   Nom: ${techRecRes.data.technicien.nom}`);
        console.log(`   Email: ${techRecRes.data.technicien.email}`);
        console.log(`   Nombre de réclamations: ${techRecRes.data.pagination.total}`);
        console.log(`   Réclamations:`);
        techRecRes.data.data.forEach((r, i) => {
            console.log(`   ${i + 1}. #${r.NumTicket} - ${r.Objet} (${r.Statut})`);
        });

        console.log(`\n❌ 6. Retrait de l'affectation du technicien...`);
        const removeRes = await axios.patch(`${API}/reclamations/${reclamationID}/remove-technician`, 
            {},
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );
        
        console.log(`✅ Affectation retirée`);
        console.log(`   Technicien: ${removeRes.data.data.NomTechnicien}`);
        console.log(`   Statut: ${removeRes.data.data.Statut}`);
        console.log(`   TechnicienID: ${removeRes.data.data.TechnicienID}`);

        console.log('\n✅ TOUS LES TESTS RÉUSSIS!');

    } catch (error) {
        console.error('❌ Erreur:', error.response?.data || error.message);
    }
}

test();
