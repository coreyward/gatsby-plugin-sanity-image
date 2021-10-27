module.exports = {
  extends: [
    "standard",
    "plugin:react/recommended",
    "plugin:prettier/recommended",
  ],
  plugins: ["standard", "react", "react-hooks", "prettier"],
  rules: {
    "react/prop-types": "warn",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "no-unused-vars": "warn",
  },
  settings: {
    react: {
      version: "detect",
    },
  },
  globals: {
    __GATSBY_PLUGIN_SANITY_IMAGE__DATASET__: "readonly",
    __GATSBY_PLUGIN_SANITY_IMAGE__PROJECTID__: "readonly",
    __GATSBY_PLUGIN_SANITY_IMAGE__ALT_FIELD__: "readonly",
    __GATSBY_PLUGIN_SANITY_IMAGE__DEFAULT_IMAGE_CONFIG__: "readonly",
  },
}
