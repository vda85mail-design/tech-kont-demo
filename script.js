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

  const directionShowcase = document.querySelector('[data-direction-carousel]');
  if (directionShowcase) {
    const directionCarousel = directionShowcase.querySelector('.direction-carousel');
    const directionCards = [...directionShowcase.querySelectorAll('[data-direction-card]')];
    const directionPrevious = directionShowcase.querySelector('.direction-carousel-prev');
    const directionNext = directionShowcase.querySelector('.direction-carousel-next');
    const directionDots = directionShowcase.querySelector('.direction-carousel-dots');
    let directionIndex = 0;
    let directionTimer = null;
    let pointerStartX = null;
    let pointerStartY = null;
    let suppressDirectionClick = false;

    directionCards.forEach((card, index) => {
      const title = card.querySelector('strong')?.textContent.trim() || `Направление ${index + 1}`;
      card.setAttribute('aria-label', `${index + 1} из ${directionCards.length}: ${title}`);
      const dot = document.createElement('button');
      dot.className = 'direction-carousel-dot';
      dot.type = 'button';
      dot.setAttribute('aria-label', `Показать направление ${index + 1}: ${title}`);
      dot.addEventListener('click', () => {
        showDirection(index);
        restartDirectionRotation();
      });
      directionDots.append(dot);
    });

    const directionDotButtons = [...directionDots.querySelectorAll('.direction-carousel-dot')];

    function showDirection(index) {
      directionIndex = (index + directionCards.length) % directionCards.length;
      directionCards.forEach((card, cardIndex) => {
        let offset = (cardIndex - directionIndex + directionCards.length) % directionCards.length;
        if (offset > Math.floor(directionCards.length / 2)) offset -= directionCards.length;
        card.dataset.position = String(offset);
        const isActive = offset === 0;
        card.tabIndex = isActive ? 0 : -1;
        card.setAttribute('aria-hidden', String(!isActive));
      });
      directionDotButtons.forEach((dot, dotIndex) => {
        if (dotIndex === directionIndex) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
      });
    }

    const stopDirectionRotation = () => {
      if (!directionTimer) return;
      window.clearInterval(directionTimer);
      directionTimer = null;
    };

    const startDirectionRotation = () => {
      if (reduceMotion || directionTimer || document.hidden) return;
      directionTimer = window.setInterval(() => showDirection(directionIndex + 1), 4800);
    };

    function restartDirectionRotation() {
      stopDirectionRotation();
      startDirectionRotation();
    }

    directionPrevious.addEventListener('click', () => {
      showDirection(directionIndex - 1);
      restartDirectionRotation();
    });
    directionNext.addEventListener('click', () => {
      showDirection(directionIndex + 1);
      restartDirectionRotation();
    });

    directionShowcase.addEventListener('mouseenter', stopDirectionRotation);
    directionShowcase.addEventListener('mouseleave', startDirectionRotation);
    directionShowcase.addEventListener('focusin', stopDirectionRotation);
    directionShowcase.addEventListener('focusout', (event) => {
      if (!directionShowcase.contains(event.relatedTarget)) startDirectionRotation();
    });

    directionCarousel.addEventListener('pointerdown', (event) => {
      if (!event.isPrimary) return;
      pointerStartX = event.clientX;
      pointerStartY = event.clientY;
      suppressDirectionClick = false;
      stopDirectionRotation();
    });

    directionCarousel.addEventListener('pointerup', (event) => {
      if (pointerStartX === null || pointerStartY === null) return;
      const deltaX = event.clientX - pointerStartX;
      const deltaY = event.clientY - pointerStartY;
      pointerStartX = null;
      pointerStartY = null;
      if (Math.abs(deltaX) >= 45 && Math.abs(deltaX) > Math.abs(deltaY)) {
        suppressDirectionClick = true;
        showDirection(deltaX < 0 ? directionIndex + 1 : directionIndex - 1);
      }
      startDirectionRotation();
    });

    directionCarousel.addEventListener('pointercancel', () => {
      pointerStartX = null;
      pointerStartY = null;
      startDirectionRotation();
    });

    if (!('PointerEvent' in window)) {
      directionCarousel.addEventListener('touchstart', (event) => {
        if (event.touches.length !== 1) return;
        pointerStartX = event.touches[0].clientX;
        pointerStartY = event.touches[0].clientY;
        suppressDirectionClick = false;
        stopDirectionRotation();
      }, { passive: true });

      directionCarousel.addEventListener('touchend', (event) => {
        if (pointerStartX === null || pointerStartY === null || !event.changedTouches.length) return;
        const deltaX = event.changedTouches[0].clientX - pointerStartX;
        const deltaY = event.changedTouches[0].clientY - pointerStartY;
        pointerStartX = null;
        pointerStartY = null;
        if (Math.abs(deltaX) >= 45 && Math.abs(deltaX) > Math.abs(deltaY)) {
          suppressDirectionClick = true;
          showDirection(deltaX < 0 ? directionIndex + 1 : directionIndex - 1);
        }
        startDirectionRotation();
      }, { passive: true });

      directionCarousel.addEventListener('touchcancel', () => {
        pointerStartX = null;
        pointerStartY = null;
        startDirectionRotation();
      }, { passive: true });
    }

    directionCarousel.addEventListener('click', (event) => {
      if (!suppressDirectionClick) return;
      event.preventDefault();
      event.stopPropagation();
      suppressDirectionClick = false;
    }, true);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopDirectionRotation();
      else startDirectionRotation();
    });

    showDirection(0);
    startDirectionRotation();
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
    lightboxImage.src = trigger.dataset.image;
    lightboxImage.alt = sourceImage?.alt || trigger.dataset.caption || 'Увеличенное изображение';
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
