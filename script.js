/* 
   SukritKomalla.com - Interactivity Script
   Handles Mobile Navigation, Combined Filtering/Search, and Hover Previews
*/

document.addEventListener('DOMContentLoaded', () => {
    initMobileNav();
    initArchiveFilters();
    initHoverPreviews();
    initScrollAnimations();
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
                    row.style.display = 'grid';
                    row.style.opacity = '1';
                } else {
                    row.style.display = 'none';
                    row.style.opacity = '0';
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
    const fadeElements = document.querySelectorAll('.work-card, .hero-col-1, .hero-portrait-frame, .hero-col-3');
    
    if ('IntersectionObserver' in window) {
        const observerOptions = {
            threshold: 0.05,
            rootMargin: '0px 0px -30px 0px'
        };

        const scrollObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        fadeElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(15px)';
            el.style.transition = 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)';
            scrollObserver.observe(el);
        });
    } else {
        fadeElements.forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'none';
        });
    }
}
