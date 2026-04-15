from flask import Flask, render_template, session, redirect, url_for, request
import sqlite3

app = Flask(__name__)
app.secret_key = "mysecretkey123"


# =========================
# DATABASE CONNECTION
# =========================
def get_db_connection():
    conn = sqlite3.connect("database.db")
    conn.row_factory = sqlite3.Row
    return conn


# =========================
# CREATE ORDERS TABLE
# =========================
def create_orders_table():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            phone_number TEXT NOT NULL,
            address TEXT NOT NULL,
            payment_method TEXT NOT NULL,
            subtotal REAL NOT NULL,
            delivery_fee REAL NOT NULL,
            total REAL NOT NULL
        )
    """)

    conn.commit()
    conn.close()


# =========================
# CREATE ORDER ITEMS TABLE
# =========================
def create_order_items_table():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            price REAL NOT NULL
        )
    """)

    conn.commit()
    conn.close()


# =========================
# CART COUNT HELPER
# =========================
def get_cart_count():
    cart = session.get("cart", {})
    return sum(cart.values())


# =========================
# HOME PAGE
# =========================
@app.route("/")
def home():
    return render_template("home.html", cart_count=get_cart_count())


# =========================
# MEN PAGE
# =========================
@app.route("/men")
def men():
    conn = get_db_connection()
    products = conn.execute("SELECT * FROM products WHERE category = 'men'").fetchall()
    conn.close()
    return render_template("men.html", products=products, cart_count=get_cart_count())


# =========================
# WOMEN PAGE
# =========================
@app.route("/women")
def women():
    conn = get_db_connection()
    products = conn.execute("SELECT * FROM products WHERE category = 'women'").fetchall()
    conn.close()
    return render_template("women.html", products=products, cart_count=get_cart_count())


# =========================
# PRODUCT DETAILS
# =========================
@app.route("/product/<int:product_id>")
def product_details(product_id):
    conn = get_db_connection()
    product = conn.execute("SELECT * FROM products WHERE id = ?", (product_id,)).fetchone()
    conn.close()
    return render_template("product-details.html", product=product, cart_count=get_cart_count())


# =========================
# ADD TO CART
# =========================
@app.route("/add-to-cart/<int:product_id>")
def add_to_cart(product_id):
    if "cart" not in session:
        session["cart"] = {}

    cart = session["cart"]
    product_id = str(product_id)

    if product_id in cart:
        cart[product_id] += 1
    else:
        cart[product_id] = 1

    session["cart"] = cart
    session.modified = True

    return redirect(url_for("cart"))


# =========================
# INCREASE CART QUANTITY
# =========================
@app.route("/increase-cart/<int:product_id>")
def increase_cart(product_id):
    cart = session.get("cart", {})
    product_id = str(product_id)

    if product_id in cart:
        cart[product_id] += 1
    else:
        cart[product_id] = 1

    session["cart"] = cart
    session.modified = True

    return redirect(url_for("cart"))


# =========================
# DECREASE CART QUANTITY
# =========================
@app.route("/decrease-cart/<int:product_id>")
def decrease_cart(product_id):
    cart = session.get("cart", {})
    product_id = str(product_id)

    if product_id in cart:
        cart[product_id] -= 1

        if cart[product_id] <= 0:
            del cart[product_id]

    session["cart"] = cart
    session.modified = True

    return redirect(url_for("cart"))


# =========================
# REMOVE FROM CART
# =========================
@app.route("/remove-from-cart/<int:product_id>")
def remove_from_cart(product_id):
    cart = session.get("cart", {})
    product_id = str(product_id)

    if product_id in cart:
        del cart[product_id]

    session["cart"] = cart
    session.modified = True

    return redirect(url_for("cart"))


# =========================
# CART PAGE
# =========================
@app.route("/cart")
def cart():
    cart = session.get("cart", {})

    conn = get_db_connection()
    cart_items = []
    subtotal = 0

    for product_id, quantity in cart.items():
        product = conn.execute("SELECT * FROM products WHERE id = ?", (product_id,)).fetchone()

        if product:
            item_total = product["price"] * quantity
            subtotal += item_total

            cart_items.append({
                "id": product["id"],
                "name": product["name"],
                "price": product["price"],
                "image": product["image"],
                "quantity": quantity,
                "item_total": item_total
            })

    conn.close()

    delivery_fee = 5
    total = subtotal + delivery_fee if subtotal > 0 else 0

    return render_template(
        "cart.html",
        cart_items=cart_items,
        subtotal=subtotal,
        delivery_fee=delivery_fee,
        total=total,
        cart_count=get_cart_count()
    )


# =========================
# CHECKOUT
# =========================
@app.route("/checkout", methods=["GET", "POST"])
def checkout():
    cart = session.get("cart", {})
    conn = get_db_connection()

    cart_items = []
    subtotal = 0

    for product_id, quantity in cart.items():
        product = conn.execute("SELECT * FROM products WHERE id = ?", (product_id,)).fetchone()

        if product:
            item_total = product["price"] * quantity
            subtotal += item_total

            cart_items.append({
                "id": product["id"],
                "name": product["name"],
                "price": product["price"],
                "image": product["image"],
                "quantity": quantity,
                "item_total": item_total
            })

    delivery_fee = 5
    total = subtotal + delivery_fee if subtotal > 0 else 0

    if request.method == "POST":
        full_name = request.form.get("full_name")
        phone_number = request.form.get("phone_number")
        address = request.form.get("address")
        payment_method = request.form.get("payment_method")
        card_number = request.form.get("card_number")
        expiry_date = request.form.get("expiry_date")
        cvv = request.form.get("cvv")

        if not cart_items:
            conn.close()
            return "Your cart is empty."

        if not full_name or not phone_number or not address or not payment_method:
            conn.close()
            return "Please fill all required fields."

        if payment_method == "Visa":
            if not card_number or not expiry_date or not cvv:
                conn.close()
                return "Please fill in all Visa details."

            if not card_number.isdigit() or not cvv.isdigit():
                conn.close()
                return "Card number and CVV must contain digits only."

        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO orders (full_name, phone_number, address, payment_method, subtotal, delivery_fee, total)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (full_name, phone_number, address, payment_method, subtotal, delivery_fee, total))

        order_id = cursor.lastrowid

        for item in cart_items:
            cursor.execute("""
                INSERT INTO order_items (order_id, product_id, quantity, price)
                VALUES (?, ?, ?, ?)
            """, (order_id, item["id"], item["quantity"], item["price"]))

        conn.commit()
        conn.close()

        session.pop("cart", None)

        return render_template("checkout-success.html", cart_count=0, order_id=order_id)

    conn.close()

    return render_template(
        "checkout.html",
        cart_items=cart_items,
        subtotal=subtotal,
        delivery_fee=delivery_fee,
        total=total,
        cart_count=get_cart_count()
    )


# =========================
# ORDERS PAGE
# =========================
@app.route("/orders")
def orders():
    conn = get_db_connection()
    orders = conn.execute("SELECT * FROM orders ORDER BY id DESC").fetchall()
    conn.close()

    return render_template("orders.html", orders=orders, cart_count=get_cart_count())


# =========================
# ORDER DETAILS PAGE
# =========================
@app.route("/order/<int:order_id>")
def order_details(order_id):
    conn = get_db_connection()

    order = conn.execute(
        "SELECT * FROM orders WHERE id = ?",
        (order_id,)
    ).fetchone()

    items = conn.execute("""
        SELECT order_items.quantity, order_items.price, products.name, products.image
        FROM order_items
        JOIN products ON order_items.product_id = products.id
        WHERE order_items.order_id = ?
    """, (order_id,)).fetchall()

    conn.close()

    return render_template(
        "order-details.html",
        order=order,
        items=items,
        cart_count=get_cart_count()
    )


# =========================
# RUN APP
# =========================
if __name__ == "__main__":
    create_orders_table()
    create_order_items_table()
    app.run(debug=True)