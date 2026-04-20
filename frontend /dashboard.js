const API = "https://web-project-rvov.onrender.com";
const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "login.html";
}

// Load dashboard data
async function loadDashboard() {
  try {
    // Fetch all posts
    const postsRes = await fetch(`${API}/posts`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    
    if (postsRes.status === 401 || postsRes.status === 403) {
      logout();
      return;
    }
    
    const posts = await postsRes.json();
    
    // Calculate stats
    const totalPosts = posts.length;
    const publishedPosts = posts.filter(p => p.status === 'published').length;
    const draftPosts = posts.filter(p => p.status === 'draft').length;
    
    document.getElementById('total-posts').textContent = totalPosts;
    document.getElementById('published-posts').textContent = publishedPosts;
    document.getElementById('draft-posts').textContent = draftPosts;
    
    // Show recent posts (last 5)
    const recentPostsContainer = document.getElementById('recent-posts');
    recentPostsContainer.innerHTML = '';
    
    posts.slice(0, 5).forEach(post => {
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
            <span>${date}</span>
          </div>
        </div>
        <a href="admin.html?edit=${post._id}" class="recent-item-action">Edit</a>
      `;
      
      recentPostsContainer.appendChild(item);
    });
    
    // Try to fetch comments (if you add this endpoint later)
    try {
      const commentsRes = await fetch(`${API}/comments`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (commentsRes.ok) {
        const comments = await commentsRes.json();
        document.getElementById('total-comments').textContent = comments.length;
        
        const commentsContainer = document.getElementById('recent-comments');
        commentsContainer.innerHTML = '';
        
        comments.slice(0, 5).forEach(comment => {
          const item = document.createElement('div');
          item.className = 'recent-item';
          
          const date = new Date(comment.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          });
          
          item.innerHTML = `
            <div class="recent-item-main">
              <div class="comment-preview">"${escapeHtml(comment.message.slice(0, 60))}${comment.message.length > 60 ? '...' : ''}"</div>
              <div class="recent-item-meta">
                <span>${escapeHtml(comment.name)}</span>
                <span>${date}</span>
              </div>
            </div>
          `;
          
          commentsContainer.appendChild(item);
        });
      }
    } catch (err) {
      document.getElementById('total-comments').textContent = '—';
    }
    
  } catch (err) {
    console.error("Dashboard error:", err);
  }
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

// Initialize
loadDashboard();