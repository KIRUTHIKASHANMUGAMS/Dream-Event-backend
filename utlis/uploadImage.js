const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {

        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        console.log("Filename function called");
        cb(null, Date.now()+ '_' + file.originalname );    }
});


const upload = multer({ storage: storage });
module.exports = upload;