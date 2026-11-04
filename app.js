// AVENA front end: oat stalk, menu, gallery, forms and mobile nav. Each part runs only on pages that need it.
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const today = new Date().toISOString().slice(0, 10);

  // Oat stalk (home page hero)
  const grains = $('grains');
  if (grains) {
    const NS = 'http://www.w3.org/2000/svg';
    for (let i = 0; i < 9; i++) {
      const y = 60 + i * 38;
      [-1, 1].forEach(side => {
        const e = document.createElementNS(NS, 'ellipse');
        e.setAttribute('cx', 100 + side * 24);
        e.setAttribute('cy', y + (side > 0 ? 18 : 0));
        e.setAttribute('rx', 8);
        e.setAttribute('ry', 22);
        e.setAttribute('transform', `rotate(${side * 28} ${100 + side * 24} ${y})`);
        grains.appendChild(e);
      });
    }
  }

  // Menu: category tabs, text search and dietary filter
  const tabs = document.querySelector('.tabs');
  const list = $('dishes');
  if (tabs && list) {
    const state = { menu: null, cat: null, q: '', tag: '' };
    const chips = document.querySelectorAll('.chips button');

    // Vegan dishes also count as vegetarian
    const matchesTag = i => !state.tag || i.tags.includes(state.tag) || (state.tag === 'vegetarian' && i.tags.includes('vegan'));
    const matchesText = i => !state.q || (i.name + ' ' + i.desc).toLowerCase().includes(state.q);

    function dishEl(item, category) {
      const li = document.createElement('li');
      const title = document.createElement('h3');
      title.textContent = item.name;
      item.tags.concat(category ? [category] : []).forEach(t => {
        const s = document.createElement('span');
        s.className = 'tag';
        s.textContent = t;
        title.appendChild(s);
      });
      const price = document.createElement('span');
      price.className = 'price';
      price.textContent = state.menu.currency + item.price;
      const desc = document.createElement('p');
      desc.textContent = item.desc;
      li.append(title, price, desc);
      return li;
    }

    function render() {
      if (!state.menu) return;
      const searching = Boolean(state.q);
      tabs.querySelectorAll('button').forEach(b => b.setAttribute('aria-selected', String(!searching && b.dataset.id === state.cat)));
      const cats = searching ? state.menu.categories : state.menu.categories.filter(c => c.id === state.cat);
      list.innerHTML = '';
      let count = 0;
      cats.forEach(c => c.items.filter(i => matchesTag(i) && matchesText(i)).forEach(i => {
        list.appendChild(dishEl(i, searching ? c.name : ''));
        count++;
      }));
      if (!count) {
        const li = document.createElement('li');
        li.className = 'empty';
        li.textContent = 'No dishes match. Try a different search or filter.';
        list.appendChild(li);
      }
    }

    let timer;
    const searchBox = $('menu-search');
    if (searchBox) searchBox.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => { state.q = searchBox.value.trim().toLowerCase(); render(); }, 150);
    });
    chips.forEach(chip => chip.addEventListener('click', () => {
      const on = chip.getAttribute('aria-pressed') === 'true';
      chips.forEach(c => c.setAttribute('aria-pressed', 'false'));
      chip.setAttribute('aria-pressed', String(!on));
      state.tag = on ? '' : chip.dataset.tag;
      render();
    }));

    fetch('data/menu.json')
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => {
        state.menu = data;
        state.cat = data.categories[0].id;
        data.categories.forEach(c => {
          const b = document.createElement('button');
          b.type = 'button';
          b.role = 'tab';
          b.dataset.id = c.id;
          b.textContent = c.name;
          b.addEventListener('click', () => {
            state.cat = c.id;
            if (searchBox) searchBox.value = '';
            state.q = '';
            render();
          });
          tabs.appendChild(b);
        });
        render();
      })
      .catch(() => { list.innerHTML = '<li><p>The menu could not load. Refresh the page or ask us in the restaurant.</p></li>'; });
  }

  // Gallery
  const gallery = $('gallery-list');
  if (gallery) {
    fetch('data/gallery.json')
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(items => items.forEach(p => {
        const li = document.createElement('li');
        const fig = document.createElement('figure');
        const img = document.createElement('img');
        img.src = p.src;
        img.alt = p.alt;
        img.width = 800;
        img.height = 600;
        img.loading = 'lazy';
        const cap = document.createElement('figcaption');
        cap.textContent = p.caption;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'photo-btn';
        btn.setAttribute('aria-label', 'View larger: ' + p.alt);
        btn.appendChild(img);
        fig.append(btn, cap);
        li.appendChild(fig);
        gallery.appendChild(li);
      }))
      .catch(() => { gallery.innerHTML = '<li>The gallery could not load.</li>'; });
  }

  // Forms: validate, send to the server, fall back to localStorage on static hosting
  function wireForm(form, statusEl, endpoint, storageKey, check, success) {
    if (!form) return;
    const show = (msg, type) => { statusEl.textContent = msg; statusEl.className = 'status ' + type; };
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      const problem = check(data);
      if (problem) return show(problem, 'error');
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const out = await res.json();
        if (!res.ok) return show(out.error, 'error');
      } catch {
        const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
        saved.push(data);
        localStorage.setItem(storageKey, JSON.stringify(saved));
      }
      show(success(data), 'ok');
      form.reset();
      if (form.elements.guests) form.elements.guests.value = 2;
    });
  }

  const reserve = $('reserve-form');
  const bookingStatus = $('form-status');
  if (reserve) {
    reserve.elements.date.min = today;
    // When a date is chosen, limit the time field to that day's booking hours
    reserve.elements.date.addEventListener('change', () => {
      const r = window.AVENA && window.AVENA.slotRange(reserve.elements.date.value);
      if (!window.AVENA || !reserve.elements.date.value) return;
      if (!r) {
        bookingStatus.textContent = window.AVENA.validateSlot(reserve.elements.date.value, '12:00');
        bookingStatus.className = 'status wide error';
        return;
      }
      reserve.elements.time.min = r.min;
      reserve.elements.time.max = r.max;
      bookingStatus.textContent = `${r.day}s: bookings from ${r.min} to ${r.max}.`;
      bookingStatus.className = 'status wide';
    });
  }
  wireForm(reserve, bookingStatus, '/api/reservations', 'avena-bookings',
    d => {
      if (!d.name.trim() || !d.email || !d.date || !d.time) return 'Fill in your name, email, date and time.';
      if (d.date < today) return 'Choose today or a later date.';
      return window.AVENA ? window.AVENA.validateSlot(d.date, d.time) : '';
    },
    d => `Thanks ${d.name.trim()}. We have your request for ${d.guests} on ${d.date} at ${d.time} and will confirm by email.`);

  wireForm($('contact-form'), $('contact-status'), '/api/messages', 'avena-messages',
    d => (!d.name.trim() || !d.email || d.message.trim().length < 10) ? 'Fill in your name, email and a message of at least 10 characters.' : '',
    d => `Thanks ${d.name.trim()}. We have your message and will reply by email.`);

  // Mobile nav
  const toggle = document.querySelector('.nav-toggle');
  const nav = $('nav');
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  nav.addEventListener('click', e => {
    if (e.target.tagName === 'A') { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
  });

  $('year').textContent = new Date().getFullYear();
})();
