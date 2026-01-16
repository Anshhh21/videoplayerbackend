import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {

    //TODO: get all comments for a video

    const {videoId} = req.params

    const {page = 1, limit = 10} = req.query

    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, 'Invalid video ID')
    }

    const videoObjectId = mongoose.Types.ObjectId(videoId) 

    const comments = await Comment.aggregate([
        { $match: { videoId: videoObjectId } },
        
        {
            $lookup: {
                from: 'videos',
                localField: 'video',
                foreignField: '_id',
                as: 'commentOnWhichVideo'
            }
        },
        {
        $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "OwnerOfComment",
          }
        },
        {
            $project: {
                _id: 1,
                content: 1,
                createdAt: 1,
                updatedAt: 1,
                'user._id': 1,
                'user.username': 1,
                'user.avatarUrl': 1
            }
        },
        {
        $skip: (page - 1) * parseInt(limit),
        },

        {
        $limit: parseInt(limit),
        },
        ]);
    
    res.status(200).json(new ApiResponse(true, 'Comments fetched successfully', comments))
    
    
    

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params
    const{content} = req.body
    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, 'Invalid video ID')
    }

    if(!req.user){
        throw new ApiError(401, 'Unauthorized')
    }

    if(!content || content.trim() === '') {
        throw new ApiError(400, 'Comment content cannot be empty')
    }


    const addedComment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id
})

    if(!addedComment) {
        throw new ApiError(500, 'Failed to add comment')
    }

    res.status(201).json(
        new ApiResponse(
            true, 
            'Comment added successfully', 
            addedComment
        )
    )

})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params
    const {content} = req.body

    if(!isValidObjectId(commentId)) {
        throw new ApiError(400, 'Invalid comment ID')
    }

    if(!req.user) {
        throw new ApiError(401, 'Unauthorized')
    }

    if(!content || content.trim() === '') {
        throw new ApiError(400, 'Comment content cannot be empty')
    }

    const updatedComment = await Comment.findOneAndUpdate(
        {
            _id: commentId,
            owner: req.user._id
        },
        {
            content
        },
        {
            new: true
        }
    )
    if(!updatedComment) {
        throw new ApiError(404, 'Comment not found or you are not the owner')
    }

    res.status(200).json(
        new ApiResponse(
            true,
            'Comment updated successfully',
            updatedComment
        )
    )

})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment

    const {commentId} = req.params
    if(!isValidObjectId(commentId)) {
        throw new ApiError(400, 'Invalid comment ID')
    }
    if(!req.user) {
        throw new ApiError(401, 'Unauthorized')
    }
    const deletedComment = await Comment.findOneAndDelete({
        _id: commentId,
        owner: req.user._id
    })
    if(!deletedComment) {
        throw new ApiError(404, 'Comment not found or you are not the owner')
    }
    res.status(200).json(
        new ApiResponse(
            true,
            'Comment deleted successfully',
            deletedComment
        )
    )
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
    }