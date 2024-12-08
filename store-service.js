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

const Sequelize = require('sequelize');

var sequelize = new Sequelize('postgres', 'postgres', 'XujNlYzMUtbttWf7', {
    host: 'creditably-dainty-impala.data-1.use1.tembo.io',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: { rejectUnauthorized: false }
    },
    query: { raw: true }
});

const Item = sequelize.define('Item', {
    body: Sequelize.TEXT,
    title: Sequelize.STRING,
    postDate: Sequelize.DATE,
    featureImage: Sequelize.STRING,
    published: Sequelize.BOOLEAN,
    price: Sequelize.DOUBLE
});

const Category = sequelize.define('Category', {
    category: Sequelize.STRING
});

Item.belongsTo(Category, { foreignKey: 'category' });

function initialize() {
    return new Promise((resolve, reject) => {
        sequelize.sync()
            .then(() => {
                resolve();
            })
            .catch((error) => {
                reject("unable to sync the database");
            });
    });
}

function getAllItems() {
    return new Promise((resolve, reject) => {
        Item.findAll()
            .then((items) => {
                if (items.length > 0) {
                    resolve(items);
                } else {
                    reject("no results returned");
                }
            })
            .catch(() => {
                reject("no results returned");
            });
    });
}

function getItemsByCategory(category) {
    return new Promise((resolve, reject) => {
        Item.findAll({
            where: {
                category: category
            }
        })
            .then((items) => {
                if (items.length > 0) {
                    resolve(items);
                } else {
                    reject("no results returned");
                }
            })
            .catch(() => {
                reject("no results returned");
            });
    });
}

function getItemsByMinDate(minDateStr) {
    const { gte } = Sequelize.Op;

    return new Promise((resolve, reject) => {
        Item.findAll({
            where: {
                postDate: {
                    [gte]: new Date(minDateStr)
                }
            }
        })
            .then((items) => {
                if (items.length > 0) {
                    resolve(items);
                } else {
                    reject("no results returned");
                }
            })
            .catch(() => {
                reject("no results returned");
            });
    });
}

function getItemById(id) {
    return new Promise((resolve, reject) => {
        Item.findAll({
            where: {
                id: id
            }
        })
            .then((items) => {
                if (items.length > 0) {
                    resolve(items[0]);
                } else {
                    reject("no results returned");
                }
            })
            .catch(() => {
                reject("no results returned");
            });
    });
}

function addItem(itemData) {
    return new Promise((resolve, reject) => {
        itemData.published = (itemData.published) ? true : false;

        for (let prop in itemData) {
            if (itemData[prop] === "") {
                itemData[prop] = null;
            }
        }

        itemData.postDate = new Date();

        Item.create(itemData)
            .then(() => {
                resolve();
            })
            .catch((error) => {
                reject("unable to create item");
            });
    });
}

function getPublishedItems() {
    return new Promise((resolve, reject) => {
        Item.findAll({
            where: {
                published: true
            }
        })
            .then((items) => {
                if (items.length > 0) {
                    resolve(items);
                } else {
                    reject("no results returned");
                }
            })
            .catch(() => {
                reject("no results returned");
            });
    });
}

function getPublishedItemsByCategory(category) {
    return new Promise((resolve, reject) => {
        Item.findAll({
            where: {
                published: true,
                category: category
            }
        })
            .then((items) => {
                if (items.length > 0) {
                    resolve(items);
                } else {
                    reject("no results returned");
                }
            })
            .catch(() => {
                reject("no results returned");
            });
    });
}

function getCategories() {
    return new Promise((resolve, reject) => {
        Category.findAll()
            .then((categories) => {
                if (categories.length > 0) {
                    resolve(categories);
                } else {
                    reject("no results returned");
                }
            })
            .catch(() => {
                reject("no results returned");
            });
    });
}

function addCategory(categoryData) {
    return new Promise((resolve, reject) => {
        for (let prop in categoryData) {
            if (categoryData[prop] === "") {
                categoryData[prop] = null;
            }
        }

        Category.create(categoryData)
            .then(() => {
                resolve();
            })
            .catch((error) => {
                reject("unable to create category");
            });
    });
}

function deleteCategoryById(id) {
    return new Promise((resolve, reject) => {
        Category.destroy({
            where: {
                id: id
            }
        })
            .then((result) => {
                if (result === 1) { 
                    resolve();
                } else {
                    reject("category not found");
                }
            })
            .catch(() => {
                reject("unable to delete category");
            });
    });
}

function deleteItemById(id) {
    return new Promise((resolve, reject) => {
        Item.destroy({
            where: {
                id: id
            }
        })
            .then((result) => {
                if (result === 1) {
                    resolve();
                } else {
                    reject("item not found");
                }
            })
            .catch(() => {
                reject("unable to delete item");
            });
    });
}

module.exports = {
    initialize,
    getAllItems,
    getPublishedItems,
    getCategories,
    addItem,
    getItemsByCategory,
    getItemsByMinDate,
    getItemById,
    getPublishedItemsByCategory,
    addCategory,
    deleteCategoryById,
    deleteItemById
};