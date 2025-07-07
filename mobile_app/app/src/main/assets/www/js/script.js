// Application Controller
class App {
    constructor() {
        this.credentials = {
            username: 'admin',
            password: '123456'
        };
        
        this.init();
    }

    init() {
        // Check if user is already logged in
        if (this.isLoggedIn()) {
            this.showAdminPanel();
        } else {
            this.showLoginScreen();
        }
        
        this.setupLoginHandlers();
    }

    isLoggedIn() {
        return sessionStorage.getItem('isLoggedIn') === 'true';
    }

    setLoginState(isLoggedIn) {
        if (isLoggedIn) {
            sessionStorage.setItem('isLoggedIn', 'true');
        } else {
            sessionStorage.removeItem('isLoggedIn');
        }
    }

    showLoginScreen() {
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('admin-panel').style.display = 'none';
    }

    showAdminPanel() {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'flex';
        
        // Initialize admin panel if not already done
        if (!this.adminPanel) {
            this.adminPanel = new AdminPanel();
        }
    }

    setupLoginHandlers() {
        const loginForm = document.getElementById('login-form');
        const passwordToggle = document.getElementById('password-toggle');
        const logoutBtn = document.getElementById('logout-btn');

        // Login form submission
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Password visibility toggle
        passwordToggle.addEventListener('click', () => {
            this.togglePasswordVisibility();
        });

        // Logout functionality
        logoutBtn.addEventListener('click', () => {
            this.handleLogout();
        });

        // Auto-focus username field
        document.getElementById('username').focus();
    }

    async handleLogin() {
        const loginBtn = document.getElementById('login-btn');
        const errorElement = document.getElementById('login-error');
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        // Clear previous errors
        errorElement.style.display = 'none';

        // Add loading state
        this.setLoginLoading(true);

        // Simulate network delay for better UX
        await new Promise(resolve => setTimeout(resolve, 800));

        // Validate credentials
        if (username === this.credentials.username && password === this.credentials.password) {
            this.setLoginState(true);
            this.showAdminPanel();
            NotificationService.show('Login successful! Welcome to the admin panel.', 'success');
        } else {
            errorElement.style.display = 'flex';
            // Clear password field on error
            document.getElementById('password').value = '';
            document.getElementById('password').focus();
        }

        this.setLoginLoading(false);
    }

    handleLogout() {
        this.setLoginState(false);
        this.showLoginScreen();
        
        // Clear form
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        document.getElementById('login-error').style.display = 'none';
        
        NotificationService.show('You have been logged out successfully.', 'success');
    }

    togglePasswordVisibility() {
        const passwordInput = document.getElementById('password');
        const toggleIcon = document.querySelector('.toggle-icon');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.textContent = '🙈';
        } else {
            passwordInput.type = 'password';
            toggleIcon.textContent = '👁️';
        }
    }

    setLoginLoading(loading) {
        const loginBtn = document.getElementById('login-btn');
        const inputs = document.querySelectorAll('#login-form input');
        
        if (loading) {
            loginBtn.classList.add('loading');
            loginBtn.disabled = true;
            inputs.forEach(input => input.disabled = true);
        } else {
            loginBtn.classList.remove('loading');
            loginBtn.disabled = false;
            inputs.forEach(input => input.disabled = false);
        }
    }
}

// Admin Panel Controller
class AdminPanel {
    constructor() {
        this.init();
        this.setupNavigation();
        this.setupMobileToggle();
        this.initAudioModule();
    }

    init() {
        // Set up initial state
        this.currentSection = 'audio';
        this.sidebar = document.querySelector('.sidebar');
        this.sidebarToggle = document.getElementById('sidebar-toggle');
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                const tabId = link.getAttribute('data-tab');
                this.switchTab(tabId);
                
                // Update active state
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                // Close mobile menu if open
                this.sidebar.classList.remove('open');
            });
        });
    }

    setupMobileToggle() {
        if (this.sidebarToggle) {
            this.sidebarToggle.addEventListener('click', () => {
                this.sidebar.classList.toggle('open');
            });
        }

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                if (!this.sidebar.contains(e.target) && !this.sidebarToggle.contains(e.target)) {
                    this.sidebar.classList.remove('open');
                }
            }
        });
    }

    switchTab(tabId) {
        // Hide all sections
        const sections = document.querySelectorAll('.content-section');
        sections.forEach(section => section.classList.remove('active'));
        
        // Show selected section
        const targetSection = document.getElementById(`${tabId}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = tabId;
        }
    }

    initAudioModule() {
        this.audioModule = new AudioConfigModule();
    }
}

// Audio Configuration Module
class AudioConfigModule {
    constructor() {
        this.setupFileInputs();
        this.setupSubmitHandler();
    }

    setupFileInputs() {
        const fileInputs = document.querySelectorAll('input[type="file"]');
        
        fileInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                this.handleFileSelection(e.target);
            });
        });
    }

    handleFileSelection(input) {
        const button = input.parentElement.querySelector('.file-input-btn');
        const iconSpan = button.querySelector('.btn-icon');
        const textSpan = button.querySelector('.btn-text');
        
        if (input.files.length > 0) {
            const fileName = input.files[0].name;
            const truncatedName = fileName.length > 20 ? 
                fileName.substring(0, 17) + '...' : fileName;
            
            textSpan.textContent = truncatedName;
            iconSpan.textContent = '✅';
            button.classList.add('selected');
        } else {
            textSpan.textContent = 'Choose Audio File';
            iconSpan.textContent = '📁';
            button.classList.remove('selected');
        }
    }

    setupSubmitHandler() {
        const submitBtn = document.getElementById('submit-btn');
        
        submitBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await this.handleSubmit();
        });
    }

    async handleSubmit() {
        const submitBtn = document.getElementById('submit-btn');
        const originalContent = {
            icon: submitBtn.querySelector('.btn-icon').textContent,
            text: submitBtn.querySelector('.btn-text').textContent
        };

        try {
            // Add loading state
            this.setLoadingState(submitBtn, true);

            const formData = new FormData();
            const files = {
                success: document.getElementById('success-file').files[0],
                fail: document.getElementById('fail-file').files[0],
                nomask: document.getElementById('nomask-file').files[0]
            };

            // Validation
            const validation = this.validateFiles(files);
            if (!validation.isValid) {
                NotificationService.show(validation.message, 'warning');
                this.setLoadingState(submitBtn, false, originalContent);
                return;
            }

            // Append files to form data
            Object.entries(files).forEach(([key, file]) => {
                if (file) {
                    formData.append(key, file);
                }
            });

            // Submit to server
            const response = await fetch('/upload-audio', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                NotificationService.show('Audio files uploaded successfully!', 'success');
                this.resetForm();
            } else {
                const errorText = await response.text();
                NotificationService.show(`Upload failed: ${errorText}`, 'error');
            }

        } catch (error) {
            console.error('Upload error:', error);
            NotificationService.show('Network error occurred while uploading.', 'error');
        } finally {
            this.setLoadingState(submitBtn, false, originalContent);
        }
    }

    validateFiles(files) {
        const fileArray = Object.values(files).filter(file => file);
        
        if (fileArray.length === 0) {
            return {
                isValid: false,
                message: 'Please select at least one audio file to upload.'
            };
        }

        for (const file of fileArray) {
            if (!file.type.startsWith('audio/')) {
                return {
                    isValid: false,
                    message: 'Please select only audio files.'
                };
            }

            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                return {
                    isValid: false,
                    message: 'File size should not exceed 10MB.'
                };
            }
        }

        return { isValid: true };
    }

    setLoadingState(button, loading, originalContent = null) {
        if (loading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
            
            if (originalContent) {
                button.querySelector('.btn-icon').textContent = originalContent.icon;
                button.querySelector('.btn-text').textContent = originalContent.text;
            }
        }
    }

    resetForm() {
        const fileInputs = document.querySelectorAll('input[type="file"]');
        
        fileInputs.forEach(input => {
            input.value = '';
            this.handleFileSelection(input);
        });
    }
}

// Notification Service
class NotificationService {
    static show(message, type = 'info', duration = 4000) {
        // Remove existing notifications
        const existing = document.querySelector('.notification');
        if (existing) {
            existing.remove();
        }

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        // Add to DOM
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // Auto remove
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }, duration);
    }
}

// Utility Functions
class Utils {
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    
    // Make available globally for debugging
    window.app = app;
});

// Handle window resize for responsive behavior
window.addEventListener('resize', Utils.debounce(() => {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar && window.innerWidth > 768) {
        sidebar.classList.remove('open');
    }
}, 250));
