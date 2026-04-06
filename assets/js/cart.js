(() => {
  "use strict";

  const CART_KEY = "kamog_cart";
  const PREFS_KEY = "kamog_cart_preferences";
  const CART_PAGE_PATH = "/marketplace/cart/";
  const CHECKOUT_PAGE_PATH = "/marketplace/checkout/";
  const DEFAULT_IMAGE = "/assets/img/og/home-og.jpg";

  function safeJsonParse(value, fallback) {
    try {
      const parsed = JSON.parse(value);
      return parsed == null ? fallback : parsed;
    } catch (error) {
      return fallback;
    }
  }

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function normalizePath(path) {
    if (!path) return "/";
    try {
      const url = new URL(path, window.location.origin);
      return url.pathname.endsWith("/") ? url.pathname : url.pathname + "/";
    } catch (error) {
      return path;
    }
  }

  function isCartPath(path) {
    return normalizePath(path) === CART_PAGE_PATH;
  }

  function isCheckoutPath(path) {
    return normalizePath(path) === CHECKOUT_PAGE_PATH;
  }

  function currencyToNumber(value) {
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    const cleaned = String(value || "")
      .replace(/,/g, "")
      .replace(/[^\d.]/g, "");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function formatUGX(amount) {
    return "UGX " + (Number(amount) || 0).toLocaleString("en-UG");
  }

  function beautifyKey(key) {
    return String(key || "")
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
      .trim();
  }

  function normalizeOptions(options) {
    if (!options || typeof options !== "object" || Array.isArray(options)) {
      return {};
    }

    const clean = {};
    Object.keys(options).forEach((key) => {
      const value = options[key];
      if (value == null) return;
      const stringValue = String(value).trim();
      if (!stringValue) return;
      clean[String(key).trim()] = stringValue;
    });
    return clean;
  }

  function getQuantityValue(item) {
    const raw = item?.qty ?? item?.quantity ?? 1;
    const qty = Number(raw);
    return Math.max(1, Number.isFinite(qty) ? qty : 1);
  }

  function normalizeCartItem(item) {
    if (!item || typeof item !== "object") return null;

    const name = String(item.name || "Marketplace Product").trim() || "Marketplace Product";
    const url = item.url || window.location.href;
    const id =
      item.id ||
      item.sku ||
      item.slug ||
      slugify(normalizePath(url)) ||
      slugify(name);

    const qty = getQuantityValue(item);

    return {
      id: String(id),
      sku: String(item.sku || id),
      slug: String(item.slug || item.sku || id),
      name,
      price: currencyToNumber(item.price),
      qty,
      quantity: qty,
      image: item.image || DEFAULT_IMAGE,
      url,
      description: String(item.description || "").trim(),
      options: normalizeOptions(item.options),
      notes: String(item.notes || "").trim(),
      currency: String(item.currency || "UGX"),
      category: String(item.category || "").trim()
    };
  }

  function getCart() {
    const parsed = safeJsonParse(localStorage.getItem(CART_KEY), []);
    const list = Array.isArray(parsed) ? parsed : [];
    return list.map(normalizeCartItem).filter(Boolean);
  }

  function saveCart(cart) {
    const safeCart = Array.isArray(cart) ? cart.map(normalizeCartItem).filter(Boolean) : [];
    localStorage.setItem(CART_KEY, JSON.stringify(safeCart));
    updateCartCountBadges();
    document.dispatchEvent(new CustomEvent("kamog:cart-updated", { detail: { cart: safeCart } }));
  }

  function clearCart() {
    saveCart([]);
  }

  function getPrefs() {
    const parsed = safeJsonParse(localStorage.getItem(PREFS_KEY), {});
    return {
      orderNotes: String(parsed.orderNotes || "").trim(),
      artworkStatus: String(parsed.artworkStatus || "").trim(),
      deliveryChoice: String(parsed.deliveryChoice || "pickup").trim() || "pickup"
    };
  }

  function savePrefs(prefs) {
    const safePrefs = {
      ...getPrefs(),
      ...(prefs && typeof prefs === "object" ? prefs : {})
    };
    localStorage.setItem(PREFS_KEY, JSON.stringify(safePrefs));
    document.dispatchEvent(new CustomEvent("kamog:prefs-updated", { detail: { prefs: safePrefs } }));
  }

  function getCartCount() {
    return getCart().reduce((sum, item) => sum + getQuantityValue(item), 0);
  }

  function getCartSubtotal() {
    return getCart().reduce((sum, item) => {
      return sum + (currencyToNumber(item.price) * getQuantityValue(item));
    }, 0);
  }

  function updateCartCountBadges() {
    const count = getCartCount();
    const selectors = [
      "[data-cart-count]",
      ".cart-count",
      ".cart-badge",
      ".cart-pill-count",
      ".count",
      "#cartCount",
      "#heroCartCount"
    ];

    selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((node) => {
        node.textContent = String(count);
      });
    });
  }

  function extractStructuredProduct() {
    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));

    for (const script of scripts) {
      const parsed = safeJsonParse(script.textContent, null);
      if (!parsed) continue;

      const graph = Array.isArray(parsed?.["@graph"]) ? parsed["@graph"] : [parsed];

      for (const item of graph) {
        if (!item || item["@type"] !== "Product") continue;

        const rawPrice =
          item?.offers?.price ??
          item?.offers?.lowPrice ??
          item?.price ??
          0;

        return {
          name: item.name || "",
          description: item.description || "",
          image: Array.isArray(item.image) ? item.image[0] : (item.image || ""),
          url: item.url || document.querySelector('link[rel="canonical"]')?.href || window.location.href,
          sku: item.sku || "",
          price: currencyToNumber(rawPrice),
          priceCurrency: item?.offers?.priceCurrency || "UGX"
        };
      }
    }

    return null;
  }

  function extractMetaProduct() {
    const canonical = document.querySelector('link[rel="canonical"]')?.href || window.location.href;
    const title =
      document.querySelector('meta[property="og:title"]')?.content ||
      document.title ||
      "Marketplace Product";

    const description =
      document.querySelector('meta[name="description"]')?.content ||
      document.querySelector('meta[property="og:description"]')?.content ||
      "";

    const image =
      document.querySelector('meta[property="og:image"]')?.content ||
      DEFAULT_IMAGE;

    return {
      name: title.replace(/\s*\|\s*Marketplace.*$/i, "").trim(),
      description,
      image,
      url: canonical,
      sku: "",
      price: 0,
      priceCurrency: "UGX"
    };
  }

  function extractPageProduct() {
    const structured = extractStructuredProduct();
    if (structured) {
      return { ...extractMetaProduct(), ...structured };
    }
    return extractMetaProduct();
  }

  function serializeFormOptions(form) {
    const formData = new FormData(form);
    const options = {};
    let qty = 1;
    let notes = "";

    for (const [key, rawValue] of formData.entries()) {
      if (rawValue instanceof File) continue;

      const value = String(rawValue).trim();
      if (!value) continue;

      const lowerKey = key.toLowerCase();

      if (
        lowerKey === "qty" ||
        lowerKey === "quantity" ||
        lowerKey === "product_qty" ||
        lowerKey === "product_quantity"
      ) {
        qty = Math.max(1, Number(value) || 1);
        continue;
      }

      if (
        lowerKey.includes("note") ||
        lowerKey.includes("instruction") ||
        lowerKey.includes("comment")
      ) {
        notes = value;
        continue;
      }

      options[beautifyKey(key)] = value;
    }

    return { options, qty, notes };
  }

  function findNearestProductForm(trigger) {
    if (!trigger) return null;

    const directForm = trigger.closest("form");
    if (directForm) return directForm;

    const nearbyCard =
      trigger.closest(".card, .product-card, .product-page, .product-wrap, .product-main, .config-wrap, .config-grid, .product-hero") ||
      document;

    return nearbyCard.querySelector('form[action*="/marketplace/cart/"], form[action*="/marketplace/checkout/"]') || null;
  }

  function findQuantityFromPage(form) {
    const selectors = [
      'input[name="quantity"]',
      'input[name="qty"]',
      'input[name="product_quantity"]',
      'input[type="number"]'
    ];

    if (form) {
      for (const selector of selectors) {
        const input = form.querySelector(selector);
        if (input && input.value) {
          return Math.max(1, Number(input.value) || 1);
        }
      }
    }

    for (const selector of selectors) {
      const input = document.querySelector(selector);
      if (input && input.value) {
        return Math.max(1, Number(input.value) || 1);
      }
    }

    return 1;
  }

  function buildProductFromDataset(trigger) {
    const dataset = trigger?.dataset || {};
    const hasDatasetProduct =
      dataset.productName ||
      dataset.productId ||
      dataset.productSku ||
      dataset.productPrice ||
      dataset.homeAddToCart !== undefined ||
      dataset.addToCart !== undefined;

    if (!hasDatasetProduct) return null;

    const qty = Math.max(1, Number(dataset.productQty ?? dataset.qty ?? 1) || 1);
    const name = dataset.productName || "Marketplace Product";
    const id = dataset.productId || dataset.productSku || dataset.productSlug || slugify(name);

    const options = {};
    if (dataset.productCategory) {
      options.Category = dataset.productCategory;
    }

    return normalizeCartItem({
      id,
      sku: dataset.productSku || id,
      slug: dataset.productSlug || dataset.productSku || id,
      name,
      price: currencyToNumber(dataset.productPrice),
      qty,
      image: dataset.productImage || DEFAULT_IMAGE,
      url: dataset.productUrl || window.location.href,
      description: dataset.productDescription || "",
      options,
      notes: dataset.productNotes || "",
      currency: dataset.productCurrency || "UGX",
      category: dataset.productCategory || ""
    });
  }

  function buildProductPayload(form, trigger) {
    const fromDataset = buildProductFromDataset(trigger);
    if (fromDataset) return fromDataset;

    const pageProduct = extractPageProduct();
    const formValues = form
      ? serializeFormOptions(form)
      : { options: {}, qty: findQuantityFromPage(null), notes: "" };

    const quantity = Math.max(1, Number(formValues.qty) || findQuantityFromPage(form));
    const name = pageProduct.name || "Marketplace Product";
    const id =
      pageProduct.sku ||
      slugify(normalizePath(pageProduct.url || window.location.pathname)) ||
      slugify(name);

    return normalizeCartItem({
      id,
      sku: pageProduct.sku || id,
      name,
      price: currencyToNumber(pageProduct.price),
      qty: quantity,
      image: pageProduct.image || DEFAULT_IMAGE,
      url: pageProduct.url || window.location.href,
      description: pageProduct.description || "",
      options: formValues.options || {},
      notes: formValues.notes || "",
      currency: pageProduct.priceCurrency || "UGX"
    });
  }

  function sameCartSignature(a, b) {
    return (
      String(a.id) === String(b.id) &&
      JSON.stringify(normalizeOptions(a.options)) === JSON.stringify(normalizeOptions(b.options))
    );
  }

  function mergeCartItem(cart, product) {
    const normalizedProduct = normalizeCartItem(product);
    if (!normalizedProduct) return cart;

    const existingIndex = cart.findIndex((item) => sameCartSignature(item, normalizedProduct));

    if (existingIndex >= 0) {
      const existing = normalizeCartItem(cart[existingIndex]);
      existing.qty = getQuantityValue(existing) + getQuantityValue(normalizedProduct);
      existing.quantity = existing.qty;

      if (normalizedProduct.notes) existing.notes = normalizedProduct.notes;
      if (normalizedProduct.image && (!existing.image || existing.image === DEFAULT_IMAGE)) {
        existing.image = normalizedProduct.image;
      }
      if (normalizedProduct.description && !existing.description) {
        existing.description = normalizedProduct.description;
      }
      if (normalizedProduct.url) existing.url = normalizedProduct.url;
      if (normalizedProduct.category && !existing.category) {
        existing.category = normalizedProduct.category;
      }

      cart[existingIndex] = existing;
      return cart;
    }

    cart.push(normalizedProduct);
    return cart;
  }

  function addItemToCart(product) {
    const cart = getCart();
    mergeCartItem(cart, product);
    saveCart(cart);
    return cart;
  }

  function removeItemFromCart(id, options = null) {
    const cart = getCart().filter((item) => {
      if (String(item.id) !== String(id)) return true;
      if (!options) return false;
      return JSON.stringify(normalizeOptions(item.options)) !== JSON.stringify(normalizeOptions(options));
    });
    saveCart(cart);
    return cart;
  }

  function goToCart() {
    window.location.href = CART_PAGE_PATH;
  }

  function goToCheckout() {
    window.location.href = CHECKOUT_PAGE_PATH;
  }

  function ensureToastStack() {
    let stack = document.getElementById("toastStack");
    if (stack) return stack;

    stack = document.createElement("div");
    stack.id = "toastStack";
    stack.className = "toast-stack";
    document.body.appendChild(stack);
    return stack;
  }

  function showAddToCartToast(product) {
    const stack = ensureToastStack();
    const toast = document.createElement("div");
    toast.className = "cart-toast";

    toast.innerHTML = `
      <strong>${escapeHtml(product.name)} added to cart</strong>
      <p>${formatUGX(product.price)} · Cart now has ${getCartCount()} item(s).</p>
      <div class="toast-actions">
        <a class="toast-primary" href="${CART_PAGE_PATH}">Open Cart</a>
        <a href="${CHECKOUT_PAGE_PATH}">Checkout</a>
        <button type="button" data-toast-close>Keep Shopping</button>
      </div>
    `;

    stack.appendChild(toast);

    const close = () => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    };

    const closeButton = toast.querySelector("[data-toast-close]");
    if (closeButton) {
      closeButton.addEventListener("click", close);
    }

    setTimeout(close, 4200);
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function shouldStayOnPage(trigger, redirectToCheckout) {
    if (redirectToCheckout) return false;
    if (!trigger) return false;

    if (
      trigger.hasAttribute("data-home-add-to-cart") ||
      trigger.hasAttribute("data-stay-on-page") ||
      trigger.getAttribute("data-cart-action") === "add"
    ) {
      return true;
    }

    return false;
  }

  function handleAddToCart(event, trigger, redirectToCheckout = false) {
    if (event) event.preventDefault();

    const form = findNearestProductForm(trigger);
    const product = buildProductPayload(form, trigger);
    addItemToCart(product);

    if (shouldStayOnPage(trigger, redirectToCheckout)) {
      if (trigger.classList) trigger.classList.add("is-added");

      const originalText = trigger && "textContent" in trigger
        ? (trigger.dataset.originalText || String(trigger.textContent || "").trim())
        : "";

      if (trigger && "textContent" in trigger && originalText) {
        trigger.dataset.originalText = originalText;
        trigger.textContent = "Added";
        setTimeout(() => {
          trigger.classList.remove("is-added");
          trigger.textContent = trigger.dataset.originalText || originalText;
        }, 1400);
      }

      showAddToCartToast(product);
      return;
    }

    if (redirectToCheckout) {
      goToCheckout();
      return;
    }

    goToCart();
  }

  function hookProductForms() {
    const forms = document.querySelectorAll('form[action*="/marketplace/cart/"], form[action*="/marketplace/checkout/"]');

    forms.forEach((form) => {
      if (form.dataset.cartBound === "true") return;
      form.dataset.cartBound = "true";

      form.addEventListener("submit", (event) => {
        const submitter = event.submitter;
        const submitterText = String(submitter?.textContent || "").toLowerCase();
        const submitterName = String(submitter?.name || "").toLowerCase();
        const submitterValue = String(submitter?.value || "").toLowerCase();

        const wantsCheckout =
          isCheckoutPath(form.getAttribute("action")) ||
          submitterText.includes("buy now") ||
          submitterText.includes("checkout") ||
          submitterName.includes("checkout") ||
          submitterValue.includes("checkout");

        handleAddToCart(event, submitter || form, wantsCheckout);
      });
    });
  }

  function hookCartLinks() {
    const nodes = Array.from(
      document.querySelectorAll(
        'a[href], button[data-cart-action], [data-add-to-cart], [data-home-add-to-cart]'
      )
    );

    nodes.forEach((node) => {
      if (node.dataset.cartBound === "true") return;

      const href = node.getAttribute("href");
      const text = String(node.textContent || "").toLowerCase();

      const isCartLink = href && isCartPath(href);
      const isCheckoutLink = href && isCheckoutPath(href);
      const explicitAdd =
        node.hasAttribute("data-add-to-cart") ||
        node.hasAttribute("data-home-add-to-cart") ||
        node.getAttribute("data-cart-action") === "add";

      const looksLikeAddToCart =
        explicitAdd ||
        text.includes("add to cart") ||
        text.includes("buy now");

      if (!isCartLink && !isCheckoutLink && !looksLikeAddToCart) return;

      node.dataset.cartBound = "true";

      node.addEventListener("click", (event) => {
        const redirectToCheckout =
          isCheckoutLink ||
          node.getAttribute("data-cart-action") === "checkout" ||
          text.includes("buy now") ||
          text.includes("checkout now");

        handleAddToCart(event, node, redirectToCheckout);
      });
    });
  }

  function hookPreferencePersistence() {
    const notes = document.getElementById("order-notes");
    const artwork = document.getElementById("artwork-status");
    const delivery = document.getElementById("delivery-choice");

    if (!notes && !artwork && !delivery) return;

    const prefs = getPrefs();

    if (notes && !notes.value) notes.value = prefs.orderNotes || "";
    if (artwork && !artwork.value) artwork.value = prefs.artworkStatus || "";
    if (delivery && !delivery.value) delivery.value = prefs.deliveryChoice || "pickup";

    const persist = () => {
      savePrefs({
        orderNotes: notes ? notes.value.trim() : "",
        artworkStatus: artwork ? artwork.value : "",
        deliveryChoice: delivery ? delivery.value : "pickup"
      });
    };

    if (notes) notes.addEventListener("input", persist);
    if (artwork) artwork.addEventListener("change", persist);
    if (delivery) delivery.addEventListener("change", persist);
  }

  function exposeGlobalHelpers() {
    window.KamogCart = {
      getCart,
      saveCart,
      clear: clearCart,
      getPrefs,
      savePrefs,
      count() {
        return getCartCount();
      },
      subtotal() {
        return getCartSubtotal();
      },
      total() {
        return getCartSubtotal();
      },
      formatUGX,
      addItem(product) {
        return addItemToCart(normalizeCartItem({
          id: product?.id || slugify(product?.name || "marketplace-product"),
          sku: product?.sku || "",
          slug: product?.slug || "",
          name: product?.name || "Marketplace Product",
          price: currencyToNumber(product?.price),
          qty: Math.max(1, Number(product?.qty ?? product?.quantity ?? 1) || 1),
          image: product?.image || DEFAULT_IMAGE,
          url: product?.url || window.location.href,
          description: product?.description || "",
          options: product?.options || {},
          notes: product?.notes || "",
          currency: product?.currency || "UGX",
          category: product?.category || ""
        }));
      },
      remove(id, options) {
        return removeItemFromCart(id, options || null);
      },
      normalizeCartItem
    };
  }

  function boot() {
    updateCartCountBadges();
    hookProductForms();
    hookCartLinks();
    hookPreferencePersistence();
    exposeGlobalHelpers();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();