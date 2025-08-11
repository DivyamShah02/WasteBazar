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

            // Store user details in localStorage for future use
            if (seller_data.user_details) {
                const userName = seller_data.user_details.name;

                if (userName) {
                    localStorage.setItem('user_name', userName);
                    console.log('✅ Stored user name in localStorage:', userName);
                }
            }

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

        // Use the new retrieve endpoint with user_id as path parameter
        const [success, response] = await callApi('GET', `${seller_listings_api_url}${current_user_id}/`, null, csrf_token);

        if (success && response.success) {
            const listings = response.data || [];
            const meta = response.meta || {};
            console.log('✅ Listings loaded:', listings);
            console.log('📊 Listings metadata:', meta);

            // Separate approved and unapproved listings
            const approvedListings = listings.filter(listing =>
                listing.status === 'active' || listing.status === 'approved'
            );
            const unapprovedListings = listings.filter(listing =>
                listing.status === 'pending' || listing.status === 'under_review' || listing.status === 'rejected'
            );

            renderListings(approvedListings);
            renderUnapprovedListings(unapprovedListings);
            updateListingsStats(listings, meta);
        } else {
            console.error('❌ Failed to load listings:', response?.error || 'Unknown error');
            // Show empty state instead of error to maintain UI
            renderListings([]);
            renderUnapprovedListings([]);
            updateListingsStats([], {});

            // Only show error if it's not just "no listings found"
            if (response?.error && !response.error.includes('not found')) {
                showError(response.error);
            }
        }
    } catch (error) {
        console.error('❌ Error loading listings:', error);
        renderListings([]);
        renderUnapprovedListings([]);
        updateListingsStats([], {});
        showError('Failed to load listings. Please refresh the page.');
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
    const sidebarTitleEl = document.getElementById('sidebarInfoTitle');
    const sidebarCompanyLabelEl = document.getElementById('sidebarCompanyLabel');
    const sidebarCompanyNameEl = document.getElementById('sidebarCompanyName');
    const sidebarEmailEl = document.getElementById('sidebarEmail');
    const sidebarPhoneEl = document.getElementById('sidebarPhone');
    const idDocItemEl = document.getElementById('sidebarIdDocItem');
    const idDocLabelEl = document.getElementById('sidebarIdDocLabel');
    const idDocValueEl = document.getElementById('sidebarIdDocValue');

    const isIndividual = userDetails.role === 'seller_individual';

    // Title: Company Information -> Seller Information for individuals
    if (sidebarTitleEl) {
        const titleText = isIndividual ? 'Seller Information' : 'Company Information';
        sidebarTitleEl.innerHTML = `<i class="fas fa-address-book"></i> ${titleText}`;
    }
    if (sidebarCompanyLabelEl) sidebarCompanyLabelEl.textContent = isIndividual ? 'Seller' : 'Company';

    if (sidebarCompanyNameEl) {
        if (!isIndividual && corporateDetails && corporateDetails.company_name) {
            sidebarCompanyNameEl.textContent = corporateDetails.company_name;
        } else {
            sidebarCompanyNameEl.textContent = userDetails.name || 'Not provided';
        }
    }

    if (sidebarEmailEl) sidebarEmailEl.textContent = userDetails.email || 'Not provided';
    if (sidebarPhoneEl) sidebarPhoneEl.textContent = userDetails.contact_number || 'Not provided';

    // Address/location is intentionally not displayed in the sidebar per requirement

    // Show PAN/Aadhar for individuals if available
    if (idDocItemEl && idDocLabelEl && idDocValueEl) {
        if (isIndividual) {
            const pan = userDetails.pan_number;
            const aadhar = userDetails.aadhar_number || (corporateDetails && corporateDetails.aadhar_number);
            if (pan) {
                idDocLabelEl.textContent = 'PAN';
                idDocValueEl.textContent = pan;
                idDocItemEl.style.display = 'flex';
            } else if (aadhar) {
                idDocLabelEl.textContent = 'Aadhar';
                idDocValueEl.textContent = aadhar;
                idDocItemEl.style.display = 'flex';
            } else {
                idDocItemEl.style.display = 'none';
            }
        } else {
            idDocItemEl.style.display = 'none';
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
                <button class="btn btn-primary" onclick="window.location.href='/listing-form/'">
                    <i class="fas fa-plus me-2"></i>Create First Listing
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = listings.map(listing => `
        <div class="card mb-3 listing-card">
            <div class="card-body p-0">
                <div class="row g-0">
                    <!-- Featured Image Section -->
                    <div class="col-12 col-md-3 listing-image-container">
                        ${listing.featured_image_url ? `
                            <img src="${listing.featured_image_url}" 
                                 class="listing-featured-image" 
                                 alt="Featured image for ${listing.category}"
                                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZjNzU3ZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';">
                        ` : `
                            <div class="listing-no-image">
                                <i class="fas fa-image"></i>
                                <span>No Image</span>
                            </div>
                        `}
                        ${listing.gallery_images && listing.gallery_images.length > 0 ? `
                            <div class="gallery-indicator">
                                <i class="fas fa-images"></i>
                                <span>+${listing.gallery_images.length}</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    <!-- Content Section -->
                    <div class="col-12 col-md-9">
                        <div class="listing-content p-3">
                            <!-- Header with title and status -->
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <div class="listing-header">
                                    <h5 class="card-title mb-1">${listing.category || 'Listing'} - ${listing.subcategory || ''}</h5>
                                    <small class="text-muted listing-id">#${listing.listing_id}</small>
                                </div>
                                <span class="badge bg-${getStatusBadgeColor(listing.status)} status-badge">${getStatusLabel(listing.status)}</span>
                            </div>
                            
                            <!-- Quick Details -->
                            <div class="row listing-details mb-2">
                                <div class="col-6 col-sm-3">
                                    <div class="detail-item">
                                        <i class="fas fa-weight-hanging text-primary"></i>
                                        <span class="detail-value">${listing.quantity} ${listing.unit || 'kg'}</span>
                                    </div>
                                </div>
                                <div class="col-6 col-sm-3">
                                    <div class="detail-item">
                                        <i class="fas fa-rupee-sign text-primary"></i>
                                        <span class="detail-value">₹${listing.priceperunit || '0'}/${listing.unit || 'unit'}</span>
                                    </div>
                                </div>
                                <div class="col-12 col-sm-6">
                                    <div class="detail-item">
                                        <i class="fas fa-map-marker-alt text-primary"></i>
                                        <span class="detail-value">${listing.city_location || 'Not specified'}${listing.state_location ? ', ' + listing.state_location : ''}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Description -->
                            <p class="card-text listing-description mb-2">${truncateText(listing.description || 'No description available', 100)}</p>
                            
                            <!-- Dates -->
                            <div class="listing-dates mb-3">
                                <small class="text-muted">
                                    <i class="fas fa-calendar me-1"></i>Created: ${formatDate(listing.created_at)}
                                    <span class="d-none d-sm-inline"> | <i class="fas fa-clock me-1"></i>Valid until: ${formatDate(listing.valid_until)}</span>
                                </small>
                            </div>
                            
                            <!-- Action Buttons -->
                            <div class="listing-actions d-flex flex-wrap gap-2">
                                <button class="btn btn-outline-primary btn-sm flex-fill" onclick="editListing('${listing.listing_id}')">
                                    <i class="fas fa-edit"></i> <span class="d-none d-sm-inline">Edit</span>
                                </button>
                                <button class="btn btn-outline-warning btn-sm flex-fill" onclick="pauseListing('${listing.listing_id}')">
                                    <i class="fas fa-pause"></i> <span class="d-none d-sm-inline">Mark Sold</span>
                                </button>
                                <button class="btn btn-outline-info btn-sm flex-fill" onclick="viewListingDetails('${listing.listing_id}')">
                                    <i class="fas fa-eye"></i> <span class="d-none d-sm-inline">Details</span>
                                </button>
                            </div>
                        </div>
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
        <div class="card mb-3 listing-card">
            <div class="card-body p-0">
                <div class="row g-0">
                    <!-- Featured Image Section -->
                    <div class="col-12 col-md-3 listing-image-container">
                        ${listing.featured_image_url ? `
                            <img src="${listing.featured_image_url}" 
                                 class="listing-featured-image" 
                                 alt="Featured image for ${listing.category}"
                                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZjNzU3ZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';">
                        ` : `
                            <div class="listing-no-image">
                                <i class="fas fa-image"></i>
                                <span>No Image</span>
                            </div>
                        `}
                        ${listing.gallery_images && listing.gallery_images.length > 0 ? `
                            <div class="gallery-indicator">
                                <i class="fas fa-images"></i>
                                <span>+${listing.gallery_images.length}</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    <!-- Content Section -->
                    <div class="col-12 col-md-9">
                        <div class="listing-content p-3">
                            <!-- Header with title and status -->
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <div class="listing-header">
                                    <h5 class="card-title mb-1">${listing.category || 'Listing'} - ${listing.subcategory || ''}</h5>
                                    <small class="text-muted listing-id">#${listing.listing_id}</small>
                                </div>
                                <span class="badge bg-${getStatusBadgeColor(listing.status)} status-badge">${getStatusLabel(listing.status)}</span>
                            </div>
                            
                            <!-- Quick Details -->
                            <div class="row listing-details mb-2">
                                <div class="col-6 col-sm-4">
                                    <div class="detail-item">
                                        <i class="fas fa-weight-hanging text-primary"></i>
                                        <span class="detail-value">${listing.quantity} ${listing.unit || 'kg'}</span>
                                    </div>
                                </div>
                                <div class="col-6 col-sm-8">
                                    <div class="detail-item">
                                        <i class="fas fa-map-marker-alt text-primary"></i>
                                        <span class="detail-value">${listing.city_location || 'Not specified'}${listing.state_location ? ', ' + listing.state_location : ''}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Description -->
                            <p class="card-text listing-description mb-2">${truncateText(listing.description || 'No description available', 100)}</p>
                            
                            <!-- Rejection Reason (if any) -->
                            ${listing.rejection_reason ? `
                                <div class="alert alert-warning mb-2 p-2">
                                    <strong><i class="fas fa-exclamation-triangle me-2"></i>Rejection Reason:</strong>
                                    <br><small>${listing.rejection_reason}</small>
                                </div>
                            ` : ''}
                            
                            <!-- Dates -->
                            <div class="listing-dates mb-3">
                                <small class="text-muted">
                                    <i class="fas fa-calendar me-1"></i>Submitted: ${formatDate(listing.created_at)}
                                    ${listing.status === 'pending' ? '<span class="d-none d-sm-inline"> | <i class="fas fa-clock me-1"></i>Waiting for review</span>' : ''}
                                </small>
                            </div>
                            
                            <!-- Action Buttons -->
                            <div class="listing-actions d-flex flex-wrap gap-2">
                                ${listing.status === 'rejected' ? `
                                    <button class="btn btn-outline-primary btn-sm flex-fill" onclick="editListing('${listing.listing_id}')">
                                        <i class="fas fa-edit"></i> <span class="d-none d-sm-inline">Edit & Resubmit</span>
                                    </button>
                                ` : ''}
                                <button class="btn btn-outline-info btn-sm flex-fill" onclick="viewListingDetails('${listing.listing_id}')">
                                    <i class="fas fa-eye"></i> <span class="d-none d-sm-inline">Details</span>
                                </button>
                                ${listing.status === 'pending' ? `
                                    <button class="btn btn-outline-danger btn-sm flex-fill" onclick="cancelListing('${listing.listing_id}')">
                                        <i class="fas fa-times"></i> <span class="d-none d-sm-inline">Cancel</span>
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Update listings statistics
 */
function updateListingsStats(listings, meta = {}) {
    const totalListingsEl = document.getElementById('totalListings');
    const activeListingsEl = document.getElementById('activeListings');
    const soldItemsEl = document.getElementById('soldItems');

    // Use metadata if available, otherwise calculate from listings array
    const totalListings = meta.total_listings !== undefined ? meta.total_listings : listings.length;
    const activeListings = meta.approved_listings !== undefined ? meta.approved_listings :
        listings.filter(l => l.status === 'active' || l.status === 'approved').length;
    const soldItems = meta.sold_listings !== undefined ? meta.sold_listings :
        listings.filter(l => l.status === 'sold').length;

    if (totalListingsEl) totalListingsEl.textContent = totalListings;
    if (activeListingsEl) activeListingsEl.textContent = activeListings;
    if (soldItemsEl) soldItemsEl.textContent = soldItems;

    // Log statistics for debugging
    console.log('📊 Updated listings stats:', {
        total: totalListings,
        active: activeListings,
        sold: soldItems,
        pending: meta.pending_listings || 0,
        rejected: meta.rejected_listings || 0
    });
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
    window.location.href = `/listing-edit/${listingId}/`;
};

window.pauseListing = async function (listingId) {
    console.log('Mark as sold listing:', listingId);

    if (!confirm('Are you sure you want to mark this listing as sold?')) {
        return;
    }

    try {
        // Get user_id from localStorage
        const user_id = localStorage.getItem('user_id');
        if (!user_id) {
            showError('User not logged in. Please refresh the page and try again.');
            return;
        }

        console.log('📤 Marking listing as sold:', listingId, 'for user:', user_id);

        const [success, response] = await callApi(
            'PATCH',  // Use PATCH for partial_update method
            `/marketplace-api/seller-listings/${listingId}/`,  // Use listing-detail endpoint
            { user_id: user_id },  // Ensure user_id is explicitly sent
            csrf_token
        );

        if (success && response.success) {
            showSuccess('Listing marked as sold successfully!');
            // Reload listings to update the UI
            await loadSellerListings();
        } else {
            throw new Error(response.error || 'Failed to mark listing as sold');
        }
    } catch (error) {
        console.error('Error marking listing as sold:', error);
        showError('Failed to mark listing as sold: ' + error.message);
    }
};

window.viewListingDetails = function (listingId) {
    console.log('View listing details:', listingId);
    window.location.href = `/listing-detail/?id=${listingId}`;
};

window.cancelListing = async function (listingId) {
    console.log('Cancel listing:', listingId);

    if (!confirm('Are you sure you want to cancel this listing? This action cannot be undone.')) {
        return;
    }

    try {
        // For now, we'll mark it as inactive since there's no delete endpoint
        // You can implement a proper delete endpoint later if needed
        const [success, response] = await callApi(
            'PUT',
            `/marketplace-api/seller-listings/${listingId}/`,
            {
                user_id: current_user_id,
                status: 'deleted'
            },
            csrf_token
        );

        if (success && response.success) {
            showSuccess('Listing cancelled successfully!');
            // Reload listings to update the UI
            await loadSellerListings();
        } else {
            throw new Error(response.error || 'Failed to cancel listing');
        }
    } catch (error) {
        console.error('Error cancelling listing:', error);
        showError('Failed to cancel listing: ' + error.message);
    }
};

/**
 * Logout functionality
 */
window.logout = function () {
    console.log('🚪 Logging out user...');

    if (confirm('Are you sure you want to logout?')) {
        try {
            // Clear all user data from localStorage
            localStorage.removeItem('user_id');
            localStorage.removeItem('user_role');
            localStorage.removeItem('user_name');
            localStorage.removeItem('user_email');
            localStorage.removeItem('is_logged_in');
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');

            // Clear any other session data
            sessionStorage.clear();

            console.log('✅ User data cleared from localStorage');

            // Show logout message
            showSuccess('Logged out successfully!');

            // Redirect to direct login page after a short delay
            setTimeout(() => {
                window.location.href = '/directlogin/';
            }, 1000);

        } catch (error) {
            console.error('❌ Error during logout:', error);
            showError('Error during logout. Redirecting anyway...');

            // Force redirect even if there's an error
            setTimeout(() => {
                window.location.href = '/directlogin/';
            }, 1500);
        }
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

    // Set up logout button functionality
    const logoutButtons = document.querySelectorAll('a[href="#logout"], button[onclick*="logout"], .logout-btn, [data-action="logout"]');

    logoutButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault(); // Prevent default navigation
            logout();
        });
    });

    // Also handle any logout links in the navbar or sidebar
    const navLogoutLinks = document.querySelectorAll('a[href="/logout/"], a[href*="logout"]');

    navLogoutLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault(); // Prevent default navigation
            logout();
        });
    });
});

/**
 * Utility function to truncate text
 */
function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

console.log('🔐 WasteBazar Seller Profile System Loaded');


