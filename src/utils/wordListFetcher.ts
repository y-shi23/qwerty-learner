import type { Word } from '@/typings/index'

export async function wordListFetcher(url: string): Promise<Word[]> {
  // Handle custom dictionaries with empty URL
  if (!url || url === '') {
    // For custom dictionaries, we need to find the dictionary by checking localStorage
    // This is a fallback that shouldn't normally be reached if the hook is properly designed
    throw new Error('Custom dictionary content should be handled differently')
  }

  const URL_PREFIX: string = REACT_APP_DEPLOY_ENV === 'pages' ? '/qwerty-learner' : ''

  const response = await fetch(URL_PREFIX + url)
  const words: Word[] = await response.json()
  return words
}
