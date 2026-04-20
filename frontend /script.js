const API = "https://web-project-rvov.onrender.com";
const params = new URLSearchParams(window.location.search);
const slug = params.get("slug");

// Determine which page we're on
const isHomePage = window.location.pathname.includes("index.html") || window.location.pathname === "/" || window.location.pathname.endsWith("/");
const isBlogPage = window.location.pathname.includes("blog.html");
const isPostPage = slug !== null;

if (isPostPage) {
  loadPost(slug);
  loadComments(slug);
  setupCommentForm(slug);
} else if (isHomePage) {
  loadRecentPosts();
} else if (isBlogPage) {
  loadAllPosts();
}

// ✅ Load recent posts for homepage (limit 3)
function loadRecentPosts() {
  fetch(`${API}/posts?type=writing&limit=3`)
    .then(res => res.json())
    .then(posts => {
      renderPostList(posts, "posts");
    })
    .catch(err => console.error("Error loading recent posts:", err));
}

// ✅ Load all writing posts for blog page
function loadAllPosts() {
  fetch(`${API}/posts?type=writing`)
    .then(res => res.json())
    .then(posts => {
      renderPostList(posts, "posts");
    })
    .catch(err => console.error("Error loading posts:", err));
}

// ✅ Unified post list renderer
function renderPostList(posts, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (posts.length === 0) {
    container.innerHTML = '<p class="no-posts">No posts yet. Check back soon.</p>';
    return;
  }

  container.innerHTML = `<ul class="post-list"></ul>`;
  const list = container.querySelector(".post-list");

  posts.forEach(post => {
    const item = document.createElement("li");
    item.className = "post-item";

    const date = new Date(post.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const excerpt = post.excerpt || post.content.slice(0, 140) + '...';

    item.innerHTML = `
      <div class="post-meta">
        <span class="post-date">${date}</span>
        <span class="post-tag">${post.type || 'Writing'}</span>
      </div>
      <h2>
        <a href="post.html?slug=${post.slug}">${post.title}</a>
      </h2>
      <p class="post-excerpt">${excerpt}</p>
      <a class="read-more" href="post.html?slug=${post.slug}">Read →</a>
    `;

    list.appendChild(item);
  });
}

// ✅ Load single post
function loadPost(slug) {
  fetch(`${API}/posts/${slug}`)
    .then(res => {
      if (!res.ok) throw new Error('Post not found');
      return res.json();
    })
    .then(post => {
      document.getElementById("title").innerText = post.title;
      document.getElementById("content").innerHTML = post.content;
      
      const dateEl = document.getElementById("post-date");
      if (dateEl) {
        dateEl.innerText = new Date(post.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
      
      const typeEl = document.getElementById("post-type");
      if (typeEl) {
        typeEl.innerText = post.type || 'Writing';
      }
      
      document.title = `${post.title} — Psi Eteen`;
    })
    .catch(err => {
      console.error("Error loading post:", err);
      document.getElementById("title").innerText = "Post not found";
    });
}

// ✅ Load comments
function loadComments(slug) {
  fetch(`${API}/comments/${slug}`)
    .then(res => res.json())
    .then(comments => {
      const container = document.getElementById("comments");
      if (!container) return;

      if (comments.length === 0) {
        container.innerHTML = '<p class="no-comments">No comments yet. Be the first to share your thoughts.</p>';
        return;
      }

      container.innerHTML = "";
      comments.forEach(c => {
        const div = document.createElement("div");
        div.className = "comment";
        
        const date = new Date(c.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
        
        div.innerHTML = `
          <div class="comment-header">
            <span class="comment-name">${escapeHtml(c.name)}</span>
            <span class="comment-date">${date}</span>
          </div>
          <p class="comment-message">${escapeHtml(c.message)}</p>
        `;
        container.appendChild(div);
      });
    })
    .catch(err => console.error("Error loading comments:", err));
}

// ✅ Simple escape function for user content
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ✅ Setup comment form
function setupCommentForm(slug) {
  const form = document.getElementById("comment-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const name = document.getElementById("name").value.trim();
    const message = document.getElementById("message").value.trim();
    
    if (!name || !message) {
      alert("Please fill in both fields");
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = "Posting...";

    try {
      const res = await fetch(`${API}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: slug, name, message })
      });
      
      const data = await res.json();
      
      if (data.ok) {
        document.getElementById("message").value = "";
        loadComments(slug);
      } else {
        alert(data.error || "Failed to post comment");
      }
    } catch (err) {
      alert("Error posting comment. Please try again.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Post comment";
    }
  });
}

// ✅ Submit comment (legacy support)
function submitComment() {
  const name = document.getElementById("name")?.value;
  const message = document.getElementById("message")?.value;
  
  if (!name || !message) return;

  fetch(`${API}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ postId: slug, name, message })
  }).then(() => {
    loadComments(slug);
    document.getElementById("message").value = "";
  });
}