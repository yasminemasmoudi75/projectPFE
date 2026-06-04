const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.API_URL || 'http://localhost:3066/api';
const TOKEN_FILE = path.join(__dirname, '../.test-auth.json');

// Instance axios — ne lève jamais d'erreur (on vérifie le status manuellement)
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  validateStatus: () => true,
  headers: { 'Content-Type': 'application/json' },
});

// Lire le token sauvegardé par globalSetup (un seul login pour toute la suite)
const getAdminAuth = () => {
  if (!fs.existsSync(TOKEN_FILE)) {
    throw new Error('Fichier .test-auth.json introuvable — globalSetup a-t-il tourné ?');
  }
  return JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
};

const loginAsAdmin = async () => {
  const { token } = getAdminAuth();
  return token;
};

const authHeaders = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

const randomPhone = () =>
  String(10000000 + Math.floor(Math.random() * 89999999));

// Email court pour respecter la limite USER_NAME ≤ 30 chars dans UCS_USERS
const randomEmail = (prefix = 'u') =>
  `${prefix}${Math.floor(Math.random() * 999999)}@t.com`;

module.exports = { api, loginAsAdmin, authHeaders, randomPhone, randomEmail, getAdminAuth, BASE_URL };
