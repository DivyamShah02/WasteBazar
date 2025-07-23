/**
 * Buyer Profile Script for WasteBazar
 * Handles buyer profile page functionality and API integration
 */

class BuyerProfileApp {
    constructor(csrfToken, userDetailsApiUrl, requirementsApiUrl, purchasesApiUrl) {
        this.csrfToken = csrfToken;
        this.userDetailsApiUrl = userDetailsApiUrl;
        this.requirementsApiUrl = requirementsApiUrl;
        this.purchasesApiUrl = purchasesApiUrl;
        this.buyerDetailApiUrl = "/user-api/buyer-detail-api/";
        this.currentUserId = null;
        this.buyerData = null;

        console.log('🚀 Buyer Profile App initialized');
        this.init();
    }

    init() {
        this.getCurrentUserId();
        this.setupTabs();
        this.loadBuyerProfile();
    }

    getCurrentUserId() {
        // Get user ID from localStorage (set during login)
        this.currentUserId = localStorage.getItem('user_id');

        if (!this.currentUserId) {
            console.error('❌ No user ID found in localStorage');
            this.showError('User not logged in. Please login again.');
            // Redirect to login page after 3 seconds
            setTimeout(() => {
                window.location.href = '/login/';
            }, 3000);
            return;
        }

        console.log('👤 Current user ID:', this.currentUserId);
    }

    async loadBuyerProfile() {
        try {
            console.log('📥 Loading buyer profile...');

            const response = await this.makeApiCall(`${this.buyerDetailApiUrl}${this.currentUserId}/`, {
                method: 'GET'
            });

            if (response.success) {
                this.buyerData = response.data;
                console.log('✅ Buyer profile loaded:', this.buyerData);

                this.renderProfile();
                this.renderWalletInfo();
                this.loadRequirements();
            } else {
                console.error('❌ Failed to load buyer profile:', response.error);
                this.showError(response.error || 'Failed to load profile');
            }
        } catch (error) {
            console.error('❌ Error loading buyer profile:', error);
            this.showError('Network error. Please try again.');
        }
    }

    renderProfile() {
        const userDetails = this.buyerData.user_details;
        const corporateDetails = this.buyerData.corporate_details;

        // Render profile header
        this.renderProfileHeader(userDetails, corporateDetails);

        // Render contact information
        this.renderContactInfo(userDetails, corporateDetails);

        // Render recent activity
        this.renderRecentActivity();
    }

    renderProfileHeader(userDetails, corporateDetails) {
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

    renderWalletInfo() {
        const walletDetails = this.buyerData.wallet_details;

        if (walletDetails && !walletDetails.message) {
            // Update wallet stats in the stats cards
            this.updateStatsCards(walletDetails);

            // Add wallet sidebar card
            this.renderWalletSidebar(walletDetails);
        } else {
            console.log('⚠️ No wallet found for user');
        }
    }

    updateStatsCards(walletDetails) {
        // Update credit-related stats
        const totalCredits = (walletDetails.free_credits || 0) + (walletDetails.paid_credits || 0);

        // You can customize these based on your actual data
        document.getElementById('totalRequirements').textContent = '0'; // Will be updated when requirements are loaded
        document.getElementById('activeRequirements').textContent = '0';
        document.getElementById('completedDeals').textContent = '0';
        document.getElementById('totalSpent').textContent = `${totalCredits} Credits`;
    }

    renderWalletSidebar(walletDetails) {
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
                        Credits reset: ${this.formatDate(walletDetails.free_credit_reset_date)}
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

    renderContactInfo(userDetails, corporateDetails) {
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

        sidebar.appendChild(contactCard);
    }

    renderRecentActivity() {
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
                    <div class="activity-time">${this.getLoginTime()}</div>
                </div>
            </div>
        `;

        sidebar.appendChild(activityCard);
    }

    setupTabs() {
        // Create tab buttons
        const tabsContainer = document.querySelector('.content-tabs');
        tabsContainer.innerHTML = `
            <button class="tab-button active" data-tab="requirements">
                <i class="fas fa-list me-2"></i>My Requirements
            </button>
            <button class="tab-button" data-tab="history">
                <i class="fas fa-history me-2"></i>Purchase History
            </button>
            <button class="tab-button" data-tab="settings">
                <i class="fas fa-cog me-2"></i>Settings
            </button>
        `;

        // Setup tab click handlers
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Create tab contents
        this.createTabContents();
    }

    createTabContents() {
        const mainContent = document.querySelector('.main-content');

        // Remove existing tab content
        const existingTabContent = mainContent.querySelector('.tab-content');
        if (existingTabContent) {
            existingTabContent.remove();
        }

        // Add new tab contents
        const tabContentHTML = `
            <div class="tab-content active" id="requirements-tab">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h3>My Requirements</h3>
                    <button class="btn btn-primary">
                        <i class="fas fa-plus me-2"></i>New Requirement
                    </button>
                </div>
                <div id="requirements-container">
                    <div class="empty-state">
                        <div class="empty-icon">
                            <i class="fas fa-clipboard-list"></i>
                        </div>
                        <h4>No Requirements Yet</h4>
                        <p>Start by posting your first requirement to find sellers.</p>
                        <button class="btn btn-primary-custom">
                            <i class="fas fa-plus me-2"></i>Post First Requirement
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="tab-content" id="history-tab">
                <h3 class="mb-4">Purchase History</h3>
                <div id="history-container">
                    <div class="empty-state">
                        <div class="empty-icon">
                            <i class="fas fa-shopping-cart"></i>
                        </div>
                        <h4>No Purchases Yet</h4>
                        <p>Your purchase history will appear here once you start buying.</p>
                    </div>
                </div>
            </div>
            
            <div class="tab-content" id="settings-tab">
                <h3 class="mb-4">Account Settings</h3>
                <div id="settings-container">
                    <div class="card">
                        <div class="card-body">
                            <h5>Profile Information</h5>
                            <p>Update your profile details and preferences.</p>
                            <button class="btn btn-outline-primary">Edit Profile</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        mainContent.insertAdjacentHTML('beforeend', tabContentHTML);
    }

    switchTab(tabName) {
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

    async loadRequirements() {
        try {
            console.log('📋 Loading requirements...');
            // This would call your requirements API
            // For now, we'll show the empty state

            // Update requirements count in stats
            document.getElementById('totalRequirements').textContent = '0';
            document.getElementById('activeRequirements').textContent = '0';

        } catch (error) {
            console.error('❌ Error loading requirements:', error);
        }
    }

    async makeApiCall(url, options) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': this.csrfToken
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

    formatDate(dateString) {
        if (!dateString) return 'Not set';

        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    getLoginTime() {
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

    showError(message) {
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

    showSuccess(message) {
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
}

// Global function to initialize the app (called from HTML)
async function initBuyerProfileApp(csrfToken, userDetailsApiUrl, requirementsApiUrl, purchasesApiUrl) {
    try {
        new BuyerProfileApp(csrfToken, userDetailsApiUrl, requirementsApiUrl, purchasesApiUrl);
    } catch (error) {
        console.error('❌ Failed to initialize Buyer Profile App:', error);
    }
}

// Export for use in modules
window.initBuyerProfileApp = initBuyerProfileApp;
window.BuyerProfileApp = BuyerProfileApp;

console.log('🔐 WasteBazar Buyer Profile System Loaded');
