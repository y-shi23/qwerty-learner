import { ScrollArea } from '@/components/ui/scroll-area'
import * as mammoth from 'mammoth'
import { marked } from 'marked'
import * as pdfjsLib from 'pdfjs-dist'
import type { ChangeEvent, DragEvent } from 'react'
import { useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import IconMinusCircle from '~icons/mdi/minus-circle-outline'

// 设置 PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

interface Chapter {
  content: string
}

interface CustomArticleTabProps {
  onSave: (article: any) => void
  onCancel: () => void
}

export function CustomArticleTab({ onSave, onCancel }: CustomArticleTabProps) {
  const [articleContent, setArticleContent] = useState('')
  const [articleTitle, setArticleTitle] = useState('')
  const [articleDescription, setArticleDescription] = useState('')
  const [chapters, setChapters] = useState<Chapter[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollChapterListToBottom = () => {
    setTimeout(() => {
      const container = document.querySelector('.chapter-list-container') as HTMLElement | null
      if (container) container.scrollTop = container.scrollHeight
    }, 50)
  }

  const processTextFile = async (file: File) => {
    const text = await file.text()
    setArticleContent(text)
    if (!articleTitle) {
      setArticleTitle(file.name.replace(/\.(txt|md|markdown)$/i, ''))
    }
    // 一个文件对应一个章节
    setChapters((prev) => {
      const next = [...prev, { content: text }]
      return next
    })
    scrollChapterListToBottom()
  }

  const processWordFile = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer()
    let text = ''
    try {
      const result = await mammoth.extractRawText({ arrayBuffer })
      text = result.value || ''
    } catch (e) {
      console.error('读取 Word 文件失败', e)
      text = ''
    }
    setArticleContent(text)
    if (!articleTitle) {
      setArticleTitle(file.name.replace(/\.(doc|docx)$/i, ''))
    }
    // 一个文件对应一个章节
    setChapters((prev) => {
      const next = [...prev, { content: text }]
      return next
    })
    scrollChapterListToBottom()
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
    // 一个文件对应一个章节
    setChapters((prev) => {
      const next = [...prev, { content: fullText }]
      return next
    })
    scrollChapterListToBottom()
  }

  const processMarkdownFile = async (file: File) => {
    const text = await file.text()
    const html = marked(text)
    // 将HTML转换为纯文本
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html as string
    const plainText = (tempDiv.textContent || tempDiv.innerText || '') as string
    setArticleContent(plainText)
    if (!articleTitle) {
      setArticleTitle(file.name.replace(/\.(md|markdown)$/i, ''))
    }
    // 一个文件对应一个章节
    setChapters((prev) => {
      const next = [...prev, { content: plainText }]
      return next
    })
    scrollChapterListToBottom()
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
      // 重置 input 值，避免选择相同文件时不触发 onChange
      event.target.value = ''
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

  // 取消自动分节：一个文件仅对应一个章节

  const handleAddChapter = () => {
    // 点击“添加章节”新增一个空白文本章节
    setChapters((prev) => [...prev, { content: '' }])
    scrollChapterListToBottom()
  }

  const handleRemoveChapter = (index: number) => {
    setChapters(chapters.filter((_, i) => i !== index))
  }

  const handleChapterChange = (index: number, value: string) => {
    const newChapters = [...chapters]
    newChapters[index].content = value
    setChapters(newChapters)
  }

  const handleSave = () => {
    // 过滤掉空内容的章节
    const validChapters = chapters.filter((chapter) => chapter.content && chapter.content.trim())

    // 使用有效章节数量和内容
    const chapterCount = validChapters.length
    // 将章节合并为完整内容，不添加额外标题
    const finalContent = validChapters.map((chapter) => chapter.content).join('\n\n---\n\n')

    // 转换章节格式为正确的JSON结构，每个章节的name字段直接包含内容
    const formattedChapters = validChapters.map((chapter) => ({
      name: chapter.content,
    }))

    const newArticle = {
      id: `custom-article-${Date.now()}`,
      name: articleTitle || `自定义文章 - ${Date.now()}`,
      title: articleTitle || `自定义文章 - ${Date.now()}`,
      description: articleDescription || '用户自定义文章',
      content: finalContent,
      chapters: formattedChapters,
      category: '文章练习',
      tags: ['自定义'],
      language: 'en' as const,
      languageCategory: 'ar' as const,
      length: chapterCount,
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

      {chapters.length === 0 && (
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
        </div>
      )}

      {/* 文章预览（章节列表） */}
      {chapters.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">文章预览</label>
          </div>
          <div className="chapter-list-container rounded-md p-2 dark:bg-gray-700 scrollbar-hide" style={{ height: '12rem', overflowY: 'auto' }}>
            <div className="space-y-4">
              {chapters.map((chapter, index) => (
                <div
                  key={index}
                  className="relative rounded-md border border-gray-200 bg-white/80 p-3 transition-colors hover:border-indigo-300 focus-within:border-indigo-500 dark:border-gray-600 dark:bg-gray-800/60"
                >
                  <div className="mb-2 flex items-center justify-between pr-7">
                    <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700 dark:bg-gray-700 dark:text-gray-200">
                      第 {index + 1} 章
                    </span>
                    <button
                      onClick={() => handleRemoveChapter(index)}
                      className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                      title="删除该章节"
                    >
                      <IconMinusCircle className="h-5 w-5" />
                    </button>
                  </div>
                  <textarea
                    placeholder="请输入章节内容"
                    value={chapter.content}
                    onChange={(e) => handleChapterChange(index, e.target.value)}
                    rows={Math.max(4, Math.ceil((chapter.content || '').length / 60))}
                    className="scrollbar-hide w-full resize-y rounded-md border-none bg-transparent pr-2 text-sm focus:outline-none focus:ring-0 dark:bg-transparent dark:text-white dark:placeholder-gray-400"
                    style={{ minHeight: '6rem' }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-2 flex items-center gap-4">
        <button
          onClick={handleAddChapter}
          className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-200"
        >
          + 添加章节
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-200"
        >
          + 添加文件
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".txt,.doc,.docx,.pdf,.md,.markdown"
        className="hidden"
      />

      <div className="flex justify-end space-x-3">
        <button
          onClick={onCancel}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          取消
        </button>
        <button
          onClick={handleSave}
          disabled={chapters.filter((chapter) => chapter.content && chapter.content.trim()).length === 0}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          保存
        </button>
      </div>
    </div>
  )
}
