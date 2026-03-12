document.addEventListener('DOMContentLoaded', () => {
    const navMenu = document.getElementById('nav-menu');
    const dashboardContainer = document.getElementById('dashboard-container');
    const placeholderView = document.getElementById('placeholder-view');
    const brandLink = document.getElementById('brand-link');

    let dashboardsData = [];

    // --- Fetch Data ---
    fetch('data/dashboards.json')
        .then(response => response.json())
        .then(data => {
            dashboardsData = data;
            renderNavigation(data);
            handleRouting();
        })
        .catch(error => {
            console.error('Error loading dashboards data:', error);
        });

    // --- Render Navigation ---
    function renderNavigation(data) {
        navMenu.innerHTML = '';
        const grouped = groupByCategory(data);

        for (const [category, items] of Object.entries(grouped)) {
            const categoryEl = document.createElement('li');
            categoryEl.className = 'nav-item';
            
            categoryEl.innerHTML = `
                <span class="nav-link">${category} <span class="nav-arrow">▾</span></span>
                <div class="nav-dropdown">
                    ${items.map(item => `
                        <label class="dropdown-item ${!item.iframeSrc && item.category !== 'Textual' && item.category !== 'Social Issues' ? 'disabled' : ''}" 
                               data-id="${item.id}">
                            ${item.title}
                        </label>
                    `).join('')}
                </div>
            `;

            // Click events on dropdown items
            const dropdownItems = categoryEl.querySelectorAll('.dropdown-item:not(.disabled)');
            dropdownItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    const id = e.target.getAttribute('data-id');
                    loadDashboard(id);
                });
            });

            navMenu.appendChild(categoryEl);
        }
    }

    // --- Group Data Helper ---
    function groupByCategory(data) {
        // Keep original order
        const order = [
            "Business & Economics",
            "Entertainment",
            "Society & Environment",
            "Technology & Digital"
        ];
        
        const grouped = data.reduce((acc, item) => {
            if (!acc[item.category]) acc[item.category] = [];
            acc[item.category].push(item);
            return acc;
        }, {});

        // Sort by predefined order
        const sorted = {};
        order.forEach(cat => {
            if (grouped[cat]) sorted[cat] = grouped[cat];
        });
        // Add any remaining categories not in order array
        Object.keys(grouped).forEach(cat => {
            if (!sorted[cat]) sorted[cat] = grouped[cat];
        });

        return sorted;
    }

    // --- Load Dashboard ---
    window.loadDashboard = function(id) {
        const dashboard = dashboardsData.find(d => d.id === id);
        if (!dashboard) return;

        // 1. Update Navigation Active States
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.dropdown-item').forEach(el => el.classList.remove('active'));

        const activeDropdownItem = document.querySelector(`.dropdown-item[data-id="${id}"]`);
        if (activeDropdownItem) {
            activeDropdownItem.classList.add('active');
            activeDropdownItem.closest('.nav-item').classList.add('active');
        }

        // 2. Hide Placeholder
        if (placeholderView) {
            placeholderView.style.display = 'none';
        }

        // 3. Clear existing dashboard contents
        document.querySelectorAll('.dashboard-content').forEach(el => el.remove());

        // 4. Generate Dashboard Content Container
        const contentHtml = `
            <div class="dashboard-content" id="content-${id}" style="display:flex;">
                <!-- Page 1: Dashboard Iframe -->
                <div class="dashboard-page">
                    ${dashboard.iframeSrc 
                        ? `<iframe title="${dashboard.title}" class="dashboard-iframe" src="${dashboard.iframeSrc}" allowFullScreen="true"></iframe>`
                        : `<div class="dashboard-fallback">
                               <h3>${dashboard.title}</h3>
                               <p>Your Power BI dashboard will be displayed here.</p>
                               <small>Add an iframe link to dashboards.json to view it.</small>
                           </div>`
                    }
                    <div class="scroll-indicator-bar down" onclick="this.parentElement.nextElementSibling.scrollIntoView({ behavior: 'smooth' })">
                        Scroll down for details <span>▾</span>
                    </div>
                </div>
                
                <!-- Page 2: Details -->
                <div class="dashboard-page dashboard-details">
                    <div class="scroll-indicator-bar up" onclick="this.parentElement.previousElementSibling.scrollIntoView({ behavior: 'smooth' })">
                        <span>▴</span> Scroll up for dashboard
                    </div>
                    <div class="detail-content-area">
                        <div class="detail-header">
                            <h2>${dashboard.title}</h2>
                            <p>Dashboard Analysis & Details</p>
                        </div>
                        <div class="detail-body">
                            <p>${dashboard.description || "Detailed analysis for this dashboard will be shown here."}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Inject into container
        dashboardContainer.insertAdjacentHTML('beforeend', contentHtml);

        // Update URL hash
        window.location.hash = id;
    };

    // --- Routing (Hash Change) ---
    function handleRouting() {
        const hash = window.location.hash.substring(1);
        if (hash) {
            loadDashboard(hash);
        } else {
            resetToHome();
        }
    }

    window.addEventListener('hashchange', handleRouting);

    function resetToHome() {
        // Clear hash
        history.replaceState(null, null, ' ');
        // Remove active classes
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.dropdown-item').forEach(el => el.classList.remove('active'));
        // Clear injected dashboards
        document.querySelectorAll('.dashboard-content').forEach(el => el.remove());
        // Show placeholder
        if (placeholderView) {
            placeholderView.style.display = 'flex';
        }
    }

    // Brand click returns to home
    if(brandLink) {
        brandLink.addEventListener('click', (e) => {
            e.preventDefault();
            resetToHome();
        });
    }
});
