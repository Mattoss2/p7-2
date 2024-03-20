const sharp = require('sharp');
const fs = require('fs');

const resizeImg = (req, res, next) => {
  // Vérifie si un fichier est téléchargé
  if (!req.file) {
    return next();
  }

  // Utilisation de sharp pour redimensionner et convertir en WebP
  sharp(req.file.path)
    .resize(206, 260, { fit: 'contain' }) // 
    .toFormat('webp')
    .toFile('images/' + req.file.filename.replace(/\.(jpg|jpeg|png)$/, '.webp'))
    // Une fois que ces opérations sont terminées, on exécute le .then
    .then(() => {
      

      // Supprimer le fichier d'origine après la conversion en WebP
      fs.unlink(req.file.path, (err) => {
        if (err) {
          console.error('Error deleting original file:', err);
        }
        next();
      });
    })
    .catch((error) => {
      console.error('Image processing error:', error);
      next();
    });
};

module.exports = resizeImg;