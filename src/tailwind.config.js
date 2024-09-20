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
      animation: {
        gradBg: "gradBg 8s linear infinite",
        gradBorder: "gradBorder 10s linear infinite",
        jitter: "jitter 10ms linear infinite",
        noise: "noise 200ms linear infinite",
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
        jitter: {
          "0%, 100%": { transform: "translate(-1px, -1px)" },
          "50%": { transform: "translate(1px, 1px)" },
        },
      },
      backgroundSize: {
        "size-2x": "200% 200%",
        "size-3x": "300% 300%",
        "size-4x": "400% 400%",
      },
      backgroundImage: {
        "rpt-gradient": "repeating-linear-gradient(0, #000, #000 2px, transparent 4px)",
      },
      boxShadow: {
        even: "0 0 25px 0 rgba(0, 0, 0, 0.05)",
      },
    }
  },
  plugins: [],
};
