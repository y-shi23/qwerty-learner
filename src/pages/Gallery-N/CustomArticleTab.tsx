import { ScrollArea } from '@/components/ui/scroll-area'
import { read as readDocx } from 'mammoth'
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

  const processTextFile = async (file: File) => {
    const text = await file.text()
    setArticleContent(text)
    if (!articleTitle) {
      setArticleTitle(file.name.replace(/\.(txt|md|markdown)$/i, ''))
    }
    // 自动按换行和空行分节符划分章节
    autoSplitChapters(text)
  }

  const processWordFile = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer()
    const result = await readDocx({ arrayBuffer })
    setArticleContent(result.value)
    if (!articleTitle) {
      setArticleTitle(file.name.replace(/\.(doc|docx)$/i, ''))
    }
    // 自动按换行和空行分节符划分章节
    autoSplitChapters(result.value)
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
    // 自动按换行和空行分节符划分章节
    autoSplitChapters(fullText)
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
    // 自动按换行和空行分节符划分章节
    autoSplitChapters(plainText)
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

  // 自动按换行和空行分节符划分章节
  const autoSplitChapters = (text: string) => {
    // 优先按双换行符（空行）分割文本
    const sectionsByEmptyLine = text.split(/\n\s*\n/).filter((section) => section.trim())

    if (sectionsByEmptyLine.length > 1) {
      // 按空行分割的章节，确保过滤掉空内容
      const newChapters: Chapter[] = sectionsByEmptyLine
        .map((section) => section.trim())
        .filter((content) => content.length > 0)
        .map((content) => ({ content }))

      setChapters(newChapters)
    } else {
      // 如果没有空行，则按单换行符分割，每行作为一个章节
      const lines = text.split('\n').filter((line) => line.trim())
      const newChapters: Chapter[] = lines.map((line) => ({
        content: line.trim(),
      }))

      setChapters(newChapters)
    }
  }

  const handleAddChapter = () => {
    setChapters([...chapters, { content: '' }])
    // 延迟滚动到最后一个章节，确保DOM已更新
    setTimeout(() => {
      const chapterListContainer = document.querySelector('.chapter-list-container')
      if (chapterListContainer) {
        chapterListContainer.scrollTop = chapterListContainer.scrollHeight
      }
    }, 100)
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
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".txt,.doc,.docx,.pdf,.md,.markdown"
            className="hidden"
          />
        </div>
      )}

      {/* 文章预览（章节列表） */}
      {chapters.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">文章预览</label>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setChapters([])
                  setArticleContent('')
                  setArticleTitle('')
                  setArticleDescription('')
                }}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                重新上传
              </button>
            </div>
          </div>
          <ScrollArea
            className="chapter-list-container rounded-md border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700"
            style={{
              maxHeight: '12rem',
              height: chapters.length > 2 ? '12rem' : 'auto',
            }}
          >
              <div className="space-y-4">
                {chapters.map((chapter, index) => (
                  <div key={index} className="relative">
                    <div className="mb-2 flex items-center justify-end">
                      <button
                        onClick={() => handleRemoveChapter(index)}
                        className="flex-shrink-0 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                      >
                        <IconMinusCircle className="h-5 w-5" />
                      </button>
                    </div>
                    <textarea
                      placeholder="请输入章节内容"
                      value={chapter.content}
                      onChange={(e) => handleChapterChange(index, e.target.value)}
                      rows={chapter.content ? Math.max(2, Math.ceil(chapter.content.length / 50)) : 2}
                      className="w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                      style={{ minHeight: chapter.content ? '4rem' : '2.5rem' }}
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>
        </div>
      )}

      <div>
        <button
          onClick={handleAddChapter}
          className="text-sm text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          + 添加章节
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
          disabled={chapters.filter((chapter) => chapter.content && chapter.content.trim()).length === 0}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          保存
        </button>
      </div>
    </div>
  )
}
