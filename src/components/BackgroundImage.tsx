import { useAtomValue } from 'jotai'
import { useEffect, useState } from 'react'
import { backgroundConfigAtom } from '@/store'

export default function BackgroundImage() {
  const backgroundConfig = useAtomValue(backgroundConfigAtom)
  const [imageLoaded, setImageLoaded] = useState(false)

  useEffect(() => {
    if (backgroundConfig.imageUrl || backgroundConfig.cachedImageData) {
      setImageLoaded(true)
    } else {
      setImageLoaded(false)
    }
  }, [backgroundConfig.imageUrl, backgroundConfig.cachedImageData])

  if (!imageLoaded) {
    return null
  }

  const imageSource = backgroundConfig.cachedImageData || backgroundConfig.imageUrl
  const brightness = backgroundConfig.brightness / 100
  const blur = backgroundConfig.blur
  const frostedGlass = backgroundConfig.frostedGlass

  const backgroundStyle = {
    backgroundImage: `url(${imageSource})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    filter: `brightness(${brightness}) blur(${blur}px)`,
    backdropFilter: frostedGlass ? 'blur(10px) saturate(180%)' : 'none',
  }

  return (
    <div
      className="fixed inset-0 -z-10"
      style={backgroundStyle}
    />
  )
}