import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination


    
    if (!req.user) {
        throw new ApiError(401, "User needs to be logged in");
    }
    
    
    const match = {
        ...(query ? { title: { $regex: query, $options: "i" } } : {}), 
        ...(userId ? { owner: mongoose.Types.ObjectId(userId) } : {}), 
    };
    
    const videos = await Video.aggregate([
        {
        $match: match,
        },
    
        {
        $lookup: {
            from: "users",
            localField: "owner", 
            foreignField: "_id",
            as: "videosByOwner", 
        },
        },
    
        {
        
        $project: {
            videoFile: 1, 
            thumbnail: 1, 
            title: 1, 
            description: 1, 
            duration: 1, 
            views: 1, 
            isPublished: 1, 
            owner: {
            $arrayElemAt: ["$videosByOwner", 0], 
            },
        },
        },
    
        {
        
        $sort: {
            [sortBy]: sortType === "desc" ? -1 : 1,
        },
        },
    
        {
        
          $skip: (page - 1) * parseInt(limit),
        },
        {
            
            $limit: parseInt(limit),
        },
        ]);

        
        if (!videos?.length) {
        throw new ApiError(404, "Videos are not found");
        }

        
        return res
        .status(200)
        .json(
            new ApiResponse(
                200, 
                videos, 
                "Videos fetched successfully"
            )
        );

        

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    if (!title?.trim() || !description?.trim()) {
        throw new ApiError(400, "Title and description are required")
    }

    const videoLocalPath = req.file?.path;

    if (!videoLocalPath) {
        throw new ApiError(400, "video file is required");
    }

    const video = await uploadOnCloudinary(videoLocalPath);

    if (!video.url) {
        throw new ApiError(500, "Avatar upload failed");
    }

    const thumbnailLocalPath = req.file?.path;

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "thumbnail file is required");
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!thumbnail.url) {
        throw new ApiError(500, "thumbnail upload failed");
    }

    const newVideo = await Video.create({
        title: title,
        description: description,
        videoUrl: video.url,
        thumbnailUrl: thumbnail.url,
        uploadedBy: req.user._id,
        duration: video.duration,
        views: 0,
        isUploaded: true
    })

    return res.status(201).json(
        new ApiResponse(
        true,
        newVideo,
        "video added successfully"
    ))

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    if (!videoId?.trim()){
        throw new ApiError(400, "videoId is required")
    }

    const findVideo = await Video.findById(videoId)

    if (!findVideo){
        throw new ApiError (404, "video not found")
    }

    return res.status(200).json(
        new ApiResponse(
            true,
            findVideo,
            "video fetched successfully"
        )
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

    if (!videoId?.trim()){
        throw new ApiError(400, "videoId is required")
    }

    const videoToUpdate = await Video.findById(videoId)

    if (!videoToUpdate){
        throw new ApiError (404, "video not found")
    }

    const thumbnailLocalPath = req.file?.path;

    if (!thumbnailLocalPath?.trim()) {
    throw new ApiError(400, "thumbnail file is required");
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!thumbnail.url) {
        throw new ApiError(500, "thumbnail upload failed");
    }

    const { title, description } = req.body

    const updatedVideoDetails = await Video.findByIdAndUpdate(videoId, {
        $set: {
            title,
            description,
            thumbnailUrl: thumbnail.url
        }
    },
    { new: true}
    )
    .select("-views -duration -videoUrl -uploadedBy ")

    return res.status(200).json(
        new ApiResponse(
            true,
            updatedVideoDetails,
            "video updated successfully"
        )
    )
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    if (!videoId?.trim()){
        throw new ApiError(400, "videoId is required")
    }

    const video = await Video.findByIdAndDelete(videoId);

    if (!video) {
    throw new ApiError(404, "Video not found");
    }

    return res.status(200).json(
        new ApiResponse(
            true,
            null,
            "video deleted successfully"
        )
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!videoId?.trim()){
        throw new ApiError(400, "videoId is required")
    }

    const video = await Video.findByIdAndUpdate(videoId,{
        $set: {
            isPublished: !video.isPublished
        }
    }, { new: true}
    )
    if (!video) {
        throw new ApiError(404, "Video not found");
    }


    return res.status(200).json(
        new ApiResponse(
            true,
            video,
            "video publish status toggled successfully"
        )
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}