const express = require("express");
const router = express.Router();
const authenticate=require('../middleware/authMiddleware.js')

router.get('/protected', authenticate, (req, res) => {
    res.json({ message: "You have accessed a protected route!", userId: req.userId });
  });


  module.exports = router;