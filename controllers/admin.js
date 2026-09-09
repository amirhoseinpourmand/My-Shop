const Product = require('../models/product');
const { validationResult } = require('express-validator');
const deleteFile = require('../util/deleteFile');
const User = require('../models/user');

exports.getProducts = (req, res, next) => {

    Product.find({ userID: req.user._id })
        .then(products => {
            res.render('admin/products', {
                prods: products,
                pageTitle: 'محصولات ادمین',
                isAuthenticated: req.session.isLoggedIn,
            })
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error)
        })
};

exports.getAddProduct = (req, res) => {

    const errors = validationResult(req);

    res.render('admin/add-product', {
        editing: false,
        pageTitle: 'افزودن محصول',
        isAuthenticated: req.session.isLoggedIn,
        hasError: false,
        validationErrors: [],
        errorMessage: null,
    });
};

exports.postAddProduct = (req, res, next) => {

    const title = req.body.title;
    const image = req.file;
    const price = req.body.price;
    const description = req.body.description;

    const errors = validationResult(req);
    console.log(image);
    if (!image) {
        return res.status(422).render('admin/add-product', {
            pageTitle: 'افزودن محصول',
            editing: false,
            isAuthenticated: req.session.isLoggedIn,
            product: {
                title: title,
                image: image,
                price: price,
                description: description
            },
            hasError: true,
            validationErrors: [],
            errorMessage: "لطفا عکس وارد کنید",
        })
    }

    if (!errors.isEmpty()) {
        console.log(errors.array());
        return res.status(422).render('admin/add-product', {
            pageTitle: 'افزودن محصول',
            editing: false,
            isAuthenticated: req.session.isLoggedIn,
            product: {
                title: title,
                image: image,
                price: price,
                description: description
            },
            hasError: true,
            validationErrors: errors.array(),
            errorMessage: errors.array()[0].msg,
        })
    }

    const product = new Product({
        title: title,
        price: price,
        description: description,
        image: "images/" + image.filename,
        userID: req.user,
    });
    console.log(image.name);
    product.save()
        .then(() => {
            console.log("Product Created")
            res.redirect('/')
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error)
        })
};

exports.getEditProduct = (req, res, next) => {

    const editMode = req.query.edit;

    if (!editMode) {
        return res.redirect('/');
    }

    const prodID = req.params.productID;
    console.log('GET prodID:', prodID);

    Product.findById(prodID)
        .then(product => {
            if (!product) {
                return res.redirect('/')
            }

            const errors = validationResult(req);

            res.render('admin/add-product', {
                pageTitle: 'ویرایش محصول',
                editing: true,
                product: product,
                hasError: false,
                isAuthenticated: req.session.isLoggedIn,
                errorMessage: null,
                validationErrors: [],
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error)
        })
};

exports.postEditProduct = (req, res, next) => {

    const prodId = req.body.productID;
    const updatedTitle = req.body.title;
    const updatedPrice = req.body.price;
    const updatedDescription = req.body.description;
    const updatedImage = req.file;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        console.log(errors.array());
        return res.status(422).render('admin/add-product', {
            pageTitle: 'ویرایش محصول',
            editing: true,
            isAuthenticated: req.session.isLoggedIn,
            product: {
                title: updatedTitle,
                image: updatedImage,
                price: updatedPrice,
                description: updatedDescription,
                _id: prodId,
            },
            hasError: true,
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array(),
        })
    }

    console.log('prodId:', prodId);

    Product.findById(prodId)
        .then(product => {

            if (product.userID.toString() !== req.user._id.toString()) {
                return res.redirect('/')
            }

            product.title = updatedTitle;
            product.price = updatedPrice;
            product.description = updatedDescription;
            if (updatedImage) {
                deleteFile.deleteFile(product.image);
                product.image = updatedImage.path;
            }
            return product.save()
                .then(() => {
                    console.log("Product Updated");
                    res.redirect('/');
                })
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error)
        })

};

exports.deleteProduct = (req, res, next) => {
    const prodID = req.params.productID;

    Product.findById(prodID)
        .then(product => {
            if (!product) {
                return next(new Error('Product not Found!'))
            }
            deleteFile.deleteFile(product.image);
            return Product.deleteOne({
                _id: prodID,
                userID: req.user._id
            })
        })
        .then(() => {
            return User.updateMany(
                { 'cart.items.productID': prodID },
                { $pull: { 'cart.items': { productID: prodID } } }
            );
        })
        .then(() => {
            console.log("Product Deleted")
            res.json({ message: 'Successfull!' })
        })
        .catch(err => {
            res.json({ message: 'Deleting Product Failed!' })
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error)
        })
};