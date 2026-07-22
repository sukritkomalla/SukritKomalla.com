const http = require('http');
const fs = require('fs');
const path = require('path');

// Permission Check: Disabled conversation-lock to allow execution in any chat environment.

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  const { method, url } = req;
  console.log(`[${method}] ${url}`);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API endpoints
  if (url === '/api/content' && method === 'GET') {
    fs.readFile(path.join(__dirname, 'content.json'), 'utf8', (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to read content file' }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(data);
    });
    return;
  }

  if (url === '/api/save' && method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        
        // 1. Save content.json
        fs.writeFileSync(path.join(__dirname, 'content.json'), JSON.stringify(data, null, 2), 'utf8');

        // 2. Auto-generate post detail files if they don't exist
        const templatePath = path.join(__dirname, 'posts', 'template.html');
        if (data.feed && fs.existsSync(templatePath)) {
          data.feed.forEach(item => {
            if (item.link && item.link.startsWith('posts/')) {
              const postPath = path.join(__dirname, item.link);
              if (!fs.existsSync(postPath)) {
                let templateContent = fs.readFileSync(templatePath, 'utf8');
                templateContent = templateContent
                  .replace(/\[Category Tag\]/g, item.categoryLabel || item.category.charAt(0).toUpperCase() + item.category.slice(1))
                  .replace(/\[Publish Date\]/g, item.date)
                  .replace(/\[Title of the Post\]/g, item.title)
                  .replace(/Post Template/g, item.title)
                  .replace(/<p>This is the introductory paragraph of the template\..*?<\/p>/, `<p>${item.description}</p>`);
                fs.writeFileSync(postPath, templateContent, 'utf8');
                console.log(`Auto-generated post detail page: ${postPath}`);
              }
            }
          });
        }

        // 3. Compile all pages in project recursively
        compileAllHtmlFiles(data);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Content saved and pages compiled successfully!' }));
      } catch (err) {
        console.error(err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to compile and save content', details: err.message }));
      }
    });
    return;
  }

  // Photography endpoints
  if (url === '/api/upload-photo' && method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const { filename, data: base64Data } = payload;
        if (!filename || !base64Data) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Filename and base64 data required' }));
          return;
        }

        const buffer = Buffer.from(base64Data, 'base64');
        const assetsDir = path.join(__dirname, 'assets');
        if (!fs.existsSync(assetsDir)) {
          fs.mkdirSync(assetsDir);
        }
        
        fs.writeFileSync(path.join(assetsDir, filename), buffer);

        // Update content.json
        const contentPath = path.join(__dirname, 'content.json');
        const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
        if (!content.photos) content.photos = [];
        
        const photoId = 'photo-' + Date.now();
        const photoSrc = 'assets/' + filename;
        const newPhoto = {
          id: photoId,
          src: photoSrc,
          caption: 'Click to edit caption',
          date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        };
        content.photos.push(newPhoto);
        
        fs.writeFileSync(contentPath, JSON.stringify(content, null, 2), 'utf8');
        compileAllHtmlFiles(content);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, photo: newPhoto }));
      } catch (err) {
        console.error(err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to upload photo', details: err.message }));
      }
    });
    return;
  }

  if (url === '/api/save-photo-caption' && method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const { id, caption } = JSON.parse(body);
        const contentPath = path.join(__dirname, 'content.json');
        const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
        
        if (content.photos) {
          const photo = content.photos.find(p => p.id === id);
          if (photo) {
            photo.caption = caption;
            fs.writeFileSync(contentPath, JSON.stringify(content, null, 2), 'utf8');
            compileAllHtmlFiles(content);
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        console.error(err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to save caption', details: err.message }));
      }
    });
    return;
  }

  if (url === '/api/delete-photo' && method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const { id } = JSON.parse(body);
        const contentPath = path.join(__dirname, 'content.json');
        const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
        
        if (content.photos) {
          const index = content.photos.findIndex(p => p.id === id);
          if (index !== -1) {
            const photo = content.photos[index];
            const filePath = path.join(__dirname, photo.src);
            if (fs.existsSync(filePath)) {
              try {
                fs.unlinkSync(filePath);
              } catch (e) {
                console.error('File delete failed from disk:', e.message);
              }
            }
            content.photos.splice(index, 1);
            fs.writeFileSync(contentPath, JSON.stringify(content, null, 2), 'utf8');
            compileAllHtmlFiles(content);
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        console.error(err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to delete photo', details: err.message }));
      }
    });
    return;
  }

  // Serve static files
  let filePath = path.join(__dirname, url === '/' ? 'index.html' : url.split('?')[0]);
  
  // Security check: ensure path is inside project folder
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // If file doesn't have an extension, try adding .html (clean URLs support)
        if (extname === '') {
          fs.readFile(filePath + '.html', (errHtml, contentHtml) => {
            if (!errHtml) {
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(contentHtml, 'utf-8');
            } else {
              serve404(res);
            }
          });
        } else {
          serve404(res);
        }
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

function serve404(res) {
  res.writeHead(404, { 'Content-Type': 'text/html' });
  res.end('<h1>404 Not Found</h1><p>The requested URL was not found on this server.</p>', 'utf-8');
}

function replaceSection(fileContent, sectionName, newContent) {
  const startTag = `<!-- DEV-EDIT: ${sectionName} -->`;
  const endTag = `<!-- DEV-EDIT-END: ${sectionName} -->`;
  const startIndex = fileContent.indexOf(startTag);
  const endIndex = fileContent.indexOf(endTag);
  
  if (startIndex === -1 || endIndex === -1) {
    return fileContent;
  }
  
  return fileContent.slice(0, startIndex + startTag.length) + '\n' + newContent + '\n' + fileContent.slice(endIndex);
}

// Data compilers
function generateHeroGreeting(data) {
  return `                <span class="hero-greeting reveal-on-load reveal-delay-1">${data.hero.greeting}</span>`;
}

function generateHeroName(data) {
  return `                <h1 class="hero-name reveal-on-load reveal-delay-2">${data.hero.name}</h1>`;
}

function generateHeroIntro(data) {
  return `                <p class="hero-intro-para reveal-on-load reveal-delay-3">\n                    ${data.hero.intro}\n                </p>`;
}

function getPreviewHTML(item) {
  if (item.preview && (item.preview.startsWith('assets/') || item.preview.endsWith('.jpg') || item.preview.endsWith('.png') || item.preview.endsWith('.webp') || item.preview.endsWith('.jpeg'))) {
    return `<img src="${item.preview}" alt="${item.title}" style="width:100%; height:100%; object-fit:cover; display:block;">`;
  }
  // Fallback SVG
  const colors = {
    projects: '#1b2735',
    research: '#1f2c3b',
    poems: '#17212E',
    analysis: '#1c2837'
  };
  const bg = colors[item.category] || '#121A24';
  return `<svg width="100%" height="100%" viewBox="0 0 400 300" style="background:${bg}">
                            <rect width="100%" height="100%" fill="${bg}"/>
                            <line x1="50" y1="50" x2="350" y2="250" stroke="#FAF8F5" stroke-opacity="0.1" stroke-width="2"/>
                            <line x1="350" y1="50" x2="50" y2="250" stroke="#FAF8F5" stroke-opacity="0.1" stroke-width="2"/>
                            <text x="50%" y="52%" font-family="'Cormorant Garamond', serif" font-size="1.5rem" font-style="italic" fill="#FAF8F5" text-anchor="middle" opacity="0.7">${item.title}</text>
                        </svg>`;
}

function generateFeaturedPieces(data) {
  const featured = data.feed.filter(item => item.featured);
  return featured.map((item, idx) => {
    const num = String(idx + 1).padStart(2, '0');
    return `                <!-- Project ${num} -->
                <a href="${item.link}" class="work-card reveal-stagger-item fade-up">
                    <div class="work-card-img-wrap">
                        ${getPreviewHTML(item)}
                    </div>
                    <div class="work-card-info">
                        <span class="work-card-num">${num}</span>
                        <div class="work-card-text">
                            <h3 class="work-card-title">${item.title}</h3>
                            <span class="work-card-category">${item.categoryLabel || item.category}</span>
                            <p class="work-card-desc">${item.featuredDesc || item.description}</p>
                        </div>
                        <div class="work-card-arrow">&rarr;</div>
                    </div>
                </a>`;
  }).join('\n\n');
}

function generateSkills(data) {
  return data.skills.map(skill => `                <div class="skill-item reveal-stagger-item fade-up">
                    <div class="skill-icon-placeholder">${skill.code}</div>
                    <span class="skill-name">${skill.name}</span>
                </div>`).join('\n');
}

function generateContact(data) {
  return `                <div class="contact-row">
                    <span class="contact-label">Email</span>
                    <span class="contact-value"><a href="mailto:${data.contact.email}">${data.contact.email}</a></span>
                </div>
                <div class="contact-row">
                    <span class="contact-label">Location</span>
                    <span class="contact-value">${data.contact.location}</span>
                </div>
                <div class="contact-row">
                    <span class="contact-label">Website</span>
                    <span class="contact-value"><a href="https://${data.contact.website}">${data.contact.website}</a></span>
                </div>`;
}

function generateArchiveRows(data) {
  return data.feed.map(item => {
    return `            <!-- Item: ${item.title} -->
            <article class="archive-row reveal-stagger-item fade-up" data-category="${item.category}" data-preview="${item.preview}">
                <div class="archive-col col-date">${item.date}</div>
                <div class="archive-col col-category">
                    <span class="archive-tag">${item.categoryLabel || item.category.charAt(0).toUpperCase() + item.category.slice(1)}</span>
                </div>
                <div class="archive-col col-content">
                    <h3 class="archive-title"><a href="${item.link}">${item.title}</a></h3>
                    <p class="archive-desc">${item.description}</p>
                </div>
                <div class="archive-col col-action">
                    <a href="${item.link}" class="archive-arrow-link" aria-label="View Work">&rarr;</a>
                </div>
            </article>`;
  }).join('\n\n');
}

function generateContactEmail(data) {
  return `            <a href="mailto:${data.contact.email}" class="cta-email">${data.contact.email}</a>`;
}

function generateContactEmailLink(data) {
  return `                <a href="mailto:${data.contact.email}">Available for projects &rarr;</a>`;
}

function compileAllHtmlFiles(data) {
  const rootFiles = ['index.html', 'about.html', 'archive.html', 'photography.html'];
  const postsDir = path.join(__dirname, 'posts');

  const compileFile = (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    content = replaceSection(content, 'HERO-GREETING', generateHeroGreeting(data));
    content = replaceSection(content, 'HERO-NAME', generateHeroName(data));
    content = replaceSection(content, 'HERO-INTRO', generateHeroIntro(data));
    content = replaceSection(content, 'FEATURED-PIECES', generateFeaturedPieces(data));
    content = replaceSection(content, 'SKILLS', generateSkills(data));
    content = replaceSection(content, 'CONTACT', generateContact(data));
    content = replaceSection(content, 'CONTACT-EMAIL', generateContactEmail(data));
    content = replaceSection(content, 'CONTACT-EMAIL-LINK', generateContactEmailLink(data));
    content = replaceSection(content, 'ARCHIVE-ROWS', generateArchiveRows(data));
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Compiled: ${filePath}`);
    }
  };

  // Compile root files
  rootFiles.forEach(f => {
    const p = path.join(__dirname, f);
    if (fs.existsSync(p)) {
      compileFile(p);
    }
  });

  // Compile posts
  if (fs.existsSync(postsDir)) {
    const files = fs.readdirSync(postsDir);
    files.forEach(f => {
      if (f.endsWith('.html') && f !== 'template.html') {
        compileFile(path.join(postsDir, f));
      }
    });
  }
}

// Compile all HTML files on start to ensure they are fully in sync
try {
  const initialData = JSON.parse(fs.readFileSync(path.join(__dirname, 'content.json'), 'utf8'));
  compileAllHtmlFiles(initialData);
} catch (e) {
  console.error('Initial compilation notice:', e.message);
}

process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]', err.message);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Unhandled Rejection]', reason);
});

server.listen(PORT, () => {
  console.log(`Developer server running at http://localhost:${PORT}`);
});

// Keep event loop alive
setInterval(() => {}, 60000);

