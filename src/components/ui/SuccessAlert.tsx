import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { FC } from 'react'
import { useCallback, useEffect } from 'react'
import PhCheckCircle from '~icons/ph/check-circle'

export type ISuccessAlert = {
  className?: string
  show: boolean
  setShow: (show: boolean) => void
  title?: string
  message: string
  autoClose?: boolean
  autoCloseDelay?: number
}

export const SuccessAlert: FC<ISuccessAlert> = ({ 
  className, 
  show, 
  setShow, 
  title = '成功', 
  message,
  autoClose = true,
  autoCloseDelay = 3000
}) => {
  const onClose = useCallback(() => {
    setShow(false)
  }, [setShow])

  useEffect(() => {
    if (show && autoClose) {
      const timer = setTimeout(() => {
        setShow(false)
      }, autoCloseDelay)
      
      return () => clearTimeout(timer)
    }
  }, [show, autoClose, autoCloseDelay, setShow])

  return (
    <>
      {show && (
        <div className={`fixed top-4 right-4 z-50 w-fit cursor-pointer ${className}`} onClick={onClose}>
          <Alert variant="default" className="relative border-green-200 bg-green-50 text-green-800">
            <PhCheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">{title}</AlertTitle>
            <AlertDescription className="text-green-700">{message}</AlertDescription>
          </Alert>
        </div>
      )}
    </>
  )
}