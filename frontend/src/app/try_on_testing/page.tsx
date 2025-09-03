"use client";

import React, { useState } from "react";

interface TryOnDoneResponse {
  success?: boolean;
  imageUrl?: string;
  imageBase64?: string;
  provider?: string;
  jobId?: string;
  status?: string;
  message?: string;
  error?: string;
  errorCode?: string;
}

export default function TryOnTestingPage() {
  const [person, setPerson] = useState<File | null>(null);
  const [garment, setGarment] = useState<File | null>(null);
  const [fastMode, setFastMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    setResultUrl(null);
    if (!person || !garment) {
      setError("Please choose both a person image and a garment image.");
      return;
    }
    try {
      setLoading(true);
      const fd = new FormData();
      fd.append("person_image", person);
      fd.append("garment_image", garment);
      fd.append("fast_mode", String(fastMode));

      const res = await fetch("/api/tryon/tryonapi", {
        method: "POST",
        body: fd,
      });

      const data = (await res.json()) as TryOnDoneResponse;
      if (!res.ok) {
        setError(data.error || data.message || "Failed to process try-on.");
        return;
      }

      if (data.imageUrl) {
        setResultUrl(data.imageUrl);
      } else if (data.imageBase64) {
        setResultUrl(`data:image/png;base64,${data.imageBase64}`);
      } else if (data.status && data.status !== "completed") {
        setError(data.message || `Status: ${data.status}`);
      } else {
        setError("No image returned by the API.");
      }
    } catch (e: any) {
      setError(e?.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Try-On Testing (TryOnAPI)</h1>
      <p className="text-sm opacity-80">
        Upload a person image and a garment image. The request is sent to our server route
        <code className="ml-1">/api/tryon/tryonapi</code> which securely calls the external TryOn API.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <label className="block text-sm font-medium">Person image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPerson(e.target.files?.[0] || null)}
          />
          {person && (
            <img
              src={URL.createObjectURL(person)}
              alt="person preview"
              className="mt-2 h-48 w-full object-cover rounded border"
            />
          )}
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium">Garment image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setGarment(e.target.files?.[0] || null)}
          />
          {garment && (
            <img
              src={URL.createObjectURL(garment)}
              alt="garment preview"
              className="mt-2 h-48 w-full object-cover rounded border"
            />
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm flex items-center gap-2">
          <input
            type="checkbox"
            checked={fastMode}
            onChange={(e) => setFastMode(e.target.checked)}
          />
          Fast mode
        </label>
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading}
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
        >
          {loading ? "Processing..." : "Generate Try-On"}
        </button>
        {error && <span className="text-red-600 text-sm">{error}</span>}
      </div>

      {resultUrl && (
        <div className="space-y-2">
          <h2 className="text-lg font-medium">Result</h2>
          <img src={resultUrl} alt="try-on result" className="w-full rounded border" />
          <a
            href={resultUrl}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 underline text-sm"
          >
            Open image in new tab
          </a>
        </div>
      )}
    </div>
  );
}
