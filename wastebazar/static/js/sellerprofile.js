/**
 * Seller Profile Script for WasteBazar
 * Handles seller profile page functionality and API integration
 */

// Global variables
let csrf_token = null;
let user_details_api_url = null;
let seller_listings_api_url = null;
let seller_detail_api_url = "/user-api/seller-detail-api/";
let current_user_id = null;
let seller_data = null;

/**
 * Main function to initialize seller profile app
 */
async function SellerProfileApp(csrf_token_param, user_details_api_url_param, seller_listings_api_url_param) {
    try {
        // Set global variables
        csrf_token = csrf_token_param;
        user_details_api_url = user_details_api_url_param;
        seller_listings_api_url = seller_listings_api_url_param;

        console.log('🚀 Seller Profile App initialized');

        // Initialize the app
        await initializeApp();
    } catch (error) {
        console.error('❌ Failed to initialize Seller Profile App:', error);
        showError('Failed to initialize application. Please refresh the page.');
    }
}

/**
 * Initialize the application
 */
async function initializeApp() {
    try {
        // Get current user ID from localStorage
        getCurrentUserId();

        // Set up tab functionality
        setupTabFunctionality();

        // Load all data
        await loadAllData();

    } catch (error) {
        console.error('❌ Error during initialization:', error);
        showError('Error loading data. Please try again.');
    }
}

/**
 * Get current user ID from localStorage
 */
function getCurrentUserId() {
    current_user_id = localStorage.getItem('user_id');

    if (!current_user_id) {
        console.error('❌ No user ID found in localStorage');
        showError('User not logged in. Please login again.');
        setTimeout(() => {
            window.location.href = '/login/';
        }, 3000);
        return;
    }

    console.log('👤 Current user ID:', current_user_id);
}

/**
 * Load all data from APIs
 */
async function loadAllData() {
    try {
        // Load seller profile first
        await loadSellerProfile();

        // Load listings
        await loadSellerListings();

    } catch (error) {
        console.error('❌ Error loading data:', error);
        showError('Error loading profile data.');
    }
}

/**
 * Load seller profile data
 */
async function loadSellerProfile() {
    try {
        console.log('📥 Loading seller profile...');

        const [success, response] = await callApi('GET', `${seller_detail_api_url}${current_user_id}/`, null, csrf_token);

        if (success && response.success) {
            seller_data = response.data;
            console.log('✅ Seller profile loaded:', seller_data);

            // Render profile data
            renderProfileData();

        } else {
            console.error('❌ Failed to load seller profile:', response.error);
            showError(response.error || 'Failed to load profile');
        }
    } catch (error) {
        console.error('❌ Error loading seller profile:', error);
        showError('Network error. Please try again.');
    }
}

/**
 * Load seller listings
 */
async function loadSellerListings() {
    try {
        console.log('📦 Loading seller listings...');

        const [success, response] = await callApi('GET', `${seller_listings_api_url}?user_id=${current_user_id}`, null, csrf_token);

        if (success && response.success) {
            const listings = response.data || [];
            console.log('✅ Listings loaded:', listings);

            renderListings(listings);
            updateListingsStats(listings);
        } else {
            console.error('❌ Failed to load listings:', response.error);
            renderListings([]);
        }
    } catch (error) {
        console.error('❌ Error loading listings:', error);
        renderListings([]);
    }
}

/**
 * Render profile data in HTML elements
 */
function renderProfileData() {
    if (!seller_data) return;

    const userDetails = seller_data.user_details;
    const corporateDetails = seller_data.corporate_details;
    const walletDetails = seller_data.wallet_details;

    // Update profile header
    updateProfileHeader(userDetails, corporateDetails);

    // Update contact information
    updateContactInfo(userDetails, corporateDetails);

    // Update wallet information
    updateWalletInfo(walletDetails);
}

/**
 * Update profile header elements
 */
function updateProfileHeader(userDetails, corporateDetails) {
    const sellerNameEl = document.getElementById('sellerName');
    const companyNameEl = document.getElementById('companyName');
    const sellerTypeEl = document.getElementById('sellerType');
    const verificationBadgeEl = document.getElementById('verificationBadge');
    const sellerEmailEl = document.getElementById('sellerEmail');
    const sellerPhoneEl = document.getElementById('sellerPhone');
    const sellerAddressEl = document.getElementById('sellerAddress');

    const isIndividual = userDetails.role === 'seller_individual';
    const displayName = userDetails.name || 'Seller';
    const companyName = corporateDetails && corporateDetails.company_name ? corporateDetails.company_name : '';

    // Update elements if they exist
    if (sellerNameEl) sellerNameEl.textContent = displayName;

    if (companyNameEl) {
        if (companyName) {
            companyNameEl.textContent = companyName;
            companyNameEl.style.display = 'block';
        } else {
            companyNameEl.style.display = 'none';
        }
    }

    if (sellerTypeEl) {
        sellerTypeEl.innerHTML = `
            <i class="fas fa-${isIndividual ? 'user' : 'building'} me-1"></i>
            ${isIndividual ? 'Individual' : 'Corporate'} Seller
        `;
    }

    if (verificationBadgeEl) {
        if (corporateDetails && corporateDetails.is_approved) {
            verificationBadgeEl.innerHTML = '<i class="fas fa-check-circle me-1"></i>Verified';
            verificationBadgeEl.style.display = 'inline-block';
        } else {
            verificationBadgeEl.style.display = 'none';
        }
    }

    if (sellerEmailEl) sellerEmailEl.textContent = userDetails.email || 'Email not provided';
    if (sellerPhoneEl) sellerPhoneEl.textContent = userDetails.contact_number || 'Phone not provided';

    if (sellerAddressEl) {
        if (corporateDetails && corporateDetails.address) {
            sellerAddressEl.textContent = corporateDetails.address;
        } else {
            sellerAddressEl.textContent = 'Address not provided';
        }
    }
}

/**
 * Update contact information in sidebar
 */
function updateContactInfo(userDetails, corporateDetails) {
    const sidebarCompanyNameEl = document.getElementById('sidebarCompanyName');
    const sidebarEmailEl = document.getElementById('sidebarEmail');
    const sidebarPhoneEl = document.getElementById('sidebarPhone');
    const sidebarAddressEl = document.getElementById('sidebarAddress');

    if (sidebarCompanyNameEl) {
        if (corporateDetails && corporateDetails.company_name) {
            sidebarCompanyNameEl.textContent = corporateDetails.company_name;
        } else {
            sidebarCompanyNameEl.textContent = userDetails.name || 'Not provided';
        }
    }

    if (sidebarEmailEl) sidebarEmailEl.textContent = userDetails.email || 'Not provided';
    if (sidebarPhoneEl) sidebarPhoneEl.textContent = userDetails.contact_number || 'Not provided';

    if (sidebarAddressEl) {
        if (corporateDetails && corporateDetails.address) {
            sidebarAddressEl.textContent = corporateDetails.address;
        } else {
            sidebarAddressEl.textContent = 'Not provided';
        }
    }
}

/**
 * Update wallet information
 */
function updateWalletInfo(walletDetails) {
    const freeCreditsEl = document.getElementById('freeCredits');
    const paidCreditsEl = document.getElementById('paidCredits');
    const totalCreditsEl = document.getElementById('totalCredits');
    const creditResetDateEl = document.getElementById('creditResetDate');


    if (walletDetails && !walletDetails.message) {
        const freeCredits = walletDetails.free_credits;
        const paidCredits = walletDetails.paid_credits;
        const totalCredits = freeCredits + paidCredits;
        console.log(totalCredits)

        if (freeCreditsEl) freeCreditsEl.textContent = freeCredits;
        if (paidCreditsEl) paidCreditsEl.textContent = paidCredits;
        totalCreditsEl.textContent = totalCredits;


        // // Update stats card total credits
        const statsTotalCreditsEl = document.getElementById('totalCreditswallet');
        if (statsTotalCreditsEl) statsTotalCreditsEl.textContent = totalCredits;

        if (creditResetDateEl && walletDetails.free_credit_reset_date) {
            creditResetDateEl.textContent = `Credits reset on: ${formatDate(walletDetails.free_credit_reset_date)}`;
        }
    } else {
        console.log('⚠️ No wallet found for user');
        // if (freeCreditsEl) freeCreditsEl.textContent = '0';
        // if (paidCreditsEl) paidCreditsEl.textContent = '0';
        // if (totalCreditsEl) totalCreditsEl.textContent = '0';
    }
}

/**
 * Render listings in the listings tab
 */
function renderListings(listings) {
    const container = document.getElementById('listings-container');
    if (!container) return;

    if (!listings || listings.length === 0) {
        container.innerHTML = `
            <div class="empty-state text-center py-5">
                <div class="empty-icon mb-3">
                    <i class="fas fa-boxes fa-3x text-muted"></i>
                </div>
                <h4>No Listings Yet</h4>
                <p class="text-muted">Start selling by creating your first listing!</p>
                <button class="btn btn-primary" onclick="checkCreditsAndRedirect('/listing-form/')">
                    <i class="fas fa-plus me-2"></i>Create First Listing
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = listings.map(listing => `
        <div class="card mb-3">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <div>
                        <h5 class="card-title mb-1">${listing.title || listing.category || 'Listing'}</h5>
                        <small class="text-muted">#${listing.listing_id}</small>
                    </div>
                    <span class="badge bg-${getStatusBadgeColor(listing.status)}">${getStatusLabel(listing.status)}</span>
                </div>
                
                <div class="row mb-3">
                    <div class="col-md-6">
                        <i class="fas fa-weight-hanging me-2 text-primary"></i>
                        <strong>${listing.quantity} ${listing.unit || 'kg'}</strong>
                    </div>
                    <div class="col-md-6">
                        <i class="fas fa-map-marker-alt me-2 text-primary"></i>
                        ${listing.city_location || 'Not specified'}${listing.state_location ? ', ' + listing.state_location : ''}
                    </div>
                </div>
                
                <p class="card-text">${listing.description || 'No description available'}</p>
                
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <small class="text-muted">
                            <i class="fas fa-calendar me-1"></i>Created: ${formatDate(listing.created_at)} | 
                            <i class="fas fa-clock me-1"></i>Valid until: ${formatDate(listing.valid_until)}
                        </small>
                    </div>
                    <div class="requirement-actions">
                        <button class="btn-action btn-edit" onclick="editListing('${listing.listing_id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-action btn-pause" onclick="pauseListing('${listing.listing_id}')">
                            <i class="fas fa-pause"></i> Pause
                        </button>
                        <button class="btn-action btn-details" onclick="viewListingDetails('${listing.listing_id}')">
                            <i class="fas fa-eye"></i> Details
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Update listings statistics
 */
function updateListingsStats(listings) {
    const totalListingsEl = document.getElementById('totalListings');
    const activeListingsEl = document.getElementById('activeListings');
    const soldItemsEl = document.getElementById('soldItems');

    const totalListings = listings.length;
    const activeListings = listings.filter(l => l.status === 'active' || l.status === 'approved').length;
    const soldItems = listings.filter(l => l.status === 'sold').length;

    if (totalListingsEl) totalListingsEl.textContent = totalListings;
    if (activeListingsEl) activeListingsEl.textContent = activeListings;
    if (soldItemsEl) soldItemsEl.textContent = soldItems;
}

/**
 * Render sales history
 */
function renderSalesHistory(sales) {
    const container = document.getElementById('sales-container');
    if (!container) return;

    if (!sales || sales.length === 0) {
        container.innerHTML = `
            <div class="empty-state text-center py-5">
                <div class="empty-icon mb-3">
                    <i class="fas fa-chart-line fa-3x text-muted"></i>
                </div>
                <h4>No Sales Yet</h4>
                <p class="text-muted">Your sales history will appear here once you start selling.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = sales.map(sale => `
        <div class="card mb-3">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <div>
                        <h5 class="card-title mb-1">${sale.item_name || 'Sale Item'}</h5>
                        <small class="text-muted">Sale ID: #${sale.sale_id}</small>
                    </div>
                    <span class="badge bg-${getSaleBadgeColor(sale.status)}">${getSaleStatusLabel(sale.status)}</span>
                </div>
                
                <div class="row mb-3">
                    <div class="col-md-3">
                        <strong>Buyer:</strong><br>
                        <span class="text-muted">${sale.buyer_name || 'Not available'}</span>
                    </div>
                    <div class="col-md-3">
                        <strong>Quantity:</strong><br>
                        <span class="text-muted">${sale.quantity} ${sale.unit || 'kg'}</span>
                    </div>
                    <div class="col-md-3">
                        <strong>Price:</strong><br>
                        <span class="text-muted">₹${sale.price}/${sale.unit || 'kg'}</span>
                    </div>
                    <div class="col-md-3">
                        <strong>Total:</strong><br>
                        <span class="text-success fw-bold">₹${sale.total_amount || (sale.quantity * sale.price)}</span>
                    </div>
                </div>
                
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <i class="fas fa-calendar me-2 text-primary"></i>
                        <span class="text-muted">${formatDate(sale.sale_date || sale.created_at)}</span>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        ${sale.rating ? `
                            <div class="rating">
                                ${renderStars(sale.rating)}
                            </div>
                        ` : ''}
                        <button class="btn btn-sm btn-outline-info" onclick="viewSaleDetails('${sale.sale_id}')">
                            <i class="fas fa-eye"></i> Details
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Set up tab functionality
 */
function setupTabFunctionality() {
    document.addEventListener('DOMContentLoaded', function () {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', function () {
                const targetTab = this.dataset.tab;

                // Remove active class from all tabs and contents
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));

                // Add active class to clicked tab and corresponding content
                this.classList.add('active');
                const targetContent = document.getElementById(targetTab + '-tab');
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            });
        });
    });
}

/**
 * Utility functions
 */
function getStatusBadgeColor(status) {
    const colors = {
        'active': 'success',
        'approved': 'success',
        'pending': 'warning',
        'inactive': 'secondary',
        'deleted': 'danger',
        'sold': 'info'
    };
    return colors[status] || 'secondary';
}

function getStatusLabel(status) {
    const labels = {
        'active': 'Active',
        'approved': 'Approved',
        'pending': 'Pending Review',
        'inactive': 'Inactive',
        'deleted': 'Deleted',
        'sold': 'Sold'
    };
    return labels[status] || status;
}

function getSaleBadgeColor(status) {
    const colors = {
        'completed': 'success',
        'pending': 'warning',
        'cancelled': 'danger',
        'in_progress': 'info'
    };
    return colors[status] || 'secondary';
}

function getSaleStatusLabel(status) {
    const labels = {
        'completed': 'Completed',
        'pending': 'Pending',
        'cancelled': 'Cancelled',
        'in_progress': 'In Progress'
    };
    return labels[status] || status;
}

function renderStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let stars = '';

    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star text-warning"></i>';
    }

    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt text-warning"></i>';
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star text-warning"></i>';
    }

    return stars;
}

function formatDate(dateString) {
    if (!dateString) return 'Not set';

    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function showError(message) {
    console.error('Error:', message);

    // Create error alert
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3';
    errorDiv.style.zIndex = '9999';
    errorDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(errorDiv);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (errorDiv && errorDiv.parentNode) {
            errorDiv.remove();
        }
    }, 5000);
}

/**
 * Global functions for button actions
 */
window.editListing = function (listingId) {
    console.log('Edit listing:', listingId);
    window.location.href = `/listing-form/?edit=${listingId}`;
};

window.pauseListing = function (listingId) {
    console.log('Pause/Activate listing:', listingId);
    // This would need API implementation
};

window.viewListingDetails = function (listingId) {
    console.log('View listing details:', listingId);
    window.location.href = `/listing-detail/?id=${listingId}`;
};

window.viewSaleDetails = function (saleId) {
    console.log('View sale details:', saleId);
    // This would need implementation based on requirements
};

/**
 * Check wallet credits before creating new listing
 */
function checkCreditsAndRedirect(url) {
    if (!seller_data || !seller_data.wallet_details || seller_data.wallet_details.message) {
        showError('No wallet found. Please contact support.');
        return false;
    }

    const walletDetails = seller_data.wallet_details;
    const freeCredits = walletDetails.free_credits || 0;
    const paidCredits = walletDetails.paid_credits || 0;
    const totalCredits = freeCredits + paidCredits;

    if (totalCredits < 1) {
        showError('Insufficient credits to create a new listing. Please purchase credits to continue.');
        return false;
    }

    // If credits are sufficient, redirect to listing form
    window.location.href = url;
    return true;
}

// Override the new listing button clicks
document.addEventListener('DOMContentLoaded', function () {
    // Override clicks on "Create Listing" and "New Listing" buttons
    const newListingButtons = document.querySelectorAll('a[href="/listing-form/"], a[href*="listing-form"]');

    newListingButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault(); // Prevent default navigation
            checkCreditsAndRedirect('/listing-form/');
        });
    });
});

console.log('🔐 WasteBazar Seller Profile System Loaded');
