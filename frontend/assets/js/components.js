/**
 * AUTOLIVE - Reusable Components
 * Version: 1.0.0
 */

// ========================================
// HEADER COMPONENT
// ========================================

const HeaderComponent = {
    render: (options = {}) => {
        const user = options.user || JSON.parse(localStorage.getItem('user') || '{}');
        const notifications = options.notifications || [];
        
        return `
            <nav class="navbar">
                <div class="navbar-left">
                    <button class="navbar-toggle sidebar-toggle">
                        <i class="fas fa-bars"></i>
                    </button>
                    <div class="navbar-search">
                        <i class="fas fa-search"></i>
                        <input type="text" placeholder="Cari..." id="globalSearch">
                    </div>
                </div>
                
                <div class="navbar-right">
                    <div class="navbar-notification dropdown">
                        <button class="navbar-toggle" onclick="this.closest('.dropdown').classList.toggle('active')">
                            <i class="far fa-bell"></i>
                            ${notifications.length > 0 ? `
                                <span class="notification-badge">${notifications.length}</span>
                            ` : ''}
                        </button>
                        <div class="dropdown-menu">
                            ${notifications.length > 0 ? 
                                notifications.slice(0, 5).map(n => `
                                    <a href="#" class="dropdown-item">
                                        <i class="fas fa-${n.icon || 'info-circle'}"></i>
                                        <div>
                                            <div>${n.message}</div>
                                            <small class="text-gray-500">${Utils.timeAgo(n.time)}</small>
                                        </div>
                                    </a>
                                `).join('') +
                                '<a href="#" class="dropdown-item text-center">Lihat semua notifikasi</a>'
                                : '<div class="dropdown-item text-center">Tidak ada notifikasi</div>'
                            }
                        </div>
                    </div>
                    
                    <div class="navbar-user dropdown">
                        <div class="navbar-avatar" onclick="this.closest('.dropdown').classList.toggle('active')">
                            ${user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div class="dropdown-menu">
                            <div class="dropdown-item">
                                <i class="fas fa-user"></i>
                                <div>
                                    <div>${user.name || 'User'}</div>
                                    <small class="text-gray-500">${user.email || ''}</small>
                                </div>
                            </div>
                            <div class="dropdown-divider"></div>
                            <a href="/settings/account.html" class="dropdown-item">
                                <i class="fas fa-cog"></i> Pengaturan Akun
                            </a>
                            <a href="#" class="dropdown-item" onclick="Theme.toggle()">
                                <i class="fas fa-moon"></i> Mode Gelap
                            </a>
                            <div class="dropdown-divider"></div>
                            <a href="#" class="dropdown-item text-danger" onclick="Auth.logout()">
                                <i class="fas fa-sign-out-alt"></i> Logout
                            </a>
                        </div>
                    </div>
                </div>
            </nav>
        `;
    },

    init: () => {
        // Global search
        const searchInput = document.getElementById('globalSearch');
        if (searchInput) {
            const debouncedSearch = Utils.debounce((value) => {
                // Trigger global search
                console.log('Searching:', value);
            }, 500);

            searchInput.addEventListener('input', (e) => {
                debouncedSearch(e.target.value);
            });
        }
    }
};

// ========================================
// SIDEBAR COMPONENT
// ========================================

const SidebarComponent = {
    render: (options = {}) => {
        const activePath = options.activePath || window.location.pathname;
        const collapsed = options.collapsed || false;
        
        const menuItems = [
            { icon: 'home', label: 'Dashboard', path: '/dashboard/home.html' },
            { icon: 'chart-line', label: 'Analytics', path: '/dashboard/analytics.html' },
            { icon: 'fire', label: 'Viral Discovery', path: '/viral-discovery/index.html' },
            { icon: 'users', label: 'Channel Manager', path: '/channel-manager/index.html' },
            { icon: 'clock', label: 'Scheduler', path: '/automation/scheduler.html' },
            { icon: 'tasks', label: 'Queue', path: '/automation/queue.html' },
            { icon: 'project-diagram', label: 'Workflow Builder', path: '/workflow-builder/index.html' },
            { icon: 'robot', label: 'App Builder', path: '/automation-app-builder/index.html' },
            { icon: 'file-alt', label: 'Reports', path: '/reports/uploads.html' }
        ];

        const bottomMenuItems = [
            { icon: 'cog', label: 'Settings', path: '/settings/account.html' },
            { icon: 'question-circle', label: 'Help', path: '/help.html' }
        ];

        return `
            <div class="sidebar ${collapsed ? 'collapsed' : ''}">
                <div class="sidebar-header">
                    <h3>${collapsed ? 'AL' : 'AutoLive'}</h3>
                </div>
                
                <div class="sidebar-menu">
                    ${menuItems.map(item => `
                        <div class="sidebar-item">
                            <a href="${item.path}" class="sidebar-link ${activePath === item.path ? 'active' : ''}">
                                <i class="fas fa-${item.icon}"></i>
                                <span>${item.label}</span>
                            </a>
                        </div>
                    `).join('')}
                </div>
                
                <div class="sidebar-footer">
                    ${bottomMenuItems.map(item => `
                        <div class="sidebar-item">
                            <a href="${item.path}" class="sidebar-link ${activePath === item.path ? 'active' : ''}">
                                <i class="fas fa-${item.icon}"></i>
                                <span>${item.label}</span>
                            </a>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
};

// ========================================
// STATS CARD COMPONENT
// ========================================

const StatsCardComponent = {
    render: (stats) => {
        return stats.map(stat => `
            <div class="stat-card">
                <div class="stat-info">
                    <h3>${stat.label}</h3>
                    <div class="stat-number">${Utils.formatNumber(stat.value)}</div>
                    ${stat.change ? `
                        <div class="stat-change ${stat.change > 0 ? 'text-success' : 'text-danger'}">
                            <i class="fas fa-${stat.change > 0 ? 'arrow-up' : 'arrow-down'}"></i>
                            ${Math.abs(stat.change)}% dari bulan lalu
                        </div>
                    ` : ''}
                </div>
                <div class="stat-icon ${stat.color || 'primary'}">
                    <i class="fas fa-${stat.icon}"></i>
                </div>
            </div>
        `).join('');
    }
};

// ========================================
// VIDEO CARD COMPONENT
// ========================================

const VideoCardComponent = {
    render: (video) => {
        return `
            <div class="video-card" data-video-id="${video.id}" onclick="VideoPlayer.play('${video.id}')">
                <div class="video-thumbnail">
                    <img src="${video.thumbnail || 'https://via.placeholder.com/320x180'}" alt="${video.title}">
                    <span class="video-duration">${video.duration || '0:00'}</span>
                    ${video.viralityScore ? `
                        <span class="virality-score">
                            <i class="fas fa-fire"></i> ${video.viralityScore}
                        </span>
                    ` : ''}
                </div>
                <div class="video-info">
                    <h4 class="video-title">${video.title}</h4>
                    <div class="video-meta">
                        <span><i class="fas fa-user"></i> ${video.channel || 'Unknown'}</span>
                        <span>${Utils.timeAgo(video.publishedAt)}</span>
                    </div>
                    <div class="video-stats">
                        <span class="video-stat">
                            <i class="fas fa-eye"></i> ${Utils.formatNumber(video.views || 0)}
                        </span>
                        <span class="video-stat">
                            <i class="fas fa-heart"></i> ${Utils.formatNumber(video.likes || 0)}
                        </span>
                        <span class="video-stat">
                            <i class="fas fa-comment"></i> ${Utils.formatNumber(video.comments || 0)}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }
};

// ========================================
// CHART CARD COMPONENT
// ========================================

const ChartCardComponent = {
    render: (chart) => {
        return `
            <div class="chart-card">
                <div class="chart-header">
                    <h3>${chart.title}</h3>
                    ${chart.actions ? `
                        <div class="chart-actions">
                            ${chart.actions}
                        </div>
                    ` : ''}
                </div>
                <div class="chart-container">
                    <canvas id="${chart.id}"></canvas>
                </div>
            </div>
        `;
    }
};

// ========================================
// TABLE COMPONENT
// ========================================

const TableComponent = {
    render: (options) => {
        const { id, columns, data, actions } = options;
        
        return `
            <div class="table-responsive">
                <table class="table" id="${id}">
                    <thead>
                        <tr>
                            ${columns.map(col => `
                                <th>${col.label}</th>
                            `).join('')}
                            ${actions ? '<th>Aksi</th>' : ''}
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(row => `
                            <tr>
                                ${columns.map(col => `
                                    <td>${col.render ? col.render(row[col.field], row) : row[col.field]}</td>
                                `).join('')}
                                ${actions ? `
                                    <td>
                                        ${actions.map(action => `
                                            <button class="btn-icon ${action.className || ''}" 
                                                    onclick="(${action.handler})(this, ${JSON.stringify(row)})">
                                                <i class="fas fa-${action.icon}"></i>
                                            </button>
                                        `).join('')}
                                    </td>
                                ` : ''}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
};

// ========================================
// MODAL COMPONENT
// ========================================

const ModalComponent = {
    create: (options) => {
        const id = 'modal-' + Utils.generateId();
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = id;
        modal.innerHTML = `
            <div class="modal-content" style="max-width: ${options.width || '500px'}">
                <div class="modal-header">
                    <h3>${options.title || ''}</h3>
                    <button class="modal-close" onclick="Modal.hide('${id}')">
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
        
        if (options.onCreate) {
            options.onCreate(modal);
        }
        
        return id;
    }
};

// ========================================
// LOADING COMPONENT
// ========================================

const LoadingComponent = {
    show: (message = 'Loading...', fullscreen = true) => {
        if (fullscreen) {
            Loading.show(message);
        } else {
            const spinner = document.createElement('div');
            spinner.className = 'text-center p-5';
            spinner.innerHTML = `
                <div class="spinner"></div>
                <div class="mt-3">${message}</div>
            `;
            return spinner;
        }
    },
    
    hide: () => {
        Loading.hide();
    }
};

// ========================================
// EXPORT COMPONENTS
// ========================================

window.HeaderComponent = HeaderComponent;
window.SidebarComponent = SidebarComponent;
window.StatsCardComponent = StatsCardComponent;
window.VideoCardComponent = VideoCardComponent;
window.ChartCardComponent = ChartCardComponent;
window.TableComponent = TableComponent;
window.ModalComponent = ModalComponent;
window.LoadingComponent = LoadingComponent;
