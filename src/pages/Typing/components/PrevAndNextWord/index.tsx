import { TypingContext, TypingStateActionType } from '../../store'
import Tooltip from '@/components/Tooltip'
import { currentChapterAtom, currentDictInfoAtom, wordDictationConfigAtom } from '@/store'
import { CTRL } from '@/utils'
import { useAtomValue } from 'jotai'
import { useCallback, useContext, useMemo } from 'react'
import IconPrev from '~icons/tabler/arrow-narrow-left'
import IconNext from '~icons/tabler/arrow-narrow-right'

export default function PrevAndNextWord({ type }: LastAndNextWordProps) {
  // eslint-disable-next-line  @typescript-eslint/no-non-null-assertion
  const { state, dispatch } = useContext(TypingContext)!

  const wordDictationConfig = useAtomValue(wordDictationConfigAtom)
  const currentDictInfo = useAtomValue(currentDictInfoAtom)
  const currentChapter = useAtomValue(currentChapterAtom)
  const newIndex = useMemo(() => state.chapterData.index + (type === 'prev' ? -1 : 1), [state.chapterData.index, type])
  const word = state.chapterData.words[newIndex]
  const shortCutKey = useMemo(() => (type === 'prev' ? `${CTRL} + Shift + ArrowLeft` : `${CTRL} + Shift + ArrowRight`), [type])
  const currentLanguage = currentDictInfo.language

  // 检查是否为文章模式
  const isArticleMode = currentDictInfo.category === '文章练习' || currentDictInfo.id.startsWith('custom-article-')

  // 在文章模式下，计算章节信息
  const chapterInfo = useMemo(() => {
    if (!isArticleMode) return null

    const targetChapter = type === 'prev' ? currentChapter - 1 : currentChapter + 1
    const isValidChapter = targetChapter >= 0 && targetChapter < currentDictInfo.chapterCount

    return {
      chapterNumber: targetChapter + 1,
      isValid: isValidChapter,
    }
  }, [isArticleMode, type, currentChapter, currentDictInfo.chapterCount])

  const onClickWord = useCallback(() => {
    if (isArticleMode) {
      // 文章模式：章节切换由父组件的快捷键处理，这里不做处理
      return
    }

    if (!word) return

    if (type === 'prev') dispatch({ type: TypingStateActionType.SKIP_2_WORD_INDEX, newIndex })
    if (type === 'next') dispatch({ type: TypingStateActionType.SKIP_2_WORD_INDEX, newIndex })
  }, [type, dispatch, newIndex, word, isArticleMode])

  const headWord = useMemo(() => {
    if (isArticleMode) {
      // 文章模式：显示章节信息
      if (!chapterInfo?.isValid) return ''
      return `第 ${chapterInfo.chapterNumber} 章`
    }

    if (!word) return ''

    const showWord = ['romaji'].includes(currentLanguage) ? word.notation : word.name

    if (type === 'prev') return showWord

    if (type === 'next') {
      return !wordDictationConfig.isOpen ? showWord : (showWord || '').replace(/./g, '_')
    }
  }, [word, currentLanguage, type, wordDictationConfig.isOpen, isArticleMode, chapterInfo])

  return (
    <>
      {word || (isArticleMode && chapterInfo?.isValid) ? (
        <Tooltip content={`快捷键: ${shortCutKey}`}>
          <div
            onClick={onClickWord}
            className="flex max-w-xs cursor-pointer select-none items-center text-gray-700 opacity-60 duration-200 ease-in-out hover:opacity-100 dark:text-gray-400"
          >
            {type === 'prev' && <IconPrev className="mr-4 shrink-0 grow-0 text-2xl" />}

            <div className={`grow-1 flex w-full flex-col ${type === 'next' ? 'items-end text-right' : ''}`}>
              <p
                className={`font-mono text-2xl font-normal text-gray-700 dark:text-gray-400 ${
                  !wordDictationConfig.isOpen ? 'tracking-normal' : 'tracking-wider'
                }`}
              >
                {headWord}
              </p>
              {state.isTransVisible && !isArticleMode && word && (
                <p className="line-clamp-1 max-w-full text-sm font-normal text-gray-600 dark:text-gray-500">{word.trans.join('；')}</p>
              )}
            </div>
            {type === 'next' && <IconNext className="ml-4 shrink-0 grow-0 text-2xl" />}
          </div>
        </Tooltip>
      ) : (
        <div />
      )}
    </>
  )
}

export type LastAndNextWordProps = {
  /** 上一个单词还是下一个单词 */
  type: 'prev' | 'next'
}
