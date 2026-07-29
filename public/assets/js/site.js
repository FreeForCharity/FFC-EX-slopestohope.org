/*!
 * Slopes to Hope - native widget behaviour.
 *
 * The static site is cloned from a WordPress/Elementor install, but none of the
 * Elementor, Essential Addons or ElementsKit JavaScript is shipped. Those
 * runtimes fetch content-hashed webpack chunks whose URLs are assembled in
 * JavaScript, so a static mirror can never reliably capture them - a missing
 * chunk is what left the "pounds distributed" counter frozen at 0 in
 * production.
 *
 * Everything those plugins actually did on this site is reimplemented here in
 * dependency-free JavaScript against the markup and CSS the clone already
 * ships. No jQuery, no plugin runtime, nothing to 404.
 *
 * Covered: counters, circular progress rings, horizontal progress bars,
 * section background slideshows, the image lightbox, and scroll-to-top.
 */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Run `fn` once the element first scrolls into view. */
  function whenVisible(el, fn, threshold) {
    if (!('IntersectionObserver' in window)) { fn(); return; }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        obs.unobserve(entry.target);
        fn();
      });
    }, { threshold: threshold || 0.25 });
    obs.observe(el);
  }

  /** Animate 0..1 over `duration`, easing out. Calls `step` each frame. */
  function animate(duration, step) {
    if (reduceMotion || !duration || !window.requestAnimationFrame) {
      step(1);
      return;
    }
    var start = null;
    function frame(now) {
      if (start === null) start = now;
      var p = Math.min((now - start) / duration, 1);
      step(1 - (1 - p) * (1 - p)); // easeOutQuad
      if (p < 1) window.requestAnimationFrame(frame);
    }
    window.requestAnimationFrame(frame);
  }

  function groupDigits(value, delimiter) {
    var text = String(Math.round(value));
    return delimiter ? text.replace(/\B(?=(\d{3})+(?!\d))/g, delimiter) : text;
  }

  /* ------------------------------------------------------------- counters */

  function initCounters() {
    var nodes = document.querySelectorAll('.elementor-counter-number[data-to-value]');
    Array.prototype.forEach.call(nodes, function (el) {
      var to = parseFloat(el.getAttribute('data-to-value'));
      if (isNaN(to)) return;

      var from = parseFloat(el.getAttribute('data-from-value'));
      if (isNaN(from)) from = 0;
      var duration = parseInt(el.getAttribute('data-duration'), 10);
      if (isNaN(duration) || duration < 0) duration = 2000;
      var delimiter = el.getAttribute('data-delimiter') || '';

      whenVisible(el, function () {
        animate(duration, function (t) {
          el.textContent = groupDigits(from + (to - from) * t, delimiter);
        });
      });
    });
  }

  /* ----------------------------------------------- circular progress rings */

  /**
   * Essential Addons draws its rings by rotating two clipped half-circles.
   * That technique depends on plugin JS we no longer ship, so the ring is
   * redrawn as an SVG arc instead: one element, exact percentages, and no
   * reliance on clip-path behaviour.
   *
   * Colours and geometry are read from the computed styles the cloned CSS
   * already provides, so the ring keeps the design it was given.
   */
  function initCircleBars() {
    var bars = document.querySelectorAll('.eael-progressbar-circle');
    Array.prototype.forEach.call(bars, function (bar) {
      var pct = parseFloat(bar.getAttribute('data-count'));
      if (isNaN(pct)) return;
      pct = Math.max(0, Math.min(100, pct));

      var duration = parseInt(bar.getAttribute('data-duration'), 10);
      if (isNaN(duration) || duration < 0) duration = 2000;

      var pie = bar.querySelector('.eael-progressbar-circle-pie');
      var track = bar.querySelector('.eael-progressbar-circle-inner');
      var half = bar.querySelector('.eael-progressbar-circle-half');
      if (!track) return;

      var trackStyle = window.getComputedStyle(track);
      var width = parseFloat(trackStyle.borderTopWidth) || 12;
      var trackColor = trackStyle.borderTopColor || '#eee';
      var fillColor = half
        ? window.getComputedStyle(half).borderTopColor
        : trackColor;

      var size = bar.offsetWidth || 200;
      var r = (size - width) / 2;
      var circumference = 2 * Math.PI * r;

      // The plugin's half-circles are the old rendering path; hide them and
      // let the track element show through as the unfilled portion.
      if (pie) pie.style.display = 'none';

      var NS = 'http://www.w3.org/2000/svg';
      var svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('viewBox', '0 0 ' + size + ' ' + size);
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
      // Sits above the grey track ring but below the centred label, so the arc
      // is visible and the text stays readable.
      svg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;' +
        'transform:rotate(-90deg);overflow:visible;z-index:1';

      var arc = document.createElementNS(NS, 'circle');
      arc.setAttribute('cx', size / 2);
      arc.setAttribute('cy', size / 2);
      arc.setAttribute('r', r);
      arc.setAttribute('fill', 'none');
      arc.setAttribute('stroke', fillColor);
      arc.setAttribute('stroke-width', width);
      arc.setAttribute('stroke-linecap', 'butt');
      arc.setAttribute('stroke-dasharray', circumference);
      arc.setAttribute('stroke-dashoffset', circumference);
      svg.appendChild(arc);
      bar.insertBefore(svg, bar.firstChild);

      // The track is a plain ring; the SVG arc sits on top of it.
      track.style.position = 'absolute';
      track.style.top = '0';
      track.style.left = '0';
      track.style.zIndex = '0';

      var content = bar.querySelector('.eael-progressbar-circle-inner-content');
      if (content) content.style.zIndex = '2';

      var countEl = bar.querySelector('.eael-progressbar-count');
      var countWrap = bar.querySelector('.eael-progressbar-count-wrap');
      // Only animate the numeric readout if the widget was configured to show
      // it; these widgets display a title instead, and forcing the percentage
      // on would print "100%" over the label.
      var showCount = countWrap && countWrap.style.display !== 'none';

      bar.setAttribute('role', 'progressbar');
      bar.setAttribute('aria-valuemin', '0');
      bar.setAttribute('aria-valuemax', '100');
      bar.setAttribute('aria-valuenow', String(pct));

      whenVisible(bar, function () {
        animate(duration, function (t) {
          var current = pct * t;
          arc.setAttribute('stroke-dashoffset', circumference * (1 - current / 100));
          if (showCount && countEl) countEl.textContent = Math.round(current);
        });
      });
    });
  }

  /* --------------------------------------------- horizontal progress bars */

  function initSkillBars() {
    var bars = document.querySelectorAll('.elementskit-progressbar, .eael-progressbar-line');
    Array.prototype.forEach.call(bars, function (bar) {
      var label = bar.querySelector('.number-percentage, .eael-progressbar-count');
      var track = bar.querySelector('.skill-track, .eael-progressbar-line-fill');
      var target = label && parseFloat(label.getAttribute('data-value'));
      if (isNaN(target)) target = parseFloat(bar.getAttribute('data-count'));
      if (isNaN(target)) return;

      bar.setAttribute('role', 'progressbar');
      bar.setAttribute('aria-valuemin', '0');
      bar.setAttribute('aria-valuemax', '100');
      bar.setAttribute('aria-valuenow', String(target));

      whenVisible(bar, function () {
        animate(1500, function (t) {
          var current = target * t;
          if (track) track.style.width = current + '%';
          if (label) label.textContent = current.toFixed(current < 10 ? 1 : 0);
        });
      });
    });
  }

  /* ------------------------------------------------- background slideshow */

  /**
   * Elementor sections can carry a background slideshow described as escaped
   * JSON in data-settings. Recreate the cross-fade with stacked layers.
   */
  function initBackgroundSlideshows() {
    var sections = document.querySelectorAll('[data-settings]');
    Array.prototype.forEach.call(sections, function (section) {
      var settings;
      try {
        settings = JSON.parse(section.getAttribute('data-settings'));
      } catch (err) {
        return;
      }
      var gallery = settings && settings.background_slideshow_gallery;
      if (!gallery || !gallery.length) return;

      var duration = parseInt(settings.background_slideshow_slide_duration, 10) || 5000;
      var fade = parseInt(settings.background_slideshow_transition_duration, 10) || 500;

      var host = document.createElement('div');
      host.className = 'sth-bg-slideshow';
      host.setAttribute('aria-hidden', 'true');
      host.style.cssText = 'position:absolute;inset:0;overflow:hidden;z-index:0;pointer-events:none';

      var layers = gallery.map(function (item, i) {
        var layer = document.createElement('div');
        layer.style.cssText = 'position:absolute;inset:0;background-size:cover;' +
          'background-position:center;transition:opacity ' + fade + 'ms ease-in-out;' +
          'opacity:' + (i === 0 ? 1 : 0);
        layer.style.backgroundImage = 'url("' + item.url + '")';
        host.appendChild(layer);
        return layer;
      });

      if (window.getComputedStyle(section).position === 'static') {
        section.style.position = 'relative';
      }
      section.insertBefore(host, section.firstChild);

      // Keep the section's own children above the slideshow layers.
      Array.prototype.forEach.call(section.children, function (child) {
        if (child === host) return;
        if (window.getComputedStyle(child).position === 'static') {
          child.style.position = 'relative';
        }
      });

      if (layers.length < 2 || reduceMotion) return;

      var index = 0;
      setInterval(function () {
        layers[index].style.opacity = '0';
        index = (index + 1) % layers.length;
        layers[index].style.opacity = '1';
      }, duration);
    });
  }

  /* ------------------------------------------------------------- lightbox */

  /**
   * Replaces Elementor's lightbox for gallery images. Anchors already carry the
   * full-size href, a slideshow group and a title, so grouping and captions
   * come straight from the existing markup.
   */
  function initLightbox() {
    var links = document.querySelectorAll('a[data-elementor-open-lightbox="yes"][href]');
    if (!links.length) return;

    var groups = {};
    Array.prototype.forEach.call(links, function (link) {
      var group = link.getAttribute('data-elementor-lightbox-slideshow') || 'default';
      (groups[group] = groups[group] || []).push(link);
    });

    var overlay, imgEl, captionEl, current = [], index = 0, lastFocus = null;

    function build() {
      overlay = document.createElement('div');
      overlay.className = 'sth-lightbox';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-label', 'Image viewer');
      overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;display:none;' +
        'align-items:center;justify-content:center;background:rgba(0,0,0,.9)';

      overlay.innerHTML =
        '<button type="button" data-act="close" aria-label="Close" style="position:absolute;top:16px;right:20px;font-size:34px;line-height:1;background:none;border:0;color:#fff;cursor:pointer">&times;</button>' +
        '<button type="button" data-act="prev" aria-label="Previous image" style="position:absolute;left:16px;top:50%;transform:translateY(-50%);font-size:40px;line-height:1;background:none;border:0;color:#fff;cursor:pointer">&#8249;</button>' +
        '<button type="button" data-act="next" aria-label="Next image" style="position:absolute;right:16px;top:50%;transform:translateY(-50%);font-size:40px;line-height:1;background:none;border:0;color:#fff;cursor:pointer">&#8250;</button>' +
        '<figure style="margin:0;max-width:92vw;max-height:90vh;text-align:center">' +
        '<img alt="" style="max-width:92vw;max-height:80vh;object-fit:contain;display:block;margin:0 auto">' +
        '<figcaption style="color:#fff;padding-top:12px;font-size:15px"></figcaption>' +
        '</figure>';

      imgEl = overlay.querySelector('img');
      captionEl = overlay.querySelector('figcaption');
      document.body.appendChild(overlay);

      overlay.addEventListener('click', function (e) {
        var act = e.target.getAttribute && e.target.getAttribute('data-act');
        if (act === 'close' || e.target === overlay) close();
        else if (act === 'prev') show(index - 1);
        else if (act === 'next') show(index + 1);
      });

      document.addEventListener('keydown', function (e) {
        if (overlay.style.display === 'none') return;
        if (e.key === 'Escape') close();
        else if (e.key === 'ArrowLeft') show(index - 1);
        else if (e.key === 'ArrowRight') show(index + 1);
      });
    }

    function show(i) {
      if (!current.length) return;
      index = (i + current.length) % current.length;
      var link = current[index];
      imgEl.src = link.getAttribute('href');
      var title = link.getAttribute('data-elementor-lightbox-title') || '';
      captionEl.textContent = title;
      imgEl.alt = title;
      var multiple = current.length > 1;
      overlay.querySelector('[data-act="prev"]').style.display = multiple ? '' : 'none';
      overlay.querySelector('[data-act="next"]').style.display = multiple ? '' : 'none';
    }

    function open(group, link) {
      if (!overlay) build();
      lastFocus = document.activeElement;
      current = groups[group] || [link];
      overlay.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      show(current.indexOf(link));
      overlay.querySelector('[data-act="close"]').focus();
    }

    function close() {
      overlay.style.display = 'none';
      document.body.style.overflow = '';
      imgEl.src = '';
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    Array.prototype.forEach.call(links, function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        open(link.getAttribute('data-elementor-lightbox-slideshow') || 'default', link);
      });
    });
  }

  /* -------------------------------------------------------- scroll to top */

  function initScrollToTop() {
    var btn = document.querySelector('.eael-ext-scroll-to-top-button, #eael-scroll-to-top');
    if (!btn) return;
    function sync() {
      btn.style.display = window.pageYOffset > 300 ? 'block' : 'none';
    }
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
    window.addEventListener('scroll', sync, { passive: true });
    sync();
  }

  /* --------------------------------------------------------- site loader */

  /**
   * The theme covers the page with a full-screen `.site-loader` overlay at
   * z-index 999991 and only clears it from jQuery on window load. Any resource
   * that stalls - a third-party tag, a slow analytics script - therefore leaves
   * the entire site hidden behind a blank panel.
   *
   * Clear it unconditionally as soon as the DOM is ready. The overlay is purely
   * cosmetic, and no failure mode should be able to hide the whole site.
   */
  function clearSiteLoader() {
    var loaders = document.querySelectorAll('.site-loader');
    Array.prototype.forEach.call(loaders, function (el) {
      el.classList.add('loaded');
      el.style.display = 'none';
    });
  }

  /* ----------------------------------------------------------------- boot */

  function boot() {
    clearSiteLoader();
    initCounters();
    initCircleBars();
    initSkillBars();
    initBackgroundSlideshows();
    initLightbox();
    initScrollToTop();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
