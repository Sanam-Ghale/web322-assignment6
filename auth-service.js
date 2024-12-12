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

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');

const userSchema = new Schema({
    userName: {
        type: String,
        unique: true
    },
    password: String,
    email: String,
    loginHistory: [
        {
            dateTime: Date,
            userAgent: String
        }
    ]
});

let User;

function initialize() {
    return new Promise((resolve, reject) => {
        let db = mongoose.createConnection("mongodb+srv://ss727357123:K90s3MKEK7QKKQQl@cluster0.45lc3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");

        db.on('error', (err) => {
            reject(err);
        });
        db.once('open', () => {
            User = db.model("users", userSchema);
            resolve();
        });
    });
}

function registerUser(userData) {
    return new Promise((resolve, reject) => {
        if (userData.password !== userData.password2) {
            reject("Passwords do not match");
        } else {
            bcrypt.hash(userData.password, 10)
                .then(hash => {

                    let newUser = new User({
                        userName: userData.userName,
                        password: hash,
                        email: userData.email,
                        loginHistory: []
                    });

                    newUser.save()
                        .then(() => {
                            resolve();
                        })
                        .catch((err) => {
                            if (err.code === 11000) {
                                reject("User Name already taken");
                            } else {
                                reject(`There was an error creating the user: ${err}`);
                            }
                        });
                })
                .catch(err => {
                    reject("There was an error encrypting the password");
                });
        }
    });
}

function checkUser(userData) {
    return new Promise((resolve, reject) => {
        User.find({ userName: userData.userName })
            .then((users) => {
                if (users.length === 0) {
                    reject(`Unable to find user: ${userData.userName}`);
                } else {
                    bcrypt.compare(userData.password, users[0].password)
                        .then((result) => {
                            if (result === false) {
                                reject(`Incorrect Password for user: ${userData.userName}`);
                            } else {

                                users[0].loginHistory.push({
                                    dateTime: new Date().toString(),
                                    userAgent: userData.userAgent
                                });


                                User.updateOne(
                                    { userName: users[0].userName },
                                    { $set: { loginHistory: users[0].loginHistory } }
                                )
                                    .then(() => {
                                        resolve(users[0]);
                                    })
                                    .catch((err) => {
                                        reject(`There was an error verifying the user: ${err}`);
                                    });
                            }
                        })
                        .catch(() => {
                            reject(`There was an error verifying the password`);
                        });
                }
            })
            .catch(() => {
                reject(`Unable to find user: ${userData.userName}`);
            });
    });
}

module.exports = {
    initialize,
    registerUser,
    checkUser
};
