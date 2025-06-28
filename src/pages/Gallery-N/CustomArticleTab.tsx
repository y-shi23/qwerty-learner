import { ScrollArea } from '@/components/ui/scroll-area'
import { read as readDocx } from 'mammoth'
import { marked } from 'marked'
import * as pdfjsLib from 'pdfjs-dist'
import type { ChangeEvent, DragEvent } from 'react'
import { useRef, useState } from 'react'
import * as XLSX from 'xlsx'

// 设置 PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

interface CustomArticleTabProps {
  onSave: (article: any) => void
  onCancel: () => void
}

export function CustomArticleTab({ onSave, onCancel }: CustomArticleTabProps) {
  const [articleContent, setArticleContent] = useState('')
  const [articleTitle, setArticleTitle] = useState('')
  const [articleDescription, setArticleDescription] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processTextFile = async (file: File) => {
    const text = await file.text()
    setArticleContent(text)
    if (!articleTitle) {
      setArticleTitle(file.name.replace(/\.(txt|md|markdown)$/i, ''))
    }
    setShowPreview(true)
  }

  const processWordFile = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer()
    const result = await readDocx({ arrayBuffer })
    setArticleContent(result.value)
    if (!articleTitle) {
      setArticleTitle(file.name.replace(/\.(doc|docx)$/i, ''))
    }
    setShowPreview(true)
  }

  const processPdfFile = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    let fullText = ''

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items.map((item: any) => item.str).join(' ')
      fullText += pageText + '\n'
    }

    setArticleContent(fullText)
    if (!articleTitle) {
      setArticleTitle(file.name.replace(/\.pdf$/i, ''))
    }
    setShowPreview(true)
  }

  const processMarkdownFile = async (file: File) => {
    const text = await file.text()
    const html = marked(text)
    // 将HTML转换为纯文本
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html as string
    const plainText = tempDiv.textContent || tempDiv.innerText || ''
    setArticleContent(plainText)
    if (!articleTitle) {
      setArticleTitle(file.name.replace(/\.(md|markdown)$/i, ''))
    }
    setShowPreview(true)
  }

  const processFile = async (file: File) => {
    const fileName = file.name.toLowerCase()

    if (fileName.endsWith('.txt')) {
      await processTextFile(file)
    } else if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
      await processWordFile(file)
    } else if (fileName.endsWith('.pdf')) {
      await processPdfFile(file)
    } else if (fileName.endsWith('.md') || fileName.endsWith('.markdown')) {
      await processMarkdownFile(file)
    }
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      await processFile(file)
    }
  }

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (file) {
      const fileName = file.name.toLowerCase()
      if (
        fileName.endsWith('.txt') ||
        fileName.endsWith('.doc') ||
        fileName.endsWith('.docx') ||
        fileName.endsWith('.pdf') ||
        fileName.endsWith('.md') ||
        fileName.endsWith('.markdown')
      ) {
        await processFile(file)
      }
    }
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const handleSave = () => {
    const newArticle = {
      id: `custom-article-${Date.now()}`,
      name: articleTitle || `自定义文章 - ${Date.now()}`,
      title: articleTitle || `自定义文章 - ${Date.now()}`,
      description: articleDescription || '用户自定义文章',
      content: articleContent,
      category: '自定义',
      tags: ['自定义'],
      language: 'en' as const,
      languageCategory: 'ar' as const,
      length: articleContent.length,
      url: '',
      createdAt: new Date().toISOString(),
    }
    onSave(newArticle)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">文章标题</label>
        <input
          type="text"
          value={articleTitle}
          onChange={(e) => setArticleTitle(e.target.value)}
          placeholder="请输入文章标题"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">文章描述</label>
        <input
          type="text"
          value={articleDescription}
          onChange={(e) => setArticleDescription(e.target.value)}
          placeholder="请输入文章描述"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 sm:text-sm"
        />
      </div>

      {!showPreview && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="flex h-32 w-full cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-gray-300 text-gray-500 hover:border-indigo-500 dark:border-gray-600 dark:text-gray-400 dark:hover:border-indigo-400"
        >
          将 TXT/Word/Markdown/PDF 文件拖到此处，或
          <button
            onClick={() => fileInputRef.current?.click()}
            className="ml-2 text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            点击上传
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".txt,.doc,.docx,.pdf,.md,.markdown"
            className="hidden"
          />
        </div>
      )}

      {showPreview && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">文章预览</label>
            <button
              onClick={() => {
                setShowPreview(false)
                setArticleContent('')
                setArticleTitle('')
                setArticleDescription('')
              }}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              重新上传
            </button>
          </div>
          <div
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700"
            style={{
              height: Math.max(200, Math.min(600, articleContent.split('\n').length * 20 + 100)) + 'px',
              resize: 'vertical',
              overflow: 'hidden',
            }}
          >
            <ScrollArea className="h-full w-full p-4">
              <textarea
                value={articleContent}
                onChange={(e) => setArticleContent(e.target.value)}
                className="h-full w-full resize-none border-none bg-transparent text-sm focus:outline-none dark:text-white"
                placeholder="文章内容将在这里显示，您可以直接编辑..."
                style={{ minHeight: Math.max(180, articleContent.split('\n').length * 20 + 50) + 'px' }}
              />
            </ScrollArea>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">字符数: {articleContent.length}</div>
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <button
          onClick={onCancel}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          取消
        </button>
        <button
          onClick={handleSave}
          disabled={!articleContent.trim()}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          保存
        </button>
      </div>
    </div>
  )
}
