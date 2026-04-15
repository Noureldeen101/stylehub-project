document.addEventListener("DOMContentLoaded", function () {

  // ========================
  // ADD TO CART BUTTONS
  // ========================
  const buttons = document.querySelectorAll(".add-to-cart-btn");

  buttons.forEach(button => {
    button.addEventListener("click", function () {
      const productCard = this.closest(".product-card");
      const productName = productCard.querySelector("h3").innerText;

      alert(productName + " added to cart!");
    });
  });


  // ========================
  // SORT PRODUCTS (MEN + WOMEN)
  // ========================
  const sortSelect = document.getElementById("men-sort") || document.getElementById("women-sort");

  if (sortSelect) {
    sortSelect.addEventListener("change", function () {
      const container = document.querySelector(".product-container");
      const products = Array.from(container.children);

      if (this.value === "low-high") {
        products.sort((a, b) => a.dataset.price - b.dataset.price);
      } else {
        products.sort((a, b) => b.dataset.price - a.dataset.price);
      }

      container.innerHTML = "";
      products.forEach(product => container.appendChild(product));
    });
  }


  // ========================
  // SHOP NOW BUTTON (HOME PAGE)
  // ========================
  const shopBtn = document.getElementById("shop-now-btn");

  if (shopBtn) {
    shopBtn.addEventListener("click", function () {
      document.getElementById("categories").scrollIntoView({
        behavior: "smooth"
      });
    });
  }

});
