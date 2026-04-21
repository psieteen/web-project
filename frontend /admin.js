const API = "https://web-project-rvov.onrender.com";
const token = localStorage.getItem("token");

if (!token) {
  alert("Please login first");
  window.location.href = "login.html";
}


// Initialize Quill editor
const quill = new Quill('#editor-container', {
  theme: 'snow',
  placeholder: 'Write your post content here...',
  modules: {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ 'header': 1 }, { 'header': 2 }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ],
    clipboard: {
      matchVisual: false
    }
  }
});

//  Ctrl+Shift+V to paste HTML
document.addEventListener('keydown', function(e) {
  if (e.ctrlKey && e.shiftKey && e.key === 'V') {
    e.preventDefault();
    navigator.clipboard.readText().then(text => {
      quill.clipboard.dangerouslyPasteHTML(text);
    }).catch(err => {
      console.error("Failed to paste HTML:", err);
      alert("Could not paste HTML. Try pasting normally.");
    });
  }
});

//  Add a small hint in the UI
const toolbar = document.querySelector('.ql-toolbar');
if (toolbar) {
  const hint = document.createElement('span');
  hint.style.marginLeft = 'auto';
  hint.style.fontSize = '0.7rem';
  hint.style.color = 'var(--muted)';
  hint.style.paddingRight = '10px';
  hint.innerHTML = 'Ctrl+Shift+V for HTML';
  toolbar.appendChild(hint);
}

// Track editing state
let editingPostId = null;

// ✅ Submit post (handles both create and update)
function submitPost() {
  const title = document.getElementById("title").value.trim();
  const slug = document.getElementById("slug").value.trim().toLowerCase().replace(/\s+/g, '-');
  const content = quill.root.innerHTML;
  const type = document.getElementById("type").value;
  const status = document.getElementById("status").value;

  if (!title || !slug || !content || content === '<p><br></p>') {
    alert("Please fill in all fields");
    return;
  }

  const url = editingPostId ? `${API}/posts/${editingPostId}` : `${API}/posts`;
  const method = editingPostId ? "PUT" : "POST";

  fetch(url, {
    method: method,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ title, slug, content, type, status })
  })
  .then(res => {
    if (res.status === 401 || res.status === 403) {
      logout();
      return;
    }
    return res.json();
  })
  .then(data => {
    if (!data) return;
    
    alert(editingPostId ? "Post updated!" : "Post created!");
    resetForm();
    loadAdminPosts();
  })
  .catch(err => {
    console.error("Submit error:", err);
    alert("Error saving post");
  });
}

// Edit post - populate form

function editPost(id, title, slug, content, type, status) {
  editingPostId = id;
  
  document.getElementById("form-title").innerText = "Edit Post";
  document.getElementById("title").value = title;
  document.getElementById("slug").value = slug;
  quill.root.innerHTML = content;
  document.getElementById("type").value = type || "writing";
  document.getElementById("status").value = status || "draft";
  document.getElementById("editing-id").value = id;
  
  document.getElementById("submit-btn").innerText = "Update Post";
  document.getElementById("cancel-btn").style.display = "inline-block";
  
  document.querySelector(".admin-section").scrollIntoView({ behavior: "smooth" });
}

// ✅ Cancel editing
function cancelEdit() {
  resetForm();
}

// ✅ Reset form to create mode
function resetForm() {
  editingPostId = null;
  document.getElementById("form-title").innerText = "Create New Post";
  document.getElementById("title").value = "";
  document.getElementById("slug").value = "";
  quill.root.innerHTML = "";
  document.getElementById("type").value = "writing";
  document.getElementById("status").value = "draft";
  document.getElementById("editing-id").value = "";
  document.getElementById("submit-btn").innerText = "Publish Post";
  document.getElementById("cancel-btn").style.display = "none";
}

// ✅ Load posts for admin
// ✅ Load posts for admin
function loadAdminPosts() {
  fetch(`${API}/posts`, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  })
  .then(res => {
    if (res.status === 401 || res.status === 403) {
      logout();
      return;
    }
    return res.json();
  })
  .then(posts => {
    if (!posts) return;

    const container = document.getElementById("admin-posts");
    
    if (posts.length === 0) {
      container.innerHTML = '<p style="color: var(--muted); padding: 1rem 0;">No posts yet. Create your first post above.</p>';
      return;
    }
    
    container.innerHTML = "";

    posts.forEach(post => {
      const div = document.createElement("div");
      div.className = "admin-post-item";
      
      const date = new Date(post.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      div.innerHTML = `
        <div class="admin-post-info">
          <span class="admin-post-title">${escapeHtml(post.title)}</span>
          <div class="admin-post-meta">
            <span class="admin-post-date">${date}</span>
            <span class="admin-post-type">${post.type || 'writing'}</span>
            <span class="admin-post-status ${post.status || 'draft'}">${post.status || 'draft'}</span>
            <span class="admin-post-views">👁️ ${post.views || 0}</span>
          </div>
        </div>
        <div class="admin-post-actions">
          <button onclick="editPost('${post._id}', '${escapeJs(post.title)}', '${escapeJs(post.slug)}', '${escapeJs(post.content)}', '${post.type || 'writing'}', '${post.status || 'draft'}')" class="admin-edit-btn">Edit</button>
          <button onclick="deletePost('${post._id}')" class="admin-delete-btn">Delete</button>
        </div>
      `;

      container.appendChild(div);
    });
  })
  .catch(err => {
    console.error("Load posts error:", err);
  });
}

// ✅ Delete post
function deletePost(id) {
  if (!confirm("Are you sure you want to delete this post? This cannot be undone.")) return;

  fetch(`${API}/posts/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  })
  .then(res => {
    if (res.status === 401 || res.status === 403) {
      logout();
      return;
    }
    return res.json();
  })
  .then(data => {
    if (!data) return;
    
    if (editingPostId === id) {
      resetForm();
    }
    
    loadAdminPosts();
  })
  .catch(err => {
    console.error("Delete error:", err);
    alert("Error deleting post");
  });
}

// ✅ Helper: Escape HTML
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ✅ Helper: Escape for JavaScript string
function escapeJs(text) {
  if (!text) return '';
  return text.replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '');
}

// ✅ LOGOUT FUNCTION - Make sure this exists!
function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

// Initialize
loadAdminPosts();