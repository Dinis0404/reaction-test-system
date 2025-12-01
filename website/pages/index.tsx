import Head from 'next/head';
import QuizContainer from '../components/QuizContainer';
import { useState } from 'react';

interface Folder {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

const folders: Folder[] = [
  {
    id: 'all',
    name: '全部題庫',
    description: '包含所有題目檔案',
    icon: '📚',
    color: 'from-blue-500 to-blue-600'
  },
  {
    id: 'chinese',
    name: '語文',
    description: '語文相關題目',
    icon: '📖',
    color: 'from-red-500 to-red-600'
  },
  {
    id: 'math',
    name: '數學',
    description: '數學相關題目',
    icon: '🔢',
    color: 'from-purple-500 to-purple-600'
  },
  {
    id: 'english',
    name: '英文',
    description: '英文相關題目',
    icon: '🔤',
    color: 'from-green-500 to-green-600'
  },
  {
    id: 'other',
    name: '其他',
    description: '其他類別題目',
    icon: '📦',
    color: 'from-yellow-500 to-yellow-600'
  }
];

export default function Home() {
  const [selectedFolder, setSelectedFolder] = useState<string>('all');

  return (
    <>
      <Head>
        <title>反應力測試</title>
        <meta name="description" content="反應力測試系統" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-4 md:py-8">
        <div className="w-full max-w-7xl mx-auto px-4">
          <header className="text-center mb-8 md:mb-12">
            <div className="inline-block p-4 bg-gray-800 rounded-2xl shadow-lg mb-4 border border-gray-700">
              <svg className="w-16 h-16 text-blue-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-3">
              反应力测试
            </h1>
            <p className="text-base md:text-xl text-gray-300 max-w-2xl mx-auto">
              恭喜Furia夺得IEM成都冠军！
            </p>
          </header>

          {/* 资料夹选择区域 */}
          <div className="mb-8 md:mb-12">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-xl p-6 md:p-8 border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-100 flex items-center gap-3">
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  選擇題庫資料夾
                </h2>
                <div className="text-sm text-gray-400 bg-gray-700/50 px-3 py-1 rounded-full border border-gray-600">
                  當前選擇: {folders.find(f => f.id === selectedFolder)?.name}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => setSelectedFolder(folder.id)}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                      selectedFolder === folder.id
                        ? `bg-gradient-to-r ${folder.color} border-transparent shadow-lg`
                        : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-2">{folder.icon}</div>
                      <h3 className={`font-bold text-lg mb-1 ${
                        selectedFolder === folder.id ? 'text-white' : 'text-gray-200'
                      }`}>
                        {folder.name}
                      </h3>
                      <p className={`text-sm ${
                        selectedFolder === folder.id ? 'text-blue-100' : 'text-gray-400'
                      }`}>
                        {folder.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="w-full">
            <QuizContainer selectedFolder={selectedFolder} />
          </div>
        </div>
      </main>
    </>
  );
}

