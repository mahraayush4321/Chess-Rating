/**
 * @fileoverview This file contains the controller for player-related operations.
 * @module server/src/controllers/player
 */

const playerModel = require('../models/players')
const Response = require('../helpers/response');
const HTTP_STATUS = require('../helpers/http-status');

/**
 * @class Player
 * @description A class to handle player-related operations.
 */
class Player {
    /**
     * @description Retrieves all players, sorted by rating.
     * @param {object} req - Express request object.
     * @param {object} res - Express response object.
     * @returns {object} A list of all players.
     */
    getAllPlayers = async (req,res) => {
        try {
            const players = await playerModel.find().sort({ rating: -1 });
            Response.createSucessResponse(res, HTTP_STATUS.SUCCESS, {players});
        } catch (err) {
            Response.createInternalErrorResponse(res);
        }
    }

    /**
     * @description Adds a new player.
     * @param {object} req - Express request object.
     * @param {object} res - Express response object.
     * @returns {object} The newly created player object.
     */
    addPlayer = async (req,res) => {
        try {
            const userId = req.user._id;
            const { name } = req.body;
            
            const newPlayer = new playerModel({
                _id: userId,
                name,
                userId
            });
            await newPlayer.save();
            Response.createSucessResponse(res, HTTP_STATUS.SUCCESS, {player: newPlayer});
        } catch (err) {
           res.status(500).json({error:err.message})
        }
    }

    /**
     * @description Fetches the rating of a specific player.
     * @param {object} req - Express request object.
     * @param {object} res - Express response object.
     * @returns {object} An object containing the player's name and rating.
     */
    fetchPlayerRating = async (req,res) => {
        try {
            const {id} = req.params;   
            const player = await playerModel.findById(id);
            if (!player) {
                return res.status(404).json({ message: 'Player not found' });
            }
            res.status(200).json({ name: player.name, rating: player.rating });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * @description Retrieves a specific player's details.
     * @param {object} req - Express request object.
     * @param {object} res - Express response object.
     * @returns {object} An object containing the player's details.
     */
    getPlayer = async (req,res) => {
        try {
            const {id} = req.params;
            if(!id) return;
            const player = await playerModel.findById(id).populate('followers', 'name').populate('following', 'name');
            if (!player) {
                return res.status(404).json({ message: 'Player not found' });
            }     
            res.status(200).json({getPlayer:{
                name: player.name,
                rating: player.rating,
                country: player.country,
                followers: player.followers,
                following: player.following 
            }});
        } catch (error) {
            res.status(400).json({error: error.message})
        }
    }

    /**
     * @description Updates a player's details.
     * @param {object} req - Express request object.
     * @param {object} res - Express response object.
     * @returns {object} The updated player object.
     */
    updatePlayer = async(req,res)  => {
        try {
           const {id} = req.params;
           const allowedFields = ['name','age', 'bio', 'country'];
           const updates = Object.keys(req.body).filter(key => allowedFields.includes(key)).reduce((obj,key)=>{
            obj[key] = req.body[key]
            return obj;
           },{})

           if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: 'No valid fields to update' });
          }
          const updatedPlayer = await playerModel.findByIdAndUpdate(id, updates, { new: true });
          if (!updatedPlayer) {
              return res.status(404).json({ message: 'Player not found' });
          }
          res.status(200).json({ player: updatedPlayer });
        } catch (error) {
            res.status(400).json({error:error.message})
        }
    }

    /**
     * @description Searches for players based on various criteria.
     * @param {object} req - Express request object.
     * @param {object} res - Express response object.
     * @returns {object} A list of players that match the search criteria.
     */
    searchPlayer = async(req,res) => {
        try {
            const {name, country, minRating, maxRating } = req.query;
            const filter = {
                ...(name && {name: {$regex:name, $options: 'i'}}),
                ...(country && { country }),
                ...(minRating && { rating: { $gte: minRating } }),
                ...(maxRating && { rating: { $lte: maxRating } }),
            }
            const players = await playerModel.find(filter).select('name rating country');
            res.status(200).json({ players });
        } catch (error) {
            res.status(400).json({error:error.message})
        }
    }

    /**
     * @description Retrieves the match history of a player.
     * @param {object} req - Express request object.
     * @param {object} res - Express response object.
     * @returns {object} An object containing the player's match history.
     */
    getPlayerMatchHistory = async (req,res) => {
        try {
            const { id } = req.params;
            const player = await playerModel.findById(id).populate({
                path: 'matches',
                select: 'player1 player2 result datePlayed',
            });
            if (!player) return res.status(404).json({ message: 'Player not found' });
            res.status(200).json({ matches: player.matches });
        } catch (error) {
            res.status(500).json({error:error.message})
        }
    }

    /**
     * @description Allows a player to follow another player.
     * @param {object} req - Express request object.
     * @param {object} res - Express response object.
     * @returns {object} A success message.
     */
    followPlayer = async (req,res) => {
        try {
            const { followerId, followingId } = req.body;
            const follower = await playerModel.findById(followerId);
            const following = await playerModel.findById(followingId);

            if (!follower || !following) {
                return res.status(404).json({ message: 'Player(s) not found' });
            }

            if (followerId === followingId) {
                return res.status(400).json({ message: 'You cannot follow yourself' });
            }
            await Promise.all([
                playerModel.updateOne(
                    { _id: followerId },
                    { $addToSet: { following: followingId } }
                ),
                playerModel.updateOne(
                    { _id: followingId },
                    { $addToSet: { followers: followerId } }
                )
            ]);
            
            res.status(200).json({ message: 'Followed successfully' });
        } catch (error) {
            res.status(500).json({error: error.message})
        }
    }

    /**
     * @description Allows a player to unfollow another player.
     * @param {object} req - Express request object.
     * @param {object} res - Express response object.
     * @returns {object} A success message.
     */
    unfollowPlayer = async (req,res) => {
        try {
            const { followerId, followingId } = req.body;

            const follower = await playerModel.findById(followerId);
            const following = await playerModel.findById(followingId);

            if (!follower || !following) {
                return res.status(404).json({ message: 'Player(s) not found' });
            }
            follower.following = follower.following.filter(id => id.toString() !== followingId);
            following.followers = following.followers.filter(id => id.toString() !== followerId);

            await follower.save();
            await following.save();
            res.status(200).json({ message: 'Unfollowed successfully' });
        } catch (error) {
            res.status(500).json({error:error.message})
        }
    }
   
    /**
     * @description Retrieves a player by their ID, with populated match, follower, and following data.
     * @param {object} req - Express request object.
     * @param {object} res - Express response object.
     * @returns {object} The player object.
     */
    getPlayerById = async (req, res) => {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ message: 'Player ID is required' });
            }
            
            const player = await playerModel
              .findById(id)
              .populate({
                path: "matches",
                populate: [
                  { path: "player1", select: "name" },
                  { path: "player2", select: "name" },
                ],
              })
              .populate("followers", "name")
              .populate("following", "name");
                
            if (!player) {
                return res.status(404).json({ message: 'Player not found' });
            }
            
            res.status(200).json(player);
        } catch (error) {
            console.error('Error fetching player by ID:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new Player();
