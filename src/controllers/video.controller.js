import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/videos.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
    //TODO: get all videos based on query, sort, pagination

    //check if userId is provided, if not throw an error
    if (!userId) {
        throw new ApiError(400, "UserId is required");
    }

    //initilize aggeregation pipeline

    const pipeline = [];

    // check is userId is provided and find the user by userId

    if (userId) {
        await User.findById(userId);
        //Add $match stage to filter by owner (userId)
        pipeline.push({
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
            },
        });
    }

    //check if query paramr=eter is provide

    if (query) {
        //Add $match stage to filter by query criteria (eg, isPublished :fslse)
        pipeline.push({
            $match: {
                isPublished: false,
            },
        });
    }

    //initililze sorting field onbject

    let sortField = {};

    //check if sortBy and sortType parameters are provided for sorting

    if (sortBy && sortType) {
        //create sorting filed based on sortBy and sort Type  parameterrs
        sortField[sortBy] = sortType === "asc" ? 1 : -1;

        // Add $sort stage to sort the documents

        pipeline.push({
            $sort: sortField,
        });
    } else {
        //Default sorting by createdAt field in desending order

        sortField["createdAt"] = -1;

        //add $sort stage to sort the documents
        pipeline.push({
            $sort: sortField,
        });
    }

    //add $skip stage to skip documents based on pegination

    pipeline.push({
        $skip: (page - 1) * limit,
    });

    //add $limit stage to limit the number of documents returnd

    pipeline.push({
        $limit: limit,
    });
    console.log(pipeline); // log the aggeration pipe line for debgging

    //Perform aggeration using the  Video model and the constructed pipeline

    const allVideos = await Video.aggregate(pipeline);

    //check if aggeration result is empty and throw an error

    if (!allVideos) {
        throw new ApiError(400, "pipeline aggregation problem ");
    }

    //Send the response with the aggregate videso and a success message

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                allVideos,
                `Total videos : ${allVideos.length}`
            )
        );
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    if (!isValidObjectId(req.user._id)) {
        throw new ApiError(400, "Invalid User .");
    }
    // TODO: get video, upload to cloudinary, create video
    if (!title && !description) {
        throw new ApiError(400, "tittle and desription is required");
    }
    const videoFileLocalPath = req.files?.videoFile[0]?.path;

    if (!videoFileLocalPath) {
        throw new ApiError(400, "Video file is required");
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath);

    if (!videoFile) {
        throw new ApiError(404, "video file is not found");
    }

    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "thumbnail is required");
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!thumbnail) {
        throw new ApiError(404, "thumbnail is not found");
    }
    const owner = await User.findById(req.user._id);

    const video = await Video.create({
        title,
        description,
        thumbnail: thumbnail.url,
        videoFile: videoFile.url,
        duration: videoFile.duration,
        owner: new mongoose.Types.ObjectId(req.user?._id),
        views: 0,
        isPublished: false,
    });
    const publishedVideo = await Video.findById(video._id);

    if (!publishedVideo) {
        throw new ApiError(500, "Something went wrong while uploading video");
    }

    return res
        .status(201)
        .json(
            new ApiResponse(
                200,
                publishedVideo,
                "video is published succesfully"
            )
        );
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: get video by id
    const userVideo = await Video.findById(videoId);
    console.log(userVideo?.owner.toString());
    console.log(req.user?._id.toString());

    if (
        !userVideo ||
        (!userVideo.isPublished && !userVideo.owner === req.user._id)
    ) {
        throw new ApiError(400, "Video does not exists ");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, userVideo, "Video Fetched Successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: update video details like title, description, thumbnail

    const video = await Video.findById(videoId);

    if (!video || !(userVideo.owner.toString() === req.user._id.toString())) {
        throw new ApiError(400, "Cant find the video");
    }
    const { title, description } = req.body;

    const thumbnail = await req.file?.path;

    if (!(title && description)) {
        throw new ApiError(
            400,
            "Tittle and description is required for updation"
        );
    }

    if (!thumbnail) {
        throw new ApiError(400, "For update thumbnail is required");
    }

    const updatedThumbnail = await uploadOnCloudinary(thumbnail);

    await deleteOnCloudinary(video.thumbnail);

    const newVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title: title,
                description: description,
                thumbnail: updatedThumbnail?.url,
            },
        },
        {
            new: true,
        }
    );

    return res
        .status(200)
        .json(new ApiResponse(200, newVideo, "Video Updated Successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: delete video
    if (!videoId) {
        throw new ApiError(400, "Can not find the video");
    }
    const deleteVideo = await Video.findById(videoId);

    if (
        !deleteVideo ||
        !(deleteVideo.owner.toString() === req.user._id.toString())
    ) {
        throw new ApiError(400, "Can not find the video to delete");
    }

    await deleteOnCloudinary(deleteVideo.videoFile);

    await Video.findByIdAndDelete(videoId);

    return res
        .status(200)
        .json(new ApiResponse(200, "Video Deleted Successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!videoId) {
        throw new ApiError(400, "Video id is not accessable");
    }
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(400, "Video does not exists");
    }

    if(!video.owner == req.user?._id){
        throw new ApiError(400,"Not allowed to toogle")
    }

    video.isPublished = ! Video.isPublished
    await video.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            video.isPublished,
            "Check published or not "
        )
    )
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
};
