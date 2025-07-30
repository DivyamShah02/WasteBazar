// Requirement Form Page JavaScript - API Driven

// Global variables for API endpoints and CSRF token
let csrf_token = null;
let create_requirement_api_url = null;

// Initialize app function
async function RequirementFormApp(csrf_token_param, create_requirement_api_url_param) {
    console.log("🚀 Initializing WasteBazar Requirement Form Page");
    console.log("🔧 CSRF Token:", csrf_token_param ? "Present" : "Missing");
    console.log("🔧 API URL:", create_requirement_api_url_param);

    csrf_token = csrf_token_param;
    create_requirement_api_url = create_requirement_api_url_param;

    if (!csrf_token) {
        console.error("❌ Missing CSRF Token for RequirementFormApp");
        return;
    }

    initializeForm();
}

function getCsrfToken() {
    return csrf_token;
}

// Initialize form functionality
function initializeForm() {
    console.log("🔧 Initializing form components...");

    initializeFormSubmission();
    initializeCategorySubcategory();
    initializeStateDropdown();

    console.log("✅ Form initialization complete");
}

// Initialize form submission
function initializeFormSubmission() {
    const form = document.getElementById('requirementForm');

    if (!form) {
        console.error("❌ Form element not found");
        return;
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        handleFormSubmission();
    });
}

// Handle form submission
async function handleFormSubmission() {
    const submitBtn = document.getElementById('submitBtn');
    const successMessage = document.getElementById('successMessage');
    const form = document.getElementById('requirementForm');

    clearError();

    if (!validateFormFields()) {
        return;
    }

    try {
        // Show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting Requirement...';

        // Get current user ID from localStorage
        const currentUserId = localStorage.getItem('user_id');
        console.log("🔧 Current User ID:", currentUserId);
        if (!currentUserId) {
            showError('User not logged in. Please login first.');
            return;
        }

        // Create form data object with user_id included
        const formData = {
            user_id: currentUserId,
            category: document.getElementById('category').value,
            subcategory: document.getElementById('subcategory').value,
            quantity: document.getElementById('quantity').value,
            unit: document.getElementById('unit').value,
            description: document.getElementById('description').value,
            city_location: document.getElementById('city_location').value,
            state_location: document.getElementById('state_location').value,
            pincode_location: document.getElementById('pincode_location').value,
            address: document.getElementById('address').value
        };

        console.log('🔧 Creating requirement with data:', formData);

        // Make API call using the centralized API caller
        const [success, result] = await callApi(
            'POST',
            create_requirement_api_url,
            formData,
            getCsrfToken(),
            false // media_upload = false (no file upload for requirements)
        );

        if (success && result.success !== false) {
            // Success - show success message
            successMessage.style.display = 'block';
            form.style.display = 'none';

            // Scroll to top to show success message
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Redirect after delay
            setTimeout(() => {
                window.location.href = '/buyer-profile';
            }, 3000);

        } else {
            throw new Error(result.message || 'Failed to create requirement');
        }

    } catch (error) {
        console.error('Error creating requirement:', error);
        showError('Failed to create requirement: ' + error.message);

    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Post Requirement';
    }
}

// Validate form fields
function validateFormFields() {
    const requiredFields = [
        { id: 'category', name: 'Category' },
        { id: 'subcategory', name: 'Subcategory' },
        { id: 'quantity', name: 'Quantity' },
        { id: 'unit', name: 'Unit' },
        { id: 'description', name: 'Description' },
        { id: 'city_location', name: 'City' },
        { id: 'state_location', name: 'State' },
        { id: 'pincode_location', name: 'Pincode' },
        { id: 'address', name: 'Address' }
    ];

    for (let field of requiredFields) {
        const element = document.getElementById(field.id);
        if (!element.value.trim()) {
            showError(`Please fill in the ${field.name} field.`);
            element.focus();
            return false;
        }
    }

    // Validate pincode format
    const pincode = document.getElementById('pincode_location').value;
    if (!/^\d{6}$/.test(pincode)) {
        showError('Please enter a valid 6-digit pincode.');
        document.getElementById('pincode_location').focus();
        return false;
    }

    // Validate quantity
    const quantity = parseFloat(document.getElementById('quantity').value);
    if (quantity <= 0) {
        showError('Quantity must be greater than 0.');
        document.getElementById('quantity').focus();
        return false;
    }

    return true;
}

// Initialize category-subcategory functionality
function initializeCategorySubcategory() {
    const categorySelect = document.getElementById('category');
    const subcategorySelect = document.getElementById('subcategory');

    if (!categorySelect || !subcategorySelect) {
        console.error("❌ Category/Subcategory elements not found");
        return;
    }

    // Subcategory data
    const subcategoryData = {
        plastic: ['PET Bottles', 'HDPE Containers', 'PVC Pipes', 'Polystyrene', 'Mixed Plastic'],
        metal: ['Aluminum Cans', 'Copper Wire', 'Steel Scrap', 'Iron Scraps', 'Brass Items'],
        paper: ['Newspaper', 'Cardboard', 'Office Paper', 'Books/Magazines', 'Mixed Paper'],
        electronic: ['Mobile Phones', 'Computers', 'TVs/Monitors', 'Circuit Boards', 'Cables'],
        textile: ['Cotton Fabric', 'Synthetic Fabric', 'Used Clothing', 'Yarn Waste', 'Mixed Textiles'],
        glass: ['Clear Glass', 'Colored Glass', 'Bottles', 'Window Glass', 'Mixed Glass']
    };

    categorySelect.addEventListener('change', function () {
        const selectedCategory = this.value;
        subcategorySelect.innerHTML = '<option value="">Select Subcategory</option>';

        if (selectedCategory && subcategoryData[selectedCategory]) {
            subcategoryData[selectedCategory].forEach(subcategory => {
                const option = document.createElement('option');
                option.value = subcategory.toLowerCase().replace(/\s+/g, '_');
                option.textContent = subcategory;
                subcategorySelect.appendChild(option);
            });
        }
    });
}

// Initialize state dropdown
function initializeStateDropdown() {
    const stateSelect = document.getElementById('state_location');

    if (!stateSelect) {
        console.error("❌ State select element not found");
        return;
    }

    const indianStates = [
        'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
        'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
        'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
        'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
        'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
        'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry'
    ];

    indianStates.forEach(state => {
        const option = document.createElement('option');
        option.value = state;
        option.textContent = state;
        stateSelect.appendChild(option);
    });
}

// Error handling functions
function showError(message) {
    // Create error display element if it doesn't exist
    let errorDisplay = document.getElementById('errorDisplay');
    if (!errorDisplay) {
        errorDisplay = document.createElement('div');
        errorDisplay.id = 'errorDisplay';
        errorDisplay.className = 'upload-status error mt-2';

        // Insert after form header
        const formHeader = document.querySelector('.form-header');
        if (formHeader) {
            formHeader.insertAdjacentElement('afterend', errorDisplay);
        }
    }

    errorDisplay.style.display = 'block';
    errorDisplay.innerHTML = `<span><i class="fas fa-exclamation-triangle"></i> ${message}</span>`;

    // Scroll to error message
    errorDisplay.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function clearError() {
    const errorDisplay = document.getElementById('errorDisplay');
    if (errorDisplay) {
        errorDisplay.style.display = 'none';
        errorDisplay.innerHTML = '';
    }
}
