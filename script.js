(() => {
  "use strict";

  /* ============================================================
     PRELOADER — "Seconds Out" countdown, then bell / staggered reveal
     ============================================================ */
  const preloader = document.getElementById("preloader");
  const plCount = document.getElementById("plCount");
  const plWord = document.getElementById("plWord");

  function runPreloader(){
    const skip = sessionStorage.getItem("cfg_seen");
    let n = 3;

    if (skip) {
      // already seen this session — short version
      finishLoad();
      return;
    }

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
    sessionStorage.setItem("cfg_seen", "1");
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
     WALL — drag-to-scroll (mouse) for achievement track
     ============================================================ */
  const wallTrack = document.getElementById("wallTrack");
  let isDown = false, startX, scrollLeft;
  wallTrack.addEventListener("mousedown", (e) => {
    isDown = true;
    startX = e.pageX - wallTrack.offsetLeft;
    scrollLeft = wallTrack.scrollLeft;
  });
  ["mouseleave", "mouseup"].forEach(evt => wallTrack.addEventListener(evt, () => isDown = false));
  wallTrack.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - wallTrack.offsetLeft;
    wallTrack.scrollLeft = scrollLeft - (x - startX) * 1.4;
  });

  /* ============================================================
     BOOKING FORM SUBMIT
     — Demo mode: mock confirmation (wire to your backend / CRM here)
     — Pay mode: Razorpay checkout hook (needs a backend to create
       the order_id in production — see comment below)
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

  function launchRazorpay(amount, description, onSuccess, prefillName, prefillPhone){
    // In production: call your backend to create a Razorpay Order first
    // (POST /api/create-order with the amount), get back an order_id,
    // then pass that order_id below instead of using amount directly.
    // Razorpay checkout.js must be included for this to run:
    // <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    if (typeof Razorpay === "undefined" || !amount) {
      openModal("Payment coming soon.", `We've saved your details (${description}). Our team will reach out to ${prefillPhone} to complete payment securely.`);
      bookingForm.reset();
      setMode("demo");
      return;
    }
    const options = {
      key: "rzp_test_XXXXXXXXXXXX", // TODO: replace with your live/test Razorpay key
      amount: amount * 100, // paise
      currency: "INR",
      name: "Combat Fitness Garage",
      description,
      handler: function (){ onSuccess(); },
      prefill: { name: prefillName, contact: prefillPhone, email: document.getElementById("fEmail").value.trim() },
      theme: { color: "#1e9e5c" }
    };
    new Razorpay(options).open();
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
      // TODO: replace with a real request to your backend/CRM, e.g.
      // fetch("/api/bookings", { method:"POST", body: new FormData(bookingForm) })
      openModal("You're on the books.", `We've logged your free demo request for ${packageLabel.split(" — ")[0]} in the ${fSlot.value} slot. Our team will call ${phone} shortly to confirm.`);
      bookingForm.reset();
      document.querySelectorAll(".slot-btn").forEach(b => b.classList.remove("is-selected"));
      setMode("demo");
      return;
    }

    if (currentMode === "pay") {
      launchRazorpay(amount, packageLabel, () => {
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
      launchRazorpay(amount, `Fee payment — ${packageLabel}${studentId ? " — " + studentId : ""}`, () => {
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
