const dashboardLogin = require('../model/dashboardLogin-model');
const statusCode = require("../utlis/statusCode");
const constant = require("../utlis/constant");
const { generateAccessToken, generateRefreshToken } = require("../middleware/jwtUtils");
const { ObjectId } = require('mongoose').Types;
const jwt = require('jsonwebtoken'); 
const {password}=require('../utlis/password');
const {sendLoginMail}=require("../utlis/mail");
const rolePermissionModel =require("../model/rolePermission-model");
const roleModel=require("../model/role-modal");
const permissionModel=require("../model/permission-model");
const featureModel =require("../model/appFeatures-model")




exports.createDashboardUser = async (req, res) => {
  const { email, roleId, userName } = req.body;

  const user = await dashboardLogin.findOne({ email });


  if (user) {
      return res.status(400).json({
          statusCode: statusCode.BAD_REQUEST,
          message: constant.ERR_USER_ALREADY_EXIST,
      });
  }




  if (!email || !userName || !roleId) {
      return res.status(400).json({
          status: statusCode.BAD_REQUEST,
          message: constant.ERR_FIRST_NAME,
      });
  }

  try {
      const userLogin = new dashboardLogin({
          email,
          userName,
          roleId,
          password: password
      });



      const result = await userLogin.save();
      const context = {
        resetLink: `You requested to login. By using this password and email id ${email} and password: ${password}`
    };
    
      await sendLoginMail(email, context);

      return res.status(200).json({
          status: statusCode.OK,
          message: constant.DATA_CREATED,
   
      });
  } catch (error) {
      console.error("Error creating user:", error);
      return res.status(500).json({
          status: statusCode.INTERNAL_SERVER_ERROR,
          message: constant.ERR_INTERNAL_SERVER_ERROR
      });
  }
};
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
        message: "User not found",
      });
    }

    const rolePermissions = await rolePermissionModel.find({ roleId: new ObjectId(user.roleId) });
    

    if (rolePermissions.length === 0) {
      return res.status(404).json({
        status: statusCode.NOT_FOUND,
        message: "Role not found",
      });
    }
    
    // Access the first element if you're assuming only one role per user
    const rolePermission = rolePermissions[0]; // Assuming one role per user
    
    const data = [{
      roleName: rolePermission.roleName,
      rolePermissions: rolePermission.rolePermissions.map(permission => ({
        featureName: permission.featureName,
        permissions: permission.permissions.map(perm => ({
          permissionName: perm.permissionName,
        })),
      })),
    }];
    
    console.log("Role Permissions Data:", data);
    
    // Continue with the rest of the login logic
    
    

    const isPasswordValid = user.password === password; 
    if (!isPasswordValid) {
      return res.status(statusCode.UNAUTHORIZED).json({
        status: statusCode.UNAUTHORIZED,
        message: constant.INVALID_CREDENTIALS,
      });
    }

   
    const access = generateAccessToken({ id: new ObjectId(user._id), email: user.email, rolePermission:data });
    const refresh = generateRefreshToken({ id: new ObjectId(user._id) });
    user.accessToken = access;
    user.refreshToken = refresh; 
    await user.save(); 

    return res.status(statusCode.OK).json({
      status: statusCode.OK,
      message: constant.DATA_CREATED,
      data: {
        accessToken: access,
        refreshToken: refresh,
        user: {
          _id: user._id,
          email: user.email,
          name: user.userName,
          rolePermission:data
        },
      },
    });
  } catch (error) {
    console.log(error.message);

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