const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

router.post('/register', userController.createUser);
router.post('/manager/sigin', userController.createManager);
router.post('/login', userController.login);
router.post('/manager/login', userController.loginManager);
router.get('/user/:id', userController.getUserByID);
router.get('/listuser',userController.getAllUsers);
router.put('/user/:idUser/update',userController.updateAccount);
router.put('/user/:idUser/password',userController.updatePassWord);
router.get('/theater/user/:Email', userController.GetTheaterByUser);
// router.post('/createUser',userController.createUser);

module.exports = router;



