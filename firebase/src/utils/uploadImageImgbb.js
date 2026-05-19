function imgbbUploadBase() {
  if (import.meta.env.DEV) {
    return "/imgbb-api/1/upload";
  }
  return "https://api.imgbb.com/1/upload";
}

export async function uploadImageToImgbb(file, apiKey) {
  if (!apiKey) throw new Error("NO_IMG_API_KEY");
  if (!file?.type?.startsWith("image/")) throw new Error("INVALID_TYPE");
  const maxBytes = 30 * 1024 * 1024;
  if (file.size > maxBytes) throw new Error("TOO_LARGE");

  const body = new FormData();
  body.append("key", apiKey);
  body.append("image", file);

  let res;
  try {
    res = await fetch(imgbbUploadBase(), {
      method: "POST",
      body,
    });
  } catch (e) {
    const msg = e instanceof TypeError ? e.message : String(e);
    throw new Error(
      msg.includes("Failed to fetch") || msg.includes("NetworkError")
        ? "NETWORK_BLOCKED"
        : msg
    );
  }

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`IMGBB_HTTP_${res.status}`);
  }

  if (!json?.success) {
    const msg =
      typeof json?.error?.message === "string"
        ? json.error.message
        : typeof json?.error === "string"
          ? json.error
          : `IMGBB_HTTP_${res.status}`;
    throw new Error(msg);
  }

  const url = json.data?.display_url || json.data?.url;
  if (!url || typeof url !== "string") throw new Error("IMGBB_NO_URL");
  return url;
}
