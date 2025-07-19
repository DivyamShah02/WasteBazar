// /**
//  * WasteBazar Buyer Profile Management System
//  * 
//  * This script handles the buyer profile page functionality including:
//  * - Profile data management
//  * - Requirements CRUD operations
//  * - Purchase history display
//  * - Real-time data updates
//  * - API integration with Django backend
//  * 
//  * API Endpoints Integration:
//  * - GET /user-api/user-details-api/ - User profile data
//  * - GET /market-api/buyer-requirements/ - List buyer requirements
//  * - POST /market-api/buyer-requirements/ - Create new requirement
//  * - PUT /market-api/buyer-requirements/{id}/ - Update requirement
//  * - PATCH /market-api/buyer-requirements/{id}/ - Mark as fulfilled
//  * - DELETE /market-api/buyer-requirements/{id}/ - Delete requirement
//  * - GET /market-api/all-listings/ - Search available listings
//  * 
//  * Structure follows login_script.js pattern:
//  * - Global variables for API endpoints and tokens
//  * - Initialization function called from HTML
//  * - Async API calls with proper error handling
//  * - UI update functions
//  * - Event handlers and user interactions
//  * 
//  * @author WasteBazar Development Team
//  * @version 2.0
//  * @requires api_caller.js
//  */

// // Buyer Profile Script for WasteBazar
// let currentTab = "requirements"
// let profileData = {}
// let requirementsData = []
// let purchaseHistoryData = []

// // Global variables for API endpoints and CSRF token
// let csrf_token = null
// let profile_api_url = null
// let requirements_api_url = null
// // let purchases_api_url= null

// // API URLs - to be set from Django
// let API_URLS = {
//     buyer_requirements: '/market-api/buyer-requirements/',
//     all_listings: '/market-api/all-listings/',
//     user_profile: '/user-api/user-details-api/',
//     otp_auth: '/user-api/otp-api/'
// }

// async function BuyerProfileApp(
//     csrf_token_param,
//     profile_api_url_param,
//     requirements_api_url_param,
//     purchases_api_url_param,
// ) {
//     csrf_token = csrf_token_param
//     profile_api_url = profile_api_url_param
//     requirements_api_url = requirements_api_url_param
//     purchases_api_url = purchases_api_url_param

//     console.log("🚀 Initializing WasteBazar Buyer Profile")
//     initializeProfile()
// }

// function initializeProfile() {
//     // Setup tab navigation
//     setupTabNavigation()

//     // Setup navbar scroll effect
//     setupNavbarScroll()

//     // Load profile data
//     loadProfileData()

//     // Load requirements
//     loadRequirements()

//     // Load recent activity
//     loadRecentActivity()

//     console.log("✅ Buyer Profile initialized successfully")
// }

// function getCsrfToken() {
//     return csrf_token
// }

// // Setup Functions
// function setupTabNavigation() {
//     const tabButtons = document.querySelectorAll(".tab-button")
//     const tabContents = document.querySelectorAll(".tab-content")

//     tabButtons.forEach((button) => {
//         button.addEventListener("click", function () {
//             const tabName = this.dataset.tab

//             // Remove active class from all buttons and contents
//             tabButtons.forEach((btn) => btn.classList.remove("active"))
//             tabContents.forEach((content) => content.classList.remove("active"))

//             // Add active class to clicked button and corresponding content
//             this.classList.add("active")
//             document.getElementById(`${tabName}-tab`).classList.add("active")

//             currentTab = tabName

//             // Load data for the selected tab
//             if (tabName === "requirements") {
//                 loadRequirements()
//             } else if (tabName === "history") {
//                 loadPurchaseHistory()
//             }

//             console.log("Switched to tab:", tabName)
//         })
//     })
// }

// function setupNavbarScroll() {
//     window.addEventListener("scroll", () => {
//         const navbar = document.getElementById("navbar")
//         if (window.scrollY > 50) {
//             navbar.classList.add("scrolled")
//         } else {
//             navbar.classList.remove("scrolled")
//         }
//     })
// }

// // Data Loading Functions
// async function loadProfileData() {
//     try {
//         console.log("📊 Loading profile data...")

//         // Call user profile API
//         const [success, result] = await callApi("GET", profile_api_url, null, getCsrfToken())

//         if (success && result.success) {
//             const userData = result.data

//             profileData = {
//                 name: userData.name || "User Name",
//                 email: userData.email || "No email provided",
//                 phone: userData.contact_number || "No phone provided",
//                 address: userData.address || "No address provided",
//                 location: `${userData.city || "Unknown"}, ${userData.state || "Unknown"}`,
//                 memberSince: userData.created_at ? new Date(userData.created_at).toLocaleDateString() : "Unknown",
//                 rating: 4.8, // This would come from a separate rating API
//                 reviews: 127, // This would come from a separate reviews API
//                 totalRequirements: 0, // Will be calculated from requirements
//                 activeRequirements: 0, // Will be calculated from requirements
//                 completedDeals: 0, // Will be calculated from purchase history
//                 totalSpent: "₹0", // Will be calculated from purchase history
//             }

//             updateProfileUI()
//         } else {
//             console.error("❌ Failed to load profile data:", result.error || "Unknown error")
//             showError("Failed to load profile data")

//             // Fallback to demo data
//             profileData = {
//                 name: "Rajesh Kumar",
//                 email: "rajesh@company.com",
//                 phone: "+91 98765 43210",
//                 address: "Andheri East, Mumbai, MH",
//                 location: "Mumbai, Maharashtra",
//                 memberSince: "March 2023",
//                 rating: 4.8,
//                 reviews: 127,
//                 totalRequirements: 24,
//                 activeRequirements: 8,
//                 completedDeals: 16,
//                 totalSpent: "₹12.5L",
//             }
//             updateProfileUI()
//         }
//     } catch (error) {
//         console.error("❌ Error loading profile data:", error)
//         showError("Failed to load profile data")
//     }
// }

// async function loadRequirements() {
//     try {
//         console.log("📋 Loading requirements...")
//         showLoadingState("requirementsList")

//         // Call buyer requirements API
//         const [success, result] = await callApi("GET", API_URLS.buyer_requirements, null, getCsrfToken())

//         if (success && result.success) {
//             requirementsData = result.data.map(req => ({
//                 id: req.requirement_id,
//                 title: `${req.quantity} ${req.unit} ${req.subcategory}`,
//                 category: req.category,
//                 subcategory: req.subcategory,
//                 quantity: `${req.quantity} ${req.unit}`,
//                 location: `${req.city_location}, ${req.state_location}`,
//                 budget: "Contact for pricing", // Budget might not be in the API
//                 status: req.status,
//                 responses: 0, // This would come from a separate API
//                 postedDate: formatDate(req.created_at),
//                 description: req.description || "No description provided",
//                 validUntil: req.valid_until ? formatDate(req.valid_until) : null,
//                 revivedAt: req.revived_at ? formatDate(req.revived_at) : null
//             }))

//             // Update profile stats
//             updateProfileStats()

//             setTimeout(() => {
//                 renderRequirements()
//             }, 500)
//         } else {
//             console.error("❌ Failed to load requirements:", result.error || "Unknown error")

//             // Fallback to demo data
//             requirementsData = [
//                 {
//                     id: 1,
//                     title: "Need 100 Tons Aluminum Scrap",
//                     category: "Metal Scrap",
//                     quantity: "100 Tons",
//                     location: "Mumbai, MH",
//                     budget: "₹120,000/Ton",
//                     status: "active",
//                     responses: 12,
//                     postedDate: "2 days ago",
//                     description: "Looking for high-grade aluminum scrap for manufacturing purposes.",
//                 },
//                 {
//                     id: 2,
//                     title: "Bulk Paper Waste Required",
//                     category: "Paper Waste",
//                     quantity: "200 Tons",
//                     location: "Mumbai, MH",
//                     budget: "₹18,000/Ton",
//                     status: "inactive",
//                     responses: 5,
//                     postedDate: "1 week ago",
//                     description: "Need mixed paper waste for recycling plant.",
//                 },
//                 {
//                     id: 3,
//                     title: "E-Waste Components Purchase",
//                     category: "Electronic Waste",
//                     quantity: "50 Tons",
//                     location: "Mumbai, MH",
//                     budget: "₹80,000/Ton",
//                     status: "requirementfulfilled",
//                     responses: 8,
//                     postedDate: "2 weeks ago",
//                     description: "Purchased computer scrap for precious metal recovery.",
//                 },
//             ]

//             setTimeout(() => {
//                 renderRequirements()
//             }, 500)
//         }
//     } catch (error) {
//         console.error("❌ Error loading requirements:", error)
//         showError("Failed to load requirements")
//     }
// }

// async function loadPurchaseHistory() {
//     try {
//         console.log("🛒 Loading purchase history...")
//         showLoadingState("purchaseHistory")

//         // For now, we'll use demo data since there's no specific purchase history API
//         // In a real implementation, this would call a purchase/order history API
//         setTimeout(() => {
//             purchaseHistoryData = [
//                 {
//                     id: 1,
//                     title: "High-Grade PET Bottle Bales",
//                     seller: "Mumbai Recyclers Pvt Ltd",
//                     quantity: "25 Tons",
//                     price: "₹35,000/Ton",
//                     totalAmount: "₹8,75,000",
//                     date: "15 Dec 2024",
//                     status: "completed",
//                     rating: 5,
//                 },
//                 {
//                     id: 2,
//                     title: "Industrial Steel Scrap",
//                     seller: "Delhi Steel Works",
//                     quantity: "50 Tons",
//                     price: "₹42,000/Ton",
//                     totalAmount: "₹21,00,000",
//                     date: "10 Dec 2024",
//                     status: "completed",
//                     rating: 4,
//                 },
//                 {
//                     id: 3,
//                     title: "Copper Wire Scrap",
//                     seller: "Chennai Metals Ltd",
//                     quantity: "5 Tons",
//                     price: "₹650,000/Ton",
//                     totalAmount: "₹32,50,000",
//                     date: "5 Dec 2024",
//                     status: "completed",
//                     rating: 5,
//                 },
//             ]

//             renderPurchaseHistory()
//         }, 1000)
//     } catch (error) {
//         console.error("❌ Error loading purchase history:", error)
//         showError("Failed to load purchase history")
//     }
// }

// async function loadRecentActivity() {
//     try {
//         console.log("⚡ Loading recent activity...")

//         const activities = [
//             {
//                 icon: "fas fa-plus",
//                 text: "Posted new requirement for Aluminum Scrap",
//                 time: "2 hours ago",
//             },
//             {
//                 icon: "fas fa-envelope",
//                 text: "Received 3 new responses for Paper Waste requirement",
//                 time: "5 hours ago",
//             },
//             {
//                 icon: "fas fa-handshake",
//                 text: "Completed purchase of PET Bottle Bales",
//                 time: "1 day ago",
//             },
//             {
//                 icon: "fas fa-star",
//                 text: "Received 5-star rating from Mumbai Recyclers",
//                 time: "2 days ago",
//             },
//             {
//                 icon: "fas fa-edit",
//                 text: "Updated profile information",
//                 time: "1 week ago",
//             },
//         ]

//         renderRecentActivity(activities)
//     } catch (error) {
//         console.error("❌ Error loading recent activity:", error)
//     }
// }

// // UI Rendering Functions
// function updateProfileUI() {
//     // Update profile information
//     document.getElementById("profileName").textContent = profileData.name
//     document.getElementById("profileLocation").textContent = profileData.location
//     document.getElementById("profilePhone").textContent = profileData.phone
//     document.getElementById("profileEmail").textContent = profileData.email
//     document.getElementById("profileAddress").textContent = profileData.address

//     // Update statistics
//     updateProfileStats()
// }

// function updateProfileStats() {
//     // Calculate stats from requirements data
//     const totalRequirements = requirementsData.length
//     const activeRequirements = requirementsData.filter(r => r.status === 'active').length
//     const fulfilledRequirements = requirementsData.filter(r => r.status === 'requirementfulfilled').length

//     // Update the stats
//     profileData.totalRequirements = totalRequirements
//     profileData.activeRequirements = activeRequirements
//     profileData.completedDeals = fulfilledRequirements

//     // Update DOM elements
//     document.getElementById("totalRequirements").textContent = totalRequirements
//     document.getElementById("activeRequirements").textContent = activeRequirements
//     document.getElementById("completedDeals").textContent = fulfilledRequirements

//     // Calculate total spent from purchase history
//     const totalSpent = purchaseHistoryData.reduce((sum, purchase) => {
//         const amount = parseInt(purchase.totalAmount.replace(/[₹,]/g, ''))
//         return sum + amount
//     }, 0)

//     const formattedSpent = totalSpent > 0 ? `₹${(totalSpent / 100000).toFixed(1)}L` : "₹0"
//     document.getElementById("totalSpent").textContent = formattedSpent
// }

// function renderRequirements() {
//     const container = document.getElementById("requirementsList")

//     if (requirementsData.length === 0) {
//         container.innerHTML = createEmptyState("requirements")
//         return
//     }

//     const requirementsHTML = requirementsData.map((requirement) => createRequirementCard(requirement)).join("")
//     container.innerHTML = requirementsHTML

//     // Add event listeners
//     setupRequirementActions()
// }

// function renderPurchaseHistory() {
//     const container = document.getElementById("purchaseHistory")

//     if (purchaseHistoryData.length === 0) {
//         container.innerHTML = createEmptyState("history")
//         return
//     }

//     const historyHTML = purchaseHistoryData.map((purchase) => createPurchaseCard(purchase)).join("")
//     container.innerHTML = historyHTML

//     // Add event listeners
//     setupPurchaseActions()
// }

// function renderRecentActivity(activities) {
//     const container = document.getElementById("recentActivity")

//     const activitiesHTML = activities
//         .map(
//             (activity) => `
//         <div class="activity-item">
//             <div class="activity-icon">
//                 <i class="${activity.icon}"></i>
//             </div>
//             <div class="activity-content">
//                 <div class="activity-text">${activity.text}</div>
//                 <div class="activity-time">${activity.time}</div>
//             </div>
//         </div>
//     `,
//         )
//         .join("")

//     container.innerHTML = activitiesHTML
// }

// // Card Creation Functions
// function createRequirementCard(requirement) {
//     const statusClass = getStatusClass(requirement.status)
//     const statusText = getStatusText(requirement.status)

//     return `
//         <div class="requirement-item" data-id="${requirement.id}">
//             <div class="requirement-header">
//                 <div>
//                     <h5 class="requirement-title">${requirement.title}</h5>
//                     <p class="text-muted mb-0">${requirement.description}</p>
//                 </div>
//                 <span class="requirement-status ${statusClass}">${statusText}</span>
//             </div>
//             <div class="requirement-details">
//                 <div class="detail-item">
//                     <div class="detail-icon">
//                         <i class="fas fa-weight-hanging"></i>
//                     </div>
//                     <span>${requirement.quantity}</span>
//                 </div>
//                 <div class="detail-item">
//                     <div class="detail-icon">
//                         <i class="fas fa-map-marker-alt"></i>
//                     </div>
//                     <span>${requirement.location}</span>
//                 </div>
//                 <div class="detail-item">
//                     <div class="detail-icon">
//                         <i class="fas fa-tags"></i>
//                     </div>
//                     <span>${requirement.category}</span>
//                 </div>
//                 <div class="detail-item">
//                     <div class="detail-icon">
//                         <i class="fas fa-envelope"></i>
//                     </div>
//                     <span>${requirement.responses} responses</span>
//                 </div>
//                 <div class="detail-item">
//                     <div class="detail-icon">
//                         <i class="fas fa-clock"></i>
//                     </div>
//                     <span>${requirement.postedDate}</span>
//                 </div>
//                 ${requirement.validUntil ? `
//                 <div class="detail-item">
//                     <div class="detail-icon">
//                         <i class="fas fa-calendar-times"></i>
//                     </div>
//                     <span>Valid until: ${requirement.validUntil}</span>
//                 </div>
//                 ` : ''}
//             </div>
//             <div class="requirement-actions">
//                 <button class="btn-action" onclick="viewRequirement(${requirement.id})">
//                     <i class="fas fa-eye me-1"></i>View Details
//                 </button>
//                 <button class="btn-action" onclick="viewResponses(${requirement.id})">
//                     <i class="fas fa-envelope me-1"></i>View Responses
//                 </button>
//                 ${requirement.status === "active"
//             ? `
//                     <button class="btn-action btn-secondary" onclick="editRequirement(${requirement.id})">
//                         <i class="fas fa-edit me-1"></i>Edit
//                     </button>
//                     <button class="btn-action" onclick="markRequirementFulfilled(${requirement.id})" style="background: #28a745;">
//                         <i class="fas fa-check me-1"></i>Mark Fulfilled
//                     </button>
//                 `
//             : requirement.status === "inactive"
//                 ? `
//                     <button class="btn-action btn-secondary" onclick="editRequirement(${requirement.id})">
//                         <i class="fas fa-edit me-1"></i>Edit
//                     </button>
//                     <button class="btn-action" onclick="reviveRequirement(${requirement.id})" style="background: #17a2b8;">
//                         <i class="fas fa-redo me-1"></i>Revive
//                     </button>
//                 `
//                 : ""
//         }
//                 <button class="btn-action" onclick="deleteRequirement(${requirement.id})" style="background: #dc3545;">
//                     <i class="fas fa-trash me-1"></i>Delete
//                 </button>
//             </div>
//         </div>
//     `
// }

// function createPurchaseCard(purchase) {
//     const stars = createStarRating(purchase.rating)

//     return `
//         <div class="requirement-item" data-id="${purchase.id}">
//             <div class="requirement-header">
//                 <div>
//                     <h5 class="requirement-title">${purchase.title}</h5>
//                     <p class="text-muted mb-0">Seller: ${purchase.seller}</p>
//                 </div>
//                 <span class="requirement-status status-completed">Completed</span>
//             </div>
//             <div class="requirement-details">
//                 <div class="detail-item">
//                     <div class="detail-icon">
//                         <i class="fas fa-weight-hanging"></i>
//                     </div>
//                     <span>${purchase.quantity}</span>
//                 </div>
//                 <div class="detail-item">
//                     <div class="detail-icon">
//                         <i class="fas fa-rupee-sign"></i>
//                     </div>
//                     <span>${purchase.price}</span>
//                 </div>
//                 <div class="detail-item">
//                     <div class="detail-icon">
//                         <i class="fas fa-calculator"></i>
//                     </div>
//                     <span>${purchase.totalAmount}</span>
//                 </div>
//                 <div class="detail-item">
//                     <div class="detail-icon">
//                         <i class="fas fa-calendar"></i>
//                     </div>
//                     <span>${purchase.date}</span>
//                 </div>
//                 <div class="detail-item">
//                     <div class="detail-icon">
//                         <i class="fas fa-star"></i>
//                     </div>
//                     <span>${stars}</span>
//                 </div>
//             </div>
//             <div class="requirement-actions">
//                 <button class="btn-action" onclick="viewPurchaseDetails(${purchase.id})">
//                     <i class="fas fa-eye me-1"></i>View Details
//                 </button>
//                 <button class="btn-action btn-secondary" onclick="downloadInvoice(${purchase.id})">
//                     <i class="fas fa-download me-1"></i>Download Invoice
//                 </button>
//             </div>
//         </div>
//     `
// }

// // Utility Functions
// function getStatusClass(status) {
//     switch (status) {
//         case "active":
//             return "status-active"
//         case "inactive":
//             return "status-pending"
//         case "requirementfulfilled":
//             return "status-completed"
//         default:
//             return "status-pending"
//     }
// }

// function getStatusText(status) {
//     switch (status) {
//         case "active":
//             return "Active"
//         case "inactive":
//             return "Inactive"
//         case "requirementfulfilled":
//             return "Fulfilled"
//         default:
//             return "Unknown"
//     }
// }

// function formatDate(dateString) {
//     if (!dateString) return "Unknown"

//     const date = new Date(dateString)
//     const now = new Date()
//     const diffTime = Math.abs(now - date)
//     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

//     if (diffDays === 1) return "1 day ago"
//     if (diffDays < 7) return `${diffDays} days ago`
//     if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`

//     return date.toLocaleDateString()
// }

// function createStarRating(rating) {
//     let stars = ""
//     for (let i = 1; i <= 5; i++) {
//         if (i <= rating) {
//             stars += '<i class="fas fa-star text-warning"></i>'
//         } else {
//             stars += '<i class="far fa-star text-muted"></i>'
//         }
//     }
//     return stars
// }

// function createEmptyState(type) {
//     const messages = {
//         requirements: {
//             icon: "fas fa-list-alt",
//             title: "No Requirements Posted",
//             message: "You haven't posted any requirements yet. Start by posting your first requirement.",
//         },
//         history: {
//             icon: "fas fa-shopping-cart",
//             title: "No Purchase History",
//             message: "You haven't made any purchases yet. Browse listings to find materials you need.",
//         },
//     }

//     const config = messages[type]

//     return `
//         <div class="empty-state">
//             <div class="empty-icon">
//                 <i class="${config.icon}"></i>
//             </div>
//             <h4>${config.title}</h4>
//             <p>${config.message}</p>
//         </div>
//     `
// }

// function showLoadingState(containerId) {
//     const container = document.getElementById(containerId)
//     if (container) {
//         container.innerHTML = `
//         <div class="text-center py-5">
//             <div class="loading mb-3"></div>
//             <p class="text-muted">Loading...</p>
//         </div>
//     `
//     }
// }

// function showError(message) {
//     console.error("Error:", message)
//     // In a real implementation, you would show a proper toast notification
//     // For now, using alert as fallback
//     alert("Error: " + message)
// }

// function showSuccess(message) {
//     console.log("Success:", message)
//     // In a real implementation, you would show a proper toast notification
//     // For now, using alert as fallback
//     alert("Success: " + message)
// }

// function showWarning(message) {
//     console.warn("Warning:", message)
//     // In a real implementation, you would show a proper toast notification
//     alert("Warning: " + message)
// }

// // Event Handlers
// function setupRequirementActions() {
//     // Event listeners are set up in the HTML onclick attributes
//     console.log("✅ Requirement actions set up")
// }

// function setupPurchaseActions() {
//     // Event listeners are set up in the HTML onclick attributes
//     console.log("✅ Purchase actions set up")
// }

// // Action Functions
// async function postNewRequirement() {
//     console.log("📝 Post new requirement clicked")

//     // In a real implementation, this would open a modal or redirect to a form
//     // For now, we'll simulate the API call structure

//     showSuccess("Opening requirement posting form...")

//     // Example of how to post a new requirement
//     /*
//     const requirementData = {
//       category: "Metal Scrap",
//       subcategory: "Aluminum",
//       quantity: 100,
//       unit: "Tons",
//       description: "High-grade aluminum scrap needed",
//       city_location: "Mumbai",
//       state_location: "Maharashtra",
//       pincode_location: "400001",
//       address: "Industrial Area, Mumbai"
//     }
    
//     const [success, result] = await callApi("POST", API_URLS.buyer_requirements, requirementData, getCsrfToken())
    
//     if (success && result.success) {
//       showSuccess("Requirement posted successfully!")
//       await loadRequirements() // Reload requirements
//     } else {
//       showError("Failed to post requirement: " + (result.error || "Unknown error"))
//     }
//     */
// }

// async function viewRequirement(id) {
//     console.log("👁️ View requirement:", id)
//     const requirement = requirementsData.find((r) => r.id === id)
//     if (requirement) {
//         showSuccess(`Viewing requirement: ${requirement.title}`)
//         // In real implementation, open requirement details modal or page
//         // This could also fetch additional details from the API
//     }
// }

// async function viewResponses(id) {
//     console.log("📧 View responses for requirement:", id)
//     const requirement = requirementsData.find((r) => r.id === id)
//     if (requirement) {
//         showSuccess(`Viewing ${requirement.responses} responses for: ${requirement.title}`)
//         // In real implementation, this would call an API to get responses/quotes
//         // from sellers for this requirement
//     }
// }

// async function editRequirement(id) {
//     console.log("✏️ Edit requirement:", id)
//     const requirement = requirementsData.find((r) => r.id === id)
//     if (requirement) {
//         showSuccess(`Editing requirement: ${requirement.title}`)

//         // In real implementation, this would open an edit form and then:
//         /*
//         const updatedData = {
//           category: requirement.category,
//           subcategory: requirement.subcategory,
//           quantity: requirement.quantity,
//           unit: requirement.unit,
//           description: requirement.description,
//           // ... other fields
//         }
        
//         const [success, result] = await callApi("PUT", `${API_URLS.buyer_requirements}${id}/`, updatedData, getCsrfToken())
        
//         if (success && result.success) {
//           showSuccess("Requirement updated successfully!")
//           await loadRequirements() // Reload requirements
//         } else {
//           showError("Failed to update requirement: " + (result.error || "Unknown error"))
//         }
//         */
//     }
// }

// async function deleteRequirement(id) {
//     console.log("🗑️ Delete requirement:", id)
//     const requirement = requirementsData.find((r) => r.id === id)
//     if (requirement) {
//         const confirmDelete = confirm(`Are you sure you want to delete "${requirement.title}"?`)
//         if (confirmDelete) {
//             // In real implementation, this would call the delete API
//             /*
//             const [success, result] = await callApi("DELETE", `${API_URLS.buyer_requirements}${id}/`, null, getCsrfToken())
            
//             if (success && result.success) {
//               showSuccess("Requirement deleted successfully!")
//               await loadRequirements() // Reload requirements
//             } else {
//               showError("Failed to delete requirement: " + (result.error || "Unknown error"))
//             }
//             */
//             showSuccess(`Requirement "${requirement.title}" deleted successfully!`)
//         }
//     }
// }

// async function markRequirementFulfilled(id) {
//     console.log("✅ Mark requirement as fulfilled:", id)
//     const requirement = requirementsData.find((r) => r.id === id)
//     if (requirement) {
//         const [success, result] = await callApi("PATCH", `${API_URLS.buyer_requirements}${id}/`,
//             { status: "requirementfulfilled" }, getCsrfToken())

//         if (success && result.success) {
//             showSuccess("Requirement marked as fulfilled!")
//             await loadRequirements() // Reload requirements
//         } else {
//             showError("Failed to mark requirement as fulfilled: " + (result.error || "Unknown error"))
//         }
//     }
// }

// async function reviveRequirement(id) {
//     console.log("🔄 Revive requirement:", id)
//     const requirement = requirementsData.find((r) => r.id === id)
//     if (requirement) {
//         // Update the requirement to make it active again
//         const updatedData = {
//             status: "active"
//         }

//         const [success, result] = await callApi("PUT", `${API_URLS.buyer_requirements}${id}/`, updatedData, getCsrfToken())

//         if (success && result.success) {
//             showSuccess("Requirement revived successfully!")
//             await loadRequirements() // Reload requirements
//         } else {
//             showError("Failed to revive requirement: " + (result.error || "Unknown error"))
//         }
//     }
// }

// function viewPurchaseDetails(id) {
//     console.log("👁️ View purchase details:", id)
//     const purchase = purchaseHistoryData.find((p) => p.id === id)
//     if (purchase) {
//         showSuccess(`Viewing purchase: ${purchase.title}`)
//         // In real implementation, open purchase details modal or page
//     }
// }

// function downloadInvoice(id) {
//     console.log("📄 Download invoice for purchase:", id)
//     const purchase = purchaseHistoryData.find((p) => p.id === id)
//     if (purchase) {
//         showSuccess(`Downloading invoice for: ${purchase.title}`)
//         // In real implementation, trigger invoice download
//         // This would typically call an API endpoint that generates and returns a PDF
//         /*
//         const [success, result] = await callApi("GET", `/api/purchases/${id}/invoice/`, null, getCsrfToken())
        
//         if (success && result.success) {
//           // Create a blob from the PDF data and trigger download
//           const blob = new Blob([result.data], { type: 'application/pdf' })
//           const url = window.URL.createObjectURL(blob)
//           const a = document.createElement('a')
//           a.href = url
//           a.download = `invoice_${id}.pdf`
//           a.click()
//           window.URL.revokeObjectURL(url)
//         } else {
//           showError("Failed to download invoice")
//         }
//         */
//     }
// }

// async function editProfile() {
//     console.log("✏️ Edit profile clicked")
//     showSuccess("Opening profile edit form...")

//     // In real implementation, this would open a modal or form to edit profile
//     // Then submit the changes via API
//     /*
//     const updatedProfileData = {
//       name: "Updated Name",
//       email: "updated@email.com",
//       address: "Updated Address",
//       // ... other fields
//     }
    
//     const [success, result] = await callApi("PUT", profile_api_url, updatedProfileData, getCsrfToken())
    
//     if (success && result.success) {
//       showSuccess("Profile updated successfully!")
//       await loadProfileData() // Reload profile data
//     } else {
//       showError("Failed to update profile: " + (result.error || "Unknown error"))
//     }
//     */
// }

// // API Helper Functions
// async function searchListings(filters = {}) {
//     console.log("🔍 Searching listings with filters:", filters)

//     try {
//         const queryParams = new URLSearchParams(filters).toString()
//         const url = `${API_URLS.all_listings}?${queryParams}`

//         const [success, result] = await callApi("GET", url, null, getCsrfToken())

//         if (success && result.success) {
//             console.log("Found listings:", result.data)
//             return result.data
//         } else {
//             console.error("Failed to search listings:", result.error)
//             return []
//         }
//     } catch (error) {
//         console.error("Error searching listings:", error)
//         return []
//     }
// }

// async function getBuyerRequirements(filters = {}) {
//     console.log("📋 Getting buyer requirements with filters:", filters)

//     try {
//         const queryParams = new URLSearchParams(filters).toString()
//         const url = queryParams ? `${API_URLS.buyer_requirements}?${queryParams}` : API_URLS.buyer_requirements

//         const [success, result] = await callApi("GET", url, null, getCsrfToken())

//         if (success && result.success) {
//             return result.data
//         } else {
//             console.error("Failed to get buyer requirements:", result.error)
//             return []
//         }
//     } catch (error) {
//         console.error("Error getting buyer requirements:", error)
//         return []
//     }
// }

// // Error Handling and Notifications
// function showError(message) {
//     console.error("Error:", message)
//     // In a real implementation, you would show a proper toast notification
//     // For now, using alert as fallback
//     alert("Error: " + message)
// }

// function showSuccess(message) {
//     console.log("Success:", message)
//     // In a real implementation, you would show a proper toast notification
//     // For now, using alert as fallback
//     alert("Success: " + message)
// }

// function showWarning(message) {
//     console.warn("Warning:", message)
//     // In a real implementation, you would show a proper toast notification
//     alert("Warning: " + message)
// }

// // Initialize when DOM is loaded
// document.addEventListener("DOMContentLoaded", () => {
//     console.log("🔧 DOM loaded, waiting for BuyerProfileApp initialization...")

//     // Add any DOM-ready initialization here
//     setupEventListeners()
// })

// // Additional event listeners for better user experience
// function setupEventListeners() {
//     // Add search functionality if needed
//     const searchInput = document.getElementById('requirementSearch')
//     if (searchInput) {
//         searchInput.addEventListener('input', debounce(handleSearch, 300))
//     }

//     // Add filter functionality
//     const filterButtons = document.querySelectorAll('.filter-btn')
//     filterButtons.forEach(btn => {
//         btn.addEventListener('click', handleFilter)
//     })
// }

// function debounce(func, wait) {
//     let timeout
//     return function executedFunction(...args) {
//         const later = () => {
//             clearTimeout(timeout)
//             func(...args)
//         }
//         clearTimeout(timeout)
//         timeout = setTimeout(later, wait)
//     }
// }

// function handleSearch(event) {
//     const searchTerm = event.target.value.toLowerCase()
//     const filteredRequirements = requirementsData.filter(req =>
//         req.title.toLowerCase().includes(searchTerm) ||
//         req.description.toLowerCase().includes(searchTerm) ||
//         req.category.toLowerCase().includes(searchTerm)
//     )

//     renderFilteredRequirements(filteredRequirements)
// }

// function handleFilter(event) {
//     const filterType = event.target.dataset.filter
//     let filteredRequirements = requirementsData

//     if (filterType && filterType !== 'all') {
//         filteredRequirements = requirementsData.filter(req => req.status === filterType)
//     }

//     renderFilteredRequirements(filteredRequirements)
// }

// function renderFilteredRequirements(requirements) {
//     const container = document.getElementById("requirementsList")

//     if (requirements.length === 0) {
//         container.innerHTML = createEmptyState("requirements")
//         return
//     }

//     const requirementsHTML = requirements.map((requirement) => createRequirementCard(requirement)).join("")
//     container.innerHTML = requirementsHTML
// }

// // Refresh data function
// async function refreshData() {
//     console.log("🔄 Refreshing all data...")

//     try {
//         // Show loading states
//         showLoadingState("requirementsList")
//         if (currentTab === "history") {
//             showLoadingState("purchaseHistory")
//         }

//         // Reload data
//         await Promise.all([
//             loadProfileData(),
//             loadRequirements(),
//             currentTab === "history" ? loadPurchaseHistory() : Promise.resolve()
//         ])

//         showSuccess("Data refreshed successfully!")
//     } catch (error) {
//         console.error("Error refreshing data:", error)
//         showError("Failed to refresh data")
//     }
// }

// // Export functions for global access
// window.BuyerProfileApp = BuyerProfileApp
// window.postNewRequirement = postNewRequirement
// window.viewRequirement = viewRequirement
// window.viewResponses = viewResponses
// window.editRequirement = editRequirement
// window.deleteRequirement = deleteRequirement
// window.markRequirementFulfilled = markRequirementFulfilled
// window.reviveRequirement = reviveRequirement
// window.viewPurchaseDetails = viewPurchaseDetails
// window.downloadInvoice = downloadInvoice
// window.editProfile = editProfile
// window.refreshData = refreshData

// console.log("🔐 WasteBazar Buyer Profile System Initialized")
