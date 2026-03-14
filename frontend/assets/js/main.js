/**
 * AUTOLIVE - Main JavaScript File
 * Version: 1.0.0
 */

// ========================================
// GLOBAL VARIABLES
// ========================================

const AUTOLIVE = {
    config: {
        apiUrl: '/api',
        appName: 'AutoLive',
        version: '1.0.0',
        debug: true
    },
    
    state: {
        user: null,
        sidebarCollapsed: false,
        currentPage: 'dashboard',
        notifications: [],
        theme: 'light'
    },
    
    cache: {}
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

const Utils = {
    /**
     * Format number to currency
     */
    formatCurrency: (number, currency = 'IDR') => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0
        }).format(number);
    },

    /**
     * Format number with compact notation (1K, 1M, etc)
     */
    formatNumber: (number) => {
        if (number >= 1000000) {
            return (number / 1000000).toFixed(1) + 'M';
        }
        if (number >= 1000) {
            return (number / 1000).toFixed(1) + 'K';
        }
        return number.toString();
    },

    /**
     * Format date
     */
    formatDate: (date, format = 'DD/MM/YYYY') => {
        const d = new Date(date);
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        
        return format
            .replace('DD', day)
            .replace('MM', month)
            .replace('YYYY', year);
    },

    /**
     * Format time ago (2 hours ago, etc)
     */
    timeAgo: (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + ' tahun yang lalu';
        
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + ' bulan yang lalu';
        
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + ' hari yang lalu';
        
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + ' jam yang lalu';
        
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + ' menit yang lalu';
        
        return 'baru saja';
    },

    /**
     * Generate random ID
     */
    generateId: () => {
        return '_' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Debounce function
     */
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle function
     */
    throttle: (func, limit) => {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Copy to clipboard
     */
    copyToClipboard: (text) => {
        navigator.clipboard.writeText(text).then(() => {
            Notification.show('Teks berhasil disalin!', 'success');
        }).catch(() => {
            Notification.show('Gagal menyalin teks', 'error');
        });
    },

    /**
     * Download file
     */
    downloadFile: (content, filename, type = 'text/plain') => {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    },

    /**
     * Validate email
     */
    isValidEmail: (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    /**
     * Validate URL
     */
    isValidUrl: (url) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },

    /**
     * Get URL parameters
     */
    getUrlParams: () => {
        const params = new URLSearchParams(window.location.search);
        const result = {};
        for (const [key, value] of params) {
            result[key] = value;
        }
        return result;
    },

    /**
     * Set URL parameters
     */
    setUrlParams: (params) => {
        const url = new URL(window.location.href);
        Object.keys(params).forEach(key => {
            url.searchParams.set(key, params[key]);
        });
        window.history.pushState({}, '', url);
    },

    /**
     * Detect mobile device
     */
    isMobile: () => {
        return window.innerWidth <= 768;
    },

    /**
     * Detect touch device
     */
    isTouchDevice: () => {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }
};

// ========================================
// API SERVICE
// ========================================

const API = {
    /**
     * Make API request
     */
    request: async (endpoint, options = {}) => {
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        };

        const config = { ...defaultOptions, ...options };

        try {
            const response = await fetch(AUTOLIVE.config.apiUrl + endpoint, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Terjadi kesalahan');
            }

            return data;
        } catch (error) {
            if (AUTOLIVE.config.debug) {
                console.error('API Error:', error);
            }
            throw error;
        }
    },

    /**
     * GET request
     */
    get: (endpoint) => {
        return API.request(endpoint);
    },

    /**
     * POST request
     */
    post: (endpoint, data) => {
        return API.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    /**
     * PUT request
     */
    put: (endpoint, data) => {
        return API.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    /**
     * DELETE request
     */
    delete: (endpoint) => {
        return API.request(endpoint, {
            method: 'DELETE'
        });
    },

    /**
     * Upload file
     */
    upload: async (endpoint, file, onProgress) => {
        const formData = new FormData();
        formData.append('file', file);

        const xhr = new XMLHttpRequest();
        
        return new Promise((resolve, reject) => {
            xhr.open('POST', AUTOLIVE.config.apiUrl + endpoint);
            xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('token')}`);

            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable && onProgress) {
                    const percent = (e.loaded / e.total) * 100;
                    onProgress(percent);
                }
            };

            xhr.onload = () => {
                if (xhr.status === 200) {
                    resolve(JSON.parse(xhr.response));
                } else {
                    reject(new Error('Upload failed'));
                }
            };

            xhr.onerror = () => reject(new Error('Upload failed'));
            xhr.send(formData);
        });
    }
};

// ========================================
// NOTIFICATION SYSTEM
// ========================================

const Notification = {
    show: (message, type = 'info', duration = 5000) => {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.innerHTML = `
            <i class="fas ${Notification.getIcon(type)}"></i>
            <span>${message}</span>
            <i class="fas fa-times close-alert" onclick="this.parentElement.remove()"></i>
        `;

        const container = document.getElementById('notification-container');
        if (!container) {
            const newContainer = document.createElement('div');
            newContainer.id = 'notification-container';
            newContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
            `;
            document.body.appendChild(newContainer);
            newContainer.appendChild(alert);
        } else {
            container.appendChild(alert);
        }

        setTimeout(() => {
            alert.remove();
        }, duration);
    },

    getIcon: (type) => {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    },

    success: (message) => Notification.show(message, 'success'),
    error: (message) => Notification.show(message, 'error'),
    warning: (message) => Notification.show(message, 'warning'),
    info: (message) => Notification.show(message, 'info')
};

// ========================================
// LOADING INDICATOR
// ========================================

const Loading = {
    show: (message = 'Loading...') => {
        const overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            flex-direction: column;
            gap: 20px;
        `;
        overlay.innerHTML = `
            <div class="spinner"></div>
            <div>${message}</div>
        `;
        document.body.appendChild(overlay);
    },

    hide: () => {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.remove();
        }
    }
};

// ========================================
// MODAL MANAGER
// ========================================

const Modal = {
    show: (options) => {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = options.id || 'modal-' + Utils.generateId();

        modal.innerHTML = `
            <div class="modal-content" style="max-width: ${options.width || '500px'}">
                <div class="modal-header">
                    <h3>${options.title || ''}</h3>
                    <button class="modal-close" onclick="Modal.hide('${modal.id}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${options.content || ''}
                </div>
                ${options.footer ? `
                    <div class="modal-footer">
                        ${options.footer}
                    </div>
                ` : ''}
            </div>
        `;

        document.body.appendChild(modal);

        if (options.onShow) {
            options.onShow();
        }

        return modal.id;
    },

    hide: (id) => {
        const modal = document.getElementById(id);
        if (modal) {
            modal.remove();
        }
    },

    hideAll: () => {
        document.querySelectorAll('.modal').forEach(modal => modal.remove());
    },

    confirm: (message, onConfirm, onCancel) => {
        const id = Modal.show({
            title: 'Konfirmasi',
            width: '400px',
            content: `<p>${message}</p>`,
            footer: `
                <button class="btn btn-secondary" onclick="Modal.hide('${id}'); if (onCancel) onCancel();">
                    Batal
                </button>
                <button class="btn btn-primary" onclick="Modal.hide('${id}'); if (onConfirm) onConfirm();">
                    Ya
                </button>
            `
        });
    }
};

// ========================================
// FORM VALIDATION
// ========================================

const Validator = {
    rules: {},

    addRule: (field, rules) => {
        Validator.rules[field] = rules;
    },

    validate: (form) => {
        const errors = {};
        const formData = new FormData(form);

        Object.keys(Validator.rules).forEach(field => {
            const value = formData.get(field);
            const rules = Validator.rules[field];

            if (rules.required && !value) {
                errors[field] = rules.messages?.required || 'Field ini wajib diisi';
            }

            if (value && rules.minLength && value.length < rules.minLength) {
                errors[field] = rules.messages?.minLength || `Minimal ${rules.minLength} karakter`;
            }

            if (value && rules.maxLength && value.length > rules.maxLength) {
                errors[field] = rules.messages?.maxLength || `Maksimal ${rules.maxLength} karakter`;
            }

            if (value && rules.pattern && !rules.pattern.test(value)) {
                errors[field] = rules.messages?.pattern || 'Format tidak valid';
            }

            if (value && rules.email && !Utils.isValidEmail(value)) {
                errors[field] = rules.messages?.email || 'Email tidak valid';
            }
        });

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    },

    showErrors: (errors) => {
        document.querySelectorAll('.form-error').forEach(el => el.remove());
        document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));

        Object.keys(errors).forEach(field => {
            const input = document.querySelector(`[name="${field}"]`);
            if (input) {
                input.classList.add('error');
                const error = document.createElement('div');
                error.className = 'form-error';
                error.textContent = errors[field];
                input.parentNode.appendChild(error);
            }
        });
    },

    clearErrors: () => {
        document.querySelectorAll('.form-error').forEach(el => el.remove());
        document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    }
};

// ========================================
// SIDEBAR CONTROLLER
// ========================================

const Sidebar = {
    init: () => {
        const toggle = document.querySelector('.sidebar-toggle');
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');

        if (toggle && sidebar) {
            toggle.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
                mainContent.classList.toggle('expanded');
                
                const isCollapsed = sidebar.classList.contains('collapsed');
                localStorage.setItem('sidebarCollapsed', isCollapsed);
            });

            // Load saved state
            const savedState = localStorage.getItem('sidebarCollapsed');
            if (savedState === 'true') {
                sidebar.classList.add('collapsed');
                mainContent.classList.add('expanded');
            }
        }

        // Mobile sidebar
        if (Utils.isMobile()) {
            const overlay = document.createElement('div');
            overlay.className = 'sidebar-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                z-index: 90;
                display: none;
            `;
            document.body.appendChild(overlay);

            toggle.addEventListener('click', () => {
                sidebar.classList.add('active');
                overlay.style.display = 'block';
            });

            overlay.addEventListener('click', () => {
                sidebar.classList.remove('active');
                overlay.style.display = 'none';
            });
        }
    },

    setActive: (path) => {
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === path) {
                link.classList.add('active');
            }
        });
    }
};

// ========================================
// DARK MODE
// ========================================

const Theme = {
    init: () => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        Theme.set(savedTheme);

        const toggle = document.getElementById('darkModeToggle');
        if (toggle) {
            toggle.addEventListener('change', (e) => {
                Theme.set(e.target.checked ? 'dark' : 'light');
            });
        }
    },

    set: (theme) => {
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
            document.documentElement.style.setProperty('--bg-primary', '#1a202c');
            document.documentElement.style.setProperty('--bg-secondary', '#2d3748');
            document.documentElement.style.setProperty('--text-primary', '#f7fafc');
            document.documentElement.style.setProperty('--text-secondary', '#e2e8f0');
        } else {
            document.body.classList.remove('dark-theme');
            document.documentElement.style.setProperty('--bg-primary', '#ffffff');
            document.documentElement.style.setProperty('--bg-secondary', '#f7fafc');
            document.documentElement.style.setProperty('--text-primary', '#1a202c');
            document.documentElement.style.setProperty('--text-secondary', '#4a5568');
        }

        localStorage.setItem('theme', theme);
    },

    toggle: () => {
        const current = localStorage.getItem('theme') || 'light';
        Theme.set(current === 'light' ? 'dark' : 'light');
    }
};

// ========================================
// TABLE MANAGER
// ========================================

class DataTable {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' 
            ? document.getElementById(container) 
            : container;
        
        this.options = {
            pageSize: 10,
            currentPage: 1,
            searchable: true,
            sortable: true,
            ...options
        };

        this.data = options.data || [];
        this.filteredData = [...this.data];
        this.columns = options.columns || [];
        this.sortColumn = null;
        this.sortDirection = 'asc';

        this.init();
    }

    init() {
        this.render();
        this.initEvents();
    }

    render() {
        const start = (this.options.currentPage - 1) * this.options.pageSize;
        const end = start + this.options.pageSize;
        const pageData = this.filteredData.slice(start, end);

        let html = `
            <div class="table-responsive">
                <table class="table ${this.options.className || ''}">
                    <thead>
                        <tr>
                            ${this.columns.map(col => `
                                <th data-column="${col.field}" ${col.sortable !== false ? 'class="sortable"' : ''}>
                                    ${col.label}
                                    ${col.sortable !== false ? '<i class="fas fa-sort"></i>' : ''}
                                </th>
                            `).join('')}
                            ${this.options.actions ? '<th>Aksi</th>' : ''}
                        </tr>
                    </thead>
                    <tbody>
        `;

        if (pageData.length === 0) {
            html += `
                <tr>
                    <td colspan="${this.columns.length + (this.options.actions ? 1 : 0)}" class="text-center">
                        Tidak ada data
                    </td>
                </tr>
            `;
        } else {
            pageData.forEach(row => {
                html += '<tr>';
                this.columns.forEach(col => {
                    html += `<td>${col.render ? col.render(row[col.field], row) : row[col.field]}</td>`;
                });
                if (this.options.actions) {
                    html += `<td>
                        ${this.options.actions.map(action => `
                            <button class="btn-icon ${action.className || ''}" onclick="(${action.handler})(this, ${JSON.stringify(row)})">
                                <i class="fas fa-${action.icon}"></i>
                            </button>
                        `).join('')}
                    </td>`;
                }
                html += '</tr>';
            });
        }

        html += `
                    </tbody>
                </table>
            </div>
        `;

        if (this.options.pagination !== false) {
            html += this.renderPagination();
        }

        this.container.innerHTML = html;
    }

    renderPagination() {
        const totalPages = Math.ceil(this.filteredData.length / this.options.pageSize);
        
        return `
            <div class="pagination">
                <button class="btn btn-secondary btn-sm" ${this.options.currentPage === 1 ? 'disabled' : ''} 
                        onclick="this.dataTable.goToPage(${this.options.currentPage - 1})">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span>Halaman ${this.options.currentPage} dari ${totalPages}</span>
                <button class="btn btn-secondary btn-sm" ${this.options.currentPage === totalPages ? 'disabled' : ''} 
                        onclick="this.dataTable.goToPage(${this.options.currentPage + 1})">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;
    }

    initEvents() {
        if (this.options.sortable) {
            this.container.querySelectorAll('th.sortable').forEach(th => {
                th.addEventListener('click', () => {
                    const column = th.dataset.column;
                    this.sort(column);
                });
            });
        }

        if (this.options.searchable) {
            const searchInput = document.getElementById(this.options.searchInput);
            if (searchInput) {
                const debouncedSearch = Utils.debounce((value) => {
                    this.search(value);
                }, 300);

                searchInput.addEventListener('input', (e) => {
                    debouncedSearch(e.target.value);
                });
            }
        }
    }

    sort(column) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }

        this.filteredData.sort((a, b) => {
            let valA = a[column];
            let valB = b[column];

            if (typeof valA === 'string') {
                valA = valA.toLowerCase();
                valB = valB.toLowerCase();
            }

            if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        this.render();
    }

    search(keyword) {
        if (!keyword) {
            this.filteredData = [...this.data];
        } else {
            keyword = keyword.toLowerCase();
            this.filteredData = this.data.filter(row => {
                return this.columns.some(col => {
                    const value = row[col.field];
                    return value && value.toString().toLowerCase().includes(keyword);
                });
            });
        }

        this.options.currentPage = 1;
        this.render();
    }

    goToPage(page) {
        this.options.currentPage = page;
        this.render();
    }

    setData(newData) {
        this.data = newData;
        this.filteredData = [...newData];
        this.options.currentPage = 1;
        this.render();
    }

    refresh() {
        this.render();
    }
}

// ========================================
// CHART INITIALIZATION
// ========================================

const Charts = {
    initLineChart: (ctx, data, options = {}) => {
        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: data.datasets.map(dataset => ({
                    ...dataset,
                    borderColor: dataset.color || '#667eea',
                    backgroundColor: dataset.backgroundColor || 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: dataset.fill || false
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: options.showLegend !== false,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            display: true,
                            color: 'rgba(0,0,0,0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                ...options
            }
        });
    },

    initBarChart: (ctx, data, options = {}) => {
        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: data.datasets.map(dataset => ({
                    ...dataset,
                    backgroundColor: dataset.backgroundColor || '#667eea'
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: options.showLegend !== false,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            display: true,
                            color: 'rgba(0,0,0,0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                ...options
            }
        });
    },

    initPieChart: (ctx, data, options = {}) => {
        return new Chart(ctx, {
            type: 'pie',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: data.colors || [
                        '#667eea', '#764ba2', '#f687b3', '#f6ad55', '#68d391'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                },
                ...options
            }
        });
    },

    initDoughnutChart: (ctx, data, options = {}) => {
        return new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: data.colors || [
                        '#667eea', '#764ba2', '#f687b3', '#f6ad55', '#68d391'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                },
                ...options
            }
        });
    }
};

// ========================================
// DRAG AND DROP UTILITY
// ========================================

const DragDrop = {
    init: (container, options = {}) => {
        const items = container.querySelectorAll(options.itemSelector || '.draggable');
        
        items.forEach(item => {
            item.setAttribute('draggable', true);
            
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', item.id);
                item.classList.add('dragging');
                
                if (options.onDragStart) {
                    options.onDragStart(e, item);
                }
            });

            item.addEventListener('dragend', (e) => {
                item.classList.remove('dragging');
                
                if (options.onDragEnd) {
                    options.onDragEnd(e, item);
                }
            });
        });

        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            container.classList.add('drag-over');
            
            if (options.onDragOver) {
                options.onDragOver(e);
            }
        });

        container.addEventListener('dragleave', (e) => {
            container.classList.remove('drag-over');
            
            if (options.onDragLeave) {
                options.onDragLeave(e);
            }
        });

        container.addEventListener('drop', (e) => {
            e.preventDefault();
            container.classList.remove('drag-over');
            
            const id = e.dataTransfer.getData('text/plain');
            const draggable = document.getElementById(id);
            
            if (draggable && options.onDrop) {
                options.onDrop(e, draggable);
            }
        });
    }
};

// ========================================
// FILE UPLOAD HANDLER
// ========================================

class FileUpload {
    constructor(input, options = {}) {
        this.input = typeof input === 'string' 
            ? document.getElementById(input) 
            : input;
        
        this.options = {
            maxSize: 10 * 1024 * 1024, // 10MB
            allowedTypes: ['image/*', 'video/*'],
            multiple: false,
            onStart: () => {},
            onProgress: () => {},
            onSuccess: () => {},
            onError: () => {},
            ...options
        };

        this.files = [];
        this.init();
    }

    init() {
        this.input.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });

        if (this.options.dropzone) {
            this.initDropzone();
        }
    }

    initDropzone() {
        const dropzone = document.querySelector(this.options.dropzone);
        
        if (!dropzone) return;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        dropzone.addEventListener('dragenter', () => {
            dropzone.classList.add('drag-over');
        });

        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('drag-over');
        });

        dropzone.addEventListener('drop', (e) => {
            dropzone.classList.remove('drag-over');
            this.handleFiles(e.dataTransfer.files);
        });

        dropzone.addEventListener('click', () => {
            this.input.click();
        });
    }

    handleFiles(fileList) {
        const files = Array.from(fileList);
        
        files.forEach(file => {
            if (!this.validateFile(file)) {
                return;
            }

            this.files.push(file);
            this.uploadFile(file);
        });

        if (this.options.onFilesSelected) {
            this.options.onFilesSelected(this.files);
        }
    }

    validateFile(file) {
        if (file.size > this.options.maxSize) {
            Notification.error(`File ${file.name} terlalu besar. Maksimal ${this.options.maxSize / 1024 / 1024}MB`);
            return false;
        }

        const fileType = file.type;
        const isValid = this.options.allowedTypes.some(type => {
            if (type.endsWith('/*')) {
                const category = type.replace('/*', '');
                return fileType.startsWith(category);
            }
            return type === fileType;
        });

        if (!isValid) {
            Notification.error(`Tipe file ${file.name} tidak diizinkan`);
            return false;
        }

        return true;
    }

    async uploadFile(file) {
        this.options.onStart(file);

        try {
            const result = await API.upload(this.options.endpoint, file, (progress) => {
                this.options.onProgress(file, progress);
            });

            this.options.onSuccess(result, file);
            Notification.success(`File ${file.name} berhasil diupload`);
        } catch (error) {
            this.options.onError(error, file);
            Notification.error(`Gagal upload ${file.name}: ${error.message}`);
        }
    }

    reset() {
        this.files = [];
        this.input.value = '';
    }
}

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize sidebar
    Sidebar.init();

    // Initialize theme
    Theme.init();

    // Set active menu
    const currentPath = window.location.pathname;
    Sidebar.setActive(currentPath);

    // Initialize tooltips
    document.querySelectorAll('[data-tooltip]').forEach(el => {
        // Tooltips are handled by CSS
    });

    // Initialize dropdowns
    document.querySelectorAll('.dropdown').forEach(dropdown => {
        const toggle = dropdown.querySelector('.dropdown-toggle');
        if (toggle) {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                dropdown.classList.toggle('active');
            });
        }
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.dropdown')) {
            document.querySelectorAll('.dropdown.active').forEach(dropdown => {
                dropdown.classList.remove('active');
            });
        }
    });

    // Initialize modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            if (modal) {
                modal.classList.remove('active');
            }
        });
    });

    // Initialize alert close buttons
    document.querySelectorAll('.close-alert').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.alert').remove();
        });
    });

    console.log(`AutoLive v${AUTOLIVE.config.version} initialized`);
});

// ========================================
// EXPORT MODULES
// ========================================

window.AUTOLIVE = AUTOLIVE;
window.Utils = Utils;
window.API = API;
window.Notification = Notification;
window.Loading = Loading;
window.Modal = Modal;
window.Validator = Validator;
window.Sidebar = Sidebar;
window.Theme = Theme;
window.DataTable = DataTable;
window.Charts = Charts;
window.DragDrop = DragDrop;
window.FileUpload = FileUpload;
