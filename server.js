const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

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

// ==================== RADOVI API ====================



// Get all radovi
app.get('/api/radovi', (req, res) => {
    fs.readFile(RADOVI_FILE, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return res.json([]);
        }
        try {
            res.json(JSON.parse(data));
        } catch (e) {
            res.json([]);
        }
    });
});

// Upload Rad (PDF or Link)
app.post('/api/radovi/upload', radoviUpload.single('file'), (req, res) => {
    const { title, authors, abstract, year, link, type } = req.body;

    let finalLink = link || '';
    let finalType = type || 'link';

    if (req.file) {
        finalLink = 'radovi-files/' + req.file.filename;
        finalType = 'pdf';
    }

    const newRad = {
        id: Date.now(),
        title: title || 'Bez naslova',
        authors: authors || '',
        abstract: abstract || '',
        year: parseInt(year) || new Date().getFullYear(),
        link: finalLink,
        type: finalType,
        dateAdded: new Date().toLocaleDateString('hr-HR')
    };

    fs.readFile(RADOVI_FILE, 'utf8', (err, data) => {
        let radovi = [];
        if (!err && data) {
            try {
                radovi = JSON.parse(data);
            } catch (e) { console.error(e); }
        }

        radovi.unshift(newRad);

        fs.writeFile(RADOVI_FILE, JSON.stringify(radovi, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ success: false });
            }
            res.json({ success: true, rad: newRad });
        });
    });
});

// ==================== SERVISI API ====================

const SERVISI_FILE = path.join(__dirname, 'data', 'servisi.json');

// Get all services
app.get('/api/servisi', (req, res) => {
    fs.readFile(SERVISI_FILE, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return res.json([]);
        }
        try {
            res.json(JSON.parse(data));
        } catch (e) {
            res.json([]);
        }
    });
});

// Add new service
app.post('/api/servisi', (req, res) => {
    const { title, url, type } = req.body;

    const newService = {
        id: Date.now(),
        title: title || 'Novi servis',
        url: url,
        type: type || 'iframe', // iframe or image
        dateAdded: new Date().toISOString()
    };

    fs.readFile(SERVISI_FILE, 'utf8', (err, data) => {
        let services = [];
        if (!err && data) {
            try {
                services = JSON.parse(data);
            } catch (e) { console.error(e); }
        }

        services.push(newService);

        fs.writeFile(SERVISI_FILE, JSON.stringify(services, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ success: false });
            }
            res.json({ success: true, service: newService });
        });
    });
});

// Delete Rad
app.delete('/api/radovi/:id', (req, res) => {
    const radId = parseInt(req.params.id);

    fs.readFile(RADOVI_FILE, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Error reading data');
        }

        let radovi = [];
        try {
            radovi = JSON.parse(data);
        } catch (e) {
            return res.status(500).send('Error parsing data');
        }

        const initialLength = radovi.length;
        radovi = radovi.filter(r => r.id !== radId);

        if (radovi.length === initialLength) {
            return res.status(404).json({ success: false, message: 'Paper not found' });
        }

        fs.writeFile(RADOVI_FILE, JSON.stringify(radovi, null, 2), (err) => {
            if (err) {
                return res.status(500).send('Error writing data');
            }
            res.json({ success: true });
        });
    });
});

// Delete Gallery Image
app.post('/api/galerija/delete', (req, res) => {
    const { src, category } = req.body;

    fs.readFile(GALLERY_FILE, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ success: false });
        }

        let gallery = { povijest: [], astrofotografija: {} };
        try {
            gallery = JSON.parse(data);
        } catch (e) {
            return res.status(500).json({ success: false });
        }

        if (category === 'povijest') {
            gallery.povijest = gallery.povijest.filter(img => img.src !== src);
        } else {
            if (gallery.astrofotografija[category]) {
                gallery.astrofotografija[category] = gallery.astrofotografija[category].filter(img => img.src !== src);
            }
        }

        fs.writeFile(GALLERY_FILE, JSON.stringify(gallery, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ success: false });
            }
            // Optional: Delete physical file (careful with this in dev)
            // const filePath = path.join(__dirname, src);
            // if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

            res.json({ success: true });
        });
    });
});

// ==================== DOWNLOADS API ====================

const DOWNLOADS_FILE = path.join(__dirname, 'data', 'downloads.json');

// Storage for Downloadable Files
const downloadStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'downloads-files/';
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

const downloadsUpload = multer({ storage: downloadStorage });

// Get all downloads
app.get('/api/downloads', (req, res) => {
    fs.readFile(DOWNLOADS_FILE, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return res.json([]);
        }
        try {
            res.json(JSON.parse(data));
        } catch (e) {
            res.json([]);
        }
    });
});

// Upload Downloadable File
app.post('/api/downloads/upload', downloadsUpload.single('file'), (req, res) => {
    const { title, description } = req.body;

    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const newFile = {
        id: Date.now(),
        title: title || req.file.originalname,
        description: description || '',
        fileName: req.file.originalname,
        filePath: 'downloads-files/' + req.file.filename,
        fileSize: (req.file.size / 1024 / 1024).toFixed(2) + ' MB', // Size in MB
        fileType: path.extname(req.file.filename).substring(1), // Extension without dot
        dateAdded: new Date().toLocaleDateString('hr-HR'), // Or ISO if preferred
        uploadDateIso: new Date().toISOString()
    };

    fs.readFile(DOWNLOADS_FILE, 'utf8', (err, data) => {
        let downloads = [];
        if (!err && data) {
            try {
                downloads = JSON.parse(data);
            } catch (e) { ui.console.error(e); }
        }

        downloads.unshift(newFile);

        fs.writeFile(DOWNLOADS_FILE, JSON.stringify(downloads, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ success: false });
            }
            res.json({ success: true, file: newFile });
        });
    });
});

// Delete Download
app.delete('/api/downloads/:id', (req, res) => {
    const fileId = parseInt(req.params.id);

    fs.readFile(DOWNLOADS_FILE, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Error reading data'); // Consistent error handling
        }

        let downloads = [];
        try {
            downloads = JSON.parse(data);
        } catch (e) {
            return res.status(500).send('Error parsing data');
        }

        const initialLength = downloads.length;
        const fileToDelete = downloads.find(f => f.id === fileId);

        if (!fileToDelete) {
            return res.status(404).json({ success: false, message: 'File not found' });
        }

        downloads = downloads.filter(f => f.id !== fileId);

        fs.writeFile(DOWNLOADS_FILE, JSON.stringify(downloads, null, 2), (err) => {
            if (err) {
                return res.status(500).send('Error writing data');
            }

            // Allow file deletion fail safely (dev vs prod paths)
            try {
                const filePath = path.join(__dirname, fileToDelete.filePath);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (e) {
                console.error("Error deleting physical file:", e);
            }

            res.json({ success: true });
        });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
