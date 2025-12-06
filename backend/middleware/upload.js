const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary'); // Import the configured cloudinary instance

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'WebDevJourney3', // Folder name in Cloudinary
        // You can add more params here like allowed_formats, transformation, etc.
        // allowed_formats: ['jpg', 'png'],
    },
});

const upload = multer({ storage: storage });

module.exports = upload;
