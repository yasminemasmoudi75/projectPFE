const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// 🧪 SCRIPT DE TEST UPLOAD IMAGE
const BASE_URL = 'http://localhost:3066/api';
const TOKEN = 'YOUR_JWT_TOKEN_HERE'; // I need a token

async function testUpload() {
    // 1. Login to get a token if I can, or just try to get it from previous context
    // Actually, I'll just check if I can run a query to get a valid user and generate a token
    // But I don't have the secret key easily accessible here (well it's in .env)
}
