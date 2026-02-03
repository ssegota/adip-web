const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname)); // Serve static files from root

// Storage configuration for Multer (Gallery Uploads)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'galerija-slika/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});

const upload = multer({ storage: storage });

// Login Route (Simple/Hardcoded)
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'adip2026') {
        res.json({ success: true, token: 'fake-jwt-token-adip' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

// Activities API
const ACTIVITIES_FILE = path.join(__dirname, 'data', 'aktivnosti.json');
const RADOVI_FILE = path.join(__dirname, 'data', 'radovi.json');

// Storage for Radovi (PDFs)
const radoviStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'radovi-files/';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        // Safe filename
        const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, Date.now() + '-' + cleanName);
    }
});

const radoviUpload = multer({
    storage: radoviStorage,
    fileFilter: function (req, file, cb) {
        // Accept PDF only
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(null, false);
        }
    }
});

// Storage for activity images
const activityImageStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'aktivnosti-slike/';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const activityUpload = multer({ storage: activityImageStorage });

app.get('/api/aktivnosti', (req, res) => {
    fs.readFile(ACTIVITIES_FILE, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error reading data');
        }
        res.send(data || '[]');
    });
});

// Activity with images (up to 3)
app.post('/api/aktivnosti', activityUpload.array('images', 3), (req, res) => {
    const { title, content, date, year } = req.body;
    const images = req.files ? req.files.map(f => '/aktivnosti-slike/' + f.filename) : [];

    const newActivity = {
        id: Date.now(),
        year: parseInt(year) || new Date().getFullYear(),
        title: title,
        date: date || new Date().toLocaleDateString('hr-HR'),
        content: content,
        images: images
    };

    fs.readFile(ACTIVITIES_FILE, 'utf8', (err, data) => {
        let activities = [];
        if (!err && data) {
            try {
                activities = JSON.parse(data);
            } catch (e) {
                console.error("Error parsing JSON", e);
            }
        }

        activities.unshift(newActivity); // Add to top

        fs.writeFile(ACTIVITIES_FILE, JSON.stringify(activities, null, 2), (err) => {
            if (err) {
                return res.status(500).send('Error writing data');
            }
            res.json({ success: true, activity: newActivity });
        });
    });
});

// Gallery Upload
app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    res.json({ success: true, filename: req.file.filename });
});

// Delete Activity
app.delete('/api/aktivnosti/:id', (req, res) => {
    const activityId = parseInt(req.params.id);

    fs.readFile(ACTIVITIES_FILE, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Error reading data');
        }

        let activities = [];
        try {
            activities = JSON.parse(data);
        } catch (e) {
            return res.status(500).send('Error parsing data');
        }

        const initialLength = activities.length;
        activities = activities.filter(a => a.id !== activityId);

        if (activities.length === initialLength) {
            return res.status(404).json({ success: false, message: 'Activity not found' });
        }

        fs.writeFile(ACTIVITIES_FILE, JSON.stringify(activities, null, 2), (err) => {
            if (err) {
                return res.status(500).send('Error writing data');
            }
            res.json({ success: true });
        });
    });
});

// Gallery API
const GALLERY_FILE = path.join(__dirname, 'data', 'galerija.json');

app.get('/api/galerija', (req, res) => {
    fs.readFile(GALLERY_FILE, 'utf8', (err, data) => {
        if (err) {
            return res.json({ povijest: [], astrofotografija: {} });
        }
        res.json(JSON.parse(data));
    });
});

// Gallery upload with category support
const galleryStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const category = req.body.category || 'povijest';
        let dir = 'galerija/';

        if (category === 'povijest') {
            dir += 'povijest/';
        } else {
            dir += 'astrofotografija/' + category + '/';
        }

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const galleryUpload = multer({ storage: galleryStorage });

app.post('/api/galerija/upload', galleryUpload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const category = req.body.category || 'povijest';
    const description = req.body.description || '';
    const filename = req.file.filename;

    let imagePath;
    if (category === 'povijest') {
        imagePath = '/galerija/povijest/' + filename;
    } else {
        imagePath = '/galerija/astrofotografija/' + category + '/' + filename;
    }

    // Update galerija.json
    fs.readFile(GALLERY_FILE, 'utf8', (err, data) => {
        let gallery = { povijest: [], astrofotografija: {} };
        if (!err) {
            gallery = JSON.parse(data);
        }

        const newImage = { src: imagePath, description: description };

        if (category === 'povijest') {
            gallery.povijest.push(newImage);
        } else {
            if (!gallery.astrofotografija[category]) {
                gallery.astrofotografija[category] = [];
            }
            gallery.astrofotografija[category].push(newImage);
        }

        fs.writeFile(GALLERY_FILE, JSON.stringify(gallery, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ success: false });
            }
            res.json({ success: true, filename: filename, path: imagePath });
        });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
