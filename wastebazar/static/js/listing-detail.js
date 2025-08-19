// Listing Detail Page JavaScript
// Handles fetching and rendering listing details from API

class ListingDetailApp {
  constructor() {
    this.listingId = null;
    this.listingData = null;
    this.relatedListings = [];
    this.init();
  }

  init() {
    // Get listing ID from URL or page context
    this.extractListingId();

    if (this.listingId) {
      this.fetchListingDetail();
      this.fetchRelatedListings();
    } else {
      this.showError('Listing ID not found');
    }

    this.setupEventListeners();
  }

  extractListingId() {
    // Method 1: From URL path (e.g., /listing_detail/123456789/)
    const pathMatch = window.location.pathname.match(/\/listing_detail\/(\d+)\//);
    if (pathMatch) {
      this.listingId = pathMatch[1];
      return;
    }

    // Method 2: From URL query parameter (e.g., ?id=123456789)
    const urlParams = new URLSearchParams(window.location.search);
    const idFromQuery = urlParams.get('id');
    if (idFromQuery) {
      this.listingId = idFromQuery;
      return;
    }

    // Method 3: From Django template context (if available)
    if (typeof window.listingId !== 'undefined') {
      this.listingId = window.listingId;
      return;
    }

    console.error('Could not extract listing ID from URL or context');
  }

  async fetchListingDetail() {
    try {

      const response = await fetch(`/marketplace-api/listing-detail/${this.listingId}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        this.listingData = data.data;
        this.renderListingDetail();
        this.hideLoading();
      } else {
        throw new Error(data.error || 'Failed to fetch listing details');
      }

    } catch (error) {
      console.error('Error fetching listing details:', error);
      this.showError(`Failed to load listing details: ${error.message}`);
      this.hideLoading();
    }
  }

  async fetchRelatedListings() {
    try {
      // Fetch all listings and filter related ones
      const response = await fetch('/marketplace-api/all-listings/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          // Filter related listings by category, excluding current listing
          this.relatedListings = data.data
            .filter(listing =>
              listing.listing_id !== this.listingId &&
              listing.category_id === this.listingData?.category_id
            )
            .slice(0, 4); // Limit to 4 related listings

          this.renderRelatedListings();
        }
      }
    } catch (error) {
      console.error('Error fetching related listings:', error);
    }
  }

  renderListingDetail() {
    if (!this.listingData) return;

    const listing = this.listingData;

    // Update page title
    document.title = `${listing.listing_name || listing.category_name || 'Category'} | WasteBazar`;

    // Update breadcrumb
    this.updateBreadcrumb(listing);

    // Update listing header
    this.updateListingHeader(listing);

    // Update image gallery
    this.updateImageGallery(listing);

    // Update description
    this.updateDescription(listing);

    // Update specifications
    this.updateSpecifications(listing);

    // Update location
    this.updateLocation(listing);

    // Update quick info
    this.updateQuickInfo(listing);

    // Update seller information
    this.updateSellerInfo(listing);

    // Setup forms
    this.setupInquiryForm(listing);
  }

  updateBreadcrumb(listing) {
    const breadcrumb = document.querySelector('.breadcrumb');
    if (!breadcrumb) return;

    const categoryName = listing.category_name || 'Category';
    const listingTitle = this.truncateText(listing.listing_name || listing.seller_name || 'Listing', 30);

    breadcrumb.innerHTML = `
            <li class="breadcrumb-item"><a href="/">Home</a></li>
            <li class="breadcrumb-item"><a href="/marketplace">Listings</a></li>
            <li class="breadcrumb-item"><a href="/marketplace?category=${listing.category_name}">${categoryName}</a></li>
            <li class="breadcrumb-item active" aria-current="page">${listing.subcategory_name || 'Subcategory'}</li>
        `;
  }

  updateListingHeader(listing) {
    // Update title
    const titleElement = document.getElementById('listing-title');
    if (titleElement) {
      const title = listing.listing_name ||
        `${listing.category_name || 'Category'} - ${listing.subcategory_name || 'Subcategory'}` ||
        'Listing Details';
      titleElement.textContent = title;
    }

    // Update location meta
    const locationMeta = document.getElementById('listing-location');
    if (locationMeta) {
      const location = [listing.city_location, listing.state_location]
        .filter(Boolean)
        .join(', ') || 'Location not specified';
      locationMeta.textContent = location;
    }

    // Update date meta
    // const dateMeta = document.getElementById('listing-date');
    // if (dateMeta) {
    //   dateMeta.textContent = `Posted ${this.getRelativeTime(listing.created_at)}`;
    // }

    // Update price
    // const priceAmountElement = document.getElementById('price-amount');
    // const priceUnitElement = document.getElementById('price-unit');

    // if (priceAmountElement) {
    //   if (listing.priceperunit && listing.priceperunit > 0) {
    //     priceAmountElement.textContent = `₹${listing.priceperunit.toLocaleString()}`;
    //   } else {
    //     priceAmountElement.textContent = 'Price on Request';
    //   }
    // }

    // if (priceUnitElement && listing.unit) {
    //   priceUnitElement.textContent = `per ${listing.unit}`;
    // }

    // Update badges
    const badgesContainer = document.getElementById('listing-badges');
    if (badgesContainer) {
      let badgesHTML = '';

      if (listing.status === 'approved' || listing.status === 'auto_approved') {
        badgesHTML += '<span class="badge-verified">Verified Seller</span>';
      }



      badgesContainer.innerHTML = badgesHTML;
    }
  }

  updateImageGallery(listing) {
    const mainImageContainer = document.getElementById('main-image-container');
    const thumbnailGallery = document.getElementById('thumbnail-gallery');

    if (!mainImageContainer) return;

    const images = [];

    // Add featured image if available
    if (listing.featured_image_url) {
      images.push(listing.featured_image_url);
    }

    // Add gallery images if available
    if (listing.gallery_images && Array.isArray(listing.gallery_images)) {
      images.push(...listing.gallery_images);
    }

    // Store images globally for slider functionality
    this.currentImages = images;
    this.currentImageIndex = 0;

    if (images.length > 0) {
      // Main image container with slider controls
      mainImageContainer.innerHTML = `
                <div class="image-slider-container">
                    ${images.length > 1 ? `
                        <button class="slider-btn slider-btn-prev" onclick="window.listingApp.previousImage()" aria-label="Previous image">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                    ` : ''}
                    <img src="${images[0]}" 
                         alt="${listing.listing_name || listing.seller_name || 'Listing image'}" 
                         class="main-image" 
                         id="main-image"
                         onclick="openImageModal('${images[0]}')"
                         onerror="this.src='/static/images/placeholder.jpg'">
                    ${images.length > 1 ? `
                        <button class="slider-btn slider-btn-next" onclick="window.listingApp.nextImage()" aria-label="Next image">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                        <div class="image-counter">
                            <span id="current-image-number">1</span> / <span id="total-images">${images.length}</span>
                        </div>
                    ` : ''}
                </div>
            `;

      // Thumbnail gallery
      if (thumbnailGallery && images.length > 1) {
        const thumbnailsHTML = images.map((image, index) => `
                    <div class="thumbnail ${index === 0 ? 'active' : ''}" onclick="window.listingApp.changeMainImage(${index})">
                        <img src="${image}" 
                             alt="Gallery image ${index + 1}" 
                             onerror="this.style.display='none'">
                    </div>
                `).join('');

        thumbnailGallery.innerHTML = thumbnailsHTML;
      }
    } else {
      // Placeholder image
      mainImageContainer.innerHTML = `
                <div class="image-placeholder">
                    <i class="fas fa-image fa-3x"></i>
                    <p>No image available</p>
                </div>
            `;
    }
  }

  updateDescription(listing) {
    const descriptionContent = document.getElementById('description-content');
    if (!descriptionContent) return;

    if (listing.description && listing.description.trim()) {
      descriptionContent.innerHTML = `
                <p>${listing.description.replace(/\n/g, '<br>')}</p>
            `;
    } else {
      descriptionContent.innerHTML = `
                <p class="text-muted">No description provided for this listing.</p>
            `;
    }
  }

  updateSpecifications(listing) {
    const specsTable = document.getElementById('specs-table');
    if (!specsTable) return;

    const specifications = [
      { label: 'Category', value: listing.category_name || 'N/A' },
      { label: 'Subcategory', value: listing.subcategory_name || 'N/A' },
      { label: 'Waste packed type', value: listing.waste_packed_type || 'N/A' },
      { label: 'Waste stored', value: listing.waste_stored || 'N/A' },
      { label: 'Listed Date', value: this.formatDate(listing.created_at) },
    ];

    const specsHTML = specifications.map(spec => `
            <div class="spec-row">
                <div class="spec-label">${spec.label}</div>
                <div class="spec-value">${spec.value}</div>
            </div>
        `).join('');

    specsTable.innerHTML = specsHTML;
  }

  updateLocation(listing) {
    const locationContent = document.getElementById('location-content');
    if (!locationContent) return;

    const fullAddress = [

      listing.city_location,
      listing.state_location,
      listing.pincode_location
    ].filter(Boolean).join(', ');

    locationContent.innerHTML = `
            <div class="location-details">
              
                <div class="location-item">
                    <i class="fas fa-city"></i>
                    <div>
                        <strong>City & State</strong>
                        <p>${listing.city_location || 'N/A'}, ${listing.state_location || 'N/A'}</p>
                    </div>
                </div>
                <div class="location-item">
                    <i class="fas fa-mail-bulk"></i>
                    <div>
                        <strong>PIN Code</strong>
                        <p>${listing.pincode_location || 'N/A'}</p>
                    </div>
                </div>
            </div>
        `;
  }

  updateQuickInfo(listing) {
    const quickInfoGrid = document.getElementById('quick-info-grid');
    if (!quickInfoGrid) return;

    const totalValue = listing.priceperunit && listing.quantity ?
      (listing.priceperunit * listing.quantity).toLocaleString() : 'N/A';

    quickInfoGrid.innerHTML = `
            <div class="info-item">
                <div class="info-label">Total Quantity</div>
                <div class="info-value">${listing.quantity} ${listing.unit}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Price per ${listing.unit}</div>
                <div class="info-value">₹${listing.priceperunit ? listing.priceperunit.toLocaleString() : 'On Request'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Total Value</div>
                <div class="info-value">₹${totalValue}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Availability</div>
                <div class="info-value">${this.getAvailabilityStatus(listing)}</div>
            </div>
        `;
  }

  updateSellerInfo(listing) {
    const sellerProfile = document.getElementById('seller-profile');
    const sellerActions = document.getElementById('seller-actions');
    // const sellerStats = document.querySelector('.seller-stats');

    if (!sellerProfile) return;

    sellerProfile.innerHTML = `
            <div class="seller-main-info row">
                <div class="seller-avatar">
                    <i class="fas fa-user-circle fa-4x"></i>
                </div>
                <div class="seller-basic-details">
                    <h4>${listing.seller_name || 'Anonymous Seller'}</h4>
                    <p class="seller-id">ID: ${listing.seller_user_id}</p>
                </div>
            </div>
            
           
        `;

    // if (sellerStats) {
    //   sellerStats.innerHTML = `

    //     `;
    // }

    if (sellerActions) {
      sellerActions.innerHTML = `
                <button class="btn-contact-seller" onclick="openContactModal()">
                    <i class="fas fa-phone"></i>
                    Contact Seller
                </button>
                
            `;
    }
  }

  setupInquiryForm(listing) {
    const inquiryForm = document.getElementById('inquiry-form');
    if (!inquiryForm) return;

    inquiryForm.innerHTML = `
            <div class="form-group">
                <label for="inquiryName">Your Name *</label>
                <input type="text" id="inquiryName" class="form-control" required>
            </div>
            <div class="form-group">
                <label for="inquiryEmail">Email *</label>
                <input type="email" id="inquiryEmail" class="form-control" required>
            </div>
            <div class="form-group">
                <label for="inquiryPhone">Phone Number *</label>
                <input type="tel" id="inquiryPhone" class="form-control" required>
            </div>
            <div class="form-group">
                <label for="inquiryMessage">Message *</label>
                <textarea id="inquiryMessage" class="form-control" rows="4" required 
                          placeholder="I'm interested in your ${listing.category_name} listing. Please provide more details."></textarea>
            </div>
            <button type="submit" class="btn-submit-inquiry" onclick="submitInquiry()">
                <i class="fas fa-paper-plane"></i>
                Send Inquiry
            </button>
        `;
  }

  renderRelatedListings() {
    const relatedListingsGrid = document.getElementById('relatedListings');
    if (!relatedListingsGrid || this.relatedListings.length === 0) return;

    const relatedHTML = this.relatedListings.map(listing => `
            <div class="related-listing-card" onclick="viewListing('${listing.listing_id}')">
                <div class="related-listing-image">
                    ${listing.featured_image_url ?
        `<img src="${listing.featured_image_url}" alt="${listing.listing_name || listing.seller_name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` :
        ''
      }
                    <div class="listing-icon-fallback" style="${listing.featured_image_url ? 'display: none;' : 'display: flex;'}">
                        <i class="fas fa-recycle"></i>
                    </div>
                </div>
                <div class="related-listing-content">
                    <h4>${listing.listing_name || listing.seller_name || listing.category_name}</h4>
                    <p class="related-price">₹${listing.priceperunit ? listing.priceperunit.toLocaleString() : 'On Request'}/${listing.unit}</p>
                    <p class="related-location">${listing.city_location}, ${listing.state_location}</p>
                </div>
            </div>
        `).join('');

    relatedListingsGrid.innerHTML = relatedHTML;
  }

  // Utility methods
  formatStatus(status) {
    const statusMap = {
      'pending': 'Pending Approval',
      'approved': 'Approved',
      'auto_approved': 'Auto Approved',
      'inactive': 'Inactive',
      'sold': 'Sold',
      'deleted': 'Deleted'
    };
    return statusMap[status] || status;
  }

  formatDate(dateString, yearOnly = false) {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    if (yearOnly) {
      return date.getFullYear().toString();
    }

    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getRelativeTime(dateString) {
    if (!dateString) return 'recently';

    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '1 day ago';
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }

  getAvailabilityStatus(listing) {
    if (listing.status === 'sold') return 'Sold';
    if (listing.status === 'inactive') return 'Inactive';

    if (listing.valid_until) {
      const validUntil = new Date(listing.valid_until);
      const now = new Date();
      if (validUntil < now) return 'Expired';
    }

    return 'Available';
  }

  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  setupEventListeners() {
    // Share button
    // const shareBtn = document.getElementById('shareBtn');
    // if (shareBtn) {
    //   shareBtn.addEventListener('click', () => this.shareListing());
    // }

    // Keyboard navigation for image slider
    document.addEventListener('keydown', (e) => {
      if (!this.currentImages || this.currentImages.length <= 1) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          this.previousImage();
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.nextImage();
          break;
        case 'Escape':
          // Close any open modal
          const modalBackdrop = document.querySelector('.modal-backdrop');
          if (modalBackdrop) {
            const modal = bootstrap.Modal.getInstance(document.querySelector('.modal.show'));
            if (modal) modal.hide();
          }
          break;
      }
    });

    // Touch/swipe support for mobile
    this.setupTouchEvents();
  }

  setupTouchEvents() {
    let startX = null;
    let startY = null;
    let threshold = 50; // minimum distance for swipe

    const mainImageContainer = document.getElementById('main-image-container');
    if (!mainImageContainer) return;

    mainImageContainer.addEventListener('touchstart', (e) => {
      if (!this.currentImages || this.currentImages.length <= 1) return;

      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });

    mainImageContainer.addEventListener('touchend', (e) => {
      if (!this.currentImages || this.currentImages.length <= 1 || !startX || !startY) return;

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;

      const deltaX = endX - startX;
      const deltaY = endY - startY;

      // Check if it's more horizontal than vertical movement
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          // Swipe right (previous image)
          this.previousImage();
        } else {
          // Swipe left (next image)  
          this.nextImage();
        }
      }

      startX = null;
      startY = null;
    }, { passive: true });
  }

  shareListing() {
    if (navigator.share && this.listingData) {
      navigator.share({
        title: this.listingData.listing_name || this.listingData.seller_name || 'WasteBazar Listing',
        text: `Check out this ${this.listingData.category_name} listing on WasteBazar`,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href).then(() => {
        alert('Link copied to clipboard!');
      });
    }
  }

  // Image slider navigation methods
  changeMainImage(imageIndex) {
    if (!this.currentImages || imageIndex < 0 || imageIndex >= this.currentImages.length) {
      return;
    }

    this.currentImageIndex = imageIndex;
    const mainImage = document.getElementById('main-image');
    const currentImageNumber = document.getElementById('current-image-number');

    if (mainImage) {
      // Add loading state
      // mainImage.classList.add('loading');

      // Preload new image
      const newImg = new Image();
      newImg.onload = () => {
        mainImage.src = this.currentImages[imageIndex];
        // mainImage.classList.remove('loading');
        // mainImage.classList.add('fade-in');
        // Update onclick for modal
        mainImage.setAttribute('onclick', `openImageModal('${this.currentImages[imageIndex]}')`);

        // Remove fade-in class after animation
        setTimeout(() => {
          mainImage.classList.remove('fade-in');
        }, 300);
      };
      newImg.onerror = () => {
        mainImage.classList.remove('loading');
        mainImage.src = '/static/images/placeholder.jpg';
      };
      newImg.src = this.currentImages[imageIndex];
    }

    if (currentImageNumber) {
      currentImageNumber.textContent = imageIndex + 1;
    }

    // Update active thumbnail
    this.updateActiveThumbnail(imageIndex);
  }

  nextImage() {
    if (!this.currentImages) return;

    const nextIndex = (this.currentImageIndex + 1) % this.currentImages.length;
    this.changeMainImage(nextIndex);
  }

  previousImage() {
    if (!this.currentImages) return;

    const prevIndex = this.currentImageIndex === 0 ? this.currentImages.length - 1 : this.currentImageIndex - 1;
    this.changeMainImage(prevIndex);
  }

  updateActiveThumbnail(activeIndex) {
    const thumbnails = document.querySelectorAll('.thumbnail');
    thumbnails.forEach((thumbnail, index) => {
      if (index === activeIndex) {
        thumbnail.classList.add('active');
        // Scroll the active thumbnail into view
        thumbnail.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      } else {
        thumbnail.classList.remove('active');
      }
    });
  }

  showLoading() {
    const mainContent = document.querySelector('.detail-content-grid');
    if (mainContent) {
      mainContent.style.opacity = '0.5';
      mainContent.style.pointerEvents = 'none';
    }
  }

  hideLoading() {
    const mainContent = document.querySelector('.detail-content-grid');
    if (mainContent) {
      mainContent.style.opacity = '1';
      mainContent.style.pointerEvents = 'auto';
    }
  }

  showError(message) {
    const mainContent = document.querySelector('.center-content .container');
    if (mainContent) {
      mainContent.innerHTML = `
                <div class="error-container" style="text-align: center; padding: 4rem 2rem;">
                    <i class="fas fa-exclamation-triangle fa-3x" style="color: #dc3545; margin-bottom: 2rem;"></i>
                    <h2>Error Loading Listing</h2>
                    <p style="color: #6c757d; margin-bottom: 2rem;">${message}</p>
                    <a href="/marketplace" class="btn btn-primary">Browse Other Listings</a>
                </div>
            `;
    }
  }
}

// Global functions for template interaction
function openImageModal(imageUrl) {
  const modalImage = document.getElementById('modalImage');
  if (modalImage) {
    modalImage.src = imageUrl;
  }

  const imageModal = new bootstrap.Modal(document.getElementById('imageModal'));
  imageModal.show();
}

function openContactModal() {
  const contactModal = new bootstrap.Modal(document.getElementById('contactModal'));
  contactModal.show();
}

function openInquiryForm() {
  document.querySelector('.inquiry-form-card').scrollIntoView({
    behavior: 'smooth'
  });
}

function submitInquiry() {
  // Get form data
  const name = document.getElementById('inquiryName').value;
  const email = document.getElementById('inquiryEmail').value;
  const phone = document.getElementById('inquiryPhone').value;
  const message = document.getElementById('inquiryMessage').value;

  // Basic validation
  if (!name || !email || !phone || !message) {
    alert('Please fill in all required fields.');
    return;
  }

  // Here you would typically send the inquiry to your backend
  console.log('Inquiry submitted:', { name, email, phone, message });

  // Show success message
  alert('Your inquiry has been sent successfully! The seller will contact you soon.');

  // Reset form
  document.querySelector('.inquiry-form').reset();
}

function viewListing(listingId) {
  window.location.href = `/listing_detail/${listingId}/`;
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
  console.log('🚀 Listing Detail page initialized');
  window.listingApp = new ListingDetailApp();
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ListingDetailApp;
}
// Global variables
let isFavorited = false
const currentImageIndex = 0

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  initializePage()
  setupEventListeners()
  loadRelatedListings()
  // initializeMobileAds()

  // Initialize AOS
  AOS.init({
    duration: 1000,
    once: true,
    offset: 100,
  })
})

function initializePage() {
  // Navbar scroll effect
  window.addEventListener("scroll", () => {
    const navbar = document.getElementById("navbar")
    if (window.scrollY > 50) {
      navbar.classList.add("scrolled")
    } else {
      navbar.classList.remove("scrolled")
    }
  })

  // Check if listing is favorited
  const listingId = getListingIdFromUrl()

}

function setupEventListeners() {

  // // Share button
  // document.getElementById("shareBtn").addEventListener("click", shareListing)

  // Inquiry modal form submission
  const inquiryFormModal = document.getElementById("inquiryFormModal")
  if (inquiryFormModal) {
    inquiryFormModal.addEventListener("submit", submitInquiryModal)
  }

  // Contact seller button
  document.querySelector(".btn-contact-seller").addEventListener("click", openContactModal)
}

function getListingIdFromUrl() {
  // In a real application, this would extract the ID from the URL
  // For demo purposes, we'll use a fixed ID
  return "1"
}

function toggleFavorite() {
  const listingId = getListingIdFromUrl()
  const favorites = JSON.parse(localStorage.getItem("favorites") || "[]")

  if (isFavorited) {
    // Remove from favorites
    const index = favorites.indexOf(listingId)
    if (index > -1) {
      favorites.splice(index, 1)
    }
    isFavorited = false
  } else {
    // Add to favorites
    favorites.push(listingId)
    isFavorited = true
  }

  localStorage.setItem("favorites", JSON.stringify(favorites))
  updateFavoriteButton()

  // Show feedback
  showToast(isFavorited ? "Added to favorites" : "Removed from favorites")
}

function updateFavoriteButton() {
  const btn = document.getElementById("favoriteBtn")
  const icon = btn.querySelector("i")
  const text = btn.querySelector("span")

  if (isFavorited) {
    btn.classList.add("active")
    icon.className = "fas fa-heart"
    text.textContent = "Saved"
  } else {
    btn.classList.remove("active")
    icon.className = "far fa-heart"
    text.textContent = "Save"
  }
}

function shareListing() {
  if (navigator.share) {
    // Use native sharing if available
    navigator
      .share({
        title: "High-Grade PET Bottle Bales - WasteBazar",
        text: "Check out this premium plastic waste listing on WasteBazar",
        url: window.location.href,
      })
      .then(() => {
        showToast("Listing shared successfully")
      })
      .catch((error) => {
        console.log("Error sharing:", error)
        fallbackShare()
      })
  } else {
    fallbackShare()
  }
}

function fallbackShare() {
  // Fallback sharing options
  const shareUrl = window.location.href
  const shareText = "Check out this premium plastic waste listing on WasteBazar"

  const shareOptions = [
    {
      name: "Copy Link",
      action: () => {
        navigator.clipboard.writeText(shareUrl).then(() => {
          showToast("Link copied to clipboard")
        })
      },
    },
    {
      name: "WhatsApp",
      action: () => {
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`, "_blank")
      },
    },
    {
      name: "Email",
      action: () => {
        window.open(
          `mailto:?subject=${encodeURIComponent("WasteBazar Listing")}&body=${encodeURIComponent(shareText + " " + shareUrl)}`,
        )
      },
    },
  ]

  // Create a simple share modal (in a real app, you'd use a proper modal)
  const shareModal = confirm("Choose sharing option:\n1. Copy Link\n2. WhatsApp\n3. Email\n\nClick OK to copy link")
  if (shareModal) {
    shareOptions[0].action()
  }
}

function reportListing() {
  const reason = prompt(
    "Please select a reason for reporting:\n1. Inappropriate content\n2. Spam\n3. Fraudulent listing\n4. Other\n\nEnter the number (1-4):",
  )

  if (reason && reason >= 1 && reason <= 4) {
    // In a real application, this would send a report to the server
    showToast("Thank you for your report. We'll review this listing.")
    console.log("Listing reported with reason:", reason)
  }
}

function submitInquiry(event) {
  event.preventDefault()

  const formData = new FormData(event.target)
  const inquiryData = {
    name: document.getElementById("inquiryName").value,
    email: document.getElementById("inquiryEmail").value,
    phone: document.getElementById("inquiryPhone").value,
    quantity: document.getElementById("inquiryQuantity").value,
    message: document.getElementById("inquiryMessage").value,
    listingId: getListingIdFromUrl(),
    timestamp: new Date().toISOString(),
  }

  // Validate form
  if (!inquiryData.name || !inquiryData.email || !inquiryData.phone || !inquiryData.message) {
    showToast("Please fill in all required fields", "error")
    return
  }

  // Show loading state
  const submitBtn = event.target.querySelector(".btn-submit-inquiry")
  const originalText = submitBtn.innerHTML
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...'
  submitBtn.disabled = true

  // Simulate API call
  setTimeout(() => {
    // In a real application, this would send the inquiry to the server
    console.log("Inquiry submitted:", inquiryData)

    // Reset form
    event.target.reset()

    // Reset button
    submitBtn.innerHTML = originalText
    submitBtn.disabled = false

    // Show success message
    showToast("Inquiry sent successfully! The seller will contact you soon.")
  }, 2000)
}

// New: handle inquiry submission from modal
function submitInquiryModal(event) {
  event.preventDefault()

  const inquiryData = {
    name: document.getElementById("inquiryNameModal").value.trim(),
    email: document.getElementById("inquiryEmailModal").value.trim(),
    phone: document.getElementById("inquiryPhoneModal").value.trim(),
    quantity: document.getElementById("inquiryQuantityModal").value.trim(),
    message: document.getElementById("inquiryMessageModal").value.trim(),
    listingId: getListingIdFromUrl(),
    timestamp: new Date().toISOString(),
  }

  if (!inquiryData.name || !inquiryData.email || !inquiryData.phone || !inquiryData.message) {
    showToast("Please fill in all required fields", "error")
    return
  }

  const submitBtn = event.target.querySelector(".btn-login")
  const originalHtml = submitBtn.innerHTML
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Submitting...'
  submitBtn.disabled = true

  // Simulate API call; TODO: wire to backend endpoint if available
  setTimeout(() => {
    console.log("Inquiry submitted:", inquiryData)

    // Reset
    event.target.reset()
    submitBtn.innerHTML = originalHtml
    submitBtn.disabled = false

    // Hide modal
    const modalEl = document.getElementById("inquiryModal")
    const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl)
    modal.hide()

    showToast("Inquiry sent successfully! The seller will contact you soon.")
  }, 1200)
}

function openContactModal() {
  const modal = new bootstrap.Modal(document.getElementById("contactModal"))
  modal.show()
}

function loadRelatedListings() {
  const container = document.getElementById("relatedListings")

  // Show loading state
  container.innerHTML = createLoadingSkeletons(3)

  // Simulate loading delay
  setTimeout(() => {
    container.innerHTML = relatedListings.map((listing) => createRelatedListingCard(listing)).join("")

    // Add click handlers
    document.querySelectorAll(".related-listing-card").forEach((card) => {
      card.addEventListener("click", function () {
        const listingId = this.dataset.listingId
        // In a real application, this would navigate to the listing detail page
        console.log("Navigating to listing:", listingId)
        showToast(`Navigating to listing ${listingId}`)
      })
    })
  }, 1000)
}

function createRelatedListingCard(listing) {
  const locationNames = {
    mumbai: "Mumbai, MH",
    delhi: "Delhi, NCR",
    bangalore: "Bangalore, KA",
    chennai: "Chennai, TN",
    pune: "Pune, MH",
    hyderabad: "Hyderabad, TS",
  }

  return `
        <div class="related-listing-card listing-card" data-listing-id="${listing.id}" data-aos="fade-up">
            <div class="listing-image">
                <i class="${listing.icon}"></i>
                <div class="listing-badge">${listing.badge}</div>
            </div>
            <div class="listing-content">
                <h4 class="listing-title">${listing.title}</h4>
                <div class="listing-details">
                    <div class="detail-item">
                        <div class="detail-icon">
                            <i class="fas fa-weight-hanging"></i>
                        </div>
                        <div class="detail-text">${listing.quantity} Tons</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-icon">
                            <i class="fas fa-map-marker-alt"></i>
                        </div>
                        <div class="detail-text">${locationNames[listing.location] || listing.location}</div>
                    </div>
                </div>
                <div class="listing-price">₹${listing.price.toLocaleString()}/Ton</div>
                <div class="listing-footer">
                    <div class="listing-date">Posted ${listing.postedDate}</div>
                    <button class="btn-view-details" onclick="event.stopPropagation(); viewListingDetails(${listing.id})">
                        View Details
                    </button>
                </div>
            </div>
        </div>
    `
}

function createLoadingSkeletons(count) {
  const skeletons = []
  for (let i = 0; i < count; i++) {
    skeletons.push(`
            <div class="listing-card loading">
                <div class="listing-image loading-skeleton"></div>
                <div class="listing-content">
                    <div class="listing-title loading-skeleton" style="height: 20px; margin-bottom: 1rem;"></div>
                    <div class="listing-details">
                        <div class="detail-item">
                            <div class="detail-icon loading-skeleton"></div>
                            <div class="detail-text loading-skeleton" style="height: 16px; width: 80px;"></div>
                        </div>
                    </div>
                    <div class="listing-price loading-skeleton" style="height: 24px; width: 100px; margin-bottom: 1rem;"></div>
                </div>
            </div>
        `)
  }
  return skeletons.join("")
}

function viewListingDetails(listingId) {
  console.log("Viewing details for listing:", listingId)
  showToast(`Loading listing ${listingId}...`)
}

// Advertisement Management (same as listings page)
function closeAd(adId) {
  const adElement = document.getElementById(adId)
  if (adElement) {
    adElement.style.transform = "translateX(-100%)"
    adElement.style.opacity = "0"
    setTimeout(() => {
      adElement.style.display = "none"
    }, 300)
  }

  // Store closed ad in localStorage
  const closedAds = JSON.parse(localStorage.getItem("closedAds") || "[]")
  if (!closedAds.includes(adId)) {
    closedAds.push(adId)
    localStorage.setItem("closedAds", JSON.stringify(closedAds))
  }
}

// Mobile Advertisement System (same as listings page)
function initializeMobileAds() {
  // Only run on mobile devices
  if (window.innerWidth >= 1200) {
    return
  }

  // Check if ads should be shown
  const lastAdTime = localStorage.getItem("lastMobileAdTime")
  const currentAdIndex = Number.parseInt(localStorage.getItem("currentMobileAdIndex") || "0")
  const now = Date.now()

  // Show ad every 5 minutes (300000 ms)
  const adInterval = 300000

  if (!lastAdTime || now - Number.parseInt(lastAdTime) >= adInterval) {
    showMobileAd(currentAdIndex)
  }

  // Set up timer for next ad
  const timeUntilNextAd = lastAdTime ? adInterval - (now - Number.parseInt(lastAdTime)) : adInterval

  setTimeout(
    () => {
      setInterval(() => {
        const nextIndex =
          (Number.parseInt(localStorage.getItem("currentMobileAdIndex") || "0") + 1) % advertisements.length
        showMobileAd(nextIndex)
      }, adInterval)
    },
    Math.max(0, timeUntilNextAd),
  )
}

function showMobileAd(adIndex) {
  if (window.innerWidth >= 1200) {
    return
  }

  const ad = advertisements[adIndex]
  if (!ad) return

  // Update stored values
  localStorage.setItem("lastMobileAdTime", Date.now().toString())
  localStorage.setItem("currentMobileAdIndex", adIndex.toString())

  // Create ad content
  const adContent = `
        <img src="${ad.image}" alt="${ad.title}" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 12px; margin-bottom: 1rem;">
        <h5 style="font-size: 1.3rem; font-weight: 700; color: var(--text-dark); margin-bottom: 1rem;">${ad.title}</h5>
        <p style="color: var(--text-light); font-size: 1rem; line-height: 1.6; margin: 0;">${ad.description}</p>
    `

  // Show modal
  document.getElementById("mobileAdContent").innerHTML = adContent
  const modal = new bootstrap.Modal(document.getElementById("mobileAdModal"))
  modal.show()

  console.log(`Showing mobile ad ${adIndex + 1}:`, ad.title)
}

// Utility functions
function showToast(message, type = "success") {
  // Create toast element
  const toast = document.createElement("div")
  toast.className = `toast-notification toast-${type}`
  toast.innerHTML = `
        <div class="toast-content">
            <i class="fas ${type === "success" ? "fa-check-circle" : "fa-exclamation-circle"}"></i>
            <span>${message}</span>
        </div>
    `

  // Add toast styles if not already added
  if (!document.getElementById("toast-styles")) {
    const styles = document.createElement("style")
    styles.id = "toast-styles"
    styles.textContent = `
            .toast-notification {
                position: fixed;
                top: 120px;
                right: 20px;
                background: white;
                border-radius: 12px;
                padding: 1rem 1.5rem;
                box-shadow: var(--shadow-lg);
                border-left: 4px solid var(--success-color);
                z-index: 9999;
                transform: translateX(100%);
                transition: all 0.3s ease;
                max-width: 300px;
            }
            .toast-notification.toast-error {
                border-left-color: var(--error-color);
            }
            .toast-notification.show {
                transform: translateX(0);
            }
            .toast-content {
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }
            .toast-content i {
                color: var(--success-color);
                font-size: 1.2rem;
            }
            .toast-notification.toast-error .toast-content i {
                color: var(--error-color);
            }
            .toast-content span {
                color: var(--text-dark);
                font-weight: 600;
                font-size: 0.9rem;
            }
        `
    document.head.appendChild(styles)
  }

  // Add to page
  document.body.appendChild(toast)

  // Show toast
  setTimeout(() => toast.classList.add("show"), 100)

  // Remove toast after 3 seconds
  setTimeout(() => {
    toast.classList.remove("show")
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast)
      }
    }, 300)
  }, 3000)
}

function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// SEO and Analytics
function trackPageView() {
  // In a real application, this would send analytics data
  console.log("Page view tracked:", {
    page: "listing-detail",
    listingId: getListingIdFromUrl(),
    timestamp: new Date().toISOString(),
  })
}

function trackUserInteraction(action, details) {
  // In a real application, this would send interaction data
  console.log("User interaction tracked:", {
    action,
    details,
    listingId: getListingIdFromUrl(),
    timestamp: new Date().toISOString(),
  })
}

// Initialize tracking
document.addEventListener("DOMContentLoaded", () => {
  trackPageView()

  // Track interactions
  document.addEventListener("click", (e) => {
    if (e.target.matches(".btn-contact-seller")) {
      trackUserInteraction("contact_seller_clicked", { method: "modal" })
    } else if (e.target.matches(".btn-submit-inquiry")) {
      trackUserInteraction("inquiry_submitted", { form: "sidebar_inquiry" })
    } else if (e.target.matches(".btn-favorite")) {
      trackUserInteraction("favorite_toggled", { favorited: isFavorited })
    }
  })
})

console.log("🚀 Listing detail page initialized successfully!")
console.log("📊 Features: Image gallery, Seller info, Inquiry form, Related listings")
console.log("📱 Mobile ads will show every 5 minutes")
console.log("💾 Favorites and views are tracked locally")
