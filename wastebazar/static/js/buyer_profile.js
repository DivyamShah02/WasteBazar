/**
 * Buyer Profile Script for WasteBazar
 * Handles buyer profile page functionality and API integration
 */

let csrf_token = null;
let userDetailsApiUrl = null;
let requirementsApiUrl = null;
let purchasesApiUrl = null;
let buyerDetailApiUrl = "/user-api/buyer-detail-api/";
let currentUserId = null;
let buyerData = null;

async function BuyerProfileApp(csrf_token_param, userDetailsApiUrl_param, requirementsApiUrl_param, purchasesApiUrl_param) {
    csrf_token = csrf_token_param;
    userDetailsApiUrl = userDetailsApiUrl_param;
    requirementsApiUrl = requirementsApiUrl_param;
    purchasesApiUrl = purchasesApiUrl_param;

    console.log('🚀 Buyer Profile App initialized');

    // Initialize the app
    getCurrentUserId();
    setupTabs();
    await loadBuyerProfile();
}

function getCurrentUserId() {
    // Get user ID from localStorage (set during login)
    currentUserId = localStorage.getItem('user_id');

    if (!currentUserId) {
        console.error('❌ No user ID found in localStorage');
        showError('User not logged in. Please login again.');
        // Redirect to login page after 3 seconds
        setTimeout(() => {
            window.location.href = '/login/';
        }, 3000);
        return;
    }

    console.log('👤 Current user ID:', currentUserId);
}

async function loadBuyerProfile() {
    try {
        console.log('📥 Loading buyer profile...');

        const response = await makeApiCall(`${buyerDetailApiUrl}${currentUserId}/`, {
            method: 'GET'
        });

        if (response.success) {
            buyerData = response.data;
            console.log('✅ Buyer profile loaded:', buyerData);

            renderProfile();
            renderWalletInfo();
            await loadRequirements();
        } else {
            // console.error('❌ Failed to load buyer profile:', response.error);
            // showError(response.error || 'Failed to load profile');
        }
    } catch (error) {
        console.error('❌ Error loading buyer profile:', error);
        showError('Network error. Please try again.');
    }
}

function renderProfile() {
    const userDetails = buyerData.user_details;
    const corporateDetails = buyerData.corporate_details;

    // Render profile header
    renderProfileHeader(userDetails, corporateDetails);

    // Render contact information
    renderContactInfo(userDetails, corporateDetails);

    // Render recent activity
    // renderRecentActivity();
}

function renderProfileHeader(userDetails, corporateDetails) {
    const profileInfo = document.querySelector('.profile-info');
    const isIndividual = userDetails.role === 'buyer_individual';
    const isCorporate = userDetails.role === 'buyer_corporate';

    // Get name and determine avatar
    const displayName = userDetails.name || 'Buyer';
    const avatarInitial = displayName.charAt(0).toUpperCase();

    // Create company name for corporate users
    const companyName = corporateDetails && corporateDetails.company_name ?
        corporateDetails.company_name : '';

    profileInfo.innerHTML = `
        <div class="profile-avatar">
            <i class="fas fa-user"></i>
        </div>
        <div class="profile-details">
            <h1>${displayName}</h1>
            ${companyName ? `<p class="mb-2 text-white-50">${companyName}</p>` : ''}
            <div class="profile-badges">
                <span class="profile-badge">
                    <i class="fas fa-${isIndividual ? 'user' : 'building'} me-1"></i>
                    ${isIndividual ? 'Individual' : 'Corporate'} Buyer
                </span>
                ${corporateDetails && corporateDetails.is_approved ?
            '<span class="profile-badge"><i class="fas fa-check-circle me-1"></i>Verified</span>' :
            ''}
                <span class="profile-badge">
                    <i class="fas fa-calendar me-1"></i>
                    Member since 2024
                </span>
            </div>
            <div class="profile-meta">
                <div class="meta-item">
                    <i class="fas fa-envelope me-1"></i>
                    ${userDetails.email || 'Email not provided'}
                </div>
                <div class="meta-item">
                    <i class="fas fa-phone me-1"></i>
                    ${userDetails.contact_number || 'Phone not provided'}
                </div>
                ${corporateDetails && corporateDetails.address ? `
                    <div class="meta-item">
                        <i class="fas fa-map-marker-alt me-1"></i>
                        ${corporateDetails.address}
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

function renderWalletInfo() {
    const walletDetails = buyerData.wallet_details;

    if (walletDetails && !walletDetails.message) {
        // Update wallet stats in the stats cards
        updateStatsCards(walletDetails);

        // Add wallet sidebar card
        renderWalletSidebar(walletDetails);
    } else {
        console.log('⚠️ No wallet found for user');
    }
}

function updateStatsCards(walletDetails) {
    // Update credit-related stats
    const totalCredits = (walletDetails.free_credits || 0) + (walletDetails.paid_credits || 0);

    // You can customize these based on your actual data
    document.getElementById('totalRequirements').textContent = '20'; // Will be updated when requirements are loaded
    document.getElementById('activeRequirements').textContent = '5';
    document.getElementById('completedDeals').textContent = '2';
    document.getElementById('totalSpent').textContent = `${totalCredits} Credits`;
}

function renderWalletSidebar(walletDetails) {
    const sidebar = document.querySelector('.sidebar');

    const walletCard = document.createElement('div');
    walletCard.className = 'sidebar-card';

    walletCard.innerHTML = `
        <h3 class="sidebar-title">
            <i class="fas fa-wallet"></i>
            Wallet Details
        </h3>
        <div class="wallet-details">
            <div class="wallet-item mb-3">
                <div class="d-flex justify-content-between align-items-center">
                    <span class="text-muted">Free Credits</span>
                    <span class="fw-bold text-success">${walletDetails.free_credits || 0}</span>
                </div>
            </div>
            <div class="wallet-item mb-3">
                <div class="d-flex justify-content-between align-items-center">
                    <span class="text-muted">Paid Credits</span>
                    <span class="fw-bold text-primary">${walletDetails.paid_credits || 0}</span>
                </div>
            </div>
            <div class="wallet-item mb-3">
                <div class="d-flex justify-content-between align-items-center border-top pt-2">
                    <span class="fw-bold">Total Credits</span>
                    <span class="fw-bold text-dark">${(walletDetails.free_credits || 0) + (walletDetails.paid_credits || 0)}</span>
                </div>
            </div>
            <div class="wallet-item">
                <small class="text-muted">
                    <i class="fas fa-clock me-1"></i>
                    Credits reset: ${formatDate(walletDetails.free_credit_reset_date)}
                </small>
            </div>
        </div>
        <button class="btn btn-primary-custom mt-3">
            <i class="fas fa-plus me-2"></i>
            Buy Credits
        </button>
    `;

    // Insert wallet card as first item in sidebar
    sidebar.insertBefore(walletCard, sidebar.firstChild);
}

function renderContactInfo(userDetails, corporateDetails) {
    const sidebar = document.querySelector('.sidebar');

    const contactCard = document.createElement('div');
    contactCard.className = 'sidebar-card';

    let contactItems = `
        <div class="contact-item">
            <div class="contact-icon">
                <i class="fas fa-envelope"></i>
            </div>
            <div class="contact-info">
                <div class="contact-label">Email</div>
                <div class="contact-value">${userDetails.email || 'Not provided'}</div>
            </div>
        </div>
        <div class="contact-item">
            <div class="contact-icon">
                <i class="fas fa-phone"></i>
            </div>
            <div class="contact-info">
                <div class="contact-label">Phone</div>
                <div class="contact-value">${userDetails.contact_number || 'Not provided'}</div>
            </div>
        </div>
    `;

    // Add corporate-specific contact info
    if (corporateDetails && !corporateDetails.message) {
        contactItems += `
            <div class="contact-item">
                <div class="contact-icon">
                    <i class="fas fa-building"></i>
                </div>
                <div class="contact-info">
                    <div class="contact-label">Company</div>
                    <div class="contact-value">${corporateDetails.company_name || 'Not provided'}</div>
                </div>
            </div>
            ${corporateDetails.pan_number ? `
                <div class="contact-item">
                    <div class="contact-icon">
                        <i class="fas fa-id-card"></i>
                    </div>
                    <div class="contact-info">
                        <div class="contact-label">PAN Number</div>
                        <div class="contact-value">${corporateDetails.pan_number}</div>
                    </div>
                </div>
            ` : ''}
            ${corporateDetails.gst_number ? `
                <div class="contact-item">
                    <div class="contact-icon">
                        <i class="fas fa-receipt"></i>
                    </div>
                    <div class="contact-info">
                        <div class="contact-label">GST Number</div>
                        <div class="contact-value">${corporateDetails.gst_number}</div>
                    </div>
                </div>
            ` : ''}
        `;
    }

    contactCard.innerHTML = `
        <h3 class="sidebar-title">
            <i class="fas fa-address-book"></i>
            Contact Information
        </h3>
        ${contactItems}
    `;

    // sidebar.appendChild(contactCard);
}

function renderRecentActivity() {
    const sidebar = document.querySelector('.sidebar');

    const activityCard = document.createElement('div');
    activityCard.className = 'sidebar-card';

    activityCard.innerHTML = `
        <h3 class="sidebar-title">
            <i class="fas fa-clock"></i>
            Recent Activity
        </h3>
        <div class="activity-item">
            <div class="activity-icon">
                <i class="fas fa-user-check"></i>
            </div>
            <div class="activity-content">
                <div class="activity-text">Profile loaded successfully</div>
                <div class="activity-time">Just now</div>
            </div>
        </div>
        <div class="activity-item">
            <div class="activity-icon">
                <i class="fas fa-sign-in-alt"></i>
            </div>
            <div class="activity-content">
                <div class="activity-text">Logged in to account</div>
                <div class="activity-time">${getLoginTime()}</div>
            </div>
        </div>
    `;

    sidebar.appendChild(activityCard);
}

function setupTabs() {
    // Get or create the main content container
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) {
        console.error('❌ Main content container not found');
        return;
    }


    // Setup tab click handlers
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    // Update active tab button
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update active tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');

    console.log(`📑 Switched to ${tabName} tab`);
}

async function loadRequirements() {
    try {
        console.log('📋 Loading requirements...');
        // This would call your requirements API
        // For now, we'll show the empty state

        // Update requirements count in stats
        document.getElementById('totalRequirements').textContent = '20';
        document.getElementById('activeRequirements').textContent = '5';

    } catch (error) {
        console.error('❌ Error loading requirements:', error);
    }
}

async function makeApiCall(url, options) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrf_token
        }
    };

    const finalOptions = { ...defaultOptions, ...options };

    // Use the global apiCaller if available, otherwise use fetch
    if (typeof apiCaller === 'function') {
        return await apiCaller(url, finalOptions);
    } else {
        const response = await fetch(url, finalOptions);
        return await response.json();
    }
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

function getLoginTime() {
    const loginTimestamp = localStorage.getItem('login_timestamp');
    if (loginTimestamp) {
        const date = new Date(loginTimestamp);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    return 'Recently';
}

function showError(message) {
    // Create error toast or modal
    console.error('Error:', message);

    // Simple alert for now - can be enhanced with toast notifications
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
        if (errorDiv.parentNode) {
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

    // Auto remove after 3 seconds
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.remove();
        }
    }, 3000);
}

// Global action functions for requirement and purchase actions
function postNewRequirement() {
    console.log('📝 Post new requirement clicked');
    alert('Post new requirement feature coming soon!');
}

function editRequirement(requirementId) {
    console.log('✏️ Edit requirement:', requirementId);
    alert(`Edit requirement ${requirementId} - Feature coming soon!`);
}

function pauseRequirement(requirementId) {
    console.log('⏸️ Pause requirement:', requirementId);
    if (confirm('Are you sure you want to pause this requirement?')) {
        alert('Requirement paused successfully!');
        location.reload();
    }
}

function activateRequirement(requirementId) {
    console.log('▶️ Activate requirement:', requirementId);
    if (confirm('Are you sure you want to activate this requirement?')) {
        alert('Requirement activated successfully!');
        location.reload();
    }
}

function viewRequirementDetails(requirementId) {
    console.log('👁️ View requirement details:', requirementId);
    alert(`View details for requirement ${requirementId} - Feature coming soon!`);
}

function viewPurchaseDetails(purchaseId) {
    console.log('👁️ View purchase details:', purchaseId);
    alert(`View details for purchase ${purchaseId} - Feature coming soon!`);
}

function editProfile() {
    console.log('👤 Edit profile clicked');
    alert('Profile edit feature coming soon!');
}

// Settings form functions
function saveProfileSettings() {
    console.log('💾 Saving profile settings...');

    // Collect form data
    const profileData = {
        fullName: document.getElementById('fullName')?.value,
        email: document.getElementById('email')?.value,
        phone: document.getElementById('phone')?.value,
        userType: document.getElementById('userType')?.value,
        address: document.getElementById('address')?.value,
        companyName: document.getElementById('companyName')?.value,
        industry: document.getElementById('industry')?.value,
        gstNumber: document.getElementById('gstNumber')?.value,
        panNumber: document.getElementById('panNumber')?.value,
        companyAddress: document.getElementById('companyAddress')?.value,
        preferredCategories: Array.from(document.getElementById('preferredCategories')?.selectedOptions || []).map(option => option.value),
        preferredLocations: document.getElementById('preferredLocations')?.value,
        emailNotifications: document.getElementById('emailNotifications')?.checked,
        smsNotifications: document.getElementById('smsNotifications')?.checked
    };

    console.log('Profile data to save:', profileData);

    // Show success message
    showSuccess('Profile settings saved successfully! (Demo Mode)');
}

function resetProfileForm() {
    console.log('🔄 Resetting profile form...');

    if (confirm('Are you sure you want to reset all changes? This will restore the original values.')) {
        // Reset form values to original demo data
        document.getElementById('fullName').value = 'Rajesh Kumar';
        document.getElementById('email').value = 'rajesh@company.com';
        document.getElementById('phone').value = '+91 9876543210';
        document.getElementById('userType').value = 'buyer_corporate';
        document.getElementById('address').value = 'Andheri East, Mumbai, Maharashtra, India';
        document.getElementById('companyName').value = 'XYZ Pvt Ltd';
        document.getElementById('industry').value = 'manufacturing';
        document.getElementById('gstNumber').value = '27AABCU9603R1ZX';
        document.getElementById('panNumber').value = 'AABCU9603R';
        document.getElementById('companyAddress').value = '456 Business Park, Andheri East, Mumbai, Maharashtra 400069';
        document.getElementById('preferredLocations').value = 'Mumbai, Pune, Nashik';
        document.getElementById('emailNotifications').checked = true;
        document.getElementById('smsNotifications').checked = true;

        // Reset multi-select
        const categories = document.getElementById('preferredCategories');
        Array.from(categories.options).forEach(option => {
            option.selected = option.value === 'plastic' || option.value === 'metal';
        });

        showSuccess('Form reset to original values!');
    }
}

function deactivateAccount() {
    console.log('❌ Deactivate account clicked');

    if (confirm('Are you sure you want to deactivate your account? This action cannot be undone.')) {
        if (confirm('This will permanently deactivate your account and remove all your data. Type "DEACTIVATE" in the next prompt to confirm.')) {
            const confirmation = prompt('Please type "DEACTIVATE" to confirm:');
            if (confirmation === 'DEACTIVATE') {
                alert('Account deactivation request submitted. (Demo Mode - No actual changes made)');
            } else {
                alert('Account deactivation cancelled - incorrect confirmation text.');
            }
        }
    }
}

function verifyPhone() {
    console.log('📱 Verify phone clicked');

    const phoneNumber = document.getElementById('phone')?.value || '+91 9876543210';
    if (confirm(`Send verification code to ${phoneNumber}?`)) {
        alert('Verification code sent! (Demo Mode - Check your phone)');
    }
}

function changePassword() {
    console.log('🔐 Change password clicked');

    const currentPassword = prompt('Enter your current password:');
    if (currentPassword) {
        const newPassword = prompt('Enter new password:');
        if (newPassword) {
            const confirmPassword = prompt('Confirm new password:');
            if (newPassword === confirmPassword) {
                alert('Password changed successfully! (Demo Mode)');
            } else {
                alert('Passwords do not match. Please try again.');
            }
        }
    }
}

function enable2FA() {
    console.log('🔒 Enable 2FA clicked');

    if (confirm('Enable Two-Factor Authentication for added security?')) {
        alert('2FA setup initiated! Please scan the QR code with your authenticator app. (Demo Mode)');
    }
}

function downloadData() {
    console.log('📥 Download data clicked');

    if (confirm('Download all your account data? This may take a few minutes to prepare.')) {
        // Simulate download
        const demoData = {
            profile: {
                name: 'Rajesh Kumar',
                email: 'rajesh@company.com',
                phone: '+91 9876543210',
                joinDate: '2024-01-15'
            },
            company: {
                name: 'XYZ Pvt Ltd',
                gst: '27AABCU9603R1ZX',
                pan: 'AABCU9603R'
            },
            activity: {
                requirements: 12,
                purchases: 8,
                profileViews: 234
            }
        };

        const dataStr = JSON.stringify(demoData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = 'wastebazar-account-data.json';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(url);

        showSuccess('Account data downloaded successfully!');
    }
}

console.log('🔐 WasteBazar Buyer Profile System Loaded');
