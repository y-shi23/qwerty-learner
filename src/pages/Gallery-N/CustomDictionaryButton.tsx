import { SuccessAlert } from '@/components/ui/SuccessAlert'
import { dictionaries } from '@/resources/dictionary'
import type { LanguageCategoryType, Word } from '@/typings'
import type { ChangeEvent, DragEvent } from 'react'
import { useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import IconMinusCircle from '~icons/mdi/minus-circle-outline'

export function CustomDictionaryButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [language, setLanguage] = useState<LanguageCategoryType>('en')
  const [words, setWords] = useState<Partial<Word>[]>([])
  const [dictName, setDictName] = useState('')
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)
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
    const newDict = {
      id: `custom-${language}-${Date.now()}`,
      name: dictName || `自定义词典 - ${language}`,
      description: '用户自定义词典',
      category: '自定义',
      tags: ['自定义'],
      language,
      languageCategory: language,
      length: words.length,
      url: '', // This will be handled differently, maybe store in localStorage
      content: words as Word[],
    }
    const customDicts = JSON.parse(localStorage.getItem('custom-dictionaries') || '[]')
    customDicts.push(newDict)
    localStorage.setItem('custom-dictionaries', JSON.stringify(customDicts))
    setShowSuccessAlert(true)
    dictionaries.push(newDict as any)
    setIsOpen(false)
  }

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        自定义词典
      </button>
      {isOpen && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsOpen(false)}></div>
            <div className="relative w-full max-w-2xl transform rounded-lg bg-white p-6 shadow-xl transition-all">
              <h3 className="text-xl font-semibold text-gray-900">自定义词典</h3>
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
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="mt-4 flex h-32 w-full cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-gray-300 text-gray-500 hover:border-indigo-500"
              >
                将 XLS/XLSX 文件拖到此处，或
                <button onClick={() => fileInputRef.current?.click()} className="ml-2 text-indigo-600 hover:text-indigo-900">
                  点击上传
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx,.xls" className="hidden" />
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
                  onClick={() => setIsOpen(false)}
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
        </div>
      )}
      <SuccessAlert
        show={showSuccessAlert}
        setShow={setShowSuccessAlert}
        message="自定义词典已保存，请刷新页面查看。"
      />
    </div>
  )
}
