const books = require('../models/books')
const fs = require('fs');




  exports.createBook = (req, res, next) => {
    if (!req.body.book) {
      return res.status(400).json({ error: "Book data is missing" });
    }
    
    let bookObject;
    try {
      bookObject = JSON.parse(req.body.book);
    } catch (error) {
      return res.status(400).json({ error: "Invalid JSON format" });
    }
  
  delete bookObject._id;
  delete bookObject._userId;

  const book = new books({
    ...bookObject,
    userId: req.auth.userId, // Assurez-vous que l'authentification est correctement gérée
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  });

  book.save()
    .then(() => res.status(201).json({ message: 'Book saved successfully!' }))
    .catch(error => res.status(400).json({ error }));
    console.log('erreur');
};

exports.modifyBook = (req, res, next) => {
    const bookObject = req.file ? {
      ...JSON.parse(req.body.book),
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body };
  
    books.findOne({ _id: req.params.id })
      .then((book) => {
        if (!book) {
          return res.status(404).json({ message: 'Livre non trouvé' });
        }
        if (book.userId !== req.auth.userId) {
          return res.status(401).json({ message: 'Not authorized' });
        }
        const oldImgUrl = book.imageUrl;
        books.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
          .then(() => {
            if (req.file && oldImgUrl) {
              const filename = oldImgUrl.split('/images/')[1];
              fs.unlink(`images/${filename}`, (err) => {
                if (err) {
                  console.error('Error deleting old image:', err);
                  return res.status(500).json({ message: 'Erreur lors de la suppression de l\'ancienne image' });
                }
                res.status(200).json({ message: 'Livre modifié avec succès et ancienne image supprimée.' });
              });
            } else {
              res.status(200).json({ message: 'Livre modifié avec succès.' });
            }
          })
          .catch(error => res.status(400).json({ error }));
      })
      .catch((error) => {
        res.status(400).json({ error });
      });
  };

exports.deleteBook = (req, res, next) => {
    books.findOne({ _id: req.params.id })
        .then(book => {
            if (!book) {
                return res.status(404).json({ message: 'Livre non trouvé' });
            }
            if (book.userId !== req.auth.userId) {
                return res.status(401).json({ message: 'Not authorized' });
            }

            const filename = book.imageUrl.split('/images/')[1];
            fs.unlink(`images/${filename}`, (err) => {
                if (err) {
                    console.log(err);
                    return res.status(500).json({ message: 'Erreur lors de la suppression de l\'image' });
                }
                books.deleteOne({ _id: req.params.id })
                    .then(() => res.status(200).json({ message: 'Livre supprimé avec succès' }))
                    .catch(error => res.status(400).json({ error }));
            });
        })
        .catch(error => res.status(500).json({ error }));
};
 

  exports.getOneBook = (req, res, next) => {
    books.findOne({ _id: req.params.id })
      .then(thing => res.status(200).json(thing))
      .catch(error => res.status(404).json({ error }));
  }

  exports.getAllBooks= (req, res, next) => {
    books.find()
      .then(books => res.status(200).json(books))
      .catch(error => res.status(400).json({ error }));
  };




exports.rateBook = (req, res, next) => {
    const { rating } = req.body; // Assurez-vous que le rating est passé dans le corps de la requête
    const bookId = req.params.id;

    if (rating < 0 || rating > 5) {
        return res.status(400).json({ message: 'La note doit être comprise entre 0 et 5' });
    }

    books.findById(bookId)
        .then(book => {
            if (!book) {
                return res.status(404).json({ message: 'Livre non trouvé' });
            }

            book.ratings.push({ userId: req.auth.userId, grade: rating });

            // Calcul de la nouvelle moyenne
            const averageRating = book.ratings.reduce((acc, curr) => acc + curr.grade, 0) / book.ratings.length;
            book.averageRating = averageRating;

            book.save()
                .then(() => res.status(200).json({ message: 'Note ajoutée avec succès', averageRating }))
                .catch(error => res.status(400).json({ error }));
        })
        .catch(error => res.status(500).json({ error }));
};
exports.getBestRatingBooks = (req, res, next) => {
    books.find()
        .sort({ averageRating: -1 }) // Tri par note moyenne décroissante
        .limit(3) // Limite à 3 livres
        .then(books => res.status(200).json(books))
        .catch(error => res.status(500).json({ error }));
};

exports.getAllBooks = async (req, res, next) => {
    books.find()
      .then(books => res.status(200).json(books))
      .catch(error => res.status(400).json({ error }));
  };