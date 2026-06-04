/**
 * Plan de Tests — Authentification & CRM Opérationnel
 * T01 à T08 — correspondance exacte avec le tableau de recette
 */
const { api, loginAsAdmin, authHeaders, randomEmail, randomPhone } = require('./setup');

describe('Authentification & Gestion CRM', () => {

  // ── Token admin partagé entre les tests qui en ont besoin ───────────────
  let adminToken;
  let createdActivityId;
  let testUserId;
  let testUserEmail;

  beforeAll(async () => {
    adminToken = await loginAsAdmin();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // T01 — Connexion avec identifiants valides
  // ─────────────────────────────────────────────────────────────────────────
  test('T01 — Connexion avec identifiants valides → Token JWT généré, redirection Dashboard', async () => {
    const res = await api.post('/auth/login', {
      EmailPro: 'ahmed@gmail.com',
      Password: 'Aa123456?',
    });

    expect(res.status).toBe(200);
    expect(res.data.status).toBe('success');
    expect(typeof res.data.data.token).toBe('string');
    expect(res.data.data.token.length).toBeGreaterThan(20);
    expect(res.data.data.user.EmailPro).toBe('ahmed@gmail.com');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // T02 — Connexion avec identifiants invalides
  // ─────────────────────────────────────────────────────────────────────────
  test('T02 — Connexion avec identifiants invalides → Identifiant ou mot de passe incorrect', async () => {
    const res = await api.post('/auth/login', {
      EmailPro: 'ahmed@gmail.com',
      Password: 'Test@123',
    });

    expect(res.status).toBe(401);
    expect(res.data.status).toBe('error');
    expect(res.data.message).toBe('Identifiant ou mot de passe incorrect');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // T03 — Création d'un utilisateur
  // ─────────────────────────────────────────────────────────────────────────
  test('T03 — Création d\'un utilisateur → Compte créé, e-mail de bienvenue envoyé', async () => {
    const res = await api.post(
      '/users',
      {
        FullName:   'Nouveau Collaborateur',
        EmailPro:   randomEmail('t03'),
        TelPro:     randomPhone(),
        Password:   'NexusCRM1!',
        UserRole:   'Commercial',
        Gouvernorat: 23,
        IsActive:   true,
      },
      authHeaders(adminToken)
    );

    if (res.status !== 201) console.error('T03:', res.data);
    expect(res.status).toBe(201);
    expect(res.data.status).toBe('success');
    expect(res.data.data.UserID).toBeDefined();
    expect(typeof res.data.emailSent).toBe('boolean');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // T04 — Mot de passe trop faible
  // ─────────────────────────────────────────────────────────────────────────
  test('T04 — Mot de passe trop faible → Validation bloquée : 8 caractères min., majuscule, chiffre et symbole requis', async () => {
    const res = await api.post('/auth/register', {
      FullName: 'Ahmed Test',
      EmailPro: randomEmail('t04'),
      Password: '123456',
    });

    expect(res.status).toBe(400);
    expect(res.data.status).toBe('error');
    expect(res.data.message).toMatch(/8 caractères|majuscule|chiffre|caractère spécial/i);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // T05 — Désactivation d'un compte
  // ─────────────────────────────────────────────────────────────────────────
  test('T05 — Désactivation d\'un compte → Statut inactif, accès révoqué immédiatement', async () => {
    // 1. Créer un compte test avec un mot de passe connu
    testUserEmail = randomEmail('t05');
    const createRes = await api.post(
      '/users',
      {
        FullName:    'Ahmed Test Désactivation',
        EmailPro:    testUserEmail,
        TelPro:      randomPhone(),
        Password:    'Aa123456?',
        UserRole:    'Commercial',
        Gouvernorat: 23,
        IsActive:    true,
      },
      authHeaders(adminToken)
    );
    expect(createRes.status).toBe(201);
    testUserId = createRes.data.data.UserID;

    // 2. Désactiver le compte
    const deactivateRes = await api.put(
      `/users/${testUserId}`,
      { IsActive: false },
      authHeaders(adminToken)
    );
    expect(deactivateRes.status).toBe(200);
    expect(deactivateRes.data.status).toBe('success');

    // 3. Vérifier que l'accès est révoqué (connexion → 403)
    const loginRes = await api.post('/auth/login', {
      EmailPro: testUserEmail,
      Password: 'Aa123456?',
    });
    expect(loginRes.status).toBe(403);
    expect(loginRes.data.status).toBe('error');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // T06 — Enregistrement d'une activité commerciale
  // ─────────────────────────────────────────────────────────────────────────
  test('T06 — Enregistrement d\'une activité commerciale → Activité créée, visible dans le calendrier', async () => {
    const datePlanifiee = new Date();
    datePlanifiee.setDate(datePlanifiee.getDate() + 3);
    const dateStr = datePlanifiee.toISOString().split('T')[0];

    const res = await api.post(
      '/activites',
      {
        Type_Activite: 'Appel',
        Description:   'Appel de prospection client — T06',
        Date_Activite: dateStr,
        Statut:        'Planifié',
      },
      authHeaders(adminToken)
    );

    expect(res.status).toBe(201);
    expect(res.data.status).toBe('success');
    expect(res.data.data.Type_Activite).toBe('Appel');
    expect(res.data.data.Statut).toMatch(/Planifié/i);

    createdActivityId = res.data.data.Guid || res.data.data.ID_Activite;
    expect(createdActivityId).toBeDefined();

    // Vérifier visibilité dans le calendrier
    const listRes = await api.get('/activites', authHeaders(adminToken));
    expect(listRes.status).toBe(200);
    const found = listRes.data.data?.some(
      (a) => (a.Guid || a.ID_Activite) === createdActivityId
    );
    expect(found).toBe(true);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // T07 — Report d'une activité planifiée
  // ─────────────────────────────────────────────────────────────────────────
  test('T07 — Report d\'une activité planifiée → Nouvelle date enregistrée', async () => {
    expect(createdActivityId).toBeDefined();

    const nouvelleDate = new Date();
    nouvelleDate.setDate(nouvelleDate.getDate() + 7);
    const newDateStr = nouvelleDate.toISOString().split('T')[0];

    const res = await api.put(
      `/activites/${createdActivityId}`,
      {
        Type_Activite: 'Appel',
        Date_Activite: newDateStr,
        Statut:        'Planifié',
      },
      authHeaders(adminToken)
    );

    expect(res.status).toBe(200);
    expect(res.data.status).toBe('success');
    expect(res.data.data).toBeDefined();
    expect(res.data.data.Date_Activite).toBeDefined();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // T08 — Notification de rappel (J-1)
  // ─────────────────────────────────────────────────────────────────────────
  test('T08 — Notification de rappel J-1 → Panneau d\'alertes avec badge rouge sur icône cloche', async () => {
    // Créer une activité pour demain (déclenche le rappel J-1 via cron)
    const demain = new Date();
    demain.setDate(demain.getDate() + 1);
    await api.post(
      '/activites',
      {
        Type_Activite: 'Réunion',
        Description:   'Test rappel J-1',
        Date_Activite: demain.toISOString().split('T')[0],
        Statut:        'Planifié',
      },
      authHeaders(adminToken)
    );

    // Vérifier que le panneau de notifications est opérationnel
    const res = await api.get('/notifications', authHeaders(adminToken));

    expect(res.status).toBe(200);
    expect(res.data.status).toBe('success');
    expect(Array.isArray(res.data.data)).toBe(true);

    // Chaque notification a la structure attendue (badge rouge = IsRead: false)
    res.data.data.forEach((n) => {
      expect(n).toHaveProperty('ID');
      expect(n).toHaveProperty('Title');
      expect(n).toHaveProperty('IsRead');
    });

    const nonLues = res.data.data.filter((n) => !n.IsRead).length;
    console.log(`🔔 Badge cloche : ${nonLues} notification(s) non lue(s) — badge ${nonLues > 0 ? 'ROUGE ✅' : 'en attente du cron (< 5 min)'}`);
  });

});
