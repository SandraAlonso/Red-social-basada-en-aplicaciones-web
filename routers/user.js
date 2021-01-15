//Manejador de cierre de sesión
var express = require('express');
var router = express.Router();

var userController = require('../controllers/user');

router.get('/search', userController.getAllUsers);

//Filtrado de usuario por nombre
router.post('/filter', userController.filterUserByName);

router.route('/:id')
    .get(userController.checkId)
    .get(userController.getUser)
    .get(userController.getQAFromUser)
    .get(userController.getUserScore)
    .get(userController.getMedals)
    
module.exports = router;