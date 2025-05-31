import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { FileItem } from '../../lib/supabase'

interface RenameDialogProps {
  file: FileItem | null
  open: boolean
  onClose: () => void
  onRename: (file: FileItem, newName: string) => void
}

export function RenameDialog({ file, open, onClose, onRename }: RenameDialogProps) {
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (file) {
      setNewName(file.name)
    } else {
      setNewName('')
    }
  }, [file])

  const handleRenameClick = async () => {
    if (!file || !newName.trim()) return
    setLoading(true)
    await onRename(file, newName.trim())
    setLoading(false)
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleRenameClick()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] minecraft-card">
        <DialogHeader>
          <DialogTitle className="font-minecraft text-lg">Rename {file?.type}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right font-minecraft text-xs">
              New Name
            </Label>
            <Input
              id="name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="col-span-3 block-button font-mono"
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            onClick={handleRenameClick}
            disabled={loading || !newName.trim() || newName.trim() === file?.name}
            className="block-button bg-primary hover:bg-primary/90 font-minecraft text-xs"
          >
            {loading ? 'Renaming...' : 'Rename'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
