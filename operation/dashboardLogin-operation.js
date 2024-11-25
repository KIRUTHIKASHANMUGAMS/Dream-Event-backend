const dashboardLogin = require('../model/dashboardLogin-model');
const statusCode = require("../utlis/statusCode");
const constant = require("../utlis/constant");
const { generateAccessToken, generateRefreshToken } = require("../middleware/jwtUtils");
const { ObjectId } = require('mongoose').Types;
const jwt = require('jsonwebtoken'); 

exports.dashboardLogin = async (req, res) => {
  try {
    // Validate input
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(statusCode.BAD_REQUEST).json({
        status: statusCode.BAD_REQUEST,
        message: constant.INVALID_CREDENTIALS,
      });
    }


    const user = await dashboardLogin.findOne({ email });
    if (!user) {
      return res.status(statusCode.NOT_FOUND).json({
        status: statusCode.NOT_FOUND,
        message: "hello",
      });
    }



    const isPasswordValid = user.password === password; 
    if (!isPasswordValid) {
      return res.status(statusCode.UNAUTHORIZED).json({
        status: statusCode.UNAUTHORIZED,
        message: constant.INVALID_CREDENTIALS,
      });
    }


    const access = generateAccessToken({ id: new ObjectId(user._id) , email: user.email });
    const refresh = generateRefreshToken({ id: new ObjectId(user._id )});
    user.accessToken = access;
    user.refreshToken = refresh; 
    await user.save(); 


    return res.status(statusCode.OK).json({
      status: statusCode.OK,
      message:constant.DATA_CREATED,
      data: {
        accessToken: access,
        refreshToken: refresh,
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
        },
      },
    });
  } catch (error) {

    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      status: statusCode.INTERNAL_SERVER_ERROR,
      message: constant.ERR_SERVER || error.message,
    });
  }
};


exports.refreshAccessToken = async (req, res) => {
    try {
      const { refreshToken } = req.body;
  
      if (!refreshToken) {
        return res.status(statusCode.BAD_REQUEST).json({
          status: statusCode.BAD_REQUEST,
          message: "Refresh token is required",
        });
      }
      // Verify the refresh token
      jwt.verify(refreshToken, process.env.JWT_SECRET, async (err, user) => {
        if (err) {
          return res.status(statusCode.UNAUTHORIZED).json({
            status: statusCode.UNAUTHORIZED,
            message:err.message,
          });
        }

        // Optionally, you can check if the user still exists in the database
        const existingUser = await dashboardLogin.findById(user.id);
        if (!existingUser) {
          return res.status(statusCode.NOT_FOUND).json({
            status: statusCode.NOT_FOUND,
            message: "User not found",
          });
        }






  
        // Generate a new access token
        const accessToken = generateAccessToken({ id: existingUser._id, email: existingUser.email });
        const refreshToken = generateRefreshToken({ id: existingUser._id });


        existingUser.accessToken = accessToken; // Ensure your model has this field
        existingUser.refreshToken = refreshToken; // Ensure your model has this field
        await existingUser.save();
  
  
        return res.status(statusCode.OK).json({
          status: statusCode.OK,
          message: "Access token refreshed successfully",
          data: {
            accessToken,
            refreshToken
          },
        });
      });
    } catch (error) {
      return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
        status: statusCode.INTERNAL_SERVER_ERROR,
        message: error.message || "Internal Server Error",
      });
    }
  };