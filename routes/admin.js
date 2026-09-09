const express = require('express');
const { body } = require('express-validator');
const adminController = require('../controllers/admin');
const isAuth = require('../middleware/isAuth');
const router = express.Router();

router.get('/add-product', isAuth, adminController.getAddProduct);

router.post('/add-product',
    [
        body('title')
            .isString()
            .isLength({ min: 3, max: 100 })
            .withMessage('تعداد کاراکتر باید بیشتر از 3 و کمتر از 100 باشد')
            .trim()
        , body('price', 'قیمت را وارد کنید')
        , body('description', 'متن توضیحات باید حداقل 5 و حداکثر 10000 کاراکتر داشته باشد')
            .isLength({ min: 5, max: 10000 })
    ]
    , isAuth, adminController.postAddProduct);

router.get('/products', isAuth, adminController.getProducts);

router.get('/edit-product/:productID', isAuth, adminController.getEditProduct);

router.post('/edit-product',
    [
        body('title')
            .isString()
            .isLength({ min: 3, max: 100 })
            .withMessage('تعداد کاراکتر عنوان باید بیشتر از 3 و کمتر از 100 باشد')
            .trim()
        , body('price', 'قیمت را وارد کنید')
        , body('description', 'متن توضیحات باید حداقل 5 و حداکثر 10000 کاراکتر داشته باشد')
            .isLength({ min: 5, max: 10000 })
    ]
    , isAuth, adminController.postEditProduct);

router.delete('/product/:productID', isAuth, adminController.deleteProduct);

module.exports = router;