const API = "https://web-project-rvov.onrender.com";
const token = localStorage.getItem("token");

if (!token) {
    alert("Please login first");
  window.location.href = "login.html";
}
// CREATE POST
function createPost() {
  const title = document.getElementById("title").value;
  const slug = document.getElementById("slug").value;
  const content = document.getElementById("content").value;

  fetch(`${API}/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
      
    },
    body: JSON.stringify({ title, slug, content })
  })
  .then(res => {
    //auth check
    if (res.status === 401|| res.status === 403) {
    logout();
    return;
    }
    return res.json();
  })
    .then(data => {
     if(!data) return;

     alert("post created");
     loadAdminPosts();
    })
     .catch(err => {
      console.error("Create post error:",err);

     });
    }
// LOAD POSTS
function loadAdminPosts() {
  fetch(`${API}/posts`, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  })
  .then(res => {
    // 🔐 auth check
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

      div.innerHTML = `
        <p><b>${post.title}</b></p>
        <button onclick="deletePost('${post._id}')">Delete</button>
        <hr>
      `;

      container.appendChild(div);
    });
  })
  .catch(err => {
    console.error("Load posts error:", err);
  });
}

// DELETE POST
function deletePost(id) {
  fetch(`${API}/posts/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  })
  .then(res => {
    // 🔐 auth check
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
// INIT
loadAdminPosts();