import DictDetail from './DictDetail'
import { useDictStats } from './hooks/useDictStats'
import bookCover from '@/assets/book-cover.png'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import useIntersectionObserver from '@/hooks/useIntersectionObserver'
import { currentDictIdAtom } from '@/store'
import type { Dictionary } from '@/typings'
import { calcChapterCount } from '@/utils'
import * as Progress from '@radix-ui/react-progress'
import { useAtomValue } from 'jotai'
import { useMemo, useRef, useState, useCallback } from 'react'
import IconEdit from '~icons/heroicons/pencil-square'
import DeleteIcon from '~icons/weui/delete-filled'
import { CustomDictionaryEditModal } from './CustomDictionaryEditModal'

interface Props {
  dictionary: Dictionary
}

export default function DictionaryComponent({ dictionary }: Props) {
  const currentDictID = useAtomValue(currentDictIdAtom)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const divRef = useRef<HTMLDivElement>(null)
  const entry = useIntersectionObserver(divRef, {})
  const isVisible = !!entry?.isIntersecting
  const dictStats = useDictStats(dictionary.id, isVisible)
  const chapterCount = useMemo(() => calcChapterCount(dictionary.length), [dictionary.length])
  const isSelected = currentDictID === dictionary.id
  const progress = useMemo(
    () => (dictStats ? Math.ceil((dictStats.exercisedChapterCount / chapterCount) * 100) : 0),
    [dictStats, chapterCount],
  )

  // 检查是否为自定义词典
  const isCustomDict = dictionary.id.startsWith('custom-')

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setShowEditModal(true)
  }, [])

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setShowDeleteConfirm(true)
  }, [])

  const confirmDelete = useCallback(() => {
    const customDicts = JSON.parse(localStorage.getItem('custom-dictionaries') || '[]')
    const updatedDicts = customDicts.filter((dict: any) => dict.id !== dictionary.id)
    localStorage.setItem('custom-dictionaries', JSON.stringify(updatedDicts))
    setShowDeleteConfirm(false)
    // 刷新页面以更新词典列表
    window.location.reload()
  }, [dictionary.id])

  const cancelDelete = useCallback(() => {
    setShowDeleteConfirm(false)
  }, [])

  return (
    <>
    <Dialog>
      <DialogTrigger asChild>
        <div
          ref={divRef}
          className={`group flex  h-36 w-80 cursor-pointer items-center justify-center overflow-hidden rounded-lg p-4 text-left shadow-lg focus:outline-none ${
            isSelected ? 'bg-indigo-400' : 'bg-zinc-50 hover:bg-white dark:bg-gray-800 dark:hover:bg-gray-700'
          }`}
          role="button"
          // onClick={onClick}
        >
          <div className="relative ml-1 mt-2 flex h-full w-full flex-col items-start justify-start">
            {/* 自定义词典的编辑和删除按钮 - 移到右下角 */}
            {isCustomDict && (
              <div className="absolute bottom-0 right-0 flex space-x-1">
                <button
                  onClick={handleEdit}
                  className={`rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-600 ${
                    isSelected ? 'text-white hover:bg-white/20' : 'text-gray-500'
                  }`}
                  title="编辑词典"
                >
                  <IconEdit className="h-4 w-4" />
                </button>
                <button
                  onClick={handleDelete}
                  className={`rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-600 ${
                    isSelected ? 'text-white hover:bg-white/20' : 'text-gray-500'
                  }`}
                  title="删除词典"
                >
                  <DeleteIcon className="h-4 w-4" />
                </button>
              </div>
            )}
            <h1
              className={`mb-1.5 text-xl font-normal  ${
                isSelected ? 'text-white' : 'text-gray-800 group-hover:text-indigo-400 dark:text-gray-200'
              }`}
            >
              {dictionary.name}
            </h1>
            <TooltipProvider>
              <Tooltip delayDuration={400}>
                <TooltipTrigger asChild>
                  <p
                    className={`mb-1 max-w-full truncate ${
                      isSelected ? 'text-white' : 'textdelayDuration-gray-600 dark:text-gray-200'
                    } whitespace-nowrap`}
                  >
                    {dictionary.description}
                  </p>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{`${dictionary.description}`}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <p className={`mb-0.5 font-bold  ${isSelected ? 'text-white' : 'text-gray-600 dark:text-gray-200'}`}>{dictionary.length} 词</p>
            <div className=" flex w-full items-center pt-2">
              {progress > 0 && (
                <Progress.Root
                  value={progress}
                  max={100}
                  className={`mr-4 h-2 w-full rounded-full border  bg-white ${isSelected ? 'border-indigo-600' : 'border-indigo-400'}`}
                >
                  <Progress.Indicator
                    className={`h-full rounded-full pl-0 ${isSelected ? 'bg-indigo-600' : 'bg-indigo-400'}`}
                    style={{ width: `calc(${progress}% )` }}
                  />
                </Progress.Root>
              )}
              <img src={bookCover} className={`absolute right-3 top-3 w-16 ${isSelected ? 'opacity-50' : 'opacity-20'}`} />
            </div>
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="w-[60rem] max-w-none !rounded-[20px]">
        <DictDetail dictionary={dictionary} />
      </DialogContent>
    </Dialog>
    
    {/* 编辑模态框 */}
    {showEditModal && (
      <CustomDictionaryEditModal
        dictionary={dictionary}
        onClose={() => setShowEditModal(false)}
      />
    )}
    
    {/* 删除确认对话框 */}
    {showDeleteConfirm && (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={cancelDelete}></div>
        <div className="relative w-full max-w-md transform rounded-lg bg-white p-6 shadow-xl transition-all">
          <h3 className="text-lg font-medium text-gray-900">确认删除</h3>
          <p className="mt-2 text-sm text-gray-500">
            确定要删除词典 "{dictionary.name}" 吗？此操作无法撤销。
          </p>
          <div className="mt-4 flex justify-end space-x-3">
            <button
              onClick={cancelDelete}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={confirmDelete}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              删除
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  )
}
