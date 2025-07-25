// Listing Form Page JavaScript - API Driven

// Global variables for API endpoints and CSRF token
let csrf_token = null;
let create_listing_api_url = null;

// Photo upload variables
let selectedFiles = [];
const maxFiles = 5;
const maxFileSize = 5 * 1024 * 1024; // 5MB in bytes

// Initialize app function
async function ListingsFormApp(csrf_token_param, create_listing_api_url_param) {
    console.log("🚀 Initializing WasteBazar Listing Form Page");
    console.log("🔧 CSRF Token:", csrf_token_param ? "Present" : "Missing");
    console.log("🔧 API URL:", create_listing_api_url_param);

    csrf_token = csrf_token_param;
    create_listing_api_url = create_listing_api_url_param;

    if (!csrf_token) {
        console.error("❌ Missing CSRF Token for ListingsFormApp");
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

    initializePhotoUpload();
    initializeFormSubmission();
    initializeCategorySubcategory();
    initializeStateDropdown();

    console.log("✅ Form initialization complete");
}

// Initialize photo upload functionality
function initializePhotoUpload() {
    const photoInput = document.getElementById('productPhotos');
    const previewContainer = document.getElementById('photoPreviewContainer');
    const photoCount = document.getElementById('photoCount');
    const uploadStatus = document.getElementById('uploadStatus');
    const dropZone = document.getElementById('dropZone');

    if (!photoInput || !previewContainer || !photoCount || !uploadStatus || !dropZone) {
        console.error("❌ Photo upload elements not found");
        return;
    }

    // File input change event
    photoInput.addEventListener('change', function (e) {
        const files = Array.from(e.target.files);
        handleFileSelection(files);
    });

    // Drag and drop events
    dropZone.addEventListener('click', function (e) {
        if (e.target !== photoInput) {
            photoInput.click();
        }
    });

    dropZone.addEventListener('dragover', function (e) {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (!dropZone.contains(e.relatedTarget)) {
            dropZone.classList.remove('drag-over');
        }
    });

    dropZone.addEventListener('drop', function (e) {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('drag-over');

        const files = Array.from(e.dataTransfer.files);
        handleFileSelection(files);
    });

    // Prevent default drag behaviors on document
    document.addEventListener('dragover', function (e) {
        e.preventDefault();
    });

    document.addEventListener('drop', function (e) {
        e.preventDefault();
    });
}

// Handle file selection
function handleFileSelection(files) {
    if (selectedFiles.length + files.length > maxFiles) {
        showError(`You can only upload a maximum of ${maxFiles} photos.`);
        return;
    }

    for (let file of files) {
        if (!validateFile(file)) {
            return;
        }
        selectedFiles.push(file);
    }

    updatePhotoPreview();
    updatePhotoCount();
    clearError();
}

// Validate individual file
function validateFile(file) {
    if (!file.type.startsWith('image/')) {
        showError('Please select only image files.');
        return false;
    }

    if (file.size > maxFileSize) {
        showError('Each file must be smaller than 5MB.');
        return false;
    }

    return true;
}

// Update photo preview
function updatePhotoPreview() {
    const previewContainer = document.getElementById('photoPreviewContainer');
    previewContainer.innerHTML = '';

    selectedFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = function (e) {
            const previewItem = document.createElement('div');
            previewItem.className = 'photo-preview-item';
            previewItem.innerHTML = `
        <img src="${e.target.result}" alt="Photo ${index + 1}">
        <button type="button" class="photo-remove-btn" onclick="removePhoto(${index})" title="Remove photo">
          ×
        </button>
      `;
            previewContainer.appendChild(previewItem);
        };
        reader.readAsDataURL(file);
    });
}

// Update photo count
function updatePhotoCount() {
    const photoCount = document.getElementById('photoCount');
    photoCount.textContent = `${selectedFiles.length}/${maxFiles} photos selected`;
}

// Remove photo function (global)
window.removePhoto = function (index) {
    selectedFiles.splice(index, 1);
    updatePhotoPreview();
    updatePhotoCount();

    // Update the file input
    const dt = new DataTransfer();
    selectedFiles.forEach(file => dt.items.add(file));
    document.getElementById('productPhotos').files = dt.files;

    if (selectedFiles.length === 0) {
        clearError();
    }
};

// Initialize form submission
function initializeFormSubmission() {
    const form = document.getElementById('listingForm');

    if (!form) {
        console.error("❌ Form element not found");
        return;
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        if (selectedFiles.length === 0) {
            showError('Please upload at least one photo of your product.');
            return false;
        }

        handleFormSubmission();
    });
}

// Handle form submission
async function handleFormSubmission() {
    const submitBtn = document.getElementById('submitBtn');
    const successMessage = document.getElementById('successMessage');
    const form = document.getElementById('listingForm');

    clearError();

    if (!validateFormFields()) {
        return;
    }

    try {
        // Show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Listing...';

        // Create FormData object
        const formData = new FormData();

        // Add form fields
        formData.append('category', document.getElementById('category').value);
        formData.append('subcategory', document.getElementById('subcategory').value);
        formData.append('quantity', document.getElementById('quantity').value);
        formData.append('unit', document.getElementById('unit').value);
        formData.append('description', document.getElementById('description').value);
        formData.append('city_location', document.getElementById('city_location').value);
        formData.append('state_location', document.getElementById('state_location').value);
        formData.append('pincode_location', document.getElementById('pincode_location').value);
        formData.append('address', document.getElementById('address').value);

        // Add photos
        selectedFiles.forEach((file, index) => {
            formData.append('photos', file);
        });

        // Make API call using the centralized API caller
        const [success, result] = await callApi(
            'POST',
            '/marketplace-api/create-listing/',
            formData,
            getCsrfToken(),
            true // media_upload = true
        );

        if (success && result.success !== false) {
            // Success - show success message
            successMessage.style.display = 'block';
            form.style.display = 'none';

            // Scroll to top to show success message
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Redirect after delay
            setTimeout(() => {
                window.location.href = '/seller-profile';
            }, 3000);

        } else {
            throw new Error(result.message || 'Failed to create listing');
        }

    } catch (error) {
        console.error('Error creating listing:', error);
        showError('Failed to create listing: ' + error.message);

    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Create Listing';
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
    const uploadStatus = document.getElementById('uploadStatus');
    uploadStatus.className = 'upload-status error mt-2';
    uploadStatus.innerHTML = `<span>${message}</span>`;
}

function clearError() {
    const uploadStatus = document.getElementById('uploadStatus');
    uploadStatus.className = 'upload-status mt-2';
    const photoCount = document.getElementById('photoCount');
    uploadStatus.innerHTML = `<span id="photoCount">${selectedFiles.length}/${maxFiles} photos selected</span>`;
}
