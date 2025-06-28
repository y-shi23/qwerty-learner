import type { Dictionary, Word } from '@/typings'
import { wordListFetcher } from '@/utils/wordListFetcher'
import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'

export default function useGetWord(name: string, dict: Dictionary) {
  const [hasError, setHasError] = useState(false)
  
  // 检查是否是自定义词典
  const isCustomDict = dict?.id?.startsWith('custom-')
  
  // 对于自定义词典，从localStorage获取数据
  const customWordList = useMemo(() => {
    if (isCustomDict) {
      const customDicts = JSON.parse(localStorage.getItem('custom-dictionaries') || '[]')
      const customDict = customDicts.find((d: any) => d.id === dict.id)
      return customDict?.content || []
    }
    return null
  }, [isCustomDict, dict?.id])
  
  // 对于内置词典，使用SWR获取数据
  const { data: fetchedWordList, error, isLoading } = useSWR(
    isCustomDict ? null : dict?.url, 
    wordListFetcher
  )
  
  // 选择使用哪个单词列表
  const wordList = isCustomDict ? customWordList : fetchedWordList

  const word: Word | undefined = useMemo(() => {
    if (!wordList) return undefined

    const word = wordList.find((word) => word.name === name)
    if (word) {
      return word
    } else {
      setHasError(true)
      return undefined
    }
  }, [wordList, name])

  useEffect(() => {
    if (error) setHasError(true)
  }, [error])

  return { word, isLoading: isCustomDict ? false : isLoading, hasError }
}
