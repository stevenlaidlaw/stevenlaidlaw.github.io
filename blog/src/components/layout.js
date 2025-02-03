import * as React from "react"
import { Link } from "gatsby"

const Layout = ({ title, description, children }) => (
  <div className="global-wrapper">
    <header className="global-header">
      <h1 className="main-heading">
        <Link to="/">{title}</Link>
      </h1>
      <p>{description}</p>
    </header>
    <main>{children}</main>
    <footer>
      © {new Date().getFullYear()}, Built with
      {` `}
      <a href="https://www.gatsbyjs.com">Gatsby</a>
    </footer>
  </div>
)

export default Layout
