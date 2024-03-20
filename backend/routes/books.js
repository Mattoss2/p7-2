const express = require('express');
const auth = require('../middleware/auth');
const booksController = require('../controllers/books');
const router = express.Router();
const multer = require('../middleware/multer-config');
const resizeImg = require('../middleware/sharp');


// Routes sans authentification
router.get('/', booksController.getAllBooks);
router.get('/bestrating', booksController.getBestRatingBooks);
router.get('/:id', booksController.getOneBook);
// Routes avec authentification
router.post('/', auth, multer,resizeImg, booksController.createBook);
router.put('/:id', auth, multer,resizeImg, booksController.modifyBook);
router.delete('/:id', auth, booksController.deleteBook);
router.post('/:id/rating', auth, booksController.rateBook);

module.exports = router;