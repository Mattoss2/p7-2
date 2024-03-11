const express = require('express');
const router = express.Router();

const userCtrl = require('../controllers/user');

// Route pour l'inscription
router.post('/signup', userCtrl.signup);

// Route pour la connexion
router.post('/login', userCtrl.login);

// Ajouter ici d'autres routes liées aux utilisateurs
// Exemple : Route pour obtenir le profil de l'utilisateur
// router.get('/profile', userCtrl.getProfile);

// Exemple : Route pour mettre à jour le profil de l'utilisateur
// router.put('/profile', userCtrl.updateProfile);

// Exemple : Route pour supprimer un utilisateur
// router.delete('/:id', userCtrl.deleteUser);

module.exports = router;