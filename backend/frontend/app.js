// API Configuration
const API_BASE_URL = https://expiryguard-backend-eosz.onrender.com;

// Utility Functions
function showNotification(message, type = 'info') {
    const banner = document.getElementById('notification-banner');
    const text = document.getElementById('notification-text');
    
    text.textContent = message;
    banner.style.backgroundColor = type === 'error' ? '#f44336' : type === 'success' ? '#4CAF50' : '#ff9800';
    banner.style.display = 'flex';
    
    setTimeout(() => {
        closeNotification();
    }, 5000);
}

function closeNotification() {
    document.getElementById('notification-banner').style.display = 'none';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

// Authentication Functions
function getAuthToken() {
    return localStorage.getItem('expiryguard_token');
}

function setAuthToken(token) {
    localStorage.setItem('expiryguard_token', token);
}

function removeAuthToken() {
    localStorage.removeItem('expiryguard_token');
    localStorage.removeItem('expiryguard_user');
}

function getCurrentUser() {
    const user = localStorage.getItem('expiryguard_user');
    return user ? JSON.parse(user) : null;
}

function setCurrentUser(user) {
    localStorage.setItem('expiryguard_user', JSON.stringify(user));
}

// API Functions
async function apiRequest(endpoint, options = {}) {
    const config = {
        headers: {
            'Content-Type': 'application/json',
        },
        ...options
    };

    if (options.body) {
        config.body = JSON.stringify(options.body);
    }

    try {
        const response = await fetch(${API_BASE_URL}${endpoint}, config);
        
        if (!response.ok) {
            throw new Error(HTTP error! status: ${response.status});
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
}

// Auth API - UPDATED FOR JSON SERVER
async function loginUser(email, password) {
    // For JSON Server, we search for user by email and password
    const users = await apiRequest(/users?email=${email}&password=${password});
    
    if (users.length === 0) {
        throw new Error('Invalid email or password');
    }
    
    const user = users[0];
    
    // Simulate token generation
    const token = btoa(JSON.stringify({ userId: user.id, email: user.email }));
    
    return { token, user };
}

async function registerUser(name, email, password) {
    // Check if user already exists
    const existingUsers = await apiRequest(/users?email=${email});
    
    if (existingUsers.length > 0) {
        throw new Error('User already exists with this email');
    }

    // Create new user
    const newUser = {
        name,
        email,
        password,
        id: Date.now() // Simple ID generation
    };

    const user = await apiRequest('/users', {
        method: 'POST',
        body: newUser
    });

    // Simulate token generation
    const token = btoa(JSON.stringify({ userId: user.id, email: user.email }));

    return { token, user };
}

// Items API - UPDATED FOR JSON SERVER
async function getItems() {
    const items = await apiRequest('/products');
    
    // Calculate days remaining and status for each item
    return items.map(item => {
        const expiryDate = new Date(item.expiryDate);
        const today = new Date();
        const daysRemaining = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        
        let status = 'normal';
        if (daysRemaining <= 3) status = 'urgent';
        else if (daysRemaining <= 7) status = 'warning';
        
        return {
            ...item,
            _id: item.id, // Map id to _id for compatibility
            daysRemaining,
            status
        };
    });
}

async function getStats() {
    const items = await getItems();
    
    const urgent = items.filter(item => item.status === 'urgent').length;
    const warning = items.filter(item => item.status === 'warning').length;
    const total = items.length;
    
    return { urgent, warning, total };
}

async function addItem(itemData) {
    const newItem = {
        ...itemData,
        id: Date.now(), // Simple ID generation
        userId: getCurrentUser()?.id || 1
    };

    return await apiRequest('/products', {
        method: 'POST',
        body: newItem
    });
}

async function deleteItem(itemId) {
    return await apiRequest(/products/${itemId}, {
        method: 'DELETE'
    });
}

async function searchItems(query) {
    const items = await getItems();
    return items.filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
    );
}

// Barcode Simulation Functions
function simulateBarcodeScan(barcode) {
    showNotification(Barcode scanned: ${barcode}, 'success');
    
    // Map barcodes to product names
    const productMap = {
        '123456789012': 'Fresh Milk',
        '234567890123': 'Whole Wheat Bread', 
        '345678901234': 'Pain Relief Tablets',
        '456789012345': 'Laundry Detergent'
    };
    
    const itemName = productMap[barcode] || Product-${barcode};
    document.getElementById('item-name').value = itemName;
    
    // Auto-select category based on product type
    if (barcode === '345678901234') {
        document.getElementById('item-category').value = 'Medicine';
    } else if (barcode === '456789012345') {
        document.getElementById('item-category').value = 'Household';
    } else {
        document.getElementById('item-category').value = 'Food';
    }
    
    closeScannerModal();
    openModal('add-item-modal');
}

function startBarcodeScanning() {
    showNotification('Barcode scanner activated! Use test buttons to simulate scanning.', 'info');
}

function manualBarcodeEntry() {
    const barcode = prompt('Enter barcode manually:');
    if (barcode) {
        simulateBarcodeScan(barcode);
    }
}

function closeScannerModal() {
    closeModal('scanner-modal');
}

// Update the scanner button event listener
document.getElementById('scan-barcode-btn').addEventListener('click', () => {
    openModal('scanner-modal');
});

// UI Functions
function showLandingPage() {
    document.getElementById('landing-page').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('auth-container').style.display = 'none';
    updateNavigation('home');
}

function showDashboard() {
    document.getElementById('landing-page').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('auth-container').style.display = 'none';
    updateNavigation('dashboard');
    loadDashboardData();
}

function showAuth() {
    document.getElementById('landing-page').style.display = 'none';
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('auth-container').style.display = 'block';
    updateNavigation('auth');
}

function updateNavigation(activePage) {
    const links = document.querySelectorAll('nav a');
    links.forEach(link => link.classList.remove('active'));
    
    if (activePage === 'home') {
        document.getElementById('home-link').classList.add('active');
    } else if (activePage === 'dashboard') {
        document.getElementById('dashboard-link').classList.add('active');
    }
}

function updateAuthButtons(isLoggedIn) {
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    const logoutBtn = document.getElementById('logout-btn');

    if (isLoggedIn) {
        loginBtn.style.display = 'none';
        signupBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-block';
    } else {
        loginBtn.style.display = 'inline-block';
        signupBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
    }
}

async function loadDashboardData() {
    try {
        const [items, stats] = await Promise.all([getItems(), getStats()]);
        
        // Update stats
        document.getElementById('urgent-count').textContent = stats.urgent;
        document.getElementById('warning-count').textContent = stats.warning;
        document.getElementById('total-count').textContent = stats.total;
        
        // Update items table
        renderItemsTable(items);
    } catch (error) {
        showNotification('Failed to load dashboard data', 'error');
    }
}

function renderItemsTable(items) {
    const tbody = document.getElementById('items-table-body');
    tbody.innerHTML = '';

    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">No items found. Add your first item to get started!</td></tr>';
        return;
    }

    items.forEach(item => {
        const row = document.createElement('tr');
        
        // Determine status class
        let statusClass = 'expiry-normal';
        if (item.status === 'urgent') statusClass = 'expiry-urgent';
        else if (item.status === 'warning') statusClass = 'expiry-warning';

        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td>${new Date(item.expiryDate).toLocaleDateString()}</td>
            <td class="${statusClass}">${item.daysRemaining} days</td>
            <td>
                <button class="btn btn-danger" onclick="deleteItemHandler('${item.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Event Handlers
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const { token, user } = await loginUser(email, password);
        setAuthToken(token);
        setCurrentUser(user);
        updateAuthButtons(true);
        showDashboard();
        showNotification('Login successful!', 'success');
    } catch (error) {
        showNotification(error.message, 'error');
    }
});

document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    try {
        const { token, user } = await registerUser(name, email, password);
        setAuthToken(token);
        setCurrentUser(user);
        updateAuthButtons(true);
        showDashboard();
        showNotification('Registration successful!', 'success');
    } catch (error) {
        showNotification(error.message, 'error');
    }
});

document.getElementById('add-item-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('item-name').value;
    const category = document.getElementById('item-category').value;
    const expiryDate = document.getElementById('expiry-date').value;

    try {
        await addItem({ name, category, expiryDate });
        closeModal('add-item-modal');
        document.getElementById('add-item-form').reset();
        await loadDashboardData();
        showNotification('Item added successfully!', 'success');
    } catch (error) {
        showNotification(error.message, 'error');
    }
});

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const user = getCurrentUser();
    const token = getAuthToken();
    
    if (user && token) {
        updateAuthButtons(true);
        showDashboard();
    } else {
        updateAuthButtons(false);
        showLandingPage();
    }

    // Navigation event listeners
    document.getElementById('home-link').addEventListener('click', (e) => {
        e.preventDefault();
        showLandingPage();
    });

    document.getElementById('dashboard-link').addEventListener('click', (e) => {
        e.preventDefault();
        if (getCurrentUser()) {
            showDashboard();
        } else {
            showAuth();
        }
    });

    document.getElementById('about-link').addEventListener('click', (e) => {
        e.preventDefault();
        showNotification('About ExpiryGuard: Track your expiry dates efficiently!');
    });

    document.getElementById('login-btn').addEventListener('click', () => {
        showAuth();
        document.getElementById('login-tab').click();
    });

    document.getElementById('signup-btn').addEventListener('click', () => {
        showAuth();
        document.getElementById('signup-tab').click();
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
        removeAuthToken();
        updateAuthButtons(false);
        showLandingPage();
        showNotification('Logged out successfully', 'success');
    });

    // Modal triggers
    document.getElementById('add-item-btn').addEventListener('click', () => {
        openModal('add-item-modal');
    });

    document.getElementById('scan-barcode-btn').addEventListener('click', () => {
        openModal('scanner-modal');
    });

    // Auth tab switching
    document.getElementById('login-tab').addEventListener('click', () => {
        document.getElementById('login-tab').classList.add('active');
        document.getElementById('signup-tab').classList.remove('active');
        document.getElementById('login-form').classList.add('active');
        document.getElementById('signup-form').classList.remove('active');
    });

    document.getElementById('signup-tab').addEventListener('click', () => {
        document.getElementById('signup-tab').classList.add('active');
        document.getElementById('login-tab').classList.remove('active');
        document.getElementById('signup-form').classList.add('active');
        document.getElementById('login-form').classList.remove('active');
    });

    // Cancel buttons
    document.getElementById('cancel-login').addEventListener('click', () => {
        showLandingPage();
    });

    document.getElementById('cancel-signup').addEventListener('click', () => {
        showLandingPage();
    });

    // Get started buttons
    document.querySelectorAll('#get-started-btn, #get-started-btn-2, #get-started-btn-3').forEach(btn => {
        btn.addEventListener('click', () => {
            if (getCurrentUser()) {
                showDashboard();
            } else {
                showAuth();
            }
        });
    });

    // Search functionality
    document.getElementById('search-items').addEventListener('input', async (e) => {
        const query = e.target.value;
        if (query.length > 2) {
            try {
                const items = await searchItems(query);
                renderItemsTable(items);
            } catch (error) {
                console.error('Search error:', error);
            }
        } else if (query.length === 0) {
            await loadDashboardData();
        }
    });

    // Set minimum date for expiry date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('expiry-date').min = today;
});

// Slideshow functionality
let currentSlide = 0;
const slides = document.querySelectorAll('.slide');

function showSlide(n) {
    slides.forEach(slide => slide.classList.remove('active'));
    slides[n].classList.add('active');
}

function nextSlide() {
    currentSlide = (currentSlide + 1) % slides.length;
    showSlide(currentSlide);
}

// Auto-advance slideshow
setInterval(nextSlide, 5000);

// Helper functions for item actions
async function deleteItemHandler(itemId) {
    if (confirm('Are you sure you want to delete this item?')) {
        try {
            await deleteItem(itemId);
            await loadDashboardData();
            showNotification('Item deleted successfully', 'success');
        } catch (error) {
            showNotification(error.message, 'error');
        }
    }
}
