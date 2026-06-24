/**
 * Offline source index API for `@nuvio/cli` (doctor / scan / stats).
 */
export {
  buildSourceIndex,
  pickBestSourceIndex,
  extractIdsFromSource,
  type BuildSourceIndexResult,
  type SourceIndexEntry,
} from "./source-index.js";
export { detectProjectLibraries } from "./detect-libraries.js";
export { readRuntimeVersions } from "./read-dep-version.js";
export {
  NUVIO_DEFAULT_IGNORE_GLOBS,
  NUVIO_DEFAULT_SCAN_GLOBS,
  NUVIO_NEXT_SCAN_GLOBS,
  NUVIO_SOURCE_WATCH_DIRS,
  NUVIO_VITE_SCAN_GLOBS,
  listExistingSourceWatchDirs,
  resolveProjectScanGlobs,
} from "./scan-globs.js";
