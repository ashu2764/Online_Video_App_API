import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.models.js";
import { Video } from "../models/videos.models.js";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: toggle like on video
    try {
        if (!isValidObjectId(videoId)) {
            throw new ApiError(400, "Video id is not valid");
        }
        const video = await Video.findById(videoId);

        if (!video || !video.isPublished) {
            throw new ApiError(
                404,
                "Video not found or video is not published"
            );
        }

        const userAlreadyLiked = await Like.findOne({
            video: videoId,
            likedBy: req.user?._id,
        });

        if (userAlreadyLiked) {
            userAlreadyLiked.remove();
            return res
                .status(200)
                .json(new ApiResponse(200, "Liked removed Successfully"));
        }

        const likeVideo = await Like.create({
            video: videoId,
            likedBy: req.user?._id,
        });
        if (!likeVideo) {
            throw new ApiError(404, "video is unabled to like ");
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, likeVideo, "Successfully liked the video ")
            );
    } catch (error) {
        throw new ApiError(
            400,
            "Video is unable to like ,  something went wrong",
            error
        );
    }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    //TODO: toggle like on comment
    try {
        if (!isValidObjectId(commentId)) {
            throw new ApiError(400, "Comment id is not valid");
        }

        const comment = await Comment.findById(commentId);

        if (!comment) {
            throw new ApiError(400, "Comment not founded");
        }

        const alreadyLiked = await Like.findOne({
            comment: commentId,
            likedBy: req.user?._id,
        });

        if (alreadyLiked) {
            await alreadyLiked.remove();
            return res
                .status(200)
                .json(
                    new ApiResponse(200, "Succefuuly reomved like from comment")
                );
        }

        const likeComment = await Like.create({
            comment: commentId,
            liekdBy: req.user?._id,
        });
        if (!likeComment) {
            throw new ApiError(400, "Error while like a comment");
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    likeComment,
                    "Successfully liked a comment"
                )
            );
    } catch (error) {
        throw new ApiError(
            400,
            "something went wrong while commenting" || error.message
        );
    }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    //TODO: toggle like on tweet
    try {
        if (!isValidObjectId(tweetId)) {
            throw new ApiError(400, "Tweet is not valid");
        }

        const tweet = await Comment.findById(tweetId);

        if (!tweet) {
            throw new ApiError(400, "Tweet not found");
        }

        const alreadyLiked = await Like.findOne({
            tweet: tweetId,
            likedBy: req.user?._id,
        });

        if (alreadyLiked) {
            await alreadyLiked.remove();
            return res
                .status(200)
                .json(new ApiResponse(200, "Successfully removed the like"));
        }

        const likeTweet = await Like.create({
            tweet: tweetId,
            likedBy: req.user?._id,
        });
        if (!likeTweet) {
            throw new ApiError(400, "Somthing went wrong whle like the tweet");
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, likeTweet, "Successfully liked the tweet")
            );
    } catch (error) {
        throw new ApiError(404, error.message || "unable to togglr tweet like");
    }
});

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const aggregate = [
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user?._id),
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "likedVideos",
            },
        },
        {
            $unWind: {
                path: "$likedVideos",
            },
        },
        {
            $project: {
                liekdVideo: 1,
            },
        },
    ];
    const likedVideo = await Like.aggregate(aggregate);

    if (!likedVideo) {
        throw new ApiError(400, "Liked video not found");
    }
    return res
        .status(200)
        .json(
            new ApiResponse(200, likedVideo, "Successfully got the liked video")
        );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
