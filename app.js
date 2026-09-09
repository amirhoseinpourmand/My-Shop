const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const mongodbStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');
require('dotenv').config();

let port = process.env.PORT || 3001;
let host = process.env.HOST;
let database_name = process.env.DATABASE_NAME;
let database_host = process.env.DATABASE_HOST;

const adminRouter = require('./routes/admin');
const shopRouter = require('./routes/shop');
const authRouter = require('./routes/auth');
const errorController = require('./controllers/error');

const User = require('./models/user');
const { image } = require('pdfkit');

const MONGODB_URI = `mongodb://${database_host}/${database_name}`;

const app = express();

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/images/')
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toDateString() + "_" + file.originalname)
    },
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/webp') {
        cb(null, true);
    } else {
        cb(null, false);
    }
}

const store = new mongodbStore({
    uri: MONGODB_URI,
    collection: 'session',
})
app.use(session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store
}));


app.set('views', 'views');
app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({
    storage: fileStorage,
    fileFilter: fileFilter
}).single('image'));

app.use(csrf());
app.use(flash());


app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
})

app.use((req, res, next) => {
    if (!req.session.user) {
        return next();
    }
    User.findById(req.session.user._id)
        .then(user => {
            if (!user) {
                return next();
            }
            req.user = user;
            req.session.user = user.toObject();
            next();
        })
        .catch(err => { throw new Error(err) })
});

app.use('/admin', adminRouter);
app.use(shopRouter);
app.use(authRouter);
app.get('/500', errorController.get500);

app.use((error, req, res, next) => {
    console.log(error);
    return res.status(500).render('500', {
        pageTitle: 'خطای سرور',
        isAuthenticated: req.session.isLoggedIn,
    })
})

mongoose.connect(MONGODB_URI)
    .then(() => {
        app.listen(port, () => {
            console.log(`http://${database_host}:${port}/`);
        })
    })
    .catch(err => console.log(err))