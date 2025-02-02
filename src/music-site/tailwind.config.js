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
        jitter: "jitter 8s steps(10) infinite",
        scroll: "scroll 10s linear infinite",
      },
      keyframes: {
        gradBg: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        gradBorder: {
          "0%, 100%": { "--angle": "45deg" },
          "50%": { "--angle": "360deg" },
        },
        jitter: {
          "0%, 100%": { transform: "translate(0, 0)" },
          "10%": { transform: "translate(-5%, -10%)" },
          "20%": { transform: "translate(-15%, 5%)" },
          "30%": { transform: "translate(7%, -25%)" },
          "40%": { transform: "translate(-5%, 25%)" },
          "50%": { transform: "translate(-15%, 10%)" },
          "60%": { transform: "translate(15%, 0%)" },
          "70%": { transform: "translate(0%, 15%)" },
          "80%": { transform: "translate(3%, 5%)" },
          "90%": { transform: "translate(-10%, 10%)" },
        },
        scroll: {
          "0%": { transform: "translateY(0)", opacity: "0%" },
          "30%": { opacity: "3%" },
          "70%": { opacity: "3%" },
          "100%": { transform: "translateY(90vh)", opacity: "0%" },
        },
      },
      backgroundImage: {
        "rpt-gradient":
          "repeating-linear-gradient(0, #000, #000 2px, transparent 4px)",
      },
      boxShadow: {
        even: "0 0 25px 0 rgba(0, 0, 0, 0.05)",
      },
    },
  },
  plugins: [],
};
