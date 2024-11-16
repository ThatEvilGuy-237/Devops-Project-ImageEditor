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
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Not an image! Please upload an image.'), false);
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
const uploadDir = path.join(__dirname, '..', process.env.UPLOAD_DIR);
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
            const fontSize = parseInt(req.body.fontSize) || 40;
            const textPadding = parseInt(req.body.textPadding) || 10;
            const verticalPosition = parseInt(req.body.verticalPosition) || 95;
            
            settings.text = {
                content: req.body.text,
                fontSize,
                padding: textPadding,
                position: verticalPosition
            };

            const svgText = Buffer.from(`
                <svg width="${metadata.width}" height="${metadata.height}">
                    <defs>
                        <filter id="outline" x="-20%" y="-20%" width="140%" height="140%">
                            <feMorphology operator="dilate" radius="2" in="SourceAlpha" result="thicken" />
                            <feGaussianBlur in="thicken" stdDeviation="1" result="blurred"/>
                            <feFlood flood-color="black" result="glowColor" />
                            <feComposite in="glowColor" in2="blurred" operator="in" result="softGlow_colored"/>
                            <feMerge>
                                <feMergeNode in="softGlow_colored"/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                    </defs>
                    <style>
                        .title { 
                            fill: white; 
                            font-size: ${fontSize}px; 
                            font-weight: bold;
                            font-family: Arial, sans-serif;
                            filter: url(#outline);
                        }
                    </style>
                    <text 
                        x="50%" 
                        y="${verticalPosition}%"
                        text-anchor="middle"
                        class="title"
                        transform="translate(0, -${fontSize/2})"
                    >${req.body.text}</text>
                </svg>`);

            // Create a new Sharp instance for the SVG
            const svgBuffer = await sharp(svgText)
                .resize(metadata.width, metadata.height, { fit: 'fill' })
                .toBuffer();

            compositeOperations.push({
                input: svgBuffer,
                top: 0,
                left: 0,
                blend: 'over'
            });
        }

        // Apply all composite operations
        if (compositeOperations.length > 0) {
            imageBuffer = await sharpImage
                .composite(compositeOperations)
                .toBuffer();
        }

        // Save the final image
        const outputPath = path.join(uploadDir, imageName);
        await sharp(imageBuffer)
            .toFormat(fileExt.substring(1))
            .toFile(outputPath);

        // Save to database
        const imageData = {
            filename: imageName,
            originalName: mainImage.originalname,
            path: outputPath,
            dimensions: settings.dimensions || null,
            overlay: settings.overlay || null,
            text: settings.text || null
        };

        console.log('Saving image data to database:', JSON.stringify(imageData, null, 2));

        try {
            await ImageModel.create(imageData);
            console.log('Successfully saved image data to database');
        } catch (error) {
            console.error('Error saving to database:', error);
            // Continue even if database save fails
        }

        res.json({
            message: 'Image uploaded successfully',
            name: imageName,
            url: `${process.env.SERVER_URL}/api/images/${imageName}`,
            settings: settings
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
