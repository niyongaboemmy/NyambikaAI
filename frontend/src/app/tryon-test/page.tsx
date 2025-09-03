"use client";

import React, { useCallback, useState } from "react";

interface TryOnResponse {
  success: boolean;
  message: string;
  result_path?: string | null;
  error?: string | null;
  error_code?: string | null;
  request_id?: string | null;
  execution_time?: number | null;
}

const toDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function TryOnTestPage() {
  const [personFile, setPersonFile] = useState<File | null>(null);
  const [clothFile, setClothFile] = useState<File | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawResponse, setRawResponse] = useState<TryOnResponse | null>(null);
  const [selectedEngine, setSelectedEngine] = useState<"viton_hd" | "stable_viton">("stable_viton");
  const [category, setCategory] = useState<"upper" | "bottom">("upper");

  const handleSubmit = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setResultUrl(null);
      setRawResponse(null);

      if (!personFile || !clothFile) {
        setError("Please select both person and cloth images.");
        setIsLoading(false);
        return;
      }

      const [personDataUrl, clothDataUrl] = await Promise.all([
        toDataUrl(personFile),
        toDataUrl(clothFile),
      ]);

      const resp = await fetch("http://127.0.0.1:8000/api/try-on", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          engine: selectedEngine,
          category,
          person_image: personDataUrl,
          cloth_image: clothDataUrl,
          use_preset: true,
          seed: 42,
        }),
      });

      const data: TryOnResponse = await resp.json();
      setRawResponse(data);

      if (data.success && data.result_path) {
        setResultUrl(`http://127.0.0.1:8000${data.result_path}`);
      } else {
        const msg = data.error || data.message || "Try-on failed";
        const isStable = selectedEngine === "stable_viton";
        const looksLikeWarmup = /not\s*ready|loading|model|warm\s*up|timeout|unavailable|503/i.test(
          msg
        );
        setError(
          isStable
            ? looksLikeWarmup
              ? "StableVITON is warming up (first call 30–90s). Please retry shortly or switch engine to VITON-HD (fast)."
              : `StableVITON error: ${msg}`
            : msg
        );
      }
    } catch (e: any) {
      const msg = e?.message || "Unexpected error";
      const isStable = selectedEngine === "stable_viton";
      const looksLikeWarmup = /not\s*ready|loading|model|warm\s*up|timeout|unavailable|503/i.test(
        msg
      );
      setError(
        isStable
          ? looksLikeWarmup
            ? "StableVITON is starting up. Try again soon or switch to VITON-HD for instant preview."
            : `StableVITON error: ${msg}`
          : msg
      );
    } finally {
      setIsLoading(false);
    }
  }, [personFile, clothFile, selectedEngine, category]);

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Virtual Try-On Test</h1>
      <p className="text-sm opacity-80">
        This page posts directly to the local FastAPI service at
        {" "}
        <code>http://127.0.0.1:8000/api/try-on</code>.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <label className="block text-sm font-medium">Person image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPersonFile(e.target.files?.[0] || null)}
          />
          {personFile && (
            <img
              src={URL.createObjectURL(personFile)}
              alt="person preview"
              className="mt-2 h-48 w-full object-cover rounded border"
            />
          )}
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium">Cloth image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setClothFile(e.target.files?.[0] || null)}
          />
          {clothFile && (
            <img
              src={URL.createObjectURL(clothFile)}
              alt="cloth preview"
              className="mt-2 h-48 w-full object-cover rounded border"
            />
          )}
        </div>
      </div>

      {/* Engine & category controls */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm">Engine</label>
        <select
          className="rounded border px-2 py-1 text-sm"
          value={selectedEngine}
          onChange={(e) => setSelectedEngine(e.target.value as any)}
        >
          <option value="viton_hd">VITON-HD (fast)</option>
          <option value="stable_viton">StableVITON (diffusion)</option>
        </select>
        <label className="ml-4 text-sm">Category</label>
        <select
          className="rounded border px-2 py-1 text-sm"
          value={category}
          onChange={(e) => setCategory(e.target.value as any)}
        >
          <option value="upper">Upper</option>
          <option value="bottom">Bottom</option>
        </select>
      </div>

      {/* StableVITON readiness banner */}
      {selectedEngine === "stable_viton" && (
        <div className="rounded-md border border-yellow-300 bg-yellow-50 text-yellow-900 p-3 text-sm">
          StableVITON may take 30–90s on the first call as the model warms up. If it times out,
          please retry shortly or switch to <span className="font-semibold">VITON-HD</span> for an instant preview.
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
        >
          {isLoading ? "Processing..." : "Run Try-On"}
        </button>
        {error && <span className="text-red-600 text-sm">{error}</span>}
        {selectedEngine === "stable_viton" && (
          <button
            type="button"
            className="rounded border px-3 py-2 text-sm"
            onClick={() => setSelectedEngine("viton_hd")}
            disabled={isLoading}
          >
            Switch to VITON-HD
          </button>
        )}
      </div>

      {rawResponse && (
        <pre className="whitespace-pre-wrap text-xs bg-black/5 p-3 rounded border overflow-auto max-h-64">
          {JSON.stringify(rawResponse, null, 2)}
        </pre>
      )}

      {resultUrl && (
        <div className="space-y-2">
          <h2 className="text-lg font-medium">Result</h2>
          <img
            src={resultUrl}
            alt="try-on result"
            className="w-full rounded border"
          />
          <a
            href={resultUrl}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 underline text-sm"
          >
            Open result in new tab
          </a>
        </div>
      )}
    </div>
  );
}
