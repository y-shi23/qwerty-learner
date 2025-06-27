import { db } from '.'
import { getCurrentDate, recordDataAction } from '..'

export type ExportProgress = {
  totalRows?: number
  completedRows: number
  done: boolean
}

export type ImportProgress = {
  totalRows?: number
  completedRows: number
  done: boolean
}

export async function exportDatabase(callback: (exportProgress: ExportProgress) => boolean) {
  const [pako, { saveAs }] = await Promise.all([import('pako'), import('file-saver'), import('dexie-export-import')])

  const blob = await db.export({
    progressCallback: ({ totalRows, completedRows, done }) => {
      return callback({ totalRows, completedRows, done })
    },
  })
  const [wordCount, chapterCount] = await Promise.all([db.wordRecords.count(), db.chapterRecords.count()])

  // 获取自定义词典数据和背景配置
  const customDictionaries = JSON.parse(localStorage.getItem('custom-dictionaries') || '[]')
  const backgroundConfig = JSON.parse(localStorage.getItem('backgroundConfig') || '{}')

  // 将数据库数据和自定义数据合并
  const dbJson = await blob.text()
  const dbData = JSON.parse(dbJson)
  const exportData = {
    ...dbData,
    customDictionaries,
    backgroundConfig
  }

  const json = JSON.stringify(exportData)
  const compressed = pako.gzip(json)
  const compressedBlob = new Blob([compressed])
  const currentDate = getCurrentDate()
  saveAs(compressedBlob, `Qwerty-Learner-User-Data-${currentDate}.gz`)
  recordDataAction({ type: 'export', size: compressedBlob.size, wordCount, chapterCount })
}

export async function importDatabase(onStart: () => void, callback: (importProgress: ImportProgress) => boolean) {
  const [pako] = await Promise.all([import('pako'), import('dexie-export-import')])

  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'application/gzip'
  input.addEventListener('change', async () => {
    const file = input.files?.[0]
    if (!file) return

    onStart()

    const compressed = await file.arrayBuffer()
    const json = pako.ungzip(compressed, { to: 'string' })
    const importData = JSON.parse(json)

    // 处理自定义词典数据
    if (importData.customDictionaries) {
      localStorage.setItem('custom-dictionaries', JSON.stringify(importData.customDictionaries))
      // 从导入数据中移除自定义词典，避免影响数据库导入
      delete importData.customDictionaries
    }

    // 处理背景配置数据
    if (importData.backgroundConfig) {
      localStorage.setItem('backgroundConfig', JSON.stringify(importData.backgroundConfig))
      // 从导入数据中移除背景配置，避免影响数据库导入
      delete importData.backgroundConfig
    }

    // 重新构建数据库导入的blob
    const dbJson = JSON.stringify(importData)
    const blob = new Blob([dbJson])

    await db.import(blob, {
      acceptVersionDiff: true,
      acceptMissingTables: true,
      acceptNameDiff: false,
      acceptChangedPrimaryKey: false,
      overwriteValues: true,
      clearTablesBeforeImport: true,
      progressCallback: ({ totalRows, completedRows, done }) => {
        return callback({ totalRows, completedRows, done })
      },
    })

    const [wordCount, chapterCount] = await Promise.all([db.wordRecords.count(), db.chapterRecords.count()])
    recordDataAction({ type: 'import', size: file.size, wordCount, chapterCount })
  })

  input.click()
}
