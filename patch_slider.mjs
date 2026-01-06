
import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

const filePath = path.resolve(process.cwd(), 'index.html');
const content = fs.readFileSync(filePath, 'utf8');
const dom = new JSDOM(content);
const doc = dom.window.document;

// 1. Target the Elementor section
const heroSection = doc.querySelector('.elementor-element-5a53669d');
if (heroSection) {
    // 2. Clear existing broken content (Elementor background overlay, etc)
    // We want to keep the column structure if it holds content on top, 
    // but looking at source, the column seems to be empty or just spacers.
    // However, to be safe, we will prepend our slider as absolute positioned background
    // and ensuring the Section has relative positioning.

    // Actually, user said "make a new slider yourself and put it in that section".
    // The previous analysis showed the section having a background slideshow.
    // Let's wipe the 'data-settings' that causes Elementor to try and build a slider.
    heroSection.removeAttribute('data-settings');

    // Create our custom slider container
    const sliderContainer = doc.createElement('div');
    sliderContainer.className = 'custom-hero-slider';

    const images = [
        'wp-content/uploads/2025/10/Mobile-Laundry-scaled-e1760334798178.jpg',
        'wp-content/uploads/2025/05/Screenshot-2025-05-27-173110-1-1.jpg',
        'wp-content/uploads/2025/12/222Untitled-1.webp',
        'wp-content/uploads/2025/05/20240403_130757-scaled-e1750104382827.jpg'
    ];

    images.forEach((src, index) => {
        const slide = doc.createElement('div');
        slide.className = `custom-slide ${index === 0 ? 'active' : ''}`;
        slide.style.backgroundImage = `url('${src}')`;
        sliderContainer.appendChild(slide);
    });

    // Insert as first child so it sits behind any content
    heroSection.insertBefore(sliderContainer, heroSection.firstChild);
}

// 3. Add Custom CSS and JS
const style = doc.createElement('style');
style.textContent = `
    /* Reset parent section to allow absolute positioning of our slider */
    .elementor-element-5a53669d {
        position: relative !important;
        background: transparent !important; /* Remove any static bg or color */
        overflow: hidden; /* Contain the zoom effect */
    }

    /* Slider Container */
    .custom-hero-slider {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 0; /* Behind content */
    }

    /* Individual Slides */
    .custom-slide {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-size: cover;
        background-position: center center;
        opacity: 0;
        transition: opacity 1.5s ease-in-out;
        z-index: 1;
    }
    
    .custom-slide.active {
        opacity: 1;
        z-index: 2;
        animation: kenBurns 20s infinite alternate; /* Subtle zoom */
    }

    /* Remove Elementor's broken overlays if they still exist */
    .elementor-element-5a53669d .elementor-background-overlay {
        display: none !important;
    }

    @keyframes kenBurns {
        0% { transform: scale(1); }
        100% { transform: scale(1.1); }
    }
`;
doc.head.appendChild(style);

const script = doc.createElement('script');
script.textContent = `
    document.addEventListener('DOMContentLoaded', () => {
        const slides = document.querySelectorAll('.custom-slide');
        let currentSlide = 0;
        
        if(slides.length > 0) {
            setInterval(() => {
                // Remove active from current
                slides[currentSlide].classList.remove('active');
                
                // Move to next
                currentSlide = (currentSlide + 1) % slides.length;
                
                // Add active to next
                slides[currentSlide].classList.add('active');
            }, 5000); // 5 seconds per slide
        }
    });
`;
doc.body.appendChild(script);

fs.writeFileSync(filePath, dom.serialize());
console.log('Injected custom JS slider into index.html');
