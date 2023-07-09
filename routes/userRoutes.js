
const express = require('express');
const router = express.Router();
const userController = require(__dirname + '/../controller/userController');
const authController = require(__dirname + '/../controller/authController');

router
    .route('/signup')
    .post(authController.signup);

router
    .route('/login')
    .post(authController.login);
    
router
    .route('/forgetPassword')
    .post(authController.forgetPassword);
    
router
    .route('/resetPassword/:token')
    .post(authController.resetPassword);

router.route('/updatePassword')
.patch(authController.protect,authController.updatePassword);   


router.route('/updateUser')
.patch(authController.protect,userController.updateUser);


router.route('/deleteUser')
.delete(authController.protect,userController.deleteUser);

router
    .route('/')
    .get(userController.getAllUsers)
    .post(userController.createUser);

router
    .route('/:id')
    .get(userController.getUser)
    .patch(userController.updateUser)
    .delete(userController.deleteUser);

module.exports = router;