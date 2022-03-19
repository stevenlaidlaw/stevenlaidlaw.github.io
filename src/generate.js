const fs = require("fs");
const { marked } = require("marked");
const hljs = require("highlight.js");

marked.setOptions({
  highlight: (code, lang) => {
    const language = hljs.getLanguage(lang) ? lang : "plaintext";
    return hljs.highlight(code, { language }).value;
  },
  langPrefix: "hljs language-", // highlight.js css expects a top-level 'hljs' class.
  gfm: true,
});

const run = () => {
  fs.mkdirSync("../posts", { recursive: true });
  const layoutContent = fs.readFileSync("./layout.html", "utf8");
  const posts = fs.readdirSync("./posts");

  // Generate the index page
  const postsLinks = posts.map((post) => {
    const [date, name] = post.split("_");
    const [filename, extension] = name.split(".");

    const postLink = `<div class="postLink"><strong>${date}</strong><a href="/posts/${filename}.html">${filename.replaceAll(
      "-",
      " "
    )}</a></div>`;

    return postLink;
  });

  const html = layoutContent.replace("{{content}}", postsLinks.join("\n"));
  fs.writeFileSync("../index.html", html);

  // Generate the individual posts
  posts.forEach((post) => {
    const postContent = fs.readFileSync(`./posts/${post}`, "utf8");
    const postHtml = marked(postContent);
    const [date, name] = post.split("_");
    const [filename, extension] = name.split(".");

    const html = layoutContent.replace("{{content}}", postHtml);

    fs.writeFileSync(`../posts/${filename}.html`, html);
  });
};

run();
