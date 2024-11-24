const db = require('../config/database');

class ImageModel {
    static async create(imageData) {
        try {
            console.log('Creating image record:', imageData);
            const [result] = await db.execute(
                'INSERT INTO images (filename, original_name, path, dimensions, overlay_settings, text_settings) VALUES (?, ?, ?, ?, ?, ?)',
                [
                    imageData.filename,
                    imageData.originalName,
                    imageData.path,
                    imageData.dimensions ? JSON.stringify(imageData.dimensions) : null,
                    imageData.overlay ? JSON.stringify(imageData.overlay) : null,
                    imageData.text ? JSON.stringify(imageData.text) : null
                ]
            );
            console.log('Image record created with ID:', result.insertId);
            return result.insertId;
        } catch (error) {
            console.error('Error creating image record:', error);
            throw error;
        }
    }

    static async getAll(page = 1, limit = 12, search = '') {
        try {
            console.log('Getting all images:', { page, limit, search });
            const offset = (page - 1) * limit;
            let query = 'SELECT * FROM images';
            let params = [];

            if (search) {
                query += ' WHERE original_name LIKE ? OR filename LIKE ?';
                params = [`%${search}%`, `%${search}%`];
            }

            // Use direct values for LIMIT and OFFSET
            query += ` ORDER BY upload_date DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

            console.log('Executing query:', query, 'with params:', params);
            const [rows] = await db.execute(query, params);
            const [countResult] = await db.execute('SELECT COUNT(*) as total FROM images');
            
            console.log('Raw database rows:', rows);
            const images = rows.map(row => {
                try {
                    let dimensions = null;
                    let overlay = null;
                    let text = null;

                    try {
                        dimensions = row.dimensions ? JSON.parse(row.dimensions) : null;
                        console.log('Parsed dimensions:', dimensions, 'from:', row.dimensions);
                    } catch (e) {
                        console.error('Error parsing dimensions:', e, row.dimensions);
                    }

                    try {
                        overlay = row.overlay_settings ? JSON.parse(row.overlay_settings) : null;
                        console.log('Parsed overlay:', overlay, 'from:', row.overlay_settings);
                    } catch (e) {
                        console.error('Error parsing overlay:', e, row.overlay_settings);
                    }

                    try {
                        text = row.text_settings ? JSON.parse(row.text_settings) : null;
                        console.log('Parsed text:', text, 'from:', row.text_settings);
                    } catch (e) {
                        console.error('Error parsing text:', e, row.text_settings);
                    }

                    const processedImage = {
                        name: row.filename,
                        filename: row.filename,
                        url: `/uploads/${row.filename}`,
                        uploadDate: row.upload_date,
                        settings: { dimensions, overlay, text }
                    };

                    console.log('Processed image:', processedImage);
                    return processedImage;
                } catch (error) {
                    console.error('Error processing row:', error, row);
                    return null;
                }
            }).filter(img => img !== null);

            console.log('Final processed images:', images);
            
            return {
                images,
                total: countResult[0].total,
                hasMore: offset + rows.length < countResult[0].total
            };
        } catch (error) {
            console.error('Error getting images:', error);
            throw error;
        }
    }

    static async getRecent(limit = 8) {
        try {
            console.log('Getting recent images, limit:', limit);
            // Use direct value for LIMIT
            const query = `SELECT * FROM images ORDER BY upload_date DESC LIMIT ${parseInt(limit)}`;
            console.log('Executing query:', query);
            
            const [rows] = await db.execute(query);
            console.log('Raw database rows:', rows);

            const images = rows.map(row => {
                try {
                    let dimensions = null;
                    let overlay = null;
                    let text = null;

                    try {
                        dimensions = row.dimensions ? JSON.parse(row.dimensions) : null;
                        console.log('Parsed dimensions:', dimensions, 'from:', row.dimensions);
                    } catch (e) {
                        console.error('Error parsing dimensions:', e, row.dimensions);
                    }

                    try {
                        overlay = row.overlay_settings ? JSON.parse(row.overlay_settings) : null;
                        console.log('Parsed overlay:', overlay, 'from:', row.overlay_settings);
                    } catch (e) {
                        console.error('Error parsing overlay:', e, row.overlay_settings);
                    }

                    try {
                        text = row.text_settings ? JSON.parse(row.text_settings) : null;
                        console.log('Parsed text:', text, 'from:', row.text_settings);
                    } catch (e) {
                        console.error('Error parsing text:', e, row.text_settings);
                    }

                    const processedImage = {
                        name: row.filename,
                        filename: row.filename,
                        url: `/uploads/${row.filename}`,
                        uploadDate: row.upload_date,
                        settings: { dimensions, overlay, text }
                    };

                    console.log('Processed image:', processedImage);
                    return processedImage;
                } catch (error) {
                    console.error('Error processing row:', error, row);
                    return null;
                }
            }).filter(img => img !== null);

            console.log('Final processed images:', images);

            return {
                images,
                total: images.length,
                hasMore: false
            };
        } catch (error) {
            console.error('Error getting recent images:', error);
            throw error;
        }
    }

    static async delete(filename) {
        try {
            console.log('Deleting image:', filename);
            const [result] = await db.execute('DELETE FROM images WHERE filename = ?', [filename]);
            console.log('Delete result:', result);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error deleting image:', error);
            throw error;
        }
    }
}

module.exports = ImageModel;
