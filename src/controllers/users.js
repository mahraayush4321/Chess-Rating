const express = require('express')
const HTTP_STATUS = require('../helpers/http-status');
const Response = require('../helpers/response');
const Model = require('../models/users');
const bcrypt = require('bcrypt');

class User {
    createNewUser = async (req,res) => {
        const {firstName, lastName , email, password} = req.body;
        try {
            const hashedpassword = await bcrypt.hash(password,10);
            const newUserToInsert = new Model({
                firstName,
                lastName,
                email,
                password:hashedpassword,
            });
            const savedUser = await newUserToInsert.save();
           Response.createSucessResponse(res,HTTP_STATUS.SUCCESS, {user:savedUser});
        } catch (error) {
            Response.createInternalErrorResponse(res,error);
        }
    }

    loginUser = async (req,res) => {
        const {email, password} = req.body;
        try {
            const user = await Model.findOne({email:email});
            if(!user) {
               return Response.createNotFoundResponse(res);
            }
            const passwordMatch = await bcrypt.compare(password,user.password) 

            if(!passwordMatch) {
               return Response.createUnauthorizedResponse(res);
            }
           Response.createSucessResponse(res, HTTP_STATUS.SUCCESS, { user});
        } catch (error) {
            Response.createInternalErrorResponse(res, error);
        }
    }

    getAllUser = async (req, res) => {
        try {
            const users = await Model.find();
            const totalUsers = await Model.countDocuments();
            Response.createSucessResponse(res, HTTP_STATUS.SUCCESS, { users , totalUsers});
        } catch (error) {
            Response.createInternalErrorResponse(res);
        }
    }

    getSingleUser = async (req,res) => {
        try {
            const {userId} = req.params;
            const getUser = await Model.findById(userId);
            Response.createSucessResponse(res, HTTP_STATUS.SUCCESS, { getUser });
        } catch (error) {
            Response.createInternalErrorResponse(res);
        }
    }

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