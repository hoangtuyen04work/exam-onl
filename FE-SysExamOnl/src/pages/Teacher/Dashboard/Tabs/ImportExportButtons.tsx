// src/pages/Teacher/ImportExportButtons.tsx
interface ImportExportButtonsProps {
  onImport: () => void
  onExport: () => void
}

export default function ImportExportButtons({ onImport, onExport }: ImportExportButtonsProps) {
  return (
    <div className="fixed bottom-8 right-8 flex flex-col gap-3">
      <button onClick={onImport} className="px-5 py-2 bg-white border rounded-lg shadow hover:shadow-md text-sm">
        Import
      </button>
      <button onClick={onExport} className="px-5 py-2 bg-white border rounded-lg shadow hover:shadow-md text-sm">
        Export
      </button>
    </div>
  )
}