// ==========================================================================
// MD ZAKI HUSSAIN - PORTFOLIO INTERACTIVE LOGIC
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Menu Toggle & Backdrop Handler
  const mobileToggle = document.getElementById('mobile_toggle');
  const navLinksContainer = document.getElementById('nav_links');
  const navLinks = document.querySelectorAll('.nav-links a');

  if (mobileToggle && navLinksContainer) {
    // Create backdrop overlay if not present
    let overlay = document.querySelector('.nav-backdrop');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'nav-backdrop';
      document.body.appendChild(overlay);
    }

    const toggleMenu = (shouldOpen) => {
      const isCurrentlyOpen = navLinksContainer.classList.contains('active');
      const openState = shouldOpen !== undefined ? shouldOpen : !isCurrentlyOpen;

      if (openState) {
        navLinksContainer.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        const icon = mobileToggle.querySelector('i');
        if (icon) icon.className = 'ri-close-line';
      } else {
        navLinksContainer.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
        const icon = mobileToggle.querySelector('i');
        if (icon) icon.className = 'ri-menu-3-line';
      }
    };

    mobileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMenu();
    });

    overlay.addEventListener('click', () => {
      toggleMenu(false);
    });
  }

  // 2. Smooth Scroll & Active Nav Highlights
  navLinks.forEach((link) => {
    link.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href.startsWith('#')) {
        e.preventDefault();
        const targetId = href.substring(1);
        const targetElement = document.getElementById(targetId);

        if (targetElement) {
          // Close mobile menu if open
          if (navLinksContainer && navLinksContainer.classList.contains('active')) {
            navLinksContainer.classList.remove('active');
            const overlay = document.querySelector('.nav-backdrop');
            if (overlay) overlay.classList.remove('active');
            document.body.style.overflow = '';
            if (mobileToggle) {
              const icon = mobileToggle.querySelector('i');
              if (icon) icon.className = 'ri-menu-3-line';
            }
          }

          const headerOffset = 80;
          const elementPosition = targetElement.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth',
          });
        }
      }
    });
  });

  // Highlight nav links on scroll
  const sections = document.querySelectorAll('section[id]');
  window.addEventListener('scroll', () => {
    const scrollY = window.pageYOffset;

    sections.forEach((current) => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - 100;
      const sectionId = current.getAttribute('id');
      const link = document.querySelector(`.nav-links a[href*=${sectionId}]`);

      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        link?.classList.add('active');
      } else {
        link?.classList.remove('active');
      }
    });

    // 3. Back to Top Button visibility
    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
      if (scrollY > 400) {
        backToTop.classList.add('visible');
      } else {
        backToTop.classList.remove('visible');
      }
    }
  });

  // Back to Top action
  const backToTopBtn = document.getElementById('backToTop');
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    });
  }

  // 4. Project Category Filtering
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      // Remove active class from all buttons
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');

      projectCards.forEach((card) => {
        const cardCategories = card.getAttribute('data-category') || '';
        if (filterValue === 'all' || cardCategories.includes(filterValue)) {
          card.style.display = 'flex';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 50);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(20px)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 300);
        }
      });
    });
  });

  // 5. Contact Form Handler (Simulated Submit with User Feedback)
  const contactForm = document.getElementById('contactForm');
  const formStatus = document.getElementById('formStatus');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const sendBtn = document.getElementById('sendMail');
      if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.innerHTML = `<span>Sending...</span> <i class="ri-loader-4-line ri-spin"></i>`;
      }

      setTimeout(() => {
        if (sendBtn) {
          sendBtn.disabled = false;
          sendBtn.innerHTML = `<span>Send Message</span> <i class="ri-send-plane-fill"></i>`;
        }

        if (formStatus) {
          formStatus.className = 'form-status success';
          formStatus.innerHTML = `✓ Thank you! Your message has been received. I'll get back to you shortly.`;
        }

        contactForm.reset();

        setTimeout(() => {
          if (formStatus) formStatus.style.display = 'none';
        }, 5000);
      }, 1200);
    });
  }
});