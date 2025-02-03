import { useState, useEffect } from "react"

export const useTheme = () => {
  const [theme, setTheme] = useState("light")

  useEffect(() => {
    // Get initial theme from localStorage if it exists
    const savedTheme = localStorage.getItem("theme")
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.setAttribute("data-theme", savedTheme)
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    document.documentElement.setAttribute("data-theme", newTheme)
  }

  return { theme, toggleTheme }
}
