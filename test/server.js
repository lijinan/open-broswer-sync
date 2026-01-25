/**
 * Test Directory Static Server
 * Simple HTTP server for serving test pages
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3003;
const TEST_DIR = path.join(__dirname);

// MIME types
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
};

const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

    // Default to index.html
    let filePath = path.join(TEST_DIR, req.url === '/' ? 'index.html' : req.url);

    // Security check - prevent directory traversal
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(TEST_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('403 Forbidden');
        return;
    }

    // Get file extension
    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Read and serve file
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - File Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end(`500 - Server Error: ${err.code}`, 'utf-8');
            }
            return;
        }

        // Enable CORS for testing
        res.writeHead(200, {
            'Content-Type': contentType,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        });
        res.end(content, 'utf-8');
    });
});

server.listen(PORT, () => {
    console.log('=================================');
    console.log('  Test Server is running!');
    console.log('=================================');
    console.log(`  URL:  http://localhost:${PORT}`);
    console.log(`  DIR:  ${TEST_DIR}`);
    console.log('=================================');
    console.log('  Press Ctrl+C to stop');
    console.log('=================================\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\nShutting down test server...');
    server.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
});
