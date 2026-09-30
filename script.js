(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Footer year ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Sticky nav background on scroll ---------- */
  const nav = document.getElementById('nav');
  function updateNavBg() {
    if (window.scrollY > 24) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }
  updateNavBg();
  window.addEventListener('scroll', updateNavBg, { passive: true });

  /* ---------- Mobile menu ---------- */
  const navToggle = document.getElementById('navToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  navToggle.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });
  mobileMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  /* ---------- Active section indicator ---------- */
  const navLinks = document.querySelectorAll('.nav-links a[data-section]');
  const sections = Array.from(navLinks)
    .map((link) => document.getElementById(link.dataset.section))
    .filter(Boolean);

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((link) => {
            link.classList.toggle('active', link.dataset.section === entry.target.id);
          });
        }
      });
    },
    { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
  );
  sections.forEach((s) => sectionObserver.observe(s));

  /* ---------- Scroll reveal (section-level fade + translate) ---------- */
  const revealEls = document.querySelectorAll('[data-reveal]');

  if (prefersReducedMotion) {
    revealEls.forEach((el) => el.classList.add('in'));
  } else {
    // Stagger hero items on load
    const heroReveals = document.querySelectorAll('.hero [data-reveal]');
    heroReveals.forEach((el, i) => {
      setTimeout(() => el.classList.add('in'), 120 + i * 90);
    });

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            if (el.closest('.hero')) return; // already handled on load
            const siblings = Array.from(el.parentElement.children).filter((c) =>
              c.hasAttribute('data-reveal')
            );
            const idx = siblings.indexOf(el);
            setTimeout(() => el.classList.add('in'), idx * 70);
            revealObserver.unobserve(el);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );
    revealEls.forEach((el) => {
      if (!el.closest('.hero')) revealObserver.observe(el);
    });
  }

  /* ---------- Subtle tilt on project media (hover-only, pointer devices) ---------- */
  if (!prefersReducedMotion && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('[data-tilt]').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        el.style.transform = `rotateX(${(-py * 3).toFixed(2)}deg) rotateY(${(px * 3).toFixed(2)}deg)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
      });
    });
  }

  /* ---------- Smooth-scroll offset for sticky nav on hash links ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const y = target.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top: y, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  });
})();
