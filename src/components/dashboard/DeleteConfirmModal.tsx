import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Button } from '../ui/button'
import { FileItem } from '../../lib/supabase'
import { FileIcon, FolderIcon, AlertTriangleIcon } from 'lucide-react'

interface DeleteConfirmModalProps {
  file: FileItem | null
  open: boolean
  onClose: () => void
  onDelete: (file: FileItem) => Promise<void>
}

export function DeleteConfirmModal({ file, open, onClose, onDelete }: DeleteConfirmModalProps) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!file) return

    setLoading(true)
    try {
      await onDelete(file)
      onClose()
    } catch (error) {
      console.error('Delete error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!file) return null

  const isFolder = file.type === 'folder'

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="minecraft-card border-4 border-destructive">
        <DialogHeader>
          <DialogTitle className="font-minecraft flex items-center gap-2 text-destructive">
            <AlertTriangleIcon className="w-5 h-5" />
            Delete {isFolder ? 'Folder' : 'File'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
            {isFolder ? (
              <FolderIcon className="w-8 h-8 text-secondary" />
            ) : (
              <FileIcon className="w-8 h-8 text-muted-foreground" />
            )}
            <div>
              <div className="font-minecraft text-sm">{file.name}</div>
              <div className="text-xs text-muted-foreground">
                {isFolder ? 'Folder' : `${(file.size / 1024).toFixed(1)} KB`}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="font-minecraft text-sm">
              Are you sure you want to delete this {isFolder ? 'folder' : 'file'}?
            </p>
            
            {isFolder && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  ⚠️ This will also delete all files and subfolders inside this folder.
                </p>
              </div>
            )}
            
            <p className="text-xs text-muted-foreground">
              This action cannot be undone.
            </p>
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
            onClick={handleDelete}
            variant="destructive"
            className="block-button font-minecraft text-xs"
            disabled={loading}
          >
            {loading ? 'Deleting...' : `Delete ${isFolder ? 'Folder' : 'File'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}