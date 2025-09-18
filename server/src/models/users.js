/**
 * @fileoverview This file defines the Mongoose schema for a user.
 * @module server/src/models/users
 */

const mongoose = require('mongoose');

/**
 * @description Mongoose schema for a user.
 * @property {string} firstName - The first name of the user.
 * @property {string} lastName - The last name of the user.
 * @property {string} email - The email address of the user.
 * @property {string} password - The hashed password of the user.
 */
const userSchema = new mongoose.Schema({
    firstName:{
        type: String,
        required: true
    },
    lastName:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
    },
    password:{
        type:String,
        required:true
    }
},{timestamps:{createdAt: 'createdAt', updatedAt: 'lastUpdatedAt'},versionKey:false});
const user =  mongoose.model('users', userSchema);

module.exports = user;
