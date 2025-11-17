// src/pages/Teacher/SessionResultModal.tsx
import React from 'react'
import { toast } from 'react-toastify'

interface SessionResultModalProps {
  isOpen: boolean
  data: any // Adjust type
  onClose: () => void
}

export default function SessionResultModal({ isOpen, data, onClose }: SessionResultModalProps) {
  if (!isOpen) return null

  const formatDate = (iso: string) => new Date(iso).toLocaleString('vi-VN')

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h3 className="text-xl font-bold mb-4 text-gray-800">Phiên thi đã tạo</h3>
        <div className="space-y-4 text-sm">
          <p><strong>Tên:</strong> {data.name}</p>
          <p><strong>Link:</strong> <a href={data.inviteLink} className="text-blue-600">{data.inviteLink}</a></p>
          <p><strong>Mã:</strong> {data.code}</p>
          <p><strong>Bắt đầu:</strong> {formatDate(data.startAt)}</p>
          <p><strong>Kết thúc:</strong> {formatDate(data.expiredAt)}</p>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => {
              navigator.clipboard.writeText(data.inviteLink)
              toast.success('Copied link')
            }}
            className="px-4 py-2 bg-blue-100 text-blue-600 rounded"
          >
            Copy Link
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(data.code)
              toast.success('Copied code')
            }}
            className="px-4 py-2 bg-green-100 text-green-600 rounded"
          >
            Copy Mã
          </button>
          <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded">
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}