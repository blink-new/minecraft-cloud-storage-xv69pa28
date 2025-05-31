import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { FileItem } from '../../lib/supabase'
import { FileIcon, FolderIcon } from 'lucide-react'

interface RenameModalProps {
  file: FileItem | null
  open: boolean
  onClose: () => void
  onRename: (file: FileItem, newName: string) => Promise<void>
}

export function RenameModal({ file, open, onClose, onRename }: RenameModalProps) {
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (file && open) {
      // Remove file extension for files, keep full name for folders
      if (file.type === 'file') {
        const lastDot = file.name.lastIndexOf('.')
        setNewName(lastDot > 0 ? file.name.substring(0, lastDot) : file.name)
      } else {
        setNewName(file.name)
      }
    }
  }, [file, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !newName.trim()) return

    setLoading(true)
    try {
      // Add file extension back for files
      let finalName = newName.trim()
      if (file.type === 'file') {
        const lastDot = file.name.lastIndexOf('.')
        if (lastDot > 0) {
          const extension = file.name.substring(lastDot)
          finalName = newName.trim() + extension
        }
      }

      await onRename(file, finalName)
      onClose()
    } catch (error) {
      console.error('Rename error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!file) return null

  const fileExtension = file.type === 'file' ? file.name.substring(file.name.lastIndexOf('.')) : ''

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="minecraft-card border-4 border-border">
        <DialogHeader>
          <DialogTitle className="font-minecraft flex items-center gap-2">
            {file.type === 'folder' ? (
              <FolderIcon className="w-5 h-5 text-secondary" />
            ) : (
              <FileIcon className="w-5 h-5 text-muted-foreground" />
            )}
            Rename {file.type === 'folder' ? 'Folder' : 'File'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="filename" className="font-minecraft text-xs">
              {file.type === 'folder' ? 'Folder Name' : 'File Name'}
            </Label>
            <div className="flex items-center space-x-2">
              <Input
                id="filename"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="block-button font-mono flex-1"
                placeholder={file.type === 'folder' ? 'Enter folder name' : 'Enter file name'}
                autoFocus
                disabled={loading}
              />
              {fileExtension && (
                <span className="text-sm text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                  {fileExtension}
                </span>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="block-button font-minecraft text-xs"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="block-button bg-primary hover:bg-primary/90 font-minecraft text-xs"
              disabled={loading || !newName.trim()}
            >
              {loading ? 'Renaming...' : 'Rename'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}