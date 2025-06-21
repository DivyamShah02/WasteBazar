// Listings Page JavaScript

// Import necessary libraries
const AOS = window.AOS // Declare AOS variable
const bootstrap = window.bootstrap // Declare bootstrap variable

// Sample listings data
const sampleListings = [
  {
    id: 1,
    title: "High-Grade PET Bottle Bales",
    category: "plastic",
    location: "mumbai",
    price: 35000,
    quantity: 25,
    grade: "Food Grade",
    availability: "Pickup Available",
    badge: "Premium",
    postedDate: "2 days ago",
    icon: "fas fa-recycle",
  },
  {
    id: 2,
    title: "Industrial Steel Scrap",
    category: "metal",
    location: "delhi",
    price: 42000,
    quantity: 50,
    grade: "Industrial Grade",
    availability: "Immediate",
    badge: "Verified",
    postedDate: "1 day ago",
    icon: "fas fa-cog",
  },
  {
    id: 3,
    title: "E-Waste Components",
    category: "electronic",
    location: "bangalore",
    price: 85000,
    quantity: 10,
    grade: "Mixed Components",
    availability: "Recyclable",
    badge: "Hot Deal",
    postedDate: "3 hours ago",
    icon: "fas fa-laptop",
  },
  {
    id: 4,
    title: "Aluminum Scrap Sheets",
    category: "metal",
    location: "chennai",
    price: 125000,
    quantity: 30,
    grade: "Commercial Grade",
    availability: "Transport Available",
    badge: "Premium",
    postedDate: "5 hours ago",
    icon: "fas fa-coins",
  },
  {
    id: 5,
    title: "Mixed Paper Waste",
    category: "paper",
    location: "pune",
    price: 18000,
    quantity: 200,
    grade: "Office Paper",
    availability: "Bulk Available",
    badge: "Verified",
    postedDate: "1 day ago",
    icon: "fas fa-newspaper",
  },
  {
    id: 6,
    title: "Copper Wire Scrap",
    category: "metal",
    location: "hyderabad",
    price: 650000,
    quantity: 5,
    grade: "99% Pure",
    availability: "Immediate",
    badge: "Premium",
    postedDate: "4 hours ago",
    icon: "fas fa-bolt",
  },
]

// Advertisement data
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
let currentListings = [...sampleListings]
let currentPage = 1
const itemsPerPage = 20
let currentView = "grid"
let filters = {
  search: "",
  category: "",
  location: "",
  priceRange: "",
  minQuantity: "",
  maxQuantity: "",
  sort: "newest",
}

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  initializePage()
  setupEventListeners()
  loadListings()
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

  // Parse URL parameters
  const urlParams = new URLSearchParams(window.location.search)
  if (urlParams.get("category")) {
    filters.category = urlParams.get("category")
    document.getElementById("categoryFilter").value = filters.category
  }
  if (urlParams.get("search")) {
    filters.search = urlParams.get("search")
    document.getElementById("searchInput").value = filters.search
  }
}

function setupEventListeners() {
  // Search functionality
  document.getElementById("searchBtn").addEventListener("click", performSearch)
  document.getElementById("searchInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      performSearch()
    }
  })

  // Filter changes
  document.getElementById("categoryFilter").addEventListener("change", updateFilters)
  document.getElementById("locationFilter").addEventListener("change", updateFilters)
  document.getElementById("priceFilter").addEventListener("change", updateFilters)
  document.getElementById("minQuantity").addEventListener("input", updateFilters)
  document.getElementById("maxQuantity").addEventListener("input", updateFilters)
  document.getElementById("sortFilter").addEventListener("change", updateFilters)

  // Clear filters
  document.getElementById("clearFilters").addEventListener("click", clearAllFilters)

  // View toggle
  document.getElementById("gridView").addEventListener("click", () => setView("grid"))
  document.getElementById("listView").addEventListener("click", () => setView("list"))

  // Category dropdown navigation
  document.querySelectorAll("[data-category]").forEach((item) => {
    item.addEventListener("click", function (e) {
      e.preventDefault()
      const category = this.dataset.category
      filters.category = category
      document.getElementById("categoryFilter").value = category
      updateFilters()
    })
  })
}

function performSearch() {
  const searchTerm = document.getElementById("searchInput").value.trim()
  filters.search = searchTerm
  updateFilters()
}

function updateFilters() {
  // Update filter object
  filters.search = document.getElementById("searchInput").value.trim()
  filters.category = document.getElementById("categoryFilter").value
  filters.location = document.getElementById("locationFilter").value
  filters.priceRange = document.getElementById("priceFilter").value
  filters.minQuantity = document.getElementById("minQuantity").value
  filters.maxQuantity = document.getElementById("maxQuantity").value
  filters.sort = document.getElementById("sortFilter").value

  // Apply filters and reload listings
  applyFilters()
  loadListings()
}

function applyFilters() {
  let filteredListings = [...sampleListings]

  // Search filter
  if (filters.search) {
    filteredListings = filteredListings.filter(
      (listing) =>
        listing.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        listing.grade.toLowerCase().includes(filters.search.toLowerCase()),
    )
  }

  // Category filter
  if (filters.category) {
    filteredListings = filteredListings.filter((listing) => listing.category === filters.category)
  }

  // Location filter
  if (filters.location) {
    filteredListings = filteredListings.filter((listing) => listing.location === filters.location)
  }

  // Price range filter
  if (filters.priceRange) {
    const [min, max] = filters.priceRange.split("-").map(Number)
    filteredListings = filteredListings.filter((listing) => {
      if (max) {
        return listing.price >= min && listing.price <= max
      } else {
        return listing.price >= min
      }
    })
  }

  // Quantity filters
  if (filters.minQuantity) {
    filteredListings = filteredListings.filter((listing) => listing.quantity >= Number.parseInt(filters.minQuantity))
  }
  if (filters.maxQuantity) {
    filteredListings = filteredListings.filter((listing) => listing.quantity <= Number.parseInt(filters.maxQuantity))
  }

  // Sort listings
  filteredListings.sort((a, b) => {
    switch (filters.sort) {
      case "price-low":
        return a.price - b.price
      case "price-high":
        return b.price - a.price
      case "quantity-low":
        return a.quantity - b.quantity
      case "quantity-high":
        return b.quantity - a.quantity
      case "oldest":
        return a.id - b.id
      default: // newest
        return b.id - a.id
    }
  })

  currentListings = filteredListings
  currentPage = 1
}

function clearAllFilters() {
  // Reset all filter inputs
  document.getElementById("searchInput").value = ""
  document.getElementById("categoryFilter").value = ""
  document.getElementById("locationFilter").value = ""
  document.getElementById("priceFilter").value = ""
  document.getElementById("minQuantity").value = ""
  document.getElementById("maxQuantity").value = ""
  document.getElementById("sortFilter").value = "newest"

  // Reset filter object
  filters = {
    search: "",
    category: "",
    location: "",
    priceRange: "",
    minQuantity: "",
    maxQuantity: "",
    sort: "newest",
  }

  // Reload all listings
  currentListings = [...sampleListings]
  currentPage = 1
  loadListings()
}

function setView(viewType) {
  currentView = viewType

  // Update view buttons
  document.querySelectorAll(".view-btn").forEach((btn) => btn.classList.remove("active"))
  document.getElementById(viewType + "View").classList.add("active")

  // Update listings container
  const container = document.getElementById("listingsContainer")
  if (viewType === "list") {
    container.classList.add("list-view")
  } else {
    container.classList.remove("list-view")
  }
}

function loadListings() {
  const container = document.getElementById("listingsContainer")
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const pageListings = currentListings.slice(startIndex, endIndex)

  // Show loading state
  container.innerHTML = createLoadingSkeletons()

  // Simulate loading delay
  setTimeout(() => {
    if (pageListings.length === 0) {
      container.innerHTML = createNoResultsMessage()
    } else {
      container.innerHTML = pageListings.map((listing) => createListingCard(listing)).join("")
    }

    updateResultsInfo()
    updatePagination()

    // Add click handlers to listing cards
    document.querySelectorAll(".listing-card").forEach((card) => {
      card.addEventListener("click", function () {
        const listingId = this.dataset.listingId
        viewListingDetails(listingId)
      })
    })
  }, 500)
}

function createListingCard(listing) {
  const locationNames = {
    mumbai: "Mumbai, MH",
    delhi: "Delhi, NCR",
    bangalore: "Bangalore, KA",
    chennai: "Chennai, TN",
    pune: "Pune, MH",
    hyderabad: "Hyderabad, TS",
  }

  return `
        <div class="listing-card" data-listing-id="${listing.id}" data-aos="fade-up">
            <div class="listing-image">
                <i class="${listing.icon}"></i>
                <div class="listing-badge">${listing.badge}</div>
            </div>
            <div class="listing-content">
                <h3 class="listing-title">${listing.title}</h3>
                <div class="listing-details">
                    <div class="detail-item">
                        <div class="detail-icon">
                            <i class="fas fa-weight-hanging"></i>
                        </div>
                        <div class="detail-text">${listing.quantity} Tons Available</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-icon">
                            <i class="fas fa-map-marker-alt"></i>
                        </div>
                        <div class="detail-text">${locationNames[listing.location] || listing.location}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-icon">
                            <i class="fas fa-certificate"></i>
                        </div>
                        <div class="detail-text">${listing.grade}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-icon">
                            <i class="fas fa-truck"></i>
                        </div>
                        <div class="detail-text">${listing.availability}</div>
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

function createLoadingSkeletons() {
  const skeletons = []
  for (let i = 0; i < 6; i++) {
    skeletons.push(`
            <div class="listing-card loading">
                <div class="listing-image loading-skeleton"></div>
                <div class="listing-content">
                    <div class="listing-title loading-skeleton" style="height: 24px; margin-bottom: 1rem;"></div>
                    <div class="listing-details">
                        <div class="detail-item">
                            <div class="detail-icon loading-skeleton"></div>
                            <div class="detail-text loading-skeleton" style="height: 16px; width: 80px;"></div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-icon loading-skeleton"></div>
                            <div class="detail-text loading-skeleton" style="height: 16px; width: 100px;"></div>
                        </div>
                    </div>
                    <div class="listing-price loading-skeleton" style="height: 28px; width: 120px; margin-bottom: 1rem;"></div>
                </div>
            </div>
        `)
  }
  return skeletons.join("")
}

function createNoResultsMessage() {
  return `
        <div class="no-results" style="text-align: center; padding: 4rem 2rem; grid-column: 1 / -1;">
            <i class="fas fa-search" style="font-size: 4rem; color: var(--text-muted); margin-bottom: 2rem;"></i>
            <h3 style="color: var(--text-dark); margin-bottom: 1rem;">No listings found</h3>
            <p style="color: var(--text-light); margin-bottom: 2rem;">Try adjusting your filters or search terms to find what you're looking for.</p>
            <button class="btn btn-primary" onclick="clearAllFilters()">Clear All Filters</button>
        </div>
    `
}

function updateResultsInfo() {
  const total = currentListings.length
  const startIndex = (currentPage - 1) * itemsPerPage + 1
  const endIndex = Math.min(currentPage * itemsPerPage, total)

  document.getElementById("resultsCount").textContent = `Showing ${startIndex}-${endIndex} of ${total} listings`

  const categoryText = filters.category
    ? filters.category.charAt(0).toUpperCase() + filters.category.slice(1) + " "
    : ""
  document.getElementById("resultsDescription").textContent = `${categoryText}scrap materials from verified sellers`
}

function updatePagination() {
  const totalPages = Math.ceil(currentListings.length / itemsPerPage)
  const pagination = document.getElementById("pagination")

  if (totalPages <= 1) {
    pagination.innerHTML = ""
    return
  }

  let paginationHTML = ""

  // Previous button
  paginationHTML += `
        <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1}); return false;">
                <i class="fas fa-chevron-left"></i>
            </a>
        </li>
    `

  // Page numbers
  const startPage = Math.max(1, currentPage - 2)
  const endPage = Math.min(totalPages, currentPage + 2)

  if (startPage > 1) {
    paginationHTML += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="changePage(1); return false;">1</a>
            </li>
        `
    if (startPage > 2) {
      paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    paginationHTML += `
            <li class="page-item ${i === currentPage ? "active" : ""}">
                <a class="page-link" href="#" onclick="changePage(${i}); return false;">${i}</a>
            </li>
        `
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`
    }
    paginationHTML += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="changePage(${totalPages}); return false;">${totalPages}</a>
            </li>
        `
  }

  // Next button
  paginationHTML += `
        <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1}); return false;">
                <i class="fas fa-chevron-right"></i>
            </a>
        </li>
    `

  pagination.innerHTML = paginationHTML
}

function changePage(page) {
  if (page < 1 || page > Math.ceil(currentListings.length / itemsPerPage)) {
    return
  }

  currentPage = page
  loadListings()

  // Scroll to top of listings
  document.querySelector(".results-header").scrollIntoView({
    behavior: "smooth",
    block: "start",
  })
}

function viewListingDetails(listingId) {
  console.log("Viewing details for listing:", listingId)
  // In a real application, this would navigate to a detailed listing page
  alert(`Viewing details for listing ${listingId}. This would navigate to a detailed page.`)
}

// Advertisement Management
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

// Mobile Advertisement System
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

// Add debounced search
document.getElementById("searchInput").addEventListener(
  "input",
  debounce(function () {
    if (this.value.length >= 3 || this.value.length === 0) {
      performSearch()
    }
  }, 500),
)

console.log("🚀 Listings page initialized successfully!")
console.log("📊 Features: Advanced filtering, Search, Pagination, Mobile ads")
console.log("📱 Mobile ads will show every 5 minutes")
