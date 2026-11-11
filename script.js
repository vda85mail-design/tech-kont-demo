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

  const serviceStrip = document.querySelector('.service-strip');
  if (serviceStrip) {
    const serviceItems = [...serviceStrip.querySelectorAll('.service-item')];
    const serviceTooltip = document.createElement('div');
    serviceTooltip.id = 'service-tooltip';
    serviceTooltip.className = 'service-tooltip';
    serviceTooltip.setAttribute('role', 'tooltip');
    serviceTooltip.setAttribute('aria-hidden', 'true');
    document.body.append(serviceTooltip);

    let activeService = null;

    const positionServiceTooltip = () => {
      if (!activeService) return;
      const itemRect = activeService.getBoundingClientRect();
      const halfWidth = serviceTooltip.offsetWidth / 2;
      const center = Math.min(
        window.innerWidth - halfWidth - 12,
        Math.max(halfWidth + 12, itemRect.left + itemRect.width / 2),
      );
      serviceTooltip.style.left = `${center}px`;
      serviceTooltip.style.top = `${itemRect.bottom + 10}px`;
    };

    const showServiceTooltip = (item) => {
      activeService?.removeAttribute('aria-describedby');
      activeService = item;
      serviceTooltip.textContent = item.dataset.serviceDescription || '';
      serviceTooltip.setAttribute('aria-hidden', 'false');
      serviceTooltip.classList.add('is-visible');
      item.setAttribute('aria-describedby', serviceTooltip.id);
      positionServiceTooltip();
    };

    const hideServiceTooltip = () => {
      activeService?.removeAttribute('aria-describedby');
      activeService = null;
      serviceTooltip.classList.remove('is-visible');
      serviceTooltip.setAttribute('aria-hidden', 'true');
    };

    serviceItems.forEach((item) => {
      item.addEventListener('mouseenter', () => showServiceTooltip(item));
      item.addEventListener('focus', () => showServiceTooltip(item));
    });
    serviceStrip.addEventListener('mouseleave', hideServiceTooltip);
    serviceStrip.addEventListener('focusout', (event) => {
      if (!serviceStrip.contains(event.relatedTarget)) hideServiceTooltip();
    });
    window.addEventListener('resize', positionServiceTooltip);
    window.addEventListener('scroll', positionServiceTooltip, { passive: true });
  }

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
  const lightboxPrevious = lightbox.querySelector('.lightbox-prev');
  const lightboxNext = lightbox.querySelector('.lightbox-next');
  const lightboxCounter = lightbox.querySelector('.lightbox-counter');
  const lightboxStage = lightbox.querySelector('.lightbox-stage');
  const lightboxTriggers = [...document.querySelectorAll('.lightbox-trigger')];
  const galleryTriggers = [...document.querySelectorAll('#gallery .lightbox-trigger')];
  let lightboxOrigin = null;
  let galleryIndex = -1;
  let touchStartX = null;
  let touchStartY = null;
  let touchCurrentX = null;
  let touchCurrentY = null;
  let horizontalSwipeActive = false;

  const resetTouchState = () => {
    touchStartX = null;
    touchStartY = null;
    touchCurrentX = null;
    touchCurrentY = null;
    horizontalSwipeActive = false;
  };

  const renderLightbox = (trigger) => {
    const sourceImage = trigger.querySelector('img');
    const isGalleryImage = galleryIndex >= 0;
    const isWatermarkedPhoto = trigger.matches('.lightbox-trigger');
    lightboxImage.src = trigger.dataset.image;
    lightboxImage.alt = sourceImage?.alt || trigger.dataset.caption || 'Увеличенное изображение';
    lightboxStage.classList.toggle('is-watermarked', isWatermarkedPhoto);
    lightboxCaption.textContent = trigger.dataset.caption || '';
    lightboxPrevious.hidden = !isGalleryImage;
    lightboxNext.hidden = !isGalleryImage;
    lightboxCounter.hidden = !isGalleryImage;
    lightboxCounter.textContent = isGalleryImage ? `${galleryIndex + 1} из ${galleryTriggers.length}` : '';
  };

  const showGalleryImage = (index) => {
    if (!galleryTriggers.length) return;
    galleryIndex = (index + galleryTriggers.length) % galleryTriggers.length;
    renderLightbox(galleryTriggers[galleryIndex]);
  };

  lightboxTriggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      lightboxOrigin = trigger;
      galleryIndex = galleryTriggers.indexOf(trigger);
      renderLightbox(trigger);
      lightbox.showModal();
      document.documentElement.classList.add('lightbox-open');
      document.body.classList.add('lightbox-open');
      lightboxClose.focus();
    });
  });

  const closeLightbox = () => {
    if (lightbox.open) lightbox.close();
  };
  const resetLightbox = () => {
    lightboxImage.removeAttribute('src');
    lightboxStage.classList.remove('is-watermarked');
    lightboxOrigin?.focus();
    lightboxOrigin = null;
    galleryIndex = -1;
    resetTouchState();
    document.documentElement.classList.remove('lightbox-open');
    document.body.classList.remove('lightbox-open');
  };

  lightboxClose.addEventListener('click', closeLightbox);
  lightboxPrevious.addEventListener('click', () => showGalleryImage(galleryIndex - 1));
  lightboxNext.addEventListener('click', () => showGalleryImage(galleryIndex + 1));
  lightbox.addEventListener('close', resetLightbox);
  lightbox.addEventListener('keydown', (event) => {
    if (galleryIndex < 0) return;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      showGalleryImage(galleryIndex - 1);
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      showGalleryImage(galleryIndex + 1);
    }
  });
  lightboxStage.addEventListener('touchstart', (event) => {
    resetTouchState();
    if (galleryIndex < 0 || event.touches.length !== 1) return;
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
    touchCurrentX = touchStartX;
    touchCurrentY = touchStartY;
  }, { passive: true });
  lightboxStage.addEventListener('touchmove', (event) => {
    if (galleryIndex < 0 || touchStartX === null || touchStartY === null || event.touches.length !== 1) return;
    touchCurrentX = event.touches[0].clientX;
    touchCurrentY = event.touches[0].clientY;
    const deltaX = touchCurrentX - touchStartX;
    const deltaY = touchCurrentY - touchStartY;
    if (horizontalSwipeActive || (Math.abs(deltaX) > 8 && Math.abs(deltaX) > Math.abs(deltaY))) {
      horizontalSwipeActive = true;
      event.preventDefault();
    }
  }, { passive: false });
  lightboxStage.addEventListener('touchend', (event) => {
    if (galleryIndex < 0 || touchStartX === null || touchStartY === null || !event.changedTouches.length) return;
    const endX = event.changedTouches[0].clientX ?? touchCurrentX;
    const endY = event.changedTouches[0].clientY ?? touchCurrentY;
    const deltaX = endX - touchStartX;
    const deltaY = endY - touchStartY;
    resetTouchState();
    if (Math.abs(deltaX) < 45 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
    event.preventDefault();
    showGalleryImage(deltaX < 0 ? galleryIndex + 1 : galleryIndex - 1);
  }, { passive: false });
  lightboxStage.addEventListener('touchcancel', resetTouchState, { passive: true });
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) closeLightbox();
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

  const headerTopLinks = document.querySelectorAll(
    '.main-nav a[href="#top"], .header-brand-logo[href="#top"]',
  );
  headerTopLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      closeMenu();
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: reduceMotion ? 'auto' : 'smooth',
      });
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${window.location.search}#top`,
      );
    });
  });

  const toTop = document.querySelector('.to-top');
  toTop?.addEventListener('click', (event) => {
    event.preventDefault();
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  });

  document.querySelector('#year').textContent = new Date().getFullYear();
})();
