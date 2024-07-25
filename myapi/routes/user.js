const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

router.post('/register', userController.createUser);
router.post('/login', userController.login);
router.get('/user/:id', userController.getUserByID);
router.get('/listuser',userController.getAllUsers);
router.put('/user/:idUser/update',userController.updateAccount);
router.put('/user/:idUser/password',userController.updatePassWord);
// router.post('/createUser',userController.createUser);

module.exports = router;



