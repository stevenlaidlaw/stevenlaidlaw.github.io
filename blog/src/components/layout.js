import * as React from "react"
import { Link } from "gatsby"
import { siteMetadata } from "../../gatsby-config"

const { title, description } = siteMetadata

const Layout = ({ children }) => (
  <div className="global-wrapper">
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

export default Layout
