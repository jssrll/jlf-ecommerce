// ========================================
// ADMIN ANNOUNCEMENT MANAGEMENT
// ========================================

async function publishAnnouncement() {
    if (!isAdmin) {
        showToast("Admin access required", 1500);
        return;
    }
    
    const header = document.getElementById("annHeader").value;
    const content = document.getElementById("annContent").value;
    const type = document.getElementById("annType").value;
    const priority = document.getElementById("annPriority").value;
    const icon = document.getElementById("annIcon").value;
    const link = document.getElementById("annLink").value;
    const linkText = document.getElementById("annLinkText").value;
    const expiryDate = document.getElementById("annExpiry").value;
    
    if (!header || !content) {
        showToast("Please fill in header and content", 1500);
        return;
    }
    
    const publishBtn = event.target;
    const originalText = publishBtn.innerHTML;
    publishBtn.disabled = true;
    publishBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publishing...';
    
    try {
        const formData = new URLSearchParams();
        formData.append("action", "addAnnouncement");
        formData.append("timestamp", new Date().toISOString());
        formData.append("date", new Date().toLocaleDateString());
        formData.append("header", header);
        formData.append("content", content);
        formData.append("type", type);
        formData.append("priority", priority);
        formData.append("icon", icon);
        formData.append("link", link);
        formData.append("linkText", linkText);
        formData.append("expiryDate", expiryDate);
        formData.append("publishedBy", "Admin");
        
        const response = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: formData });
        const result = await response.json();
        
        if (result.success) {
            showToast("✅ Announcement published successfully!", 2000);
            
            document.getElementById("annHeader").value = "";
            document.getElementById("annContent").value = "";
            document.getElementById("annLink").value = "";
            document.getElementById("annLinkText").value = "Learn More";
            document.getElementById("annExpiry").value = "";
            
            loadRecentAnnouncements();
            
            await fetchAnnouncements();
            if (document.getElementById("announcementModal")?.classList.contains("show")) {
                renderAnnouncements();
            }
            updateAnnouncementBadge();
            
        } else {
            showToast("Failed to publish", 1500);
        }
    } catch (error) {
        console.error("Publish error:", error);
        showToast("Error publishing announcement", 1500);
    } finally {
        publishBtn.disabled = false;
        publishBtn.innerHTML = originalText;
    }
}

async function loadRecentAnnouncements() {
    if (!isAdmin) return;
    
    const container = document.getElementById("recentAnnouncementsList");
    if (!container) return;
    
    try {
        const response = await fetch(`${GOOGLE_SHEETS_URL}?action=getAnnouncements`);
        const announcementsList = await response.json();
        
        if (!announcementsList.length) {
            container.innerHTML = '<div class="empty-state">No announcements yet</div>';
            return;
        }
        
        let html = '<div style="max-height: 300px; overflow-y: auto;">';
        announcementsList.forEach(ann => {
            html += `
                <div class="admin-announcement-item" style="background: #f5f5f7; padding: 12px; border-radius: 12px; margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>${ann.icon} ${ann.header}</strong>
                            <div style="font-size: 0.7rem; color: #86868b;">${ann.date} | ${ann.type} | ${ann.priority}</div>
                        </div>
                        <button class="btn-secondary-apple" style="padding: 4px 12px; font-size: 0.7rem;" onclick="deleteAnnouncement('${ann.timestamp}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
        
    } catch (error) {
        console.error("Load recent announcements error:", error);
        container.innerHTML = '<div class="empty-state">Failed to load</div>';
    }
}

async function deleteAnnouncement(timestamp) {
    if (!isAdmin) return;
    if (!confirm("Are you sure you want to delete this announcement?")) return;
    
    try {
        const formData = new URLSearchParams();
        formData.append("action", "updateAnnouncementStatus");
        formData.append("timestamp", timestamp);
        formData.append("status", "deleted");
        
        const response = await fetch(GOOGLE_SHEETS_URL, { method: "POST", body: formData });
        const result = await response.json();
        
        if (result.success) {
            showToast("Announcement deleted", 1500);
            loadRecentAnnouncements();
            await fetchAnnouncements();
            updateAnnouncementBadge();
        } else {
            showToast("Delete failed", 1500);
        }
    } catch (error) {
        console.error("Delete error:", error);
        showToast("Error deleting", 1500);
    }
}