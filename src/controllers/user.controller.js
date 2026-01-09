import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary  } from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Token generation failed")
    }
}
const registerUser = asyncHandler(async (req, res) => {
// get user details from frontend
    const {fullName, email, username, password}=req.body

    // this is to test: console.log("email:", email);

// validation - not empty

    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }
    
// check if user already exists: username, email

    const existedUser = await User.findOne({
        $or: [{ username },{ email }]
    })
        if(existedUser){
            throw new ApiError(409, "user with username or email aready exist")
        }
// check for images, check for avatar    
    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }
// upload them to cloudinary, avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }
// create user object - create entry in db
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })
    // remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
// check for user creation
    if(!createdUser){
        throw new ApiError (500, "user creation failed")
    }
// return res
    return res.status(201).json(
        new ApiResponse(
            200,
            createdUser,
            "User registered successfully"
        )
    )

})
const loginUser = asyncHandler(async (req, res) => {
// req body -> data

    const { email,username, password } = req.body;

// username/email 

    if ( !email && !username) {
        throw new ApiError(400, "Username/email are required");
    } 
    if (!password) {
        throw new ApiError(400, "Password is required");
    }

// find the user

    const user = await User.findOne({
        $or: [{ username }, { email }]
    });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

// password check

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid password");
    }
    
// access and refresh token

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true,

    };

//send cookie 

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            { user: loggedInUser,accessToken, refreshToken }, 
            "User logged in successfully"
        )
    )

})

const logoutUser = asyncHandler(async (req, res) => {
    // Clear the accessToken and refreshToken cookies
    User.findByIdAndUpdate(req.user._id, 
        { $set:
            {
            refreshToken: undefined
            } 
        }, { 
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true,

    };

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(
            200,
            null,
            "User logged out successfully"
        )
    )
});

const refreshAccessToken = asyncHandler(async (req, res) => {

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token unauthorized");
    }
    try {
    const decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET,
    );

    const user = await User.findById(decodedToken?._id)

    if (!user ) {
        throw new ApiError(401, "Invalid refresh token");
    }
    if (incomingRefreshToken !== user?.refreshToken) {
        throw new ApiError(401, "Refresh token mismatch. Unauthorized");
    }

    const options = {
        httpOnly: true,
        secure: true,
    }

    const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)

    return res 
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
        new ApiResponse(
            200,
            { accessToken, refreshToken : newRefreshToken },
            "Access token refreshed successfully"
        )
    )
    } catch (error) {
        throw new ApiError(401,error?.message ||"Invalid refresh token");
    }
})

export { registerUser, loginUser, logoutUser, refreshAccessToken }; 
