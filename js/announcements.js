// ========================================
// ANNOUNCEMENT SYSTEM FUNCTIONS
// ========================================

function loadReadAnnouncements() {
    const saved = localStorage.getItem("readAnnouncements");
    if (saved) {
        readAnnouncements = JSON.parse(saved);
    } else {
        readAnnouncements = [];
    }
}

function saveReadAnnouncements() {
    localStorage.setItem("readAnnouncements", JSON.stringify(readAnnouncements));
}

function markAnnouncementRead(timestamp) {
    if (!readAnnouncements.includes(timestamp)) {
        readAnnouncements.push(timestamp);
        saveReadAnnouncements();
        updateAnnouncementBadge();
        
        const btn = document.querySelector(`.mark-read-btn[data-timestamp="${timestamp}"]`);
        if (btn) {
            btn.innerHTML = '<i class="fas fa-check"></i> Read';
            btn.classList.add('read');
            btn.disabled = true;
        }
        
        showToast("Marked as read", 1000);
    }
}

function markAllAnnouncementsRead() {
    announcements.forEach(ann => {
        if (!readAnnouncements.includes(ann.timestamp)) {
            readAnnouncements.push(ann.timestamp);
        }
    });
    saveReadAnnouncements();
    updateAnnouncementBadge();
    renderAnnouncements();
    showToast("All announcements marked as read", 1500);
}

function getUnreadCount() {
    if (!announcements.length) return 0;
    let count = 0;
    announcements.forEach(ann => {
        if (!readAnnouncements.includes(ann.timestamp)) {
            count++;
        }
    });
    return count;
}

function updateAnnouncementBadge() {
    const count = getUnreadCount();
    const badge = document.getElementById("announcementBadge");
    if (badge) {
        if (count > 0) {
            badge.style.display = "flex";
            badge.innerText = count > 99 ? "99+" : count;
        } else {
            badge.style.display = "none";
        }
    }
}

async function fetchAnnouncements() {
    try {
        const response = await fetch(`${GOOGLE_SHEETS_URL}?action=getAnnouncements`);
        announcements = await response.json();
        updateAnnouncementBadge();
        return announcements;
    } catch (error) {
        console.error("Fetch announcements error:", error);
        return [];
    }
}

function getTypeClass(type) {
    const types = {
        'sale': 'type-sale',
        'promo': 'type-promo',
        'holiday': 'type-holiday',
        'alert': 'type-alert',
        'general': 'type-general'
    };
    return types[type] || 'type-general';
}

function getTypeLabel(type) {
    const labels = {
        'sale': '🔥 SALE',
        'promo': '🎁 PROMO',
        'holiday': '🎉 HOLIDAY',
        'alert': '⚠️ ALERT',
        'general': 'ℹ️ INFO'
    };
    return labels[type] || 'ℹ️ INFO';
}

function getPriorityClass(priority) {
    const classes = {
        'high': 'priority-high',
        'medium': 'priority-medium',
        'low': 'priority-low'
    };
    return classes[priority] || '';
}

function renderAnnouncements() {
    const container = document.getElementById("announcementContainer");
    if (!container) return;
    
    if (!announcements.length) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-bell-slash"></i>
                <p>No announcements yet</p>
                <p style="font-size: 0.75rem;">Check back later for updates!</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    announcements.forEach(ann => {
        const isRead = readAnnouncements.includes(ann.timestamp);
        const typeClass = getTypeClass(ann.type);
        const priorityClass = getPriorityClass(ann.priority);
        
        html += `
            <div class="announcement-item ${priorityClass}" data-timestamp="${ann.timestamp}">
                <span class="announcement-type ${typeClass}">${getTypeLabel(ann.type)}</span>
                <div class="announcement-header">
                    <div class="announcement-icon-display">${ann.icon || '📢'}</div>
                    <div class="announcement-title">
                        <h3>${escapeHtml(ann.header)}</h3>
                        <div class="announcement-date">
                            <i class="fas fa-calendar-alt"></i> ${ann.date}
                            ${!isRead ? '<span class="new-badge">NEW</span>' : ''}
                        </div>
                    </div>
                </div>
                <div class="announcement-content">
                    ${escapeHtml(ann.content)}
                </div>
                <div class="announcement-actions">
                    ${ann.link ? `<a href="${ann.link}" target="_blank" class="announcement-btn"><i class="fas fa-external-link-alt"></i> ${ann.linkText}</a>` : ''}
                    <button class="announcement-btn mark-read-btn ${isRead ? 'read' : ''}" data-timestamp="${ann.timestamp}" ${isRead ? 'disabled' : ''} onclick="markAnnouncementRead('${ann.timestamp}')">
                        <i class="fas ${isRead ? 'fa-check' : 'fa-eye'}"></i> ${isRead ? 'Read' : 'Mark as read'}
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

async function openAnnouncementModal() {
    const modal = document.getElementById("announcementModal");
    if (!modal) return;
    
    const container = document.getElementById("announcementContainer");
    if (container) {
        container.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Loading announcements...</div>';
    }
    
    modal.classList.add("show");
    
    await fetchAnnouncements();
    renderAnnouncements();
    updateAnnouncementBadge();
}

function closeAnnouncementModal() {
    const modal = document.getElementById("announcementModal");
    if (modal) modal.classList.remove("show");
}

function startAnnouncementAutoRefresh() {
    if (announcementRefreshInterval) clearInterval(announcementRefreshInterval);
    announcementRefreshInterval = setInterval(async () => {
        await fetchAnnouncements();
        if (document.getElementById("announcementModal")?.classList.contains("show")) {
            renderAnnouncements();
        }
        updateAnnouncementBadge();
    }, 30000);
}