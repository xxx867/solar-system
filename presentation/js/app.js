/* Nissan Skyline — Interactive Presentation */

(() => {
  'use strict';

  const COMPARE_DATA = {
    r32: {
      img: '../images/r32.jpg',
      stats: { power: '280 л.с.', torque: '353 Н·м', weight: '1430 кг', speed: '250 км/ч', accel: '5.2 сек', icon: '★★★★☆' },
      bars: { power: 28, torque: 55, weight: 55, speed: 65, accel: 75, icon: 85 }
    },
    r33: {
      img: '../images/r33.jpg',
      stats: { power: '280 л.с.', torque: '368 Н·м', weight: '1530 кг', speed: '260 км/ч', accel: '5.0 сек', icon: '★★★★☆' },
      bars: { power: 28, torque: 58, weight: 62, speed: 70, accel: 78, icon: 88 }
    },
    r34: {
      img: '../images/r34.jpg',
      stats: { power: '280 л.с.', torque: '400 Н·м', weight: '1560 кг', speed: '280 км/ч', accel: '4.8 сек', icon: '★★★★★' },
      bars: { power: 28, torque: 65, weight: 70, speed: 78, accel: 85, icon: 98 }
    },
    r35: {
      img: '../images/r35_gtr.jpg',
      stats: { power: '570 л.с.', torque: '637 Н·м', weight: '1740 кг', speed: '315 км/ч', accel: '2.9 сек', icon: '★★★★★' },
      bars: { power: 57, torque: 90, weight: 82, speed: 95, accel: 98, icon: 95 }
    }
  };

  let lenis;
  let currentSlide = 0;
  let slides = [];
  let rpmInterval;

  // ===== PRELOADER =====
  function initPreloader() {
    const preloader = document.getElementById('preloader');
    window.addEventListener('load', () => {
      setTimeout(() => {
        preloader.classList.add('done');
        initHeroAnimation();
      }, 2200);
    });
  }

  // ===== PARTICLES =====
  function initParticles() {
    const canvas = document.getElementById('particles');
    const ctx = canvas.getContext('2d');
    let particles = [];
    let w, h;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }

    function createParticles() {
      particles = [];
      const count = Math.min(80, Math.floor(w * h / 15000));
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 1.5 + 0.3,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          alpha: Math.random() * 0.4 + 0.1
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
        ctx.fill();
      });
      requestAnimationFrame(draw);
    }

    resize();
    createParticles();
    draw();
    window.addEventListener('resize', () => { resize(); createParticles(); });
  }

  // ===== NAVIGATION =====
  function initNavigation() {
    slides = [...document.querySelectorAll('.slide')];
    const navDots = document.querySelector('.nav-dots');
    const menuList = document.querySelector('.menu-list');

    slides.forEach((slide, i) => {
      const title = slide.dataset.title || `Слайд ${i + 1}`;

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
      btn.addEventListener('click', () => {
        const target = btn.dataset.goto;
        const idx = slides.findIndex(s => s.classList.contains(`slide-${target}`));
        if (idx >= 0) goToSlide(idx);
      });
    });

    document.getElementById('restart-btn')?.addEventListener('click', () => goToSlide(0));

    initScrollObserver();
  }

  function goToSlide(index) {
    if (index < 0 || index >= slides.length) return;
    currentSlide = index;
    slides[index].scrollIntoView({ behavior: 'smooth' });

    document.querySelectorAll('.nav-dot').forEach((d, i) => d.classList.toggle('active', i === index));
    document.querySelectorAll('.menu-list li').forEach((l, i) => l.classList.toggle('active', i === index));

    const progress = ((index + 1) / slides.length) * 100;
    document.querySelector('.progress-fill').style.width = `${progress}%`;

    slides.forEach((s, i) => s.classList.toggle('active', i === index));
    animateSlideContent(slides[index]);
  }

  function initScrollObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.4) {
          const idx = slides.indexOf(entry.target);
          if (idx >= 0 && idx !== currentSlide) {
            currentSlide = idx;
            document.querySelectorAll('.nav-dot').forEach((d, i) => d.classList.toggle('active', i === idx));
            document.querySelectorAll('.menu-list li').forEach((l, i) => l.classList.toggle('active', i === idx));
            const progress = ((idx + 1) / slides.length) * 100;
            document.querySelector('.progress-fill').style.width = `${progress}%`;
            entry.target.classList.add('active');
            animateSlideContent(entry.target);
          }
        }
      });
    }, { threshold: [0.4] });

    slides.forEach(s => observer.observe(s));
  }

  function toggleMenu() {
    document.querySelector('.side-menu').classList.toggle('open');
  }

  function closeMenu() {
    document.querySelector('.side-menu').classList.remove('open');
  }

  // ===== GSAP ANIMATIONS =====
  function initGSAP() {
    gsap.registerPlugin(ScrollTrigger);

    slides.forEach(slide => {
      const reveals = slide.querySelectorAll('.reveal');
      gsap.set(reveals, { opacity: 0, y: 40 });

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

    const reveals = slide.querySelectorAll('.reveal');
    gsap.to(reveals, {
      opacity: 1, y: 0,
      duration: 0.9,
      stagger: 0.12,
      ease: 'power3.out'
    });

    if (slide.classList.contains('slide-hero')) {
      animateCounters(slide);
    }
    if (slide.classList.contains('slide-engine')) {
      startRpmGauge();
    }
    if (slide.classList.contains('slide-history')) {
      initTimeline(slide);
    }
  }

  function initHeroAnimation() {
    const lines = document.querySelectorAll('.hero-title .line span');
    gsap.to(lines, {
      y: 0,
      duration: 1.2,
      stagger: 0.15,
      ease: 'power4.out'
    });

    gsap.to('.hero-content .reveal', {
      opacity: 1, y: 0,
      duration: 0.9,
      stagger: 0.15,
      delay: 0.6,
      ease: 'power3.out'
    });

    animateCounters(document.querySelector('.slide-hero'));
  }

  function animateCounters(slide) {
    slide.querySelectorAll('.stat-num').forEach(el => {
      const target = parseInt(el.dataset.count, 10);
      gsap.to({ val: 0 }, {
        val: target,
        duration: 2,
        delay: 0.5,
        ease: 'power2.out',
        onUpdate: function () {
          el.textContent = Math.round(this.targets()[0].val);
        }
      });
    });
  }

  // ===== TIMELINE =====
  function initTimeline(slide) {
    const items = slide.querySelectorAll('.timeline-item');
    const progress = slide.querySelector('.timeline-progress');
    let activeIdx = 0;

    function setActive(idx) {
      items.forEach((item, i) => item.classList.toggle('active', i === idx));
      progress.style.width = `${(idx / (items.length - 1)) * 100}%`;
      activeIdx = idx;
    }

    items.forEach((item, i) => {
      item.querySelector('.timeline-dot').addEventListener('click', () => setActive(i));
      item.addEventListener('mouseenter', () => setActive(i));
    });

    let autoInterval = setInterval(() => {
      setActive((activeIdx + 1) % items.length);
    }, 4000);

    slide.addEventListener('mouseenter', () => clearInterval(autoInterval));
  }

  // ===== GEN CARDS FLIP =====
  function initGenCards() {
    document.querySelectorAll('.gen-card').forEach(card => {
      card.addEventListener('click', () => card.classList.toggle('flipped'));

      card.addEventListener('mousemove', (e) => {
        if (card.classList.contains('flipped')) return;
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(1000px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  // ===== RPM GAUGE =====
  function startRpmGauge() {
    const gauge = document.querySelector('.gauge-fill');
    const rpmVal = document.querySelector('.rpm-value');
    if (!gauge || rpmInterval) return;

    const maxDash = 251;
    let rpm = 0;
    let increasing = true;

    rpmInterval = setInterval(() => {
      if (increasing) {
        rpm += Math.random() * 200 + 50;
        if (rpm >= 7500) increasing = false;
      } else {
        rpm -= Math.random() * 300 + 100;
        if (rpm <= 800) increasing = true;
      }
      rpm = Math.max(0, Math.min(8000, rpm));
      const pct = rpm / 8000;
      gauge.style.strokeDashoffset = maxDash - (maxDash * pct);
      rpmVal.textContent = Math.round(rpm / 1000);
    }, 80);
  }

  // ===== COMPARE TABS =====
  function initCompare() {
    const tabs = document.querySelectorAll('.ctab');
    const img = document.getElementById('compare-img');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const model = tab.dataset.model;
        const data = COMPARE_DATA[model];
        if (!data) return;

        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        img.classList.add('switching');
        setTimeout(() => {
          img.src = data.img;
          img.classList.remove('switching');
        }, 200);

        Object.keys(data.stats).forEach(stat => {
          const row = document.querySelector(`.bar-row[data-stat="${stat}"]`);
          if (!row) return;
          row.querySelector('.bar-value').textContent = data.stats[stat];
          row.querySelector('.bar-fill').style.setProperty('--val', `${data.bars[stat]}%`);
        });
      });
    });
  }

  // ===== CULTURE TILT =====
  function initTilt() {
    document.querySelectorAll('[data-tilt]').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(600px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) translateZ(10px)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  // ===== LENIS SMOOTH SCROLL =====
  function initLenis() {
    lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    lenis.on('scroll', () => {
      document.body.classList.add('scrolling');
      clearTimeout(window.scrollTimer);
      window.scrollTimer = setTimeout(() => document.body.classList.remove('scrolling'), 150);
      ScrollTrigger.update();
    });
  }

  // ===== MAGNETIC BUTTONS =====
  function initMagneticButtons() {
    document.querySelectorAll('.btn-primary').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  }

  // ===== INIT =====
  function init() {
    initPreloader();
    initParticles();
    initNavigation();
    initGenCards();
    initCompare();
    initTilt();
    initMagneticButtons();

    if (typeof Lenis !== 'undefined') initLenis();
    if (typeof gsap !== 'undefined') initGSAP();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
