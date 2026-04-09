document.addEventListener("DOMContentLoaded", function () {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  const cartCountText = document.getElementById("cart-count");
  const cartContainer = document.querySelector(".cart-container");
  const cartSummary = document.querySelector(".cart-summary");
  const checkoutForm = document.querySelector(".checkout-form form");
  const checkoutSummary = document.querySelector(".checkout-summary");

  // Visa payment elements
  const visaRadio = document.getElementById("visa");
  const cashRadio = document.getElementById("cash-delivery");
  const visaDetails = document.getElementById("visa-details");

  // Show / hide visa details
  if (visaRadio && cashRadio && visaDetails) {
    visaRadio.addEventListener("change", function () {
      visaDetails.style.display = "block";
    });

    cashRadio.addEventListener("change", function () {
      visaDetails.style.display = "none";
    });
  }

  // Update cart count
  function updateCartCount() {
    let totalItems = 0;

    cart.forEach(function (item) {
      totalItems += item.quantity;
    });

    if (cartCountText) {
      cartCountText.textContent = "Cart: " + totalItems;
    }
  }

  // Save cart in localStorage
  function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
  }

  // Get product name
  function getProductName(button) {
    const productCard = button.closest(".product-card");
    const productInfoBox = button.closest(".product-info-box");

    if (productCard) {
      return productCard.querySelector("h3").textContent.trim();
    }

    if (productInfoBox) {
      return productInfoBox.querySelector("h2").textContent.trim();
    }

    return "Product";
  }

  // Get product price
  function getProductPrice(button) {
    const productCard = button.closest(".product-card");
    const productInfoBox = button.closest(".product-info-box");

    if (productCard) {
      return Number(productCard.getAttribute("data-price"));
    }

    if (productInfoBox) {
      const priceText = productInfoBox.querySelector(".product-price").textContent;
      return Number(priceText.replace("$", ""));
    }

    return 0;
  }

  // Get product image
  function getProductImage(button) {
    const productCard = button.closest(".product-card");
    const productInfoBox = button.closest(".product-info-box");

    if (productCard) {
      return productCard.querySelector("img").getAttribute("src");
    }

    if (productInfoBox) {
      const imageBox = document.querySelector(".product-image-box img");
      if (imageBox) {
        return imageBox.getAttribute("src");
      }
    }

    return "";
  }

  // Add product to cart
  function addToCart(name, price, image) {
    const existingProduct = cart.find(function (item) {
      return item.name === name;
    });

    if (existingProduct) {
      existingProduct.quantity += 1;
    } else {
      cart.push({
        name: name,
        price: price,
        image: image,
        quantity: 1
      });
    }

    saveCart();
    updateCartCount();
  }

  // Display cart items in cart page
  function displayCartItems() {
    if (!cartContainer || !cartSummary) {
      return;
    }

    cartContainer.innerHTML = "";

    let subtotal = 0;
    const deliveryFee = 5;

    if (cart.length === 0) {
      cartContainer.innerHTML = "<p>Your cart is empty.</p>";
      cartSummary.innerHTML = `
        <h3>Cart Summary</h3>
        <p>Subtotal: $0</p>
        <p>Delivery Fee: $0</p>
        <p><strong>Total Price: $0</strong></p>
        <button class="checkout-btn" onclick="window.location.href='checkout.html'">Proceed to Checkout</button>
      `;
      return;
    }

    cart.forEach(function (item, index) {
      subtotal += item.price * item.quantity;

      const cartItem = document.createElement("div");
      cartItem.classList.add("cart-item");

      cartItem.innerHTML = `
        <div class="cart-item-image">
          <img src="${item.image}" alt="${item.name}">
        </div>

        <div class="cart-item-details">
          <h3>${item.name}</h3>
          <p>Price: $${item.price}</p>
          <p>Quantity: ${item.quantity}</p>
          <button class="remove-btn" data-index="${index}">Remove</button>
        </div>
      `;

      cartContainer.appendChild(cartItem);
    });

    const total = subtotal + deliveryFee;

    cartSummary.innerHTML = `
      <h3>Cart Summary</h3>
      <p>Subtotal: $${subtotal}</p>
      <p>Delivery Fee: $${deliveryFee}</p>
      <p><strong>Total Price: $${total}</strong></p>
      <button class="checkout-btn" onclick="window.location.href='checkout.html'">Proceed to Checkout</button>
    `;
  }

  // Display checkout summary
  function displayCheckoutSummary() {
    if (!checkoutSummary) {
      return;
    }

    let subtotal = 0;
    const deliveryFee = 5;

    let summaryHTML = "<h3>Order Summary</h3>";

    if (cart.length === 0) {
      summaryHTML += `
        <p>Your cart is empty.</p>
        <div class="summary-total final-total">
          <p>Total</p>
          <p>$0</p>
        </div>
      `;
      checkoutSummary.innerHTML = summaryHTML;
      return;
    }

    cart.forEach(function (item) {
      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;

      summaryHTML += `
        <div class="summary-item">
          <p>${item.name} x${item.quantity}</p>
          <p>$${itemTotal}</p>
        </div>
      `;
    });

    const total = subtotal + deliveryFee;

    summaryHTML += `
      <hr />

      <div class="summary-total">
        <p>Subtotal</p>
        <p>$${subtotal}</p>
      </div>

      <div class="summary-total">
        <p>Delivery Fee</p>
        <p>$${deliveryFee}</p>
      </div>

      <div class="summary-total final-total">
        <p>Total</p>
        <p>$${total}</p>
      </div>
    `;

    checkoutSummary.innerHTML = summaryHTML;
  }

  // Remove from cart
  if (cartContainer) {
    cartContainer.addEventListener("click", function (event) {
      if (event.target.classList.contains("remove-btn")) {
        const index = event.target.getAttribute("data-index");
        cart.splice(index, 1);
        saveCart();
        updateCartCount();
        displayCartItems();
      }
    });
  }

  // Add to cart buttons
  const addToCartButtons = document.querySelectorAll(".add-to-cart-btn");

  addToCartButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      const productName = getProductName(button);
      const productPrice = getProductPrice(button);
      const productImage = getProductImage(button);

      addToCart(productName, productPrice, productImage);

      alert(productName + " has been added to cart.");
      displayCartItems();
      displayCheckoutSummary();
    });
  });

  // Home page smooth scroll
  const shopNowButton = document.getElementById("shop-now-btn");

  if (shopNowButton) {
    shopNowButton.addEventListener("click", function (event) {
      event.preventDefault();

      const categoriesSection = document.getElementById("categories");

      if (categoriesSection) {
        categoriesSection.scrollIntoView({
          behavior: "smooth"
        });
      }
    });
  }

  // Men sorting
  const menSort = document.getElementById("men-sort");
  const menProductsContainer = document.getElementById("men-products");

  if (menSort && menProductsContainer) {
    menSort.addEventListener("change", function () {
      sortProducts(menProductsContainer, menSort.value);
    });

    sortProducts(menProductsContainer, menSort.value);
  }

  // Women sorting
  const womenSort = document.getElementById("women-sort");
  const womenProductsContainer = document.getElementById("women-products");

  if (womenSort && womenProductsContainer) {
    womenSort.addEventListener("change", function () {
      sortProducts(womenProductsContainer, womenSort.value);
    });

    sortProducts(womenProductsContainer, womenSort.value);
  }

  // Sort function
  function sortProducts(container, sortValue) {
    const productCards = Array.from(container.querySelectorAll(".product-card"));

    productCards.sort(function (a, b) {
      const priceA = Number(a.getAttribute("data-price"));
      const priceB = Number(b.getAttribute("data-price"));

      if (sortValue === "low-high") {
        return priceA - priceB;
      } else if (sortValue === "high-low") {
        return priceB - priceA;
      } else {
        return 0;
      }
    });

    container.innerHTML = "";

    productCards.forEach(function (card) {
      container.appendChild(card);
    });
  }

  // Checkout form validation
  if (checkoutForm) {
    checkoutForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const fullName = document.getElementById("full-name").value.trim();
      const phoneNumber = document.getElementById("phone-number").value.trim();
      const address = document.getElementById("address").value.trim();
      const paymentMethod = document.querySelector('input[name="payment"]:checked');

      if (cart.length === 0) {
        alert("Your cart is empty.");
        return;
      }

      if (fullName === "") {
        alert("Please enter your full name.");
        return;
      }

      if (phoneNumber === "") {
        alert("Please enter your phone number.");
        return;
      }

      if (address === "") {
        alert("Please enter your address.");
        return;
      }

      if (!paymentMethod) {
        alert("Please choose a payment method.");
        return;
      }

      if (paymentMethod.value === "Visa") {
        const cardNumber = document.getElementById("card-number").value.trim();
        const expiryDate = document.getElementById("expiry-date").value.trim();
        const cvv = document.getElementById("cvv").value.trim();

        if (cardNumber === "" || expiryDate === "" || cvv === "") {
          alert("Please enter your Visa card details.");
          return;
        }

        if (!/^\d+$/.test(cardNumber)) {
          alert("Card number must contain digits only.");
          return;
        }

        if (!/^\d{3}$/.test(cvv)) {
          alert("CVV must be exactly 3 digits.");
          return;
        }

        if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
          alert("Expiry date must be in MM/YY format.");
          return;
        }
      }

      alert("Your order has been placed successfully!");

      cart = [];
      saveCart();
      updateCartCount();
      displayCartItems();
      displayCheckoutSummary();

      checkoutForm.reset();

      if (visaDetails) {
        visaDetails.style.display = "none";
      }
    });
  }

  updateCartCount();
  displayCartItems();
  displayCheckoutSummary();
});