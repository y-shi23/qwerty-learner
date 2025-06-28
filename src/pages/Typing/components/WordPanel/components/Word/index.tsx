import type { WordUpdateAction } from '../InputHandler'
import InputHandler from '../InputHandler'
import Letter from './Letter'
import Notation from './Notation'
import { TipAlert } from './TipAlert'
import style from './index.module.css'
import { initialWordState } from './type'
import type { WordState } from './type'
import Tooltip from '@/components/Tooltip'
import type { WordPronunciationIconRef } from '@/components/WordPronunciationIcon'
import { WordPronunciationIcon } from '@/components/WordPronunciationIcon'
import { EXPLICIT_SPACE } from '@/constants'
import useKeySounds from '@/hooks/useKeySounds'
import { TypingContext, TypingStateActionType } from '@/pages/Typing/store'
import {
  currentChapterAtom,
  currentDictInfoAtom,
  fontSizeConfigAtom,
  isIgnoreCaseAtom,
  isShowAnswerOnHoverAtom,
  isTextSelectableAtom,
  pronunciationIsOpenAtom,
  punctuationConfigAtom,
  wordDictationConfigAtom,
} from '@/store'
import type { Word } from '@/typings'
import { CTRL, getUtcStringForMixpanel } from '@/utils'
import { useSaveWordRecord } from '@/utils/db'
import { useAtomValue } from 'jotai'
import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { useImmer } from 'use-immer'

const vowelLetters = ['A', 'E', 'I', 'O', 'U']

export default function WordComponent({ word, onFinish }: { word: Word; onFinish: () => void }) {
  // eslint-disable-next-line  @typescript-eslint/no-non-null-assertion
  const { state, dispatch } = useContext(TypingContext)!
  const [wordState, setWordState] = useImmer<WordState>(structuredClone(initialWordState))

  const wordDictationConfig = useAtomValue(wordDictationConfigAtom)
  const isTextSelectable = useAtomValue(isTextSelectableAtom)
  const isIgnoreCase = useAtomValue(isIgnoreCaseAtom)
  const isShowAnswerOnHover = useAtomValue(isShowAnswerOnHoverAtom)
  const fontSizeConfig = useAtomValue(fontSizeConfigAtom)
  const punctuationConfig = useAtomValue(punctuationConfigAtom)
  const saveWordRecord = useSaveWordRecord()
  // const wordLogUploader = useMixPanelWordLogUploader(state)
  const [playKeySound, playBeepSound, playHintSound] = useKeySounds()
  const pronunciationIsOpen = useAtomValue(pronunciationIsOpenAtom)
  const [isHoveringWord, setIsHoveringWord] = useState(false)
  const currentLanguage = useAtomValue(currentDictInfoAtom).language
  const currentLanguageCategory = useAtomValue(currentDictInfoAtom).languageCategory
  const currentChapter = useAtomValue(currentChapterAtom)
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const [visibleLineCount, setVisibleLineCount] = useState(4) // 默认显示5行，避免遮挡底部统计信息

  const [showTipAlert, setShowTipAlert] = useState(false)
  const wordPronunciationIconRef = useRef<WordPronunciationIconRef>(null)

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    // run only when word changes
    let headword = ''
    try {
      headword = word.name.replace(new RegExp(' ', 'g'), EXPLICIT_SPACE)
      headword = headword.replace(new RegExp('…', 'g'), '..')

      // 在文章练习模式下，如果启用了隐藏标点符号，则过滤掉标点符号
      if (currentLanguageCategory === 'ar' && punctuationConfig.isHidePunctuation) {
        headword = headword.replace(/[.,:;!?"'()\[\]{}\-—]/g, '')
      }
    } catch (e) {
      console.error('word.name is not a string', word)
      headword = ''
    }

    const newWordState = structuredClone(initialWordState)
    newWordState.displayWord = headword
    newWordState.letterStates = new Array(headword.length).fill('normal')
    newWordState.startTime = getUtcStringForMixpanel()
    newWordState.randomLetterVisible = headword.split('').map(() => Math.random() > 0.4)
    setWordState(newWordState)
    setCurrentLineIndex(0) // 重置当前行索引
  }, [word, setWordState, currentLanguageCategory, punctuationConfig.isHidePunctuation])

  const updateInput = useCallback(
    (updateAction: WordUpdateAction) => {
      switch (updateAction.type) {
        case 'add':
          // 检查是否存在错误且试图跨越单词边界
          if (wordState.hasWrong) {
            if (currentLanguageCategory === 'ar') {
              // 文章练习：如果存在错误且试图输入空格（跨越到下一个单词），阻止输入
              const hasWrongLetters = wordState.letterStates.some((state) => state === 'wrong')
              if (hasWrongLetters && updateAction.value === ' ') {
                return // 阻止跨越到下一个单词，必须先修正错误
              }
            } else {
              // 非文章类型保持原有逻辑
              return
            }
          }

          if (updateAction.value === ' ') {
            updateAction.event.preventDefault()
            setWordState((state) => {
              state.inputWord = state.inputWord + EXPLICIT_SPACE
            })
          } else {
            setWordState((state) => {
              state.inputWord = state.inputWord + updateAction.value
            })
          }
          break

        case 'delete':
          setWordState((state) => {
            if (state.inputWord.length > 0) {
              // 删除最后一个字符
              state.inputWord = state.inputWord.slice(0, -1)

              // 重置错误状态，允许继续输入
              if (state.hasWrong) {
                state.hasWrong = false
              }

              // 更新字母状态
              const newLength = state.inputWord.length
              if (newLength < state.letterStates.length) {
                state.letterStates[newLength] = 'normal'
              }
            }
          })
          break

        default:
          console.warn('unknown update type', updateAction)
      }
    },
    [wordState.hasWrong, setWordState],
  )

  const handleHoverWord = useCallback((checked: boolean) => {
    setIsHoveringWord(checked)
  }, [])

  useHotkeys(
    'tab',
    () => {
      handleHoverWord(true)
    },
    { enableOnFormTags: true, preventDefault: true },
    [],
  )

  useHotkeys(
    'tab',
    () => {
      handleHoverWord(false)
    },
    { enableOnFormTags: true, keyup: true, preventDefault: true },
    [],
  )
  useHotkeys(
    'ctrl+j',
    () => {
      if (state.isTyping) {
        wordPronunciationIconRef.current?.play()
      }
    },
    [state.isTyping],
    { enableOnFormTags: true, preventDefault: true },
  )

  useEffect(() => {
    if (wordState.inputWord.length === 0 && state.isTyping) {
      wordPronunciationIconRef.current?.play && wordPronunciationIconRef.current?.play()
    }
  }, [state.isTyping, wordState.inputWord.length, wordPronunciationIconRef.current?.play])

  const getLetterVisible = useCallback(
    (index: number) => {
      if (wordState.letterStates[index] === 'correct' || (isShowAnswerOnHover && isHoveringWord)) return true

      if (wordDictationConfig.isOpen) {
        if (wordDictationConfig.type === 'hideAll') return false

        const letter = wordState.displayWord[index]
        if (wordDictationConfig.type === 'hideVowel') {
          return vowelLetters.includes(letter.toUpperCase()) ? false : true
        }
        if (wordDictationConfig.type === 'hideConsonant') {
          return vowelLetters.includes(letter.toUpperCase()) ? true : false
        }
        if (wordDictationConfig.type === 'randomHide') {
          return wordState.randomLetterVisible[index]
        }
      }
      return true
    },
    [
      isHoveringWord,
      isShowAnswerOnHover,
      wordDictationConfig.isOpen,
      wordDictationConfig.type,
      wordState.displayWord,
      wordState.letterStates,
      wordState.randomLetterVisible,
    ],
  )

  useEffect(() => {
    const inputLength = wordState.inputWord.length
    /**
     * TODO: 当用户输入错误时，会报错
     * Cannot update a component (`App`) while rendering a different component (`WordComponent`). To locate the bad setState() call inside `WordComponent`, follow the stack trace as described in https://reactjs.org/link/setstate-in-render
     * 目前不影响生产环境，猜测是因为开发环境下 react 会两次调用 useEffect 从而展示了这个 warning
     * 但这终究是一个 bug，需要修复
     */
    if (wordState.hasWrong || inputLength === 0 || wordState.displayWord.length === 0) {
      return
    }

    const inputChar = wordState.inputWord[inputLength - 1]
    const correctChar = wordState.displayWord[inputLength - 1]
    let isEqual = false
    if (inputChar != undefined && correctChar != undefined) {
      isEqual = isIgnoreCase ? inputChar.toLowerCase() === correctChar.toLowerCase() : inputChar === correctChar
    }

    if (isEqual) {
      // 输入正确时
      setWordState((state) => {
        state.letterTimeArray.push(Date.now())
        state.correctCount += 1
      })

      if (inputLength >= wordState.displayWord.length) {
        // 完成输入时
        setWordState((state) => {
          state.letterStates[inputLength - 1] = 'correct'
          state.isFinished = true
          state.endTime = getUtcStringForMixpanel()
        })
        playHintSound()
      } else {
        setWordState((state) => {
          state.letterStates[inputLength - 1] = 'correct'
        })
        playKeySound()
      }

      dispatch({ type: TypingStateActionType.REPORT_CORRECT_WORD })
    } else {
      // 出错时
      playBeepSound()
      setWordState((state) => {
        state.letterStates[inputLength - 1] = 'wrong'
        state.hasMadeInputWrong = true
        state.wrongCount += 1

        // 文章类型：改进错误处理逻辑
        if (currentLanguageCategory === 'ar') {
          // 检查是否到达单词边界（空格或标点符号）
          const nextChar = state.displayWord[inputLength]
          const isWordBoundary =
            !nextChar ||
            nextChar === ' ' ||
            nextChar === '.' ||
            nextChar === ',' ||
            nextChar === ';' ||
            nextChar === ':' ||
            nextChar === '!' ||
            nextChar === '?'

          // 如果到达单词边界或者下一个字符是空格，必须修正错误
          if (isWordBoundary || nextChar === ' ') {
            state.hasWrong = true
          }
        } else {
          // 非文章类型：保持原有逻辑，立即设置hasWrong
          state.hasWrong = true
          state.letterTimeArray = []
        }

        if (state.letterMistake[inputLength - 1]) {
          state.letterMistake[inputLength - 1].push(inputChar)
        } else {
          state.letterMistake[inputLength - 1] = [inputChar]
        }

        const currentState = JSON.parse(JSON.stringify(state))
        dispatch({ type: TypingStateActionType.REPORT_WRONG_WORD, payload: { letterMistake: currentState.letterMistake } })
      })

      if (currentChapter === 0 && state.chapterData.index === 0 && wordState.wrongCount >= 3) {
        setShowTipAlert(true)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordState.inputWord])

  useEffect(() => {
    if (wordState.hasWrong) {
      const timer = setTimeout(() => {
        setWordState((state) => {
          if (currentLanguageCategory === 'ar') {
            // 文章类型：重置到当前单词的开始位置
            const currentInput = state.inputWord
            const displayWord = state.displayWord

            // 找到当前单词的开始位置
            let wordStartIndex = 0
            for (let i = currentInput.length - 1; i >= 0; i--) {
              if (displayWord[i] === ' ') {
                wordStartIndex = i + 1
                break
              }
            }

            // 重置到单词开始位置
            state.inputWord = displayWord.slice(0, wordStartIndex)
            state.letterStates = state.letterStates.map((_, index) => {
              if (index < wordStartIndex) {
                return 'correct' // 保持之前正确的字母状态
              } else {
                return 'normal' // 重置当前单词的字母状态
              }
            })
          } else {
            // 非文章类型：完全重置
            state.inputWord = ''
            state.letterStates = new Array(state.letterStates.length).fill('normal')
          }
          state.hasWrong = false
        })
      }, 300)

      return () => {
        clearTimeout(timer)
      }
    }
  }, [wordState.hasWrong, setWordState, currentLanguageCategory])

  useEffect(() => {
    if (wordState.isFinished) {
      dispatch({ type: TypingStateActionType.SET_IS_SAVING_RECORD, payload: true })

      // wordLogUploader({
      //   headword: word.name,
      //   timeStart: wordState.startTime,
      //   timeEnd: wordState.endTime,
      //   countInput: wordState.correctCount + wordState.wrongCount,
      //   countCorrect: wordState.correctCount,
      //   countTypo: wordState.wrongCount,
      // })
      saveWordRecord({
        word: word.name,
        wrongCount: wordState.wrongCount,
        letterTimeArray: wordState.letterTimeArray,
        letterMistake: wordState.letterMistake,
      })

      onFinish()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordState.isFinished])

  useEffect(() => {
    if (wordState.wrongCount >= 4) {
      dispatch({ type: TypingStateActionType.SET_IS_SKIP, payload: true })
    }
  }, [wordState.wrongCount, dispatch])

  // 计算文本换行的函数
  const getWrappedLines = useCallback(() => {
    if (currentLanguageCategory !== 'ar') {
      return [{ text: wordState.displayWord, startIndex: 0 }]
    }

    // 基于Header容器宽度计算每行最大字符数，确保不超过顶部工具栏宽度
    const fontSize = fontSizeConfig.foreignFont
    const charWidth = fontSize * 0.6 // 等宽字体的字符宽度约为字体大小的0.6倍

    const containerMaxWidth = Math.min(windowWidth * 0.6, 1000) // 60vw，最大1000px
    const availableWidth = containerMaxWidth * 0.95 // 使用95%的容器宽度
    const maxCharsPerLine = Math.floor(availableWidth / charWidth)

    const text = wordState.displayWord
    const lines: { text: string; startIndex: number }[] = []
    let currentIndex = 0

    while (currentIndex < text.length) {
      let endIndex = Math.min(currentIndex + maxCharsPerLine, text.length)

      // 如果不是最后一行，优化分词逻辑，平衡空间利用率和单词完整性
      if (endIndex < text.length) {
        const charAtEnd = text[endIndex]

        // 如果当前字符不是空格或标点，说明可能在单词中间
        if (charAtEnd && charAtEnd !== ' ' && !/[.,:;!?]/.test(charAtEnd)) {
          // 策略1：向前查找最近的断点
          let bestBreakIndex = -1
          for (let i = endIndex - 1; i > currentIndex; i--) {
            const char = text[i]
            if (char === ' ' || /[.,:;!?]/.test(char)) {
              bestBreakIndex = i + 1
              break
            }
          }

          if (bestBreakIndex > currentIndex) {
            const lineUtilization = (bestBreakIndex - currentIndex) / maxCharsPerLine

            // 如果行利用率大于50%，直接使用这个断点
            if (lineUtilization >= 0.5) {
              endIndex = bestBreakIndex
            }
            // 如果行利用率较低，尝试向后查找更好的断点
            else {
              let forwardBreakIndex = -1
              const searchLimit = Math.min(endIndex + maxCharsPerLine * 0.3, text.length)

              for (let i = endIndex; i < searchLimit; i++) {
                const char = text[i]
                if (char === ' ' || /[.,:;!?]/.test(char)) {
                  forwardBreakIndex = i + 1
                  break
                }
              }

              // 如果向后找到断点且不会超出合理范围，使用向后的断点
              if (forwardBreakIndex > 0 && forwardBreakIndex - currentIndex <= maxCharsPerLine * 1.2) {
                endIndex = forwardBreakIndex
              } else {
                // 否则使用向前找到的断点
                endIndex = bestBreakIndex
              }
            }
          }
          // 如果没找到任何断点，检查是否为超长单词
          else {
            // 检查从当前位置开始是否都是一个长单词
            let wordEndIndex = endIndex
            for (let i = currentIndex; i < text.length; i++) {
              if (text[i] === ' ' || /[.,:;!?]/.test(text[i])) {
                wordEndIndex = i + 1
                break
              }
            }

            // 如果单词长度超过1.5倍行长度，强制断行
            if (wordEndIndex - currentIndex > maxCharsPerLine * 1.5) {
              endIndex = Math.min(currentIndex + maxCharsPerLine, text.length)
            } else {
              // 否则包含整个单词
              endIndex = Math.min(wordEndIndex, text.length)
            }
          }
        }
      }

      const lineText = text.slice(currentIndex, endIndex)
      lines.push({ text: lineText, startIndex: currentIndex })
      currentIndex = endIndex
    }

    return lines
  }, [wordState.displayWord, currentLanguageCategory, fontSizeConfig.foreignFont, windowWidth])

  const wrappedLines = getWrappedLines()

  // 计算当前输入位置对应的行索引
  const getCurrentLineIndex = useCallback(
    (inputLength: number) => {
      const currentIndex = 0
      for (let i = 0; i < wrappedLines.length; i++) {
        const lineEndIndex = wrappedLines[i].startIndex + wrappedLines[i].text.length
        if (inputLength <= lineEndIndex) {
          return i
        }
      }
      return wrappedLines.length - 1
    },
    [wrappedLines],
  )

  // 计算可见行的范围（打字机模式）
  const getVisibleLines = useCallback(() => {
    if (currentLanguageCategory !== 'ar') {
      return { startIndex: 0, endIndex: 1 }
    }

    const totalLines = wrappedLines.length
    const halfVisible = Math.floor(visibleLineCount / 2)

    let startIndex = Math.max(0, currentLineIndex - halfVisible)
    const endIndex = Math.min(totalLines, startIndex + visibleLineCount)

    // 如果到达末尾，调整开始位置
    if (endIndex === totalLines) {
      startIndex = Math.max(0, endIndex - visibleLineCount)
    }

    return { startIndex, endIndex }
  }, [currentLineIndex, visibleLineCount, wrappedLines.length, currentLanguageCategory])

  // 监听输入变化，更新当前行索引
  useEffect(() => {
    const newLineIndex = getCurrentLineIndex(wordState.inputWord.length)
    if (newLineIndex !== currentLineIndex) {
      setCurrentLineIndex(newLineIndex)
    }
  }, [wordState.inputWord.length, getCurrentLineIndex, currentLineIndex])

  // 计算可见行范围
  const visibleLines = getVisibleLines()

  return (
    <>
      <InputHandler updateInput={updateInput} />
      <div
        lang={currentLanguageCategory !== 'code' ? currentLanguageCategory : 'en'}
        className="flex flex-col items-center justify-center pb-1 pt-4"
      >
        {['romaji'].includes(currentLanguage) && word.notation && <Notation notation={word.notation} />}
        <div
          className={`tooltip-info relative w-fit bg-transparent p-0 leading-normal shadow-none dark:bg-transparent ${
            wordDictationConfig.isOpen ? 'tooltip' : ''
          }`}
          data-tip="按 Tab 快捷键显示完整单词"
        >
          {currentLanguageCategory === 'ar' ? (
            // 文章类型：多行显示（打字机模式）
            <div className={`flex flex-col items-center justify-center ${style['article-container']}`}>
              {wrappedLines.slice(visibleLines.startIndex, visibleLines.endIndex).map((line, displayIndex) => {
                const lineIndex = visibleLines.startIndex + displayIndex
                const isCurrentLine = lineIndex === currentLineIndex
                const lineOpacity = isCurrentLine ? 'opacity-100' : 'opacity-40'

                return (
                  <div
                    key={lineIndex}
                    onMouseEnter={() => handleHoverWord(true)}
                    onMouseLeave={() => handleHoverWord(false)}
                    className={`flex items-center ${isTextSelectable && 'select-all'} justify-center ${
                      wordState.hasWrong ? style.wrong : ''
                    } ${style['article-line']} transition-opacity duration-300 ${lineOpacity}`}
                  >
                    {line.text.split('').map((t, charIndex) => {
                      const globalIndex = line.startIndex + charIndex
                      return (
                        <Letter
                          key={`${globalIndex}-${t}`}
                          letter={t}
                          visible={getLetterVisible(globalIndex)}
                          state={wordState.letterStates[globalIndex]}
                        />
                      )
                    })}
                  </div>
                )
              })}
            </div>
          ) : (
            // 非文章类型：单行显示
            <div
              onMouseEnter={() => handleHoverWord(true)}
              onMouseLeave={() => handleHoverWord(false)}
              className={`flex items-center ${isTextSelectable && 'select-all'} justify-center ${wordState.hasWrong ? style.wrong : ''}`}
            >
              {wrappedLines[0].text.split('').map((t, index) => {
                return <Letter key={`${index}-${t}`} letter={t} visible={getLetterVisible(index)} state={wordState.letterStates[index]} />
              })}
            </div>
          )}
          {pronunciationIsOpen && (
            <div className="absolute -right-12 top-1/2 h-9 w-9 -translate-y-1/2 transform ">
              <Tooltip content={`快捷键${CTRL} + J`}>
                <WordPronunciationIcon word={word} lang={currentLanguage} ref={wordPronunciationIconRef} className="h-full w-full" />
              </Tooltip>
            </div>
          )}
        </div>
      </div>
      <TipAlert className="fixed bottom-10 right-3" show={showTipAlert} setShow={setShowTipAlert} />
    </>
  )
}
