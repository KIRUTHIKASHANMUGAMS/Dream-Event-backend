const jwt = require('jsonwebtoken');
const crypto = require('crypto');





const randomValue =(payload)=>{
  const timestamp = new Date().getTime().toString();
    const randomNumber = crypto.randomBytes(32).toString('hex');
    return {
      ...payload,
      timestamp: timestamp,
      random: randomNumber,
    };
}



const generateAccessToken = (payload) => {
  const options = {
    expiresIn: process.env.JWT_EXPIRE_DATE || '1d',
  };

  const tokenPayload=randomValue(payload)
  const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, options);
  return token;
};

const generateRefreshToken = (payload) => {
  const options = {
    expiresIn: process.env.JWT_REFRESH_EXPIRE_DATE || '7d',
  };

  const tokenPayload=randomValue(payload)
  const refreshToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, options);
  
  return refreshToken;
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
};

