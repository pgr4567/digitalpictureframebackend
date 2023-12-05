const express = require('express');
const cors = require('cors');
const formidable = require('formidable');
const fs = require('fs');
const app = express();
const port = 3001;

app.use(express.json());
app.use(cors());

const mediaDir = "../digitalpictureframe2/public/uploads";

app.get('/getmedia', (req, res) => {
    fs.readdir(mediaDir, (err, filenames) => {
        if (err) {
            console.error('Error reading media directory:', err);
            return res.status(500).send('Error reading media directory');
        }
        res.status(200).json({ filenames });
    });
});

app.post('/deletemedia', (req, res) => {
    if (req.method === 'POST') {
        const { filename } = req.body;
        const filePath = mediaDir + '/' + filename;

        try {
            fs.unlinkSync(filePath);
            res.status(200).json({ message: 'File deleted successfully' });
        } catch (error) {
            console.error('Failed to delete the file:', error);
            res.status(500).json({ error: 'Failed to delete the file' });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
});

app.use('/addmedia', (req, res, next) => {
    const form = new formidable.IncomingForm();
    form.parse(req, (err, fields, files) => {
        if (err) {
            next(err);
            return;
        }
        req.files = files;
        next();
    });
}, (req, res, next) => {
    req.body = req.fields;
    next();
});

app.post('/addmedia', async (req, res) => {
    if (!req.files || !req.files.image) {
        return res.status(400).json({ message: 'No file found' });
    }

    const file = req.files.image;
    const singleFile = Array.isArray(file) ? file[0] : file;

    if (!singleFile.originalFilename) {
        return res.status(400).json({ message: 'File name is missing' });
    }

    const oldPath = singleFile.filepath;
    const filename = Date.now() + '_' + singleFile.originalFilename.replace(/\s/g, '_');
    const newPath = mediaDir + '/' + filename;

    try {
        await fs.promises.copyFile(oldPath, newPath);
        await fs.promises.unlink(oldPath);
        res.status(201).json({ message: 'File uploaded successfully', filename });
    } catch (error) {
        console.error('Error occured', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
});
