"use client";

import { useMemo, useState } from "react";
import { FileText } from "lucide-react";
import { parseDecklistText } from "@/services/deckParser.mjs";
import { createYgoprodeckImporter } from "@/services/ygoprodeckImport.mjs";

export default function DeckImportForm({ setUrlList }) {
  const [deckText, setDeckText] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [summary, setSummary] = useState(null);
  const [progress, setProgress] = useState({
    urls: 0,
    resolved: 0,
    failures: 0,
  });

  const importer = useMemo(() => createYgoprodeckImporter(), []);

  const handleImport = async () => {
    const parsed = parseDecklistText(deckText);
    if (parsed.items.length === 0) {
      setSummary({
        skipped: parsed.skipped,
        failures: [
          { reason: "Khong tim thay dong card hop le de import." },
        ],
        inserted: 0,
      });
      return;
    }

    setIsImporting(true);
    setProgress({ urls: 0, resolved: 0, failures: 0 });
    setSummary(null);

    try {
      const result = await importer.importCards(parsed.items, {
        onProgress: setProgress,
      });
      if (result.urls.length > 0) {
        setUrlList((prev) => [...prev, ...result.urls]);
      }
      setSummary({
        skipped: parsed.skipped,
        failures: result.failures,
        inserted: result.urls.length,
        resolved: result.resolved.length,
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="mb-4 rounded border border-gray-300 bg-white p-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
        <FileText size={16} />
        Import decklist
      </div>
      <textarea
        className="min-h-32 w-full resize-y rounded border border-gray-300 p-2 text-sm focus:border-green-500 focus:outline-none"
        placeholder={'#main\n46986414\n3 Dark Magician\n"Dark Magician Girl" x2'}
        value={deckText}
        disabled={isImporting}
        onChange={(event) => setDeckText(event.target.value)}
      />
      <button
        type="button"
        className="mt-2 w-full rounded bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
        disabled={isImporting}
        onClick={handleImport}
      >
        {isImporting ? "Dang import..." : "Import anh"}
      </button>
      {isImporting && (
        <p className="mt-2 text-xs text-gray-600">
          Da xu ly {progress.resolved} card, them {progress.urls} anh, loi{" "}
          {progress.failures}.
        </p>
      )}
      {summary && (
        <div className="mt-2 space-y-1 text-xs text-gray-700">
          <p>Da them {summary.inserted} anh.</p>
          {summary.skipped.length > 0 && (
            <p className="text-yellow-700">
              Bo qua {summary.skipped.length} dong khong nhan dang duoc.
            </p>
          )}
          {summary.failures.length > 0 && (
            <div className="text-red-600">
              <p>Loi {summary.failures.length} muc:</p>
              <ul className="max-h-24 list-disc overflow-y-auto pl-4">
                {summary.failures.slice(0, 6).map((failure, index) => (
                  <li key={`${failure.lineNumber || "general"}-${index}`}>
                    {failure.lineNumber ? `Dong ${failure.lineNumber}: ` : ""}
                    {failure.value ? `${failure.value} - ` : ""}
                    {failure.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
