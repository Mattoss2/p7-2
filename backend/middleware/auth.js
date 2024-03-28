const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    if (!token) throw 'Token manquant.';

    const decodedToken = jwt.verify(token, 'RANDOM_TOKEN_SECRET');
    const userId = decodedToken.userId;
    if (req.body.userId && req.body.userId !== userId) {
      throw 'Identifiant utilisateur invalide.';
    } else {
      req.auth = { userId };
      next();
    }
  } catch {
    res.status(401).json({
      error: 'Requête non authentifiée!'
    });
  }
};