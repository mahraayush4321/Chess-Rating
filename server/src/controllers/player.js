const playerModel = require('../models/players')
const Response = require('../helpers/response');
const HTTP_STATUS = require('../helpers/http-status');

class Player {
    getAllPlayers = async (req,res) => {
        try {
            const players = await playerModel.find().sort({ rating: -1 });
            Response.createSucessResponse(res, HTTP_STATUS.SUCCESS, {players});
        } catch (err) {
            Response.createInternalErrorResponse(res);
        }
    }

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

