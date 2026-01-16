import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

    const userId = req.user.id

    const totalVideos = await Video.countDocuments({ uploadedBy: userId })

    if(totalVideos === 0) {
        throw new ApiError(404, 'No videos found for this channel')
    }

    const totalSubscribers = await Subscription.countDocuments({ channel: userId })

    if(totalSubscribers === 0) {
        throw new ApiError(404, 'No subscribers found for this channel')
    }

    const totalVideoLikes = await Like.countDocuments({ 
        video: { $in: await Video.find({ uploadedBy: userId }).distinct('_id') } 
    })
    if(totalVideoLikes === 0) {
        throw new ApiError(404, 'No likes found for this channel')
    }

    const totalTweetLikes = await Like.countDocuments({
        tweet: { 
            $in: await Tweet.find({ postedBy: userId }).distinct('_id')
        } 
    })

    if(totalTweetLikes === 0) {
        throw new ApiError(404, 'No tweet likes found for this channel')
    }

    const totalCommentLikes = await Like.countDocuments({ 
        comment: { 
            $in: await Comment.find({ postedBy: userId }).distinct('_id')
        } 
    })

    if(totalCommentLikes === 0) {
        throw new ApiError(404, 'No comment likes found for this channel')
    }

    const totalViews = await Video.aggregate([
        { $match: { uploadedBy: mongoose.Types.ObjectId(userId) } },
        { $group: { _id: null, totalViews: { $sum: "$views" } } }
    ])

    if(totalViews.length === 0 || totalViews[0].totalViews === 0) {
        throw new ApiError(404, 'No views found for this channel')
    }

    res.status(200).json(new ApiResponse(true, 'Channel stats fetched successfully', {
        totalVideos,
        totalSubscribers,
        totalVideoLikes,
        totalTweetLikes,
        totalCommentLikes,
        totalViews: totalViews[0]?.totalViews || 0
    }))
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel

    const userId = req.user.id

    const videos = await Video.find({ uploadedBy: userId }).sort({ createdAt: -1 })

    if(videos.length === 0) {
        throw new ApiError(404, 'No videos found for this channel')
    }

    res.status(200).json(
        new ApiResponse(
            true, 
            'Channel videos fetched successfully', 
            videos
        )
    )
})

export {
    getChannelStats, 
    getChannelVideos
    }