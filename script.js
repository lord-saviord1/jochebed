// Scroll Animation Observer
const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
};
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
        }
    });
}, observerOptions);
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.padding = '10px 0';
        navbar.style.boxShadow = '0 2px 20px rgba(0,0,0,0.1)';
    } else {
        navbar.style.padding = '15px 0';
        navbar.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';
    }
});
// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
// Cart functionality
const WHATSAPP_NUMBER = '2347077310948';
let cart = {}; // { itemName: { price, qty } }

function addToCart(itemName, price) {
    if (!cart[itemName]) {
        cart[itemName] = { price: price, qty: 0 };
    }
    cart[itemName].qty += 1;

    document.getElementById('cartItemName').textContent = itemName + ' added to your order!';
    const modal = new bootstrap.Modal(document.getElementById('cartModal'));
    modal.show();

    renderCart();
}

function changeQty(itemName, delta) {
    if (!cart[itemName]) return;
    cart[itemName].qty += delta;
    if (cart[itemName].qty <= 0) {
        delete cart[itemName];
    }
    renderCart();
}

function formatNaira(amount) {
    return '₦' + amount.toLocaleString('en-NG');
}

function renderCart() {
    const container = document.getElementById('cartItemsContainer');
    const emptyMsg = document.getElementById('cartEmptyMsg');
    const totalsWrap = document.getElementById('cartTotalsWrap');
    const totalAmountEl = document.getElementById('cartTotalAmount');
    const countBadge = document.getElementById('cartCountBadge');

    const itemNames = Object.keys(cart);
    let totalCount = 0;
    let totalAmount = 0;

    itemNames.forEach(name => {
        totalCount += cart[name].qty;
        totalAmount += cart[name].qty * cart[name].price;
    });

    // Update nav badge
    if (totalCount > 0) {
        countBadge.textContent = totalCount;
        countBadge.classList.remove('d-none-zero');
    } else {
        countBadge.classList.add('d-none-zero');
    }

    if (itemNames.length === 0) {
        container.innerHTML = '';
        container.appendChild(emptyMsg);
        emptyMsg.style.display = 'block';
        totalsWrap.classList.add('d-none');
        return;
    }

    let html = '';
    itemNames.forEach(name => {
        const item = cart[name];
        html += `
            <div class="cart-line-item">
                <div>
                    <div class="cart-line-name">${name}</div>
                    <div class="cart-line-price">${formatNaira(item.price)} each</div>
                </div>
                <div class="cart-qty-controls">
                    <button type="button" onclick="changeQty('${name}', -1)" aria-label="Remove one">−</button>
                    <span>${item.qty}</span>
                    <button type="button" onclick="changeQty('${name}', 1)" aria-label="Add one">+</button>
                </div>
            </div>`;
    });
    container.innerHTML = html;
    totalsWrap.classList.remove('d-none');
    totalAmountEl.textContent = formatNaira(totalAmount);
}

function buildWhatsappMessage() {
    const name = document.getElementById('orderName').value.trim();
    const fulfillment = document.getElementById('orderFulfillment').value;
    const address = document.getElementById('orderAddress').value.trim();

    let lines = [];
    lines.push("Hi Jochebed's Touch, I'd like to place an order:");
    lines.push('');

    let total = 0;
    Object.keys(cart).forEach(name => {
        const item = cart[name];
        const lineTotal = item.qty * item.price;
        total += lineTotal;
        lines.push(`- ${item.qty}x ${name} — ${formatNaira(lineTotal)}`);
    });

    lines.push('');
    lines.push(`Total: ${formatNaira(total)}`);
    lines.push('');
    lines.push(`Name: ${name || '___'}`);
    lines.push(`${fulfillment}: ${fulfillment === 'Delivery' ? (address || '___') : 'At the restaurant'}`);

    if (fulfillment === 'Delivery') {
        lines.push('');
        lines.push("(Delivery is case-by-case, please confirm if it's available right now.)");
    }

    return lines.join('\n');
}

document.getElementById('cartOpenBtn').addEventListener('click', () => {
    const offcanvas = new bootstrap.Offcanvas(document.getElementById('cartOffcanvas'));
    offcanvas.show();
});

document.getElementById('goToOrderBtn').addEventListener('click', () => {
    setTimeout(() => {
        const offcanvas = new bootstrap.Offcanvas(document.getElementById('cartOffcanvas'));
        offcanvas.show();
    }, 300);
});

document.getElementById('orderFulfillment').addEventListener('change', (e) => {
    const addressField = document.getElementById('deliveryAddressField');
    if (e.target.value === 'Delivery') {
        addressField.classList.remove('d-none');
    } else {
        addressField.classList.add('d-none');
    }
});

document.getElementById('sendWhatsappBtn').addEventListener('click', () => {
    if (Object.keys(cart).length === 0) return;
    const name = document.getElementById('orderName').value.trim();
    if (!name) {
        document.getElementById('orderName').focus();
        return;
    }
    const message = buildWhatsappMessage();
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
});

renderCart();
// Form submissions
document.getElementById('reservationForm').addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Thank you for your reservation! We will contact you shortly to confirm.');
    e.target.reset();
});
document.getElementById('newsletterForm').addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Thank you for subscribing to our newsletter!');
    e.target.reset();
});
// Create floating leaves animation
function createLeaf() {
    const leaf = document.createElement('div');
    leaf.className = 'floating-leaf';
    leaf.style.left = Math.random() * window.innerWidth + 'px';
    leaf.style.top = '-50px';
    leaf.style.animationDuration = (Math.random() * 5 + 5) + 's';
    leaf.style.opacity = Math.random() * 0.3 + 0.1;
    document.body.appendChild(leaf);
    
    setTimeout(() => leaf.remove(), 10000);
}
// Create leaves occasionally
setInterval(createLeaf, 3000);
