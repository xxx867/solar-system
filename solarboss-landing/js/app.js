/* SolarBoss — рекламная лендинг-страница */

(() => {
  'use strict';

  const VISIT_BOOST = 1346;
  const STATS_URLS = [
    'https://solarboss.ru/stats.json',
    './stats.json',
  ];

  let monthlyVisitsDisplay = null;
  let heroCountersReady = false;
  let visitCounterPromise = null;

  const ambientBase = () => document.querySelector('.ambient-base');
  const ambientGlow = () => document.querySelector('.ambient-glow');

  async function loadMonthlyVisits() {
    for (const url of STATS_URLS) {
      try {
        const res = await fetch(`${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) continue;
        const data = await res.json();
        const base = Number(data.monthlyVisits ?? data.visits ?? data.month);
        if (Number.isFinite(base) && base >= 0) {
          return Math.round(base + VISIT_BOOST);
        }
      } catch {
        /* try next source */
      }
    }

    try {
      const fallback = document.getElementById('stats-fallback');
      if (fallback?.textContent) {
        const data = JSON.parse(fallback.textContent);
        const base = Number(data.monthlyVisits ?? data.visits ?? data.month);
        if (Number.isFinite(base) && base >= 0) {
          return Math.round(base + VISIT_BOOST);
        }
      }
    } catch {
      /* ignore */
    }

    return VISIT_BOOST;
  }

  async function initVisitCounter() {
    const el = document.getElementById('visit-counter');
    if (!el) return;

    monthlyVisitsDisplay = await loadMonthlyVisits();
    if (monthlyVisitsDisplay !== null) {
      el.dataset.count = String(monthlyVisitsDisplay);
      el.textContent = '0';
      if (heroCountersReady) {
        animateSingleCounter(el);
      }
    } else {
      el.textContent = '—';
      el.dataset.count = '0';
    }
  }

  function animateSingleCounter(el) {
    const target = parseInt(el.dataset.count, 10);
    if (!Number.isFinite(target) || target < 0) return;
    const locale = el.dataset.locale === 'true';
    const apply = (value) => {
      el.textContent = formatNum(value, locale);
    };

    if (typeof gsap === 'undefined') {
      apply(target);
      return;
    }

    gsap.to({ val: 0 }, {
      val: target,
      duration: 2.2,
      delay: 0.2,
      ease: 'power2.out',
      onUpdate() {
        apply(Math.round(this.targets()[0].val));
      }
    });
  }

  function initPreloader() {
    const preloader = document.getElementById('preloader');
    window.addEventListener('load', () => {
      setTimeout(() => {
        preloader.classList.add('done');
        initHeroAnimation();
        showFullscreenGate();
      }, 2000);
    });
  }

  function requestFullscreen() {
    if (document.fullscreenElement) return Promise.resolve();
    const el = document.documentElement;
    const req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
    return req ? Promise.resolve(req.call(el)).catch(() => {}) : Promise.resolve();
  }

  function showFullscreenGate() {
    const gate = document.getElementById('fullscreen-gate');
    if (!gate) return;

    gate.classList.add('visible');

    const enter = async () => {
      await requestFullscreen();
      gate.classList.add('hidden');
      document.body.classList.add('is-immersive');
      setTimeout(() => gate.remove(), 800);
    };

    document.getElementById('enter-fullscreen')?.addEventListener('click', enter);
    gate.addEventListener('click', (e) => {
      if (e.target === gate || e.target.closest('.gate-inner')) enter();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'F11') return;
      if (gate.classList.contains('visible') && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        enter();
      }
    });
  }

  function parseHex(hex) {
    const h = hex.replace('#', '');
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ];
  }

  function parseGlow(str) {
    return str.split(',').map(Number);
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function lerpRgb(c1, c2, t) {
    return [
      Math.round(lerp(c1[0], c2[0], t)),
      Math.round(lerp(c1[1], c2[1], t)),
      Math.round(lerp(c1[2], c2[2], t)),
    ];
  }

  function rgbStr(c) {
    return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
  }

  function getSlideTheme(slide) {
    return {
      top: parseHex(slide.dataset.colorTop || '#050810'),
      mid: parseHex(slide.dataset.colorMid || '#0a1020'),
      bottom: parseHex(slide.dataset.colorBottom || '#050810'),
      glow: parseGlow(slide.dataset.glow || '255,159,28'),
    };
  }

  function applyAmbience(theme) {
    const base = ambientBase();
    const glow = ambientGlow();
    if (!base || !glow) return;

    base.style.background = `
      radial-gradient(ellipse 120% 80% at 50% 0%, ${rgbStr(theme.top)} 0%, transparent 55%),
      radial-gradient(ellipse 90% 60% at 80% 50%, ${rgbStr(theme.mid)} 0%, transparent 50%),
      radial-gradient(ellipse 100% 70% at 20% 80%, ${rgbStr(theme.bottom)} 0%, transparent 45%),
      #050810
    `;
    glow.style.background = `
      radial-gradient(ellipse 60% 40% at 50% 40%, rgba(${theme.glow.join(',')}, 0.18) 0%, transparent 70%)
    `;
    document.documentElement.style.setProperty('--ambient-accent', `rgba(${theme.glow.join(',')}, 0.35)`);
  }

  function initColorAmbience() {
    applyAmbience(getSlideTheme(slides[0]));

    const update = () => {
      const scrollY = lenis ? lenis.scroll : window.scrollY;
      let idx = 0;

      for (let i = 0; i < slides.length - 1; i++) {
        const nextTop = slides[i + 1].offsetTop;
        if (scrollY < nextTop - window.innerHeight * 0.15) {
          idx = i;
          break;
        }
        idx = i + 1;
      }

      const current = slides[idx];
      const next = slides[Math.min(idx + 1, slides.length - 1)];
      const start = current.offsetTop;
      const end = next.offsetTop;
      const range = Math.max(end - start, 1);
      const t = idx === slides.length - 1 ? 0 : Math.min(1, Math.max(0, (scrollY - start) / range));

      const a = getSlideTheme(current);
      const b = getSlideTheme(next);

      applyAmbience({
        top: lerpRgb(a.top, b.top, t),
        mid: lerpRgb(a.mid, b.mid, t),
        bottom: lerpRgb(a.bottom, b.bottom, t),
        glow: [
          lerp(a.glow[0], b.glow[0], t),
          lerp(a.glow[1], b.glow[1], t),
          lerp(a.glow[2], b.glow[2], t),
        ],
      });
    };

    if (lenis) {
      lenis.on('scroll', update);
    } else {
      window.addEventListener('scroll', update, { passive: true });
    }
    update();
  }

  function initParticles() {
    setupParticleLayer('particles', { count: 140, speed: 0.2, size: 1.6, warm: 0.35 });
    setupParticleLayer('particles-deep', { count: 60, speed: 0.05, size: 2.8, warm: 0.2, blur: true });
    initShootingStars();
  }

  function setupParticleLayer(id, opts) {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    let w, h;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }

    function createParticles() {
      particles = [];
      const count = Math.min(opts.count, Math.floor(w * h / 10000));
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * opts.size + 0.3,
          vx: (Math.random() - 0.5) * opts.speed,
          vy: (Math.random() - 0.5) * opts.speed,
          alpha: Math.random() * 0.5 + 0.1,
          twinkle: Math.random() * Math.PI * 2,
          warm: Math.random() < opts.warm,
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.twinkle += 0.02;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
        const tw = 0.5 + Math.sin(p.twinkle) * 0.35;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        const a = p.alpha * tw;
        ctx.fillStyle = p.warm
          ? `rgba(255, 200, 120, ${a})`
          : `rgba(180, 210, 255, ${a * 0.8})`;
        ctx.fill();
        if (opts.blur && p.r > 2) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = p.warm
            ? `rgba(255, 150, 60, ${a * 0.15})`
            : `rgba(100, 180, 255, ${a * 0.1})`;
          ctx.fill();
        }
      });
      requestAnimationFrame(draw);
    }

    resize();
    createParticles();
    draw();
    window.addEventListener('resize', () => { resize(); createParticles(); });
  }

  function initShootingStars() {
    const canvas = document.getElementById('shooting-stars');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let stars = [];
    let w, h;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }

    function spawn() {
      if (stars.length < 3 && Math.random() > 0.985) {
        stars.push({
          x: Math.random() * w * 0.6,
          y: Math.random() * h * 0.35,
          len: 100 + Math.random() * 140,
          speed: 10 + Math.random() * 8,
          life: 1,
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      spawn();
      stars.forEach(s => {
        s.x += s.speed;
        s.y += s.speed * 0.35;
        s.life -= 0.018;
        if (s.life <= 0) return;
        const g = ctx.createLinearGradient(s.x, s.y, s.x - s.len, s.y - s.len * 0.35);
        g.addColorStop(0, `rgba(255,240,200,${s.life * 0.9})`);
        g.addColorStop(0.4, `rgba(200,220,255,${s.life * 0.4})`);
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.strokeStyle = g;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.len, s.y - s.len * 0.35);
        ctx.stroke();
      });
      stars = stars.filter(s => s.life > 0);
      requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener('resize', resize);
  }

  function initNavigation() {
    slides = [...document.querySelectorAll('.slide')];
    const navDots = document.querySelector('.nav-dots');
    const menuList = document.querySelector('.menu-list');

    slides.forEach((slide, i) => {
      const title = slide.dataset.title || `Раздел ${i + 1}`;

      const dot = document.createElement('button');
      dot.className = 'nav-dot' + (i === 0 ? ' active' : '');
      dot.dataset.label = title;
      dot.setAttribute('aria-label', title);
      dot.addEventListener('click', () => goToSlide(i));
      navDots.appendChild(dot);

      const li = document.createElement('li');
      li.textContent = title;
      if (i === 0) li.classList.add('active');
      li.addEventListener('click', () => { goToSlide(i); closeMenu(); });
      menuList.appendChild(li);
    });

    document.querySelector('.menu-toggle').addEventListener('click', toggleMenu);
    document.querySelector('.menu-close').addEventListener('click', closeMenu);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
      if (document.getElementById('fullscreen-gate')?.classList.contains('visible')) return;
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goToSlide(Math.min(currentSlide + 1, slides.length - 1));
      }
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        goToSlide(Math.max(currentSlide - 1, 0));
      }
    });

    document.querySelectorAll('[data-goto]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const target = btn.dataset.goto;
        const idx = slides.findIndex(s => s.id === target || s.classList.contains(`slide-${target}`));
        if (idx >= 0) goToSlide(idx);
      });
    });

    document.getElementById('restart-btn')?.addEventListener('click', () => goToSlide(0));
    initScrollObserver();
  }

  function goToSlide(index) {
    if (index < 0 || index >= slides.length) return;
    currentSlide = index;
    const target = slides[index];
    if (lenis) {
      lenis.scrollTo(target, {
        offset: 0,
        duration: 1.8,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });
    } else {
      target.scrollIntoView({ behavior: 'smooth' });
    }
    updateNav(index);
    slides.forEach((s, i) => s.classList.toggle('active', i === index));
    animateSlideContent(target);
  }

  function updateNav(index) {
    document.querySelectorAll('.nav-dot').forEach((d, i) => d.classList.toggle('active', i === index));
    document.querySelectorAll('.menu-list li').forEach((l, i) => l.classList.toggle('active', i === index));
    document.querySelector('.progress-fill').style.width = `${((index + 1) / slides.length) * 100}%`;
  }

  function initScrollObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
          const idx = slides.indexOf(entry.target);
          if (idx >= 0 && idx !== currentSlide) {
            currentSlide = idx;
            updateNav(idx);
            entry.target.classList.add('active');
            animateSlideContent(entry.target);
          }
        }
      });
    }, { threshold: [0.35, 0.5, 0.65], rootMargin: '-10% 0px -10% 0px' });

    slides.forEach(s => observer.observe(s));
  }

  function toggleMenu() {
    document.querySelector('.side-menu').classList.toggle('open');
    document.body.classList.toggle('menu-open');
  }

  function closeMenu() {
    document.querySelector('.side-menu').classList.remove('open');
    document.body.classList.remove('menu-open');
  }

  function initGSAP() {
    gsap.registerPlugin(ScrollTrigger);
    slides.forEach(slide => {
      gsap.set(slide.querySelectorAll('.reveal'), { opacity: 0, y: 40 });
      ScrollTrigger.create({
        trigger: slide,
        start: 'top 70%',
        onEnter: () => animateSlideContent(slide),
        once: true
      });
    });
  }

  function animateSlideContent(slide) {
    if (slide.dataset.animated) return;
    slide.dataset.animated = 'true';

    gsap.to(slide.querySelectorAll('.reveal'), {
      opacity: 1, y: 0,
      duration: 0.9,
      stagger: 0.1,
      ease: 'power3.out'
    });

    if (slide.classList.contains('slide-hero')) {
      animateCounters(slide);
    }
  }

  function initHeroAnimation() {
    heroCountersReady = true;
    gsap.to('.hero-title .line span', {
      y: 0,
      duration: 1.2,
      stagger: 0.15,
      ease: 'power4.out'
    });
    gsap.to('.hero-content .reveal', {
      opacity: 1, y: 0,
      duration: 0.9,
      stagger: 0.12,
      delay: 0.5,
      ease: 'power3.out'
    });

    visitCounterPromise?.then(() => {
      const hero = document.querySelector('.slide-hero');
      hero?.querySelectorAll('.stat-num:not(#visit-counter)').forEach(el => animateSingleCounter(el));
      const visitEl = document.getElementById('visit-counter');
      if (visitEl && monthlyVisitsDisplay !== null) animateSingleCounter(visitEl);
    });
  }

  function formatNum(n, locale) {
    return locale ? n.toLocaleString('ru-RU') : String(n);
  }

  function animateCounters(slide) {
    slide?.querySelectorAll('.stat-num').forEach(el => {
      if (el.id === 'visit-counter') {
        if (monthlyVisitsDisplay !== null) animateSingleCounter(el);
        return;
      }
      animateSingleCounter(el);
    });
  }

  function initLenis() {
    lenis = new Lenis({
      duration: 1.8,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.85,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    lenis.on('scroll', () => {
      if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.update();
    });
  }

  function init() {
    initPreloader();
    initParticles();
    initNavigation();
    visitCounterPromise = initVisitCounter();
    if (typeof Lenis !== 'undefined') initLenis();
    slides = [...document.querySelectorAll('.slide')];
    initColorAmbience();
    if (typeof gsap !== 'undefined') initGSAP();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
