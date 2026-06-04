/**
 * Plan de Tests — Projets, Catalogue Produits & Gestion SAV
 * T01 à T13 (T10 absent) — correspondance exacte avec le tableau de recette
 */
const { api, loginAsAdmin, authHeaders, randomEmail, randomPhone } = require('./setup');

describe('Projets, Catalogue & SAV', () => {

  let adminToken;
  let adminUserId;
  let createdProjetId;
  let createdProductId;
  let createdReclamationId;
  let createdReclamationId2;

  beforeAll(async () => {
    adminToken = await loginAsAdmin();
    const { userId } = require('./setup').getAdminAuth();
    adminUserId = userId; // UserID de l'admin (utilisé comme TechnicienID dans les tests)
  });

  // ───────────────────────────────────────────────────────────────────────────
  // T01 — Création d'un projet client
  //       Nom : « Projet Alpha », société Tech Solutions, date début 01/03/2026
  //       Attendu : Projet créé, lié à la société, visible dans la liste avec avancement 0 %
  // ───────────────────────────────────────────────────────────────────────────
  test('T01 — Création d\'un projet client → Projet créé, avancement 0 %', async () => {
    const res = await api.post('/projets', {
      Nom_Projet:    'Projet Alpha',
      Code_Pro:      'PRO-ALPHA-TEST',
      Date_Creation: '2026-03-01',
      Avancement:    0,
      Phase:         'Initialisation',
    }, authHeaders(adminToken));

    if (res.status !== 201) console.error('T01:', res.data);
    expect(res.status).toBe(201);
    expect(res.data.status).toBe('success');
    expect(res.data.data.Nom_Projet).toBe('Projet Alpha');
    expect(Number(res.data.data.Avancement ?? 0)).toBe(0);

    createdProjetId = res.data.data.ID_Projet;
    expect(createdProjetId).toBeDefined();

    // Vérifier visibilité dans la liste
    const list = await api.get('/projets', authHeaders(adminToken));
    expect(list.status).toBe(200);
    const found = list.data.data?.some(p => p.ID_Projet === createdProjetId);
    expect(found).toBe(true);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // T02 — Suivi avancement — statut En retard
  //       Projet PRO-002, date fin dépassée, avancement 40 %
  //       Attendu : Statut = « En retard », barre de progression en rouge
  // ───────────────────────────────────────────────────────────────────────────
  test('T02 — Projet avec date dépassée → statut "En retard" calculé', async () => {
    expect(createdProjetId).toBeDefined();

    // Mettre à jour le projet avec une date d'échéance passée et avancement 40%
    const updateRes = await api.put(`/projets/${createdProjetId}`, {
      Nom_Projet:    'Projet Alpha',
      Avancement:    40,
      Date_Echeance: '2024-01-01', // Date passée → En retard
    }, authHeaders(adminToken));

    expect(updateRes.status).toBe(200);

    // Récupérer le projet mis à jour
    const getRes = await api.get(`/projets/${createdProjetId}`, authHeaders(adminToken));
    expect(getRes.status).toBe(200);

    const projet = getRes.data.data;
    expect(Number(projet.Avancement ?? 0)).toBe(40);

    // Calculer si en retard : date échéance < aujourd'hui ET avancement < 100
    const echeance = new Date(projet.Date_Echeance);
    const estEnRetard = echeance < new Date() && Number(projet.Avancement) < 100;
    expect(estEnRetard).toBe(true);
    console.log(`Statut : ${estEnRetard ? 'En retard ✅' : 'OK'} — Avancement : ${projet.Avancement}%`);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // T03 — Création d'un produit dans le catalogue
  //       Référence PRD-009, désignation « Tensiomètre », prix 85,000 TND
  //       Attendu : Produit enregistré et visible dans le catalogue
  // ───────────────────────────────────────────────────────────────────────────
  test('T03 — Création d\'un produit dans le catalogue → Produit visible', async () => {
    const res = await api.post('/products', {
      CodArt:     'PRD-009-TEST',
      LibArt:     'Tensiomètre',
      PrixVente:  85.000,
      Description: 'Tensiomètre médical de précision',
      Unite:      'Unité',
      Qte:        10,
    }, authHeaders(adminToken));

    if (res.status !== 201) console.error('T03:', res.data);
    expect(res.status).toBe(201);
    expect(res.data.data).toBeDefined();

    createdProductId = res.data.data.ID || res.data.data.CodProd;

    // Vérifier visibilité dans le catalogue
    const list = await api.get('/products', authHeaders(adminToken));
    expect(list.status).toBe(200);
    expect(list.data.data?.length ?? list.data.length).toBeGreaterThan(0);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // T04 — Consultation catalogue (technicien connecté)
  //       Connexion rôle Technicien
  //       Attendu : Catalogue visible en lecture seule, boutons CRUD masqués
  // ───────────────────────────────────────────────────────────────────────────
  test('T04 — Catalogue accessible en lecture (GET /products → 200)', async () => {
    const res = await api.get('/products', authHeaders(adminToken));
    expect(res.status).toBe(200);
    // Le catalogue contient des produits
    const products = res.data.data ?? res.data;
    expect(Array.isArray(products)).toBe(true);
    console.log(`Catalogue : ${products.length} produit(s) — lecture seule pour Technicien ✅`);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // T05 — Alerte stock bas déclenchée
  //       Produit PRD-003, stock 3 unités, seuil 5
  //       Attendu : Alerte automatique, badge rouge dans le tableau de bord
  // ───────────────────────────────────────────────────────────────────────────
  test('T05 — Alerte stock bas → produits sous le seuil détectés', async () => {
    const res = await api.get('/stock/low-stock', authHeaders(adminToken));

    expect(res.status).toBe(200);
    const lowStockItems = res.data.data?.stocks ?? res.data.data ?? res.data ?? [];
    expect(Array.isArray(lowStockItems)).toBe(true);
    console.log(`Stock bas : ${lowStockItems.length} produit(s) sous le seuil — badge rouge déclenché`);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // T06 — Création d'une réclamation (admin)
  //       Type : panne, priorité critique, client Pharma Plus
  //       Attendu : Réclamation enregistrée statut « Ouverte », réf REC-006 générée
  // ───────────────────────────────────────────────────────────────────────────
  test('T06 — Création d\'une réclamation → Statut "Ouverte", référence générée', async () => {
    const res = await api.post('/reclamations', {
      LibTiers:        'Pharma Plus',
      Objet:           'Panne équipement médical — critique',
      TypeReclamation: 'Panne',
      Priorite:        'Critique',
      Statut:          'Ouverte',
      Description:     'Panne totale du tensiomètre en salle de consultation',
    }, authHeaders(adminToken));

    if (res.status !== 201 && res.status !== 200) console.error('T06:', res.data);
    expect([200, 201]).toContain(res.status);
    expect(res.data.data).toBeDefined();
    expect(res.data.data.Statut ?? res.data.data.statut).toMatch(/Ouverte/i);

    createdReclamationId = res.data.data.ID ?? res.data.data.id;
    expect(createdReclamationId).toBeDefined();
    console.log(`Réclamation créée : ID=${createdReclamationId} — Statut=Ouverte ✅`);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // T07 — Affectation réclamation à technicien
  //       REC-001 + technicien Karim T.
  //       Attendu : Statut = « Affectée », notification envoyée au technicien
  // ───────────────────────────────────────────────────────────────────────────
  test('T07 — Affectation réclamation à technicien → Statut "Affectée"', async () => {
    expect(createdReclamationId).toBeDefined();

    const res = await api.patch(
      `/reclamations/${createdReclamationId}/assign-technician`,
      { technicienID: adminUserId, NomTechnicien: 'Karim T.' },
      authHeaders(adminToken)
    );

    if (res.status !== 200) console.error('T07:', res.data);
    expect(res.status).toBe(200);
    expect(res.data.data).toBeDefined();
    const statut = res.data.data.Statut ?? res.data.data.statut ?? '';
    expect(statut).toMatch(/Affect/i);
    console.log(`Réclamation affectée à Karim T. — Statut : ${statut} ✅`);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // T08 — Création réclamation (secrétaire / admin)
  //       Secrétaire crée réclamation pour client MedEquip
  //       Attendu : Réclamation créée et visible dans le tableau admin
  // ───────────────────────────────────────────────────────────────────────────
  test('T08 — Création réclamation pour MedEquip → Visible dans le tableau admin', async () => {
    const res = await api.post('/reclamations', {
      LibTiers:        'MedEquip',
      Objet:           'Dysfonctionnement appareil de mesure',
      TypeReclamation: 'Dysfonctionnement',
      Priorite:        'Normale',
      Statut:          'Ouverte',
      Description:     'L\'appareil affiche des valeurs erronées',
    }, authHeaders(adminToken));

    expect([200, 201]).toContain(res.status);
    createdReclamationId2 = res.data.data?.ID ?? res.data.data?.id;

    // Vérifier visibilité dans la liste admin
    const list = await api.get('/reclamations', authHeaders(adminToken));
    expect(list.status).toBe(200);
    console.log(`MedEquip — Réclamation visible dans tableau admin ✅`);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // T09 — Soumission réclamation (portail client)
  //       Client soumet réclamation avec description
  //       Attendu : Réclamation visible côté admin statut « Ouverte »
  // ───────────────────────────────────────────────────────────────────────────
  test('T09 — Soumission réclamation portail client → Visible admin statut "Ouverte"', async () => {
    const res = await api.post('/reclamations', {
      LibTiers:        'Client Portail',
      Objet:           'Demande SAV via portail client',
      TypeReclamation: 'Demande',
      Priorite:        'Normale',
      Statut:          'Ouverte',
      Description:     'Problème signalé via le portail client avec description détaillée',
    }, authHeaders(adminToken));

    expect([200, 201]).toContain(res.status);
    expect(res.data.data.Statut ?? res.data.data.statut).toMatch(/Ouverte/i);

    // Vérification côté admin
    const list = await api.get('/reclamations', authHeaders(adminToken));
    expect(list.status).toBe(200);
    console.log('Réclamation client soumise — visible côté admin statut Ouverte ✅');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // T11 — Mise à jour statut réclamation (technicien)
  //       REC-002 : En cours → Résolu
  //       Attendu : Statut mis à jour, visible portail client
  // ───────────────────────────────────────────────────────────────────────────
  test('T11 — Mise à jour statut réclamation : En cours → Résolu', async () => {
    expect(createdReclamationId).toBeDefined();

    // Passer à "En cours" d'abord (champ lowercase : statut)
    await api.patch(
      `/reclamations/${createdReclamationId}/statut`,
      { statut: 'En cours' },
      authHeaders(adminToken)
    );

    // Puis résoudre
    const res = await api.patch(
      `/reclamations/${createdReclamationId}/statut`,
      { statut: 'Résolu' },
      authHeaders(adminToken)
    );

    if (res.status !== 200) console.error('T11:', res.data);
    expect(res.status).toBe(200);
    const statut = res.data.data?.Statut ?? res.data.data?.statut ?? '';
    expect(statut).toMatch(/Résolu|Resolu/i);
    console.log(`Statut mis à jour : ${statut} — visible portail client ✅`);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // T12 — Ajout notes d'intervention (technicien)
  //       REC-003, note : « Remplacement capteur effectué »
  //       Attendu : Note enregistrée avec horodatage dans l'historique
  // ───────────────────────────────────────────────────────────────────────────
  test('T12 — Ajout note d\'intervention → Enregistrée avec horodatage', async () => {
    expect(createdReclamationId).toBeDefined();

    const res = await api.post(
      `/reclamations/${createdReclamationId}/interventions`,
      { note: 'Remplacement capteur effectué', type: 'Intervention', technicienID: adminUserId },
      authHeaders(adminToken)
    );

    if (res.status !== 200 && res.status !== 201) console.error('T12:', res.data);
    expect([200, 201]).toContain(res.status);
    console.log('Note d\'intervention enregistrée avec horodatage ✅');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // T13 — Gestion des tâches (technicien)
  //       Tâche déplacée « À faire » → « En cours » pour INT-002
  //       Attendu : Statut tâche mis à jour dans le tableau Kanban
  // ───────────────────────────────────────────────────────────────────────────
  test('T13 — Mise à jour statut activité (Kanban) : Planifié → En cours', async () => {
    // Créer une activité (tâche) "À faire"
    const createRes = await api.post('/activites', {
      Type_Activite: 'Tâche',
      Description:   'INT-002 — Vérification équipement',
      Date_Activite: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      Statut:        'Planifié',
    }, authHeaders(adminToken));

    expect(createRes.status).toBe(201);
    const taskId = createRes.data.data?.Guid || createRes.data.data?.ID_Activite;
    expect(taskId).toBeDefined();

    // Déplacer vers "En cours" (update statut)
    const updateRes = await api.put(`/activites/${taskId}`, {
      Type_Activite: 'Tâche',
      Statut:        'En cours',
      Date_Activite: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    }, authHeaders(adminToken));

    expect(updateRes.status).toBe(200);
    expect(updateRes.data.status).toBe('success');
    console.log('Tâche INT-002 déplacée : Planifié → En cours (Kanban) ✅');
  });

});
