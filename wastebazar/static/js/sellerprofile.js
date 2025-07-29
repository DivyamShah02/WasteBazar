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

            // Separate approved and unapproved listings
            const approvedListings = listings.filter(listing =>
                listing.status === 'active' || listing.status === 'approved'
            );
            const unapprovedListings = listings.filter(listing =>
                listing.status === 'pending' || listing.status === 'under_review' || listing.status === 'rejected'
            );

            renderListings(approvedListings);
            renderUnapprovedListings(unapprovedListings);
            updateListingsStats(listings);
        } else {
            console.error('❌ Failed to load listings:', response.error);
            renderListings([]);
            renderUnapprovedListings([]);
        }
    } catch (error) {
        console.error('❌ Error loading listings:', error);
        renderListings([]);
        renderUnapprovedListings([]);
    }
}

/**
 * Render profile data in HTML elements
 */
function renderProfileData() {
    if (!seller_data) return;

    const userDetails = seller_data.user_details;
    const corporateDetails = seller_data.corporate_details;
    // const walletDetails = seller_data.wallet_details;

    // Update profile header
    updateProfileHeader(userDetails, corporateDetails);

    // Update contact information
    updateContactInfo(userDetails, corporateDetails);

    // Update settings information
    updateSettingsInfo(userDetails, corporateDetails);

    // Update wallet information
    // updateWalletInfo(walletDetails);
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
 * Update settings information
 */
function updateSettingsInfo(userDetails, corporateDetails) {
    // Update profile information fields
    const settingsNameEl = document.getElementById('settingsName');
    const settingsEmailEl = document.getElementById('settingsEmail');
    const settingsPhoneEl = document.getElementById('settingsPhone');
    const settingsAccountTypeEl = document.getElementById('settingsAccountType');

    if (settingsNameEl) settingsNameEl.value = userDetails.name || '';
    if (settingsEmailEl) settingsEmailEl.value = userDetails.email || '';
    if (settingsPhoneEl) settingsPhoneEl.value = userDetails.contact_number || '';
    if (settingsAccountTypeEl) {
        const isIndividual = userDetails.role === 'seller_individual';
        settingsAccountTypeEl.value = isIndividual ? 'Individual Seller' : 'Corporate Seller';
    }

    // Show/hide and populate company information card
    const companyInfoCard = document.getElementById('companyInfoCard');
    const isCorporate = userDetails.role === 'seller_corporate';

    if (companyInfoCard) {
        if (isCorporate && corporateDetails) {
            companyInfoCard.style.display = 'block';
            updateCompanySettings(corporateDetails);
        } else {
            companyInfoCard.style.display = 'none';
        }
    }
}

/**
 * Update company settings information
 */
function updateCompanySettings(corporateDetails) {
    const settingsCompanyNameEl = document.getElementById('settingsCompanyName');
    const settingsPanNumberEl = document.getElementById('settingsPanNumber');
    const settingsGstNumberEl = document.getElementById('settingsGstNumber');
    const settingsCompanyAddressEl = document.getElementById('settingsCompanyAddress');
    const settingsVerificationStatusEl = document.getElementById('settingsVerificationStatus');
    const settingsVerificationDateEl = document.getElementById('settingsVerificationDate');
    const downloadCertificateBtn = document.getElementById('downloadCertificateBtn');

    if (settingsCompanyNameEl) settingsCompanyNameEl.value = corporateDetails.company_name || '';
    if (settingsPanNumberEl) settingsPanNumberEl.value = corporateDetails.pan_number || '';
    if (settingsGstNumberEl) settingsGstNumberEl.value = corporateDetails.gst_number || '';
    if (settingsCompanyAddressEl) settingsCompanyAddressEl.value = corporateDetails.address || '';

    // Update verification status
    if (settingsVerificationStatusEl) {
        if (corporateDetails.is_approved) {
            settingsVerificationStatusEl.innerHTML = '<i class="fas fa-check-circle me-1"></i>Verified';
            settingsVerificationStatusEl.className = 'badge bg-success';
        } else if (corporateDetails.is_rejected) {
            settingsVerificationStatusEl.innerHTML = '<i class="fas fa-times-circle me-1"></i>Rejected';
            settingsVerificationStatusEl.className = 'badge bg-danger';
        } else {
            settingsVerificationStatusEl.innerHTML = '<i class="fas fa-clock me-1"></i>Pending';
            settingsVerificationStatusEl.className = 'badge bg-warning';
        }
    }

    // Update verification date
    if (settingsVerificationDateEl) {
        if (corporateDetails.approved_at) {
            settingsVerificationDateEl.textContent = `Verified on: ${formatDate(corporateDetails.approved_at)}`;
        } else if (corporateDetails.rejected_at) {
            settingsVerificationDateEl.textContent = `Rejected on: ${formatDate(corporateDetails.rejected_at)}`;
        } else {
            settingsVerificationDateEl.textContent = `Requested on: ${formatDate(corporateDetails.requested_at)}`;
        }
    }

    // Show/hide download certificate button
    if (downloadCertificateBtn) {
        if (corporateDetails.certificate_url) {
            downloadCertificateBtn.style.display = 'inline-block';
            downloadCertificateBtn.onclick = function () {
                window.open(corporateDetails.certificate_url, '_blank');
            };
        } else {
            downloadCertificateBtn.style.display = 'none';
        }
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
                <button class="btn btn-primary" onclick="/listing-form">
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
 * Render unapproved listings in the unapproved listings tab
 */
function renderUnapprovedListings(unapprovedListings) {
    const container = document.getElementById('unapproved-listings-container');
    if (!container) return;

    if (!unapprovedListings || unapprovedListings.length === 0) {
        container.innerHTML = `
            <div class="empty-state text-center py-5">
                <div class="empty-icon mb-3">
                    <i class="fas fa-clock fa-3x text-muted"></i>
                </div>
                <h4>No Unapproved Listings</h4>
                <p class="text-muted">All your listings are approved or you haven't created any listings yet.</p>
                <a href="/listing-form/" class="btn btn-primary">
                    <i class="fas fa-plus me-2"></i>Create New Listing
                </a>
            </div>
        `;
        return;
    }

    container.innerHTML = unapprovedListings.map(listing => `
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
                
                ${listing.rejection_reason ? `
                    <div class="alert alert-warning mb-3">
                        <strong><i class="fas fa-exclamation-triangle me-2"></i>Rejection Reason:</strong>
                        ${listing.rejection_reason}
                    </div>
                ` : ''}
                
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <small class="text-muted">
                            <i class="fas fa-calendar me-1"></i>Submitted: ${formatDate(listing.created_at)}
                            ${listing.status === 'pending' ? ' | <i class="fas fa-clock me-1"></i>Waiting for review' : ''}
                        </small>
                    </div>
                    <div class="requirement-actions">
                        ${listing.status === 'rejected' ? `
                            <button class="btn-action btn-edit" onclick="editListing('${listing.listing_id}')">
                                <i class="fas fa-edit"></i> Edit & Resubmit
                            </button>
                        ` : ''}
                        <button class="btn-action btn-details" onclick="viewListingDetails('${listing.listing_id}')">
                            <i class="fas fa-eye"></i> Details
                        </button>
                        ${listing.status === 'pending' ? `
                            <button class="btn-action btn-cancel" onclick="cancelListing('${listing.listing_id}')">
                                <i class="fas fa-times"></i> Cancel
                            </button>
                        ` : ''}
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
 * Set up tab functionality
 */
function setupTabFunctionality() {
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

            // Handle different tab targets
            let targetContent;
            if (targetTab === 'approvedlistings') {
                targetContent = document.getElementById('listings-tab');
            } else if (targetTab === 'unapprovedlistings') {
                targetContent = document.getElementById('unapprovedlistings-tab');
            } else {
                targetContent = document.getElementById(targetTab + '-tab');
            }

            if (targetContent) {
                targetContent.classList.add('active');
            }
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
        'under_review': 'info',
        'rejected': 'danger',
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
        'under_review': 'Under Review',
        'rejected': 'Rejected',
        'inactive': 'Inactive',
        'deleted': 'Deleted',
        'sold': 'Sold'
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

window.cancelListing = function (listingId) {
    console.log('Cancel listing:', listingId);
    if (confirm('Are you sure you want to cancel this listing?')) {
        // This would need API implementation to cancel the listing
        console.log('Canceling listing:', listingId);
    }
};

/**
 * Profile editing functions
 */
window.editProfile = function () {
    toggleProfileEdit(true);
};

window.editCompanyInfo = function () {
    toggleCompanyEdit(true);
};

function toggleProfileEdit(enable) {
    const profileFields = ['settingsName', 'settingsEmail']; // Removed settingsPhone to make it non-editable
    const editBtn = document.querySelector('#settings-tab .btn-primary');

    profileFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.readOnly = !enable;
            if (enable) {
                field.classList.add('editable');
            } else {
                field.classList.remove('editable');
            }
        }
    });

    if (enable) {
        editBtn.innerHTML = '<i class="fas fa-save me-2"></i>Save Profile';
        editBtn.onclick = saveProfile;
    } else {
        editBtn.innerHTML = '<i class="fas fa-edit me-2"></i>Edit Profile';
        editBtn.onclick = editProfile;
    }
}

function toggleCompanyEdit(enable) {
    const companyFields = ['settingsCompanyName', 'settingsPanNumber', 'settingsGstNumber', 'settingsCompanyAddress'];
    const editBtn = document.querySelector('#companyInfoCard .btn-primary');

    companyFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.readOnly = !enable;
            if (enable) {
                field.classList.add('editable');
            } else {
                field.classList.remove('editable');
            }
        }
    });

    if (enable) {
        editBtn.innerHTML = '<i class="fas fa-save me-2"></i>Save Company Info';
        editBtn.onclick = saveCompanyInfo;
    } else {
        editBtn.innerHTML = '<i class="fas fa-edit me-2"></i>Edit Company Info';
        editBtn.onclick = editCompanyInfo;
    }
}

async function saveProfile() {
    try {
        const formData = {
            name: document.getElementById('settingsName').value,
            email: document.getElementById('settingsEmail').value
            // Removed contact_number to make phone non-editable
        };

        const [success, response] = await callApi(
            'PUT',
            `/user-api/update-user-details-api/${current_user_id}/`,
            formData,
            csrf_token
        );

        if (success && response.success) {
            showSuccess('Profile updated successfully!');
            toggleProfileEdit(false);

            // Refresh profile data
            await loadSellerProfile();
        } else {
            throw new Error(response.error || 'Failed to update profile');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showError('Failed to update profile: ' + error.message);
    }
}

async function saveCompanyInfo() {
    try {
        const formData = {
            company_name: document.getElementById('settingsCompanyName').value,
            pan_number: document.getElementById('settingsPanNumber').value,
            gst_number: document.getElementById('settingsGstNumber').value,
            address: document.getElementById('settingsCompanyAddress').value
        };

        const [success, response] = await callApi(
            'PUT',
            `/user-api/update-user-details-api/${current_user_id}/`,
            formData,
            csrf_token
        );

        if (success && response.success) {
            showSuccess('Company information updated successfully!');
            toggleCompanyEdit(false);

            // Refresh profile data
            await loadSellerProfile();
        } else {
            throw new Error(response.error || 'Failed to update company information');
        }
    } catch (error) {
        console.error('Error updating company info:', error);
        showError('Failed to update company information: ' + error.message);
    }
}

function showSuccess(message) {
    // Create success alert
    const successDiv = document.createElement('div');
    successDiv.className = 'alert alert-success alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3';
    successDiv.style.zIndex = '9999';
    successDiv.innerHTML = `
        <i class="fas fa-check-circle me-2"></i>${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(successDiv);

    // Auto remove after 3 seconds
    setTimeout(() => {
        if (successDiv && successDiv.parentNode) {
            successDiv.remove();
        }
    }, 3000);
}



// Override the new listing button clicks
document.addEventListener('DOMContentLoaded', function () {
    // Override clicks on "Create Listing" and "New Listing" buttons
    const newListingButtons = document.querySelectorAll('a[href="/listing-form/"], a[href*="listing-form"]');

    newListingButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault(); // Prevent default navigation
            window.location.href = '/listing-form/';
        });
    });
});

console.log('🔐 WasteBazar Seller Profile System Loaded');


