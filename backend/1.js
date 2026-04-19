fetch("https://web-project-rvov.onrender.com/comments", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    postId: "blog-1",
    name: "PSI",
    message: "final working test"
  })
})
.then(res => res.json())
.then(console.log)