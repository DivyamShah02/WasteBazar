// Progressive Search Form JavaScript
document.addEventListener('DOMContentLoaded', function () {
    // Subcategory mapping based on category
    const subcategories = {
        plastic: [
            { value: 'pet', text: 'PET Bottles' },
            { value: 'hdpe', text: 'HDPE Containers' },
            { value: 'ldpe', text: 'LDPE Films' },
            { value: 'pp', text: 'Polypropylene' },
            { value: 'ps', text: 'Polystyrene' },
            { value: 'pvc', text: 'PVC Pipes & Sheets' }
        ],
        metal: [
            { value: 'aluminum', text: 'Aluminum Scrap' },
            { value: 'steel', text: 'Steel Scrap' },
            { value: 'copper', text: 'Copper Wire' },
            { value: 'iron', text: 'Iron Scrap' },
            { value: 'brass', text: 'Brass Scrap' },
            { value: 'stainless', text: 'Stainless Steel' }
        ],
        paper: [
            { value: 'newspaper', text: 'Newspaper' },
            { value: 'cardboard', text: 'Cardboard' },
            { value: 'mixed', text: 'Mixed Paper' },
            { value: 'magazine', text: 'Magazines' },
            { value: 'office', text: 'Office Paper' },
            { value: 'packaging', text: 'Paper Packaging' }
        ],
        electronic: [
            { value: 'mobile', text: 'Mobile Phones' },
            { value: 'computer', text: 'Computer Parts' },
            { value: 'circuit', text: 'Circuit Boards' },
            { value: 'cables', text: 'Cables & Wires' },
            { value: 'batteries', text: 'Batteries' },
            { value: 'appliances', text: 'Small Appliances' }
        ],
        textile: [
            { value: 'cotton', text: 'Cotton Fabric' },
            { value: 'polyester', text: 'Polyester' },
            { value: 'denim', text: 'Denim' },
            { value: 'wool', text: 'Wool' },
            { value: 'silk', text: 'Silk' },
            { value: 'mixed', text: 'Mixed Textiles' }
        ],
        glass: [
            { value: 'clear', text: 'Clear Glass' },
            { value: 'colored', text: 'Colored Glass' },
            { value: 'bottles', text: 'Glass Bottles' },
            { value: 'containers', text: 'Glass Containers' },
            { value: 'mirrors', text: 'Mirrors' },
            { value: 'tempered', text: 'Tempered Glass' }
        ]
    };

    // Get form elements
    const categorySelect = document.getElementById('category');
    const subcategorySelect = document.getElementById('subcategory');
    const locationInput = document.getElementById('location');

    // Get step elements
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');

    // Get button elements
    const nextStep1 = document.getElementById('nextStep1');
    const nextStep2 = document.getElementById('nextStep2');
    const backStep1 = document.getElementById('backStep1');
    const backStep2 = document.getElementById('backStep2');
    const searchNow = document.getElementById('searchNow');

    // Get progress elements
    const progress1 = document.getElementById('progress1');
    const progress2 = document.getElementById('progress2');
    const progress3 = document.getElementById('progress3');
    const line1 = document.getElementById('line1');
    const line2 = document.getElementById('line2');

    // Current step tracking
    let currentStep = 1;

    // Enable/disable next button based on category selection
    categorySelect.addEventListener('change', function () {
        if (this.value && this.value !== 'Select Category') {
            nextStep1.disabled = false;
            populateSubcategories(this.value);
        } else {
            nextStep1.disabled = true;
        }
    });

    // Enable/disable next button based on subcategory selection
    subcategorySelect.addEventListener('change', function () {
        if (this.value && this.value !== 'Select Subcategory') {
            nextStep2.disabled = false;
        } else {
            nextStep2.disabled = true;
        }
    });

    // Enable/disable search button based on location input
    locationInput.addEventListener('input', function () {
        if (this.value.trim().length > 0) {
            searchNow.disabled = false;
        } else {
            searchNow.disabled = true;
        }
    });

    // Populate subcategories based on selected category
    function populateSubcategories(category) {
        subcategorySelect.innerHTML = '<option selected disabled>Select Subcategory</option>';

        if (subcategories[category]) {
            subcategories[category].forEach(subcat => {
                const option = document.createElement('option');
                option.value = subcat.value;
                option.textContent = subcat.text;
                subcategorySelect.appendChild(option);
            });
        }

        // Reset subcategory selection
        nextStep2.disabled = true;
    }

    // Step navigation functions
    function showStep(stepNumber) {
        // Hide all steps
        step1.style.display = 'none';
        step2.style.display = 'none';
        step3.style.display = 'none';

        // Show current step
        switch (stepNumber) {
            case 1:
                step1.style.display = 'block';
                updateProgress(1);
                break;
            case 2:
                step2.style.display = 'block';
                updateProgress(2);
                break;
            case 3:
                step3.style.display = 'block';
                updateProgress(3);
                break;
        }

        currentStep = stepNumber;
    }

    // Update progress indicator
    function updateProgress(activeStep) {
        // Reset all progress steps
        progress1.classList.remove('active', 'completed');
        progress2.classList.remove('active', 'completed');
        progress3.classList.remove('active', 'completed');
        line1.classList.remove('completed');
        line2.classList.remove('completed');

        // Set completed and active states
        if (activeStep >= 1) {
            if (activeStep > 1) {
                progress1.classList.add('completed');
                line1.classList.add('completed');
            } else {
                progress1.classList.add('active');
            }
        }

        if (activeStep >= 2) {
            if (activeStep > 2) {
                progress2.classList.add('completed');
                line2.classList.add('completed');
            } else {
                progress2.classList.add('active');
            }
        }

        if (activeStep >= 3) {
            progress3.classList.add('active');
        }
    }

    // Event listeners for navigation buttons
    nextStep1.addEventListener('click', function (e) {
        e.preventDefault();
        showStep(2);
    });

    nextStep2.addEventListener('click', function (e) {
        e.preventDefault();
        showStep(3);
    });

    backStep1.addEventListener('click', function (e) {
        e.preventDefault();
        showStep(1);
    });

    backStep2.addEventListener('click', function (e) {
        e.preventDefault();
        showStep(2);
    });

    // Handle form submission
    document.getElementById('searchForm').addEventListener('submit', function (e) {
        e.preventDefault();

        const formData = {
            category: categorySelect.value,
            subcategory: subcategorySelect.value,
            location: locationInput.value.trim()
        };

        console.log('Search submitted:', formData);

        // Here you can add the actual search logic
        // For now, we'll just show an alert
        alert(`Searching for ${formData.subcategory} in ${formData.location}...`);

        // You can redirect to listings page or show results
        // window.location.href = 'listings.html?category=' + formData.category + '&subcategory=' + formData.subcategory + '&location=' + formData.location;
    });

    // Initialize the form
    showStep(1);
});
