import { Feed } from "feed";

function generateRSS(posts, { title, description, siteUrl }) {
  const feed = new Feed({
    title,
    description,
    id: siteUrl,
    link: siteUrl,
    language: "en",
    image: `${siteUrl}/logo.png`,
    favicon: `${siteUrl}/favicon.ico`,
    updated: new Date(),
    generator: "Custom",
    feedLinks: {
      rss2: `${siteUrl}/rss.xml`,
      atom: `${siteUrl}/atom.xml`,
    },
  });

  posts.forEach((post) => {
    feed.addItem({
      title: post.title,
      id: post.url,
      link: post.url,
      description: post.excerpt,
      content: post.content,
      author: post.author,
      date: new Date(post.date),
    });
  });

  return feed;
}
