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

        // Initialize logout button
        initializeSimpleLogout();

        // Load all data
        await loadAllData();

    } catch (error) {
        console.error('❌ Error during initialization:', error);
        showError('Error loading data. Please try again.');
    }
}

function getCurrentUserId() {
    currentUserId = localStorage.getItem('user_id');

    // Check if user is logged in
    if (!currentUserId) {
        console.log('❌ No user ID found in localStorage');
        showError('Please login to access your profile.');
        setTimeout(() => {
            window.location.href = '/login/';
        }, 2000);
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

    // Update settings information
    updateSettingsInfo(userDetails, corporateDetails);

    // Update wallet information
    updateWalletInfo(walletDetails);

    // Update verification status (only for corporate users)
    if (userDetails.role === 'buyer_corporate') {
        updateVerificationStatus(userDetails, corporateDetails);
    }
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
 * Update settings information
 */
function updateSettingsInfo(userDetails, corporateDetails) {
    // Update profile information fields
    const fullNameEl = document.getElementById('fullName');
    const emailEl = document.getElementById('email');
    const phoneEl = document.getElementById('phone');
    const userTypeEl = document.getElementById('userType');
    const addressEl = document.getElementById('address');

    if (fullNameEl) fullNameEl.value = userDetails.name || '';
    if (emailEl) emailEl.value = userDetails.email || '';
    if (phoneEl) phoneEl.value = userDetails.contact_number || '';
    if (userTypeEl) {
        userTypeEl.value = userDetails.role || 'buyer_individual';
    }

    // Show/hide and populate company information card
    const companyInfoCard = document.getElementById('companyInfoCard');
    const isCorporate = userDetails.role === 'buyer_corporate';

    if (companyInfoCard) {
        if (isCorporate && corporateDetails && !corporateDetails.message) {
            companyInfoCard.style.display = 'block';
            updateCompanySettings(corporateDetails);
        } else {
            companyInfoCard.style.display = 'none';
        }
    }

    // Set address from corporate details if available
    if (addressEl && corporateDetails && corporateDetails.address) {
        addressEl.value = corporateDetails.address;
    }
}

/**
 * Update company settings information
 */
function updateCompanySettings(corporateDetails) {
    const companyNameEl = document.getElementById('companyName');
    const industryEl = document.getElementById('industry');
    const gstNumberEl = document.getElementById('gstNumber');
    const panNumberEl = document.getElementById('panNumber');
    const companyAddressEl = document.getElementById('companyAddress');

    if (companyNameEl) companyNameEl.value = corporateDetails.company_name || '';
    if (industryEl) industryEl.value = corporateDetails.industry || '';
    if (gstNumberEl) gstNumberEl.value = corporateDetails.gst_number || '';
    if (panNumberEl) panNumberEl.value = corporateDetails.pan_number || '';
    if (companyAddressEl) companyAddressEl.value = corporateDetails.address || '';
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

        // Add low credit warning if needed
        addCreditWarning(totalCredits);

        // Update post requirement button state
        updatePostRequirementButton(totalCredits);

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

        // Add low credit warning for zero credits
        addCreditWarning(0);

        // Update post requirement button state for zero credits
        updatePostRequirementButton(0);
    }
}

/**
 * Add credit warning to wallet section if credits are low
 */
function addCreditWarning(totalCredits) {
    // Remove existing warning first
    const existingWarning = document.querySelector('.credit-warning');
    if (existingWarning) {
        existingWarning.remove();
    }

    if (totalCredits <= 1) {
        const walletDetails = document.querySelector('.wallet-details');
        if (walletDetails) {
            const warningDiv = document.createElement('div');
            warningDiv.className = 'credit-warning alert alert-warning mt-2 mb-0 p-2';
            warningDiv.style.fontSize = '0.85rem';
            warningDiv.innerHTML = `
                <i class="fas fa-exclamation-triangle me-1"></i>
                <strong>Low Credits!</strong><br>
                You need more than 1 credit to post requirements.
            `;
            walletDetails.appendChild(warningDiv);
        }
    }
}

/**
 * Update the "Post New Requirement" button state based on available credits
 */
function updatePostRequirementButton(totalCredits) {
    const postRequirementBtn = document.querySelector('button[onclick="postNewRequirement()"]');

    if (postRequirementBtn) {
        if (totalCredits <= 1) {
            // Disable button and update styling
            postRequirementBtn.disabled = true;
            postRequirementBtn.classList.add('disabled');
            postRequirementBtn.innerHTML = '<i class="fas fa-plus me-2 post-requirement-btn"></i>Insufficient Credits';
            postRequirementBtn.title = 'You need more than 1 credit to post a requirement';
            postRequirementBtn.style.opacity = '0.6';
            postRequirementBtn.style.cursor = 'not-allowed';
        } else {
            // Enable button and restore styling
            postRequirementBtn.disabled = false;
            postRequirementBtn.classList.add('post-requirement-btn');
            postRequirementBtn.classList.remove('disabled');
            postRequirementBtn.innerHTML = '<i class="fas fa-plus me-2"></i>Post New Requirement';
            postRequirementBtn.title = '';
            postRequirementBtn.style.opacity = '1';
            postRequirementBtn.style.cursor = 'pointer';
        }
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

        const [success, response] = await callApi('GET', `${requirementsApiUrl}${currentUserId}/`, null, csrf_token);

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
        // Check credit status for empty state
        let buttonHtml = '';
        let messageHtml = '<p class="text-muted">Start by posting your first requirement!</p>';

        if (buyerData && buyerData.wallet_details && !buyerData.wallet_details.message) {
            const freeCredits = buyerData.wallet_details.free_credits || 0;
            const paidCredits = buyerData.wallet_details.paid_credits || 0;
            const totalCredits = freeCredits + paidCredits;

            if (totalCredits <= 1) {
                messageHtml = `
                    <p class="text-muted">You need more than 1 credit to post requirements.</p>
                    <p class="text-info">Current credits: ${totalCredits}</p>
                `;
                buttonHtml = `
                    <button class="btn btn-secondary" disabled title="Insufficient credits">
                        <i class="fas fa-plus me-2"></i>Need More Credits
                    </button>
                    <br><br>
                    <button class="btn btn-primary">
                        <i class="fas fa-wallet me-2"></i>Buy Credits
                    </button>
                `;
            } else {
                buttonHtml = `
                    <button class="btn btn-primary post-requirement-btn" onclick="postNewRequirement()">
                        <i class="fas fa-plus me-2"></i>Post First Requirement
                    </button>
                `;
            }
        } else {
            buttonHtml = `
                <button class="btn btn-primary post-requirement-btn" onclick="postNewRequirement()">
                    <i class="fas fa-plus me-2"></i>Post First Requirement
                </button>
            `;
        }

        container.innerHTML = `
            <div class="empty-state text-center py-5">
                <div class="empty-icon mb-3">
                    <i class="fas fa-list-alt fa-3x text-muted"></i>
                </div>
                <h4>No Requirements Yet</h4>
                ${messageHtml}
              
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
                            <i class="fas fa-pause"></i> Mark Fulfilled
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
    const tabButtons = document.querySelectorAll('.tab-button-home');
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

    // Check if account is verified first
    if (buyerData && buyerData.corporate_details &&
        (buyerData.corporate_details.is_approved === false || buyerData.corporate_details.is_approved === 'false')) {
        showError('Your account is under verification. Please wait for approval before posting requirements.');
        return;
    }

    // Check if user has sufficient credits
    if (buyerData && buyerData.wallet_details && !buyerData.wallet_details.message) {
        const freeCredits = buyerData.wallet_details.free_credits || 0;
        const paidCredits = buyerData.wallet_details.paid_credits || 0;
        const totalCredits = freeCredits + paidCredits;

        if (totalCredits <= 1) {
            showError('You need more than 1 credit to post a new requirement. Please purchase credits to continue.');
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
function editProfile() {
    console.log('✏️ Edit profile clicked');
    toggleProfileEdit(true);
}

function editCompanyInfo() {
    console.log('🏢 Edit company info clicked');
    toggleCompanyEdit(true);
}

function toggleProfileEdit(enable) {
    const profileFields = ['fullName', 'email', 'address']; // Removed phone to make it non-editable
    const editBtn = document.querySelector('#profileForm').closest('.card').querySelector('.btn');

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
    const companyTextFields = ['companyName', 'gstNumber', 'panNumber', 'companyAddress'];
    const companySelectFields = ['industry'];
    const editBtn = document.querySelector('#companyInfoCard .btn');

    // Handle text fields
    companyTextFields.forEach(fieldId => {
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

    // Handle select fields
    companySelectFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.disabled = !enable;
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
        console.log('💾 Saving profile changes...');

        // Prepare basic profile data
        const profileData = {
            name: document.getElementById('fullName').value,
            email: document.getElementById('email').value
            // Phone is now non-editable
        };

        // For individual users, use the address field
        const addressEl = document.getElementById('address');
        if (addressEl && addressEl.value) {
            profileData.address = addressEl.value;
        }

        // Call the update API
        const [success, response] = await callApi(
            'PUT',
            `/user-api/update-user-details-api/${currentUserId}/`,
            profileData,
            csrf_token
        );

        if (success && response.success) {
            showSuccess('Profile updated successfully!');
            toggleProfileEdit(false);

            // Refresh profile data
            await loadBuyerProfile();
        } else {
            throw new Error(response.error || 'Failed to update profile');
        }
    } catch (error) {
        console.error('❌ Error updating profile:', error);
        showError('Failed to update profile: ' + error.message);
    }
}

async function saveCompanyInfo() {
    try {
        console.log('🏢 Saving company information...');

        const companyData = {
            company_name: document.getElementById('companyName').value,
            industry: document.getElementById('industry').value,
            gst_number: document.getElementById('gstNumber').value,
            pan_number: document.getElementById('panNumber').value,
            address: document.getElementById('companyAddress').value
        };

        // Call the update API
        const [success, response] = await callApi(
            'PUT',
            `/user-api/update-user-details-api/${currentUserId}/`,
            companyData,
            csrf_token
        );

        if (success && response.success) {
            showSuccess('Company information updated successfully!');
            toggleCompanyEdit(false);

            // Refresh profile data
            await loadBuyerProfile();
        } else {
            throw new Error(response.error || 'Failed to update company information');
        }
    } catch (error) {
        console.error('❌ Error updating company info:', error);
        showError('Failed to update company information: ' + error.message);
    }
}

function saveProfileSettings() {
    console.log('💾 Saving profile settings...');

    // Check if we're in edit mode
    const saveBtn = document.querySelector('.btn-primary-custom');
    if (saveBtn && saveBtn.innerHTML.includes('Save Changes')) {
        // We're in save mode, so save the data
        saveProfile();
    } else {
        // We're in view mode, so enable edit mode
        enableEditMode();
    }
}

/**
 * Enable edit mode for profile forms
 */
function enableEditMode() {
    console.log('✏️ Enabling edit mode...');

    // Enable profile fields (excluding phone which should remain readonly)
    const profileFields = ['fullName', 'email', 'address'];

    profileFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.readOnly = false;
            field.classList.add('editable');
        }
    });

    // Enable company fields if corporate user
    const companyInfoCard = document.getElementById('companyInfoCard');
    if (companyInfoCard && companyInfoCard.style.display !== 'none') {
        const companyTextFields = ['companyName', 'gstNumber', 'panNumber', 'companyAddress'];
        const companySelectFields = ['industry'];

        // Handle text fields
        companyTextFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.readOnly = false;
                field.classList.add('editable');
            }
        });

        // Handle select fields
        companySelectFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.disabled = false;
                field.classList.add('editable');
            }
        });
    }

    // Update button text and functionality
    const saveBtn = document.querySelector('.btn-primary-custom');
    if (saveBtn) {
        saveBtn.innerHTML = '<i class="fas fa-save me-2"></i>Save Changes';
    }
}

/**
 * Disable edit mode and return to view mode (legacy function - kept for backward compatibility)
 */
function disableEditMode() {
    console.log('👁️ Disabling edit mode...');

    // Disable text fields
    const textFields = ['fullName', 'email', 'address', 'companyName', 'gstNumber', 'panNumber', 'companyAddress'];
    const selectFields = ['industry'];

    textFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.readOnly = true;
            field.classList.remove('editable');
        }
    });

    // Disable select fields
    selectFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.disabled = true;
            field.classList.remove('editable');
        }
    });

    // Update button text and functionality
    const saveBtn = document.querySelector('.btn-primary-custom');
    if (saveBtn) {
        saveBtn.innerHTML = '<i class="fas fa-edit me-2"></i>Edit Profile';
    }
}

/**
 * Show success message
 */
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

/**
 * Show error message
 */
function showError(message) {
    // Create error alert
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3';
    errorDiv.style.zIndex = '9999';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-circle me-2"></i>${message}
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



/**
 * Update verification status display
 */
function updateVerificationStatus(userDetails, corporateDetails) {
    const verificationStatusEl = document.getElementById('verificationStatus');

    if (!verificationStatusEl) {
        console.log('⚠️ Verification status element not found');
        return;
    }

    // Check if user is approved
    if (corporateDetails.is_approved === false || corporateDetails.is_approved === 'false') {
        console.log('🔍 User is not approved - showing verification status and disabling post requirement buttons');
        verificationStatusEl.style.display = 'block';

        // Disable all post requirement buttons
        disablePostRequirementButtons(true);
    } else {
        console.log('✅ User is approved - hiding verification status and enabling post requirement buttons');
        verificationStatusEl.style.display = 'none';

        // Enable all post requirement buttons

    }
}

/**
 * Enable or disable all post requirement buttons
 */
function disablePostRequirementButtons(disable) {
    const postRequirementButtons = document.querySelectorAll('.post-requirement-btn');
    const postRequirementButtons2 = document.getElementById('postRequirementBtn2');



    postRequirementButtons.forEach(button => {
        button.disabled = disable;

        button.disabled = true;
        button.style.opacity = '0.6';
        button.style.cursor = 'not-allowed';
        button.title = 'Account verification required to post requirements';
        console.log('🚫 Post requirement button disabled:', button);

    });

    console.log(`${disable ? '🚫 Disabled' : '✅ Enabled'} ${postRequirementButtons.length} post requirement buttons`);
}


/**
 * Simple logout functionality
 */
function logout() {
    console.log('🔐 Logout initiated');

    // Clear all localStorage data
    localStorage.clear();

    // Clear sessionStorage as well
    sessionStorage.clear();

    console.log('✅ User data cleared successfully');

    // Redirect to direct login page
    window.location.href = '/directlogin/';
}

/**
 * Initialize simple logout button functionality
 */
function initializeSimpleLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
        console.log('🔐 Simple logout button initialized');
    }
}

// Make functions globally available for HTML onclick events
window.editProfile = function () {
    console.log('👤 Edit profile clicked (global)');
    toggleProfileEdit(true);
};

window.editCompanyInfo = function () {
    console.log('🏢 Edit company info clicked (global)');
    toggleCompanyEdit(true);
};

// Add window focus event listener to refresh wallet data when returning to page
window.addEventListener('focus', function () {
    if (currentUserId && buyerData) {
        console.log('🔄 Window focused - refreshing wallet data...');
        loadBuyerProfile();
    }
});

console.log('🔐 WasteBazar Buyer Profile System Loaded');

// Initialize the buyer profile when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
        console.log('🚀 DOM loaded, initializing buyer profile...');
        initializeSimpleLogout();
    });
} else {
    // DOM already loaded
    console.log('🚀 DOM already loaded, initializing buyer profile...');
    initializeSimpleLogout();
}
