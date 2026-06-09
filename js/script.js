/**
 * ================================================================
 * KOICHI PROJECT — Main JavaScript
 * Features: Loader, Navbar, Scroll Animations, Dark Mode
 * ================================================================
 */

'use strict';

// ----------------------------------------------------------------
// 1. UTILITY HELPERS
// ----------------------------------------------------------------

/**
 * Debounce — limits how often a function fires during rapid events
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in ms
 */
function debounce(fn, delay = 100) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Select a single DOM element
 * @param {string} selector
 * @param {Element} [parent=document]
 */
function $(selector, parent = document) {
  return parent.querySelector(selector);
}

/**
 * Select all matching DOM elements
 * @param {string} selector
 * @param {Element} [parent=document]
 */
function $$(selector, parent = document) {
  return [...parent.querySelectorAll(selector)];
}

// ----------------------------------------------------------------
// 2. LOADER
// ----------------------------------------------------------------

/**
 * Hides the full-screen loader with a fade transition.
 * Removes it from DOM after transition to free memory.
 */
function initLoader() {
  const loader = $('#loader');
  if (!loader) return;

  // Minimum display time so animation always completes gracefully
  const MIN_TIME = 1800; // ms
  const startTime = Date.now();

  function hideLoader() {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, MIN_TIME - elapsed);

    setTimeout(() => {
      loader.classList.add('hidden');
      // Remove from DOM after CSS transition ends (0.6s)
      loader.addEventListener('transitionend', () => loader.remove(), { once: true });
      // Unblock scrolling
      document.body.style.overflow = '';
    }, remaining);
  }

  // Block scroll while loading
  document.body.style.overflow = 'hidden';

  if (document.readyState === 'complete') {
    hideLoader();
  } else {
    window.addEventListener('load', hideLoader, { once: true });
  }
}

// ----------------------------------------------------------------
// 3. NAVBAR — Scroll Behavior & Active Link
// ----------------------------------------------------------------

function initNavbar() {
  const navbar  = $('#navbar');
  const trigger = 60; // px scrolled before navbar changes style

  if (!navbar) return;

  // Apply/remove "scrolled" class based on scroll position
  function onScroll() {
    if (window.scrollY > trigger) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    // Highlight active nav link based on current section
    updateActiveLink();
  }

  // Run once on init to set correct state
  onScroll();

  window.addEventListener('scroll', debounce(onScroll, 30), { passive: true });
}

/**
 * Observes sections and highlights corresponding navbar link
 * when that section is in the viewport.
 */
function updateActiveLink() {
  const navLinks = $$('.navbar__link');
  const sections = $$('main section[id]');

  let currentSection = '';

  sections.forEach((section) => {
    const sectionTop = section.getBoundingClientRect().top + window.scrollY;
    if (window.scrollY >= sectionTop - 120) {
      currentSection = section.getAttribute('id');
    }
  });

  navLinks.forEach((link) => {
    const href = link.getAttribute('href').replace('#', '');
    link.classList.toggle('active', href === currentSection);
  });
}

// ----------------------------------------------------------------
// 4. SMOOTH SCROLLING — Anchor Links
// ----------------------------------------------------------------

function initSmoothScroll() {
  const navbarHeight = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue('--navbar-h') || '72',
    10
  );

  // Handle all anchor links across the page
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const targetId = link.getAttribute('href');
    if (targetId === '#') return;

    const target = document.querySelector(targetId);
    if (!target) return;

    e.preventDefault();

    const targetOffset = target.getBoundingClientRect().top + window.scrollY - navbarHeight;

    window.scrollTo({
      top: targetOffset,
      behavior: 'smooth',
    });

    // Close mobile menu if open
    closeMobileMenu();
  });
}

// ----------------------------------------------------------------
// 5. MOBILE MENU — Hamburger Toggle
// ----------------------------------------------------------------

function initMobileMenu() {
  const hamburger  = $('#hamburger');
  const mobileMenu = $('#mobileMenu');

  if (!hamburger || !mobileMenu) return;

  hamburger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.contains('is-open');
    isOpen ? closeMobileMenu() : openMobileMenu();
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    const navbar = $('#navbar');
    if (navbar && !navbar.contains(e.target)) {
      closeMobileMenu();
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMobileMenu();
  });
}

function openMobileMenu() {
  const hamburger  = $('#hamburger');
  const mobileMenu = $('#mobileMenu');
  if (!hamburger || !mobileMenu) return;

  hamburger.classList.add('is-open');
  hamburger.setAttribute('aria-expanded', 'true');
  mobileMenu.classList.add('is-open');
  mobileMenu.setAttribute('aria-hidden', 'false');
}

function closeMobileMenu() {
  const hamburger  = $('#hamburger');
  const mobileMenu = $('#mobileMenu');
  if (!hamburger || !mobileMenu) return;

  hamburger.classList.remove('is-open');
  hamburger.setAttribute('aria-expanded', 'false');
  mobileMenu.classList.remove('is-open');
  mobileMenu.setAttribute('aria-hidden', 'true');
}

// ----------------------------------------------------------------
// 6. SCROLL ANIMATION — Fade-In on Viewport Entry
// ----------------------------------------------------------------

function initScrollAnimations() {
  const elements = $$('.fade-in');
  if (!elements.length) return;

  // Use IntersectionObserver for performance
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        // Stagger sibling elements in the same grid/flex parent
        const parent = entry.target.parentElement;
        const siblings = [...parent.querySelectorAll('.fade-in')];
        const index = siblings.indexOf(entry.target);
        const delay = index * 90; // ms per item

        entry.target.style.transitionDelay = `${delay}ms`;
        entry.target.classList.add('is-visible');

        // Unobserve after animating in
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.12,
      rootMargin: '0px 0px -48px 0px', // trigger slightly before element enters
    }
  );

  elements.forEach((el) => observer.observe(el));
}

// ----------------------------------------------------------------
// 7. DARK MODE TOGGLE
// ----------------------------------------------------------------

function initDarkMode() {
  const toggleBtn = $('#themeToggle');
  const htmlEl = document.documentElement;

  if (!toggleBtn) return;

  // Read saved preference; fall back to OS preference
  const saved = localStorage.getItem('koichi-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = saved || (prefersDark ? 'dark' : 'light');

  applyTheme(initialTheme);

  toggleBtn.addEventListener('click', () => {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    localStorage.setItem('koichi-theme', newTheme);
  });

  // Listen for OS-level preference change
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    // Only react if user hasn't set a manual preference
    if (!localStorage.getItem('koichi-theme')) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });
}

/**
 * Apply a theme by updating the data-theme attribute on body
 * @param {'light'|'dark'} theme
 */
function applyTheme(theme) {
  document.body.setAttribute('data-theme', theme);
}

// ----------------------------------------------------------------
// 8. BUTTON HOVER ENHANCEMENT — Magnetic Effect
// ----------------------------------------------------------------

function initButtonEffects() {
  const buttons = $$('.btn--primary, .btn--outline');

  buttons.forEach((btn) => {
    // Subtle magnetic pull effect on hover
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / rect.width;
      const dy = (e.clientY - cy) / rect.height;

      btn.style.transform = `translate(${dx * 5}px, ${dy * 3}px) translateY(-2px)`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
}

// ----------------------------------------------------------------
// 9. NAVBAR LOGO — Subtle shimmer on hover
// ----------------------------------------------------------------

function initLogoEffect() {
  const logo = $('.navbar__logo');
  if (!logo) return;

  logo.addEventListener('mouseenter', () => {
    const kanji = logo.querySelector('.navbar__logo-kanji');
    if (!kanji) return;
    kanji.style.transform = 'rotate(-10deg) scale(1.2)';
    kanji.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
  });

  logo.addEventListener('mouseleave', () => {
    const kanji = logo.querySelector('.navbar__logo-kanji');
    if (!kanji) return;
    kanji.style.transform = '';
  });
}

// ----------------------------------------------------------------
// 10. SERVICE CARDS — Enhanced keyboard accessibility
// ----------------------------------------------------------------

function initServiceCards() {
  const cards = $$('.service-card[tabindex]');

  cards.forEach((card) => {
    // Allow Enter/Space to trigger the card's hover state visually
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        card.classList.add('is-focused');
        setTimeout(() => card.classList.remove('is-focused'), 200);
      }
    });
  });
}

// ----------------------------------------------------------------
// 11. HERO — Parallax-lite effect on scroll
// ----------------------------------------------------------------

function initHeroParallax() {
  const heroContent = $('.hero__content');
  const heroKanji   = $('.hero__kanji-float');

  if (!heroContent || !heroKanji) return;

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    // Only apply while hero is in view
    if (scrollY > window.innerHeight) return;

    const factor = scrollY * 0.25;
    heroContent.style.transform = `translateY(${factor * 0.4}px)`;
    heroKanji.style.transform   = `translateY(${-factor * 0.6}px) rotate(-3deg)`;
  }, { passive: true });
}

// ----------------------------------------------------------------
// 12. INIT — Run all modules when DOM is ready
// ----------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  initLoader();
  initNavbar();
  initSmoothScroll();
  initMobileMenu();
  initScrollAnimations();
  initDarkMode();
  initButtonEffects();
  initLogoEffect();
  initServiceCards();
  initHeroParallax();

  // Log branding info to console (fun easter egg)
  console.log(
    '%c 幸 Koichi Project %c\nCrafting Your Special Moments\n© 2025 by Arif, Rulli, Lisna & Syifa',
    'background:#E60023;color:#fff;font-size:14px;padding:6px 12px;border-radius:4px;',
    'color:#888;font-size:11px;'
  );
});
