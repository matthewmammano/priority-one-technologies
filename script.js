const SUPPORT_EMAIL = "hello@priorityonetechnologies.com";
const FORM_ENDPOINT = "https://formspree.io/f/mnpprrna";
const CAMPAIGN_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid", "msclkid"];
const SLIDE_INTERVAL_MS = 5000;
const CLICK_PAUSE_MS = 30000;
const SETTLE_MS = 700;

const SCROLLED_AT_PX = 12;

const siteHead = document.getElementById("siteHead");

if (siteHead) {
  const syncHead = () => siteHead.classList.toggle("scrolled", window.scrollY > SCROLLED_AT_PX);
  addEventListener("scroll", syncHead, { passive: true });
  syncHead();
}

const contactForm = document.getElementById("contactForm");

if (contactForm) {
  const formStatus = document.getElementById("formStatus");
  const submitButton = contactForm.querySelector(".send");
  const openedAt = Date.now();

  contactForm.action = FORM_ENDPOINT;

  function visitContext() {
    const params = new URLSearchParams(location.search);
    const campaign = Object.fromEntries(
      CAMPAIGN_PARAMS.filter((key) => params.get(key)).map((key) => [key, params.get(key)]),
    );
    return {
      _subject: `New inquiry from ${document.title}`,
      source_page: document.title,
      source_url: location.href,
      source_path: location.pathname,
      referrer: document.referrer || "direct",
      submitted_at: new Date().toISOString(),
      seconds_on_page: Math.round((Date.now() - openedAt) / 1000),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      screen: `${screen.width}x${screen.height}@${devicePixelRatio}x`,
      viewport: `${innerWidth}x${innerHeight}`,
      touch_device: String(matchMedia("(pointer: coarse)").matches),
      user_agent: navigator.userAgent,
      ...campaign,
    };
  }

  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    formStatus.hidden = true;
    submitButton.disabled = true;
    submitButton.textContent = "Sending...";

    try {
      const payload = new FormData(contactForm);
      for (const [key, value] of Object.entries(visitContext())) payload.append(key, value);

      const response = await fetch(contactForm.action, {
        method: "POST",
        body: payload,
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error("Form submission failed");
      formStatus.textContent = "Message sent - we'll follow up by email.";
      formStatus.className = "form-status ok";
      contactForm.reset();
    } catch {
      formStatus.textContent = `Something went wrong sending this. Please email us directly at ${SUPPORT_EMAIL} instead.`;
      formStatus.className = "form-status error";
    } finally {
      formStatus.hidden = false;
      submitButton.disabled = false;
      submitButton.textContent = "Send";
    }
  });
}

const track = document.getElementById("shotTrack");

if (track) {
  const carousel = document.getElementById("shots");
  const caption = document.getElementById("shotCaption");
  const dotRow = document.getElementById("shotDots");
  const slides = [...track.children];
  let index = 0;
  let timer = null;
  let resumeDelay = SLIDE_INTERVAL_MS;
  let settling = false;
  let settleTimer = null;

  const lines = slides.map((slide) => {
    const line = document.createElement("p");
    line.innerHTML = `<b>${slide.dataset.label}</b> ${slide.dataset.text}`;
    caption.append(line);
    return line;
  });

  const dots = slides.map((_, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "dot";
    dot.setAttribute("aria-label", `Screen ${i + 1} of ${slides.length}`);
    dot.addEventListener("click", () => {
      goTo(i);
      schedule(CLICK_PAUSE_MS);
    });
    dotRow.append(dot);
    return dot;
  });

  function paint() {
    lines.forEach((line, i) => line.classList.toggle("on", i === index));
    dots.forEach((d, i) => d.setAttribute("aria-current", String(i === index)));
  }

  function goTo(next) {
    index = (next + slides.length) % slides.length;
    settling = true;
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => { settling = false; }, SETTLE_MS);
    track.scrollTo({ left: slides[index].offsetLeft - track.offsetLeft, behavior: "smooth" });
    paint();
  }

  function schedule(delay) {
    clearTimeout(timer);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    resumeDelay = delay;
    timer = setTimeout(() => {
      goTo(index + 1);
      schedule(SLIDE_INTERVAL_MS);
    }, delay);
  }

  document.getElementById("shotPrev").addEventListener("click", () => {
    goTo(index - 1);
    schedule(CLICK_PAUSE_MS);
  });

  document.getElementById("shotNext").addEventListener("click", () => {
    goTo(index + 1);
    schedule(CLICK_PAUSE_MS);
  });

  carousel.addEventListener("pointerenter", () => clearTimeout(timer));
  carousel.addEventListener("pointerleave", () => schedule(resumeDelay));
  carousel.addEventListener("focusin", () => clearTimeout(timer));

  track.addEventListener("scrollend", () => {
    settling = false;
  });

  track.addEventListener("scroll", () => {
    if (settling) return;
    const at = track.scrollLeft + track.clientWidth / 2;
    const nearest = slides.findIndex((el) => el.offsetLeft - track.offsetLeft + el.clientWidth > at);
    if (nearest !== -1 && nearest !== index) {
      index = nearest;
      paint();
      schedule(CLICK_PAUSE_MS);
    }
  });

  paint();
  schedule(SLIDE_INTERVAL_MS);
}
