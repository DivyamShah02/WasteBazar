// Listing Detail Page JavaScript

// Import necessary libraries
const AOS = window.AOS
const bootstrap = window.bootstrap

// Sample related listings data
const relatedListings = [
  {
    id: 2,
    title: "Industrial Steel Scrap",
    category: "metal",
    location: "delhi",
    price: 42000,
    quantity: 50,
    grade: "Industrial Grade",
    badge: "Verified",
    postedDate: "1 day ago",
    icon: "fas fa-cog",
  },
  {
    id: 3,
    title: "Mixed Paper Waste",
    category: "paper",
    location: "pune",
    price: 18000,
    quantity: 200,
    grade: "Office Paper",
    badge: "Verified",
    postedDate: "1 day ago",
    icon: "fas fa-newspaper",
  },
  {
    id: 4,
    title: "Aluminum Scrap Sheets",
    category: "metal",
    location: "chennai",
    price: 125000,
    quantity: 30,
    grade: "Commercial Grade",
    badge: "Premium",
    postedDate: "5 hours ago",
    icon: "fas fa-coins",
  },
]

// Advertisement data (same as listings page)
const advertisements = [
  {
    id: "topAd",
    title: "Premium Scrap Processing Equipment",
    description: "Increase your efficiency with our industrial-grade machinery",
    image: "/placeholder.svg?height=120&width=728",
    type: "top",
  },
  {
    id: "leftAd1",
    title: "Waste Management Solutions",
    description: "Complete recycling services",
    image: "/placeholder.svg?height=250&width=160",
    type: "sidebar",
  },
  {
    id: "leftAd2",
    title: "Scrap Transportation",
    description: "Nationwide pickup & delivery",
    image: "/placeholder.svg?height=250&width=160",
    type: "sidebar",
  },
  {
    id: "rightAd1",
    title: "Quality Testing Services",
    description: "Certified material analysis",
    image: "/placeholder.svg?height=250&width=160",
    type: "sidebar",
  },
  {
    id: "rightAd2",
    title: "Insurance Coverage",
    description: "Protect your scrap investments",
    image: "/placeholder.svg?height=250&width=160",
    type: "sidebar",
  },
]

// Global variables
let isFavorited = false
const currentImageIndex = 0

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  initializePage()
  setupEventListeners()
  loadRelatedListings()
  initializeMobileAds()

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
  const favorites = JSON.parse(localStorage.getItem("favorites") || "[]")
  isFavorited = favorites.includes(listingId)
  updateFavoriteButton()

  // Update page views
  updatePageViews(listingId)
}

function setupEventListeners() {
  // Favorite button
  document.getElementById("favoriteBtn").addEventListener("click", toggleFavorite)

  // Share button
  document.getElementById("shareBtn").addEventListener("click", shareListing)

  // Report button
  document.getElementById("reportBtn").addEventListener("click", reportListing)

  // Inquiry form
  document.getElementById("inquiryForm").addEventListener("submit", submitInquiry)

  // Contact seller button
  document.querySelector(".btn-contact-seller").addEventListener("click", openContactModal)
}

function getListingIdFromUrl() {
  // In a real application, this would extract the ID from the URL
  // For demo purposes, we'll use a fixed ID
  return "1"
}

function updatePageViews(listingId) {
  // Simulate updating page views
  const viewKey = `listing_${listingId}_views`
  let views = Number.parseInt(localStorage.getItem(viewKey) || "1247")
  views += 1
  localStorage.setItem(viewKey, views.toString())

  // Update the display (optional - in real app this would be server-side)
  const viewElement = document.querySelector(".meta-item .fas.fa-eye").parentElement
  if (viewElement) {
    viewElement.innerHTML = `<i class="fas fa-eye"></i><span>${views.toLocaleString()} views</span>`
  }
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

function openContactModal() {
  const modal = new bootstrap.Modal(document.getElementById("contactModal"))
  modal.show()
}

function changeMainImage(thumbnail, imageSrc) {
  // Remove active class from all thumbnails
  document.querySelectorAll(".thumbnail").forEach((thumb) => thumb.classList.remove("active"))

  // Add active class to clicked thumbnail
  thumbnail.classList.add("active")

  // Change main image
  document.getElementById("mainImage").src = imageSrc
}

function openImageModal() {
  const mainImage = document.getElementById("mainImage")
  const modalImage = document.getElementById("modalImage")
  modalImage.src = mainImage.src

  const modal = new bootstrap.Modal(document.getElementById("imageModal"))
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
