const express = require('express');
const multer = require('multer');
const path = require('path');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/exercises'));
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter(req, file, cb) {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed.'));
    }
    cb(null, true);
  },
});

// POST /api/upload/photo — coach uploads one exercise photo
router.post('/photo', requireAuth, requireRole('coach', 'admin'), upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file received.' });
  const url = `/uploads/exercises/${req.file.filename}`;
  return res.json({ url });
});

module.exports = router;
