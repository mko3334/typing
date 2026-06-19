import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export default function PlayerTagEditModal({
  isOpen,
  title,
  subtitle,
  availableTags,
  initialTags,
  mode = 'set',
  onClose,
  onSave,
}) {
  const [selectedTags, setSelectedTags] = useState([]);
  const [newTagInput, setNewTagInput] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setSelectedTags(Array.isArray(initialTags) ? [...initialTags] : []);
    setNewTagInput('');
  }, [isOpen, initialTags]);

  if (!isOpen) return null;

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((entry) => entry !== tag) : [...prev, tag],
    );
  };

  const addNewTag = () => {
    const trimmed = newTagInput.trim();
    if (!trimmed || selectedTags.includes(trimmed)) {
      setNewTagInput('');
      return;
    }
    setSelectedTags((prev) => [...prev, trimmed]);
    setNewTagInput('');
  };

  const tagCandidates = [...new Set([...availableTags, ...selectedTags])].sort();

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-3xl border-4 border-indigo-400 shadow-2xl p-5 flex flex-col max-h-[85vh] animate-pop-out"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-4 shrink-0">
          <div>
            <h3 className="text-lg font-black text-indigo-800">{title}</h3>
            {subtitle && <p className="text-xs font-bold text-gray-500 mt-1">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors shrink-0"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          <div>
            <p className="text-xs font-black text-gray-500 mb-2">
              {mode === 'add' ? 'つけるタグを タップして えらんでね' : 'タグを タップして ON/OFF'}
            </p>
            {tagCandidates.length === 0 ? (
              <p className="text-xs font-bold text-gray-400 bg-gray-50 border border-dashed border-gray-200 rounded-xl py-4 text-center">
                まだタグがありません。下で あたらしく つくってね
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tagCandidates.map((tag) => {
                  const active = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black border-2 transition-all cursor-pointer ${
                        active
                          ? 'bg-indigo-500 text-white border-indigo-500 shadow-sm'
                          : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-black text-gray-500 mb-2">あたらしく タグを つくる</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTagInput}
                onChange={(event) => setNewTagInput(event.target.value)}
                placeholder="例: 1年1組"
                maxLength={15}
                className="flex-1 px-3 py-2 border-2 border-indigo-100 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-400 bg-white"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addNewTag();
                  }
                }}
              />
              <button
                type="button"
                onClick={addNewTag}
                disabled={!newTagInput.trim()}
                className="px-3 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 text-white font-black text-xs rounded-xl transition-all shrink-0"
              >
                追加
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black rounded-xl transition-colors"
          >
            やめる
          </button>
          <button
            type="button"
            onClick={() => onSave(selectedTags, newTagInput.trim())}
            className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-black rounded-xl shadow-lg transition-all"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
