import  { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body;
    const userId = req.user._id;

    if(!content?.trim()) {
        throw new ApiError(400, "Tweet content is required");
    }

    if (!userId?.trim()) {
        throw new ApiError(400, "User ID is required");
    }
    
    const user = await User.findById(userId);
    if (!user?.trim()) {
        throw new ApiError(404, "User not found");
    }

    const newTweet = await Tweet.create({
        content: content,
        postedBy: userId,
    });
    if (!newTweet?.trim()) {
        throw new ApiError(500, "Failed to create tweet");
    }

    return res.status(201).json(
        new ApiResponse(
            true,
            "Tweet created successfully",
            newTweet
        )
    );
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const userId = req.params.userId;

    
    if(!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid User ID");
    }

    const tweets = await Tweet.find({ postedBy: userId }).sort({ createdAt: -1 });

    if (!tweets) {
        throw new ApiError(404, "No tweets found for this user");
    }
    return res.status(200).json(
        new ApiResponse(
            true,
            "User tweets fetched successfully",
            tweets
        )
    );
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet

    const { tweetId } = req.params;

    const { updatedContent } = req.body;

    const userId = req.user._id;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid Tweet ID");
    }

    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }   

    if (tweet.postedBy.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not authorized to update this tweet");
    }


    const updatedTweet = Tweet.findByIdAndUpdate(tweetId, {
        content: updatedContent
    }, { new: true})

    if (!updatedTweet) {
        throw new ApiError(404, "Tweet not found or update failed");
    }

    return res.status(200).json(
        new ApiResponse(
            true,
            "Tweet updated successfully",
            updatedTweet
        )
    );
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet

    const { tweetId } = req.params;
    const userId = req.user._id;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid Tweet ID");
    }
    
    const tweet = await Tweet.findById(tweetId);

    if(!tweet){
        throw new ApiError (404, "Tweet not found");
    } 
    
    if (tweet.postedBy.toString()=== userId.toString()) {
        throw new ApiError(403, "You are not authorized to delete this tweet");
    }


    const finaltweet = await Tweet.findByIdAndDelete(tweetId);

    if (!finaltweet) {
        throw new ApiError(404, "Tweet not found or deletion failed");
    }

    return res.status(200).json(
        new ApiResponse(
            true,
            "Tweet deleted successfully",
            null
        )
    );
    
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}