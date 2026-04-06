(() => {
  "use strict";

  const CART_KEY = "kamog_cart";
  const PREFS_KEY = "kamog_cart_preferences";
  const CART_PAGE_PATH = "/marketplace/cart/";
  const CHECKOUT_PAGE_PATH = "/marketplace/checkout/";
  const DEFAULT_IMAGE = "/assets/img/og/home-og.jpg";

  function safeJsonParse(value, fallback) {
    try {
      return JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }

  function getCart() {
    return safeJsonParse(localStorage.getItem(CART_KEY), []);
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCountBadges();
  }

  function getPrefs() {
    return safeJsonParse(localStorage.getItem(PREFS_KEY), {
      orderNotes: "",
      artworkStatus: "",
      deliveryChoice: "pickup"
    });
  }

  function savePrefs(prefs) {
    localStorage.setItem(PREFS_KEY, JSON.stringify({
      ...getPrefs(),
      ...prefs
    }));
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
    if (typeof value === "number") return value;
    const cleaned = String(value || "")
      .replace(/,/g, "")
      .replace(/[^\d.]/g, "");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function formatUGX(amount) {
    return "UGX " + (Number(amount) || 0).toLocaleString("en-UG");
  }

  function getCartCount() {
    return getCart().reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  }

  function updateCartCountBadges() {
    const count = getCartCount();

    const selectors = [
      "[data-cart-count]",
      ".cart-count",
      ".cart-badge",
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

      const graph = Array.isArray(parsed?.["@graph"])
        ? parsed["@graph"]
        : [parsed];

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
      return {
        ...extractMetaProduct(),
        ...structured
      };
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

  function beautifyKey(key) {
    return String(key)
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
      .trim();
  }

  function findNearestProductForm(trigger) {
    if (!trigger) return null;

    const directForm = trigger.closest("form");
    if (directForm) return directForm;

    const nearbyCard =
      trigger.closest(".card, .product-card, .product-page, .product-wrap, .product-main, .config-wrap, .config-grid, .product-hero") ||
      document;

    const form = nearbyCard.querySelector('form[action*="/marketplace/cart/"], form[action*="/marketplace/checkout/"]');
    return form || null;
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

  function mergeCartItem(cart, product) {
    const existingIndex = cart.findIndex((item) => {
      const sameId = item.id === product.id;
      const sameOptions = JSON.stringify(item.options || {}) === JSON.stringify(product.options || {});
      return sameId && sameOptions;
    });

    if (existingIndex >= 0) {
      cart[existingIndex].qty = (Number(cart[existingIndex].qty) || 0) + (Number(product.qty) || 1);
      if (product.notes) {
        cart[existingIndex].notes = product.notes;
      }
      return cart;
    }

    cart.push(product);
    return cart;
  }

  function buildProductPayload(form) {
    const pageProduct = extractPageProduct();
    const formValues = form ? serializeFormOptions(form) : { options: {}, qty: findQuantityFromPage(null), notes: "" };

    const quantity = Math.max(1, Number(formValues.qty) || findQuantityFromPage(form));

    const name = pageProduct.name || "Marketplace Product";
    const id =
      pageProduct.sku ||
      slugify(normalizePath(pageProduct.url || window.location.pathname)) ||
      slugify(name);

    return {
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
    };
  }

  function addItemToCart(product) {
    const cart = getCart();
    mergeCartItem(cart, product);
    saveCart(cart);
    return cart;
  }

  function goToCart() {
    window.location.href = CART_PAGE_PATH;
  }

  function goToCheckout() {
    window.location.href = CHECKOUT_PAGE_PATH;
  }

  function handleAddToCart(event, trigger, redirectToCheckout = false) {
    event.preventDefault();

    const form = findNearestProductForm(trigger);
    const product = buildProductPayload(form);

    addItemToCart(product);

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
    const links = Array.from(document.querySelectorAll('a[href], button[data-cart-action], [data-add-to-cart]'));

    links.forEach((node) => {
      if (node.dataset.cartBound === "true") return;

      const href = node.getAttribute("href");
      const text = String(node.textContent || "").toLowerCase();
      const isCartLink = href && isCartPath(href);
      const isCheckoutLink = href && isCheckoutPath(href);
      const looksLikeAddToCart =
        node.hasAttribute("data-add-to-cart") ||
        text.includes("add to cart") ||
        text.includes("buy now") ||
        text.includes("checkout");

      if (!isCartLink && !isCheckoutLink && !looksLikeAddToCart) return;

      node.dataset.cartBound = "true";

      node.addEventListener("click", (event) => {
        const redirectToCheckout =
          isCheckoutLink ||
          text.includes("buy now") ||
          text.includes("checkout");

        handleAddToCart(event, node, redirectToCheckout);
      });
    });
  }

  function hookPreferencePersistence() {
    const notes = document.getElementById("order-notes");
    const artwork = document.getElementById("artwork-status");
    const delivery = document.getElementById("delivery-choice");

    if (!notes && !artwork && !delivery) return;

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
      getPrefs,
      savePrefs,
      addItem(product) {
        return addItemToCart({
          id: product.id || slugify(product.name),
          sku: product.sku || "",
          name: product.name || "Marketplace Product",
          price: currencyToNumber(product.price),
          qty: Math.max(1, Number(product.qty) || 1),
          image: product.image || DEFAULT_IMAGE,
          url: product.url || window.location.href,
          description: product.description || "",
          options: product.options || {},
          notes: product.notes || "",
          currency: product.currency || "UGX"
        });
      },
      clear() {
        saveCart([]);
      },
      remove(id) {
        const cart = getCart().filter((item) => item.id !== id);
        saveCart(cart);
      },
      count() {
        return getCartCount();
      },
      total() {
        return getCart().reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.qty) || 0)), 0);
      },
      formatUGX
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