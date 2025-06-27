import { SuccessAlert } from '@/components/ui/SuccessAlert'
import type { Dictionary, LanguageCategoryType, Word } from '@/typings'
import type { ChangeEvent } from 'react'
import { useState, useEffect } from 'react'
import IconMinusCircle from '~icons/mdi/minus-circle-outline'

interface Props {
  dictionary: Dictionary
  onClose: () => void
}

export function CustomDictionaryEditModal({ dictionary, onClose }: Props) {
  const [language, setLanguage] = useState<LanguageCategoryType>(dictionary.languageCategory as LanguageCategoryType)
  const [words, setWords] = useState<Partial<Word>[]>([])
  const [dictName, setDictName] = useState(dictionary.name)
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)

  useEffect(() => {
    // 从 localStorage 获取自定义词典的完整数据
    const customDicts = JSON.parse(localStorage.getItem('custom-dictionaries') || '[]')
    const currentDict = customDicts.find((dict: any) => dict.id === dictionary.id)
    if (currentDict && currentDict.content) {
      setWords(currentDict.content)
    }
  }, [dictionary.id])

  const handleAddWord = () => {
    setWords([...words, { name: '', trans: [''] }])
  }

  const handleRemoveWord = (index: number) => {
    setWords(words.filter((_, i) => i !== index))
  }

  const handleWordChange = (index: number, field: 'name' | 'trans', value: string) => {
    const newWords = [...words]
    if (field === 'trans') {
      newWords[index][field] = [value]
    } else {
      newWords[index][field] = value
    }
    setWords(newWords)
  }

  const handleSave = () => {
    const customDicts = JSON.parse(localStorage.getItem('custom-dictionaries') || '[]')
    const updatedDicts = customDicts.map((dict: any) => {
      if (dict.id === dictionary.id) {
        return {
          ...dict,
          name: dictName,
          language,
          languageCategory: language,
          length: words.length,
          content: words as Word[],
        }
      }
      return dict
    })
    localStorage.setItem('custom-dictionaries', JSON.stringify(updatedDicts))
    setShowSuccessAlert(true)
    // 延迟关闭模态框和刷新页面，让用户看到成功消息
    setTimeout(() => {
      onClose()
      window.location.reload()
    }, 1500)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        <div className="relative w-full max-w-2xl transform rounded-lg bg-white p-6 shadow-xl transition-all">
          <h3 className="text-xl font-semibold text-gray-900">编辑自定义词典</h3>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">词典名称</label>
            <input
              type="text"
              value={dictName}
              onChange={(e) => setDictName(e.target.value)}
              placeholder="请输入词典名称"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">词典类型</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as LanguageCategoryType)}
              className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            >
              <option value="en">英语</option>
              <option value="de">德语</option>
              <option value="ja">日语</option>
            </select>
          </div>
          {words.length > 0 && (
            <div className="mt-4">
              <div
                className="overflow-y-auto rounded-md border border-gray-300 p-2"
                style={{ maxHeight: '12rem', height: words.length > 3 ? '12rem' : 'auto' }}
              >
                {words.map((word, index) => (
                  <div key={index} className="grid grid-cols-[1fr_1fr_auto] items-center gap-4 py-1">
                    <input
                      type="text"
                      placeholder="单词"
                      value={word.name || ''}
                      onChange={(e) => handleWordChange(index, 'name', e.target.value)}
                      className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <input
                      type="text"
                      placeholder="释义"
                      value={word.trans?.[0] || ''}
                      onChange={(e) => handleWordChange(index, 'trans', e.target.value)}
                      className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <button onClick={() => handleRemoveWord(index)} className="text-gray-400 hover:text-red-500">
                      <IconMinusCircle className="h-6 w-6" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="mt-2">
            <button onClick={handleAddWord} className="text-sm text-indigo-600 hover:text-indigo-900">
              + 添加单词
            </button>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              保存
            </button>
          </div>
        </div>
      </div>
      <SuccessAlert
        show={showSuccessAlert}
        title="保存成功"
        message="词典已更新，页面即将刷新以查看更改。"
        onClose={() => setShowSuccessAlert(false)}
        autoClose={true}
        autoCloseDelay={1500}
      />
    </div>
  )
}