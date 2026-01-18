const params = new URLSearchParams(window.location.search);
const post = params.get("post");
const container = document.getElementById("postContent");

if (!post) {
  container.innerHTML = "<p>No article selected.</p>";
} else {
  fetch(`content/blog/${post}.md`)
    .then(res => {
      if (!res.ok) throw new Error("File not found");
      return res.text();
    })
    .then(md => {
      container.innerHTML = marked.parse(md);
    })
    .catch(err => {
      container.innerHTML = `
        <h3>Error loading article</h3>
        <p>Could not find:</p>
        <code>content/blog/${post}.md</code>
      `;
      console.error(err);
    });
}
