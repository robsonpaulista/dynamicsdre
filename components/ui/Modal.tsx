import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  className?: string
  /** 'primary' = cabeçalho laranja (tema) */
  headerVariant?: 'default' | 'primary'
}

export function Modal({ isOpen, onClose, title, children, className, headerVariant = 'default' }: ModalProps) {
  // Fechar modal com ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevenir scroll do body quando modal está aberto
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const modalContent = (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div 
        className={cn(
          'relative z-[201] w-full max-w-2xl max-h-[90vh]',
          'bg-background dark:bg-dark-card',
          'border border-border dark:border-dark-border',
          'rounded-lg shadow-lg',
          'flex flex-col',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={cn(
            'flex items-center justify-between p-6 border-b',
            headerVariant === 'primary'
              ? 'bg-primary border-primary-hover'
              : 'border-border dark:border-dark-border'
          )}
        >
          <h2
            className={cn(
              'text-sm font-semibold',
              headerVariant === 'primary' ? 'text-white' : 'text-text-primary dark:text-dark-text-primary'
            )}
          >
            {title}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className={headerVariant === 'primary' ? 'h-8 w-8 p-0 text-white hover:bg-white/20' : 'h-8 w-8 p-0'}
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  )

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null
}
