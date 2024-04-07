import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.models.js";
import { Subscription } from "../models/subscription.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    // TODO: toggle subscription
    if (!channelId) {
        throw new ApiError(400, "Not found channel Id");
    }
    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError(404, "Channel does not exists");
    }

    const user = await User.findById(req.user?._id);

    if (!user) {
        throw new ApiError(404, "User does not found");
    }

    const subscriber = await Subscription.find({
        subscriber: isValidObjectId(req.user?._id),
        channel: isValidObjectId(channelId),
    });

    let toggle;
    if (!subscriber) {
        toggle = await Subscription.create({
            subscriber: req.user._idid,
            channel: channelId,
        });
        if (!toggle) {
            throw new ApiError(404, "Something wentwrong on toggle");
        }
    } else {
        toggle = await Subscription.findByIdAndDelete(subscriber._id);
    }

    return res
        .status(200)
        .json(new ApiResponse(200, toggle, "Successfully toggles the state"));
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    if (!channelId) {
        throw new ApiError(404, "Channel not found");
    }
    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError(404, "Channel does not exists");
    }

    const aggregate = [
        {
            $match: {
                channel: channelId,
            },
        },
        {
            $group: {
                _id: null,
                totalCount: { $sum: 1 }, // count the number of documents
            },
        },
    ];

    const subscriberList = await Subscription.aggregate(aggregate);

    if (!subscriberList || subscriberList.length === 0) {
        throw new ApiError(404, "Sunscribers not found");
    }
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                subscriberList,
                "Successfully fetched subscribers"
            )
        );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;
    if (!subscriberId) {
        throw new ApiError(400, "Not Found subscriber id");
    }

    const user = await User.findById(subscriberId);

    if (!user) {
        throw new ApiError(404, "Channel does not exists");
    }

    const aggregate = [
        {
            $match: {
                subscriber: subscriberId,
            },
        },
        {
            $group: {
                _id: null,
                totalCount: { $sum: 1 },
            },
        },
    ];
    const subscribedList = await Subscription.aggregate(aggregate);
    if (!subscribedList || subscribedList.length === 0) {
        throw new ApiError(404, "Subscribers not found");
    }
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                subscribedList,
                "successfully fetched subscribes"
            )
        );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
