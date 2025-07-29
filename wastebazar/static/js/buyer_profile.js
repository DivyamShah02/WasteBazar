/**
 * Buyer Profile Script for WasteBazar
 * Handles buyer profile page functionality and API integration
 */

// Global variables
let csrf_token = null;
let userDetailsApiUrl = null;
let requirementsApiUrl = null;
let buyerDetailApiUrl = "/user-api/buyer-detail-api/";
let currentUserId = null;
let buyerData = null;

/**
 * Main function to initialize buyer profile app
 */
async function BuyerProfileApp(csrf_token_param, userDetailsApiUrl_param, requirementsApiUrl_param) {
    try {
        csrf_token = csrf_token_param;
        userDetailsApiUrl = userDetailsApiUrl_param;
        requirementsApiUrl = requirementsApiUrl_param;
        // purchasesApiUrl = purchasesApiUrl_param;

        console.log('🚀 Buyer Profile App initialized');

        // Initialize the app
        await initializeApp();
    } catch (error) {
        console.error('❌ Failed to initialize Buyer Profile App:', error);
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
        setupTabs();

        // Load all data
        await loadAllData();

    } catch (error) {
        console.error('❌ Error during initialization:', error);
        showError('Error loading data. Please try again.');
    }
}

function getCurrentUserId() {
    currentUserId = localStorage.getItem('user_id');

    if (!currentUserId) {
        console.error('❌ No user ID found in localStorage');
        showError('User not logged in. Please login again.');
        setTimeout(() => {
            window.location.href = '/login/';
        }, 3000);
        return;
    }

    console.log('👤 Current user ID:', currentUserId);
}

/**
 * Load all data from APIs
 */
async function loadAllData() {
    try {
        // Load buyer profile first
        await loadBuyerProfile();

        // Load requirements
        await loadRequirements();


    } catch (error) {
        console.error('❌ Error loading data:', error);
        showError('Error loading profile data.');
    }
}

async function loadBuyerProfile() {
    try {
        console.log('📥 Loading buyer profile...');

        const [success, response] = await callApi('GET', `${buyerDetailApiUrl}${currentUserId}/`, null, csrf_token);

        if (success && response.success) {
            buyerData = response.data;
            console.log('✅ Buyer profile loaded:', buyerData);

            // Render profile data
            renderProfileData();

        } else {
            console.error('❌ Failed to load buyer profile:', response.error);
            showError(response.error || 'Failed to load profile');
        }
    } catch (error) {
        console.error('❌ Error loading buyer profile:', error);
        showError('Network error. Please try again.');
    }
}

/**
 * Render profile data in HTML elements
 */
function renderProfileData() {
    if (!buyerData) return;

    const userDetails = buyerData.user_details;
    const corporateDetails = buyerData.corporate_details;
    const walletDetails = buyerData.wallet_details;

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
    const profileNameEl = document.getElementById('profileName');
    const profileLocationEl = document.getElementById('profileLocation');

    const isIndividual = userDetails.role === 'buyer_individual';
    const displayName = userDetails.name || 'Buyer';

    // Update elements if they exist
    if (profileNameEl) profileNameEl.textContent = displayName;

    // Update profile badges
    const profileInfo = document.querySelector('.profile-info .profile-details');
    if (profileInfo) {
        const companyName = corporateDetails && corporateDetails.company_name ? corporateDetails.company_name : '';

        // Update badges section
        const badgesSection = profileInfo.querySelector('.profile-badges');
        if (badgesSection) {
            badgesSection.innerHTML = `
                <span class="profile-badge">
                    <i class="fas fa-shield-check me-1"></i>Verified Buyer
                </span>
                <span class="profile-badge">
                    <i class="fas fa-${isIndividual ? 'user' : 'building'} me-1"></i>${isIndividual ? 'Individual' : 'Corporate'}
                </span>
                ${corporateDetails && corporateDetails.is_approved ?
                    '<span class="profile-badge"><i class="fas fa-check-circle me-1"></i>Verified</span>' : ''}
            `;
        }

        // Add company name if corporate
        const existingCompanyP = profileInfo.querySelector('.company-name');
        if (companyName && !isIndividual) {
            if (!existingCompanyP) {
                const companyP = document.createElement('p');
                companyP.className = 'mb-2 text-white-50 company-name';
                companyP.textContent = companyName;
                profileInfo.insertBefore(companyP, badgesSection);
            } else {
                existingCompanyP.textContent = companyName;
            }
        } else if (existingCompanyP) {
            existingCompanyP.remove();
        }
    }

    // Update location
    if (profileLocationEl && corporateDetails && corporateDetails.address) {
        profileLocationEl.textContent = corporateDetails.address;
    }
}

/**
 * Update contact information in sidebar
 */
function updateContactInfo(userDetails, corporateDetails) {
    // Update company information card
    const companyCard = document.querySelector('.sidebar-card:last-child');
    if (companyCard) {
        const contactItems = companyCard.querySelectorAll('.contact-item');

        // Update company name
        if (contactItems[0]) {
            const valueEl = contactItems[0].querySelector('.contact-value');
            if (valueEl) {
                if (corporateDetails && corporateDetails.company_name) {
                    valueEl.textContent = corporateDetails.company_name;
                } else {
                    valueEl.textContent = userDetails.name || 'Not provided';
                }
            }
        }

        // Update email
        if (contactItems[1]) {
            const valueEl = contactItems[1].querySelector('.contact-value');
            if (valueEl) valueEl.textContent = userDetails.email || 'Not provided';
        }

        // Update address
        if (contactItems[2]) {
            const valueEl = contactItems[2].querySelector('.contact-value');
            if (valueEl) {
                if (corporateDetails && corporateDetails.address) {
                    valueEl.textContent = corporateDetails.address;
                } else {
                    valueEl.textContent = 'Not provided';
                }
            }
        }
    }
}

/**
 * Update wallet information
 */
function updateWalletInfo(walletDetails) {
    if (walletDetails && !walletDetails.message) {
        const freeCredits = walletDetails.free_credits || 0;
        const paidCredits = walletDetails.paid_credits || 0;
        const totalCredits = freeCredits + paidCredits;

        // Update wallet details using specific IDs
        const freeCreditsEl = document.getElementById('freecredits');
        const paidCreditsEl = document.getElementById('paidcredits');
        const totalCreditsEl = document.getElementById('totalcredits');

        if (freeCreditsEl) freeCreditsEl.textContent = freeCredits;
        if (paidCreditsEl) paidCreditsEl.textContent = paidCredits;
        if (totalCreditsEl) totalCreditsEl.textContent = totalCredits;

        // Update reset date if available
        if (walletDetails.free_credit_reset_date) {
            const resetEl = document.querySelector('.wallet-item:last-child small');
            if (resetEl) {
                resetEl.innerHTML = `<i class="fas fa-clock me-1"></i>Credits reset on: ${formatDate(walletDetails.free_credit_reset_date)}`;
            }
        }

        // Update stats card
        const totalSpentEl = document.getElementById('totalSpent');
        if (totalSpentEl) totalSpentEl.textContent = totalCredits;

    } else {
        console.log('⚠️ No wallet found for user');
        // Set default values using IDs
        const freeCreditsEl = document.getElementById('freecredits');
        const paidCreditsEl = document.getElementById('paidcredits');
        const totalCreditsEl = document.getElementById('totalcredits');
        const totalSpentEl = document.getElementById('totalSpent');

        if (freeCreditsEl) freeCreditsEl.textContent = '0';
        if (paidCreditsEl) paidCreditsEl.textContent = '0';
        if (totalCreditsEl) totalCreditsEl.textContent = '0';
        if (totalSpentEl) totalSpentEl.textContent = '0';
    }
}

async function loadRequirements() {
    try {
        console.log('📋 Loading requirements...');

        if (!requirementsApiUrl) {
            console.log('⚠️ Requirements API URL not provided');
            renderRequirements([]);
            return;
        }

        const [success, response] = await callApi('GET', `${requirementsApiUrl}?user_id=${currentUserId}`, null, csrf_token);

        if (success && response.success) {
            const requirements = response.data || [];
            console.log('✅ Requirements loaded:', requirements);

            renderRequirements(requirements);
            updateRequirementsStats(requirements);
        } else {
            console.error('❌ Failed to load requirements:', response.error);
            renderRequirements([]);
        }
    } catch (error) {
        console.error('❌ Error loading requirements:', error);
        renderRequirements([]);
    }
}

/**
 * Render requirements in the requirements tab
 */
function renderRequirements(requirements) {
    const container = document.getElementById('requirementsList');
    if (!container) return;

    if (!requirements || requirements.length === 0) {
        container.innerHTML = `
            <div class="empty-state text-center py-5">
                <div class="empty-icon mb-3">
                    <i class="fas fa-list-alt fa-3x text-muted"></i>
                </div>
                <h4>No Requirements Yet</h4>
                <p class="text-muted">Start by posting your first requirement!</p>
                <button class="btn btn-primary" onclick="postNewRequirement()">
                    <i class="fas fa-plus me-2"></i>Post First Requirement
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = requirements.map(requirement => `
        <div class="card mb-3">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <div>
                        <h5 class="card-title mb-1">${requirement.title || requirement.category || 'Requirement'}</h5>
                        <small class="text-muted">#${requirement.requirement_id}</small>
                    </div>
                    <span class="badge bg-${getStatusBadgeColor(requirement.status)}">${getStatusLabel(requirement.status)}</span>
                </div>
                
                <div class="row mb-3">
                    <div class="col-md-6">
                        <i class="fas fa-weight-hanging me-2 text-primary"></i>
                        <strong>${requirement.quantity} ${requirement.unit || 'kg'}</strong>
                    </div>
                    <div class="col-md-6">
                        <i class="fas fa-map-marker-alt me-2 text-primary"></i>
                        ${requirement.city_location || 'Not specified'}${requirement.state_location ? ', ' + requirement.state_location : ''}
                    </div>
                </div>
                
                <p class="card-text">${requirement.description || 'No description available'}</p>
                
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <small class="text-muted">
                            <i class="fas fa-calendar me-1"></i>Created: ${formatDate(requirement.created_at)} | 
                            <i class="fas fa-clock me-1"></i>Valid until: ${formatDate(requirement.valid_until)}
                        </small>
                    </div>
                    <div class="requirement-actions">
                        <button class="btn-action btn-edit" onclick="editRequirement('${requirement.requirement_id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-action btn-pause" onclick="pauseRequirement('${requirement.requirement_id}')">
                            <i class="fas fa-pause"></i> Pause
                        </button>
                        <button class="btn-action btn-details" onclick="viewRequirementDetails('${requirement.requirement_id}')">
                            <i class="fas fa-eye"></i> Details
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Update requirements statistics
 */
function updateRequirementsStats(requirements) {
    const totalRequirementsEl = document.getElementById('totalRequirements');
    const activeRequirementsEl = document.getElementById('activeRequirements');
    const completedDealsEl = document.getElementById('completedDeals');

    const totalRequirements = requirements.length;
    const activeRequirements = requirements.filter(r => r.status === 'active' || r.status === 'approved').length;
    const completedDeals = requirements.filter(r => r.status === 'completed').length;

    if (totalRequirementsEl) totalRequirementsEl.textContent = totalRequirements;
    if (activeRequirementsEl) activeRequirementsEl.textContent = activeRequirements;
    if (completedDealsEl) completedDealsEl.textContent = completedDeals;
}



/**
 * Render purchase history in the history tab
 */
function renderPurchaseHistory(purchases) {
    const container = document.getElementById('purchaseHistory');
    if (!container) return;

    if (!purchases || purchases.length === 0) {
        container.innerHTML = `
            <div class="empty-state text-center py-5">
                <div class="empty-icon mb-3">
                    <i class="fas fa-history fa-3x text-muted"></i>
                </div>
                <h4>No Purchase History</h4>
                <p class="text-muted">Your purchase history will appear here once you start buying.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = purchases.map(purchase => `
        <div class="card mb-3">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <div>
                        <h5 class="card-title mb-1">${purchase.item_name || purchase.title || 'Purchase'}</h5>
                        <small class="text-muted">Enquiry ID: #${purchase.purchase_id}</small>
                    </div>
                    <span class="badge bg-${getStatusBadgeColor(purchase.status)}">${getStatusLabel(purchase.status)}</span>
                </div>
                
                <div class="row mb-3">
                    <div class="col-md-3">
                        <strong>Seller:</strong><br>
                        <span class="text-muted">${purchase.seller_name || 'Not available'}</span>
                    </div>
                    <div class="col-md-3">
                        <strong>Quantity:</strong><br>
                        <span class="text-muted">${purchase.quantity} ${purchase.unit || 'kg'}</span>
                    </div>
                    <div class="col-md-3">
                        <strong>Price:</strong><br>
                        <span class="text-muted">₹${purchase.price}/${purchase.unit || 'kg'}</span>
                    </div>
                    <div class="col-md-3">
                        <strong>Total:</strong><br>
                        <span class="text-success fw-bold">₹${purchase.total_amount || (purchase.quantity * purchase.price)}</span>
                    </div>
                </div>
                
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <i class="fas fa-map-marker-alt me-2 text-primary"></i>
                        <span class="text-muted">${purchase.location || 'Location not specified'}</span>
                        <span class="mx-2">|</span>
                        <i class="fas fa-calendar me-2 text-primary"></i>
                        <span class="text-muted">${formatDate(purchase.purchase_date || purchase.created_at)}</span>
                    </div>
                    
                </div>
                
                ${purchase.comment ? `
                    <div class="purchase-comment mt-3">
                        <div class="comment-icon">
                           <i class="fas fa-comment-alt text-white"></i>
                        </div>
                        <div class="comment-content mt-1">
                            <span class="comment-label">Note: </span>
                            <span class="comment-text">${purchase.comment}</span>
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function setupTabs() {
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

            const targetContent = document.getElementById(`${targetTab}-tab`);
            if (targetContent) {
                targetContent.classList.add('active');
            }

            console.log(`📑 Switched to ${targetTab} tab`);
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
        'completed': 'success',
        'cancelled': 'danger'
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
        'completed': 'Completed',
        'cancelled': 'Cancelled'
    };
    return labels[status] || status;
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

    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3';
    errorDiv.style.zIndex = '9999';
    errorDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(errorDiv);

    setTimeout(() => {
        if (errorDiv && errorDiv.parentNode) {
            errorDiv.remove();
        }
    }, 5000);
}

function showSuccess(message) {
    console.log('Success:', message);

    const successDiv = document.createElement('div');
    successDiv.className = 'alert alert-success alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3';
    successDiv.style.zIndex = '9999';
    successDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(successDiv);

    setTimeout(() => {
        if (successDiv && successDiv.parentNode) {
            successDiv.remove();
        }
    }, 3000);
}

// Global action functions for requirement and purchase actions
function postNewRequirement() {
    console.log('📝 Post new requirement clicked');
    
    // Check if user has sufficient credits
    if (buyerData && buyerData.wallet_details && !buyerData.wallet_details.message) {
        const freeCredits = buyerData.wallet_details.free_credits || 0;
        const paidCredits = buyerData.wallet_details.paid_credits || 0;
        const totalCredits = freeCredits + paidCredits;
        
        if (totalCredits < 1) {
            showError('Insufficient credits to post a new requirement. Please purchase credits to continue.');
            return;
        }
    } else {
        showError('Unable to check credit balance. Please try again.');
        return;
    }
    
    // If credits are sufficient, redirect to requirement form
    window.location.href = '/requirement-form/';
}

function editRequirement(requirementId) {
    console.log('✏️ Edit requirement:', requirementId);
    window.location.href = `/requirement-form/?edit=${requirementId}`;
}

function pauseRequirement(requirementId) {
    console.log('⏸️ Pause requirement:', requirementId);
    if (confirm('Are you sure you want to pause this requirement?')) {
        // This would need API implementation
        console.log('Requirement paused:', requirementId);
    }
}

function viewRequirementDetails(requirementId) {
    console.log('👁️ View requirement details:', requirementId);
    window.location.href = `/requirement-detail/?id=${requirementId}`;
}

function viewPurchaseDetails(purchaseId) {
    console.log('👁️ View purchase details:', purchaseId);
    window.location.href = `/purchase-detail/?id=${purchaseId}`;
}

function editProfile() {
    console.log('👤 Edit profile clicked');
    // Scroll to settings tab
    const settingsTab = document.querySelector('[data-tab="settings"]');
    if (settingsTab) {
        settingsTab.click();
    }
}

// Settings form functions
function saveProfileSettings() {
    console.log('💾 Saving profile settings...');
    showSuccess('Profile settings saved successfully!');
}

function deactivateAccount() {
    console.log('❌ Deactivate account clicked');

    if (confirm('Are you sure you want to deactivate your account? This action cannot be undone.')) {
        if (confirm('This will permanently deactivate your account and remove all your data. Type "DEACTIVATE" in the next prompt to confirm.')) {
            const confirmation = prompt('Please type "DEACTIVATE" to confirm:');
            if (confirmation === 'DEACTIVATE') {
                showSuccess('Account deactivation request submitted.');
            } else {
                showError('Account deactivation cancelled - incorrect confirmation text.');
            }
        }
    }
}

console.log('🔐 WasteBazar Buyer Profile System Loaded');
