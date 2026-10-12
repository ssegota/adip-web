const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
// Statika: slike se nikad ne mijenjaju (imena imaju timestamp) pa se smiju dugo keširati;
// JSON podaci se uvijek provjeravaju da se promjene (npr. brisanje) odmah vide.
app.use(express.static(__dirname, {
    setHeaders: (res, filePath) => {
        if (/\.(jpe?g|png|gif|webp|svg|ico)$/i.test(filePath)) {
            res.setHeader('Cache-Control', 'public, max-age=2592000');
        } else if (/\.json$/i.test(filePath)) {
            res.setHeader('Cache-Control', 'no-cache');
        }
    }
}));

// Kontrolna ruta - otvori /api/version u pregledniku da provjeriš vrti li se novi kod
app.get('/api/version', (req, res) => {
    res.json({
        version: 'update-routes-v1',
        file: __filename,
        started: new Date().toISOString()
    });
});

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

// Thumbnailovi: preglednik ih generira pri uploadu (canvas, JPEG) i šalje uz original.
// Sprema se kao <mapa-slike>/thumbs/<ime-bez-ekstenzije>.jpg - frontend putanju izvodi iz src-a.
const THUMB_MAX_BYTES = 1024 * 1024;

function thumbPathFor(imagePath) {
    const dir = path.join(path.dirname(imagePath), 'thumbs');
    const name = path.basename(imagePath).replace(/\.[^.]+$/, '') + '.jpg';
    return path.join(dir, name);
}

function storeThumb(imageFile, thumbFile) {
    if (!thumbFile) return;
    try {
        if (!imageFile || thumbFile.size > THUMB_MAX_BYTES || thumbFile.mimetype !== 'image/jpeg') {
            fs.unlinkSync(thumbFile.path);
            return;
        }
        const target = thumbPathFor(imageFile.path);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.renameSync(thumbFile.path, target);
    } catch (e) {
        console.error('Ne mogu spremiti thumbnail:', e.message);
    }
}

// Obriši sliku i njezin thumbnail, ali samo unutar dopuštene mape
function deleteImageFile(src, allowedDir) {
    const filePath = path.join(__dirname, String(src).replace(/^\/+/, ''));
    if (!filePath.startsWith(allowedDir + path.sep)) return;
    [filePath, thumbPathFor(filePath)].forEach(f => {
        try {
            if (fs.existsSync(f)) fs.unlinkSync(f);
        } catch (e) {
            console.error('Ne mogu obrisati datoteku:', e.message);
        }
    });
}

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
const activityFields = activityUpload.fields([
    { name: 'images', maxCount: 3 },
    { name: 'thumbs', maxCount: 3 }
]);

// Spremi thumbnailove (i-ti thumb pripada i-toj slici) i vrati web putanje slika
function collectActivityImages(req) {
    const files = (req.files && req.files.images) || [];
    const thumbs = (req.files && req.files.thumbs) || [];
    files.forEach((f, i) => storeThumb(f, thumbs[i]));
    thumbs.slice(files.length).forEach(t => storeThumb(null, t));
    return files.map(f => '/aktivnosti-slike/' + f.filename);
}

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
app.post('/api/aktivnosti', activityFields, (req, res) => {
    const { title, content, date, year } = req.body;
    const images = collectActivityImages(req);

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

// ==================== NOVO: Uređivanje aktivnosti ====================
// Frontend šalje: title, content, date, year, keepImages (JSON niz putanja) + nove datoteke pod "images"
// Registrirano na dvije rute jer neki hostinzi (cPanel/LiteSpeed) blokiraju PUT.
function updateActivityHandler(req, res) {
    const activityId = req.params.id;

    fs.readFile(ACTIVITIES_FILE, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error reading data' });
        }

        let activities = [];
        try {
            activities = JSON.parse(data);
        } catch (e) {
            return res.status(500).json({ success: false, message: 'Error parsing data' });
        }

        // Usporedba kao string - radi i ako su id-evi u JSON-u brojevi i ako su tekst
        const index = activities.findIndex(a => String(a.id) === String(activityId));
        if (index === -1) {
            console.warn('UPDATE: aktivnost nije pronadena, id =', activityId,
                '| prvih par postojecih id-eva:', activities.map(a => a.id).slice(0, 5));
            return res.status(404).json({ success: false, message: 'Activity not found (id ' + activityId + ')' });
        }

        const activity = activities[index];
        const oldImages = Array.isArray(activity.images) ? activity.images : [];

        // Koje postojeće slike zadržavamo
        let keepImages = oldImages;
        if (req.body.keepImages) {
            try {
                const parsed = JSON.parse(req.body.keepImages);
                if (Array.isArray(parsed)) keepImages = parsed;
            } catch (e) {
                console.warn('Neispravan keepImages, zadržavam sve slike');
            }
        }

        // Obriši s diska slike koje je korisnik uklonio
        const imagesDir = path.join(__dirname, 'aktivnosti-slike');
        oldImages
            .filter(src => !keepImages.includes(src))
            .forEach(src => deleteImageFile(src, imagesDir));

        // Nove uploadane slike
        const newImages = collectActivityImages(req);

        // Ažuriraj polja
        if (req.body.title !== undefined) activity.title = req.body.title;
        if (req.body.content !== undefined) activity.content = req.body.content;
        if (req.body.date !== undefined) activity.date = req.body.date;
        if (req.body.year !== undefined && req.body.year !== '') {
            activity.year = parseInt(req.body.year) || activity.year;
        }
        activity.images = keepImages.concat(newImages).slice(0, 3);

        activities[index] = activity;

        fs.writeFile(ACTIVITIES_FILE, JSON.stringify(activities, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Error writing data' });
            }
            res.json({ success: true, activity: activity });
        });
    });
}

// Glavna ruta koju koristi frontend (POST radi svugdje)
app.post('/api/aktivnosti/:id/update', activityFields, updateActivityHandler);
// Alternativa, ako hosting dopušta PUT
app.put('/api/aktivnosti/:id', activityFields, updateActivityHandler);

// Brisanje preko POST-a (za hostinge koji blokiraju DELETE)
app.post('/api/aktivnosti/:id/delete', (req, res) => {
    fs.readFile(ACTIVITIES_FILE, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error reading data' });
        }

        let activities = [];
        try {
            activities = JSON.parse(data);
        } catch (e) {
            return res.status(500).json({ success: false, message: 'Error parsing data' });
        }

        const initialLength = activities.length;
        activities = activities.filter(a => String(a.id) !== String(req.params.id));

        if (activities.length === initialLength) {
            return res.status(404).json({ success: false, message: 'Activity not found' });
        }

        fs.writeFile(ACTIVITIES_FILE, JSON.stringify(activities, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Error writing data' });
            }
            res.json({ success: true });
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
// Top-level gallery categories (not astrofotografija subcategories)
const topLevelCategories = ['povijest', 'posjete', 'ostalo'];

const galleryStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const category = req.body.category || 'povijest';
        let dir = 'galerija/';

        if (topLevelCategories.includes(category)) {
            dir += category + '/';
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

app.post('/api/galerija/upload', galleryUpload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'thumb', maxCount: 1 }
]), (req, res) => {
    req.file = req.files && req.files.image && req.files.image[0];
    const thumbFile = req.files && req.files.thumb && req.files.thumb[0];
    if (!req.file) {
        storeThumb(null, thumbFile);
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    storeThumb(req.file, thumbFile);

    const category = req.body.category || 'povijest';
    const description = req.body.description || '';
    const filename = req.file.filename;

    let imagePath;
    if (topLevelCategories.includes(category)) {
        imagePath = '/galerija/' + category + '/' + filename;
    } else {
        imagePath = '/galerija/astrofotografija/' + category + '/' + filename;
    }

    // Update galerija.json
    fs.readFile(GALLERY_FILE, 'utf8', (err, data) => {
        let gallery = { povijest: [], astrofotografija: {}, posjete: [], ostalo: [] };
        if (!err) {
            gallery = JSON.parse(data);
        }

        const newImage = { src: imagePath, description: description };

        if (topLevelCategories.includes(category)) {
            if (!gallery[category]) {
                gallery[category] = [];
            }
            gallery[category].push(newImage);
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
// U galerija.json starije slike imaju putanju bez vodeće kose crte ("galerija/..."),
// a nove s njom ("/galerija/...") - uspoređuje se normalizirano. Kategorija se ne
// uzima zdravo za gotovo (prikaz "Sve" u astrofotografiji šalje "all"), nego se
// slika traži u svim kategorijama.
app.post('/api/galerija/delete', (req, res) => {
    const normalize = p => String(p || '').replace(/^\/+/, '');
    const target = normalize(req.body && req.body.src);
    if (!target) {
        return res.status(400).json({ success: false, message: 'Missing src' });
    }

    fs.readFile(GALLERY_FILE, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ success: false });
        }

        let gallery;
        try {
            gallery = JSON.parse(data);
        } catch (e) {
            return res.status(500).json({ success: false });
        }

        let removed = 0;
        const filterList = list => {
            if (!Array.isArray(list)) return list;
            const kept = list.filter(img => normalize(img.src) !== target);
            removed += list.length - kept.length;
            return kept;
        };

        topLevelCategories.forEach(cat => { gallery[cat] = filterList(gallery[cat]); });
        Object.keys(gallery.astrofotografija || {}).forEach(cat => {
            gallery.astrofotografija[cat] = filterList(gallery.astrofotografija[cat]);
        });

        if (removed === 0) {
            return res.status(404).json({ success: false, message: 'Image not found' });
        }

        fs.writeFile(GALLERY_FILE, JSON.stringify(gallery, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ success: false });
            }
            deleteImageFile(target, path.join(__dirname, 'galerija'));
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
app.post('/api/downloads/upload', downloadsUpload.single('file'), async (req, res) => {
    const { title, description } = req.body;

    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const fileExt = path.extname(req.file.filename).substring(1).toLowerCase();
    let thumbnailPath = '';

    // Generate thumbnail for PDF files using pdftoppm
    if (fileExt === 'pdf') {
        try {
            const pdfPath = path.join(__dirname, 'downloads-files', req.file.filename);
            const thumbnailDir = path.join(__dirname, 'downloads-files', 'thumbnails');

            // Ensure thumbnails directory exists
            if (!fs.existsSync(thumbnailDir)) {
                fs.mkdirSync(thumbnailDir, { recursive: true });
            }

            const outputName = req.file.filename.replace(/\.pdf$/i, '');
            const outputPrefix = path.join(thumbnailDir, outputName);

            // Use pdftoppm: -f 1 -l 1 = first page only, -png = PNG format, -scale-to 400 = width
            execSync(`pdftoppm -f 1 -l 1 -png -scale-to 400 "${pdfPath}" "${outputPrefix}"`, {
                stdio: 'pipe'
            });

            // pdftoppm creates files like outputName-1.png or outputName-01.png
            const possibleNames = [
                'downloads-files/thumbnails/' + outputName + '-1.png',
                'downloads-files/thumbnails/' + outputName + '-01.png'
            ];

            for (const testPath of possibleNames) {
                if (fs.existsSync(path.join(__dirname, testPath))) {
                    thumbnailPath = testPath;
                    break;
                }
            }
        } catch (err) {
            console.error('Error generating PDF thumbnail:', err);
            // Continue without thumbnail if generation fails
        }
    }

    const newFile = {
        id: Date.now(),
        title: title || req.file.originalname,
        description: description || '',
        fileName: req.file.originalname,
        filePath: 'downloads-files/' + req.file.filename,
        thumbnailPath: thumbnailPath, // New field for thumbnail
        fileSize: (req.file.size / 1024 / 1024).toFixed(2) + ' MB',
        fileType: fileExt,
        dateAdded: new Date().toLocaleDateString('hr-HR'),
        uploadDateIso: new Date().toISOString()
    };

    fs.readFile(DOWNLOADS_FILE, 'utf8', (err, data) => {
        let downloads = [];
        if (!err && data) {
            try {
                downloads = JSON.parse(data);
            } catch (e) { console.error(e); }
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
require('./tecaj/server/tecaj-api')(app);
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});