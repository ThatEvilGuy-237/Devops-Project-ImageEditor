const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const ImageModel = require('../models/imageModel');

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 // 10MB default
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,image/webp').split(',');
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Allowed types: ' + allowedTypes.join(', ')), false);
        }
    }
}).fields([
    { name: 'image', maxCount: 1 },
    { name: 'overlay', maxCount: 1 }
]);

// Get file extension from mimetype
function getFileExtension(mimetype) {
    switch (mimetype) {
        case 'image/jpeg':
            return '.jpg';
        case 'image/png':
            return '.png';
        case 'image/gif':
            return '.gif';
        case 'image/webp':
            return '.webp';
        default:
            return '.jpg';
    }
}

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_DIR;
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Get image by name
router.get('/images/:name', (req, res) => {
    const imagePath = path.join(uploadDir, req.params.name);
    
    if (!fs.existsSync(imagePath)) {
        return res.status(404).json({ error: 'Image not found' });
    }
    
    res.sendFile(imagePath);
});

// Get list of images with pagination and search
router.get('/images', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 12;
        const search = req.query.search || '';
        const view = req.query.view || 'all';

        console.log('Getting images with params:', { page, pageSize, search, view });

        let result;
        if (view === 'recent') {
            result = await ImageModel.getRecent(8);
        } else {
            result = await ImageModel.getAll(page, pageSize, search);
        }

        // Transform the image URLs to use the /uploads path
        if (result.images) {
            result.images = result.images.map(img => ({
                ...img,
                url: `/uploads/${img.filename}`
            }));
        }

        console.log('Sending response:', result);
        res.json(result);
    } catch (error) {
        console.error('Error getting images:', error);
        res.status(500).json({ error: 'Error getting images' });
    }
});

// Upload and process images
router.post('/images', upload, async (req, res) => {
    try {
        if (!req.files || !req.files.image) {
            return res.status(400).json({ error: 'No main image provided' });
        }

        const mainImage = req.files.image[0];
        const overlayImage = req.files.overlay ? req.files.overlay[0] : null;
        
        const fileExt = getFileExtension(mainImage.mimetype);
        const imageName = req.body.name 
            ? (req.body.name.endsWith(fileExt) ? req.body.name : req.body.name + fileExt)
            : 'image-' + Date.now() + fileExt;

        let imageBuffer = mainImage.buffer;
        
        // Process main image with sharp
        let sharpImage = sharp(imageBuffer);
        const metadata = await sharpImage.metadata();

        console.log('Image metadata:', metadata);

        // Prepare settings object
        const settings = {
            dimensions: {
                width: metadata.width,
                height: metadata.height
            }
        };

        // Array to hold composite operations
        const compositeOperations = [];

        // Add overlay image if provided
        if (overlayImage) {
            const overlayScale = parseFloat(req.body.overlayScale) / 100 || 1;
            const overlayX = parseInt(req.body.overlayX) || 50;
            const overlayY = parseInt(req.body.overlayY) || 50;

            settings.overlay = {
                scale: overlayScale,
                position: {
                    x: overlayX,
                    y: overlayY
                }
            };

            // Resize overlay image
            const overlayBuffer = await sharp(overlayImage.buffer)
                .resize(Math.round(metadata.width * overlayScale))
                .toBuffer();

            // Calculate position
            const overlayMeta = await sharp(overlayBuffer).metadata();
            const left = Math.round((metadata.width * overlayX / 100) - (overlayMeta.width / 2));
            const top = Math.round((metadata.height * overlayY / 100) - (overlayMeta.height / 2));

            compositeOperations.push({
                input: overlayBuffer,
                left,
                top
            });
        }

        // Add text if provided
        if (req.body.text) {
            const fontSize = parseInt(req.body.fontSize) || 300;
            const textPadding = parseInt(req.body.textPadding) || 10;
            const verticalPosition = parseInt(req.body.verticalPosition) || 95;
            
            settings.text = {
                content: req.body.text,
                fontSize,
                padding: textPadding,
                position: verticalPosition
            };

            // Calculate font size relative to image width
            const scaledFontSize = Math.min(fontSize, metadata.width / 3);
            
            // Calculate padding and position
            const horizontalPadding = Math.floor(metadata.width * textPadding / 100);
            const verticalOffset = Math.floor(metadata.height * verticalPosition / 100);

            // Create text overlay
            const textSvg = Buffer.from(`
                <svg width="${metadata.width}" height="${metadata.height}">
                    <text 
                        x="50%" 
                        y="${verticalOffset}"
                        font-family="sans-serif"
                        font-size="${scaledFontSize}px"
                        fill="white"
                        stroke="black"
                        stroke-width="2"
                        font-weight="bold"
                        text-anchor="middle"
                        dominant-baseline="middle"
                    >${req.body.text}</text>
                </svg>
            `);

            compositeOperations.push({
                input: textSvg,
                blend: 'over'
            });
        }

        // Apply all composite operations to the image
        if (compositeOperations.length > 0) {
            imageBuffer = await sharp(imageBuffer)
                .composite(compositeOperations)
                .toBuffer();
        }

        // Save the final image
        const outputPath = path.join(uploadDir, imageName);
        await sharp(imageBuffer)
            .toFormat(fileExt.substring(1))
            .toFile(outputPath);

        // Save image metadata to database
        await ImageModel.create({
            filename: imageName,
            originalName: mainImage.originalname,
            path: outputPath,
            dimensions: settings.dimensions,
            overlay: settings.overlay,
            text: settings.text
        });

        res.json({
            success: true,
            filename: imageName,
            url: `/uploads/${imageName}`,
            settings
        });
    } catch (error) {
        console.error('Error processing image:', error);
        res.status(500).json({ error: 'Error processing image' });
    }
});

// Delete image
router.delete('/images/:name', async (req, res) => {
    try {
        const imagePath = path.join(uploadDir, req.params.name);
        
        if (!fs.existsSync(imagePath)) {
            return res.status(404).json({ error: 'Image not found' });
        }

        try {
            // Delete from database first
            await ImageModel.delete(req.params.name);
            console.log('Successfully deleted image from database');
        } catch (error) {
            console.error('Error deleting from database:', error);
            // Continue even if database delete fails
        }

        // Delete file
        fs.unlinkSync(imagePath);
        res.json({ message: 'Image deleted successfully' });
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({ error: 'Error deleting image' });
    }
});

module.exports = router;
