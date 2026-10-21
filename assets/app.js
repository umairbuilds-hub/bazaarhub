// ----- Store settings: change these to your own details -----
const STORE = {
  whatsapp: "923001234567", // your number: country code + number, no + or spaces
  currency: "Rs. ",
  sheetUrl:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTJ062GknDx9HkM7fjUkHBTZO6SvAW-0A6Omm4fJoDbLA9Vp0rufwLNiweXujEeC76ExpmsMZNGI9SG/pub?output=csv", // paste your Google Sheet CSV link here (inside the quotes)
};

// ----- Backup products (used if the Google Sheet is empty or not reachable) -----
const BACKUP_PRODUCTS = [
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

let PRODUCTS = [];

// ----- Reading products from the Google Sheet -----

// Turn CSV text into rows of cells
function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

// Turn rows into a list of product objects
function rowsToProducts(rows) {
  const header = rows[0].map((h) => h.trim().toLowerCase());
  return rows
    .slice(1)
    .map((r) => {
      const item = {};
      header.forEach((h, i) => (item[h] = (r[i] || "").trim()));
      return {
        name: item.name,
        category: item.category || "Other",
        price: Number(item.price) || 0,
        discount: Number(item.discount) || 0,
        image: item.image,
        icon: item.icon || "🛍️",
        desc: item.desc,
        inStock: (item.in_stock || "yes").toLowerCase() !== "no",
      };
    })
    .filter((p) => p.name && p.price > 0);
}

// ----- Firebase: where the admin page saves the products -----
const firebaseConfig = {
  apiKey: "AIzaSyBRyK8RhFVfxYN8uYwljOpNJgLxTqgIp48",
  authDomain: "bazaarhub-31e50.firebaseapp.com",
  projectId: "bazaarhub-31e50",
  storageBucket: "bazaarhub-31e50.firebasestorage.app",
  messagingSenderId: "417243847111",
  appId: "1:417243847111:web:50ba81310cbb4b8ad821e2",
};

// Get the products from Firebase (backup list is used only if Firebase fails)
async function loadProducts() {
  try {
    const { initializeApp } =
      await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
    const { getFirestore, collection, getDocs } =
      await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");

    const db = getFirestore(initializeApp(firebaseConfig));
    const snap = await getDocs(collection(db, "products"));

    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((p) => p.name && p.price > 0)
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (err) {
    console.error("Could not load products from Firebase:", err);
    return BACKUP_PRODUCTS;
  }
}
// ----- Price helpers -----
function formatPrice(n) {
  return STORE.currency + n.toLocaleString("en-US");
}

// Price after discount
function finalPrice(p) {
  const d = p.discount || 0;
  return d > 0 ? Math.round(p.price * (1 - d / 100)) : p.price;
}

// ----- Build the HTML for one product card -----
function productCard(p) {
  const now = finalPrice(p);
  const message =
    'Hello, I would like to order "' + p.name + '" (' + formatPrice(now) + ").";
  const link =
    "https://wa.me/" + STORE.whatsapp + "?text=" + encodeURIComponent(message);

  const picture = p.image
    ? `<img src="${p.image}" alt="${p.name}" loading="lazy">`
    : p.icon;
  const badge =
    p.discount > 0 ? `<span class="badge">-${p.discount}%</span>` : "";
  const priceHtml =
    p.discount > 0
      ? `<span class="old">${formatPrice(p.price)}</span> ${formatPrice(now)}`
      : formatPrice(now);
  const button =
    p.inStock === false
      ? `<span class="btn off">Out of stock</span>`
      : `<button class="btn" data-add="${encodeURIComponent(p.name)}">Add to cart</button>`;

  return `
    <article class="card">
      <div class="pic">${badge}${picture}</div>
      <div class="info">
        <small>${p.category}</small>
        <h3>${p.name}</h3>
        <p>${p.desc || ""}</p>
        <div class="price">${priceHtml}</div>
        ${button}
      </div>
    </article>
  `;
}

// ----- Pages that show products (run after products are loaded) -----
function initShop() {
  // Home page: first 4 products
  const featured = document.getElementById("featured");
  if (featured) {
    featured.innerHTML = PRODUCTS.slice(0, 4).map(productCard).join("");
  }

  // Products page: search, filter and sort
  const grid = document.getElementById("grid");
  if (grid) {
    const search = document.getElementById("search");
    const sort = document.getElementById("sort");
    const chips = document.getElementById("chips");
    let activeCategory = "All";

    const categories = ["All", ...new Set(PRODUCTS.map((p) => p.category))];
    chips.innerHTML = categories
      .map((c) => `<button class="chip">${c}</button>`)
      .join("");

    const fromUrl = new URLSearchParams(location.search).get("cat");
    if (categories.includes(fromUrl)) activeCategory = fromUrl;

    function render() {
      const list = PRODUCTS.filter(
        (p) =>
          (activeCategory === "All" || p.category === activeCategory) &&
          p.name.toLowerCase().includes(search.value.toLowerCase()),
      );

      if (sort.value === "low")
        list.sort((a, b) => finalPrice(a) - finalPrice(b));
      if (sort.value === "high")
        list.sort((a, b) => finalPrice(b) - finalPrice(a));

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
    search.oninput = render;
    sort.onchange = render;

    render();
  }
}

// Load the products, then show them
loadProducts().then((list) => {
  PRODUCTS = list;
  initShop();
  renderCart();
});

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
  const total = slides.children.length;
  let current = 0;
  let timer;

  for (let i = 0; i < total; i++) {
    const dot = document.createElement("button");
    dot.setAttribute("aria-label", "Go to slide " + (i + 1));
    dot.onclick = () => {
      showSlide(i);
      restartTimer();
    };
    dots.appendChild(dot);
  }

  function showSlide(n) {
    current = (n + total) % total;
    slides.style.transform = "translateX(-" + current * 100 + "%)";
    for (let i = 0; i < total; i++) {
      dots.children[i].classList.toggle("on", i === current);
    }
  }

  function restartTimer() {
    clearInterval(timer);
    timer = setInterval(() => showSlide(current + 1), 5000);
  }

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

// ----- Contact page: send the form to WhatsApp -----
const contactForm = document.getElementById("contact-form");
if (contactForm) {
  contactForm.onsubmit = (e) => {
    e.preventDefault();
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
  menuBtn.onclick = () => {
    const isOpen = menu.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", isOpen);
    menuBtn.textContent = isOpen ? "✕" : "☰";
  };

  for (const link of menu.querySelectorAll("a")) {
    link.onclick = () => {
      menu.classList.remove("open");
      menuBtn.textContent = "☰";
    };
  }
}
// ----- Shopping cart -----
let cart = [];
try {
  cart = JSON.parse(localStorage.getItem("cart")) || [];
} catch (e) {
  cart = [];
}

// Add the cart button to the header and the cart panel to the page
const navBar = document.querySelector(".nav");
if (navBar) {
  navBar.insertAdjacentHTML(
    "beforeend",
    `<button class="cart-btn" id="cart-open" aria-label="Open cart">🛒 <span id="cart-count">0</span></button>`,
  );
}

document.body.insertAdjacentHTML(
  "beforeend",
  `
  <div class="cart-overlay" id="cart-overlay"></div>
  <aside class="cart" id="cart" aria-label="Shopping cart">
    <div class="cart-head">
      <h2>Your cart</h2>
      <button id="cart-close" aria-label="Close cart">✕</button>
    </div>
    <div class="cart-items" id="cart-items"></div>
    <div class="cart-foot" id="cart-foot">
      <div>Total: <b id="cart-total"></b></div>
      <a class="btn" id="cart-order" href="#" target="_blank" rel="noopener">Order on WhatsApp</a>
      <button class="clear" id="cart-clear">Clear cart</button>
    </div>
  </aside>`,
);

const cartPanel = document.getElementById("cart");
const cartOverlay = document.getElementById("cart-overlay");
const cartItems = document.getElementById("cart-items");
const cartFoot = document.getElementById("cart-foot");

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function openCart() {
  cartPanel.classList.add("open");
  cartOverlay.classList.add("open");
}

function closeCart() {
  cartPanel.classList.remove("open");
  cartOverlay.classList.remove("open");
}

// Match cart items with the current product list (removed products are skipped)
function cartLines() {
  return cart
    .map((item) => {
      const p = PRODUCTS.find((x) => x.name === item.name);
      return p ? { p, qty: item.qty } : null;
    })
    .filter(Boolean);
}

// Redraw the cart panel and the number on the cart button
function renderCart() {
  const lines = cartLines();
  const count = lines.reduce((sum, l) => sum + l.qty, 0);
  const total = lines.reduce((sum, l) => sum + finalPrice(l.p) * l.qty, 0);

  document.getElementById("cart-count").textContent = count;
  document.getElementById("cart-total").textContent = formatPrice(total);

  cartItems.innerHTML = lines.length
    ? lines
        .map((l) => {
          const key = encodeURIComponent(l.p.name);
          return `
        <div class="cart-line">
          <div>
            <b>${l.p.name}</b>
            <small>${formatPrice(finalPrice(l.p))} each</small>
          </div>
          <div class="qty">
            <button data-minus="${key}" aria-label="Decrease quantity">−</button>
            <span>${l.qty}</span>
            <button data-plus="${key}" aria-label="Increase quantity">+</button>
          </div>
        </div>`;
        })
        .join("")
    : `<p class="empty">Your cart is empty.</p>`;

  cartFoot.style.display = lines.length ? "" : "none";

  // Build one WhatsApp message with all the items
  const text =
    "Hello, I would like to order:\n" +
    lines
      .map(
        (l, i) =>
          i +
          1 +
          ". " +
          l.p.name +
          " x" +
          l.qty +
          " - " +
          formatPrice(finalPrice(l.p) * l.qty),
      )
      .join("\n") +
    "\nTotal: " +
    formatPrice(total);
  document.getElementById("cart-order").href =
    "https://wa.me/" + STORE.whatsapp + "?text=" + encodeURIComponent(text);
}

// Change the quantity of one product (remove it when it reaches 0)
function changeQty(name, change) {
  const item = cart.find((x) => x.name === name);
  if (!item) return;
  item.qty += change;
  if (item.qty <= 0) cart = cart.filter((x) => x.name !== name);
  saveCart();
  renderCart();
}

// Listen for all cart clicks on the page
document.addEventListener("click", (e) => {
  const add = e.target.closest("[data-add]");
  const plus = e.target.closest("[data-plus]");
  const minus = e.target.closest("[data-minus]");

  if (add) {
    const name = decodeURIComponent(add.dataset.add);
    const item = cart.find((x) => x.name === name);
    if (item) item.qty++;
    else cart.push({ name, qty: 1 });
    saveCart();
    renderCart();
    openCart();
  } else if (plus) {
    changeQty(decodeURIComponent(plus.dataset.plus), 1);
  } else if (minus) {
    changeQty(decodeURIComponent(minus.dataset.minus), -1);
  } else if (e.target.closest("#cart-open")) {
    openCart();
  } else if (e.target.closest("#cart-close") || e.target === cartOverlay) {
    closeCart();
  } else if (e.target.closest("#cart-clear")) {
    cart = [];
    saveCart();
    renderCart();
  }
});

// Close the cart with the Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeCart();
});

renderCart();
