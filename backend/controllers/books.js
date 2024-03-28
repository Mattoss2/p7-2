const Book = require('../models/books')
const fs = require('fs');




exports.createBook = (req, res, next) => {
    // Vérifie si une image est présente
    if (!req.file) {
      return res.status(400).json({ message: 'Aucune image fournie' });
    }
  
    let bookObject;
    try {
      bookObject = JSON.parse(req.body.book);
    } catch (error) {
      return res.status(400).json({ error: "Format JSON invalide" });
    }
  
    // Suppression de l'id et du userId non nécessaires
    delete bookObject._id;
    delete bookObject._userId;
  
    const book = new Book({
      ...bookObject,
      userId: req.auth.userId, // Assurez-vous que l'authentification est correctement mise en place pour avoir req.auth.userId
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    });
  
    book.save()
      .then(() => res.status(201).json({ message: 'Livre enregistré !' }))
      .catch(error => res.status(400).json({ error }));
  };

  exports.modifyBook = (req, res, next) => {
    // Objet contenant les informations du livre à mettre à jour
    // Si nouvelle image, l'URL est mise à jour
    // Sinon objet créé avec les informations du corps de la requête
    const bookObject = req.file ? {
      ...JSON.parse(req.body.book),
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
    } : { ...req.body };
    // supprime la propriété _userId de l'objet bookObject pour éviter de modifier l'ID de l'utilisateur associé au livre
    delete bookObject._userId;
    // Recherche le livre spécifique à l'aide de son id
    Book.findOne({ _id: req.params.id })
      .then((book) => {
        // vérifie si l'ID de l'utilisateur associé au livre correspond à l'ID de l'utilisateur authentifié
        if (book.userId !== req.auth.userId) {
          res.status(403).json({ message: 'Unauthorized request' });
        } else {
          // on stocke l'url de l'ancienne image qui va être modifiée
          const oldImageUrl = book.imageUrl;
          // puis mise à jour avec les nouvelles informations
          Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
            .then(() => {
              // supprime l'ancienne image si une nouvelle image est téléchargée
              if (req.file) {
                // divise l'URL de l'ancienne image en utilisant "/images/" comme délimiteur et récupère le deuxième élément du tableau ainsi créé, donc le nom du fichier
                const filename = oldImageUrl.split('/images/')[1];
                // supprime le fichier spécifié
                fs.unlink(`images/${filename}`, (err) => {
                  if (err) {
                    console.error('Error deleting old image:', err);
                  }
                });
              }
              res.status(200).json({ message: 'Livre modifié!' });
            })
            .catch((error) => res.status(401).json({ error }));
        }
      })
      .catch((error) => res.status(400).json({ error }));
  };

  exports.deleteBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
        .then(book => {
            if (!book) {
                return res.status(404).json({ message: 'Livre non trouvé' });
            }
            if (book.userId !== req.auth.userId) {
                return res.status(401).json({ message: 'Not authorized' });
            }

            const filename = book.imageUrl.split('/images/')[1];
            const filePath = `images/${filename}`;

            // Supprime d'abord le livre de la base de données
            book.deleteOne()
                .then(() => {
                    // Tente ensuite de supprimer le fichier image
                    fs.unlink(filePath, (err) => {
                        if (err) {
                            console.log(`Erreur lors de la suppression de l'image: ${err}`);
                        }
                        res.status(200).json({ message: 'Livre supprimé avec succès' });
                    });
                })
                .catch(error => res.status(400).json({ error }));
        })
        .catch(error => res.status(500).json({ error }));
};
 

  exports.getOneBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
      .then(thing => res.status(200).json(thing))
      .catch(error => res.status(404).json({ error }));
  }

  exports.getAllBooks = (req, res, next) => {
    Book.find().then(
      (books) => {
        res.status(200).json(books);
      }
    ).catch(
      (error) => {
        res.status(400).json({
          error: error
        });
      }
    );
};




exports.rateBook = (req, res, next) => {
  // On extrait les valeurs userId et rating du corps de la requête
  const { userId, rating } = req.body;

  // Vérifier que la note est comprise entre 0 et 5
  if (rating < 0 || rating > 5) {
    return res.status(400).json({ message: 'La note doit être comprise entre 0 et 5.' });
  }

  // Puis on recherche dans les données le livre avec l'ID fourni dans les paramètres de la requête
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      // Vérifier si l'utilisateur a déjà noté ce livre
      const userAlreadyRating = book.ratings.find((r) => r.userId === userId);
      if (userAlreadyRating) {
        return res.status(400).json({ message: 'Vous avez déjà noté ce livre.' });
      }

      // Puis on ajoute la nouvelle note au tableau "ratings"
      book.ratings.push({ userId, grade: rating });

      // Puis on met à jour la note moyenne "averageRating"
      const totalRatings = book.ratings.length;
      const sumRatings = book.ratings.reduce((sum, r) => sum + r.grade, 0); // méthode réduce est une fonction de réduction qui prend une fonction de rappel ((sum, r) => sum + r.grade) et un argument final (0) qui représente la valeur initiale de sum
      const newAverageRating = sumRatings / totalRatings;
      // eslint-disable-next-line no-param-reassign
      book.averageRating = parseFloat(newAverageRating.toFixed(2)); // parseFloat converti string en number & toFixed(2) limite à deux decimales

      // Sauvegarder les modifications _ Promesse renvoyant le livre mis à jour
      return book.save()
        .then((updatedBook) => res.status(200).json(updatedBook))
        .catch((error) => res.status(400).json({ error }));
    })
    .catch((error) => res.status(500).json({ error }));
};
exports.getBestRatingBooks = (req, res, next) => {
    Book.find()
        .sort({ averageRating: -1 }) // Tri par note moyenne décroissante
        .limit(3) // Limite à 3 livres
        .then(books => res.status(200).json(books))
        .catch(error => res.status(500).json({ error }));
};

