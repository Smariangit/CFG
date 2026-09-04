(() => {
  "use strict";

  /* ============================================================
     PRELOADER — "Seconds Out" countdown, then bell / staggered reveal
     ============================================================ */
  const preloader = document.getElementById("preloader");
  const plCount = document.getElementById("plCount");
  const plWord = document.getElementById("plWord");

  function runPreloader(){
    let n = 3;

    const tick = () => {
      if (n <= 0) {
        plWord.textContent = "FIGHT";
        plCount.textContent = "";
        plWord.style.color = "var(--brand-hi)";
        plWord.style.fontSize = "2.2rem";
        plWord.style.fontFamily = "var(--f-display)";
        plWord.style.letterSpacing = "0.04em";
        setTimeout(finishLoad, 420);
        return;
      }
      plCount.textContent = String(n);
      plCount.style.animation = "none";
      // force reflow to restart animation
      void plCount.offsetWidth;
      plCount.style.animation = "plFade .4s ease forwards";
      n -= 1;
      setTimeout(tick, 420);
    };
    setTimeout(tick, 300);
  }

  function finishLoad(){
    preloader.classList.add("is-hidden");
    document.body.classList.add("is-loaded");
  }

  window.addEventListener("load", runPreloader);
  // Safety net in case load event is delayed
  setTimeout(() => { if (!document.body.classList.contains("is-loaded")) runPreloader(); }, 2200);

  /* ============================================================
     ROUND TIMER — scroll progress bar
     ============================================================ */
  const timerFill = document.getElementById("roundTimerFill");
  function updateTimer(){
    const doc = document.documentElement;
    const scrolled = doc.scrollTop;
    const max = doc.scrollHeight - doc.clientHeight;
    const pct = max > 0 ? (scrolled / max) * 100 : 0;
    timerFill.style.width = pct + "%";
  }
  document.addEventListener("scroll", updateTimer, { passive: true });
  updateTimer();

  /* ============================================================
     NAV — burger + shrink-on-scroll link close
     ============================================================ */
  const nav = document.getElementById("siteNav");
  const burger = document.getElementById("navBurger");
  burger.addEventListener("click", () => nav.classList.toggle("is-open"));
  nav.querySelectorAll(".nav-links a").forEach(a =>
    a.addEventListener("click", () => nav.classList.remove("is-open"))
  );

  /* ============================================================
     SCROLL REVEALS (IntersectionObserver)
     ============================================================ */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add("is-visible"), (i % 6) * 90);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -60px 0px" });

  document.querySelectorAll(".reveal-on-scroll").forEach(el => io.observe(el));

  /* ============================================================
     TALE-OF-THE-TAPE COUNTERS
     ============================================================ */
  const counters = document.querySelectorAll(".tape-num");
  let countersStarted = false;
  function startCounters(){
    if (countersStarted) return;
    countersStarted = true;
    counters.forEach(el => {
      const target = parseInt(el.dataset.count, 10) || 0;
      const duration = 1400;
      const start = performance.now();
      function step(now){
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(eased * target);
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }
  const heroObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => { if (entry.isIntersecting) startCounters(); });
  }, { threshold: 0.4 });
  const tapeCard = document.querySelector(".tape-card");
  if (tapeCard) heroObs.observe(tapeCard);

  /* ============================================================
     BUTTON IMPACT RIPPLE
     ============================================================ */
  document.querySelectorAll(".btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement("span");
      const size = Math.max(rect.width, rect.height);
      ripple.className = "impact";
      ripple.style.width = ripple.style.height = size + "px";
      ripple.style.left = (e.clientX - rect.left - size / 2) + "px";
      ripple.style.top = (e.clientY - rect.top - size / 2) + "px";
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 550);
    });
  });

  /* ============================================================
     PACKAGE CARDS → sync with booking form
     ============================================================ */
  const fPackage = document.getElementById("fPackage");
  const formSubmitLabel = document.getElementById("formSubmitLabel");
  const modePay = document.getElementById("modePay");

  function setPackageValue(value){
    if (!value) return;
    fPackage.value = value;
  }

  document.querySelectorAll(".plan-opt input").forEach(input => {
    input.addEventListener("change", () => {
      if (input.checked) setPackageValue(input.value);
    });
  });

  document.querySelectorAll("[data-select-pkg]").forEach(btn => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".pkg-card");
      const checked = card.querySelector(".plan-opt input:checked");
      if (checked) setPackageValue(checked.value);
      // switch to "Buy a Package" mode and scroll to form
      setMode("pay");
      document.getElementById("weighin").scrollIntoView({ behavior: "smooth" });
      document.getElementById("fName").focus({ preventScroll: true });
    });
  });

  /* ============================================================
     BOOKING MODE TOGGLE — Free Demo / Buy a Package / Pay Fees
     ============================================================ */
  const modeDemo = document.getElementById("modeDemo");
  const modeFees = document.getElementById("modeFees");
  const bookingForm = document.getElementById("bookingForm");
  const fNameLabel = document.getElementById("fNameLabel");
  const fPackageLabel = document.getElementById("fPackageLabel");
  const formNote = document.getElementById("formNote");
  const weighinDesc = document.getElementById("weighinDesc");
  const modeFields = document.querySelectorAll("[data-mode-field]");
  let currentMode = "demo";

  const MODE_COPY = {
    demo: {
      submit: "Book Free Demo",
      nameLabel: "Full name",
      pkgLabel: "Interested package",
      note: "By booking, you agree to a callback from our team to confirm timing. No payment is taken for demo bookings.",
      desc: "Book a free demo class, lock in a package, or — if you already train with us — pay your next month's fees."
    },
    pay: {
      submit: "Proceed to Payment",
      nameLabel: "Full name",
      pkgLabel: "Package",
      note: "You'll be taken to a secure payment window to complete your membership purchase.",
      desc: "Choose your package and cycle, then complete payment securely to lock in your membership."
    },
    fees: {
      submit: "Pay Fees Now",
      nameLabel: "Full name (as registered)",
      pkgLabel: "Your membership & cycle",
      note: "For existing members only. Enter your Student ID so we can match your payment to your account.",
      desc: "Already training with us? Settle your monthly, quarterly or half-yearly fees securely below."
    }
  };

  function setMode(mode){
    currentMode = mode;
    modeDemo.classList.toggle("is-active", mode === "demo");
    modePay.classList.toggle("is-active", mode === "pay");
    modeFees.classList.toggle("is-active", mode === "fees");

    modeFields.forEach(field => {
      field.classList.toggle("is-hidden", field.dataset.modeField !== mode);
    });

    const copy = MODE_COPY[mode];
    formSubmitLabel.textContent = copy.submit;
    fNameLabel.textContent = copy.nameLabel;
    fPackageLabel.textContent = copy.pkgLabel;
    formNote.textContent = copy.note;
    weighinDesc.textContent = copy.desc;
  }
  modeDemo.addEventListener("click", () => setMode("demo"));
  modePay.addEventListener("click", () => setMode("pay"));
  modeFees.addEventListener("click", () => setMode("fees"));
  setMode("demo"); // sync initial state

  /* ============================================================
     TIME SLOT PICKER (demo bookings)
     ============================================================ */
  const fSlot = document.getElementById("fSlot");
  document.querySelectorAll(".slot-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".slot-btn").forEach(b => b.classList.remove("is-selected"));
      btn.classList.add("is-selected");
      fSlot.value = btn.dataset.slot;
    });
  });

  /* ============================================================
     THE GRIND — highlight gallery filters (All / Photos / Clips)
     ============================================================ */
  const grindFilters = document.querySelectorAll(".grind-filter");
  const grindTiles = document.querySelectorAll(".grind-tile");
  grindFilters.forEach(btn => {
    btn.addEventListener("click", () => {
      grindFilters.forEach(b => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      const filter = btn.dataset.filter;
      grindTiles.forEach(tile => {
        const match = filter === "all" || tile.dataset.type === filter;
        tile.classList.toggle("is-filtered-out", !match);
      });
    });
  });

  /* ============================================================
     DRAG-TO-SCROLL — shared helper for horizontal tracks
     (Wall achievements + Grind highlights). Guarded so this is
     safe to include on pages that don't have one of these tracks.
     ============================================================ */
  function attachDragScroll(track){
    if (!track) return;
    let isDown = false, startX, scrollLeft, moved = false;
    track.addEventListener("mousedown", (e) => {
      isDown = true;
      moved = false;
      startX = e.pageX - track.offsetLeft;
      scrollLeft = track.scrollLeft;
    });
    ["mouseleave", "mouseup"].forEach(evt => track.addEventListener(evt, () => isDown = false));
    track.addEventListener("mousemove", (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - track.offsetLeft;
      const walk = x - startX;
      if (Math.abs(walk) > 6) moved = true;
      track.scrollLeft = scrollLeft - walk * 1.4;
    });
    // A drag ends in a mouseup over whatever image is under the cursor, which
    // would otherwise fire that image's click handler and pop the lightbox
    // open mid-scroll. Swallow that one click (capture phase, so it never
    // reaches the image) whenever the gesture actually moved the track.
    track.addEventListener("click", (e) => {
      if (moved) {
        e.stopPropagation();
        e.preventDefault();
        moved = false;
      }
    }, true);
  }
  attachDragScroll(document.getElementById("wallTrack"));
  attachDragScroll(document.getElementById("grindTrack"));

  /* ============================================================
     THE GARAGE — background photo slideshow
     Each slide fades out to fully transparent before the next one
     fades in, so the swinging bags are visible alone in the gap.
     ============================================================ */
  (() => {
    const slides = document.querySelectorAll("#garageSlideshow .visual-slide");
    if (slides.length < 2) return;

    const HOLD = 3200; // ms a photo stays fully visible
    const GAP = 1200;  // ms the bags are visible alone between photos
    let current = 0;

    setInterval(() => {
      slides[current].classList.remove("is-active");
      setTimeout(() => {
        current = (current + 1) % slides.length;
        slides[current].classList.add("is-active");
      }, GAP);
    }, HOLD + GAP);
  })();

  /* ============================================================
     IMAGE PREVIEW LIGHTBOX — click any photo to view it full-size
     ============================================================ */
  (() => {
    const lightbox = document.getElementById("lightboxOverlay");
    if (!lightbox) return;

    const lightboxImg = document.getElementById("lightboxImg");
    const lightboxCaption = document.getElementById("lightboxCaption");
    const lightboxClose = document.getElementById("lightboxClose");
    const lightboxPrev = document.getElementById("lightboxPrev");
    const lightboxNext = document.getElementById("lightboxNext");
    const images = Array.from(document.querySelectorAll("img.lightbox-img"));
    let currentIndex = -1;

    function captionFor(img){
      // Prefer the tile/card's own caption text; fall back to the image's alt text
      const host = img.closest("figure, article");
      const cap = host && (host.querySelector("figcaption") || host.querySelector("h3"));
      return (cap ? cap.textContent : img.alt || "").trim();
    }

    function open(index){
      if (!images.length) return;
      currentIndex = (index + images.length) % images.length;
      const img = images[currentIndex];
      lightboxImg.src = img.currentSrc || img.src;
      lightboxImg.alt = img.alt || "";
      lightboxCaption.textContent = captionFor(img);
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
    }

    function close(){
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
    }

    images.forEach((img, i) => img.addEventListener("click", () => open(i)));

    lightboxClose.addEventListener("click", close);
    lightboxNext.addEventListener("click", () => open(currentIndex + 1));
    lightboxPrev.addEventListener("click", () => open(currentIndex - 1));
    lightbox.addEventListener("click", (e) => { if (e.target === lightbox) close(); });

    document.addEventListener("keydown", (e) => {
      if (!lightbox.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") open(currentIndex + 1);
      if (e.key === "ArrowLeft") open(currentIndex - 1);
    });
  })();

  /* ============================================================
     BOOKING FORM SUBMIT
     — Demo mode: mock confirmation + owner notification via
       Google Apps Script (see appscript/Code.gs)
     — Pay / Fees mode: Cashfree checkout hook (needs a small
       backend to mint a payment_session_id — see comments below)
     ============================================================ */
  const modal = document.getElementById("successModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalBody = document.getElementById("modalBody");
  const modalClose = document.getElementById("modalClose");

  function openModal(title, body){
    modalTitle.textContent = title;
    modalBody.textContent = body;
    modal.classList.add("is-open");
  }
  modalClose.addEventListener("click", () => modal.classList.remove("is-open"));
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.remove("is-open"); });

  /* ---- Cashfree config — fill in once your backend exists ---- */
  const CASHFREE_CONFIG = {
    mode: "sandbox", // TODO: switch to "production" when you go live
    // Cashfree checkout needs a payment_session_id minted server-side
    // (via Cashfree's Create Order API, using your App ID + Secret Key —
    // never put the Secret Key in frontend code). Point this at that
    // backend endpoint once it exists; until then, checkout falls back
    // to a "we'll contact you" message so the form still works end-to-end.
    createOrderEndpoint: "/api/create-cashfree-order"
  };

  async function launchCashfree(amount, description, onSuccess, prefillName, prefillPhone){
    // Cashfree's Drop-in checkout SDK must be included for this to run:
    // <script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>
    // (already added in index.html, right before this file)
    if (typeof Cashfree === "undefined" || !amount) {
      openModal("Payment coming soon.", `We've saved your details (${description}). Our team will reach out to ${prefillPhone} to complete payment securely.`);
      bookingForm.reset();
      setMode("demo");
      return;
    }

    try {
      const res = await fetch(CASHFREE_CONFIG.createOrderEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          currency: "INR",
          customer_name: prefillName,
          customer_phone: prefillPhone,
          customer_email: document.getElementById("fEmail").value.trim(),
          description
        })
      });
      const order = await res.json();
      if (!order || !order.payment_session_id) throw new Error("No payment_session_id returned");

      const cashfree = Cashfree({ mode: CASHFREE_CONFIG.mode });
      const result = await cashfree.checkout({
        paymentSessionId: order.payment_session_id,
        redirectTarget: "_modal"
      });
      if (result && result.error) {
        openModal("Payment not completed.", "Your payment was cancelled or didn't go through — no charge was made. You can try again anytime.");
        return;
      }
      onSuccess();
    } catch (err) {
      // Expected until CASHFREE_CONFIG.createOrderEndpoint is wired up to a real backend.
      openModal("Payment coming soon.", `We've saved your details (${description}). Our team will reach out to ${prefillPhone} to complete payment securely.`);
      bookingForm.reset();
      setMode("demo");
    }
  }

  //Owner = Sparsh
  //const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzEZTNDNyu2hUEb4ApoX09zIVEBtMSCUw5WC-bW08f7phl193hbOxaSUQjCIYxcGu9-/exec";
  //Owner = MKG
  const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxmynezCS_nEL3itjvW0OurdYuSeAGXuVMTIX8ZWtmGA2wms34hJ_kydOEFHniE8z6P/exec";

  function notifyOwnerOfDemoBooking(payload){
    if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.indexOf("PASTE_YOUR") === 0) return;
    // mode:"no-cors" is required for a plain fetch to an Apps Script Web
    // App from the browser — the response is opaque, but the request
    // still reaches the script and triggers the email.
    fetch(APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(payload)
    }).catch(() => { /* best-effort — the booking itself still succeeds locally */ });
  }

  bookingForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("fName").value.trim();
    const phone = document.getElementById("fPhone").value.trim();
    if (!name || !phone) {
      openModal("Almost there.", "Name and phone number are required so we can confirm your slot.");
      return;
    }

    const packageLabel = fPackage.options[fPackage.selectedIndex].text;
    const amountInput = document.querySelector(`input[value="${CSS.escape(fPackage.value)}"]`);
    const amount = amountInput ? parseInt(amountInput.dataset.amount, 10) : null;

    if (currentMode === "demo") {
      if (!fSlot.value) {
        openModal("Pick a time slot.", "Choose one of the four time slots so we know when to expect you.");
        return;
      }
      notifyOwnerOfDemoBooking({
        name, phone,
        email: document.getElementById("fEmail").value.trim(),
        package: packageLabel,
        date: document.getElementById("fDate").value,
        slot: fSlot.value,
        message: document.getElementById("fMsg").value.trim()
      });
      // TODO: also wire this to your own backend/CRM if you want a
      // system of record beyond the email notification, e.g.
      // fetch("/api/bookings", { method:"POST", body: new FormData(bookingForm) })
      openModal("You're on the books.", `We've logged your free demo request for ${packageLabel.split(" — ")[0]} in the ${fSlot.value} slot. Our team will call ${phone} shortly to confirm.`);
      bookingForm.reset();
      document.querySelectorAll(".slot-btn").forEach(b => b.classList.remove("is-selected"));
      setMode("demo");
      return;
    }

    if (currentMode === "pay") {
      launchCashfree(amount, packageLabel, () => {
        openModal("Payment received.", `Welcome to CFG. Your ${packageLabel.split(" — ")[0]} membership is confirmed — a receipt is on its way to your email.`);
        bookingForm.reset();
        setMode("demo");
      }, name, phone);
      return;
    }

    if (currentMode === "fees") {
      const studentId = document.getElementById("fStudentId").value.trim();
      // TODO: in production, validate studentId/phone against your members
      // database on the backend before creating the payment order.
      launchCashfree(amount, `Fee payment — ${packageLabel}${studentId ? " — " + studentId : ""}`, () => {
        openModal("Fees received.", `Thanks${studentId ? ", " + studentId : ""} — your ${packageLabel.split(" — ")[0]} payment is confirmed. A receipt is on its way to your email.`);
        bookingForm.reset();
        setMode("demo");
      }, name, phone);
      return;
    }
  });

  /* ============================================================
     FOOTER YEAR
     ============================================================ */
  document.getElementById("year").textContent = new Date().getFullYear();

})();
