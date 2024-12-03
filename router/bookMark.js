const express = require("express");
const router = express.Router();
const {bookmark, removeBookmark ,bookmarkById}=require('../operation/bookMark-operation.js')


router.post('/bookmarks' ,bookmark);
router.delete('/bookmarks' ,removeBookmark);
router.get('/bookmarks' ,bookmarkById);


module.exports = router;