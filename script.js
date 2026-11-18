/* SHOPPING CART */
let cart = JSON.parse(localStorage.getItem("cart")) || [];

const cartItems = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total");
const cartLink = document.querySelector('a[href="#cart"]');

// PROMO CODES
const PROMOS = {
    SPONGE10: { type: "percent", value: 10, label: "10% off" },
    BIKINI50: { type: "flat", value: 50, label: "₱50 off" },
    SB100: { type: "percent", value: 100, label: "100% off" }

};

let appliedPromo = localStorage.getItem("promo") || null;
if (appliedPromo && !PROMOS[appliedPromo]) appliedPromo = null;

function calcDiscount(subtotal) {
    if (!appliedPromo || subtotal <= 0) return 0;

    const promo = PROMOS[appliedPromo];
    const raw = promo.type === "percent" ? subtotal * promo.value / 100 : promo.value;

    return Math.min(Math.round(raw), subtotal);
}

// SIZE OPTIONS FOR CLOTHING
const DEFAULT_CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

const SIZE_OPTIONS = [
    { match: "cap", sizes: ["S-M", "M-L"] },
    { match: "socks", sizes: ["S", "M", "L"] },
    { match: "shorts", sizes: ["S", "M", "L", "XL", "XXL"] },
    { match: "tank top", sizes: ["S", "M", "L", "XL", "XXL"] }
];

// AUTOMATICALLY ADD BUTTONS AND CLOTHING SIZES
document.querySelectorAll(
    "#clothing .product-card, #accessories .product-card, #collectibles .product-card"
).forEach(card => {

    const productName = card.querySelector("h4").textContent.toLowerCase();

    if (card.closest("#clothing")) {
        const option = SIZE_OPTIONS.find(o => productName.includes(o.match));
        const sizes = option ? option.sizes : DEFAULT_CLOTHING_SIZES;

        const sizeSelect = document.createElement("select");
        sizeSelect.className = "size-select";

        sizeSelect.innerHTML =
            `<option value="">Select Size</option>` +
            sizes.map(s => `<option value="${s}">${s}</option>`).join("");

        card.appendChild(sizeSelect);
    }

    if (card.querySelector(".add-to-cart")) return;

    const name = card.querySelector("h4").textContent;
    const priceText = card.querySelector(".price").textContent;
    const price = Number(priceText.replace(/[^\d.]/g, ""));

    const button = document.createElement("button");

    button.className = "add-to-cart";
    button.dataset.name = name;
    button.dataset.price = price;
    button.textContent = "Add to Cart";

    card.appendChild(button);
});

// ADD TO CART
document.querySelectorAll(".add-to-cart").forEach(button => {
    button.addEventListener("click", function () {

        const name = this.dataset.name;
        const price = Number(this.dataset.price);

        const card = this.closest(".product-card");
        const sizeSelect = card.querySelector(".size-select");

        let size = "";

        if (sizeSelect) {
            size = sizeSelect.value;

            if (!size) {
                showAlert("🫧 Please select a clothing size first!");
                return;
            }
        }

        const existingItem = cart.find(item =>
            item.name === name && item.size === size
        );

        const image = card.querySelector("img").getAttribute("src");

        if (existingItem) {
            existingItem.quantity++;
            if (!existingItem.image) existingItem.image = image;
        } else {
            cart.push({
                name: name,
                price: price,
                size: size,
                image: image,
                quantity: 1
            });
        }

        saveCart();
        showAlert("💛 " + name + " added to your cart!");
    });
});

// SAVE CART
function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
    displayCart();
}

// DISPLAY CART
function displayCart() {
    let html = "";
    let total = 0;
    let count = 0;

    if (cart.length === 0) {
        html = "<p>Your cart is currently empty.</p>";
    }

    cart.forEach(item => {
        const subtotal = item.price * item.quantity;

        total += subtotal;
        count += item.quantity;

        html += `
            <div class="cart-item">
                ${item.image ? `<img class="cart-item-img" src="${item.image}" alt="${item.name}">` : ""}

                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    ${item.size ? `<p>Size: ${item.size}</p>` : ""}
                    <p>₱${item.price.toLocaleString("en-PH")} each</p>

                    <div class="qty-controls">
                        <button class="qty-btn" onclick="changeQuantity('${item.name}', '${item.size || ""}', -1)">−</button>
                        <span class="qty-number">${item.quantity}</span>
                        <button class="qty-btn" onclick="changeQuantity('${item.name}', '${item.size || ""}', 1)">+</button>
                        <span class="qty-subtotal">₱${subtotal.toLocaleString("en-PH")}</span>
                    </div>

                    <button class="remove-btn" onclick="removeFromCart('${item.name}', '${item.size || ""}')">
                        Remove
                    </button>
                </div>
            </div>
        `;
    });

    const discount = calcDiscount(total);
    const finalTotal = total - discount;
    const totalText = finalTotal.toLocaleString("en-PH");

    updatePromoUI(total, discount);

    // cart section at the bottom of the page
    cartItems.innerHTML = html;
    cartTotal.textContent = totalText;
    cartLink.textContent = `🛒 Cart (${count})`;

    // slide-out cart + floating button (created at the bottom of this file)
    const drawerItems = document.getElementById("drawer-items");
    const drawerTotal = document.getElementById("drawer-total");
    const fabCount = document.getElementById("cart-fab-count");

    if (drawerItems) drawerItems.innerHTML = html;
    if (drawerTotal) drawerTotal.textContent = totalText;
    if (fabCount) {
        fabCount.textContent = count;
        fabCount.style.display = count > 0 ? "flex" : "none";
    }
}

// REMOVE ITEM
function removeFromCart(name, size) {
    cart = cart.filter(item =>
        !(item.name === name && (item.size || "") === size)
    );

    saveCart();
}

// CHANGE QUANTITY (+ / -)
function changeQuantity(name, size, change) {
    const item = cart.find(i => i.name === name && (i.size || "") === size);
    if (!item) return;

    item.quantity += change;

    // going down to 0 removes the item
    if (item.quantity <= 0) {
        cart = cart.filter(i => i !== item);
    }

    saveCart();
}

// OPEN CHECKOUT FORM
document.getElementById("checkout-btn").addEventListener("click", function () {
    if (cart.length === 0) {
        showAlert("🛒 Your cart is empty!");
        return;
    }

    const checkout = document.getElementById("checkout");

    checkout.style.display = "block";
    checkout.scrollIntoView({ behavior: "smooth" });
});

// PLACE ORDER - DEMO ONLY
document.getElementById("checkout-form")
    .addEventListener("submit", function(event) {

        event.preventDefault();

        const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const discount = calcDiscount(subtotal);

        const order = {
            number: "SB-" + new Date().getFullYear() + "-" + Math.floor(100000 + Math.random() * 900000),
            date: new Date().toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" }),
            name: document.getElementById("customer-name").value,
            email: document.getElementById("customer-email").value,
            phone: document.getElementById("customer-phone").value,
            address: document.getElementById("customer-address").value,
            payment: document.getElementById("payment-method").value,
            items: cart.map(item => ({ ...item })),
            subtotal: subtotal,
            discount: discount,
            promoCode: appliedPromo,
            total: subtotal - discount
        };

        showReceipt(order);

        // a promo code is used up once the order is placed
        appliedPromo = null;
        localStorage.removeItem("promo");

        cart = [];
        saveCart();

        this.reset();

        document.getElementById("checkout").style.display = "none";

        document.getElementById("cart").scrollIntoView({
            behavior: "smooth"
        });
    });

// CUSTOM ALERT FUNCTION
function showAlert(message) {
    document.getElementById("alert-message").textContent = message;
    document.getElementById("custom-alert").style.display = "flex";
}

// CLOSE ALERT FUNCTION
function closeAlert() {
    document.getElementById("custom-alert").style.display = "none";
}

// INITIALIZE CART
displayCart();


// HAMBURGER MENU
const menuToggle = document.getElementById("menu-toggle");
const navLinks = document.getElementById("nav-links");

if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", function () {
        navLinks.classList.toggle("show");
    });
}

/*PRODUCT INFORMATION */

const PRODUCT_INFO = [
    // CLOTHING
    { names: ["t-shirt", "tshirt"], desc: "A soft, comfy tee with a classic SpongeBob print, perfect for everyday wear.",
      details: ["Material: Cotton blend", "Fit: Regular unisex fit", "Care: Machine washable"] },
    { names: ["hoodie"], desc: "A cozy pullover hoodie with a SpongeBob design, great for cool days.",
      details: ["Material: Soft fleece", "Features: Front pocket and drawstring hood", "Care: Machine wash cold"] },
    { names: ["pajamas"], desc: "A relaxed sleepwear set for sleeping in or lounging around the house.",
      details: ["Set includes: Top and bottoms", "Material: Lightweight cotton", "Care: Machine washable"] },
    { names: ["cap"], desc: "A casual cap with an adjustable fit and a fun SpongeBob look.",
      details: ["Material: Cotton twill", "Fit: Adjustable strap", "Style: Everyday casual"] },
    { names: ["socks"], desc: "Soft, stretchy socks with fun SpongeBob patterns.",
      details: ["Material: Cotton blend with stretch", "Pack: 1 pair", "Care: Machine washable"] },
    { names: ["jacket"], desc: "A lightweight zip-up jacket with a SpongeBob print, easy to layer.",
      details: ["Material: Polyester", "Features: Zipper front and side pockets", "Care: Machine wash cold"] },
    { names: ["shorts"], desc: "Comfortable shorts for lounging and warm summer days.",
      details: ["Material: Cotton blend", "Features: Elastic waistband", "Care: Machine washable"] },
    { names: ["tank top"], desc: "A breezy sleeveless top that keeps you cool in warm weather.",
      details: ["Material: Light cotton", "Fit: Relaxed fit", "Care: Machine washable"] },
    { names: ["bath robe", "robe"], desc: "A warm, soft robe to wear after a bath or while lounging at home.",
      details: ["Material: Soft microfiber", "Features: Waist tie and side pockets", "Care: Machine wash cold"] },
    { names: ["sweatshirt"], desc: "A warm crewneck sweatshirt with a SpongeBob print.",
      details: ["Material: Brushed cotton blend", "Fit: Regular unisex fit", "Care: Machine wash cold"] },

    // ACCESSORIES
    { names: ["backpack"], desc: "A roomy backpack with a SpongeBob design for school and trips.",
      details: ["Material: Durable polyester", "Features: Padded straps and front pocket", "Use: School and travel"] },
    { names: ["wallet"], desc: "A compact wallet with space for cards, cash, and coins.",
      details: ["Material: Faux leather", "Features: Card slots and coin pocket", "Style: Compact and pocket-friendly"] },
    { names: ["keychain"], desc: "A cute keychain to hang on your bag or keys.",
      details: ["Material: Soft PVC rubber", "Features: Metal ring", "Size: Small and bag-friendly"] },
    { names: ["phone case"], desc: "A protective phone case with a colorful SpongeBob print.",
      details: ["Material: Shock-absorbing TPU", "Features: Slim fit with raised edges", "Note: Check your phone model before ordering"] },
    { names: ["wristwatch", "watch"], desc: "A fun pair of SpongeBob wristwatches for matching with a friend.",
      details: ["Includes: 1 pair (2 watches)", "Display: Analog", "Strap: Adjustable"] },
    { names: ["lanyard"], desc: "A neck lanyard for ID cards, keys, or badges.",
      details: ["Material: Polyester strap", "Features: Metal clip", "Use: School, work, or events"] },
    { names: ["stickers"], desc: "A sticker pack to decorate laptops, notebooks, and water bottles.",
      details: ["Material: Waterproof vinyl", "Pack: Assorted designs", "Finish: Glossy"] },
    { names: ["button pins", "pins"], desc: "Collectible button pins to decorate your bag, jacket, or cap.",
      details: ["Material: Metal with printed design", "Pack: Assorted designs", "Fastening: Pin-back"] },
    { names: ["sunglasses"], desc: "Fun sunglasses with a SpongeBob design for sunny days.",
      details: ["Material: Lightweight plastic frame", "Lens: Tinted", "Style: Casual"] },
    { names: ["tote bag"], desc: "A handy tote bag for groceries, books, and everyday errands.",
      details: ["Material: Canvas", "Features: Reinforced handles", "Use: Shopping and daily carry"] },

    // COLLECTIBLES
    { names: ["funko pop"], desc: "A collectible vinyl figure with the signature big-head Funko look.",
      details: ["Material: Vinyl", "Packaging: Display window box", "Type: Collectible figure"] },
    { names: ["action figure"], desc: "A mini action figure set featuring SpongeBob and friends.",
      details: ["Material: Durable plastic", "Set includes: Several mini figures", "Type: Display and play"] },
    { names: ["plushie"], desc: "A soft mini SpongeBob plushie, perfect for cuddling or display.",
      details: ["Material: Soft plush with polyester filling", "Size: Mini", "Care: Spot clean"] },
    { names: ["mug"], desc: "A ceramic mug for coffee, tea, or hot chocolate.",
      details: ["Material: Ceramic", "Care: Hand wash recommended", "Use: Hot or cold drinks"] },
    { names: ["poster"], desc: "A set of posters to decorate your room or study space.",
      details: ["Material: Glossy paper", "Set includes: Several posters", "Use: Wall decoration"] },
    { names: ["tumbler"], desc: "A tumbler with a lid to keep your drinks handy on the go.",
      details: ["Material: Insulated double wall", "Features: Spill-resistant lid", "Use: Hot or cold drinks"] },
    { names: ["notebook"], desc: "A notebook with a SpongeBob cover for notes, journaling, or school.",
      details: ["Material: Paper pages with printed cover", "Pages: Lined", "Use: School and journaling"] },
    { names: ["blanket"], desc: "A soft blanket for cuddling up on the couch or in bed.",
      details: ["Material: Soft fleece", "Size: Throw size", "Care: Machine wash cold"] },
    { names: ["lamp"], desc: "A cute lamp that adds a SpongeBob glow to your room.",
      details: ["Material: Plastic body", "Use: Desk or bedside light", "Style: Decorative"] },
    { names: ["stuffed toy"], desc: "A large, huggable SpongeBob stuffed toy.",
      details: ["Material: Plush fabric with soft filling", "Size: Larger than the mini plushie", "Care: Spot clean"] }
];

// find the info for a card by its product name ("SB Hoodie" -> "hoodie")
function getProductInfo(card) {
    const name = card.querySelector("h4").textContent
        .toLowerCase()
        .replace(/^(sb|spongebob)\s+/, "")
        .trim();

    return PRODUCT_INFO.find(p => p.names.includes(name)) || null;
}

// short description + "View details" link on every product card
document.querySelectorAll(".product-card").forEach(card => {
    const info = getProductInfo(card);
    const price = card.querySelector(".price");
    const img = card.querySelector("img");
    if (!info || !price) return;

    const desc = document.createElement("p");
    desc.className = "description";
    desc.textContent = info.desc;

    const link = document.createElement("a");
    link.className = "details-link";
    link.href = img ? img.getAttribute("src") : "#";
    link.target = "_blank";
    link.textContent = "View details";

    price.insertAdjacentElement("afterend", desc);
    desc.insertAdjacentElement("afterend", link);
});


/* =================================
   PRODUCT POP-UP
================================= */
const productModal = document.createElement("div");
productModal.className = "product-modal";
productModal.innerHTML = `
    <div class="product-modal-box">
        <button class="product-modal-close" aria-label="Close">&times;</button>
        <img id="modal-img" src="" alt="">
        <h3 id="modal-name"></h3>
        <p class="modal-price" id="modal-price"></p>
        <p class="modal-desc" id="modal-desc"></p>
        <ul class="modal-details" id="modal-details"></ul>
        <select id="modal-size" class="size-select"></select>
        <button id="modal-add" class="add-to-cart">Add to Cart</button>
        <a id="modal-link" class="modal-link" href="#" target="_blank">View full picture ↗</a>
    </div>
`;
document.body.appendChild(productModal);

const modalImg = document.getElementById("modal-img");
const modalName = document.getElementById("modal-name");
const modalPrice = document.getElementById("modal-price");
const modalSize = document.getElementById("modal-size");
const modalAdd = document.getElementById("modal-add");

let activeCard = null;

function openProductModal(card) {
    activeCard = card;

    modalImg.src = card.querySelector("img").src;
    modalImg.alt = card.querySelector("img").alt;
    modalName.textContent = card.querySelector("h4").textContent;
    modalPrice.textContent = card.querySelector(".price").textContent;

    // full product information
    const info = getProductInfo(card);
    const category = card.closest(".product-category");
    const sizeBox = card.querySelector(".size-select");

    document.getElementById("modal-desc").textContent = info ? info.desc : "";

    const rows = [];
    if (category) rows.push("Category: " + category.querySelector("h3").textContent.replace(" Collection", ""));
    if (info) rows.push(...info.details);
    if (sizeBox) {
        const sizes = [...sizeBox.options].filter(o => o.value).map(o => o.value);
        rows.push("Available sizes: " + sizes.join(", "));
    }
    rows.push("Availability: In stock");

    document.getElementById("modal-details").innerHTML =
        rows.map(r => `<li>${r}</li>`).join("");

    document.getElementById("modal-link").href = card.querySelector("img").getAttribute("src");

    // copy the card's sizes (only clothing has them)
    const cardSize = card.querySelector(".size-select");
    if (cardSize) {
        modalSize.innerHTML = cardSize.innerHTML;
        modalSize.value = cardSize.value;
        modalSize.style.display = "block";
    } else {
        modalSize.style.display = "none";
    }

    productModal.classList.add("open");
}

function closeProductModal() {
    productModal.classList.remove("open");
    activeCard = null;
}

// clicking a product picture opens the pop-up instead of a new tab
document.addEventListener("click", function (e) {
    const link = e.target.closest(".product-card a");
    if (link) {
        e.preventDefault();
        openProductModal(link.closest(".product-card"));
    }
});

// Add to Cart inside the pop-up uses the card's own button
modalAdd.addEventListener("click", function () {
    if (!activeCard) return;

    const cardSize = activeCard.querySelector(".size-select");
    if (cardSize) cardSize.value = modalSize.value;

    activeCard.querySelector(".add-to-cart").click();

    // stay open if a size is still needed
    if (!cardSize || cardSize.value) closeProductModal();
});

// close with X, outside click, or Esc key
productModal.addEventListener("click", function (e) {
    if (e.target === productModal) closeProductModal();
});
productModal.querySelector(".product-modal-close")
    .addEventListener("click", closeProductModal);
document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeProductModal();
});


/* =================================
   CLOSE MENU AFTER CLICKING A LINK
================================= */
document.addEventListener("click", function (e) {
    const link = e.target.closest(".nav-links a");
    if (!link) return;

    // keep the menu open when tapping "Categories" so its sub-links can show
    if (link.matches(".dropdown > a")) return;

    document.querySelector(".nav-links").classList.remove("show");
});


/* =================================
   SLIDE-OUT CART
================================= */
const cartDrawerWrap = document.createElement("div");
cartDrawerWrap.innerHTML = `
    <div class="cart-overlay" id="cart-overlay"></div>

    <aside class="cart-drawer" id="cart-drawer">
        <div class="cart-drawer-header">
            <h3><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg> My Cart</h3>
            <button class="cart-drawer-close" id="cart-drawer-close" aria-label="Close cart">&times;</button>
        </div>

        <div class="drawer-items" id="drawer-items"></div>

        <div class="drawer-footer">
            <p class="drawer-total">Total: ₱<span id="drawer-total">0</span></p>
            <button class="drawer-checkout" id="drawer-checkout">Proceed to Checkout</button>
        </div>
    </aside>

    <button class="cart-fab" id="cart-fab" aria-label="Open cart">
        <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg><span id="cart-fab-count">0</span>
    </button>
`;
document.body.appendChild(cartDrawerWrap);

const cartOverlay = document.getElementById("cart-overlay");
const cartDrawer = document.getElementById("cart-drawer");

function openCartDrawer() {
    cartOverlay.classList.add("open");
    cartDrawer.classList.add("open");
    document.body.style.overflow = "hidden";
}

function closeCartDrawer() {
    cartOverlay.classList.remove("open");
    cartDrawer.classList.remove("open");
    document.body.style.overflow = "";
}

// the floating button and the "Cart" link in the menu both open the drawer
document.getElementById("cart-fab").addEventListener("click", openCartDrawer);

cartLink.addEventListener("click", function (e) {
    e.preventDefault();
    openCartDrawer();
});

// close with X, by clicking outside, or with the Esc key
document.getElementById("cart-drawer-close").addEventListener("click", closeCartDrawer);
cartOverlay.addEventListener("click", closeCartDrawer);
document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeCartDrawer();
});

// checkout button inside the drawer
document.getElementById("drawer-checkout").addEventListener("click", function () {
    closeCartDrawer();
    document.getElementById("checkout-btn").click();
});

// fill the drawer with the current cart
displayCart();


/* =================================
   HELPERS
================================= */
function escapeHTML(text) {
    return String(text).replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

function cleanName(card) {
    return card.querySelector("h4").textContent
        .toLowerCase()
        .replace(/^(sb|spongebob)\s+/, "")
        .trim();
}

function priceOf(card) {
    return Number(card.querySelector(".price").textContent.replace(/[^\d.]/g, ""));
}


/* =================================
   SEARCH, FILTER AND SORT
================================= */
const allCards = [...document.querySelectorAll("#categories .product-card")];
allCards.forEach((card, index) => card.dataset.order = index);

const shopToolbar = document.createElement("div");
shopToolbar.className = "shop-toolbar";
shopToolbar.innerHTML = `
    <div class="toolbar-row">
        <input type="search" id="product-search" class="shop-search"
               placeholder="Search products (try hoodie or mug)">
        <select id="product-sort" class="shop-sort">
            <option value="default">Sort: Default</option>
            <option value="low">Price: Low to High</option>
            <option value="high">Price: High to Low</option>
            <option value="az">Name: A to Z</option>
        </select>
    </div>

    <div class="filter-buttons">
        <button class="filter-btn active" data-filter="all">All</button>
        <button class="filter-btn" data-filter="clothing">Clothing</button>
        <button class="filter-btn" data-filter="accessories">Accessories</button>
        <button class="filter-btn" data-filter="collectibles">Collectibles</button>
    </div>

    <p class="no-results" id="no-results">No products found. Try another search.</p>
`;
document.querySelector("#categories h2").insertAdjacentElement("afterend", shopToolbar);

const searchInput = document.getElementById("product-search");
const sortSelect = document.getElementById("product-sort");
const noResults = document.getElementById("no-results");
let activeFilter = "all";

function applyFilters() {
    const query = searchInput.value.trim().toLowerCase();
    let totalVisible = 0;

    document.querySelectorAll("#categories .product-category").forEach(category => {
        const inFilter = activeFilter === "all" || category.id === activeFilter;
        let visible = 0;

        category.querySelectorAll(".product-card").forEach(card => {
            const info = getProductInfo(card);
            const text = (card.querySelector("h4").textContent + " " + (info ? info.desc : "")).toLowerCase();
            const show = inFilter && (!query || text.includes(query));

            card.style.display = show ? "" : "none";
            if (show) visible++;
        });

        category.style.display = visible ? "" : "none";
        totalVisible += visible;
    });

    noResults.style.display = totalVisible ? "none" : "block";
}

function sortProducts() {
    const mode = sortSelect.value;

    document.querySelectorAll("#categories .product-grid").forEach(grid => {
        const cards = [...grid.querySelectorAll(":scope > .product-card")];

        cards.sort((a, b) => {
            if (mode === "low") return priceOf(a) - priceOf(b);
            if (mode === "high") return priceOf(b) - priceOf(a);
            if (mode === "az") {
                return a.querySelector("h4").textContent.localeCompare(b.querySelector("h4").textContent);
            }
            return a.dataset.order - b.dataset.order;
        });

        cards.forEach(card => grid.appendChild(card));
    });
}

function setFilter(name) {
    activeFilter = name;
    document.querySelectorAll(".filter-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.filter === name);
    });
    applyFilters();
}

searchInput.addEventListener("input", applyFilters);
sortSelect.addEventListener("change", sortProducts);
document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => setFilter(btn.dataset.filter));
});

// menu links to a category always show everything first
document.querySelectorAll('a[href="#clothing"], a[href="#accessories"], a[href="#collectibles"]')
    .forEach(link => {
        link.addEventListener("click", () => {
            searchInput.value = "";
            setFilter("all");
        });
    });


/* =================================
   NEW / BEST SELLER BADGES
================================= */
const BADGES = {
    "NEW": ["sweatshirt", "tumbler", "phone case", "plushie"],
    "BEST SELLER": ["t-shirt", "hoodie", "backpack", "funko pop"]
};

allCards.forEach(card => {
    const name = cleanName(card);

    Object.entries(BADGES).forEach(([label, list]) => {
        if (!list.includes(name)) return;

        const badge = document.createElement("span");
        badge.className = "product-badge " + (label === "NEW" ? "badge-new" : "badge-best");
        badge.textContent = label;
        card.prepend(badge);
    });
});


/* =================================
   SIZE GUIDE
================================= */
const sizeGuideModal = document.createElement("div");
sizeGuideModal.className = "info-modal";
sizeGuideModal.innerHTML = `
    <div class="info-modal-box">
        <button class="info-modal-close" aria-label="Close">&times;</button>
        <h3>Size Guide</h3>
        <p class="info-note">Approximate body measurements in centimeters.</p>

        <table class="size-table">
            <thead>
                <tr><th>Size</th><th>Chest</th><th>Length</th></tr>
            </thead>
            <tbody>
                <tr><td>XS</td><td>86 cm</td><td>64 cm</td></tr>
                <tr><td>S</td><td>91 cm</td><td>66 cm</td></tr>
                <tr><td>M</td><td>97 cm</td><td>68 cm</td></tr>
                <tr><td>L</td><td>102 cm</td><td>70 cm</td></tr>
                <tr><td>XL</td><td>107 cm</td><td>72 cm</td></tr>
                <tr><td>XXL</td><td>112 cm</td><td>74 cm</td></tr>
            </tbody>
        </table>

        <p class="info-note">Caps: S-M fits about 54-57 cm, M-L fits about 57-60 cm.<br>
        Socks: S, M, and L follow shoe sizes. Measurements are for demonstration only.</p>
    </div>
`;
document.body.appendChild(sizeGuideModal);

const guideButton = document.createElement("button");
guideButton.className = "size-guide-btn";
guideButton.textContent = "Size Guide";
document.querySelector("#clothing h3").insertAdjacentElement("afterend", guideButton);

guideButton.addEventListener("click", () => sizeGuideModal.classList.add("open"));


/* =================================
   ORDER RECEIPT
================================= */
const receiptModal = document.createElement("div");
receiptModal.className = "info-modal";
receiptModal.innerHTML = `
    <div class="info-modal-box receipt-box">
        <button class="info-modal-close" aria-label="Close">&times;</button>
        <div id="receipt-body"></div>
    </div>
`;
document.body.appendChild(receiptModal);

function showReceipt(order) {
    const rows = order.items.map(item => `
        <div class="receipt-row">
            ${item.image ? `<img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.name)}">` : ""}
            <div class="receipt-row-info">
                <strong>${escapeHTML(item.name)}</strong>
                ${item.size ? `<span>Size: ${escapeHTML(item.size)}</span>` : ""}
                <span>${item.quantity} × ₱${item.price.toLocaleString("en-PH")}</span>
            </div>
            <div class="receipt-row-price">₱${(item.price * item.quantity).toLocaleString("en-PH")}</div>
        </div>
    `).join("");

    document.getElementById("receipt-body").innerHTML = `
        <h3>Order Placed!</h3>
        <p class="info-note">Thank you, ${escapeHTML(order.name)}. Here is your receipt.</p>

        <div class="receipt-meta">
            <p><strong>Order No:</strong> ${order.number}</p>
            <p><strong>Date:</strong> ${escapeHTML(order.date)}</p>
            <p><strong>Payment:</strong> ${escapeHTML(order.payment)}</p>
            <p><strong>Email:</strong> ${escapeHTML(order.email)}</p>
            <p><strong>Contact:</strong> ${escapeHTML(order.phone)}</p>
            <p><strong>Deliver to:</strong> ${escapeHTML(order.address)}</p>
        </div>

        <div class="receipt-items">${rows}</div>

        ${order.discount > 0 ? `
            <div class="receipt-lines">
                <p>Subtotal: ₱${order.subtotal.toLocaleString("en-PH")}</p>
                <p>Discount (${escapeHTML(order.promoCode)}): −₱${order.discount.toLocaleString("en-PH")}</p>
            </div>` : ""}

        <p class="receipt-total">Total: ₱${order.total.toLocaleString("en-PH")}</p>
        <p class="info-note">(SAMPLE) Payment successful!.</p>

        <button class="receipt-done" id="receipt-done">Continue Shopping</button>
    `;

    document.getElementById("receipt-done").addEventListener("click", () => {
        receiptModal.classList.remove("open");
    });

    receiptModal.classList.add("open");
}


/* close the size guide and receipt: X button, outside click, or Esc */
[sizeGuideModal, receiptModal].forEach(modal => {
    modal.addEventListener("click", e => {
        if (e.target === modal || e.target.closest(".info-modal-close")) {
            modal.classList.remove("open");
        }
    });
});

document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
        sizeGuideModal.classList.remove("open");
        receiptModal.classList.remove("open");
    }
});


/* =================================
   FAQS SECTION
================================= */
const faqSection = document.createElement("section");
faqSection.id = "faq";
faqSection.innerHTML = `
    <h2>FAQs</h2>

    <details class="faq-item">
        <summary>How long does delivery take?</summary>
        <p>Orders are prepared within 1 to 2 days and usually arrive in 3 to 14 days, depending on your location.</p>
    </details>

    <details class="faq-item">
        <summary>What payment methods do you accept?</summary>
        <p>We accept Cash on Delivery and GCash (demo only).</p>
    </details>

    <details class="faq-item">
        <summary>Can I return or exchange an item?</summary>
        <p>Yes. Unused items in their original packaging can be returned or exchanged within 7 days of delivery.</p>
    </details>

    <details class="faq-item">
        <summary>How do I choose my size?</summary>
        <p>Open the Size Guide button in the Clothing section to see the measurements for each size.</p>
    </details>
`;

// place the FAQs section before the cart section
document.getElementById("cart").insertAdjacentElement("beforebegin", faqSection);

// menu link for the FAQs section
cartLink.insertAdjacentHTML("beforebegin", '<a href="#faq">FAQs</a>');


/* =================================
   PROMO CODE BOX
================================= */
function updatePromoUI(subtotal, discount) {
    document.querySelectorAll(".promo-box").forEach(box => {
        const msg = box.querySelector(".promo-msg");
        const input = box.querySelector(".promo-input");
        const removeBtn = box.querySelector(".promo-remove");
        const summary = box.querySelector(".promo-summary");

        if (appliedPromo) {
            msg.textContent = appliedPromo + " applied: " + PROMOS[appliedPromo].label;
            msg.className = "promo-msg ok";
            removeBtn.style.display = "inline-block";
        } else {
            if (msg.classList.contains("ok")) {
                msg.textContent = "";
                msg.className = "promo-msg";
                input.value = "";
            }
            removeBtn.style.display = "none";
        }

        summary.innerHTML = discount > 0
            ? `Subtotal: ₱${subtotal.toLocaleString("en-PH")}<br>Discount: −₱${discount.toLocaleString("en-PH")}`
            : "";
    });
}

function applyPromo(code, box) {
    const clean = code.trim().toUpperCase();
    const msg = box.querySelector(".promo-msg");

    if (!clean) {
        msg.textContent = "Please enter a promo code.";
        msg.className = "promo-msg error";
        return;
    }

    if (!PROMOS[clean]) {
        msg.textContent = "Sorry, that promo code is not valid.";
        msg.className = "promo-msg error";
        return;
    }

    appliedPromo = clean;
    localStorage.setItem("promo", clean);
    displayCart();
}

function removePromo() {
    appliedPromo = null;
    localStorage.removeItem("promo");

    document.querySelectorAll(".promo-msg").forEach(msg => {
        msg.textContent = "";
        msg.className = "promo-msg";
    });

    displayCart();
}

function makePromoBox() {
    const box = document.createElement("div");
    box.className = "promo-box";
    box.innerHTML = `
        <div class="promo-row">
            <input type="text" class="promo-input" placeholder="Promo code (try SPONGE10)" maxlength="20">
            <button type="button" class="promo-apply">Apply</button>
            <button type="button" class="promo-remove" style="display:none">Remove</button>
        </div>
        <p class="promo-msg"></p>
        <p class="promo-summary"></p>
    `;

    const input = box.querySelector(".promo-input");

    box.querySelector(".promo-apply").addEventListener("click", () => applyPromo(input.value, box));
    box.querySelector(".promo-remove").addEventListener("click", removePromo);
    input.addEventListener("keydown", e => {
        if (e.key === "Enter") applyPromo(input.value, box);
    });

    return box;
}

// one in the cart section, one in the slide-out cart
cartTotal.parentElement.insertAdjacentElement("beforebegin", makePromoBox());
document.querySelector(".drawer-total").insertAdjacentElement("beforebegin", makePromoBox());
displayCart();


/* =================================
   WISHLIST
================================= */
const HEART_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';

let wishlist = [];
try {
    wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
    if (!Array.isArray(wishlist)) wishlist = [];
} catch (e) {
    wishlist = [];
}

const cardKey = card => card.querySelector("h4").textContent.trim();

// heart button on every product card
allCards.forEach(card => {
    const heart = document.createElement("button");
    heart.type = "button";
    heart.className = "wish-btn";
    heart.innerHTML = HEART_SVG;
    heart.addEventListener("click", () => toggleWish(cardKey(card)));
    card.appendChild(heart);
});

// wishlist link in the menu
const wishLink = document.createElement("a");
wishLink.href = "#wishlist";
cartLink.insertAdjacentElement("beforebegin", wishLink);

// wishlist pop-up
const wishModal = document.createElement("div");
wishModal.className = "info-modal";
wishModal.innerHTML = `
    <div class="info-modal-box">
        <button class="info-modal-close" aria-label="Close">&times;</button>
        <h3>My Wishlist</h3>
        <div id="wish-body"></div>
    </div>
`;
document.body.appendChild(wishModal);

function toggleWish(key) {
    if (wishlist.includes(key)) {
        wishlist = wishlist.filter(k => k !== key);
    } else {
        wishlist.push(key);
    }

    localStorage.setItem("wishlist", JSON.stringify(wishlist));
    refreshWishlist();
}

function renderWishlist() {
    const body = document.getElementById("wish-body");
    const cards = allCards.filter(card => wishlist.includes(cardKey(card)));

    if (cards.length === 0) {
        body.innerHTML = '<p class="info-note">Your wishlist is empty. Tap the heart on a product to save it here.</p>';
        return;
    }

    body.innerHTML = cards.map(card => `
        <div class="receipt-row" data-key="${escapeHTML(cardKey(card))}">
            <img src="${escapeHTML(card.querySelector("img").getAttribute("src"))}" alt="${escapeHTML(cardKey(card))}">
            <div class="receipt-row-info">
                <strong>${escapeHTML(cardKey(card))}</strong>
                <span>${escapeHTML(card.querySelector(".price").textContent)}</span>
            </div>
            <div class="wish-actions">
                <button type="button" class="wish-view">View</button>
                <button type="button" class="wish-remove">Remove</button>
            </div>
        </div>
    `).join("");
}

function refreshWishlist() {
    allCards.forEach(card => {
        const on = wishlist.includes(cardKey(card));
        const heart = card.querySelector(".wish-btn");

        heart.classList.toggle("active", on);
        heart.setAttribute("aria-label", on ? "Remove from wishlist" : "Add to wishlist");
    });

    wishLink.textContent = `Wishlist (${wishlist.length})`;

    if (wishModal.classList.contains("open")) renderWishlist();
}

wishLink.addEventListener("click", e => {
    e.preventDefault();
    renderWishlist();
    wishModal.classList.add("open");
});

wishModal.addEventListener("click", e => {
    if (e.target === wishModal || e.target.closest(".info-modal-close")) {
        wishModal.classList.remove("open");
        return;
    }

    const row = e.target.closest(".receipt-row");
    if (!row) return;

    const key = row.dataset.key;

    if (e.target.closest(".wish-remove")) {
        toggleWish(key);
    }

    if (e.target.closest(".wish-view")) {
        const card = allCards.find(c => cardKey(c) === key);

        if (card) {
            wishModal.classList.remove("open");
            openProductModal(card);
        }
    }
});

document.addEventListener("keydown", e => {
    if (e.key === "Escape") wishModal.classList.remove("open");
});

refreshWishlist();


/* =================================
   DARK MODE
================================= */
const MOON_SVG = '<svg class="moon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
const SUN_SVG = '<svg class="sun" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';

const themeToggle = document.createElement("button");
themeToggle.type = "button";
themeToggle.className = "theme-toggle";
themeToggle.setAttribute("aria-label", "Switch between light and dark mode");
themeToggle.innerHTML = MOON_SVG + SUN_SVG;
document.body.appendChild(themeToggle);

function applyTheme(mode) {
    document.body.classList.toggle("dark", mode === "dark");
    localStorage.setItem("theme", mode);
}

applyTheme(localStorage.getItem("theme") === "dark" ? "dark" : "light");

themeToggle.addEventListener("click", () => {
    applyTheme(document.body.classList.contains("dark") ? "light" : "dark");
});