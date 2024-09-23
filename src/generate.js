import { readFileSync, writeFileSync, mkdirSync, rmSync } from "fs";
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
  rmSync("../release", { recursive: true, force: true });
  mkdirSync("../release", { recursive: true });
  songs.forEach(song => {
    const releaseHtml = mainLayout({
      body: release({
        ...song,
      }),
      title: song.title,
      socials: socials,
    });
    mkdirSync(`../release/${song.slug}`, { recursive: true });
    writeFileSync(`../release/${song.slug}/index.html`, releaseHtml);
  });
}

build();
