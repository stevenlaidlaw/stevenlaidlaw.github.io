const fs = require("fs");

const run = () => {
  const layoutContent = fs.readFileSync("./content/layout.html", "utf8");
  fs.writeFileSync("../index.html", layoutContent);
};

run();
