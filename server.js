/*********************************************************************************
* WEB322 – Assignment 05
* I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part of this
* assignment has been copied manually or electronically from any other source (including web sites) or
* distributed to other students.
*
* Name: Sanam Ghale 
  Student ID: 148755226 
  Date: December 5 2024
*
* Cyclic Web App URL: ________________________________________________________
*
* GitHub Repository URL: ______________________________________________________
*
********************************************************************************/


const express = require('express');
const path = require('path');
const storeService = require('./store-service');
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const expressEjsLayouts = require('express-ejs-layouts');


cloudinary.config({
    cloud_name: 'doxlmyf70',
    api_key: '431382676145445',
    api_secret: 'RQjjpm6jnjoVXjKSAdn8VEYMBro',
    secure: true
});

const app = express();
const upload = multer();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressEjsLayouts);
app.set('layout', 'layouts/main');

app.use(function (req, res, next) {
    let route = req.path.substring(1);
    res.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
    res.locals.viewingCategory = req.query.category;
    next();
});

app.use(express.urlencoded({ extended: true }));



const PORT = process.env.PORT || 8080;


app.use(express.static(path.join(__dirname, 'public')));

storeService.initialize()
    .then(() => {
        app.listen(process.env.PORT || 8080, () => {
            console.log("Express http server listening on port", process.env.PORT || 8080);
        });
    })
    .catch((err) => {
        console.error('Error initializing data:', err);
        process.exit(1);
    });
// Routes

app.locals.formatDate = function (dateObj) {
    let year = dateObj.getFullYear();
    let month = (dateObj.getMonth() + 1).toString();
    let day = dateObj.getDate().toString();
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

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

        res.render("shop", {
            data: {
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

// New shop/:id route
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
                item: item, // specific item for this route
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

app.get('/items', async (req, res) => {
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

        if (items && items.length > 0) {
            res.render("items", { items: items });
        } else {
            res.render("items", { message: "no results" });
        }
    } catch (err) {
        res.render("items", { message: "no results" });
    }
});


app.get('/item/:id', (req, res) => {
    const { id } = req.params;
    storeService.getItemById(id)
        .then(item => res.json(item))
        .catch(err => res.status(500).json({ message: err }));
});


app.get('/categories', async (req, res) => {
    try {
        const categories = await storeService.getCategories();

        // Check if categories exist and have length
        if (categories && categories.length > 0) {
            res.render("categories", { categories: categories });
        } else {
            res.render("categories", { message: "no results" });
        }
    } catch (err) {
        res.render("categories", { message: "no results" });
    }
});

app.get('/categories/add', (req, res) => {
    res.render('addCategory');
});

app.post('/categories/add', (req, res) => {
    storeService.addCategory(req.body)
        .then(() => {
            res.redirect('/categories');
        })
        .catch((err) => {
            res.status(500).send("Unable to Add Category");
        });
});

app.get('/categories/delete/:id', (req, res) => {
    storeService.deleteCategoryById(req.params.id)
        .then(() => {
            res.redirect('/categories');
        })
        .catch(() => {
            res.status(500).send("Unable to Remove Category / Category not found");
        });
});


app.get('/items/add', (req, res) => {
    storeService.getCategories()
        .then((data) => {
            res.render('addItem', { categories: data });
        })
        .catch(() => {
            res.render('addItem', { categories: [] });
        });
});

app.post('/items/add', upload.single("featureImage"), (req, res) => {
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
            console.log(result);
            return result;
        }

        upload(req).then((uploaded) => {
            processItem(uploaded.url);
        }).catch(err => {
            console.error("Upload failed:", err);
            res.status(500).send("Upload Error");
        });
    } else {
        processItem("");
    }

    function processItem(imageUrl) {
        req.body.featureImage = imageUrl;

        storeService.addItem(req.body).then((newItem) => {
            res.redirect('/items'); // Redirect to items listing after adding
        }).catch(err => {
            console.error("Error adding item:", err);
            res.status(500).send("Item Creation Error");
        });
    }
});

app.get('/items/delete/:id', (req, res) => {
    storeService.deleteItemById(req.params.id)
        .then(() => {
            res.redirect('/items');
        })
        .catch(() => {
            res.status(500).send("Unable to Remove Item / Item not found");
        });
});

app.use((req, res) => {
    res.status(404).render('404');
});