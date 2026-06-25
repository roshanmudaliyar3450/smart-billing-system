var defaultProducts = [
  { id: 1, name: "Milk",    price: 25,  qty: 100, emoji: "🥛" },
  { id: 2, name: "Bread",   price: 35,  qty: 80,  emoji: "🍞" },
  { id: 3, name: "Rice",    price: 60,  qty: 200, emoji: "🍚" },
  { id: 4, name: "Oil",     price: 120, qty: 50,  emoji: "🫙" },
  { id: 5, name: "Sugar",   price: 45,  qty: 150, emoji: "🍬" },
  { id: 6, name: "Tea",     price: 80,  qty: 60,  emoji: "🍵" },
  { id: 7, name: "Biscuit", price: 20,  qty: 120, emoji: "🍪" }
];


var cart = [];

function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}


function loadData(key) {
  var item = localStorage.getItem(key);
  return item ? JSON.parse(item) : null;
}


function getProducts() {
  var saved = loadData("sb_products");
  if (!saved || saved.length === 0) {
    saveData("sb_products", defaultProducts);
    return defaultProducts;
  }
  return saved;
}


function getBills() {
  return loadData("sb_bills") || [];
}


function getCustomers() {
  return loadData("sb_customers") || [];
}


function getSettings() {
  return loadData("sb_settings") || {
    shopName:    "My Shop",
    shopAddress: "",
    shopPhone:   "",
    gst:         18
  };
}







function handleLogin(event) {
  event.preventDefault(); 

  var username = document.getElementById("username").value.trim();
  var password = document.getElementById("password").value.trim();
  var errorBox = document.getElementById("loginError");

 
  if (username === "admin" && password === "admin123") {
    
    localStorage.setItem("sb_loggedIn", "yes");
    
    window.location.href = "dashboard.html";
  } else {
    
    errorBox.style.display = "block";
  }
}


function logoutUser() {
  localStorage.setItem("sb_loggedIn", "no");
  window.location.href = "index.html";
}


function checkLogin() {
  var loggedIn = localStorage.getItem("sb_loggedIn");
  if (loggedIn !== "yes") {
    window.location.href = "index.html";
  }
}



function loadDashboard() {
  checkLogin();


  var dateEl = document.getElementById("currentDate");
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString("en-IN", {
      weekday: "long", year: "numeric", month: "long", day: "numeric"
    });
  }

  
  var settings = getSettings();
  var shopBadge = document.getElementById("shopNameDisplay");
  if (shopBadge) shopBadge.textContent = "🏪 " + settings.shopName;


  var products = getProducts();
  setEl("totalProducts", products.length);


  var customers = getCustomers();
  setEl("totalCustomers", customers.length);


  var bills = getBills();
  setEl("totalBills", bills.length);

  var totalSales = 0;
  bills.forEach(function(bill) {
    totalSales += bill.grandTotal;
  });
  setEl("totalSales", "₹" + totalSales.toFixed(2));


  var tbody = document.getElementById("recentBillsBody");
  if (!tbody) return;

  if (bills.length === 0) {
    tbody.innerHTML = "<tr><td colspan='4' class='empty-row'>No bills yet. Go to Billing to create one!</td></tr>";
    return;
  }


  var recent = bills.slice().reverse().slice(0, 5);
  tbody.innerHTML = "";

  recent.forEach(function(bill) {
    var row = "<tr>" +
      "<td>#" + bill.billNo + "</td>" +
      "<td>" + (bill.customerName || "Walk-in Customer") + "</td>" +
      "<td>₹" + bill.grandTotal.toFixed(2) + "</td>" +
      "<td>" + bill.date + "</td>" +
      "</tr>";
    tbody.innerHTML += row;
  });
}


function setEl(id, text) {
  var el = document.getElementById(id);
  if (el) el.textContent = text;
}



function loadBillingPage() {
  checkLogin();
  cart = []; 
  renderProductGrid(getProducts());
  updateCartDisplay();
}


function renderProductGrid(products) {
  var grid = document.getElementById("productGrid");
  if (!grid) return;

  grid.innerHTML = "";

  if (products.length === 0) {
    grid.innerHTML = "<p style='color:#94a3b8;font-size:13px;'>No products found.</p>";
    return;
  }

  products.forEach(function(product) {
    var card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML =
      "<span class='p-emoji'>" + (product.emoji || "📦") + "</span>" +
      "<div class='p-name'>" + product.name + "</div>" +
      "<div class='p-price'>₹" + product.price + "</div>";

    card.onclick = function() {
      addToCart(product);
    };

    grid.appendChild(card);
  });
}


function searchProducts() {
  var query = document.getElementById("productSearch").value.toLowerCase();
  var all = getProducts();
  var filtered = all.filter(function(p) {
    return p.name.toLowerCase().includes(query);
  });
  renderProductGrid(filtered);
}


function addToCart(product) {
  var existing = cart.find(function(item) {
    return item.id === product.id;
  });

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id:    product.id,
      name:  product.name,
      price: product.price,
      qty:   1
    });
  }

  updateCartDisplay();
}


function increaseQty(productId) {
  var item = cart.find(function(i) { return i.id === productId; });
  if (item) item.qty += 1;
  updateCartDisplay();
}


function decreaseQty(productId) {
  var item = cart.find(function(i) { return i.id === productId; });
  if (item) {
    item.qty -= 1;
    if (item.qty <= 0) {
      removeFromCart(productId);
      return;
    }
  }
  updateCartDisplay();
}


function removeFromCart(productId) {
  cart = cart.filter(function(i) { return i.id !== productId; });
  updateCartDisplay();
}


function clearCart() {
  cart = [];
  updateCartDisplay();
}


function updateCartDisplay() {
  var cartDiv = document.getElementById("cartItems");
  if (!cartDiv) return;

  if (cart.length === 0) {
    cartDiv.innerHTML = "<p class='empty-cart-msg'>No items added yet.<br/>Click a product to add it.</p>";
    setEl("subtotal",   "₹0.00");
    setEl("gstAmount",  "₹0.00");
    setEl("totalAmount","₹0.00");
    return;
  }

  
  cartDiv.innerHTML = "";
  var subtotal = 0;

  cart.forEach(function(item) {
    var lineTotal = item.price * item.qty;
    subtotal += lineTotal;

    var row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML =
      "<div>" +
        "<div class='cart-item-name'>" + item.name + "</div>" +
        "<div class='cart-item-price'>₹" + item.price + " × " + item.qty + " = ₹" + lineTotal.toFixed(2) + "</div>" +
      "</div>" +
      "<div class='qty-controls'>" +
        "<button class='qty-btn' onclick='decreaseQty(" + item.id + ")'>−</button>" +
        "<span class='qty-num'>" + item.qty + "</span>" +
        "<button class='qty-btn' onclick='increaseQty(" + item.id + ")'>+</button>" +
      "</div>" +
      "<button class='remove-btn' onclick='removeFromCart(" + item.id + ")' title='Remove'>🗑</button>";

    cartDiv.appendChild(row);
  });

  
  var settings = getSettings();
  var gstRate  = settings.gst / 100;
  var gstAmt   = subtotal * gstRate;
  var total    = subtotal + gstAmt;

  
  setEl("gstLabel", settings.gst);

  
  setEl("subtotal",   "₹" + subtotal.toFixed(2));
  setEl("gstAmount",  "₹" + gstAmt.toFixed(2));
  setEl("totalAmount","₹" + total.toFixed(2));
}


function generateBill() {
  if (cart.length === 0) {
    alert("Please add at least one item to the cart.");
    return;
  }

  var settings     = getSettings();
  var customerName = document.getElementById("customerName").value.trim() || "Walk-in Customer";
  var customerPhone= document.getElementById("customerPhone").value.trim();

  
  var subtotal = 0;
  cart.forEach(function(item) { subtotal += item.price * item.qty; });

  var gstRate = settings.gst / 100;
  var gstAmt  = subtotal * gstRate;
  var total   = subtotal + gstAmt;

  
  var bills  = getBills();
  var billNo = bills.length + 1;
  var dateNow = new Date().toLocaleDateString("en-IN");

  
  var newBill = {
    billNo:       billNo,
    customerName: customerName,
    customerPhone:customerPhone,
    items:        JSON.parse(JSON.stringify(cart)), 
    subtotal:     subtotal,
    gst:          gstAmt,
    gstPercent:   settings.gst,
    grandTotal:   total,
    date:         dateNow
  };

  
  bills.push(newBill);
  saveData("sb_bills", bills);

  
  if (customerName !== "Walk-in Customer" && customerPhone) {
    saveCustomerFromBilling(customerName, customerPhone);
  }

  
  showBillModal(newBill, settings.shopName);
}


function showBillModal(bill, shopName) {
  setEl("billShopName",  shopName);
  setEl("billNumber",    bill.billNo);
  setEl("billDate",      bill.date);
  setEl("billCustomer",  bill.customerName + (bill.customerPhone ? " | " + bill.customerPhone : ""));

  
  var tbody = document.getElementById("billItemsBody");
  tbody.innerHTML = "";
  bill.items.forEach(function(item) {
    var row = "<tr>" +
      "<td>" + item.name + "</td>" +
      "<td>" + item.qty + "</td>" +
      "<td>₹" + item.price.toFixed(2) + "</td>" +
      "<td>₹" + (item.price * item.qty).toFixed(2) + "</td>" +
      "</tr>";
    tbody.innerHTML += row;
  });

  setEl("billSubtotal",  "₹" + bill.subtotal.toFixed(2));
  setEl("billGst",       "₹" + bill.gst.toFixed(2) + " (" + bill.gstPercent + "%)");
  setEl("billGrandTotal","₹" + bill.grandTotal.toFixed(2));

  
  document.getElementById("billModal").style.display = "flex";
}


function closeBillModal() {
  document.getElementById("billModal").style.display = "none";
  clearCart();

  
  var cn = document.getElementById("customerName");
  var cp = document.getElementById("customerPhone");
  if (cn) cn.value = "";
  if (cp) cp.value = "";
}


function printBill() {
  window.print();
}


function saveCustomerFromBilling(name, phone) {
  var customers = getCustomers();
  var exists = customers.find(function(c) { return c.phone === phone; });
  if (!exists) {
    customers.push({
      id:    Date.now(),
      name:  name,
      phone: phone,
      email: "",
      date:  new Date().toLocaleDateString("en-IN")
    });
    saveData("sb_customers", customers);
  }
}






function loadInventoryPage() {
  checkLogin();
  renderInventoryTable();
}


function renderInventoryTable() {
  var tbody = document.getElementById("inventoryTableBody");
  if (!tbody) return;

  var products = getProducts();

  if (products.length === 0) {
    tbody.innerHTML = "<tr><td colspan='5' class='empty-row'>No products. Add one above!</td></tr>";
    return;
  }

  tbody.innerHTML = "";

  products.forEach(function(product, index) {
    var row = "<tr>" +
      "<td>" + (index + 1) + "</td>" +
      "<td>" + (product.emoji || "📦") + " " + product.name + "</td>" +
      "<td>₹" + product.price + "</td>" +
      "<td>" + product.qty + "</td>" +
      "<td>" +
        "<button class='btn btn-primary btn-sm' onclick='editProduct(" + product.id + ")'>✏️ Edit</button> " +
        "<button class='btn btn-danger btn-sm' onclick='deleteProduct(" + product.id + ")'>🗑 Delete</button>" +
      "</td>" +
      "</tr>";
    tbody.innerHTML += row;
  });
}


function saveProduct() {
  var name  = document.getElementById("productName").value.trim();
  var price = parseFloat(document.getElementById("productPrice").value);
  var qty   = parseInt(document.getElementById("productQty").value);
  var editId= document.getElementById("editProductId").value;

  
  if (!name) { alert("Please enter a product name."); return; }
  if (isNaN(price) || price < 0) { alert("Please enter a valid price."); return; }
  if (isNaN(qty) || qty < 0) { alert("Please enter a valid quantity."); return; }

  var products = getProducts();

  if (editId) {
    
    var id = parseInt(editId);
    products = products.map(function(p) {
      if (p.id === id) {
        p.name  = name;
        p.price = price;
        p.qty   = qty;
      }
      return p;
    });
    showToast("✅ Product updated successfully!");
  } else {
    
    var newProduct = {
      id:    Date.now(), 
      name:  name,
      price: price,
      qty:   qty,
      emoji: "📦"
    };
    products.push(newProduct);
    showToast("✅ Product added successfully!");
  }

  saveData("sb_products", products);
  cancelEdit();         
  renderInventoryTable(); 
}


function editProduct(productId) {
  var products = getProducts();
  var product  = products.find(function(p) { return p.id === productId; });
  if (!product) return;

  document.getElementById("productName").value  = product.name;
  document.getElementById("productPrice").value = product.price;
  document.getElementById("productQty").value   = product.qty;
  document.getElementById("editProductId").value= product.id;

  
  setEl("formTitle", "✏️ Edit Product: " + product.name);

  
  window.scrollTo({ top: 0, behavior: "smooth" });
}


function cancelEdit() {
  document.getElementById("productName").value   = "";
  document.getElementById("productPrice").value  = "";
  document.getElementById("productQty").value    = "";
  document.getElementById("editProductId").value = "";
  setEl("formTitle", "➕ Add New Product");
}


function deleteProduct(productId) {
  var confirm = window.confirm("Are you sure you want to delete this product?");
  if (!confirm) return;

  var products = getProducts();
  products = products.filter(function(p) { return p.id !== productId; });
  saveData("sb_products", products);
  renderInventoryTable();
  showToast("🗑 Product deleted.");
}






function loadCustomersPage() {
  checkLogin();
  renderCustomersTable();
}


function addCustomer() {
  var name  = document.getElementById("custName").value.trim();
  var phone = document.getElementById("custPhone").value.trim();
  var email = document.getElementById("custEmail").value.trim();

  if (!name)  { alert("Please enter a customer name."); return; }
  if (!phone) { alert("Please enter a phone number."); return; }

  
  var customers = getCustomers();
  var duplicate = customers.find(function(c) { return c.phone === phone; });
  if (duplicate) {
    alert("A customer with this phone number already exists.");
    return;
  }

  customers.push({
    id:    Date.now(),
    name:  name,
    phone: phone,
    email: email,
    date:  new Date().toLocaleDateString("en-IN")
  });

  saveData("sb_customers", customers);

  
  document.getElementById("custName").value  = "";
  document.getElementById("custPhone").value = "";
  document.getElementById("custEmail").value = "";

  renderCustomersTable();
  showToast("✅ Customer added!");
}


function renderCustomersTable() {
  var tbody     = document.getElementById("customersTableBody");
  var countSpan = document.getElementById("custCount");
  if (!tbody) return;

  var customers = getCustomers();

  if (countSpan) countSpan.textContent = customers.length;

  if (customers.length === 0) {
    tbody.innerHTML = "<tr><td colspan='6' class='empty-row'>No customers yet. Add one above!</td></tr>";
    return;
  }

  tbody.innerHTML = "";

  customers.forEach(function(cust, index) {
    var row = "<tr>" +
      "<td>" + (index + 1) + "</td>" +
      "<td>" + cust.name + "</td>" +
      "<td>" + cust.phone + "</td>" +
      "<td>" + (cust.email || "–") + "</td>" +
      "<td>" + cust.date + "</td>" +
      "<td>" +
        "<button class='btn btn-danger btn-sm' onclick='deleteCustomer(" + cust.id + ")'>🗑 Delete</button>" +
      "</td>" +
      "</tr>";
    tbody.innerHTML += row;
  });
}


function deleteCustomer(custId) {
  if (!window.confirm("Delete this customer?")) return;
  var customers = getCustomers().filter(function(c) { return c.id !== custId; });
  saveData("sb_customers", customers);
  renderCustomersTable();
  showToast("🗑 Customer deleted.");
}






function loadReportsPage() {
  checkLogin();

  var bills    = getBills();
  var settings = getSettings();

  
  setEl("rptTotalBills", bills.length);

  
  var totalSales = 0;
  bills.forEach(function(b) { totalSales += b.grandTotal; });
  setEl("rptTotalSales", "₹" + totalSales.toFixed(2));

  
  var today = new Date().toLocaleDateString("en-IN");
  var todayTotal = 0;
  bills.forEach(function(b) {
    if (b.date === today) todayTotal += b.grandTotal;
  });
  setEl("todaySales", "₹" + todayTotal.toFixed(2));

  
  var productQtyMap = {};
  bills.forEach(function(bill) {
    bill.items.forEach(function(item) {
      if (!productQtyMap[item.name]) {
        productQtyMap[item.name] = { qty: 0, revenue: 0 };
      }
      productQtyMap[item.name].qty     += item.qty;
      productQtyMap[item.name].revenue += item.price * item.qty;
    });
  });

  
  var bestName = "–";
  var bestQty  = 0;
  Object.keys(productQtyMap).forEach(function(name) {
    if (productQtyMap[name].qty > bestQty) {
      bestQty  = productQtyMap[name].qty;
      bestName = name;
    }
  });
  setEl("bestProduct", bestName);

  
  var allBillsBody = document.getElementById("allBillsBody");
  if (allBillsBody) {
    if (bills.length === 0) {
      allBillsBody.innerHTML = "<tr><td colspan='7' class='empty-row'>No bills found.</td></tr>";
    } else {
      allBillsBody.innerHTML = "";
      var reversed = bills.slice().reverse(); 
      reversed.forEach(function(bill) {
        var itemNames = bill.items.map(function(i) { return i.name; }).join(", ");
        var row = "<tr>" +
          "<td>#" + bill.billNo + "</td>" +
          "<td>" + (bill.customerName || "Walk-in") + "</td>" +
          "<td style='font-size:12px;max-width:180px;'>" + itemNames + "</td>" +
          "<td>₹" + bill.subtotal.toFixed(2) + "</td>" +
          "<td>₹" + bill.gst.toFixed(2) + "</td>" +
          "<td><strong>₹" + bill.grandTotal.toFixed(2) + "</strong></td>" +
          "<td>" + bill.date + "</td>" +
          "</tr>";
        allBillsBody.innerHTML += row;
      });
    }
  }

  
  var prodBody = document.getElementById("productSalesBody");
  if (prodBody) {
    var keys = Object.keys(productQtyMap);
    if (keys.length === 0) {
      prodBody.innerHTML = "<tr><td colspan='3' class='empty-row'>No data yet.</td></tr>";
    } else {
      prodBody.innerHTML = "";
      
      keys.sort(function(a, b) {
        return productQtyMap[b].qty - productQtyMap[a].qty;
      });
      keys.forEach(function(name) {
        var row = "<tr>" +
          "<td>" + name + "</td>" +
          "<td>" + productQtyMap[name].qty + "</td>" +
          "<td>₹" + productQtyMap[name].revenue.toFixed(2) + "</td>" +
          "</tr>";
        prodBody.innerHTML += row;
      });
    }
  }
}






function loadSettingsPage() {
  checkLogin();

  
  var settings = getSettings();
  var shopNameEl    = document.getElementById("settingShopName");
  var shopAddrEl    = document.getElementById("settingShopAddress");
  var shopPhoneEl   = document.getElementById("settingShopPhone");
  var gstEl         = document.getElementById("settingGST");

  if (shopNameEl)  shopNameEl.value  = settings.shopName    || "";
  if (shopAddrEl)  shopAddrEl.value  = settings.shopAddress || "";
  if (shopPhoneEl) shopPhoneEl.value = settings.shopPhone   || "";
  if (gstEl)       gstEl.value       = settings.gst         || 18;
}


function saveShopSettings() {
  var settings = getSettings();
  var nameEl   = document.getElementById("settingShopName");
  var addrEl   = document.getElementById("settingShopAddress");
  var phoneEl  = document.getElementById("settingShopPhone");

  if (nameEl)  settings.shopName    = nameEl.value.trim()  || settings.shopName;
  if (addrEl)  settings.shopAddress = addrEl.value.trim();
  if (phoneEl) settings.shopPhone   = phoneEl.value.trim();

  saveData("sb_settings", settings);
  showToast("✅ Shop info saved!");
}


function saveGSTSetting() {
  var gstEl = document.getElementById("settingGST");
  var gst   = parseFloat(gstEl.value);

  if (isNaN(gst) || gst < 0 || gst > 100) {
    alert("Please enter a GST between 0 and 100.");
    return;
  }

  var settings = getSettings();
  settings.gst = gst;
  saveData("sb_settings", settings);
  showToast("✅ GST updated to " + gst + "%");
}


function resetBills() {
  if (!window.confirm("Delete ALL bills? This cannot be undone.")) return;
  localStorage.removeItem("sb_bills");
  showToast("🗑 All bills deleted.");
}


function resetCustomers() {
  if (!window.confirm("Delete ALL customers? This cannot be undone.")) return;
  localStorage.removeItem("sb_customers");
  showToast("🗑 All customers deleted.");
}


function resetAllData() {
  if (!window.confirm("RESET EVERYTHING? All products, bills, customers and settings will be lost!")) return;
  localStorage.removeItem("sb_products");
  localStorage.removeItem("sb_bills");
  localStorage.removeItem("sb_customers");
  localStorage.removeItem("sb_settings");
  showToast("⚠️ All data has been reset!");
  setTimeout(function() { loadSettingsPage(); }, 1000);
}







function showToast(message) {
  
  var toast = document.getElementById("toast");
  if (!toast) {
    
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.style.display = "block";

  
  setTimeout(function() {
    toast.style.display = "none";
  }, 3000);
}
