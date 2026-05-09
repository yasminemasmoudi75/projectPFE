const express = require('express');
const router = express.Router();
const { checkPermission, MODULES } = require('./src/middleware/checkPermissions');
const { protect } = require('./src/middleware/auth');

router.get('/test-perm', protect, checkPermission(MODULES.USERS, 'read'), (req, res) => {
  res.json({ success: true, permissions: req.permissions });
});

module.exports = router;
