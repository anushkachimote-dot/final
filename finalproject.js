// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

// Load JSON data
let dramaDataset = [];
let filmingLocations = [];

// Async function to fetch JSON data
async function fetchJSON(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error loading ${url}:`, error);
        return null;
    }
}

// Load all data
async function loadAllData() {
    try {
        const [dramaData, locationData] = await Promise.all([
            fetchJSON('kdramadataset.json'),
            fetchJSON('filminglocation.json')
        ]);
        
        if (dramaData) {
            dramaDataset = dramaData;
        }
        
        if (locationData) {
            filmingLocations = locationData;
        }
        
        createBookGallery();
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

loadAllData();

// Drama poster images
const dramaPosterImages = {
    "Goblin": "https://i.pinimg.com/736x/d1/b3/ea/d1b3ea7f2bd231c1d27b3ced7d7f0722.jpg",
    "Our Beloved Summer": "https://image.tmdb.org/t/p/original/bA15g6OLmhQ2HkURRaCztA2jwqI.jpg",
    "Family by choice": "https://i.mydramalist.com/1wKdRb_4c.jpg?v=1",
    "When Life Gives You Tangerines": "https://upload.wikimedia.org/wikipedia/en/thumb/e/e8/When_Life_Gives_You_Tangerines_poster.png/250px-When_Life_Gives_You_Tangerines_poster.png"
};

const targetDramas = ["Goblin", "Our Beloved Summer", "Family by choice", "When Life Gives You Tangerines"];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function preloadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
        img.src = src;
    });
}

async function preloadDramaPosters() {
    const imageUrls = Object.values(dramaPosterImages);
    try {
        await Promise.all(imageUrls.map(url => preloadImage(url)));
        console.log('All drama posters preloaded successfully');
    } catch (error) {
        console.warn('Some images failed to preload:', error);
    }
}

preloadDramaPosters();

// DOM Elements
const cameraContainer = document.getElementById('cameraContainer');
const polaroid = document.getElementById('polaroid');
const developingOverlay = document.getElementById('developingOverlay');
const polaroidImg = polaroid.querySelector('img');
const header = document.querySelector('.header');
const clickInstruction = document.getElementById('clickInstruction');
const cameraSection = document.getElementById('cameraSection');
const introBackground = document.getElementById('introBackground');
const parallaxSection = document.getElementById('parallaxSection');
const bookGallerySection = document.getElementById('bookGallerySection');
const bookOverlay = document.getElementById('bookOverlay');
const closeBookBtn = document.getElementById('closeBookBtn');
const viewMapBtn = document.getElementById('viewMapBtn');
const mapSection = document.getElementById('mapSection');
const backToBookBtn = document.getElementById('backToBookBtn');

const cherryBlossomSection = document.getElementById('cherryBlossomSection');
const petalToggleContainer = document.getElementById('petalToggleContainer');
const petalToggleInput = document.getElementById('petalToggleInput');
const petalsContainer = document.getElementById('petalsContainer');
const fangirlText = document.getElementById('fangirlText');

const slidesContainer = document.getElementById('slidesContainer');
const slideIndicator = document.getElementById('slideIndicator');
const slideDots = document.querySelectorAll('.slide-dot');
const slides = document.querySelectorAll('.slide');

let petalsGenerated = false;
let hasClicked = false;
let cameraVisible = false;
let scrollEnabled = false;
let currentDramaTitle = '';
let map = null;
let markers = [];
let currentSelectedMarker = null;

let currentSlide = 0;
const totalSlides = 4;
let isTransitioning = false;
let slideScrollThreshold = 50;
let slideScrollAccumulator = 0;

// Washi tape images for alternating
const washiTapes = ['images/washi1.png', 'images/washi2.png'];

// ============================================
// SLIDE CONTROLLER
// ============================================

async function goToSlide(slideIndex, animate = true) {
    if (isTransitioning || slideIndex < 0 || slideIndex >= totalSlides) return;
    if (slideIndex === currentSlide) return;
    
    isTransitioning = true;
    const previousSlide = currentSlide;
    currentSlide = slideIndex;
    
    slideDots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlide);
    });
    
    const xOffset = -currentSlide * 100;
    
    if (animate) {
        await gsapToPromise(slidesContainer, {
            x: `${xOffset}vw`,
            duration: 0.8,
            ease: 'power2.inOut'
        });
    } else {
        gsap.set(slidesContainer, { x: `${xOffset}vw` });
    }
    
    await onSlideEnter(currentSlide, previousSlide);
    
    isTransitioning = false;
}

async function onSlideEnter(slideIndex, previousSlide) {
    switch (slideIndex) {
        case 0:
            break;
        case 1:
            petalToggleContainer.classList.add('visible');
            // Show fangirl text only if toggle is not already on
            if (!petalToggleInput.checked) {
                fangirlText.classList.add('visible');
                fangirlText.classList.remove('hidden');
            }
            break;
        case 2:
            petalToggleContainer.classList.remove('visible');
            fangirlText.classList.remove('visible');
            await delay(1000);
            await animateSuitcaseEntrance();
            break;
        case 3:
            await delay(200);
            await animateGalleryEntrance();
            break;
    }
}

async function animateSuitcaseEntrance() {
    const tl = gsap.timeline();
    
    tl.fromTo('.suitcase-container',
        { x: '-100vw', opacity: 1 },
        { x: '0', duration: 1.5, ease: 'back.out(1.4)' }
    );
    
    tl.fromTo('.text-container',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' },
        '-=0.5'
    );
    
    tl.to('.parallax-word', {
        opacity: 1,
        duration: 0.3,
        stagger: 0.1,
        ease: 'power2.out'
    }, '-=0.3');
    
    return new Promise(resolve => { tl.eventCallback('onComplete', resolve); });
}

async function animateGalleryEntrance() {
    const tl = gsap.timeline();
    
    tl.fromTo('.gallery-title',
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
    );
    
    tl.fromTo('.book-wrapper',
        { opacity: 0, y: 80 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.15, ease: 'back.out(1.2)' },
        '-=0.3'
    );
    
    return new Promise(resolve => { tl.eventCallback('onComplete', resolve); });
}

function handleSlideScroll(e) {
    if (!scrollEnabled || isTransitioning) return;
    
    if (currentSlide === 3) {
        const gallerySection = bookGallerySection;
        const scrollTop = gallerySection.scrollTop;
        const scrollHeight = gallerySection.scrollHeight;
        const clientHeight = gallerySection.clientHeight;
        const isScrollable = scrollHeight > clientHeight;
        
        if (isScrollable) {
            if (e.deltaY < 0 && scrollTop <= 0) {
                e.preventDefault();
                slideScrollAccumulator += e.deltaY;
                if (Math.abs(slideScrollAccumulator) >= slideScrollThreshold) {
                    goToSlide(currentSlide - 1);
                    slideScrollAccumulator = 0;
                }
                return;
            }
            if (e.deltaY > 0 && scrollTop + clientHeight >= scrollHeight - 5) {
                return;
            }
            slideScrollAccumulator = 0;
            return;
        }
    }
    
    e.preventDefault();
    slideScrollAccumulator += e.deltaY;
    
    if (Math.abs(slideScrollAccumulator) >= slideScrollThreshold) {
        if (slideScrollAccumulator > 0 && currentSlide < totalSlides - 1) {
            goToSlide(currentSlide + 1);
        } else if (slideScrollAccumulator < 0 && currentSlide > 0) {
            goToSlide(currentSlide - 1);
        }
        slideScrollAccumulator = 0;
    }
}

function handleKeyNavigation(e) {
    if (!scrollEnabled || isTransitioning) return;
    switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
            if (currentSlide < totalSlides - 1) goToSlide(currentSlide + 1);
            break;
        case 'ArrowLeft':
        case 'ArrowUp':
            if (currentSlide > 0) goToSlide(currentSlide - 1);
            break;
    }
}

let touchStartX = 0;
let touchStartY = 0;

function handleTouchStart(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}

function handleTouchEnd(e) {
    if (!scrollEnabled || isTransitioning) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchStartX - touchEndX;
    const deltaY = touchStartY - touchEndY;
    
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX > 0 && currentSlide < totalSlides - 1) {
            goToSlide(currentSlide + 1);
        } else if (deltaX < 0 && currentSlide > 0) {
            goToSlide(currentSlide - 1);
        }
    }
}

slideDots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
        if (scrollEnabled) goToSlide(index);
    });
});

const createPushPinIcon = (color) => {
    return L.divIcon({
        className: 'push-pin-icon',
        html: `
            <div class="push-pin-marker">
                <div class="pin-head ${color}"></div>
                <div class="pin-point"></div>
                <div class="pin-shine"></div>
            </div>
        `,
        iconSize: [30, 40],
        iconAnchor: [15, 40],
        popupAnchor: [0, -35]
    });
};

const defaultIcon = createPushPinIcon('blue');
const pinkIcon = createPushPinIcon('pink');

let introScrollCount = 0;
const introScrollThreshold = 50;

function handleIntroScroll(e) {
    if (cameraVisible) return;
    introScrollCount += Math.abs(e.deltaY);
    if (introScrollCount >= introScrollThreshold) showCamera();
    e.preventDefault();
}

function gsapToPromise(target, vars) {
    return new Promise(resolve => {
        gsap.to(target, { ...vars, onComplete: resolve });
    });
}

async function showCamera() {
    if (cameraVisible) return;
    cameraVisible = true;
    
    window.removeEventListener('wheel', handleIntroScroll);
    
    await gsapToPromise(introBackground, {
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out'
    });
    
    introBackground.style.display = 'none';
    cameraContainer.classList.add('visible');
    
    await gsapToPromise(cameraContainer, {
        y: 0,
        duration: 1.2,
        ease: 'power2.out'
    });
    
    clickInstruction.classList.add('visible');
}

window.addEventListener('wheel', handleIntroScroll, { passive: false });

// ============================================
// CHERRY BLOSSOM
// ============================================

const petalGradients = [
    { start: '#FFB7C5', mid: '#FFC0CB', end: '#FFE4E8' },
    { start: '#FFAABB', mid: '#FFB5C5', end: '#FFDDE5' },
    { start: '#FFC4D0', mid: '#FFD0DC', end: '#FFF0F3' },
];

function createPetalSVG(id, variant) {
    const colors = petalGradients[variant];
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 20 24');
    svg.innerHTML = `
        <defs>
            <linearGradient id="petalGrad${id}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="${colors.start}" />
                <stop offset="50%" stop-color="${colors.mid}" />
                <stop offset="100%" stop-color="${colors.end}" />
            </linearGradient>
        </defs>
        <path d="M10 0 Q20 8 15 16 Q12 22 10 24 Q8 22 5 16 Q0 8 10 0" fill="url(#petalGrad${id})"/>
        <path d="M10 2 Q10 12 10 22" stroke="${colors.start}" stroke-width="0.5" fill="none" opacity="0.4"/>
    `;
    return svg;
}

async function generatePetals() {
    if (petalsGenerated) return;
    petalsGenerated = true;
    
    const PETAL_COUNT = 70;
    const fragment = document.createDocumentFragment();
    
    await new Promise(resolve => {
        requestAnimationFrame(() => {
            for (let i = 0; i < PETAL_COUNT; i++) {
                const petal = {
                    left: Math.random() * 100,
                    animationDuration: Math.random() * 5 + 6,
                    animationDelay: Math.random() * 5,
                    opacity: Math.random() * 0.4 + 0.6,
                    size: Math.random() * 12 + 8,
                    swayAmount: Math.random() * 80 + 30,
                    rotationStart: Math.random() * 360,
                    variant: Math.floor(Math.random() * 3),
                    flutterDuration: 1.5 + Math.random(),
                };

                const petalEl = document.createElement('div');
                petalEl.className = 'petal';
                petalEl.style.left = `${petal.left}%`;
                petalEl.style.width = `${petal.size}px`;
                petalEl.style.height = `${petal.size * 1.2}px`;
                petalEl.style.animationDuration = `${petal.animationDuration}s`;
                petalEl.style.animationDelay = `${petal.animationDelay}s`;
                petalEl.style.setProperty('--petal-opacity', petal.opacity);
                petalEl.style.setProperty('--sway-amount', `${petal.swayAmount}px`);
                petalEl.style.setProperty('--rotation-start', `${petal.rotationStart}deg`);

                const innerEl = document.createElement('div');
                innerEl.className = 'petal-inner';
                innerEl.style.animationDuration = `${petal.flutterDuration}s`;

                const svg = createPetalSVG(i, petal.variant);
                innerEl.appendChild(svg);
                petalEl.appendChild(innerEl);
                fragment.appendChild(petalEl);
            }
            petalsContainer.appendChild(fragment);
            resolve();
        });
    });
}

async function togglePetals(isActive) {
    if (isActive) {
        await generatePetals();
        document.querySelectorAll('.petal').forEach(p => p.classList.add('active'));
    } else {
        document.querySelectorAll('.petal').forEach(p => p.classList.remove('active'));
    }
}

if (petalToggleInput) {
    petalToggleInput.addEventListener('change', async function() {
        await togglePetals(this.checked);
        // Hide fangirl text when toggle is switched on
        if (this.checked) {
            fangirlText.classList.add('hidden');
            fangirlText.classList.remove('visible');
        } else {
            fangirlText.classList.remove('hidden');
            fangirlText.classList.add('visible');
        }
    });
}

// ============================================
// BOOK GALLERY
// ============================================

function createBookGallery() {
    const booksContainer = document.getElementById('booksContainer');
    
    targetDramas.forEach((dramaTitle, index) => {
        const dramaInfo = dramaDataset.find(d => d.Title === dramaTitle);
        if (!dramaInfo) return;

        const imageUrl = dramaPosterImages[dramaTitle];
        
        const bookWrapper = document.createElement('div');
        bookWrapper.className = 'book-wrapper';
        bookWrapper.style.transitionDelay = `${index * 0.2}s`;
        bookWrapper.dataset.drama = dramaTitle;
        
        bookWrapper.innerHTML = `
            <div class="book-main">
                <div class="book-font">
                    <div class="book-cover">
                        <img src="${imageUrl}" alt="${dramaTitle}">
                    </div>
                    <div class="book-cover-back"></div>
                </div>
                <div class="book-page"></div>
                <div class="book-back"></div>
                <div class="book-bone">
                    <h2>${dramaInfo.Title}</h2>
                </div>
                <div class="book-top"></div>
                <div class="book-right"></div>
                <div class="book-bottom"></div>
            </div>
            <div class="book-caption">${dramaInfo.Title}</div>
        `;
        
        bookWrapper.addEventListener('click', () => openBook(dramaTitle));
        booksContainer.appendChild(bookWrapper);
    });
}

// ============================================
// OPEN BOOK - Updated for new structure
// ============================================

function openBook(dramaTitle) {
    currentDramaTitle = dramaTitle;
    const dramaInfo = dramaDataset.find(d => d.Title === dramaTitle);
    if (!dramaInfo) return;

    // Populate left page
    document.getElementById('dramaPoster').src = dramaPosterImages[dramaTitle];
    document.getElementById('diaryDramaTitle').textContent = dramaInfo.Title;
    document.getElementById('dramaYear').textContent = dramaInfo['Year of release'];
    document.getElementById('dramaRating').textContent = dramaInfo.Rating;
    document.getElementById('dramaGenre').textContent = dramaInfo.Genre;
    document.getElementById('dramaDescription').textContent = dramaInfo.Description;
    document.getElementById('dramaCast').textContent = dramaInfo.Actors;

    // Populate right page with filming locations
    const locations = filmingLocations.filter(loc => loc['Drama name'] === dramaTitle).slice(0, 3);
    const locationsList = document.getElementById('locationsList');
    locationsList.innerHTML = '';
    
    locations.forEach((loc, index) => {
        const locationRow = document.createElement('div');
        locationRow.className = 'location-row';
        
        const locationImage = loc['Location Image 1'] || '';
        const hasImage = locationImage && locationImage.trim() !== '';
        
        // Alternate washi tape images
        const washiTape = washiTapes[index % 2];
        
        locationRow.innerHTML = `
            <div class="polaroid-wrapper location-polaroid">
                <div class="washi-tape washi-tape-top">
                    <img src="${washiTape}" alt="Washi Tape">
                </div>
                <div class="small-polaroid ${!hasImage ? 'empty' : ''}">
                    <div class="diary-polaroid-image ${!hasImage ? 'empty-frame' : ''}">
                        ${hasImage ? `<img src="${locationImage}" alt="${loc['Filming locatons']}">` : ''}
                    </div>
                </div>
            </div>
            <div class="location-info">
                <span class="location-label">${loc['Filming locatons']}</span>
                ${loc['Episode number'] ? `<div class="location-episode">📺 ${loc['Episode number']}</div>` : ''}
            </div>
        `;
        
        locationsList.appendChild(locationRow);
    });

    // Empty slots
    const emptySlots = 3 - locations.length;
    for (let i = 0; i < emptySlots; i++) {
        const washiTape = washiTapes[(locations.length + i) % 2];
        const emptyRow = document.createElement('div');
        emptyRow.className = 'location-row';
        emptyRow.innerHTML = `
            <div class="polaroid-wrapper location-polaroid">
                <div class="washi-tape washi-tape-top">
                    <img src="${washiTape}" alt="Washi Tape">
                </div>
                <div class="small-polaroid empty">
                    <div class="diary-polaroid-image empty-frame"></div>
                </div>
            </div>
            <div class="location-info">
                <span class="location-label">More locations coming soon...</span>
            </div>
        `;
        locationsList.appendChild(emptyRow);
    }

    bookOverlay.classList.add('active');
}

function closeBook() {
    bookOverlay.classList.remove('active');
}

closeBookBtn.addEventListener('click', closeBook);

bookOverlay.addEventListener('click', (e) => {
    if (e.target === bookOverlay) closeBook();
});

viewMapBtn.addEventListener('click', async () => {
    bookOverlay.classList.remove('active');
    mapSection.classList.add('active');
    await initMap(currentDramaTitle);
});

backToBookBtn.addEventListener('click', () => {
    mapSection.classList.remove('active');
    bookOverlay.classList.add('active');
    if (currentSelectedMarker) {
        currentSelectedMarker.setIcon(defaultIcon);
        currentSelectedMarker = null;
    }
});

function getLocationImages(location) {
    const images = [];
    if (location['Location Image 1'] && location['Location Image 1'].trim() !== '') {
        images.push(location['Location Image 1']);
    }
    if (location['location image 2'] && location['location image 2'].trim() !== '') {
        images.push(location['location image 2']);
    }
    if (images.length === 0) {
        images.push('https://via.placeholder.com/400x300/FFB6C1/ffffff?text=No+Image+Available');
    }
    return images;
}

function createPostcardPopup(location, dramaTitle) {
    const images = getLocationImages(location);
    const dramaPoster = dramaPosterImages[dramaTitle] || '';
    let currentImageIndex = 0;
    
    const postcardHTML = `
        <div class="postcard-container" id="postcard-${location['Co-ornidates'].replace(/[^a-zA-Z0-9]/g, '')}">
            <div class="postcard-front">
                <div class="postcard-stamps">
                    <div class="postcard-stamp"><img src="images/stamp1.png" alt="Stamp 1"></div>
                    <div class="postcard-stamp"><img src="images/stamp2.png" alt="Stamp 2"></div>
                </div>
                <div class="postcard-address-lines">
                    <div class="address-line">
                        <span class="address-label">TO:</span>
                        <span class="address-text">KDrama Fan</span>
                    </div>
                    <div class="address-line">
                        <span class="address-label"></span>
                        <span class="address-text">${location['Filming locatons']}</span>
                    </div>
                    <div class="address-line">
                        <span class="address-label"></span>
                        <span class="address-text">${location.address}</span>
                    </div>
                </div>
                <div class="postcard-airmail-lines">
                    <div class="airmail-line"></div>
                    <div class="airmail-line"></div>
                    <div class="airmail-line"></div>
                    <div class="airmail-line"></div>
                </div>
                <div class="flip-instruction">✨ Click to flip ✨</div>
            </div>
            <div class="postcard-popup">
                <div class="postcard-left">
                    <div class="postcard-image-container">
                        <img class="postcard-image" src="${images[0]}" alt="${location['Filming locatons']}">
                        ${images.length > 1 ? `
                            <button class="postcard-nav postcard-nav-prev">‹</button>
                            <button class="postcard-nav postcard-nav-next">›</button>
                            <div class="postcard-image-counter">1 / ${images.length}</div>
                        ` : ''}
                    </div>
                </div>
                <div class="postcard-right">
                    <h3 class="postcard-location-name">${location['Filming locatons']}</h3>
                    <p class="postcard-address">${location.address}</p>
                    <p class="postcard-scene">${location['Scene description']}</p>
                    ${location['Episode number'] ? `<p class="postcard-episode">${location['Episode number']}</p>` : ''}
                </div>
            </div>
        </div>
    `;
    
    const container = document.createElement('div');
    container.innerHTML = postcardHTML;
    
    const postcardContainer = container.querySelector('.postcard-container');
    
    // IMPORTANT FIX: Ensure the postcard starts in unflipped state
    postcardContainer.classList.remove('flipped');
    
    if (images.length > 1) {
        const prevBtn = container.querySelector('.postcard-nav-prev');
        const nextBtn = container.querySelector('.postcard-nav-next');
        const img = container.querySelector('.postcard-image');
        const counter = container.querySelector('.postcard-image-counter');
        
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
            img.src = images[currentImageIndex];
            counter.textContent = `${currentImageIndex + 1} / ${images.length}`;
        });
        
        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentImageIndex = (currentImageIndex + 1) % images.length;
            img.src = images[currentImageIndex];
            counter.textContent = `${currentImageIndex + 1} / ${images.length}`;
        });
    }
    
    postcardContainer.addEventListener('click', (e) => {
        if (e.target.closest('.postcard-nav')) return;
        postcardContainer.classList.toggle('flipped');
    });
    
    return container.firstElementChild;
}

async function initMap(dramaTitle) {
    const mapTitle = document.getElementById('mapTitle');
    mapTitle.textContent = `${dramaTitle} - Filming Locations`;

    const locations = filmingLocations.filter(loc => loc['Drama name'] === dramaTitle);
    if (locations.length === 0) return;

    const [lat, lng] = locations[0]['Co-ornidates'].split(',').map(coord => parseFloat(coord.trim()));

    if (!map) {
        map = L.map('map').setView([lat, lng], 10);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
    } else {
        markers.forEach(marker => map.removeLayer(marker));
        markers = [];
        currentSelectedMarker = null;
        map.setView([lat, lng], 10);
    }

    await Promise.all(locations.map(async (loc) => {
        const [lat, lng] = loc['Co-ornidates'].split(',').map(coord => parseFloat(coord.trim()));
        
        const marker = L.marker([lat, lng], { icon: defaultIcon }).addTo(map);
        markers.push(marker);
        
        const postcardElement = createPostcardPopup(loc, dramaTitle);
        
        const popup = L.popup({
            maxWidth: 640,
            minWidth: 580,
            className: 'postcard-popup-container',
            autoPan: true,
            autoPanPadding: [50, 50],
            keepInView: true
        }).setContent(postcardElement);
        
        marker.bindPopup(popup);
        
        marker.on('click', () => {
            if (currentSelectedMarker && currentSelectedMarker !== marker) {
                currentSelectedMarker.setIcon(defaultIcon);
            }
            marker.setIcon(pinkIcon);
            currentSelectedMarker = marker;
        });
        
        marker.on('popupclose', () => {
            const container = postcardElement;
            if (container) container.classList.remove('flipped');
            marker.setIcon(defaultIcon);
            if (currentSelectedMarker === marker) currentSelectedMarker = null;
        });
    }));
    
    if (markers.length > 1) {
        const group = L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

// ============================================
// CAMERA CLICK
// ============================================

cameraContainer.addEventListener('click', function() {
    if (hasClicked) return;
    hasClicked = true;
    
    gsap.to(clickInstruction, {
        opacity: 0,
        duration: 0.3,
        onComplete: () => clickInstruction.classList.add('hidden')
    });
    
    cameraContainer.classList.add('clicked');
    
    gsap.to(cameraContainer, {
        scale: 0.95,
        duration: 0.1,
        yoyo: true,
        repeat: 1
    });

    const tl = gsap.timeline({ onComplete: enableScrolling });

    tl.to(polaroid, {
        top: '-180%',
        opacity: 1,
        duration: 2,
        ease: 'power2.out'
    });

    tl.set(polaroid, { zIndex: 10 }, '-=1.2');

    tl.to(developingOverlay, { opacity: 1, duration: 0.3 }, '-=0.5');
    tl.to(polaroidImg, { opacity: 1, duration: 0.8 }, '-=0.2');
    tl.to(developingOverlay, { opacity: 0, duration: 0.5 }, '-=0.4');

    tl.to('.header-word', {
        opacity: 1,
        duration: 0.4,
        stagger: 0.15,
        ease: 'power2.out'
    }, '+=0.2');

    tl.to(polaroid, {
        y: -10,
        duration: 0.3,
        yoyo: true,
        repeat: 1,
        ease: 'power1.inOut'
    }, '+=0.3');
});

function enableScrolling() {
    scrollEnabled = true;
    slideIndicator.classList.add('visible');
    window.addEventListener('wheel', handleSlideScroll, { passive: false });
    window.addEventListener('keydown', handleKeyNavigation);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    initSlideStates();
}

function initSlideStates() {
    gsap.set('.suitcase-container', { x: '-100vw', opacity: 1 });
    gsap.set('.text-container', { opacity: 0, y: 30 });
    gsap.set('.parallax-word', { opacity: 0 });
    gsap.set('.gallery-title', { opacity: 0, y: 40 });
    gsap.set('.book-wrapper', { opacity: 0, y: 80 });
}


 
//change bg for book gallery 
//map decide
//animation text 
