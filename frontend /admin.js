const API = "https://web-project-rvov.onrender.com";
const token = localStorage.getItem("token");

if (!token) {
  alert("Please login first");
  window.location.href = "login.html";
}

// ✅ Create post
function createPost() {
  const title = document.getElementById("title").value.trim();
  const slug = document.getElementById("slug").value.trim().toLowerCase().replace(/\s+/g, '-');
  const content = document.getElementById("content").value;
  const type = document.getElementById("type").value;

  if (!title || !slug || !content) {
    alert("Please fill in all fields");
    return;
  }

  fetch(`${API}/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ title, slug, content, type })
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
    alert("Post created successfully!");
    document.getElementById("title").value = "";
    document.getElementById("slug").value = "";
    document.getElementById("content").value = "";
    loadAdminPosts();
  })
  .catch(err => {
    console.error("Create post error:", err);
    alert("Error creating post");
  });
}

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
    container.innerHTML = "";

    posts.forEach(post => {
      const div = document.createElement("div");
      div.className = "admin-post-item";
      
      const date = new Date(post.createdAt).toLocaleDateString();

      div.innerHTML = `
        <div>
          <span class="admin-post-title">${post.title}</span>
          <span style="color: var(--muted); margin-left: 1rem; font-size: 0.8rem;">${date}</span>
          <span style="color: var(--accent-dim); margin-left: 0.5rem; font-size: 0.7rem;">${post.type || 'writing'}</span>
        </div>
        <div class="admin-post-actions">
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
  if (!confirm("Are you sure you want to delete this post?")) return;

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
    loadAdminPosts();
  })
  .catch(err => {
    console.error("Delete error:", err);
  });
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

// Initialize
loadAdminPosts();