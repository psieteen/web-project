const API = "https://web-project-rvov.onrender.com";

// detect page
const params = new URLSearchParams(window.location.search);
const slug = params.get("slug");

// homepage
if (!slug) {
  loadPosts();
} else {
  loadPost(slug);
  loadComments(slug);
}

// load all posts
function loadPosts() {
  fetch(`${API}/posts`)
    .then(res => res.json())
    .then(posts => {
      const container = document.getElementById("posts");

      posts.forEach(post => {
        const div = document.createElement("div");

        div.innerHTML = `
          <h2>${post.title}</h2>
          <a href="post.html?slug=${post.slug}">Read More</a>
        `;

        container.appendChild(div);
      });
    });
}

// load single post
function loadPost(slug) {
  fetch(`${API}/posts/${slug}`)
    .then(res => res.json())
    .then(post => {
      document.getElementById("title").innerText = post.title;
      document.getElementById("content").innerText = post.content;
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