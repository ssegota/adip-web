/**
 * Gallery Scraper Script
 * Scrapes images from adip.hr for local gallery
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Categories to scrape from astrofotografija
const ASTRO_CATEGORIES = [
    { name: 'mjesec', url: 'http://www.adip.hr/astrofotografija/mjesec' },
    { name: 'venera', url: 'http://www.adip.hr/astrofotografija/venera' },
    { name: 'kometi', url: 'http://www.adip.hr/astrofotografija/kometi' },
    { name: 'mars', url: 'http://www.adip.hr/astrofotografija/mars' },
    { name: 'meteori', url: 'http://www.adip.hr/astrofotografija/meteori' },
    { name: 'jupiter', url: 'http://www.adip.hr/astrofotografija/jupiter' },
    { name: 'saturn', url: 'http://www.adip.hr/astrofotografija/saturn' },
    { name: 'duboki-svemir', url: 'http://www.adip.hr/astrofotografija/messierovi-i-ngc-objekti' }
];

const POVIJEST_URL = 'https://www.adip.hr/galerija-slika/35';

// Helper to fetch URL content
function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        client.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

// Helper to download image
function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        const file = fs.createWriteStream(filepath);

        client.get(url, (res) => {
            if (res.statusCode === 302 || res.statusCode === 301) {
                // Follow redirect
                downloadImage(res.headers.location, filepath).then(resolve).catch(reject);
                return;
            }
            res.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve(filepath);
            });
        }).on('error', (err) => {
            fs.unlink(filepath, () => { });
            reject(err);
        });
    });
}

// Extract image URLs from HTML
function extractImageUrls(html, baseUrl) {
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
    const urls = [];
    let match;

    while ((match = imgRegex.exec(html)) !== null) {
        let src = match[1];
        // Skip small icons and logos
        if (src.includes('icon') || src.includes('logo') || src.includes('button')) continue;
        // Skip very small images
        if (src.includes('thumbnail') && !src.includes('styles')) continue;

        // Make absolute URL
        if (src.startsWith('//')) {
            src = 'http:' + src;
        } else if (src.startsWith('/')) {
            const urlObj = new URL(baseUrl);
            src = urlObj.origin + src;
        } else if (!src.startsWith('http')) {
            src = baseUrl + '/' + src;
        }

        // Get full size image if it's a Drupal style
        if (src.includes('/styles/')) {
            src = src.replace(/\/styles\/[^/]+\/public\//, '/');
        }

        urls.push(src);
    }

    return [...new Set(urls)]; // Remove duplicates
}

// Scrape povijest images
async function scrapePovijest() {
    console.log('\\n📸 Scraping Povijest zvjezdarnice...');
    const html = await fetchUrl(POVIJEST_URL);
    const imageUrls = extractImageUrls(html, POVIJEST_URL);

    console.log(`Found ${imageUrls.length} images`);

    const images = [];
    const dir = path.join(__dirname, '..', 'galerija', 'povijest');

    for (let i = 0; i < imageUrls.length; i++) {
        const url = imageUrls[i];
        const ext = path.extname(url).split('?')[0] || '.jpg';
        const filename = `povijest_${i + 1}${ext}`;
        const filepath = path.join(dir, filename);

        try {
            await downloadImage(url, filepath);
            images.push({
                src: `/galerija/povijest/${filename}`,
                description: `Povijesna fotografija ${i + 1}`
            });
            console.log(`  ✓ ${filename}`);
        } catch (err) {
            console.log(`  ✗ Failed: ${url}`);
        }
    }

    return images;
}

// Scrape astrofotografija category
async function scrapeAstroCategory(category) {
    console.log(`\\n🌌 Scraping ${category.name}...`);
    const html = await fetchUrl(category.url);
    const imageUrls = extractImageUrls(html, category.url);

    console.log(`Found ${imageUrls.length} images`);

    const images = [];
    const dir = path.join(__dirname, '..', 'galerija', 'astrofotografija', category.name);

    // Ensure directory exists
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    for (let i = 0; i < imageUrls.length; i++) {
        const url = imageUrls[i];
        const ext = path.extname(url).split('?')[0] || '.jpg';
        const filename = `${category.name}_${i + 1}${ext}`;
        const filepath = path.join(dir, filename);

        try {
            await downloadImage(url, filepath);
            images.push({
                src: `/galerija/astrofotografija/${category.name}/${filename}`,
                description: `${category.name} - fotografija ${i + 1}`
            });
            console.log(`  ✓ ${filename}`);
        } catch (err) {
            console.log(`  ✗ Failed: ${url}`);
        }
    }

    return images;
}

// Main scrape function
async function main() {
    console.log('🔭 ADIP Gallery Scraper');
    console.log('========================');

    const galerija = {
        povijest: [],
        astrofotografija: {}
    };

    // Scrape povijest
    galerija.povijest = await scrapePovijest();

    // Scrape astrofotografija categories
    for (const category of ASTRO_CATEGORIES) {
        galerija.astrofotografija[category.name] = await scrapeAstroCategory(category);
    }

    // Save JSON
    const jsonPath = path.join(__dirname, '..', 'data', 'galerija.json');
    fs.writeFileSync(jsonPath, JSON.stringify(galerija, null, 2));

    console.log('\\n✅ Done! Gallery data saved to data/galerija.json');
    console.log(`   Povijest: ${galerija.povijest.length} images`);
    for (const [cat, imgs] of Object.entries(galerija.astrofotografija)) {
        console.log(`   ${cat}: ${imgs.length} images`);
    }
}

main().catch(console.error);
