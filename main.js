// ==========================================================================
// MD ZAKI HUSSAIN - PORTFOLIO INTERACTIVE LOGIC
// ==========================================================================

/**
 * Safely escapes a raw string for insertion via innerHTML.
 * Prevents DOM-XSS from user-controlled input.
 */
function escapeHTML(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

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
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // On localhost Netlify Forms isn't active — show a dev note instead of a false error
      const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

      const sendBtn = document.getElementById('sendMail');
      if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.innerHTML = `<span>Sending...</span> <i class="ri-loader-4-line ri-spin"></i>`;
      }

      try {
        if (isLocalhost) {
          // Dev environment — Netlify Forms not active, show helpful note
          if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.innerHTML = `<span>Send Message</span> <i class="ri-send-plane-fill"></i>`;
          }
          if (formStatus) {
            formStatus.className = 'form-status success';
            formStatus.style.display = '';
            formStatus.innerHTML = `ℹ️ Dev mode — form works on the deployed site. Email directly: mdzakihusain@gmail.com`;
          }
          return;
        }

        const formData = new FormData(contactForm);
        const response = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(formData).toString(),
        });

        if (sendBtn) {
          sendBtn.disabled = false;
          sendBtn.innerHTML = `<span>Send Message</span> <i class="ri-send-plane-fill"></i>`;
        }

        if (response.ok) {
          if (formStatus) {
            formStatus.className = 'form-status success';
            formStatus.style.display = '';
            formStatus.innerHTML = `✓ Thank you! Your message has been received. I'll get back to you shortly.`;
          }
          contactForm.reset();
          setTimeout(() => {
            if (formStatus) formStatus.style.display = 'none';
          }, 5000);
        } else {
          if (formStatus) {
            formStatus.className = 'form-status error';
            formStatus.style.display = '';
            formStatus.innerHTML = `✗ Something went wrong. Please email directly at mdzakihusain@gmail.com`;
          }
        }
      } catch (err) {
        if (sendBtn) {
          sendBtn.disabled = false;
          sendBtn.innerHTML = `<span>Send Message</span> <i class="ri-send-plane-fill"></i>`;
        }
        if (formStatus) {
          formStatus.className = 'form-status error';
          formStatus.style.display = '';
          formStatus.innerHTML = `✗ Network error. Please email directly at mdzakihusain@gmail.com`;
        }
      }
    });
  }

  // 6. AI Chatbot Widget Logic
  const aiChatToggle = document.getElementById('aiChatToggle');
  const aiChatModal = document.getElementById('aiChatModal');
  const closeChatBtn = document.getElementById('closeChatBtn');
  const clearChatBtn = document.getElementById('clearChatBtn');
  const chatMessages = document.getElementById('chatMessages');
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const promptChips = document.querySelectorAll('.prompt-chip');

  if (aiChatToggle && aiChatModal) {
    const openChat = () => {
      aiChatModal.classList.add('active');
      // Auto-focus the input whenever the chat opens
      setTimeout(() => chatInput?.focus(), 50);
    };
    const closeChat = () => aiChatModal.classList.remove('active');

    aiChatToggle.addEventListener('click', () => {
      aiChatModal.classList.contains('active') ? closeChat() : openChat();
    });

    // Close on X button
    if (closeChatBtn) closeChatBtn.addEventListener('click', closeChat);

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && aiChatModal.classList.contains('active')) closeChat();
    });

    // Close when clicking outside the modal (but not on the toggle button)
    document.addEventListener('click', (e) => {
      if (
        aiChatModal.classList.contains('active') &&
        !aiChatModal.contains(e.target) &&
        !aiChatToggle.contains(e.target)
      ) closeChat();
    });

    let conversationHistory = [];

    if (clearChatBtn) {
      clearChatBtn.addEventListener('click', () => {
        conversationHistory = [];
        if (chatMessages) {
          chatMessages.innerHTML = `
            <div class="chat-message bot-message">
              <div class="msg-avatar"><i class="ri-robot-2-line"></i></div>
              <div class="msg-content">
                Conversation reset! 👋 Ask me anything about Md Zaki Hussain's AWS Data Engineering experience at TCS (Aegon UK), his projects, or qualifications!
              </div>
            </div>
          `;
        }
      });
    }

    if (chatMessages) {
      chatMessages.addEventListener('click', (e) => {
        const copyBadge = e.target.closest('.copy-email-badge');
        if (!copyBadge) return;

        const emailToCopy = copyBadge.getAttribute('data-email') || 'mdzakihusain@gmail.com';
        navigator.clipboard.writeText(emailToCopy).then(() => {
          const originalHTML = copyBadge.innerHTML;
          copyBadge.innerHTML = `Copied! <i class="ri-check-line"></i>`;
          copyBadge.classList.add('copied');

          if (toast) {
            toast.textContent = `✓ Copied ${emailToCopy} to clipboard!`;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 3000);
          }

          setTimeout(() => {
            copyBadge.innerHTML = originalHTML;
            copyBadge.classList.remove('copied');
          }, 2000);
        }).catch(() => {
          if (toast) {
            toast.textContent = `✓ Email: ${emailToCopy}`;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 3000);
          }
        });
      });
    }

    const appendMessage = (sender, text) => {
      if (!chatMessages) return;
      const msgDiv = document.createElement('div');
      msgDiv.className = `chat-message ${sender}-message`;
      msgDiv.innerHTML = `
        <div class="msg-avatar"><i class="${sender === 'bot' ? 'ri-robot-2-line' : 'ri-user-line'}"></i></div>
        <div class="msg-content">${text}</div>
      `;
      chatMessages.appendChild(msgDiv);

      if (sender === 'user') {
        // User just sent — always scroll to bottom so they see the thinking indicator
        chatMessages.scrollTop = chatMessages.scrollHeight;
      } else {
        // Bot reply — scroll the TOP of the reply into view so they read from the start.
        // This is better than scrolling to the very bottom when replies are long.
        setTimeout(() => {
          msgDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 30);
      }
    };

    // Used only for the typing indicator: always scroll to show it
    const scrollToBottom = () => {
      if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const handleUserQuery = async (queryText) => {
      if (!queryText.trim()) return;
      
      const userMessageText = queryText.trim();
      // Escape user input before inserting via innerHTML to prevent DOM-XSS
      appendMessage('user', escapeHTML(userMessageText));
      if (chatInput) chatInput.value = '';

      // Show typing indicator bubble
      const typingDiv = document.createElement('div');
      typingDiv.className = 'chat-message bot-message typing-indicator-msg';
      typingDiv.innerHTML = `
        <div class="msg-avatar"><i class="ri-robot-2-line"></i></div>
        <div class="msg-content">Thinking... <i class="ri-loader-4-line ri-spin"></i></div>
      `;
      chatMessages.appendChild(typingDiv);
      scrollToBottom(); // always show the thinking bubble

      try {
        const apiEndpoint = '/.netlify/functions/chat';

        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userMessageText,
            history: conversationHistory,
          }),
        });

        typingDiv.remove();

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const replyText = data.reply || "I couldn't generate a response right now.";

        // Format bot reply.
        // \x01 wraps placeholders, \x02 separates URL from label inside LINK placeholders.
        // Using \x02 (not ':') avoids collision with the colon in https://
        let formattedReply = replyText
          // 1. Bold markers
          .replace(/\*\*(.*?)\*\*/g, '\x01BOLD\x01$1\x01/BOLD\x01')
          // 2. Markdown links [label](url) → \x01LINK\x02url\x02label\x01
          .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, label, url) =>
            `\x01LINK\x02${url.replace(/[*]+$/, '')}\x02${label}\x01`
          );

        // 3 & 4: Split on placeholders → only touch plain-text segments
        formattedReply = formattedReply
          .split(/(\x01[^\x01]+\x01)/)
          .map((seg, i) => {
            if (i % 2 === 1) return seg; // placeholder — leave untouched
            return seg
              .replace(/(https?:\/\/[^\s<]+)/g, (url) => {
                const clean = url.replace(/[*.,)]+$/, '');
                return `\x01LINK\x02${clean}\x02${clean}\x01`;
              })
              .replace(/([a-zA-Z0-9._%+-]+@gmail\.com)/g, '\x01EMAIL\x02$1\x01');
          })
          .join('');

        // 5. Newlines → <br>
        formattedReply = formattedReply.replace(/\n/g, '<br/>');

        // 6. Resolve placeholders into HTML
        formattedReply = formattedReply
          .replace(/\x01BOLD\x01(.*?)\x01\/BOLD\x01/g, '<strong>$1</strong>')
          .replace(/\x01LINK\x02([^\x02]+)\x02([^\x01]+)\x01/g, (_, url, label) =>
            `<a href="${url}" target="_blank" rel="noopener noreferrer" class="chat-link">${label} <i class="ri-external-link-line"></i></a>`
          )
          .replace(/\x01EMAIL\x02([^\x01]+)\x01/g, (_, email) =>
            `<span class="copy-email-badge" data-email="${email}" title="Click to copy email">${email} <i class="ri-file-copy-line"></i></span>`
          );



        appendMessage('bot', formattedReply);

        // Update conversation history for multi-turn context
        conversationHistory.push({ role: 'user', content: userMessageText });
        conversationHistory.push({ role: 'assistant', content: replyText });
      } catch (err) {
        typingDiv.remove();
        console.error('Chat error:', err);
        appendMessage(
          'bot',
          'Sorry, I could not reach X-Bot Backend right now.'
        );
      }
    };

    if (chatForm) {
      chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (chatInput) handleUserQuery(chatInput.value);
      });
    }

    promptChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const promptText = chip.getAttribute('data-prompt');
        if (promptText) handleUserQuery(promptText);
      });
    });
  }

  // -------------------------------------------------------------------------
  // 7. Character counter + disabled send button for chat input
  // -------------------------------------------------------------------------
  const sendChatBtn = document.getElementById('sendChatBtn');
  const charCounter = document.getElementById('chatCharCounter');
  const MAX_CHARS = 1000;

  if (chatInput && sendChatBtn) {
    const updateChatInputState = () => {
      const len = chatInput.value.length;
      const trimmed = chatInput.value.trim();
      sendChatBtn.disabled = trimmed.length === 0;
      if (charCounter) {
        charCounter.textContent = len + ' / ' + MAX_CHARS;
        charCounter.className = 'chat-char-counter';
        if (len >= MAX_CHARS) charCounter.classList.add('limit');
        else if (len >= MAX_CHARS * 0.8) charCounter.classList.add('warn');
      }
    };
    chatInput.addEventListener('input', updateChatInputState);
    updateChatInputState();
  }

  // -------------------------------------------------------------------------
  // 8. Scroll-reveal via IntersectionObserver
  // -------------------------------------------------------------------------
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('.reveal, .reveal-group').forEach((el) => {
    revealObserver.observe(el);
  });
});