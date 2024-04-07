import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.models.js";
import { Video } from "../models/videos.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    if (!(name || description)) {
        throw new ApiError(404, "Name or description ot found");
    }

    //TODO: create playlist

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user?._id,
    });
    if (!playlist) {
        throw new ApiError(
            404,
            "Somenthin went wrong while creating the playlsit"
        );
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Successfully got the playlist"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    //TODO: get user playlists

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "User id is not valid ");
    }

    const pipeline = [
        {
            $match: {
                owner: userId,
            },
        },
    ];

    const userPlayList = await Playlist.aggregate(pipeline);

    if (!userPlayList) {
        throw new ApiError(404, "no playlist found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                userPlayList,
                "User playList fatched successfully"
            )
        );
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    //TODO: get playlist by id
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Playlist id not a valid objects");
    }

    const playList = await Playlist.findById(playlistId);

    if (!playList) {
        throw new ApiError(401, "Playlist not found");
    }
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                playList,
                "Succeessfully fetched the playList by Id"
            )
        );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    if (!(isValidObjectId(videoId) || isValidObjectId(playlistId))) {
        throw new ApiError(400, "Video or playList id is not valid");
    }

    const playList = await Playlist.findById(playlistId);
    if (!playList) {
        throw new ApiError(402, "Playlist is not founded");
    }

    const video = await Video.findById(videoId);
    if (!(video || video.isPublished)) {
        throw new ApiError(400, "Video not founded");
    }

    playList.video.push(videoId);

    const updatedPlaylist = await playList.svae();
    if (!updatePlaylist) {
        throw new ApiError(400, "Playlist vnot upload");
    }
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatePlaylist,
                "Succesfully added video on the playlsit"
            )
        );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    // TODO: remove video from playlist
    if (!isValidObjectId(videoId) || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Video or playlist id is not valid");
    }

    const playlist = await Playlist.findById(playlist);
    if (!playlist) {
        throw new ApiError(404, "Playlsit not found");
    }

    const video = Video.findById(videoId);
    if (!video || !video.isPublished) {
        throw new ApiError(400, "Video not found");
    }

    playlist.video.pull(videoId);
    const updatedPlaylist = await playlist.save();

    if (!updatedPlaylist) {
        throw new ApiError(400, "Playlist not updated");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatePlaylist, "Successfully remove video")
        );
});

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    // TODO: delete playlist
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "PlayList id is not valid");
    }
    const playListDelete = await Playlist.findByIdAndDelete(playlistId);

    if (!playListDelete) {
        throw new ApiError(400, "PlayList does not deletes");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "Playlist is successfully deleted"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;
    //TODO: update playlist

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "PlayList id is not valid");
    }

    if (!(name || description)) {
        throw new ApiError(400, "Name or description not found");
    }

    const updatePlayListDetails = await Playlist.findByIdAndDelete(
        playlistId,
        {
            $set: {
                name,
                description,
            },
        },
        {
            new: true,
        }
    );
    if (!updatePlayListDetails) {
        throw new ApiError(400, "Playlsit details are not updated");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatePlayListDetails,
                "PlayList is sucessfully updated"
            )
        );
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
};
