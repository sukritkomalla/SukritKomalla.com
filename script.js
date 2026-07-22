/* 
   SukritKomalla.com - Interactivity Script
   Handles Mobile Navigation, Combined Filtering/Search, and Hover Previews
*/

document.addEventListener('DOMContentLoaded', () => {
    initMobileNav();
    initArchiveFilters();
    initHoverPreviews();
    initScrollAnimations();
    initHeroSpotlight();
    initPhotography();
});

/* Mobile Navigation Drawer */
function initMobileNav() {
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            
            // Toggle animation state for hamburger menu icon
            const spans = menuToggle.querySelectorAll('span');
            if (navLinks.classList.contains('active')) {
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(7px, -8px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
    }
}

/* Category Filter and Search for Archive Feed */
function initArchiveFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const archiveRows = document.querySelectorAll('.archive-row');
    const searchInput = document.getElementById('archiveSearch');

    if (archiveRows.length > 0) {
        let activeFilter = 'all';
        let searchQuery = '';

        function updateRows() {
            archiveRows.forEach(row => {
                const category = row.getAttribute('data-category');
                const title = row.querySelector('.archive-title')?.textContent.toLowerCase() || '';
                const desc = row.querySelector('.archive-desc')?.textContent.toLowerCase() || '';
                
                const matchesFilter = (activeFilter === 'all' || category === activeFilter);
                const matchesSearch = (title.includes(searchQuery) || desc.includes(searchQuery));

                if (matchesFilter && matchesSearch) {
                    row.classList.remove('fade-out-item');
                    row.style.display = 'grid';
                    // Force reflow
                    row.offsetHeight;
                    row.classList.add('fade-in-item');
                } else {
                    row.classList.remove('fade-in-item');
                    row.classList.add('fade-out-item');
                    setTimeout(() => {
                        if (row.classList.contains('fade-out-item')) {
                            row.style.display = 'none';
                        }
                    }, 400);
                }
            });
        }

        if (filterButtons.length > 0) {
            filterButtons.forEach(button => {
                button.addEventListener('click', () => {
                    filterButtons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                    activeFilter = button.getAttribute('data-filter');
                    updateRows();
                });
            });
        }

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                searchQuery = e.target.value.toLowerCase().trim();
                updateRows();
            });
        }
    }
}

/* Hover Preview Card for Archive Rows */
function initHoverPreviews() {
    const archiveRows = document.querySelectorAll('.archive-row');
    const previewCard = document.getElementById('hoverPreviewCard');
    const previewImg = document.getElementById('hoverPreviewImg');

    if (archiveRows.length > 0 && previewCard && previewImg) {
        archiveRows.forEach(row => {
            row.addEventListener('mouseenter', () => {
                const previewSrc = row.getAttribute('data-preview');
                if (previewSrc) {
                    previewImg.src = previewSrc;
                    previewCard.classList.add('active');
                }
            });

            row.addEventListener('mousemove', (e) => {
                const cardWidth = previewCard.offsetWidth || 280;
                const cardHeight = previewCard.offsetHeight || 190;
                
                // Position offset
                let x = e.clientX + 20;
                let y = e.clientY + 20;
                
                // Viewport boundaries check
                if (x + cardWidth > window.innerWidth) {
                    x = e.clientX - cardWidth - 20;
                }
                if (y + cardHeight > window.innerHeight) {
                    y = e.clientY - cardHeight - 20;
                }

                previewCard.style.left = `${x}px`;
                previewCard.style.top = `${y}px`;
            });

            row.addEventListener('mouseleave', () => {
                previewCard.classList.remove('active');
            });
        });
    }
}

/* Viewport Intersection Fade-in Animations */
function initScrollAnimations() {
    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    
    if ('IntersectionObserver' in window) {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -40px 0px'
        };

        const scrollObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    
                    // Trigger staggered reveals for children
                    const staggered = entry.target.querySelectorAll('.reveal-stagger-item');
                    staggered.forEach((item, index) => {
                        item.style.transitionDelay = `${index * 0.08}s`;
                        item.classList.add('revealed');
                    });
                    
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        revealElements.forEach(el => {
            scrollObserver.observe(el);
        });
    } else {
        revealElements.forEach(el => {
            el.classList.add('revealed');
            const staggered = el.querySelectorAll('.reveal-stagger-item');
            staggered.forEach(item => item.classList.add('revealed'));
        });
    }
}

/* Cursor-Tracking Spotlight for Hero Background */
function initHeroSpotlight() {
    const hero = document.querySelector('.hero');
    if (hero) {
        hero.addEventListener('mousemove', (e) => {
            const rect = hero.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            hero.style.setProperty('--mouse-x', `${x}px`);
            hero.style.setProperty('--mouse-y', `${y}px`);
        });
    }
}

/* Photography Journal Logic (Drag, Drop, Paste & Edit Captions) */
function initPhotography() {
    const photoGrid = document.getElementById('photoGrid');
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('fileInput');

    if (!photoGrid || !uploadZone) return;

    // Load and render photos
    loadPhotos();

    // Click to upload
    uploadZone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    // Drag and Drop
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });

    // Copy-Paste anywhere on page
    document.addEventListener('paste', (e) => {
        const items = (e.clipboardData || e.originalEvent.clipboardData).items;
        for (let item of items) {
            if (item.type.indexOf('image') === 0) {
                const file = item.getAsFile();
                handleFiles([file]);
            }
        }
    });

    function loadPhotos() {
        fetch('/api/content')
            .then(res => res.json())
            .then(data => {
                renderPhotos(data.photos || []);
            })
            .catch(() => {
                // Offline fallback - check localStorage
                const cached = localStorage.getItem('sukrit_portfolio_photos');
                renderPhotos(cached ? JSON.parse(cached) : []);
            });
    }

    function renderPhotos(photos) {
        photoGrid.innerHTML = '';
        if (photos.length === 0) {
            photoGrid.innerHTML = '<div style="grid-column: span 3; text-align: center; color: var(--color-text-muted); font-size: 0.9rem; padding: 4rem 2rem;">No photos curated yet. Drag & drop or paste photos to start.</div>';
            return;
        }

        // Save to cache for offline fallback
        localStorage.setItem('sukrit_portfolio_photos', JSON.stringify(photos));

        photos.forEach((photo, index) => {
            const card = document.createElement('div');
            card.className = 'photo-card reveal-stagger-item fade-up';
            card.style.transitionDelay = `${index * 0.05}s`;
            card.innerHTML = `
                <button class="photo-delete-btn" aria-label="Delete Photo">
                    <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                <div class="photo-img-wrap">
                    <img src="${photo.src}" alt="${photo.caption || 'Curated photo'}">
                </div>
                <div class="photo-caption" contenteditable="true" data-placeholder="Edit caption...">${photo.caption || ''}</div>
            `;

            // Delete action
            card.querySelector('.photo-delete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Delete this photo?')) {
                    deletePhoto(photo.id);
                }
            });

            // Save caption on blur
            const captionEl = card.querySelector('.photo-caption');
            captionEl.addEventListener('blur', () => {
                saveCaption(photo.id, captionEl.textContent.trim());
            });

            photoGrid.appendChild(card);
        });

        // Trigger stagger reveal
        setTimeout(() => {
            photoGrid.classList.add('revealed');
            photoGrid.querySelectorAll('.photo-card').forEach(card => card.classList.add('revealed'));
        }, 50);
    }

    function handleFiles(files) {
        if (!files || files.length === 0) return;
        Array.from(files).forEach(file => {
            if (!file.type.startsWith('image/')) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                const base64Data = e.target.result.split(',')[1];
                const filename = Date.now() + '_' + file.name.replace(/\s+/g, '_');
                
                uploadPhoto(filename, base64Data);
            };
            reader.readAsDataURL(file);
        });
    }

    function uploadPhoto(filename, base64Data) {
        fetch('/api/upload-photo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename, data: base64Data })
        })
        .then(res => res.json())
        .then(res => {
            if (res.success) {
                loadPhotos();
            } else {
                alert('Upload failed: ' + res.error);
            }
        })
        .catch(err => {
            console.error(err);
            alert('Could not upload photo to server.');
        });
    }

    function saveCaption(id, caption) {
        fetch('/api/save-photo-caption', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, caption })
        })
        .catch(err => console.error('Failed to save caption:', err));
    }

    function deletePhoto(id) {
        fetch('/api/delete-photo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        })
        .then(res => res.json())
        .then(res => {
            if (res.success) {
                loadPhotos();
            }
        })
        .catch(err => console.error('Failed to delete photo:', err));
    }
}
