const http = require('http');
const fs = require('fs');
const path = require('path');

// Permission Check: Only the Project Status Update Request chat (bf8aad43-9f61-4dd1-82f6-6870f754730a) has permission to run this server.
const allowedConversationId = 'bf8aad43-9f61-4dd1-82f6-6870f754730a';
const currentConversationId = process.env.ANTIGRAVITY_CONVERSATION_ID;

if (currentConversationId && currentConversationId !== allowedConversationId) {
  console.error(`Permission Denied: Conversation ID "${currentConversationId}" is not authorized to start or manage this website.`);
  console.error(`Only the Project Status Update Request chat ("${allowedConversationId}") has permissions to turn off and on the website.`);
  process.exit(1);
}

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

        // 2. Compile index.html
        let indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
        indexHtml = replaceSection(indexHtml, 'HERO-GREETING', generateHeroGreeting(data));
        indexHtml = replaceSection(indexHtml, 'HERO-NAME', generateHeroName(data));
        indexHtml = replaceSection(indexHtml, 'HERO-INTRO', generateHeroIntro(data));
        indexHtml = replaceSection(indexHtml, 'FEATURED-PIECES', generateFeaturedPieces(data));
        indexHtml = replaceSection(indexHtml, 'SKILLS', generateSkills(data));
        indexHtml = replaceSection(indexHtml, 'CONTACT', generateContact(data));
        fs.writeFileSync(path.join(__dirname, 'index.html'), indexHtml, 'utf8');

        // 3. Compile archive.html
        if (fs.existsSync(path.join(__dirname, 'archive.html'))) {
          let archiveHtml = fs.readFileSync(path.join(__dirname, 'archive.html'), 'utf8');
          archiveHtml = replaceSection(archiveHtml, 'ARCHIVE-ROWS', generateArchiveRows(data));
          fs.writeFileSync(path.join(__dirname, 'archive.html'), archiveHtml, 'utf8');
        }

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
  return `                <span class="hero-greeting">${data.hero.greeting}</span>`;
}

function generateHeroName(data) {
  return `                <h1 class="hero-name">${data.hero.name}</h1>`;
}

function generateHeroIntro(data) {
  return `                <p class="hero-intro-para">\n                    ${data.hero.intro}\n                </p>`;
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
                <a href="${item.link}" class="work-card">
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
  return data.skills.map(skill => `                <div class="skill-item">
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
            <article class="archive-row" data-category="${item.category}" data-preview="${item.preview}">
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

server.listen(PORT, () => {
  console.log(`Developer server running at http://localhost:${PORT}`);
});
