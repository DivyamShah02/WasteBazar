// Listing Form JavaScript - Create New Listings

// Global variables for API endpoints and CSRF token
let csrf_token = null;
let seller_listings_api_url = null;
let categories_api_url = "/marketplace-api/categories/";

// Initialize app function
function ListingFormApp(csrf_token_param, seller_listings_api_url_param) {
    console.log("🚀 Initializing WasteBazar Listing Form");
    console.log("🔧 CSRF Token:", csrf_token_param ? "Present" : "Missing");
    console.log("🔧 API URL:", seller_listings_api_url_param);

    csrf_token = csrf_token_param;
    seller_listings_api_url = seller_listings_api_url_param;

    if (!csrf_token || !seller_listings_api_url) {
        console.error("❌ Missing required parameters for ListingFormApp");
        showAlert("error", "Configuration error. Please refresh the page.");
        return;
    }

    initializeFormApp();
}

// Initialize the form application
function initializeFormApp() {
    console.log("🔧 Initializing form functionality...");

    // Load categories from API
    loadCategories();

    // Setup form validation and submission
    setupFormValidation();
    setupFormSubmission();
    setupFormEnhancements();

    console.log("✅ Listing form initialized successfully");
}

// Setup form validation
function setupFormValidation() {
    const form = document.getElementById('listingForm');

    // Bootstrap form validation
    form.addEventListener('submit', function (event) {
        event.preventDefault();
        event.stopPropagation();

        if (form.checkValidity()) {
            submitListingForm();
        } else {
            showAlert("error", "Please fill in all required fields correctly.");
        }

        form.classList.add('was-validated');
    });

    // Custom validation for pincode
    const pincodeInput = document.getElementById('pincode_location');
    pincodeInput.addEventListener('input', function () {
        const value = this.value;
        const isValid = /^[0-9]{6}$/.test(value);

        if (value.length > 0 && !isValid) {
            this.setCustomValidity('Please enter a valid 6-digit pincode');
        } else {
            this.setCustomValidity('');
        }
    });

    // Quantity validation
    const quantityInput = document.getElementById('quantity');
    quantityInput.addEventListener('input', function () {
        const value = parseFloat(this.value);

        if (value <= 0) {
            this.setCustomValidity('Quantity must be greater than 0');
        } else {
            this.setCustomValidity('');
        }
    });
}

// Setup form submission
function setupFormSubmission() {
    console.log("🔧 Setting up form submission handler");
}

// Submit listing form
async function submitListingForm() {
    console.log("📝 Submitting listing form...");

    try {
        // Show loading state
        showLoadingOverlay(true);

        // Get form data
        const formData = getFormData();

        // Validate form data
        if (!validateFormData(formData)) {
            showLoadingOverlay(false);
            return;
        }

        console.log("📋 Form Data:", formData);

        // Call API to create listing
        const [success, result] = await callApi("POST", seller_listings_api_url, formData, csrf_token);

        console.log("🔄 API Response:", { success, result });

        if (success && result.success) {
            console.log("✅ Listing created successfully:", result.data);

            // Show success message
            showAlert("success", "Listing created successfully! Your listing is now pending approval.");

            // Reset form
            resetForm();

            // Redirect after a delay
            setTimeout(() => {
                window.location.href = "/seller_profile.html";
            }, 2000);

        } else {
            console.error("❌ Failed to create listing:", result);
            const errorMessage = result.error || "Failed to create listing. Please try again.";
            showAlert("error", errorMessage);
        }

    } catch (error) {
        console.error("❌ Error submitting form:", error);
        showAlert("error", "Network error. Please check your connection and try again.");
    } finally {
        showLoadingOverlay(false);
    }
}

// Get form data
function getFormData() {
    const form = document.getElementById('listingForm');
    const formData = new FormData(form);

    // Convert FormData to regular object
    const data = {};
    for (let [key, value] of formData.entries()) {
        data[key] = value.trim();
    }

    // Convert category_id to category title
    const categorySelect = document.getElementById('category');
    if (categorySelect.value) {
        const selectedOption = categorySelect.options[categorySelect.selectedIndex];
        data.category = selectedOption.textContent; // Use the text content as category name
    }

    // Convert quantity to number
    if (data.quantity) {
        data.quantity = parseFloat(data.quantity);
    }

    return data;
}

// Validate form data
function validateFormData(data) {
    const requiredFields = [
        'category', 'subcategory', 'quantity', 'unit', 'description',
        'city_location', 'state_location', 'pincode_location', 'address'
    ];

    // Check required fields
    for (let field of requiredFields) {
        if (!data[field] || data[field] === '') {
            showAlert("error", `Please fill in the ${field.replace('_', ' ')} field.`);
            return false;
        }
    }

    // Validate quantity
    if (data.quantity <= 0) {
        showAlert("error", "Quantity must be greater than 0.");
        return false;
    }

    // Validate pincode
    if (!/^[0-9]{6}$/.test(data.pincode_location)) {
        showAlert("error", "Please enter a valid 6-digit pincode.");
        return false;
    }

    // Validate description length
    if (data.description.length < 10) {
        showAlert("error", "Description must be at least 10 characters long.");
        return false;
    }

    return true;
}

// Setup form enhancements
function setupFormEnhancements() {
    // Category change handler
    const categorySelect = document.getElementById('category');
    categorySelect.addEventListener('change', function () {
        const categoryId = this.value;
        loadSubcategories(categoryId);
    });

    // Auto-capitalize first letter of text inputs
    const textInputs = document.querySelectorAll('input[type="text"], textarea');
    textInputs.forEach(input => {
        if (input.id !== 'pincode_location') { // Skip pincode
            input.addEventListener('blur', function () {
                if (this.value) {
                    this.value = this.value.charAt(0).toUpperCase() + this.value.slice(1);
                }
            });
        }
    });

    // Pincode formatting
    const pincodeInput = document.getElementById('pincode_location');
    pincodeInput.addEventListener('input', function () {
        // Only allow numbers
        this.value = this.value.replace(/[^0-9]/g, '');

        // Limit to 6 digits
        if (this.value.length > 6) {
            this.value = this.value.slice(0, 6);
        }
    });

    // Character counter for description
    const descriptionTextarea = document.getElementById('description');
    const descriptionGroup = descriptionTextarea.closest('.form-group');

    // Create character counter
    const charCounter = document.createElement('div');
    charCounter.className = 'form-text text-end';
    charCounter.id = 'descriptionCounter';
    descriptionGroup.appendChild(charCounter);

    function updateCharCounter() {
        const current = descriptionTextarea.value.length;
        const max = 1000;
        charCounter.textContent = `${current}/${max} characters`;

        if (current > max * 0.9) {
            charCounter.classList.add('text-warning');
        } else {
            charCounter.classList.remove('text-warning');
        }
    }

    descriptionTextarea.addEventListener('input', updateCharCounter);
    updateCharCounter(); // Initial count

    // Quantity formatting
    const quantityInput = document.getElementById('quantity');
    quantityInput.addEventListener('input', function () {
        // Allow only numbers and decimal point
        this.value = this.value.replace(/[^0-9.]/g, '');

        // Prevent multiple decimal points
        const parts = this.value.split('.');
        if (parts.length > 2) {
            this.value = parts[0] + '.' + parts.slice(1).join('');
        }
    });
}

// Load categories from API
async function loadCategories() {
    try {
        console.log("🔄 Loading categories from API...");

        const [success, result] = await callApi("GET", categories_api_url, null, csrf_token);

        if (success && result.success) {
            const categories = result.data || [];
            console.log("✅ Loaded", categories.length, "categories");

            populateCategoryDropdown(categories);
        } else {
            console.error("❌ Failed to load categories:", result);
            showAlert("warning", "Failed to load categories. Using default options.");
        }

    } catch (error) {
        console.error("❌ Error loading categories:", error);
        showAlert("warning", "Failed to load categories. Using default options.");
    }
}

// Populate category dropdown
function populateCategoryDropdown(categories) {
    const categorySelect = document.getElementById('category');

    // Update the first option text
    categorySelect.firstElementChild.textContent = 'Select Category';

    // Clear existing options except the first one
    while (categorySelect.children.length > 1) {
        categorySelect.removeChild(categorySelect.lastChild);
    }

    // Add categories from API
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.category_id;
        option.textContent = category.title;
        categorySelect.appendChild(option);
    });
}

// Load subcategories for selected category
async function loadSubcategories(categoryId) {
    const subcategoryInput = document.getElementById('subcategory');

    if (!categoryId) {
        // Reset subcategory to text input
        subcategoryInput.placeholder = "e.g., PET Bottles, Steel Scrap, etc.";
        subcategoryInput.disabled = false;
        return;
    }

    try {
        console.log("🔄 Loading subcategories for category:", categoryId);

        const apiUrl = `${categories_api_url}${categoryId}/`;
        const [success, result] = await callApi("GET", apiUrl, null, csrf_token);

        if (success && result.success) {
            const subcategories = result.data.subcategories || [];
            console.log("✅ Loaded", subcategories.length, "subcategories");

            if (subcategories.length > 0) {
                populateSubcategoryDropdown(subcategories);
            } else {
                // No subcategories found, keep as text input
                subcategoryInput.placeholder = "Enter subcategory for this category";
            }
        } else {
            console.error("❌ Failed to load subcategories:", result);
            subcategoryInput.placeholder = "Enter subcategory for this category";
        }

    } catch (error) {
        console.error("❌ Error loading subcategories:", error);
        subcategoryInput.placeholder = "Enter subcategory for this category";
    }
}

// Populate subcategory dropdown
function populateSubcategoryDropdown(subcategories) {
    const subcategoryInput = document.getElementById('subcategory');
    const subcategoryGroup = subcategoryInput.closest('.form-group');

    // Create a select element
    const select = document.createElement('select');
    select.className = 'form-select';
    select.id = 'subcategory';
    select.name = 'subcategory';
    select.required = true;

    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select Subcategory';
    select.appendChild(defaultOption);

    // Add subcategories
    subcategories.forEach(subcategory => {
        const option = document.createElement('option');
        option.value = subcategory.title;
        option.textContent = subcategory.title;
        select.appendChild(option);
    });

    // Add "Other" option
    const otherOption = document.createElement('option');
    otherOption.value = 'other';
    otherOption.textContent = 'Other (specify in description)';
    select.appendChild(otherOption);

    // Replace input with select
    subcategoryGroup.replaceChild(select, subcategoryInput);
}

// Reset form
function resetForm() {
    const form = document.getElementById('listingForm');
    form.reset();
    form.classList.remove('was-validated');

    // Reset character counter
    const charCounter = document.getElementById('descriptionCounter');
    if (charCounter) {
        charCounter.textContent = '0/1000 characters';
        charCounter.classList.remove('text-warning');
    }

    console.log("🔄 Form reset successfully");
}

// Show/hide loading overlay
function showLoadingOverlay(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
        overlay.style.display = 'flex';
    } else {
        overlay.style.display = 'none';
    }
}

// Show alert message
function showAlert(type, message) {
    const alertContainer = document.getElementById('alertContainer');

    // Remove existing alerts
    alertContainer.innerHTML = '';

    const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
    const iconClass = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle';

    const alertHtml = `
        <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
            <i class="${iconClass} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;

    alertContainer.innerHTML = alertHtml;

    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            const alert = alertContainer.querySelector('.alert');
            if (alert) {
                const bsAlert = new bootstrap.Alert(alert);
                bsAlert.close();
            }
        }, 5000);
    }

    // Scroll to alert
    alertContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Get CSRF token
function getCsrfToken() {
    return csrf_token;
}

// Utility function to check if user is logged in (from localStorage)
function checkUserAuthentication() {
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) {
        showAlert("error", "Please log in to create listings.");
        setTimeout(() => {
            window.location.href = "/login.html";
        }, 2000);
        return false;
    }

    try {
        const user = JSON.parse(userInfo);
        const userRole = user.role || '';

        // Check if user is a seller
        if (!userRole.includes('seller')) {
            showAlert("error", "Only sellers can create listings.");
            setTimeout(() => {
                window.location.href = "/index.html";
            }, 2000);
            return false;
        }

        return true;
    } catch (error) {
        console.error("❌ Error parsing user info:", error);
        showAlert("error", "Authentication error. Please log in again.");
        setTimeout(() => {
            window.location.href = "/login.html";
        }, 2000);
        return false;
    }
}

// Initialize authentication check when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log("📄 DOM Content Loaded - Checking authentication");

    // Check if user is authenticated and authorized
    if (!checkUserAuthentication()) {
        return;
    }

    console.log("✅ User authentication verified");
});

// Export functions for external use
window.ListingFormApp = ListingFormApp;
window.getCsrfToken = getCsrfToken;
