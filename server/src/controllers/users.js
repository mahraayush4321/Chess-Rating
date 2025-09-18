/**
 * @fileoverview This file contains the controller for user-related operations.
 * @module server/src/controllers/users
 */

const express = require('express')
const HTTP_STATUS = require('../helpers/http-status');
const Response = require('../helpers/response');
const Model = require('../models/users');
const Player = require('../models/players');
const bcrypt = require('bcrypt');

/**
 * @class User
 * @description A class to handle user-related operations.
 */
class User {
    /**
     * @description Creates a new user and a corresponding player profile.
     * @param {object} req - Express request object.
     * @param {object} res - Express response object.
     * @returns {object} The newly created user object.
     */
    createNewUser = async (req,res) => {
        const {firstName, lastName , email, password} = req.body;
        try {
            const existingUser = await Model.findOne({ email });
            if (existingUser) {
                return Response.createSucessResponse(res, HTTP_STATUS.CONFLICT, { 
                    message: "User with this email already exists" 
                });
            }

            const hashedpassword = await bcrypt.hash(password,10);
            const newUserToInsert = new Model({
                firstName,
                lastName,
                email,
                password:hashedpassword,
            });
            const savedUser = await newUserToInsert.save();

            const player = new Player({
                _id: savedUser._id, 
                name: `${firstName} ${lastName}`.trim(),
                userId: savedUser._id,
                rating: 1200
            });
            await player.save();

            const userResponse = {
                _id: savedUser._id,
                firstName: savedUser.firstName,
                lastName: savedUser.lastName,
                email: savedUser.email,
                rating: 1200
            };
            Response.createSucessResponse(res,HTTP_STATUS.SUCCESS, {user: userResponse});
        } catch (error) {
            Response.createInternalErrorResponse(res,error);
        }
    }

    /**
     * @description Logs in a user.
     * @param {object} req - Express request object.
     * @param {object} res - Express response object.
     * @returns {object} The user object (without password).
     */
    loginUser = async (req,res) => {
        const {email, password} = req.body;
        try {
            const user = await Model.findOne({email:email});
            if(!user) {
               return Response.createNotFoundResponse(res);
            }
            const passwordMatch = await bcrypt.compare(password, user.password);

            if(!passwordMatch) {
               return Response.createUnauthorizedResponse(res);
            }

            const userWithoutPassword = {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                rating: user.rating || 1200
            };
            Response.createSucessResponse(res, HTTP_STATUS.SUCCESS, { user: userWithoutPassword });
        } catch (error) {
            Response.createInternalErrorResponse(res, error);
        }
    }

    /**
     * @description Retrieves all users.
     * @param {object} req - Express request object.
     * @param {object} res - Express response object.
     * @returns {object} A list of all users and the total count.
     */
    getAllUser = async (req, res) => {
        try {
            const users = await Model.find();
            const totalUsers = await Model.countDocuments();
            Response.createSucessResponse(res, HTTP_STATUS.SUCCESS, { users , totalUsers});
        } catch (error) {
            Response.createInternalErrorResponse(res);
        }
    }

    /**
     * @description Retrieves a single user by ID.
     * @param {object} req - Express request object.
     * @param {object} res - Express response object.
     * @returns {object} The user object.
     */
    getSingleUser = async (req,res) => {
        try {
            const {userId} = req.params;
            const getUser = await Model.findById(userId);
            Response.createSucessResponse(res, HTTP_STATUS.SUCCESS, { getUser });
        } catch (error) {
            Response.createInternalErrorResponse(res);
        }
    }

    /**
     * @description Deletes all users.
     * @param {object} req - Express request object.
     * @param {object} res - Express response object.
     * @returns {object} A success message.
     */
    deleteAllUsers = async (req,res) => {
        try {
            await Model.deleteMany({});
            Response.createSucessResponse(res,HTTP_STATUS.SUCCESS,  { message: "All users deleted successfully" });
        } catch (error) {
            Response.createInternalErrorResponse(res);
        }
    }
}

module.exports = new User();