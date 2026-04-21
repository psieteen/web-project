const API = "https://web-project-rvov.onrender.com";
const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "login.html";
}

async function loadDashboard() {
  try {
    const res = await fetch(`${API}/analytics`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    
    if (res.status === 401 || res.status === 403) {
      logout();
      return;
    }
    
    const data = await res.json();
    
    document.getElementById('total-posts').textContent = data.totals.posts;
    document.getElementById('published-posts').textContent = data.totals.published;
    document.getElementById('draft-posts').textContent = data.totals.drafts;
    document.getElementById('total-views').textContent = data.totals.views.toLocaleString();
    document.getElementById('total-comments').textContent = data.totals.comments;
    renderRecentComments(data.recentComments);
    renderMostViewed(data.mostViewed);
    renderRecentPosts(data.recentPosts);
    renderDrafts(data.drafts);
    
  } catch (err) {
    console.error("Dashboard error:", err);
  }
}

function renderRecentComments(comments) {
  const container = document.getElementById('recent-comments');
  if (!container) return;
  
  if (comments.length === 0) {
    container.innerHTML = '<div class="empty-state">No comments yet</div>';
    return;
  }
  
  container.innerHTML = '';
  comments.forEach(comment => {
    const item = document.createElement('div');
    item.className = 'comment-item';
    
    const date = new Date(comment.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    item.innerHTML = `
      <div class="comment-item-main">
        <div class="comment-header">
          <span class="comment-author">${escapeHtml(comment.name)}</span>
          <span class="comment-date">${date}</span>
        </div>
        <p class="comment-text">${escapeHtml(comment.message)}</p>
        <div class="comment-meta">
          <span class="comment-post-slug">on: ${escapeHtml(comment.postId)}</span>
        </div>
      </div>
      <div class="comment-actions">
        <button onclick="deleteComment('${comment._id}')" class="comment-delete-btn" title="Delete comment">🗑️</button>
      </div>
    `;
    
    container.appendChild(item);
  });
}

// ✅ Delete comment function
async function deleteComment(id) {
  if (!confirm("Delete this comment?")) return;
  
  try {
    const res = await fetch(`${API}/comments/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (res.ok) {
      loadDashboard(); // Refresh
    }
  } catch (err) {
    console.error("Delete error:", err);
  }
}

function renderMostViewed(posts) {
  const container = document.getElementById('most-viewed');
  if (!container) return;
  
  if (posts.length === 0) {
    container.innerHTML = '<div class="empty-state">No views yet</div>';
    return;
  }
  
  container.innerHTML = '';
  posts.forEach((post, index) => {
    const item = document.createElement('div');
    item.className = 'recent-item';
    
    item.innerHTML = `
      <div class="recent-item-main">
        <div class="recent-item-title-wrapper">
          <span class="rank-badge">#${index + 1}</span>
          <a href="post.html?slug=${post.slug}" class="recent-item-title">${escapeHtml(post.title)}</a>
        </div>
        <div class="recent-item-meta">
          <span class="views-badge">👁️ ${post.views.toLocaleString()} views</span>
        </div>
      </div>
      <a href="admin.html?edit=${post._id}" class="recent-item-action">Edit</a>
    `;
    
    container.appendChild(item);
  });
}

function renderRecentPosts(posts) {
  const container = document.getElementById('recent-posts');
  if (!container) return;
  
  if (posts.length === 0) {
    container.innerHTML = '<div class="empty-state">No posts yet</div>';
    return;
  }
  
  container.innerHTML = '';
  posts.forEach(post => {
    const item = document.createElement('div');
    item.className = 'recent-item';
    
    const date = new Date(post.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
    
    item.innerHTML = `
      <div class="recent-item-main">
        <a href="post.html?slug=${post.slug}" class="recent-item-title">${escapeHtml(post.title)}</a>
        <div class="recent-item-meta">
          <span class="status-badge ${post.status}">${post.status}</span>
          <span>👁️ ${post.views || 0}</span>
          <span>${date}</span>
        </div>
      </div>
      <a href="admin.html?edit=${post._id}" class="recent-item-action">Edit</a>
    `;
    
    container.appendChild(item);
  });
}

function renderDrafts(drafts) {
  const container = document.getElementById('drafts-reminder');
  if (!container) return;
  
  if (drafts.length === 0) {
    container.style.display = 'none';
    return;
  }
  
  container.style.display = 'block';
  const listContainer = document.getElementById('drafts-list');
  listContainer.innerHTML = '';
  
  drafts.forEach(draft => {
    const item = document.createElement('div');
    item.className = 'draft-item';
    
    const date = new Date(draft.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
    
    item.innerHTML = `
      <span class="draft-title">📝 ${escapeHtml(draft.title)}</span>
      <span class="draft-date">${date}</span>
      <a href="admin.html?edit=${draft._id}" class="draft-action">Continue →</a>
    `;
    
    listContainer.appendChild(item);
  });
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

loadDashboard();