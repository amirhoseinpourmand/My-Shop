const User = require('../models/user');
const bcrypt = require('bcryptjs');
const sendEmail = require('../util/email');
const crypto = require('crypto');
const user = require('../models/user');
const { validationResult } = require('express-validator');

exports.getLogin = (req, res) => {

    const errors = validationResult(req);

    res.render('auth/login', {
        pageTitle: 'ورود',
        errorMessage: req.flash('error')[0],
        successMessage: req.flash('success')[0],
        oldInput: {},
    })
};

exports.postLogin = (req, res) => {

    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        console.log(errors.array());
        return res.status(422).render('auth/login', {
            pageTitle: 'ورود',
            errorMessage: errors.array()[0].msg,
            successMessage: null,
            oldInput: {
                email: email,
                password: password,
            },
            validationErrors: errors.array(),
        })
    }

    User.findOne({ email: email })
        .then(user => {
            if (!user) {
                req.flash('error', 'ایمیلی یافت نشد!')
                return res.redirect('/login')
            }
            bcrypt.compare(password, user.password)
                .then(isMatch => {
                    if (isMatch) {
                        req.session.isLoggedIn = true;
                        req.session.user = user;
                        return req.session.save(err => {
                            console.log(err);
                            res.redirect('/');
                        });
                    };
                    req.flash('error', 'رمز عبور اشتباه است')
                    res.redirect('/login');
                })
        })

};

exports.postLogout = (req, res) => {

    req.session.destroy(err => {
        console.log(err);
        res.redirect('/')
    });
};


exports.getSignUp = (req, res) => {

    const errors = validationResult(req);

    res.render('auth/sign-up', {
        pageTitle: 'ثبت نام',
        errorMessage: req.flash('error')[0],
        oldInput: {},
        validationErrors: errors.array()
    })
}

exports.postSignUp = (req, res) => {

    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        console.log(errors.array());
        return res.status(422).render('auth/sign-up', {
            pageTitle: 'ثبت نام',
            errorMessage: errors.array()[0].msg,
            oldInput: {
                email: email,
                password: password,
                confirmPassword: confirmPassword
            },
            validationErrors: errors.array()
        })
    }

    User.findOne({ email: email })
        .then(userDoc => {
            if (userDoc) {
                req.flash('error', 'ایمیلی با همین نام ثبت نام کرده است')
                return res.redirect('/sign-up')
            }

            return bcrypt.hash(password, 12)
                .then(hashedPassword => {
                    const user = new User({
                        email: email,
                        password: hashedPassword,
                        cart: {
                            item: []
                        }
                    })
                    return user.save();
                })
                .then(() => {
                    req.flash('success', 'ثبت نام با موفقیت انجام شد')
                    sendEmail({
                        subject: 'ثبت نام',
                        text: 'ثبت نام با موفقیت انجام شد',
                        userEmail: email,
                    })
                    return res.redirect('/login')
                })
        })
        .catch(err => console.log(err))
}

exports.getReset = (req, res) => {

    res.render('auth/reset', {
        pageTitle: 'بازیابی رمز عبور',
        errorMessage: req.flash('error'),
        successMessage: req.flash('success'),
    })
}

exports.postReset = (req, res) => {

    crypto.randomBytes(32, (err, buf) => {
        if (err) {
            console.log(err);
            return res.redirect('/reset')
        }
        const token = buf.toString('hex')

        User.findOne({ email: req.body.email })
            .then(user => {
                if (!user) {
                    req.flash('error', 'ایمیلی یافت نشد!')
                    return res.redirect('/reset');
                }
                user.resetToken = token;
                user.expiredResetDateToken = Date.now() + 3600000;
                return user.save();
            })
            .then(result => {
                if (result) {
                    req.flash('success', 'لینک بازیابی رمز عبور به ایمیل شما ارسال شد!');
                    res.redirect('/login');
                    sendEmail({
                        subject: 'بازیابی رمز عبور',
                        html: `<p>درخواست بازیابی رمز عبور</p><p>برای بازیابی رمز عبور <a href = "http://localhost:3000/reset/${token}">این لینک</a> را کلیک کنید</p>`,
                        userEmail: req.body.email,
                    })
                }
            })
            .catch(err => { console.log(err) })
    })
}

exports.getResetPassword = (req, res) => {

    const token = req.params.token;
    User.findOne({
        resetToken: token,
        expiredResetDateToken: { $gt: Date.now() },
    })
        .then(user => {
            res.render('auth/new-password', {
                pageTitle: 'رمز عبور جدید',
                userID: user._id.toString(),
                passwordToken: token,
            })
        })
        .catch(err => console.log(err))
}

exports.postNewPassword = (req, res) => {

    const newPassword = req.body.password;
    const userID = req.body.userID;
    const passwordToken = req.body.passwordToken;

    let updatedUser;

    User.findOne({
        resetToken: passwordToken,
        expiredResetDateToken: { $gt: Date.now() },
        _id: userID,
    })
        .then(user => {
            updatedUser = user;
            return bcrypt.hash(newPassword, 12);
        })
        .then(hashedPassword => {
            updatedUser.password = hashedPassword;
            updatedUser.resetToken = undefined;
            updatedUser.expiredResetDateToken = undefined;
            updatedUser.save();
        })
        .then(() => {
            req.flash('success', 'رمز عبور با موفقیت تغییر یافت')
            return res.redirect('/login')
        })
        .catch(err => console.log(err))
}