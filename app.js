// ----- Store settings: change these to your own details -----
const STORE = {
  whatsapp: "923001234567", // your number: country code + number, no + or spaces
  currency: "Rs. ",
};

// ----- Product list -----
const PRODUCTS = [
  {
    name: "Wireless Earbuds",
    category: "Electronics",
    price: 3499,
    icon: "🎧",
    desc: "Bluetooth 5.3, 20 hours battery",
  },
  {
    name: "Smart Watch",
    category: "Electronics",
    price: 5999,
    icon: "⌚",
    desc: "AMOLED display with fitness tracking",
  },
  {
    name: "Power Bank 20000mAh",
    category: "Electronics",
    price: 4200,
    icon: "🔋",
    desc: "Fast charging, 2 USB ports",
  },
  {
    name: "Cotton Kurta",
    category: "Fashion",
    price: 2800,
    icon: "👕",
    desc: "Soft cotton for every season",
  },
  {
    name: "Lawn Suit",
    category: "Fashion",
    price: 4500,
    icon: "👗",
    desc: "3-piece printed lawn",
  },
  {
    name: "Leather Wallet",
    category: "Fashion",
    price: 1500,
    icon: "👛",
    desc: "Genuine leather, 6 card slots",
  },
  {
    name: "Non-Stick Fry Pan",
    category: "Home",
    price: 2200,
    icon: "🍳",
    desc: "28cm, works on induction",
  },
  {
    name: "LED Table Lamp",
    category: "Home",
    price: 1800,
    icon: "💡",
    desc: "3 brightness modes, USB charging",
  },
  {
    name: "Bed Sheet Set",
    category: "Home",
    price: 3200,
    icon: "🛏️",
    desc: "King size with 2 pillow covers",
  },
  {
    name: "Face Wash Combo",
    category: "Beauty",
    price: 1250,
    icon: "🧴",
    desc: "Deep cleansing for all skin types",
  },
  {
    name: "Perfume 100ml",
    category: "Beauty",
    price: 2900,
    icon: "🌸",
    desc: "Long lasting fragrance",
  },
  {
    name: "Hair Dryer",
    category: "Beauty",
    price: 3600,
    icon: "💇",
    desc: "2000W with hot and cool air",
  },
];

// Format a number as a price, e.g. 3499 -> "Rs. 3,499"
function formatPrice(n) {
  return STORE.currency + n.toLocaleString("en-US");
}

// Build the HTML for one product card
function productCard(p) {
  const message =
    'Hello, I would like to order "' +
    p.name +
    '" (' +
    formatPrice(p.price) +
    ").";
  const link =
    "https://wa.me/" + STORE.whatsapp + "?text=" + encodeURIComponent(message);

  return `
    <article class="card">
      <div class="pic">${p.icon}</div>
      <div class="info">
        <small>${p.category}</small>
        <h3>${p.name}</h3>
        <p>${p.desc}</p>
        <div class="price">${formatPrice(p.price)}</div>
        <a class="btn" href="${link}" target="_blank" rel="noopener">Order on WhatsApp</a>
      </div>
    </article>
  `;
}

// ----- Home page: show the first 4 products -----
const featured = document.getElementById("featured");
if (featured) {
  featured.innerHTML = PRODUCTS.slice(0, 4).map(productCard).join("");
}

// ----- Floating WhatsApp button -----
const waFloat = document.getElementById("wa-float");
if (waFloat) {
  waFloat.href =
    "https://wa.me/" +
    STORE.whatsapp +
    "?text=" +
    encodeURIComponent("Hello, I need some help.");
}

// ----- Hero slider (runs only if the page has a slider) -----
const slides = document.querySelector(".slides");
const dots = document.querySelector(".dots");

if (slides) {
  const total = slides.children.length; // number of slides (3)
  let current = 0; // which slide is showing
  let timer;

  // Create one dot button for each slide
  for (let i = 0; i < total; i++) {
    const dot = document.createElement("button");
    dot.setAttribute("aria-label", "Go to slide " + (i + 1));
    dot.onclick = () => {
      showSlide(i);
      restartTimer();
    };
    dots.appendChild(dot);
  }

  // Move the slider to a given slide
  function showSlide(n) {
    current = (n + total) % total;
    slides.style.transform = "translateX(-" + current * 100 + "%)";
    for (let i = 0; i < total; i++) {
      dots.children[i].classList.toggle("on", i === current);
    }
  }

  // Auto-slide every 5 seconds
  function restartTimer() {
    clearInterval(timer);
    timer = setInterval(() => showSlide(current + 1), 5000);
  }

  // Arrow buttons
  document.querySelector(".prev").onclick = () => {
    showSlide(current - 1);
    restartTimer();
  };
  document.querySelector(".next").onclick = () => {
    showSlide(current + 1);
    restartTimer();
  };

  showSlide(0);
  restartTimer();
}

// ----- Products page: search, filter and sort -----
const grid = document.getElementById("grid");
if (grid) {
  const search = document.getElementById("search");
  const sort = document.getElementById("sort");
  const chips = document.getElementById("chips");
  let activeCategory = "All";

  // Build one button for each category, plus "All"
  const categories = ["All", ...new Set(PRODUCTS.map((p) => p.category))];
  chips.innerHTML = categories
    .map((c) => `<button class="chip">${c}</button>`)
    .join("");

  // If the link has ?cat=Fashion, start with that category
  const fromUrl = new URLSearchParams(location.search).get("cat");
  if (categories.includes(fromUrl)) activeCategory = fromUrl;

  // Show products that match the category and search text
  function render() {
    const list = PRODUCTS.filter(
      (p) =>
        (activeCategory === "All" || p.category === activeCategory) &&
        p.name.toLowerCase().includes(search.value.toLowerCase()),
    );

    if (sort.value === "low") list.sort((a, b) => a.price - b.price);
    if (sort.value === "high") list.sort((a, b) => b.price - a.price);

    grid.innerHTML = list.length
      ? list.map(productCard).join("")
      : "<p>No products found. Try a different search.</p>";

    for (const chip of chips.children) {
      chip.classList.toggle("on", chip.textContent === activeCategory);
    }
  }

  for (const chip of chips.children) {
    chip.onclick = () => {
      activeCategory = chip.textContent;
      render();
    };
  }
  search.oninput = render; // runs on every key you type
  sort.onchange = render; // runs when sorting changes

  render();
}
// ----- Contact page: send the form to WhatsApp -----
const contactForm = document.getElementById("contact-form");
if (contactForm) {
  contactForm.onsubmit = (e) => {
    e.preventDefault(); // stop the page from reloading
    const data = new FormData(contactForm);
    const text =
      "Name: " +
      data.get("name") +
      "\nPhone: " +
      data.get("phone") +
      "\nMessage: " +
      data.get("message");
    window.open(
      "https://wa.me/" + STORE.whatsapp + "?text=" + encodeURIComponent(text),
      "_blank",
    );
  };
}
// ----- Mobile menu -----
const menuBtn = document.querySelector(".menu-btn");
const menu = document.querySelector("nav");

if (menuBtn && menu) {
  // Open or close the menu when the button is clicked
  menuBtn.onclick = () => {
    const isOpen = menu.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", isOpen);
    menuBtn.textContent = isOpen ? "✕" : "☰";
  };

  // Close the menu after a link is clicked
  for (const link of menu.querySelectorAll("a")) {
    link.onclick = () => {
      menu.classList.remove("open");
      menuBtn.textContent = "☰";
    };
  }
}
