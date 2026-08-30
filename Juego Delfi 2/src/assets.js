const runtimeAssets = import.meta.glob("../assets/runtime/**/*.png", {
  eager: true,
  query: "?url",
  import: "default",
});

export function asset(path) {
  const key = `../assets/runtime/${path}`;
  const url = runtimeAssets[key];
  if (!url) throw new Error(`Runtime asset not found: ${path}`);
  return url;
}

export const runtimeAssetCount = Object.keys(runtimeAssets).length;
