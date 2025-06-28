import { ScrollArea } from '@/components/ui/scroll-area'
import type { LanguageCategoryType, Word } from '@/typings'
import type { ChangeEvent, DragEvent } from 'react'
import { useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import IconMinusCircle from '~icons/mdi/minus-circle-outline'

interface CustomDictionaryTabProps {
  onSave: (dictionary: any) => void
  onCancel: () => void
}

export function CustomDictionaryTab({ onSave, onCancel }: CustomDictionaryTabProps) {
  const [language, setLanguage] = useState<LanguageCategoryType>('en')
  const [words, setWords] = useState<Partial<Word>[]>([])
  const [dictName, setDictName] = useState('')
  const [dictDescription, setDictDescription] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const json = XLSX.utils.sheet_to_json<any>(worksheet)
      const newWords = json.map((row) => ({ name: row.name, trans: [row.trans] }))
      setWords(newWords)
      if (!dictName) {
        setDictName(file.name.replace(/\.(xlsx|xls)$/i, ''))
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      processFile(file)
    }
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const handleAddWord = () => {
    setWords([...words, { name: '', trans: [''] }])
    // 延迟滚动到最后一个单词，确保DOM已更新
    setTimeout(() => {
      const wordListContainer = document.querySelector('.word-list-container')
      if (wordListContainer) {
        wordListContainer.scrollTop = wordListContainer.scrollHeight
      }
    }, 100)
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
    // 过滤掉空内容的单词
    const validWords = words.filter((word) => word.name && word.name.trim() && word.trans && word.trans[0] && word.trans[0].trim())

    const newDict = {
      id: `custom-${language}-${Date.now()}`,
      name: dictName || `自定义词典 - ${language}`,
      description: dictDescription || '用户自定义词典',
      category: '自定义',
      tags: ['自定义'],
      language,
      languageCategory: language,
      length: validWords.length,
      url: '',
      content: validWords as Word[],
    }
    onSave(newDict)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">词典名称</label>
        <input
          type="text"
          value={dictName}
          onChange={(e) => setDictName(e.target.value)}
          placeholder="请输入词典名称"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">词典描述</label>
        <input
          type="text"
          value={dictDescription}
          onChange={(e) => setDictDescription(e.target.value)}
          placeholder="请输入词典描述"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">词典类型</label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as LanguageCategoryType)}
          className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
        >
          <option value="en">英语</option>
          <option value="de">德语</option>
          <option value="ja">日语</option>
        </select>
      </div>

      {words.length === 0 && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="flex h-32 w-full cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-gray-300 text-gray-500 hover:border-indigo-500 dark:border-gray-600 dark:text-gray-400 dark:hover:border-indigo-400"
        >
          将 XLS/XLSX 文件拖到此处，或
          <button
            onClick={() => fileInputRef.current?.click()}
            className="ml-2 text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            点击上传
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx,.xls" className="hidden" />
        </div>
      )}
      {words.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">单词列表</label>
            <button
              onClick={() => {
                setWords([])
                setDictName('')
                setDictDescription('')
              }}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              重新上传
            </button>
          </div>
          <ScrollArea
            className="word-list-container rounded-md border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700"
            style={{
              maxHeight: '9rem',
              height: words.length > 3 ? '9rem' : `${Math.max(3, words.length * 3)}rem`,
            }}
          >
            <div className="space-y-2">
              {words.map((word, index) => (
                <div key={index} className="flex w-full items-center gap-2">
                  <input
                    type="text"
                    placeholder="单词"
                    value={word.name || ''}
                    onChange={(e) => handleWordChange(index, 'name', e.target.value)}
                    className="min-w-0 flex-1 rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="释义"
                    value={word.trans?.[0] || ''}
                    onChange={(e) => handleWordChange(index, 'trans', e.target.value)}
                    className="min-w-0 flex-1 rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                  />
                  <button
                    onClick={() => handleRemoveWord(index)}
                    className="flex-shrink-0 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                  >
                    <IconMinusCircle className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      <div>
        <button
          onClick={handleAddWord}
          className="text-sm text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          + 添加单词
        </button>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          onClick={onCancel}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          取消
        </button>
        <button
          onClick={handleSave}
          disabled={
            words.length === 0 ||
            !words.some((word) => word.name && word.name.trim() && word.trans && word.trans[0] && word.trans[0].trim())
          }
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:hover:bg-gray-400"
        >
          保存
        </button>
      </div>
    </div>
  )
}
