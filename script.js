(() => {
  const header = document.querySelector('.site-header');
  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('.main-nav');
  const navigationLinks = [...document.querySelectorAll('.main-nav a')];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const closeMenu = () => {
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Открыть меню');
    navigation.classList.remove('open');
    document.body.classList.remove('menu-open');
  };

  menuButton.addEventListener('click', () => {
    const willOpen = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(willOpen));
    menuButton.setAttribute('aria-label', willOpen ? 'Закрыть меню' : 'Открыть меню');
    navigation.classList.toggle('open', willOpen);
    document.body.classList.toggle('menu-open', willOpen);
  });

  navigationLinks.forEach((link) => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && navigation.classList.contains('open')) closeMenu();
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 820) closeMenu();
  });

  const updateHeader = () => header.classList.toggle('scrolled', window.scrollY > 32);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  const sections = navigationLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);
  const updateActiveLink = () => {
    const marker = window.scrollY + 170;
    let current = 'top';
    sections.forEach((section) => {
      if (section.offsetTop <= marker) current = section.id;
    });
    navigationLinks.forEach((link) => {
      const active = link.getAttribute('href') === `#${current}`;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  };
  updateActiveLink();
  window.addEventListener('scroll', updateActiveLink, { passive: true });

  const reveals = [...document.querySelectorAll('.reveal')];
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach((element) => element.classList.add('visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -35px' });
    reveals.forEach((element) => revealObserver.observe(element));
  }

  const lightbox = document.querySelector('#lightbox');
  const lightboxImage = lightbox.querySelector('img');
  const lightboxCaption = lightbox.querySelector('p');
  const lightboxClose = lightbox.querySelector('.lightbox-close');
  let lightboxOrigin = null;

  document.querySelectorAll('.lightbox-trigger').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      lightboxOrigin = trigger;
      lightboxImage.src = trigger.dataset.image;
      lightboxImage.alt = trigger.dataset.caption || 'Увеличенное изображение';
      lightboxCaption.textContent = trigger.dataset.caption || '';
      lightbox.showModal();
    });
  });

  const closeLightbox = () => {
    lightbox.close();
    lightboxImage.src = '';
    lightboxOrigin?.focus();
  };
  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (event) => {
    const box = lightbox.getBoundingClientRect();
    const outside = event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom;
    if (outside) closeLightbox();
  });

  const form = document.querySelector('#request-form');
  const name = document.querySelector('#name');
  const contact = document.querySelector('#contact');
  const status = document.querySelector('#form-status');

  const setError = (field, message) => {
    field.setAttribute('aria-invalid', String(Boolean(message)));
    const error = document.querySelector(`#${field.id}-error`);
    if (error) error.textContent = message;
  };

  const contactLooksValid = (value) => {
    const digits = value.replace(/\D/g, '');
    const isPhone = digits.length >= 7;
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    return isPhone || isEmail;
  };

  const validate = () => {
    const nameValid = name.value.trim().length >= 2;
    const contactValid = contactLooksValid(contact.value.trim());
    setError(name, nameValid ? '' : 'Введите имя — минимум 2 символа.');
    setError(contact, contactValid ? '' : 'Укажите корректный телефон или e-mail.');
    return nameValid && contactValid;
  };

  [name, contact].forEach((field) => {
    field.addEventListener('input', () => {
      if (field.getAttribute('aria-invalid') === 'true') validate();
      status.textContent = '';
      status.className = 'form-status';
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!validate()) {
      status.textContent = 'Проверьте отмеченные поля.';
      status.className = 'form-status invalid';
      form.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }
    status.textContent = 'Поля заполнены корректно. Отправка заявки пока не подключена — позвоните по номеру +7 (343) 213-71-13.';
    status.className = 'form-status valid';
  });

  document.querySelector('#year').textContent = new Date().getFullYear();
})();
