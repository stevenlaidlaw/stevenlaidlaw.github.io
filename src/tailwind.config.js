export default {
  content: ["./views/**/*.hbs"],
  theme: {
    fontFamily: {
      sans: [
        "Nova Square",
        "Helvetica Neue",
        "Helvetica",
        "Nimbus Sans L",
        "Segoe UI",
        "Oxygen",
        "Ubuntu",
        "Cantarell",
        "Fira Sans",
        "Droid Sans",
        "sans-serif",
      ],
      header: ["Nova Square", "Lexend Deca", "sans-serif"],
    },
    extend: {
      borderWidth: {
        16: "16px",
      },
      animation: {
        gradBg: "gradBg 18s linear infinite",
        gradBorder: "gradBorder 18s linear infinite",
      },
      keyframes: {
        gradBg: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        gradBorder: {
          "0%, 100%": { '--angle': "45deg" },
          "50%": { '--angle': "360deg" },
        },
      }
    }
  },
  plugins: [],
};
