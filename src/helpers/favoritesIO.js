export function exportFavorites(favs) {
  const blob = new Blob([JSON.stringify(favs, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "whats-4-dinner-favorites.json";
  a.click();
  URL.revokeObjectURL(url);
}

export function importFavorites(file, onDone) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (Array.isArray(data)) onDone(data);
    } catch {}
  };
  reader.readAsText(file);
}
