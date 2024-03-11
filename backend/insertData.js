const mongoose = require('mongoose');
const Book = require('./models/books'); // Assurez-vous que le chemin est correct
const data = require('../P7-Dev-Web-livres/public/data/data.json'); // Mettez le chemin correct du fichier JSON

mongoose.connect('mongodb+srv://m4ttoss1005:v1aQAriBo8Z2JVER@monvieuxgrimoire.vhylk2a.mongodb.net/?retryWrites=true&w=majority&appName=AtlasApp', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('Connexion à MongoDB réussie !');

    for (let bookData of data) {
      // Utiliser directement les données telles quelles, sans générer de nouveaux ObjectId
      const book = new Book(bookData);
      try {
        await book.save();
      } catch (error) {
        console.error('Erreur lors de l\'insertion des données', error);
      }
    }

    console.log('Toutes les données ont été insérées');
    mongoose.connection.close();
  })
  .catch(err => console.error('Connexion à MongoDB échouée !', err));



