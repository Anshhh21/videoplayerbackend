import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    const subscriberId = req.user._id

    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid channel ID")
    }

    if(channelId.toString() === req.user._id.toString()){
        throw new ApiError(400, "You cannot subscribe to your own channel")
    }

    const existingSubscription = await Subscription.findOne({
        channel: channelId,
        subscriber: subscriberId
    })

    if(existingSubscription){

        await Subscription.findByIdAndDelete(existingSubscription._id)

        return res.status(200).json(
            new ApiResponse(
                true,
                "Unsubscribed successfully",
                null
            )
        )

}
        else {
            const newSubscription = await Subscription.create({
                channel: channelId,
                subscriber: subscriberId
            })

            return res.status(201).json(
                new ApiResponse(
                    true,
                    "Subscribed successfully",
                    newSubscription
                )
            )
        }

})

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

// controller to return subscriber list of a channel

    if (!channelId?.trim()){
        throw new ApiError(400, "Channel ID is required")
    }

    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid channel ID")
    }

    const subscriptions = await Subscription.find({channel: channelId}).populate('subscriber', 'username email')

    if(!subscriptions || subscriptions.length === 0){
        throw new ApiError (404, "No subscribers found for this channel")
    }

    return res.status(200).json(
        new ApiResponse(
            true,
            "Channel subscribers fetched successfully",
            subscriptions
        )
    )
})

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
// controller to return channel list to which user has subscribed

    if(!subscriberId?.trim()){
        throw new ApiError(400, "SubscriberId is Invalid")
    }

    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400, "SubscriberId is Invalid")
    }

    const subscribedChannels = await Subscription.find({
        subscriber: subscriberId,

    }).populate("channel", "username email")

    if (!subscribedChannels || subscribedChannels.length === 0){
        throw new ApiError(404, "No subscribed channels found for this user")
    }

    return res.status(200).json(
        new ApiResponse(
            true,
            "Subscribed channels fetched successfully",
            subscribedChannels
        )
    )
}
)

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}