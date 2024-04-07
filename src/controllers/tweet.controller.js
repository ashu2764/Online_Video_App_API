import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet

    const { tweetContent } = req.body;

    if (!tweetContent) {
        throw new ApiError(400, "Tweet content is required");
    }

    const tweetCreated = await Tweet.create({
        owner: req.user?._id,
        content: tweetContent,
    });

    if (!tweetCreated) {
        throw new ApiError(200, "Somenthin went wrong while creating a Tweet");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, tweetCreated, "Tweet created succesfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const { userId } = req.params;

    if (!userId) {
        throw new ApiError(400, "Did not get the userTweet");
    }
    const userTweet = await User.findById(userId);

    if (
        !userTweet ||
        !(userTweet.owner.toString() == req.user._id.toString())
    ) {
        throw new ApiError(400, "User does not found");
    }

    const tweet = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
            },
        },
        {
            $project: {
                content: 1,
            },
        },
    ]);

    if (!tweet) {
        throw new ApiError(400, "User Tweet does not existes");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, tweet, "User Tweet fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params;
    const { tweetData } = req.body;

    if (!(tweetData && tweetId)) {
        throw new ApiError(400, "Tweed Id and content not found");
    }

    const tweetFound = await Tweet.findById(tweetId);

    if (!tweetFound) {
        throw new ApiError(400, "Tweet does not found");
    }

    if (!(tweetFound.owner.toString() === req.user?._id.toString())) {
        throw new ApiError(400, "User is not logined by same id ");
    }
    try {
        const updatedTweet = await Tweet.findByIdAndUpdate(
            tweetId,
            {
                $set: {
                    content: tweetData,
                },
            },
            { new: true }
        );

        if (!updatedTweet) {
            throw new ApiError(400, "Problem in updation tweet");
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, updatedTweet, "Tweet updated Successfully")
            );
    } catch (error) {
        throw new ApiError(400, error.message || "Can not update the Tweet");
    }
});

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params;

    if (!tweetId) {
        throw new ApiError(400, "Does not found tweet id");
    }

    const tweetFound = await Tweet.findById(tweetId);
    if (!tweetFound) {
        throw new ApiError(400, "User tweet does not existed");
    }
    if (!(tweetFound.owner.toString() === req.user?._id.toString())) {
        throw new ApiError(400, "User should be logged in");
    }

    try {
        const tweetDeleted = await Tweet.findByIdAndDelete(
            { _id: tweetId },
            { new: true }
        );
        if (!tweetDeleted) {
            throw new ApiError(
                400,
                "There is problem while deleting the tweet"
            );
        }

        return res
            .status(200)
            .json(new ApiResponse(200, "Tweet deleted Successfully"));
    } catch (error) {
        throw new ApiError(400, error.message || "Tweet can not be deleted");
    }
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
