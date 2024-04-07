import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = page * 10 - limit;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Video id is not valid");
    }

    const pipeline = [
        {
            $match: {
                owner: videoId,
            },
        },
        {
            $skip: skip,
        },
        {
            $limit: limit,
        },
    ];

    const getComments = await Comment.aggregate(pipeline);

    if (!getComments) {
        throw new ApiError(400, "Comments not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, getComments, "Successfully got the comments")
        );
});

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { videoId } = req.params;
    const { userId, content } = req.body;

    if (!(isValidObjectId(videoId) && isValidObjectId(userId) && content)) {
        throw new ApiError(400, "Video id , user id and content is required");
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: userId,
    });

    if (!comment) {
        throw new ApiError(400, "Comments not created");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, comment, "Successfully created the comment")
        );
});

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "comment id is not valid");
    }

    const { content } = req.body;
    if (!content) {
        throw new ApiError(400, "Content not found");
    }

    const updatingComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            content,
        },
        {
            new: true,
        }
    );

    if (!updatingComment) {
        throw new ApiError(400, "comment is not updated");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updateComment,
                "Successfully updated the comment"
            )
        );
});

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params;
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Comment id is invalid");
    }
    const deletingComment = await Comment.findByIdAndDelete(commentId, {
        new: true,
    });

    if (!deletingComment) {
        throw new ApiError(400, "Comment is not deleted");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "Comment is successfully deleted"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
