const { Schema } = require('mongoose');
const userModel = require('../model/user-model');
const statusCode = require("../utlis/statusCode");
const constant = require("../utlis/constant");
const bcrypt = require("bcrypt");
const { generateToken } = require('../middleware/jwtUtils');
const { sendResetPasswordEmail } = require("../utlis/mail");
const randomstring = require('randomstring');



function generateOTP() {
    return randomstring.generate({
        length: 5,
        charset: 'numeric'
    });
}

exports.createUser = async (req, res) => {
    const { email, userName, password } = req.body;

    const user = await userModel.findOne({ email });


    if (user) {
        return res.status(400).json({
            statusCode: statusCode.BAD_REQUEST,
            message: constant.ERR_USER_ALREADY_EXIST,
        });
    }




    if (!email || !userName || !password) {
        return res.status(400).json({
            status: statusCode.BAD_REQUEST,
            message: constant.ERR_FIRST_NAME,
        });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10)
        const userLogin = new userModel({
            email,
            userName,
            password: hashedPassword
        });



        const result = await userLogin.save();

        return res.status(200).json({
            status: statusCode.OK,
            message: constant.DATA_CREATED
        });
    } catch (error) {
        console.error("Error creating user:", error);
        return res.status(500).json({
            status: statusCode.INTERNAL_SERVER_ERROR,
            message: constant.ERR_INTERNAL_SERVER_ERROR
        });
    }
};



exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(401).json({
                statusCode: statusCode.UNAUTHORIZED,
                message: constant.ERR_INVALID,
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        const token = generateToken({ id: user._id, email: user.email });
        user.token = token;
        await user.save();

        if (!isMatch) {
            return res.status(401).json({
                statusCode: statusCode.UNAUTHORIZED,
                message: constant.ERR_INVALID,
            });
        }


        res.json({
            status: statusCode.OK,
            message: constant.LOGIN_SUCCESFULLY,
            token: token,
            id:user._id
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: statusCode.INTERNAL_SERVER_ERROR,
            message: constant.ERR_INTERNAL_SERVER_ERROR
        });
    }
};

exports.forgotpassword = async (req, res) => {

    const { email } = req.body

    const user = await userModel.findOne({ email });


    try {

        if (!user) {
            return res.status(401).json({
                statusCode: statusCode.UNAUTHORIZED,
                message: constant.ERR_INVALID,
            });
        } else {
            const otp = generateOTP();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

            const context = {
                resetLink: `Your OTP code is ${otp}. It will expire in 10 minutes.`,
            };

            user.otp = otp;
            user.expiresAt = expiresAt
            await user.save();
            await sendResetPasswordEmail(email, context);
            await userModel.findOneAndUpdate(
                { email },
                { otp, expiresAt },
                { upsert: true }
            );

            res.status(200).json({
                status: statusCode.OK,
                message: constant.PASSWORD_RESET_MAIL,
            });

        }

    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: statusCode.INTERNAL_SERVER_ERROR,
            message: constant.ERR_INTERNAL_SERVER_ERROR
        });
    }

}


exports.verifyOtp = async (req, res) => {
    const { email, otp } = req.body;

    const record = await userModel.findOne({ email });
    try {
        if (!record) {
            return res.status(400).json({
                status: statusCode.BAD_REQUEST,
                message: constant.ERR_OTP_FOUND
            });
        }

        if (new Date(record.expiresAt) < new Date()) {
            return res.status(400).json({
                status: statusCode.BAD_REQUEST,
                message: constant.ERR_OTP_EXPIRES,
            });
        }
    

        if (record.otp !== otp) {
            return res.status(400).json({

                status: statusCode.BAD_REQUEST,
                message: constant.ERR_INVALID_OTP
            });
        }

        res.status(200).json({
            status: statusCode.OK,
            message: constant.ERR_OTP_VERIFIED

        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: statusCode.INTERNAL_SERVER_ERROR,
            message: constant.ERR_INTERNAL_SERVER_ERROR
        });
    }

}


exports.resetPassword=async(req,res)=>{
    const {email,password}=req.body
    try {
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(404).json({
                statusCode: statusCode.NOT_FOUND,
                message:constant.ERR_USER_NOT_FOUND,
            });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update the user's password
        user.password = hashedPassword;
        await user.save();

        res.json({
            status: statusCode.OK,
            message:constant.PASSWORD_RESET_SUCCUSSFULLY,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: statusCode.INTERNAL_SERVER_ERROR,
            message: constant.ERR_INTERNAL_SERVER_ERROR
        });
    }






}