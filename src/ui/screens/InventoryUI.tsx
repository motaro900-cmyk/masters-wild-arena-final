import { useGameStore } from '../../store/useGameStore';

export const InventoryUI = () => {
    return (
        <div className="absolute inset-0 bg-[#0f131f]/90 backdrop-blur-md flex items-center justify-center pointer-events-auto">
            <div className="w-[1000px] h-[600px] bg-[#1a1f33] border-2 border-[#2a314a] rounded-2xl p-8 flex flex-col shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-black text-white tracking-widest">ИНВЕНТАРЬ</h2>
                    <button
                        onClick={() => useGameStore.setState({ activeScreen: 'MAIN_MENU' })}
                        className="bg-red-500/80 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-400 transition-colors border border-red-400"
                    >
                        ЗАКРЫТЬ
                    </button>
                </div>
                <div className="grid grid-cols-6 gap-4">
                    <div className="aspect-square bg-[#131726] border-2 border-purple-500 rounded-xl flex items-center justify-center text-6xl cursor-pointer hover:scale-105 transition-transform">
                        🍳
                    </div>
                    <div className="aspect-square bg-[#131726] border-2 border-blue-500 rounded-xl flex items-center justify-center text-6xl cursor-pointer hover:scale-105 transition-transform">
                        🩴
                    </div>
                    <div className="aspect-square bg-[#131726] border-2 border-green-500 rounded-xl flex items-center justify-center text-6xl cursor-pointer hover:scale-105 transition-transform">
                        🐟
                    </div>
                    <div className="aspect-square bg-[#131726] border-2 border-gray-400 rounded-xl flex items-center justify-center text-6xl cursor-pointer hover:scale-105 transition-transform">
                        🦯
                    </div>
                    {[...Array(14)].map((_, i) => (
                        <div key={i} className="aspect-square bg-[#131726] border-2 border-[#2a314a]/50 rounded-xl" />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default InventoryUI;
