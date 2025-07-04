import { CHAPTER_LENGTH } from '@/constants'
import { currentChapterAtom, currentDictInfoAtom, reviewModeInfoAtom } from '@/store'
import type { Word, WordWithIndex } from '@/typings/index'
import { wordListFetcher } from '@/utils/wordListFetcher'
import { useAtom, useAtomValue } from 'jotai'
import { useMemo } from 'react'
import useSWR from 'swr'

export type UseWordListResult = {
  words: WordWithIndex[]
  isLoading: boolean
  error: Error | undefined
}

/**
 * Use word lists from the current selected dictionary.
 */
export function useWordList(): UseWordListResult {
  const currentDictInfo = useAtomValue(currentDictInfoAtom)
  const [currentChapter, setCurrentChapter] = useAtom(currentChapterAtom)
  const { isReviewMode, reviewRecord } = useAtomValue(reviewModeInfoAtom)

  // Reset current chapter to 0, when currentChapter is greater than chapterCount.
  if (currentChapter >= currentDictInfo.chapterCount) {
    setCurrentChapter(0)
  }

  const isFirstChapter = !isReviewMode && currentDictInfo.id === 'cet4' && currentChapter === 0

  // Check if this is a custom dictionary
  const isCustomDict = currentDictInfo.id.startsWith('custom-')

  // For custom dictionaries and articles, get data from localStorage instead of fetching
  const customWordList = useMemo(() => {
    if (isCustomDict) {
      if (currentDictInfo.id.startsWith('custom-article-')) {
        // Handle custom articles
        const customArticles = JSON.parse(localStorage.getItem('custom-articles') || '[]')
        const customArticle = customArticles.find((article: any) => article.id === currentDictInfo.id)
        if (customArticle?.content) {
          // Convert article content to Word format - each paragraph as a chapter
          // Handle multiple separator formats: \n\n---\n\n (with separator), \n\n (empty line), and \n (single line)
          let paragraphs: string[]
          if (customArticle.content.includes('\n\n---\n\n')) {
            // New format with explicit separators
            paragraphs = customArticle.content.split(/\n\n---\n\n/).filter((p: string) => p.trim())
          } else if (customArticle.content.includes('\n\n')) {
            // Old format with empty lines
            paragraphs = customArticle.content.split(/\n\n/).filter((p: string) => p.trim())
          } else {
            // Single line format - each line is a chapter
            paragraphs = customArticle.content.split(/\n/).filter((p: string) => p.trim())
          }
          return paragraphs.map((paragraph: string) => ({
            name: paragraph.trim(),
            trans: [''],
            usphone: '',
            ukphone: '',
          }))
        }
      } else {
        // Handle custom dictionaries
        const customDicts = JSON.parse(localStorage.getItem('custom-dictionaries') || '[]')
        const customDict = customDicts.find((dict: any) => dict.id === currentDictInfo.id)
        return customDict?.content || []
      }
    }
    return null
  }, [isCustomDict, currentDictInfo.id])

  // Only use SWR for non-custom dictionaries
  const { data: wordList, error, isLoading } = useSWR(isCustomDict ? null : currentDictInfo.url, wordListFetcher)

  const words: WordWithIndex[] = useMemo(() => {
    let newWords: Word[]
    if (isFirstChapter) {
      newWords = firstChapter
    } else if (isReviewMode) {
      newWords = reviewRecord?.words ?? []
    } else if (isCustomDict && customWordList) {
      // For custom articles, each item in customWordList is already a chapter
      if (currentDictInfo.id.startsWith('custom-article-')) {
        newWords = customWordList[currentChapter] ? [customWordList[currentChapter]] : []
      } else {
        // For custom dictionaries, use the content from localStorage
        newWords = customWordList.slice(currentChapter * CHAPTER_LENGTH, (currentChapter + 1) * CHAPTER_LENGTH)
      }
    } else if (wordList) {
      // For built-in articles, each item in wordList is a chapter
      if (currentDictInfo.category === '文章练习') {
        newWords = wordList[currentChapter] ? [wordList[currentChapter]] : []
      } else {
        newWords = wordList.slice(currentChapter * CHAPTER_LENGTH, (currentChapter + 1) * CHAPTER_LENGTH)
      }
    } else {
      newWords = []
    }

    // 记录原始 index, 并对 word.trans 做兜底处理
    return newWords.map((word, index) => {
      let trans: string[]
      if (Array.isArray(word.trans)) {
        trans = word.trans.filter((item) => typeof item === 'string')
      } else if (word.trans === null || word.trans === undefined || typeof word.trans === 'object') {
        trans = []
      } else {
        trans = [String(word.trans)]
      }
      return {
        ...word,
        index,
        trans,
      }
    })
  }, [isFirstChapter, isReviewMode, isCustomDict, customWordList, wordList, reviewRecord?.words, currentChapter])

  return {
    words,
    isLoading: isCustomDict ? false : isLoading,
    error: isCustomDict ? undefined : error,
  }
}

const firstChapter = [
  { name: 'cancel', trans: ['取消， 撤销； 删去'], usphone: "'kænsl", ukphone: "'kænsl" },
  { name: 'explosive', trans: ['爆炸的； 极易引起争论的', '炸药'], usphone: "ɪk'splosɪv; ɪk'splozɪv", ukphone: "ɪk'spləusɪv" },
  { name: 'numerous', trans: ['众多的'], usphone: "'numərəs", ukphone: "'njuːmərəs" },
  { name: 'govern', trans: ['居支配地位， 占优势', '统治，治理，支配'], usphone: "'ɡʌvɚn", ukphone: "'gʌvn" },
  { name: 'analyse', trans: ['分析； 分解； 解析'], usphone: "'æn(ə)laɪz", ukphone: "'ænəlaɪz" },
  { name: 'discourage', trans: ['使泄气， 使灰心； 阻止， 劝阻'], usphone: "dɪs'kɝɪdʒ", ukphone: "dɪs'kʌrɪdʒ" },
  { name: 'resemble', trans: ['像， 类似于'], usphone: "rɪ'zɛmbl", ukphone: "rɪ'zembl" },
  {
    name: 'remote',
    trans: ['遥远的； 偏僻的； 关系疏远的； 脱离的； 微乎其微的； 孤高的， 冷淡的； 遥控的'],
    usphone: "rɪ'mot",
    ukphone: "rɪ'məut",
  },
  { name: 'salary', trans: ['薪金， 薪水'], usphone: "'sæləri", ukphone: "'sæləri" },
  { name: 'pollution', trans: ['污染， 污染物'], usphone: "pə'luʃən", ukphone: "pə'luːʃn" },
  { name: 'pretend', trans: ['装作， 假装'], usphone: "prɪ'tɛnd", ukphone: "prɪ'tend" },
  { name: 'kettle', trans: ['水壶'], usphone: "'kɛtl", ukphone: "'ketl" },
  { name: 'wreck', trans: ['失事；残骸；精神或身体已垮的人', '破坏'], usphone: 'rɛk', ukphone: 'rek' },
  { name: 'drunk', trans: ['醉的； 陶醉的'], usphone: 'drʌŋk', ukphone: 'drʌŋk' },
  { name: 'calculate', trans: ['计算； 估计； 计划'], usphone: "'kælkjulet", ukphone: "'kælkjuleɪt" },
  { name: 'persistent', trans: ['坚持的， 不屈不挠的； 持续不断的； 反复出现的'], usphone: "pə'zɪstənt", ukphone: "pə'sɪstənt" },
  { name: 'sake', trans: ['缘故， 理由'], usphone: 'sek', ukphone: 'seɪk' },
  { name: 'conceal', trans: ['把…隐藏起来， 掩盖， 隐瞒'], usphone: "kən'sil", ukphone: "kən'siːl" },
  { name: 'audience', trans: ['听众， 观众， 读者'], usphone: "'ɔdɪəns", ukphone: "'ɔːdiəns" },
  { name: 'meanwhile', trans: ['与此同时'], usphone: "'minwaɪl", ukphone: "'miːnwaɪl" },
]
