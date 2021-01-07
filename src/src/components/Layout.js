import React from 'react'
import { Link } from 'gatsby'
import './Layout.css'

import { rhythm, scale } from '../utils/typography'

class Layout extends React.Component {
  render() {
    const { location, title, children } = this.props
    const rootPath = `${__PATH_PREFIX__}/`
    let header

    if (location.pathname === rootPath) {
      header = (
        <h1
          style={{
            ...scale(1.5),
            marginBottom: rhythm(1.5),
            marginTop: 0
          }}
        >
          <Link
            style={{
              boxShadow: `none`,
              textDecoration: `none`,
              color: `inherit`,
            }}
            to={`/`}
          >
            {title}
          </Link>
        </h1>
      )
    } else {
      header = (
        <h3
          style={{
            marginTop: 0,
          }}
        >
          <Link
            style={{
              boxShadow: `none`,
              textDecoration: `none`,
              color: `inherit`,
            }}
            to={`/`}
          >
            {title}
          </Link>
        </h3>
      )
    }
    return (
      <div
        style={{
          marginLeft: `auto`,
          marginRight: `auto`,
          maxWidth: rhythm(32),
          padding: `${rhythm(1.5)} ${rhythm(3 / 4)}`,
        }}
      >
        {header}
        {children}
        <footer>
          <a href="https://twitter.com/theRealLaidlaw">twitter</a> || <a href="https://github.com/stevenlaidlaw">github</a> || <a href="https://stackoverflow.com/users/622355/steven-laidlaw">stack overflow</a> || <a href="http://www.linkedin.com/in/stevenglaidlaw/">linkedin</a> || <a href="mailto:me@stevenlaidlaw.com">email</a>
          <br/>© {new Date().getFullYear()}
        </footer>
      </div>
    )
  }
}

export default Layout
