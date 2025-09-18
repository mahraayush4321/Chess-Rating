/**
 * @fileoverview This file defines the routes for user-related operations.
 * @module server/src/routes/v1/users
 */

const express = require('express');
const router = express.Router();
const User = require('../../controllers/users');

/**
 * @name POST /signup
 * @description Route to create a new user.
 * @function
 * @memberof module:server/src/routes/v1/users
 * @inner
 */
router.post('/signup', User.createNewUser);

/**
 * @name POST /login
 * @description Route to log in a user.
 * @function
 * @memberof module:server/src/routes/v1/users
 * @inner
 */
router.post('/login', User.loginUser);

/**
 * @name GET /Users
 * @description Route to get all users.
 * @function
 * @memberof module:server/src/routes/v1/users
 * @inner
 */
router.get('/Users', User.getAllUser);

/**
 * @name GET /getUser/:userId
 * @description Route to get a single user by ID.
 * @function
 * @memberof module:server/src/routes/v1/users
 * @inner
 */
router.get('/getUser/:userId', User.getSingleUser);

/**
 * @name DELETE /deleteUsers
 * @description Route to delete all users.
 * @function
 * @memberof module:server/src/routes/v1/users
 * @inner
 */
router.delete('/deleteUsers', User.deleteAllUsers);

module.exports = router;