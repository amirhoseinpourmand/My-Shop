const Product = require('../models/product');
const Order = require('../models/order');
const path = require('path');
const fs = require('fs');
const pdfkit = require('pdfkit');
const product = require('../models/product');
const zarinpalCheckout = require('zarinpal-checkout');
require('dotenv').config();

let port = process.env.PORT || 3001;

var zarinpal = zarinpalCheckout.create(process.env.ZARINPAL_MERCHANT_ID, true)

const ITEMS_PER_PAGE = 3;

exports.getIndex = (req, res, next) => {

    const pageNumber = +req.query.page || 1;
    let totalItems;

    Product.find()

        .countDocuments()
        .then(numProducts => {
            totalItems = numProducts;
            return Product.find()
                .skip((pageNumber - 1) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE)
        })
        .then(products => (
            res.render('shop/index', {
                prods: products,
                pageTitle: 'خانه',
                isAuthenticated: req.session.isLoggedIn,
                csrfToken: req.csrfToken(),
                currentPage: pageNumber,
                totalProducts: totalItems,
                hasNextPage: ITEMS_PER_PAGE * pageNumber < totalItems,
                hasPreviousPage: pageNumber > 1,
                nextPage: pageNumber + 1,
                previousPage: pageNumber - 1,
                lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
            })
        ))
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error)
        })
};

exports.getProducts = (req, res, next) => {

    const pageNumber = +req.query.page || 1;
    let totalItems;

    Product.find()

        .countDocuments()
        .then(numProducts => {
            totalItems = numProducts;
            return Product.find()
                .skip((pageNumber - 1) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE)
        })
        .then(products => (
            res.render('shop/product-list', {
                prods: products,
                pageTitle: 'محصولات',
                isAuthenticated: req.session.isLoggedIn,
                csrfToken: req.csrfToken(),
                currentPage: pageNumber,
                totalProducts: totalItems,
                hasNextPage: ITEMS_PER_PAGE * pageNumber < totalItems,
                hasPreviousPage: pageNumber > 1,
                nextPage: pageNumber + 1,
                previousPage: pageNumber - 1,
                lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
            })
        ))
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error)
        })
}

exports.getProduct = (req, res, next) => {

    const prodID = req.params.productID;

    Product.findById(prodID)
        .then(product => {
            res.render('shop/product-details', {
                product: product,
                pageTitle: 'مشخصات محصول',
                isAuthenticated: req.session.isLoggedIn,
            })
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error)
        })
};

exports.postCart = (req, res, next) => {

    const prodID = req.body.productID;

    Product.findById(prodID)
        .then(product => {
            req.user.addToCart(product);
            res.redirect('/cart');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error)
        })
}

exports.getCart = async (req, res) => {

    const user = await req.user.populate('cart.items.productID');
    res.render('shop/cart', {
        pageTitle: 'سبد خرید',
        products: user.cart.items,
        isAuthenticated: req.session.isLoggedIn,
    })
}

exports.postDeleteProductFromCart = (req, res, next) => {

    const prodID = req.body.productID;

    req.user.removeFromCart(prodID)
        .then(result => {
            res.redirect('/cart');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error)
        })
}

exports.getOrders = (req, res, next) => {

    Order.find({
        'user.userID': req.session.user._id
    })
        .then(orders => {
            res.render('shop/orders', {
                pageTitle: 'سفارشات',
                orders: orders,
                orderID: orders._id,
                isAuthenticated: req.session.isLoggedIn,
                refID: req.flash('refID')[0],
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error)
        })

}

exports.postOrder = (req, res, next) => {

    req.user.populate('cart.items.productID')
        .then(user => {
            const products = user.cart.items.map(item => {
                return {
                    quantity: item.quantity,
                    product: { ...item.productID._doc }
                }
            })
            const order = new Order({
                user: {
                    email: req.user.email,
                    userID: req.user._id
                },
                products: products
            })
            return order.save();
        })
        .then(() => {
            req.user.clearCart();
            res.redirect('/orders')
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error)
        })
}

exports.getInvoice = (req, res, next) => {

    const orderID = req.params.orderID;

    Order.findById(orderID)
        .then(order => {
            if (!order) {
                return next(new Error('No Order Found!'))
            }
            if (order.user.userID.toString() !== req.user._id.toString()) {
                return next(new Error('Unauthorized!'))
            }

            const invoiceName = `invoices-${orderID}.pdf`;
            const invoicePath = path.join(__dirname, '..', 'public', 'invoices', invoiceName);

            const pdfDoc = new pdfkit();

            res.setHeader('Content-Type', 'application/pdf')
            res.setHeader('Content-Disposition', 'attachment; filename=' + invoiceName + '')

            pdfDoc.pipe(fs.createWriteStream(invoicePath));
            pdfDoc.pipe(res);
            pdfDoc.fontSize(26).text("INVOICES", {
                underline: true,
            });
            pdfDoc.fontSize(15).text('------------------------------')
            let totalPrice = 0;
            order.products.forEach(prod => {
                totalPrice += prod.quantity * prod.product.price;
                pdfDoc.text(prod.quantity + 'x' + prod.product.price + '﷼')
            });

            pdfDoc.text('Total Price: ' + totalPrice)

            pdfDoc.end();
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error)
        })
}

exports.getCheckout = async (req, res) => {

    const user = await req.user.populate('cart.items.productID');
    const products = user.cart.items;

    let totalPrice = 0;
    products.forEach(p => {
        totalPrice += p.quantity * p.productID.price;
    })
    res.render('shop/checkout', {
        pageTitle: 'تسویه حساب',
        products: user.cart.items,
        isAuthenticated: req.session.isLoggedIn,
        totalPrice: totalPrice,
    })
}

exports.getPayment = async (req, res, next) => {

    const user = await req.user.populate('cart.items.productID');
    const products = user.cart.items;

    let totalPrice = 0;
    products.forEach(p => {
        totalPrice += p.quantity * p.productID.price;
    })

    zarinpal.PaymentRequest({
        Amount: totalPrice,
        CallbackURL: `http://localhost:${port}/checkPayment`,
        Description: 'تست اتصال به درگاه پرداخت',
        Email: user.email,
        Mobile: "09000000000"
    })
        .then(response => {
            res.redirect(response.url)
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error)
        })
}

exports.checkPayment = async (req, res, next) => {

    const user = await req.user.populate('cart.items.productID');
    const products = user.cart.items;

    let totalPrice = 0;
    products.forEach(p => {
        totalPrice += p.quantity * p.productID.price;
    })

    const authority = req.query.Authority;
    const status = req.query.Status;

    if (status == 'OK') {
        zarinpal.PaymentVerification({
            Amount: totalPrice,
            Authority: authority,
        })
            .then(response => {
                if (response.status == 100) {
                    console.log("Verified: " + response.refId);

                    req.user.populate('cart.items.productID')
                        .then(user => {
                            const products = user.cart.items.map(item => {
                                return {
                                    quantity: item.quantity,
                                    product: { ...item.productID._doc }
                                }
                            })
                            const order = new Order({
                                user: {
                                    email: req.user.email,
                                    userID: req.user._id
                                },
                                products: products
                            })
                            return order.save();
                        })
                        .then(() => {
                            req.user.clearCart();
                            req.flash('refID', response.refId)
                            res.redirect('/orders')
                        })
                        .catch(err => {
                            const error = new Error(err);
                            error.httpStatusCode = 500;
                            return next(error)
                        })
                }
                else if (status == 'NOK') {
                    res.redirect('/cart')
                }
            })
    }
}