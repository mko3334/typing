import React from 'react';
import { Trash2, X } from 'lucide-react';

export default function TagManagePanel({
  allTags,
  selectedTag,
  onSelectTag,
  newTagInput,
  onNewTagInputChange,
  onCreateTag,
  onDeleteTag,
  onStartBulkTagMode,
  onClose,
}) {
  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[65] flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white p-5 rounded-3xl border-4 border-indigo-400 shadow-2xl w-full max-w-sm flex flex-col max-h-[80vh] animate-pop-out"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h3 className="text-base font-black text-indigo-800">🏷️ タグかんり</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto pr-1">
          {allTags.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-black text-gray-500">タグで しぼりこむ</span>
              <div className="flex items-center gap-2">
                <select
                  value={selectedTag}
                  onChange={(event) => onSelectTag(event.target.value)}
                  className="flex-1 px-3 py-2 border-2 border-indigo-200 rounded-xl text-xs font-black text-gray-700 bg-white focus:outline-none focus:border-indigo-400 cursor-pointer"
                >
                  <option value="">すべて</option>
                  {allTags.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
                {selectedTag && (
                  <button
                    type="button"
                    onClick={() => onDeleteTag(selectedTag)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors border border-red-200 cursor-pointer"
                    title="このタグを すべての プレイヤーから 削除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400 font-bold py-3 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
              登録されたタグが まだありません
            </p>
          )}

          <div className="border-t border-gray-100" />

          <button
            type="button"
            onClick={onStartBulkTagMode}
            className="w-full py-2.5 rounded-xl text-xs font-black shadow-sm transition-all border-2 flex items-center justify-center gap-1.5 cursor-pointer bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50"
          >
            🏷️ まとめて タグ付け
          </button>

          <div className="border-t border-gray-100" />

          <div className="flex flex-col gap-1.5 shrink-0">
            <span className="text-xs font-black text-gray-500">あたらしく タグを つくる</span>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="新しいタグ名"
                value={newTagInput}
                onChange={(event) => onNewTagInputChange(event.target.value)}
                maxLength={15}
                className="flex-1 px-3 py-2 border-2 border-indigo-100 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-400 bg-white"
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && newTagInput.trim()) {
                    event.preventDefault();
                    onCreateTag(newTagInput);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => onCreateTag(newTagInput)}
                disabled={!newTagInput.trim()}
                className="px-3 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 text-white font-black text-xs rounded-xl transition-all shrink-0"
              >
                つくる
              </button>
            </div>
            <p className="text-[10px] font-bold text-gray-400">
              カード右上の 🏷️ から、各プレイヤーに タグを つけられます
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-black text-sm rounded-xl transition-all cursor-pointer"
          >
            とじる
          </button>
        </div>
      </div>
    </div>
  );
}
