import Typography from 'typography'
import Sutro from 'typography-theme-sutro'

Sutro.overrideThemeStyles = () => ({
  'a': {
    color: 'cornflowerblue'
  },
  'img': {
    boxShadow: '3px 3px 10px #0004'
  },
})

const typography = new Typography(Sutro)

// Hot reload typography in development.
if (process.env.NODE_ENV !== `production`) {
  typography.injectStyles()
}

export default typography
export const rhythm = typography.rhythm
export const scale = typography.scale
