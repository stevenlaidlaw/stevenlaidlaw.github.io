const normalizeString = (str) => str.toLowerCase().replaceAll(" ", "-");

export const socials = [
  { title: "Spotify", url: "https://open.spotify.com/artist/4qIIu6vj9ilkYHgBF2vHe5" },
  { title: "Apple Music", url: "https://music.apple.com/au/artist/steven-laidlaw/1346873809" },
  { title: "YouTube Music", url: "https://music.youtube.com/channel/UCA9jMQxoTRtAo5TU3DCYewQ" },
  { title: "TikTok", url: "https://tiktok.com/@stevenlaidlaw_" },
  { title: "Instagram", url: "https://www.instagram.com/stevenlaidlaw/" },
  { title: "YouTube", url: "https://www.youtube.com/@stevenlaidlaw" },
].map(social => ({
  ...social,
  slug: normalizeString(social.title),
}));

export const songs = [{
  title: "Sure",
  links: [
    {title: "Spotify", url: "https://open.spotify.com/track/4JjWFDDDXcRbCUZBb3cO7K?si=0e98bd2cf3bd4123"},
    {title: "Apple Music", url: "https://music.apple.com/au/album/sure/1767468445?i=1767468446"},
    {title: "YouTube", url: "https://www.youtube.com/watch?v=WGIvEZzba8k&list=OLAK5uy_l_wRkrY_kTMGPSXYYzRlGcIwxooRKL5QI&index=1"},
  ]
}, {
  title: "Falling Out Your Life",
  links: [
    {title: "Spotify", url: "https://open.spotify.com/track/1ORsJxjePbk2oc6hjo0omy?si=b2e6122f9ec24bea"},
    {title: "Apple Music", url: "https://music.apple.com/au/album/falling-out-your-life/1760576635?i=1760576636"},
    {title: "YouTube", url: "https://www.youtube.com/watch?v=UFYlNIWvAJc&list=OLAK5uy_mXWztWctBIHvjoM2eUKepL-CcdNBWXlt4"},
  ]
}, {
  title: "I Never Told Them",
  links: [
    {title: "Spotify", url: "https://open.spotify.com/track/7oQrB6SuNxGSXCVr39kstm?si=473914ccf6004465"},
    {title: "Apple Music", url: "https://music.apple.com/au/album/i-never-told-them/1750341085?i=1750341086"},
    {title: "YouTube", url: "https://www.youtube.com/watch?v=rNM4NtzoAnY&list=OLAK5uy_ly6Y4c00MLZC_BXOPxEfM1SEKCT61q8MQ"},
  ]
}, {
  title: "Obsessed",
  links: [
    {title: "Spotify", url: "https://open.spotify.com/track/3p9OlNfw1PP9ayezkUdMIh?si=4f0e0963f8e54478"},
    {title: "Apple Music", url: "https://music.apple.com/au/album/obsessed/1757304103?i=1757304104"},
    {title: "YouTube", url: "https://www.youtube.com/watch?v=j0X83qbi5dA&list=OLAK5uy_keEWP_VAqK6FZptd4aro_JLOMEUyxgKb0"},
  ]
}, {
  title: "Shadowed Light",
  links: [
    {title: "Spotify", url: "https://open.spotify.com/track/750OIP3sO1xKbkULRzab0w?si=da68e3043fb848b2"},
    {title: "Apple Music", url: "https://music.apple.com/au/album/shadowed-light/1722546023?i=1722546024"},
    {title: "YouTube", url: "https://www.youtube.com/watch?v=VBtc3_Qsqkk&list=OLAK5uy_n9ODh8zT1TulO4OCih-xiPj7GJDqGP3a0"},
  ]
}, {
  title: "We Used To",
  links: [
    {title: "Spotify", url: "https://open.spotify.com/track/59YVNV59O6oyUGTgOSQI5P?si=bb077d3bad894730"},
    {title: "Apple Music", url: "https://music.apple.com/au/album/we-used-to/1718039652?i=1718039653"},
    {title: "YouTube", url: "https://www.youtube.com/watch?v=zwKAvlO1K9Q&list=OLAK5uy_mQ6hM-ka07jXOJ7NskoMpq6gIQ_xSsOac"},
  ]
}].map(song => ({
  ...song,
  slug: normalizeString(song.title),
  links: song.links.map(link => ({
    ...link,
    slug: normalizeString(link.title),
  })),
}));