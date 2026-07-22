/* 
   SukritKomalla.com - Interactivity Script
   Handles Mobile Navigation & Archive Item Filtering
*/

document.addEventListener('DOMContentLoaded', () => {
    initMobileNav();
    initArchiveFilters();
    initScrollAnimations();
});

/* Mobile Navigation Drawer */
function initMobileNav() {
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            
            // Toggle animation state for hamburger menu icon (if desired)
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

/* Category Filter for Archive Feed */
function initArchiveFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const archiveItems = document.querySelectorAll('.archive-item');

    if (filterButtons.length > 0 && archiveItems.length > 0) {
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons
                filterButtons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked button
                button.classList.add('active');

                const filterValue = button.getAttribute('data-filter');

                archiveItems.forEach(item => {
                    const itemCategory = item.getAttribute('data-category');
                    
                    if (filterValue === 'all' || itemCategory === filterValue) {
                        // Show matching item
                        item.style.display = 'grid';
                        setTimeout(() => {
                            item.style.opacity = '1';
                            item.style.transform = 'translateY(0)';
                        }, 50);
                    } else {
                        // Hide non-matching item
                        item.style.opacity = '0';
                        item.style.transform = 'translateY(10px)';
                        setTimeout(() => {
                            item.style.display = 'none';
                        }, 300);
                    }
                });
            });
        });
    }
}

/* Simple viewport intersection fade-in animations for elements */
function initScrollAnimations() {
    const fadeElements = document.querySelectorAll('.work-card, .timeline-item, .hero-content, .hero-visual');
    
    // Check if browser supports Intersection Observer
    if ('IntersectionObserver' in window) {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
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
            // Apply initial style state
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.8s cubic-bezier(0.25, 0.8, 0.25, 1), transform 0.8s cubic-bezier(0.25, 0.8, 0.25, 1)';
            
            scrollObserver.observe(el);
        });
    } else {
        // Fallback: make everything visible immediately
        fadeElements.forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'none';
        });
    }
}
