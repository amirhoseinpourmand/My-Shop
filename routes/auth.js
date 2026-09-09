const express = require('express');
const { check, body } = require('express-validator');
const authController = require('../controllers/auth');
const router = express.Router();

router.get('/login', authController.getLogin);

router.post('/login',
    [
        check('email', 'ایمیل نامعتبر است')
            .isEmail()
            .normalizeEmail({ gmail_remove_dots: false })
        , check('password', 'رمز عبور نامعتبر است')
            .isLength({ min: 6, max: 25 })
            .isAlphanumeric()
            .trim()
    ]
    , authController.postLogin);

router.post('/logout', authController.postLogout);

router.get('/sign-up', authController.getSignUp);

router.post('/sign-up',
    [
        check('email', 'لطفا ایمیل معتبر وارد کنید')
            .isEmail()
            .normalizeEmail({ gmail_remove_dots: false })
            .trim()
            .custom((value, { req }) => {
                if (value === 'test1@gmail.com') {
                    throw new Error('شما حق ورود ندارید!');
                }
                return true;
            })
        , body('password', 'لطفا رمز عبور با تعداد بیشتر از 6 کاراکتر و ترکیبی از حروف و اعداد وارد کنید')
            .isLength({ min: 6 })
            .isAlphanumeric()
            .trim()
        , body('confirmPassword')
            .trim()
            .custom((value, { req }) => {
                if (value !== req.body.password) {
                    throw new Error('تکرار رمز عبور با رمز عبور تطابق ندارد')
                }
                return true;
            })
    ]
    , authController.postSignUp);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getResetPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;