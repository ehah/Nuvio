/**
 * Webpack loader (dev-only): stamp `data-nuvio-loc` on JSX for click-to-tag.
 * @this {import('webpack').LoaderContext<unknown>}
 */
module.exports = function nuvioJsxLocLoader(source) {
  const callback = this.async();
  if (!callback) {
    return source;
  }

  if (process.env.NODE_ENV === "production" || process.env.NUVIO === "0") {
    callback(null, source);
    return;
  }

  const options = this.getOptions() ?? {};
  const projectRoot =
    typeof options.projectRoot === "string" && options.projectRoot.length > 0
      ? options.projectRoot
      : this.rootContext;

  const resourcePath = this.resourcePath;
  if (!resourcePath || !/\.(tsx|jsx)$/.test(resourcePath)) {
    callback(null, source);
    return;
  }

  void import("@nuvio/vite-plugin/jsx-loc")
    .then(({ injectJsxLocAttributes }) => {
      const { code, changed } = injectJsxLocAttributes(source, resourcePath, projectRoot);
      callback(null, changed ? code : source);
    })
    .catch((err) => {
      callback(err instanceof Error ? err : new Error(String(err)));
    });
};

module.exports.raw = false;
