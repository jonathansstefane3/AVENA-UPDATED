// Progressive enhancements: open/closed badge, photo lightbox, scroll reveal, back-to-top button.
(function () {
  'use strict';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Open / closed badge at the top of every footer
  const footer = document.querySelector('.site-footer');
  if (footer && window.AVENA) {
    const badge = document.createElement('p');
    badge.className = 'open-status';
    footer.prepend(badge);
    const update = () => {
      const s = window.AVENA.openStatus();
      badge.textContent = s.text;
      badge.dataset.open = String(s.open);
    };
    update();
    setInterval(update, 60000);
  }

  // Lightbox for the gallery, built on the native <dialog> element
  const gallery = document.getElementById('gallery-list');
  if (gallery && typeof HTMLDialogElement === 'function') {
    const dlg = document.createElement('dialog');
    dlg.className = 'lightbox';
    dlg.setAttribute('aria-label', 'Photo viewer');
    dlg.innerHTML = '<figure><img alt=""><figcaption></figcaption></figure>' +
      '<button class="lb-btn lb-close" aria-label="Close">&times;</button>' +
      '<button class="lb-btn lb-prev" aria-label="Previous photo">&#8249;</button>' +
      '<button class="lb-btn lb-next" aria-label="Next photo">&#8250;</button>';
    document.body.appendChild(dlg);

    const photos = () => [...gallery.querySelectorAll('.photo-btn')];
    let index = 0;
    const show = i => {
      const all = photos();
      index = (i + all.length) % all.length;
      const img = all[index].querySelector('img');
      dlg.querySelector('img').src = img.src;
      dlg.querySelector('img').alt = img.alt;
      dlg.querySelector('figcaption').textContent = all[index].parentElement.querySelector('figcaption').textContent;
    };

    gallery.addEventListener('click', e => {
      const btn = e.target.closest('.photo-btn');
      if (!btn) return;
      show(photos().indexOf(btn));
      dlg.showModal();
    });
    dlg.querySelector('.lb-close').addEventListener('click', () => dlg.close());
    dlg.querySelector('.lb-prev').addEventListener('click', () => show(index - 1));
    dlg.querySelector('.lb-next').addEventListener('click', () => show(index + 1));
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') show(index - 1);
      if (e.key === 'ArrowRight') show(index + 1);
    });
  }

  // Reveal sections as they scroll into view
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    }), { threshold: 0.12 });
    document.querySelectorAll('.section').forEach(s => { s.classList.add('reveal'); io.observe(s); });
  }

  // Back-to-top button
  const top = document.createElement('button');
  top.className = 'to-top';
  top.type = 'button';
  top.setAttribute('aria-label', 'Back to top');
  top.innerHTML = '&uarr;';
  top.hidden = true;
  top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));
  document.body.appendChild(top);
  window.addEventListener('scroll', () => { top.hidden = window.scrollY < 700; }, { passive: true });
})();
