/*********************************************************************************
* WEB322 – Assignment 06
* I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part of this
* assignment has been copied manually or electronically from any other source (including web sites) or
* distributed to other students.
*
* Name: Sanam Ghale 
  Student ID: 148755226 
  Date: December 11 2024
*
* Replit Web App URL:https://replit.com/@sghale2/web322-assignment6
*
* GitHub Repository URL: https://github.com/Sanam-Ghale/web322-assignment6.git
*
********************************************************************************/


const express = require('express');
const path = require('path');
const storeService = require('./store-service');
const authData = require('./auth-service');
const clientSessions = require('client-sessions');
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const expressEjsLayouts = require('express-ejs-layouts');

// Cloudinary Config
cloudinary.config({
    cloud_name: 'doxlmyf70',
    api_key: '431382676145445',
    api_secret: 'RQjjpm6jnjoVXjKSAdn8VEYMBro',
    secure: true
});

const app = express();
const upload = multer();

// View Engine Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressEjsLayouts);
app.set('layout', 'layouts/main');

// Client Sessions Setup
app.use(clientSessions({
    cookieName: "session",
    secret: "web322_assignment6_secret",
    duration: 2 * 60 * 1000, // 2 minutes
    activeDuration: 1000 * 60 // 1 minute
}));

app.use(function (req, res, next) {
    res.locals.session = req.session;
    next();
});

function ensureLogin(req, res, next) {
    if (!req.session.user) {
        res.redirect('/login');
    } else {
        next();
    }
}

app.use(function (req, res, next) {
    let route = req.path.substring(1);
    res.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
    res.locals.viewingCategory = req.query.category;
    next();
});

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

storeService.initialize()
    .then(authData.initialize)
    .then(function () {
        app.listen(process.env.PORT || 8080, () => {
            console.log("Express http server listening on port", process.env.PORT || 8080);
        });
    }).catch(function (err) {
        console.log("unable to start server: " + err);
    });

app.locals.formatDate = function (dateObj) {
    let year = dateObj.getFullYear();
    let month = (dateObj.getMonth() + 1).toString();
    let day = dateObj.getDate().toString();
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

// Public Routes (No Login Required)
app.get('/', (req, res) => {
    res.redirect('/shop');
});

app.get('/about', (req, res) => {
    res.render('about');
});

app.get('/shop', async (req, res) => {
    try {
        let items = [];
        if (req.query.category) {
            items = await storeService.getPublishedItemsByCategory(req.query.category);
        } else {
            items = await storeService.getPublishedItems();
        }
        const categories = await storeService.getCategories();
        res.render("shop", { data: { items: items, categories: categories } });
    } catch (err) {
        res.render("shop", { data: { message: "no results", categories: [] } });
    }
});
app.get('/shop/:id', async (req, res) => {
    try {
        let item = await storeService.getItemById(req.params.id);

        let items = [];
        if (req.query.category) {
            items = await storeService.getPublishedItemsByCategory(req.query.category);
        } else {
            items = await storeService.getPublishedItems();
        }

        let categories = await storeService.getCategories();

        res.render("shop", {
            data: {
                item: item, 
                items: items,
                categories: categories
            }
        });

    } catch (err) {
        res.render("shop", {
            data: {
                message: "no results",
                categories: []
            }
        });
    }
});
// Protected Routes (Login Required)
app.get('/items', ensureLogin, async (req, res) => {
    try {
        const { category, minDate } = req.query;
        let items;
        if (category) {
            items = await storeService.getItemsByCategory(category);
        } else if (minDate) {
            items = await storeService.getItemsByMinDate(minDate);
        } else {
            items = await storeService.getAllItems();
        }
        res.render("items", { items: items });
    } catch (err) {
        res.render("items", { message: "no results" });
    }
});

app.get('/items/add', ensureLogin, (req, res) => {
    storeService.getCategories()
        .then((data) => {
            res.render('addItem', { categories: data });
        })
        .catch(() => {
            res.render('addItem', { categories: [] });
        });
});

app.post('/items/add', ensureLogin, upload.single("featureImage"), (req, res) => {
    if (req.file) {
        let streamUpload = (req) => {
            return new Promise((resolve, reject) => {
                let stream = cloudinary.uploader.upload_stream(
                    (error, result) => {
                        if (result) {
                            resolve(result);
                        } else {
                            reject(error);
                        }
                    }
                );
                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });
        };

        async function upload(req) {
            let result = await streamUpload(req);
            return result;
        }

        upload(req).then((uploaded) => {
            processItem(uploaded.url);
        });
    } else {
        processItem("");
    }

    function processItem(imageUrl) {
        req.body.featureImage = imageUrl;
        storeService.addItem(req.body).then(() => {
            res.redirect('/items');
        }).catch((err) => {
            res.status(500).send("Error adding item");
        });
    }
});

app.get('/items/delete/:id', ensureLogin, (req, res) => {
    storeService.deleteItemById(req.params.id)
        .then(() => {
            res.redirect('/items');
        })
        .catch(() => {
            res.status(500).send("Unable to Remove Item / Item not found");
        });
});

app.get('/categories', ensureLogin, async (req, res) => {
    try {
        const categories = await storeService.getCategories();
        if (categories && categories.length > 0) {
            res.render("categories", { categories: categories });
        } else {
            res.render("categories", { message: "no results" });
        }
    } catch (err) {
        res.render("categories", { message: "no results" });
    }
});

app.get('/categories/add', ensureLogin, (req, res) => {
    res.render('addCategory');
});

app.post('/categories/add', ensureLogin, (req, res) => {
    storeService.addCategory(req.body)
        .then(() => {
            res.redirect('/categories');
        })
        .catch((err) => {
            res.status(500).send("Unable to Add Category");
        });
});

app.get('/categories/delete/:id', ensureLogin, (req, res) => {
    storeService.deleteCategoryById(req.params.id)
        .then(() => {
            res.redirect('/categories');
        })
        .catch(() => {
            res.status(500).send("Unable to Remove Category / Category not found");
        });
});


app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', (req, res) => {
    authData.registerUser(req.body)
        .then(() => {
            res.render('register', {
                successMessage: "User created"
            });
        })
        .catch((err) => {
            res.render('register', {
                errorMessage: err,
                userName: req.body.userName
            });
        });
});

app.post('/login', (req, res) => {
    req.body.userAgent = req.get('User-Agent');

    authData.checkUser(req.body)
        .then((user) => {
            req.session.user = {
                userName: user.userName,
                email: user.email,
                loginHistory: user.loginHistory
            };
            res.redirect('/items');
        })
        .catch((err) => {
            res.render('login', {
                errorMessage: err,
                userName: req.body.userName
            });
        });
});

app.get('/logout', (req, res) => {
    req.session.reset();
    res.redirect('/');
});

app.get('/userHistory', ensureLogin, (req, res) => {
    res.render('userHistory');
});


app.use((req, res) => {
    res.status(404).render('404');
});
