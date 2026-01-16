import {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video

    const userId = req.user._id

    if(!videoId?.trim()){
        throw new ApiError(400, "videoId is Invalid")
    }

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "videoId is Invalid")
    }

    const existingLike = await Like.find({
        videoId: videoId,
        likedBy: userId
    })

    if(existingLike){
        await Like.findByIdAndDelete(existingLike._id)

        return res.status(200).json(
            new ApiResponse(
                true,
                existingLike,
                "like removed successfully"
            )
        )
    }
    else {
        const likeVideo = await Like.create({
            videoId: videoId,
            likedBy: userId
        })

        return res.status(201).json(
            new ApiResponse(
                true,
                likeVideo,
                "Video liked successfully"
            )
        )
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    const userId = req.user._id

    if(!commentId?.trim()){
        throw new ApiError(400, "commentId is Invalid")
    }

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "commentId is Invalid")
    }

    const existingLike = await Like.find({
        commentId: commentId,
        likedBy: userId
    })

    if(existingLike){
        await Like.findByIdAndDelete(existingLike._id)

        return res.status(200).json(
            new ApiResponse(
                true,
                existingLike,
                "like removed successfully on comment"
            )
        )
    }
    else {
        const likeComment = await Like.create({
            commentId: commentId,
            likedBy: userId
        })

        return res.status(201).json(
            new ApiResponse(
                true,
                likeComment,
                "comment liked successfully"
            )
        )
    }
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet

    if(!tweetId?.trim()){
        throw new ApiError(400, "tweetId is Invalid")
    }

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "tweetId is Invalid")
    }

    const userId = req.user._id

    const existingLike = await Like.find({
        tweetId: tweetId,
        likedBy: userId
    })

    if(existingLike){
        await Like.findByIdAndDelete(existingLike._id)

        return res.status(200).json(
            new ApiResponse(
                true,
                existingLike,
                "like removed successfully on tweet"
            )
        )
    }
    else {
        const likeTweet = await Like.create({
            tweetId: tweetId,
            likedBy: userId
        })

        return res.status(201).json(
            new ApiResponse(
                true,
                likeTweet,
                "tweet liked successfully"
            )
        )
}
})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos

    const userId = req.user._id

    const likedVideos = await Like.find({
        likedBy: userId,
        videoId: { $ne: null }
    }).populate('videoId')

    return res.status(200).json(
        new ApiResponse(
            true,
            likedVideos,
            "liked videos fetched successfully"
        )
    )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}