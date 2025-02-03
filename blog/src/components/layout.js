import * as React from "react"
import { Link } from "gatsby"
import { siteMetadata } from "../../gatsby-config"
import { useTheme } from "../hooks/useTheme"

const { title, description } = siteMetadata

const Layout = ({ children }) => {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === "dark"

  return (
    <div className="global-wrapper">
      <div class="theme-toggle">
        <div class="theme-toggle-label">
          {isDark
            ? "how can you see anything in here?"
            : "ahh the light burns me!"}
        </div>
        <label class="switch">
          <input type="checkbox" onClick={toggleTheme} checked={isDark} />
          <span class="slider"></span>
        </label>
      </div>

      <header className="global-header">
        <h1 className="main-heading">
          <Link to="/">{title}</Link>
        </h1>
        <div>{description}</div>
        <div>
          <a href="https://github.com/stevenlaidlaw">github</a>
          <span> // </span>
          <a href="https://www.linkedin.com/in/stevenglaidlaw/">linkedin</a>
        </div>
      </header>
      <main>{children}</main>
      <footer></footer>
    </div>
  )
}

export default Layout
