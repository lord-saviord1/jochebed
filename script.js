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
let cart = [];

function addToCart(itemName) {
    cart.push(itemName);
    document.getElementById('cartItemName').textContent = itemName + ' added to your cart!';
    const modal = new bootstrap.Modal(document.getElementById('cartModal'));
    modal.show();
    
    // Update cart count (visual only)
    console.log('Cart:', cart);
}

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

// Parallax effect for hero
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallax = document.querySelector('.hero');
    if (parallax) {
        parallax.style.transform = 'translateY(' + scrolled * 0.5 + 'px)';
    }
});
