const fs = require("fs");

const run = () => {
  const layoutContent = fs.readFileSync("./content/layout.html", "utf8");
  // Generate the index page
  // const sections = fs.readdirSync("./sections").map((section) => `<div class="section">${fs.readFileSync("./sections/" + section, "utf-8")}</div>`);

  // // const html = layoutContent.replace("{{sections}}", sections.join(""));
  // fs.writeFileSync("../index.html", html);
  fs.writeFileSync("../index.html", layoutContent);
};

run();
