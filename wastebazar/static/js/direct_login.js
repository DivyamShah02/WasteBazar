/**
 * Direct Login Script for WasteBazar
 * Handles mobile number + OTP login for registered users
 */

class DirectLoginHandler {
    constructor(config) {
        this.csrfToken = config.csrfToken;
        this.otpApiUrl = config.otpApiUrl;
        this.dashboardUrl = config.dashboardUrl;
        this.registerUrl = config.registerUrl;
        this.profileUrl = config.profileUrl || '/profile/'; // Add profile URL
        this.currentStep = 1;
        this.otpId = null;
        this.resendTimer = null;

        console.log('🚀 Direct Login Handler initialized');
        console.log('📍 API URLs:', {
            otp: this.otpApiUrl,
            dashboard: this.dashboardUrl,
            register: this.registerUrl,
            profile: this.profileUrl
        });

        this.init();
    }

    init() {
        this.bindEvents();
        this.setupOtpInputs();
        this.focusMobileInput();
    }

    bindEvents() {
        // Mobile number input events
        const mobileInput = document.getElementById('mobileNumber');
        mobileInput.addEventListener('input', this.validateMobile.bind(this));
        mobileInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !document.getElementById('sendOtp').disabled) {
                this.sendOtp();
            }
        });

        // Button events
        document.getElementById('sendOtp').addEventListener('click', this.sendOtp.bind(this));
        document.getElementById('verifyOtp').addEventListener('click', this.verifyOtp.bind(this));
        document.getElementById('backStep1').addEventListener('click', this.goToStep1.bind(this));
        document.getElementById('resendOtp').addEventListener('click', this.resendOtp.bind(this));
    }

    setupOtpInputs() {
        const otpInputs = document.querySelectorAll('.otp-input');

        otpInputs.forEach((input, index) => {
            // Auto-advance on input
            input.addEventListener('input', (e) => {
                const value = e.target.value;

                // Only allow digits
                if (!/^\d*$/.test(value)) {
                    e.target.value = '';
                    return;
                }

                if (value.length === 1 && index < otpInputs.length - 1) {
                    otpInputs[index + 1].focus();
                }
                this.validateOtp();
            });

            // Handle backspace
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    otpInputs[index - 1].focus();
                }
                if (e.key === 'Enter' && !document.getElementById('verifyOtp').disabled) {
                    this.verifyOtp();
                }
            });

            // Handle paste
            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const paste = (e.clipboardData || window.clipboardData).getData('text');
                const digits = paste.replace(/\D/g, '').slice(0, 6);

                digits.split('').forEach((digit, i) => {
                    if (otpInputs[i]) {
                        otpInputs[i].value = digit;
                    }
                });

                if (digits.length === 6) {
                    otpInputs[5].focus();
                }
                this.validateOtp();
            });
        });
    }

    focusMobileInput() {
        setTimeout(() => {
            document.getElementById('mobileNumber').focus();
        }, 100);
    }

    validateMobile() {
        const mobile = document.getElementById('mobileNumber').value;
        const sendBtn = document.getElementById('sendOtp');

        // Check if mobile number is valid (10 digits)
        if (mobile.length === 10 && /^\d+$/.test(mobile)) {
            sendBtn.disabled = false;
        } else {
            sendBtn.disabled = true;
        }
    }

    validateOtp() {
        const otpInputs = document.querySelectorAll('.otp-input');
        const otp = Array.from(otpInputs).map(input => input.value).join('');
        const verifyBtn = document.getElementById('verifyOtp');

        if (otp.length === 6 && /^\d{6}$/.test(otp)) {
            verifyBtn.disabled = false;
        } else {
            verifyBtn.disabled = true;
        }
    }

    async sendOtp() {
        const mobile = document.getElementById('mobileNumber').value;

        if (!mobile || mobile.length !== 10) {
            this.showError('Please enter a valid 10-digit mobile number');
            return;
        }

        this.showLoading('sendOtp', true);
        this.clearMessages();

        try {
            const response = await this.makeApiCall(this.otpApiUrl, {
                method: 'POST',
                body: JSON.stringify({ mobile: mobile })
            });

            if (response.success) {
                this.otpId = response.data.otp_id;
                this.goToStep2();
                this.startResendTimer();
                this.showSuccess('OTP sent successfully to your mobile number!');
                document.getElementById('displayMobile').textContent = this.formatMobile(mobile);

                // For development - show OTP in console
                if (response.data.otp) {
                    console.log('🔐 OTP for testing:', response.data.otp);
                }
                console.log('📱 OTP sent to mobile:', mobile);
                console.log('🆔 OTP ID:', this.otpId);
            } else {
                this.showError(response.error || 'Failed to send OTP. Please try again.');
            }
        } catch (error) {
            console.error('Error sending OTP:', error);
            this.showError('Network error. Please check your connection and try again.');
        } finally {
            this.showLoading('sendOtp', false);
        }
    }

    async resendOtp() {
        const mobile = document.getElementById('mobileNumber').value;
        this.clearMessages();

        try {
            const response = await this.makeApiCall(this.otpApiUrl, {
                method: 'POST',
                body: JSON.stringify({ mobile: mobile })
            });

            if (response.success) {
                this.otpId = response.data.otp_id;
                this.startResendTimer();
                this.showSuccess('OTP resent successfully!');
                this.clearOtpInputs();

                // For development - show OTP in console
                if (response.data.otp) {
                    console.log('🔐 Resent OTP for testing:', response.data.otp);
                }
                console.log('🔄 OTP resent. New OTP ID:', this.otpId);
            } else {
                this.showError(response.error || 'Failed to resend OTP');
            }
        } catch (error) {
            console.error('Error resending OTP:', error);
            this.showError('Failed to resend OTP. Please try again.');
        }
    }

    async verifyOtp() {
        const otpInputs = document.querySelectorAll('.otp-input');
        const otp = Array.from(otpInputs).map(input => input.value).join('');

        if (otp.length !== 6) {
            this.showError('Please enter the complete 6-digit OTP');
            return;
        }

        this.showLoading('verifyOtp', true);
        this.clearMessages();

        console.log('🔍 Verifying OTP:', otp);
        console.log('🆔 Using OTP ID:', this.otpId);

        try {
            const response = await this.makeApiCall(`${this.otpApiUrl}${this.otpId}/`, {
                method: 'PUT',
                body: JSON.stringify({
                    otp: otp,
                    user_type: 'buyer_individual' // Default for direct login
                })
            });

            if (response.success && response.data.otp_verified) {
                console.log('✅ OTP verification successful');
                console.log('👤 User data:', response.data);

                // Check if user details are completed
                if (response.data.user_details) {
                    // User is registered and profile is complete
                    console.log('✅ User profile is complete - redirecting to dashboard');
                    this.handleSuccessfulLogin(response.data);
                } else {
                    // User exists but profile is incomplete
                    console.log('⚠️ User profile is incomplete - redirecting to registration');
                    this.handleIncompleteProfile(response.data);
                }
            } else {
                // OTP verification failed
                console.log('❌ OTP verification failed:', response.data);
                const message = response.data?.message || 'Invalid OTP. Please try again.';
                this.showError(message);
                this.clearOtpInputs();
            }
        } catch (error) {
            console.error('Error verifying OTP:', error);
            this.showError('Verification failed. Please try again.');
            this.clearOtpInputs();
        } finally {
            this.showLoading('verifyOtp', false);
        }
    }

    handleSuccessfulLogin(userData) {
        // Store user information
        localStorage.setItem('user_id', userData.user_id);
        localStorage.setItem('login_timestamp', new Date().toISOString());

        console.log('🎉 Login successful for user:', userData.user_id);
        console.log('💾 Stored user data in localStorage');

        this.showSuccess('Login successful! Redirecting to your profile...');

        // Redirect to buyer profile page after a short delay
        setTimeout(() => {
            console.log('🚀 Redirecting to buyer profile:', this.profileUrl);
            window.location.href = this.profileUrl;
        }, 1500);
    }

    handleIncompleteProfile(userData) {
        console.log('📝 Profile incomplete for user:', userData.user_id);

        this.showError('Please complete your profile registration first.');

        // Store partial user data for registration completion
        localStorage.setItem('temp_user_id', userData.user_id);
        console.log('💾 Stored temp user ID for registration completion');

        setTimeout(() => {
            console.log('🚀 Redirecting to registration:', this.registerUrl);
            window.location.href = this.registerUrl;
        }, 2500);
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

    formatMobile(mobile) {
        // Format mobile number for display (e.g., +91 98765 43210)
        return `+91 ${mobile.slice(0, 5)} ${mobile.slice(5)}`;
    }

    goToStep1() {
        this.currentStep = 1;
        document.getElementById('step1').classList.remove('step-hidden');
        document.getElementById('step2').classList.add('step-hidden');
        document.getElementById('dot1').classList.add('active');
        document.getElementById('dot1').classList.remove('completed');
        document.getElementById('dot2').classList.remove('active');
        this.clearMessages();
        this.clearResendTimer();
        this.focusMobileInput();
    }

    goToStep2() {
        this.currentStep = 2;
        document.getElementById('step1').classList.add('step-hidden');
        document.getElementById('step2').classList.remove('step-hidden');
        document.getElementById('dot1').classList.remove('active');
        document.getElementById('dot1').classList.add('completed');
        document.getElementById('dot2').classList.add('active');
        this.clearMessages();

        // Focus first OTP input
        setTimeout(() => {
            document.querySelector('.otp-input').focus();
        }, 100);
    }

    startResendTimer() {
        let seconds = 30;
        const timerElement = document.getElementById('resendTimer');
        const resendLink = document.getElementById('resendOtp');

        timerElement.style.display = 'inline';
        resendLink.style.display = 'none';

        this.clearResendTimer(); // Clear any existing timer

        this.resendTimer = setInterval(() => {
            seconds--;
            timerElement.textContent = `Resend OTP in ${seconds}s`;

            if (seconds <= 0) {
                this.clearResendTimer();
                timerElement.style.display = 'none';
                resendLink.style.display = 'inline';
            }
        }, 1000);
    }

    clearResendTimer() {
        if (this.resendTimer) {
            clearInterval(this.resendTimer);
            this.resendTimer = null;
        }
    }

    clearOtpInputs() {
        document.querySelectorAll('.otp-input').forEach(input => {
            input.value = '';
        });
        document.querySelector('.otp-input').focus();
        this.validateOtp();
    }

    showLoading(buttonId, show) {
        const button = document.getElementById(buttonId);
        const textElement = button.querySelector('.btn-text');
        const icon = button.querySelector('i');

        if (show) {
            button.disabled = true;
            textElement.textContent = 'Please wait...';
            icon.className = 'loading ms-2';
        } else {
            button.disabled = false;
            if (buttonId === 'sendOtp') {
                textElement.textContent = 'Send OTP';
                icon.className = 'fas fa-paper-plane ms-2';
                this.validateMobile();
            } else if (buttonId === 'verifyOtp') {
                textElement.textContent = 'Login';
                icon.className = 'fas fa-sign-in-alt ms-2';
                this.validateOtp();
            }
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        const successDiv = document.getElementById('successMessage');

        successDiv.style.display = 'none';
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';

        // Auto-hide after 6 seconds
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 6000);
    }

    showSuccess(message) {
        const errorDiv = document.getElementById('errorMessage');
        const successDiv = document.getElementById('successMessage');

        errorDiv.style.display = 'none';
        successDiv.textContent = message;
        successDiv.style.display = 'block';

        // Auto-hide after 4 seconds
        setTimeout(() => {
            successDiv.style.display = 'none';
        }, 4000);
    }

    clearMessages() {
        document.getElementById('errorMessage').style.display = 'none';
        document.getElementById('successMessage').style.display = 'none';
    }
}

// Export for use in HTML
window.DirectLoginHandler = DirectLoginHandler;
