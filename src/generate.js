import { readFileSync, writeFileSync, mkdirSync } from "fs";
import Handlebars from "handlebars";
import { socials, songs } from "./data.js";

function build() {
  // Templates
  const mainLayout = Handlebars.compile(readFileSync("./views/layouts/main.hbs", "utf8"));
  const index = Handlebars.compile(readFileSync("./views/index.hbs", "utf8"));
  const release = Handlebars.compile(readFileSync("./views/release.hbs", "utf8"));

  // Home page
  const indexHtml = mainLayout({
    body: index({ socials, songs }),
    socials: socials,
  });
  writeFileSync("../index.html", indexHtml);

  // Release pages
  mkdirSync("../release", { recursive: true });
  songs.forEach(song => {
    const releaseHtml = mainLayout({
      body: release({
        ...song,
      }),
      title: song.title,
      socials: socials,
    });
    writeFileSync(`../release/${song.slug}.html`, releaseHtml);
  });
}

build();
