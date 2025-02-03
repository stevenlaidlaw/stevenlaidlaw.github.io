import * as React from "react"
import { Link, graphql } from "gatsby"

import Layout from "../components/layout"
import Seo from "../components/seo"

const BlogIndex = ({ data, location }) => {
  const posts = data.allMarkdownRemark.nodes

  return (
    <Layout location={location}>
      <ol style={{ listStyle: `none` }}>
        {posts.map(post => (
          <li key={post.fields.slug}>
            <article
              className="post-list-item"
              itemScope
              itemType="http://schema.org/Article"
            >
              <h2>
                <Link to={post.fields.slug} itemProp="url">
                  <span itemProp="headline">
                    {post.frontmatter.title || post.fields.slug}
                  </span>
                </Link>
              </h2>
              <p>
                <span>{post.frontmatter.date}</span>
                {" // "}
                {post.frontmatter.description}
              </p>
            </article>
          </li>
        ))}
      </ol>
    </Layout>
  )
}

export default BlogIndex

/**
 * Head export to define metadata for the page
 */
export const Head = () => <Seo title="All posts" />

export const pageQuery = graphql`
  {
    allMarkdownRemark(sort: { frontmatter: { date: DESC } }) {
      nodes {
        fields {
          slug
        }
        frontmatter {
          date(formatString: "YYYY-MM-DD")
          title
          description
        }
      }
    }
  }
`
