

// service counter js start 
(function () {
  const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
  const prefersReduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function parseValue(text) {
    const t = (text || '').toString().trim();
    const plus = /\+$/.test(t) ? '+' : '';
    const num = parseInt(t.replace(/[^0-9]/g, ''), 10) || 0;
    return { target: num, suffix: plus };
  }

  function formatNumber(n) {
    return Math.round(n).toLocaleString(); // always integer with thousand separator
  }

  function animateCount(el, target, suffix, duration = 1500) {
    if (prefersReduced || duration <= 0) {
      el.textContent = formatNumber(target) + suffix;
      return;
    }

    const start = performance.now();
    const from = 0;

    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = easeOutCubic(t);
      const current = Math.round(from + (target - from) * eased);
      el.textContent = formatNumber(current) + suffix;
      if (t < 1) requestAnimationFrame(frame);
      else el.textContent = formatNumber(target) + suffix;
    }

    requestAnimationFrame(frame);
  }

  function initCounters() {
    const counters = document.querySelectorAll('.counter-card h1');
    counters.forEach(h1 => {
      if (h1.dataset.countInit) return;
      const { target, suffix } = parseValue(h1.textContent);
      h1.dataset.targetValue = target;
      h1.dataset.suffix = suffix;
      h1.textContent = '0' + suffix;
      h1.dataset.countInit = '1';
    });

    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.querySelectorAll('h1').forEach(h1 => {
            if (h1.dataset.counted === '1') return;
            const target = parseInt(h1.dataset.targetValue || '0', 10);
            const suffix = h1.dataset.suffix || '';
            const duration = parseInt(h1.dataset.duration || '1500', 10);
            animateCount(h1, target, suffix, duration);
            h1.dataset.counted = '1';
          });
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.25 });

      document.querySelectorAll('.service-counter').forEach(sec => obs.observe(sec));
    } else {
      // Fallback: start immediately
      counters.forEach(h1 => {
        const target = parseInt(h1.dataset.targetValue || '0', 10);
        const suffix = h1.dataset.suffix || '';
        const duration = parseInt(h1.dataset.duration || '1500', 10);
        animateCount(h1, target, suffix, duration);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCounters);
  } else {
    initCounters();
  }
})();





// marketplaces slider js start 
(function () {
  const track = document.getElementById('marketplacesTrack');
  const slider = document.getElementById('marketplacesSlider');
  if (!track || !slider) return;

  function duplicateOnce() {
    if (track.dataset.duplicated === 'true') return;
    track.innerHTML += track.innerHTML;
    track.dataset.duplicated = 'true';
  }

  function imagesLoaded(parent, cb) {
    const imgs = parent.querySelectorAll('img');
    let total = imgs.length, loaded = 0;
    if (!total) return cb();
    imgs.forEach(img => {
      if (img.complete && img.naturalWidth !== 0) {
        loaded++;
        if (loaded === total) cb();
      } else {
        img.addEventListener('load', () => { loaded++; if (loaded === total) cb(); });
        img.addEventListener('error', () => { loaded++; if (loaded === total) cb(); });
      }
    });
  }

  let pos = 0, trackWidth = 0, lastTime = 0;
  let isDragging = false, pointerId = null, startX = 0, startPos = 0;
  let momentum = 0, hoverPaused = false;

  const style = getComputedStyle(document.documentElement);
  const AUTO_SPEED = parseFloat(style.getPropertyValue('--auto-speed')) || 0.035;

  function normalizePos() {
    if (!trackWidth) return;
    while (pos <= -trackWidth) pos += trackWidth;
    while (pos > 0) pos -= trackWidth;
  }

  function updateTransform() {
    track.style.transform = `translate3d(${pos}px,0,0)`;
  }

  function rafLoop(now) {
    if (!lastTime) lastTime = now;
    const dt = Math.min(40, now - lastTime);
    lastTime = now;

    if (!isDragging && !hoverPaused) {
      if (Math.abs(momentum) > parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--min-momentum') || 0.001)) {
        pos += momentum * dt;
        const decayPerMs = 0.9985;
        momentum *= Math.pow(decayPerMs, dt);
        if (Math.abs(momentum) < 0.0005) momentum = 0;
      } else {
        pos -= AUTO_SPEED * dt;
      }
    }

    normalizePos();
    updateTransform();
    requestAnimationFrame(rafLoop);
  }

  function onPointerDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    try { e.target.setPointerCapture(e.pointerId); } catch (err) { }
    isDragging = true; pointerId = e.pointerId;
    startX = e.clientX; startPos = pos; momentum = 0;
    slider.classList.add('dragging'); e.preventDefault();
  }

  function onPointerMove(e) {
    if (!isDragging || e.pointerId !== pointerId) return;
    const dx = e.clientX - startX; pos = startPos + dx;
    normalizePos(); updateTransform();
    const now = performance.now();
    if (!onPointerMove._lastTime) { onPointerMove._lastTime = now; onPointerMove._lastX = e.clientX; return; }
    const dt = now - onPointerMove._lastTime;
    if (dt > 0) {
      const vx = (e.clientX - onPointerMove._lastX) / dt;
      momentum = vx * 0.9 + momentum * 0.1;
      onPointerMove._lastTime = now; onPointerMove._lastX = e.clientX;
    }
  }

  function endDrag(e) {
    if (!isDragging) return;
    try { e.target.releasePointerCapture(e.pointerId); } catch (err) { }
    isDragging = false; pointerId = null; slider.classList.remove('dragging');
    if (Math.abs(momentum) < 0.0005) momentum = 0;
  }

  slider.addEventListener('mouseenter', () => { hoverPaused = true; });
  slider.addEventListener('mouseleave', () => { hoverPaused = false; });
  slider.addEventListener('pointerdown', onPointerDown, { passive: false });
  window.addEventListener('pointermove', onPointerMove, { passive: false });
  window.addEventListener('pointerup', endDrag, { passive: true });
  window.addEventListener('pointercancel', endDrag, { passive: true });

  function recompute() {
    trackWidth = track.scrollWidth / 2 || 0;
    normalizePos(); updateTransform();
  }
  window.addEventListener('resize', () => { setTimeout(recompute, 50); });

  function initOnce() {
    duplicateOnce();
    imagesLoaded(track, () => {
      recompute(); normalizePos(); lastTime = 0;
      requestAnimationFrame(rafLoop);
    });
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initOnce();
  } else {
    window.addEventListener('DOMContentLoaded', initOnce);
  }
})();

// marketplaces slider js end