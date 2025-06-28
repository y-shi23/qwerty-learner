import styles from './index.module.css'
import { defaultFontSizeConfig, defaultBackgroundConfig } from '@/constants'
import { fontSizeConfigAtom, backgroundConfigAtom } from '@/store'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import * as Slider from '@radix-ui/react-slider'
import * as Switch from '@radix-ui/react-switch'
import { useAtom } from 'jotai'
import { useCallback, useState } from 'react'

export default function ViewSetting() {
  const [fontSizeConfig, setFontsizeConfig] = useAtom(fontSizeConfigAtom)
  const [backgroundConfig, setBackgroundConfig] = useAtom(backgroundConfigAtom)
  const [imageUrl, setImageUrl] = useState(backgroundConfig.imageUrl)

  const onChangeForeignFontSize = useCallback(
    (value: [number]) => {
      setFontsizeConfig((prev) => ({
        ...prev,
        foreignFont: value[0],
      }))
    },
    [setFontsizeConfig],
  )

  const onChangeTranslateFontSize = useCallback(
    (value: [number]) => {
      setFontsizeConfig((prev) => ({
        ...prev,
        translateFont: value[0],
      }))
    },
    [setFontsizeConfig],
  )

  const onResetFontSize = useCallback(() => {
    setFontsizeConfig({ ...defaultFontSizeConfig })
  }, [setFontsizeConfig])

  const onChangeImageUrl = useCallback(
    (url: string) => {
      setImageUrl(url)
      if (url.trim()) {
        // 预加载图片并缓存到本地
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          canvas.width = img.width
          canvas.height = img.height
          ctx?.drawImage(img, 0, 0)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
          setBackgroundConfig((prev) => ({
            ...prev,
            imageUrl: url,
            cachedImageData: dataUrl,
          }))
        }
        img.onerror = () => {
          setBackgroundConfig((prev) => ({
            ...prev,
            imageUrl: url,
          }))
        }
        img.src = url
      } else {
        setBackgroundConfig((prev) => ({
          ...prev,
          imageUrl: '',
          cachedImageData: '',
        }))
      }
    },
    [setBackgroundConfig],
  )

  const onChangeBrightness = useCallback(
    (value: [number]) => {
      setBackgroundConfig((prev) => ({
        ...prev,
        brightness: value[0],
      }))
    },
    [setBackgroundConfig],
  )

  const onChangeBlur = useCallback(
    (value: [number]) => {
      setBackgroundConfig((prev) => ({
        ...prev,
        blur: value[0],
      }))
    },
    [setBackgroundConfig],
  )

  const onToggleFrostedGlass = useCallback(
    (checked: boolean) => {
      setBackgroundConfig((prev) => ({
        ...prev,
        frostedGlass: checked,
      }))
    },
    [setBackgroundConfig],
  )

  const onSaveBackground = useCallback(() => {
    // 保存当前背景设置到localStorage（实际上jotai已经自动处理了持久化）
    // 这里可以添加保存成功的提示
    console.log('背景设置已保存')
  }, [])

  const onResetBackground = useCallback(() => {
    setBackgroundConfig({ ...defaultBackgroundConfig })
    setImageUrl('')
  }, [setBackgroundConfig])

  return (
    <ScrollArea.Root className="flex-1 select-none overflow-y-auto ">
      <ScrollArea.Viewport className="h-full w-full px-3">
        <div className={styles.tabContent}>
          <div className={styles.section}>
            <span className={styles.sectionLabel}>字体设置</span>
            <div className={styles.block}>
              <span className={styles.blockLabel}>外语字体</span>
              <div className="flex h-5 w-full items-center justify-between">
                <Slider.Root
                  value={[fontSizeConfig.foreignFont]}
                  min={20}
                  max={96}
                  step={4}
                  className="slider"
                  onValueChange={onChangeForeignFontSize}
                >
                  <Slider.Track>
                    <Slider.Range />
                  </Slider.Track>
                  <Slider.Thumb />
                </Slider.Root>
                <span className="ml-4 w-10 text-xs font-normal text-gray-600">{fontSizeConfig.foreignFont}px</span>
              </div>
            </div>

            <div className={styles.block}>
              <span className={styles.blockLabel}>中文字体</span>
              <div className="flex h-5 w-full items-center justify-between">
                <Slider.Root
                  value={[fontSizeConfig.translateFont]}
                  max={60}
                  min={14}
                  step={4}
                  className="slider"
                  onValueChange={onChangeTranslateFontSize}
                >
                  <Slider.Track>
                    <Slider.Range />
                  </Slider.Track>
                  <Slider.Thumb />
                </Slider.Root>
                <span className="ml-4 w-10 text-xs font-normal text-gray-600">{fontSizeConfig.translateFont}px</span>
              </div>
            </div>
          </div>
          <button className="my-btn-primary ml-4 disabled:bg-gray-300" type="button" onClick={onResetFontSize} title="重置字体设置">
            重置字体设置
          </button>

          <div className={styles.section}>
            <span className={styles.sectionLabel}>背景设置</span>
            <div className={styles.block}>
              <span className={styles.blockLabel}>背景图片链接</span>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onBlur={(e) => onChangeImageUrl(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                onKeyPress={(e) => e.stopPropagation()}
                onKeyUp={(e) => e.stopPropagation()}
                placeholder="请输入图片直链地址"
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-400"
              />
            </div>

            <div className={styles.block}>
              <span className={styles.blockLabel}>亮度</span>
              <div className="flex h-5 w-full items-center justify-between">
                <Slider.Root
                  value={[backgroundConfig.brightness]}
                  min={20}
                  max={150}
                  step={5}
                  className="slider"
                  onValueChange={onChangeBrightness}
                >
                  <Slider.Track>
                    <Slider.Range />
                  </Slider.Track>
                  <Slider.Thumb />
                </Slider.Root>
                <span className="ml-4 w-10 text-xs font-normal text-gray-600">{backgroundConfig.brightness}%</span>
              </div>
            </div>

            <div className={styles.block}>
              <span className={styles.blockLabel}>模糊度</span>
              <div className="flex h-5 w-full items-center justify-between">
                <Slider.Root
                  value={[backgroundConfig.blur]}
                  min={0}
                  max={20}
                  step={1}
                  className="slider"
                  onValueChange={onChangeBlur}
                >
                  <Slider.Track>
                    <Slider.Range />
                  </Slider.Track>
                  <Slider.Thumb />
                </Slider.Root>
                <span className="ml-4 w-10 text-xs font-normal text-gray-600">{backgroundConfig.blur}px</span>
              </div>
            </div>

            <div className={styles.block}>
              <span className={styles.blockLabel}>磨砂玻璃效果</span>
              <Switch.Root
                checked={backgroundConfig.frostedGlass}
                onCheckedChange={onToggleFrostedGlass}
                className="relative h-6 w-11 cursor-default rounded-full bg-gray-200 outline-none data-[state=checked]:bg-blue-500"
              >
                <Switch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white transition-transform duration-100 will-change-transform data-[state=checked]:translate-x-[22px]" />
              </Switch.Root>
            </div>
          </div>
          <div className="ml-4 flex gap-2">
            <button className="my-btn-primary disabled:bg-gray-300" type="button" onClick={onSaveBackground} title="保存背景设置">
              保存
            </button>
            <button className="my-btn-primary disabled:bg-gray-300" type="button" onClick={onResetBackground} title="重置背景设置">
              重置
            </button>
          </div>
        </div>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar className="flex touch-none select-none bg-transparent " orientation="vertical"></ScrollArea.Scrollbar>
    </ScrollArea.Root>
  )
}
