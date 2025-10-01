// ================================
// ======= CONFIGURATION =========
// ================================

// GitHub Integration (Admin Token)
const GITHUB_TOKEN = ""; // <-- এখানে তোমার Personal Access Token বসাও (ghp_*********)
const GITHUB_REPO = "habibt2/your-repo"; // <-- Repo নাম
const GITHUB_PROJECT_ID = 1; // <-- Project Number
const GITHUB_COLUMN_ID = 1; // <-- Column ID যেখানে Card যাবে

// ================================
// ======= CUSTOMER ORDER ========
// ================================

const orderForm = document.getElementById("orderForm");
const orderModal = document.getElementById("orderModal");
const orderDetails = document.getElementById("orderDetails");
const orderNumberElem = document.getElementById("orderNumber");
const closeModal = document.querySelector(".close");

// Order Number Counter
let lastOrderNum = parseInt(localStorage.getItem("lastOrderNum")) || 1000;

// 1 ঘন্টায় 1 নাম্বার 1 বার অর্ডার
function canOrder(phone) {
  const lastTime = localStorage.getItem(`orderTime_${phone}`);
  if (!lastTime) return true;
  const diff = Date.now() - parseInt(lastTime);
  return diff > 3600000; // 1 hour in milliseconds
}

// Show Modal with Order Details
function showOrderModal(orderNum, orderData) {
  orderNumberElem.innerText = "Order #: " + orderNum;
  orderDetails.innerHTML = `
    <p><strong>Name:</strong> ${orderData.name}</p>
    <p><strong>Phone:</strong> ${orderData.phone}</p>
    <p><strong>Address:</strong> ${orderData.address}</p>
    <p><strong>Product:</strong> ${orderData.tshirt}</p>
    <p><strong>Size:</strong> ${orderData.size}</p>
    <p><strong>Memo:</strong> ${orderData.memo || "N/A"}</p>
    <p><strong>Price:</strong> ${orderData.price} BDT</p>
  `;
  orderModal.style.display = "block";
}

// Close Modal
closeModal.onclick = () => { orderModal.style.display = "none"; };
window.onclick = (event) => { if (event.target == orderModal) orderModal.style.display = "none"; };

// ================================
// ======= ORDER FORM SUBMIT ======
// ================================

orderForm.addEventListener("submit", async function(e) {
  e.preventDefault();

  const name = document.getElementById("customerName").value.trim();
  const phone = document.getElementById("customerPhone").value.trim();
  const address = document.getElementById("customerAddress").value.trim();
  const tshirt = document.getElementById("tshirtSelect").value;
  const size = document.getElementById("tshirtSize").value;
  const memo = document.getElementById("orderMemo").value.trim();

  // Phone Validation (+880 format check)
  if (!phone.startsWith("+880") || phone.length < 11) {
    alert("Phone number must start with +880 and be valid!");
    return;
  }

  if (!canOrder(phone)) {
    alert("You can place an order only once per hour with this number.");
    return;
  }

  // Price Mapping
  const priceMap = {
    "Cool Blue Tee": 500,
    "Urban Black Tee": 600,
    "Classic White Tee": 550,
    "2 TShirt Combo": 900,
    "3 TShirt Combo": 1350
  };
  const price = priceMap[tshirt];

  const orderData = { name, phone, address, tshirt, size, memo, price };

  // Increment Order Number
  lastOrderNum++;
  localStorage.setItem("lastOrderNum", lastOrderNum);

  // Save Last Order Time
  localStorage.setItem(`orderTime_${phone}`, Date.now());

  // Save Order in LocalStorage
  let orders = JSON.parse(localStorage.getItem("orders")) || [];
  orders.push({ orderNum: lastOrderNum, ...orderData });
  localStorage.setItem("orders", JSON.stringify(orders));

  // Show Modal
  showOrderModal(lastOrderNum, orderData);

  // Optional: GitHub Project Integration
  if (GITHUB_TOKEN) {
    try {
      await pushOrderToGitHub(orderData, lastOrderNum);
    } catch (err) {
      console.error("GitHub push failed:", err);
    }
  }

  // Reset Form
  orderForm.reset();
});

// ================================
// ======= GITHUB INTEGRATION =====
// ================================

async function pushOrderToGitHub(orderData, orderNum) {
  const url = `https://api.github.com/projects/columns/${GITHUB_COLUMN_ID}/cards`;
  const body = {
    note: `Order #${orderNum}\nName: ${orderData.name}\nPhone: ${orderData.phone}\nAddress: ${orderData.address}\nProduct: ${orderData.tshirt}\nSize: ${orderData.size}\nMemo: ${orderData.memo || "N/A"}\nPrice: ${orderData.price} BDT`
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) throw new Error(`GitHub API Error: ${res.status}`);
  console.log("Order pushed to GitHub Project successfully.");
}
