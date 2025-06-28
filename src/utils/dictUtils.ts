import { idDictionaryMap } from '@/resources/dictionary'
import type { Dictionary } from '@/typings'

// 获取词典信息，包括自定义词典
export function getDictInfo(dictId: string): Dictionary | undefined {
  // 首先检查是否是内置词典
  if (idDictionaryMap[dictId]) {
    return idDictionaryMap[dictId]
  }

  // 检查是否是自定义词典
  if (dictId.startsWith('custom-')) {
    const customDicts = JSON.parse(localStorage.getItem('custom-dictionaries') || '[]')
    const customDict = customDicts.find((dict: any) => dict.id === dictId)
    if (customDict) {
      return {
        id: customDict.id,
        name: customDict.name,
        description: customDict.description,
        category: customDict.category || '自定义',
        tags: customDict.tags || ['自定义'],
        language: customDict.language,
        languageCategory: customDict.languageCategory,
        length: customDict.length,
        url: '', // 自定义词典不使用URL
        chapterCount: 1,
        defaultPronIndex: undefined,
      } as Dictionary
    }
  }

  return undefined
}
