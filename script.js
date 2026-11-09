const SUPPORT_EMAIL = "hello@priorityonetechnologies.com";
const FORM_ENDPOINT = "https://formspree.io/f/mnpprrna";
const CAMPAIGN_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid", "msclkid"];

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
  const submitLabel = submitButton.textContent;
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

  function showStatus(message, state) {
    formStatus.textContent = message;
    formStatus.className = `form-status ${state}`;
    formStatus.hidden = false;
  }

  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    formStatus.hidden = true;

    // novalidate is set so the invalid field can be focused alongside a readable message
    if (!contactForm.checkValidity()) {
      const firstInvalid = contactForm.querySelector(":invalid");
      showStatus(firstInvalid.validationMessage, "error");
      firstInvalid.focus();
      return;
    }

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
      showStatus("Thanks, your message was sent. I will follow up by email.", "ok");
      contactForm.reset();
    } catch {
      showStatus(`Something went wrong sending this. Please email ${SUPPORT_EMAIL} instead.`, "error");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = submitLabel;
    }
  });
}
