import mongoose, { isValidObjectId } from "mongoose"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/video.models.js"
import { Comment } from "../models/comment.models.js"
import { Tweet } from "../models/tweet.models.js"
import { Like } from "../models/like.models.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    const likeConditions = { video: videoId, likedBy: req.user?._id };
    const alreadyLiked = await Like.findOne(likeConditions);

    if (alreadyLiked) {
        await Like.findByIdAndDelete(alreadyLiked._id);
        return res.status(200).json(new ApiResponse(200, { isLiked: false }, "Like removed successfully"));
    } else {
        await Like.create(likeConditions);
        return res.status(200).json(new ApiResponse(200, { isLiked: true }, "Like added successfully"));
    }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid commentId");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    const likeConditions = { comment: commentId, likedBy: req.user?._id };
    const alreadyLiked = await Like.findOne(likeConditions);

    if (alreadyLiked) {
        await Like.findByIdAndDelete(alreadyLiked._id);
        return res.status(200).json(new ApiResponse(200, { isLiked: false }, "Like removed successfully"));
    } else {
        await Like.create(likeConditions);
        return res.status(200).json(new ApiResponse(200, { isLiked: true }, "Like added successfully"));
    }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweetId");
    }

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    const likeConditions = { tweet: tweetId, likedBy: req.user?._id };
    const alreadyLiked = await Like.findOne(likeConditions);

    if (alreadyLiked) {
        await Like.findByIdAndDelete(alreadyLiked._id);
        return res.status(200).json(new ApiResponse(200, { isLiked: false }, "Like removed successfully"));
    } else {
        await Like.create(likeConditions);
        return res.status(200).json(new ApiResponse(200, { isLiked: true }, "Like added successfully"));
    }
});

const getLikedVideos = asyncHandler(async (req, res) => {
    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user?._id),
                video: { $exists: true }
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "ownerDetails"
                        }
                    },
                    {
                        $unwind: "$ownerDetails"
                    }
                ]
            }
        },
        {
            $unwind: "$videoDetails"
        },
        {
            $replaceRoot: { newRoot: "$videoDetails" }
        },
        {
            $project: {
                _id: 1,
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                duration: 1,
                views: 1,
                isPublished: 1,
                "ownerDetails.username": 1,
                "ownerDetails.avatar": 1,
            }
        }
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, likedVideos, "Liked videos fetched successfully"));
});

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}