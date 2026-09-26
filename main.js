// ==========================================================================
// MD ZAKI HUSSAIN - PORTFOLIO INTERACTIVE LOGIC
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Menu Toggle Handler (No Screen Dimming)
  const mobileToggle = document.getElementById('mobile_toggle');
  const navLinksContainer = document.getElementById('nav_links');
  const navLinks = document.querySelectorAll('.nav-links a');

  const toggleMenu = (shouldOpen) => {
    if (!navLinksContainer || !mobileToggle) return;
    const isCurrentlyOpen = navLinksContainer.classList.contains('active');
    const openState = shouldOpen !== undefined ? shouldOpen : !isCurrentlyOpen;

    if (openState) {
      navLinksContainer.classList.add('active');
      const icon = mobileToggle.querySelector('i');
      if (icon) icon.className = 'ri-close-line';
    } else {
      navLinksContainer.classList.remove('active');
      const icon = mobileToggle.querySelector('i');
      if (icon) icon.className = 'ri-menu-3-line';
    }
  };

  if (mobileToggle && navLinksContainer) {
    mobileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMenu();
    });

    // Close menu when clicking anywhere outside
    document.addEventListener('click', (e) => {
      if (navLinksContainer.classList.contains('active') &&
          !navLinksContainer.contains(e.target) &&
          !mobileToggle.contains(e.target)) {
        toggleMenu(false);
      }
    });
  }

  // 2. Smooth Scroll & Active Nav Highlights
  navLinks.forEach((link) => {
    link.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const targetId = href.substring(1);
        const targetElement = document.getElementById(targetId);

        // Always close mobile menu when a link is clicked
        toggleMenu(false);

        if (targetElement) {
          setTimeout(() => {
            const headerOffset = 80;
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth',
            });
          }, 60);
        }
      }
    });
  });

  // Highlight nav links & update scroll progress bar on scroll
  const sections = document.querySelectorAll('section[id]');
  const progressBar = document.getElementById('scrollProgress');

  window.addEventListener('scroll', () => {
    const scrollY = window.pageYOffset;
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;

    if (progressBar && totalHeight > 0) {
      const progress = (scrollY / totalHeight) * 100;
      progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    }

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

  // 4. Project Category Filtering & Dynamic Badge Counts
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  // Dynamically sync count badges with project cards
  filterBtns.forEach((btn) => {
    const filterValue = btn.getAttribute('data-filter');
    const countBadge = btn.querySelector('.filter-count');
    if (countBadge) {
      if (filterValue === 'all') {
        countBadge.textContent = projectCards.length;
      } else {
        let count = 0;
        projectCards.forEach((card) => {
          const categories = (card.getAttribute('data-category') || '').split(' ');
          if (categories.includes(filterValue)) count++;
        });
        countBadge.textContent = count;
      }
    }

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

  // Copy Email to Clipboard Toast Handler
  const copyBtn = document.getElementById('copyEmailBtn');
  const toast = document.getElementById('toastNotification');

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const email = 'mdzakihusain@gmail.com';
      navigator.clipboard.writeText(email).then(() => {
        if (toast) {
          toast.classList.add('show');
          setTimeout(() => {
            toast.classList.remove('show');
          }, 3000);
        }
      }).catch(() => {
        // Fallback if clipboard API is restricted
        if (toast) {
          toast.textContent = '✓ Email: mdzakihusain@gmail.com';
          toast.classList.add('show');
          setTimeout(() => { toast.classList.remove('show'); }, 3000);
        }
      });
    });
  }

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