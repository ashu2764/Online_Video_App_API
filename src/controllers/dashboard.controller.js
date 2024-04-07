import mongoose from "mongoose";
import { Video } from "../models/videos.models.js";
import { Subscription } from "../models/subscripition.models.js";
import { Like } from "../models/like.models.js";
import { Tweet } from "../models/tweet.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const totalViews = await Video.aggregate([
        {
            $match: {
                owner: req.user?._id,
                isPublished: true,
            },
        },
        {
            $group: {
                _id: null,
                totalViews: { $sum: "$views" },
            },
        },
        {
            $project: {
                _id: 1,
                totalViews: 1,
            },
        },
    ]);

    if (!totalViews) {
        throw new ApiError(404, "Something went wrong in total Views");
    }
    const totalSubscribers = await Subscription.aggregate([
        {
            $match: {
                chennel: req.user?._id,
            },
        },
        {
            $group: {
                _id: null,
                totalSubs: { $sum: 1 },
            },
        },
        {
            $project: {
                totalSubs: 1,
            },
        },
    ]);
    if (!totalSubscribers) {
        throw new ApiError(404, "Something went wrong in totalsubscribers");
    }

    const totalVideos = await Video.aggregate([
        {
            $match: {
                owner: req.user?._id,
                isPublished: true,
            },
        },
        {
            $group: {
                _id: null,
                totalVideos: { $sum: 1 },
            },
        },
        {
            $project: {
                totalVideos: 1,
            },
        },
    ]);
    if (!totalVideos) {
        throw new ApiError(400, "Cant get total Videos");
    }

    const totalLikes = await Video.aggregate([
        {
            $match: {
                owner: req.user?._id,
                isPublished: true,
            },
        },
        {
            $lookup: {
                from: "Like",
                localField: "_id",
                foreignField: "video",
                as: "videoLikes",
            },
        },
        {
            $unwind: "$videoLikes",
        },
        {
            $group: {
                _id: null,
                likes: { $sum: 1 },
            },
        },
        {
            $project: {
                likes: 1,
            },
        },
    ]);

    if (!totalLikes) {
        throw new ApiError(404, "Something went wrong in total likes");
    }

    const totalTweet = await Tweet.aggregate([
        {
            $match: {
                owner: req.user?._id,
            },
        },
        {
            $group: {
                _id: null,
                twwwts: { $sum: 1 },
            },
        },
        {
            $project: {
                tweet: 1,
            },
        },
    ]);

    if (!totalTweet) {
        throw new ApiError(404, "Something went wrong in total tweet");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                totalLikes,
                totalVideos,
                totalSubscribers,
                totalTweet,
                totalViews,
            },
            "Sucessfull got the status"
        )
    );
});

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    try {
        const aggregate = [
            {
                $match: {
                    owner: req.user?._id,
                    isPublished: true,
                },
            },
        ];

        const videoList = await Video.aggregate(aggregate);

        if (!videoList || videoList.length === 0) {
            throw new ApiError(400, "Cant load video Play List");
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, videoList, "Successfully got the videos")
            );
    } catch (error) {
        throw new ApiError(404, "Something wrong in getting channel videos ");
    }
});

export { getChannelStats, getChannelVideos };
