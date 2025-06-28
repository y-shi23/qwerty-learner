import { CustomArticleTab } from './CustomArticleTab'
import { CustomDictionaryTab } from './CustomDictionaryTab'
import { SuccessAlert } from '@/components/ui/SuccessAlert'
import { dictionaries } from '@/resources/dictionary'
import { isOpenDarkModeAtom } from '@/store'
import { useAtom } from 'jotai'
import { useState } from 'react'

export function CustomDictionaryButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'dictionary' | 'article'>('dictionary')
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [isOpenDarkMode] = useAtom(isOpenDarkModeAtom)

  const handleSaveDictionary = (dictionary: any) => {
    const customDicts = JSON.parse(localStorage.getItem('custom-dictionaries') || '[]')
    customDicts.push(dictionary)
    localStorage.setItem('custom-dictionaries', JSON.stringify(customDicts))
    dictionaries.push(dictionary as any)
    setSuccessMessage('自定义词典已保存，页面即将刷新以查看更改。')
    setShowSuccessAlert(true)
    setIsOpen(false)
    // 延迟刷新页面，让用户看到成功消息
    setTimeout(() => {
      window.location.reload()
    }, 1500)
  }

  const handleSaveArticle = (article: any) => {
    const customArticles = JSON.parse(localStorage.getItem('custom-articles') || '[]')
    customArticles.push(article)
    localStorage.setItem('custom-articles', JSON.stringify(customArticles))
    // 将文章添加到dictionaries中，以便在Gallery中显示
    dictionaries.push(article as any)
    setSuccessMessage('自定义文章已保存，页面即将刷新以查看更改。')
    setShowSuccessAlert(true)
    setIsOpen(false)
    // 延迟刷新页面，让用户看到成功消息
    setTimeout(() => {
      window.location.reload()
    }, 1500)
  }

  const handleCancel = () => {
    setIsOpen(false)
  }

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        自定义内容
      </button>
      {isOpen && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsOpen(false)}></div>
            <div className="relative w-full max-w-xl transform rounded-lg bg-white p-6 shadow-xl transition-all dark:bg-gray-800">
              {/* 分栏标题 */}
              <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-gray-600">
                <div className="flex space-x-4">
                  <button
                    onClick={() => setActiveTab('dictionary')}
                    className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                      activeTab === 'dictionary'
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                  >
                    自定义词典
                  </button>
                  <button
                    onClick={() => setActiveTab('article')}
                    className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                      activeTab === 'article'
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                  >
                    自定义文章
                  </button>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  ✕
                </button>
              </div>

              {/* 分栏内容 */}
              <div className="mt-6">
                {activeTab === 'dictionary' && <CustomDictionaryTab onSave={handleSaveDictionary} onCancel={handleCancel} />}
                {activeTab === 'article' && <CustomArticleTab onSave={handleSaveArticle} onCancel={handleCancel} />}
              </div>
            </div>
          </div>
        </div>
      )}
      <SuccessAlert show={showSuccessAlert} setShow={setShowSuccessAlert} message={successMessage} />
    </div>
  )
}
