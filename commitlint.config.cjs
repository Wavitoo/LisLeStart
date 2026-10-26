module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [
      1,
      "always",
      [
        "engine",
        "api",
        "web",
        "mobile",
        "simulator",
        "shared",
        "docs",
        "ci",
        "infra",
        "deps",
        "release",
      ],
    ],
    "subject-case": [0],
  },
};
