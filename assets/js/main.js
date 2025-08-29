

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
