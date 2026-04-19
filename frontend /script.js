const API = "https://web-project-rvov.onrender.com";

const params = new URLSearchParams(window.location.search);
const slug = params.get("slug");

if (!slug) {
  loadPosts();
} else {
  loadPost(slug);
  loadComments(slug);
}

// ONLY ONE loadPosts()
function loadPosts() {
  fetch(`${API}/posts`)
    .then(res => res.json())
    .then(posts => {
      const container = document.getElementById("posts");

      container.innerHTML = `<ul class="post-list"></ul>`;
      const list = container.querySelector(".post-list");

      posts.forEach(post => {
        const item = document.createElement("li");
        item.className = "post-item";

        item.innerHTML = `
          <div class="post-meta">
            <span class="post-date">
              ${new Date(post.createdAt).toLocaleDateString()}
            </span>
            <span class="post-tag">Writing</span>
          </div>

          <h2>
            <a href="post.html?slug=${post.slug}">
              ${post.title}
            </a>
          </h2>

          <p class="post-excerpt">
            ${post.content.slice(0, 140)}...
          </p>

          <a class="read-more" href="post.html?slug=${post.slug}">
            Read →
          </a>
        `;

        list.appendChild(item);
      });
    });
}

function loadPost(slug) {
  fetch(`${API}/posts/${slug}`)
    .then(res => res.json())
    .then(post => {
      document.getElementById("title").innerText = post.title;

      // ✅ IMPORTANT FIX
      document.getElementById("content").innerHTML = post.content;
    });
}

// load comments
function loadComments(slug) {
  fetch(`${API}/comments/${slug}`)
    .then(res => res.json())
    .then(comments => {
      const container = document.getElementById("comments");

      container.innerHTML = "";

      comments.forEach(c => {
        const div = document.createElement("div");
        div.innerHTML = `<p><b>${c.name}</b>: ${c.message}</p>`;
        container.appendChild(div);
      });
    });
}

// submit comment
function submitComment() {
  const name = document.getElementById("name").value;
  const message = document.getElementById("message").value;

  fetch(`${API}/comments`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      postId: slug,
      name,
      message
    })
  }).then(() => {
    loadComments(slug);
  });
}