const express = require('express');
const shopController = require('../controllers/shop');
const isAuth = require('../middleware/isAuth');
const router = express.Router();


router.get('/', shopController.getIndex);

router.get('/products', shopController.getProducts);

router.get('/products/:productID', shopController.getProduct)

router.post('/cart', shopController.postCart);

router.get('/cart', isAuth,shopController.getCart);

router.post('/cart-delete-item', shopController.postDeleteProductFromCart)

router.post('/create-order', shopController.postOrder);

router.get('/orders', isAuth,shopController.getOrders);

router.get('/invoices/:orderID', isAuth, shopController.getInvoice);

router.get('/checkout', isAuth, shopController.getCheckout);

router.get('/paymentRequest', isAuth, shopController.getPayment);

router.get('/checkPayment', isAuth, shopController.checkPayment);

module.exports = router;