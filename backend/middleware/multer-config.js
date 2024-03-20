const multer = require('multer');

// Association des types aux formats correspondants
const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpeg',
  'image/png': 'png',
  'image/webp': 'webp',
};
// Options de stockage des fichiers téléchargés
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, 'images'); // Dossier de destination spécifié ici
  },
  filename: (req, file, callback) => {
    const name = file.originalname.split(' ').join('_').split('.')[0];
    const extension = MIME_TYPES[file.mimetype];
    callback(null, `${name}_${Date.now()}.${extension}`);
  }
});

module.exports = multer({ storage: storage }).single('image');