# Nishtha Kukreja — Portfolio Site

A single-page, dark/dimensional portfolio site with a Three.js 3D hero, glass-style experience/project cards, and scroll motion — built from the handoff doc (north star, architecture, visual system, and content sections 1–12).

## What's inside

```
index.html          all page content/sections
css/style.css        design tokens + full styling
js/hero-scene.js     Three.js hero scene (floating glass shapes, cursor parallax)
js/script.js         nav, scroll-reveal, mobile menu, active-section highlight, card tilt
assets/hero-fallback.svg   static fallback if WebGL is unavailable
```

No build step — it's plain HTML/CSS/JS with Three.js loaded from a CDN via `importmap`, so you can open `index.html` directly or drop the folder straight onto any static host.

## Before you launch — fill these in

Search the files for these placeholders and swap in your real info:

| Where | What to add |
|---|---|
| `#emailLink` (index.html) | Your real email address |
| `#resumeLink`, `#linkedinLink`, `#contactLinkedin`, `#contactGithub` | Resume PDF link, LinkedIn, GitHub |
| Each `.project-demo-link` / GitHub button | Live demo URL / video, GitHub repo URL, per project |
| `.media-placeholder` divs | Swap for real project screenshots (`<img>` with `alt` text) once you have them |
| `assets/` | Add a headshot or extra imagery if you want one — the design doesn't require it |

These map directly to Section 11 ("Assets Needed") in the handoff doc.

## Running locally

Any static server works, e.g.:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploying (per the handoff's tech recommendation)

The handoff recommends Next.js + Vercel long-term for routing/SEO/CI. This build is intentionally framework-free so it's easy to preview and edit right now; when you're ready to formalize it:

1. **Fastest path (no rewrite):** drag-and-drop this folder into [Vercel](https://vercel.com/new) or Netlify as a static site — works as-is.
2. **Later, if you want Next.js:** the sections in `index.html` map cleanly to components (`Hero`, `About`, `ExperienceCard`, `ProjectCard`, `Skills`, `Contact`) — port the JSX structure and keep `css/style.css` as global styles or convert to Tailwind using the same tokens.

## Design notes

- **Palette:** near-black base (`--void`) with a purple → blue → cyan gradient as the single recurring accent, plus a pink used sparingly (leadership pill, warm gradient variant). Neon is decorative, not a required signal — all text passes contrast independent of accent color.
- **Type:** Sora for display/headings, Inter for body, JetBrains Mono for small labels (eyebrow, dates, tags) — a deliberate technical touch rather than mixing many families.
- **3D:** concentrated in the hero only (per spec) — floating icosahedron/octahedron/torus/tetrahedron "crystal" shapes, one thin orbit ring, a light particle field. Idle rotation + ~6° cursor parallax, never a free camera. Pauses via `IntersectionObserver` when scrolled out of view, and falls back to a static SVG if WebGL isn't available.
- **Motion:** one staggered reveal on hero load; scroll-triggered fade + 18px translate on cards further down, respecting `prefers-reduced-motion` throughout (motion is fully disabled, not just shortened).
- **Cards:** 20px radius, translucent gradient surface, soft shadow, 6px lift + border glow on hover — content (bullets, tags, links) always visible without hovering.
- **Accessibility:** skip link, visible focus rings, semantic headings, alt-text placeholders on project media, keyboard-operable nav and mobile menu, decorative 3D marked `aria-hidden`.

## Still to do (per the handoff's build checklist)

- [ ] Swap all placeholder links/media for real ones (table above)
- [ ] Verify experience bullets/dates against your final resume
- [ ] Test on Chrome/Safari/Firefox + iPhone + common desktop widths
- [ ] Run Lighthouse and address any performance/accessibility flags
- [ ] Connect your custom domain once deployed
