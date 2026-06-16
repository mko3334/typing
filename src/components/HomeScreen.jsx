import React from 'react';
import { Keyboard, Map, Gift, Store, User, Settings } from 'lucide-react';
import { BACKGROUNDS } from '../constants';

export default function HomeScreen({ player, onNavigate, onLogout }) {
  const bgItem = BACKGROUNDS.find(b => b.id === (player?.currentBackground || 'default')) || BACKGROUNDS[0];

  return (
    <div className="min-h-screen w-full relative flex flex-col items-center justify-center p-4">
      {/* Background Setup */}
      <div className="absolute inset-0 z-[-1] pointer-events-none transition-all duration-1000 ease-in-out">
        <img 
          src={bgItem.url} 
          alt="Home Background" 
          className="absolute inset-0 w-full h-full object-cover object-center opacity-80" 
        />
      </div>

      {/* Header */}
      <header className="absolute top-4 left-4 right-4 flex justify-between items-center bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-md border-2 border-white/50 z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
            <User className="text-sky-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500">プレイヤー</p>
            <p className="text-2xl font-black text-gray-800">{player?.name}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <p className="text-lg font-black text-yellow-600 flex items-center gap-2">
              🪙 {player?.points || 0}
            </p>
            <p className="text-lg font-black text-green-600 flex items-center gap-2">
              🎟️ {player?.tickets || 0}
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => onNavigate('settings')}
              className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-colors"
            >
              <Settings className="w-6 h-6" />
            </button>
            <button 
              onClick={onLogout}
              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 font-bold rounded-xl transition-colors"
            >
              もどる
            </button>
          </div>
        </div>
      </header>

      {/* Main Menu */}
      <main className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 gap-6 mt-20">
        <button 
          onClick={() => onNavigate('typing')}
          className="group relative overflow-hidden bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-xl border-4 border-transparent hover:border-sky-400 hover:-translate-y-2 transition-all flex flex-col items-center justify-center gap-4 min-h-[250px]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-sky-400 to-blue-500 opacity-0 group-hover:opacity-10 transition-opacity" />
          <div className="w-24 h-24 bg-sky-100 rounded-full flex items-center justify-center border-4 border-white shadow-md group-hover:scale-110 transition-transform">
            <Keyboard className="w-12 h-12 text-sky-500" />
          </div>
          <h2 className="text-3xl font-black text-gray-800">タイピング</h2>
          <p className="text-gray-500 font-bold">れんしゅうしてポイントをゲット！</p>
        </button>

        <button 
          onClick={() => onNavigate('quest')}
          className="group relative overflow-hidden bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-xl border-4 border-transparent hover:border-orange-400 hover:-translate-y-2 transition-all flex flex-col items-center justify-center gap-4 min-h-[250px]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-red-500 opacity-0 group-hover:opacity-10 transition-opacity" />
          <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center border-4 border-white shadow-md group-hover:scale-110 transition-transform">
            <Map className="w-12 h-12 text-orange-500" />
          </div>
          <h2 className="text-3xl font-black text-gray-800">クエスト</h2>
          <p className="text-gray-500 font-bold">マップをすすんで冒険しよう！</p>
        </button>

        <button 
          onClick={() => onNavigate('gacha')}
          className="group relative overflow-hidden bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-xl border-4 border-transparent hover:border-purple-400 hover:-translate-y-2 transition-all flex flex-col items-center justify-center gap-4 min-h-[250px]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-500 opacity-0 group-hover:opacity-10 transition-opacity" />
          <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center border-4 border-white shadow-md group-hover:scale-110 transition-transform animate-pulse">
            <Gift className="w-12 h-12 text-purple-500" />
          </div>
          <h2 className="text-3xl font-black text-gray-800">ガチャ・ショップ</h2>
          <p className="text-gray-500 font-bold">アイテムや称号をゲット！</p>
        </button>

        <button 
          onClick={() => onNavigate('mall')}
          className="group relative overflow-hidden bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-xl border-4 border-transparent hover:border-green-400 hover:-translate-y-2 transition-all flex flex-col items-center justify-center gap-4 min-h-[250px]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-500 opacity-0 group-hover:opacity-10 transition-opacity" />
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center border-4 border-white shadow-md group-hover:scale-110 transition-transform">
            <Store className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="text-3xl font-black text-gray-800">マイモール</h2>
          <p className="text-gray-500 font-bold">自分だけのお店をつくろう！</p>
        </button>
      </main>
    </div>
  );
}
