const API = "https://web-project-rvov.onrender.com";

// CREATE POST
function createPost() {
  const title = document.getElementById("title").value;
  const slug = document.getElementById("slug").value;
  const content = document.getElementById("content").value;

  fetch(`${API}/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ title, slug, content })
  }).then(() => {
    alert("Post created");
    loadAdminPosts();
  });
}

// LOAD POSTS
function loadAdminPosts() {
  fetch(`${API}/posts`)
    .then(res => res.json())
    .then(posts => {
      const container = document.getElementById("admin-posts");
      container.innerHTML = "";

      posts.forEach(post => {
        const div = document.createElement("div");

        div.innerHTML = `
          <p><b>${post.title}</b></p>
          <button onclick="deletePost('${post._id}')">Delete</button>
          <hr>
        `;

        container.appendChild(div);
      });
    });
}

// DELETE POST
function deletePost(id) {
  fetch(`${API}/posts/${id}`, {
    method: "DELETE"
  }).then(() => {
    loadAdminPosts();
  });
}

// INIT
loadAdminPosts();