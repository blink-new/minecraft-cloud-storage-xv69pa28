import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Button } from '../ui/button'
import { FileItem, supabase } from '../../lib/supabase'
import { FileIcon, FolderIcon, HomeIcon, ChevronRightIcon } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface MoveModalProps {
  file: FileItem | null
  open: boolean
  onClose: () => void
  onMove: (file: FileItem, targetFolderId: string | null) => Promise<void>
  currentFolder: FileItem | null
}

export function MoveModal({ file, open, onClose, onMove, currentFolder }: MoveModalProps) {
  const [folders, setFolders] = useState<FileItem[]>([])
  const [selectedFolder, setSelectedFolder] = useState<FileItem | null>(null)
  const [loading, setLoading] = useState(false)
  const [moveLoading, setMoveLoading] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (open && user) {
      loadFolders()
    }
  }, [open, user])

  const loadFolders = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'folder')
        .order('name')

      if (error) throw error

      setFolders(data || [])
    } catch (error) {
      console.error('Error loading folders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMove = async () => {
    if (!file) return

    setMoveLoading(true)
    try {
      await onMove(file, selectedFolder?.id || null)
      onClose()
    } catch (error) {
      console.error('Move error:', error)
    } finally {
      setMoveLoading(false)
    }
  }

  const buildFolderPath = (folder: FileItem): FileItem[] => {
    const path: FileItem[] = []
    let current = folder
    
    while (current) {
      path.unshift(current)
      current = folders.find(f => f.id === current.parent_id) || folders.find(f => f.path === current.path.split('/').slice(0, -1).join('/')) as FileItem
    }
    
    return path
  }

  const canMoveToFolder = (folder: FileItem): boolean => {
    if (!file) return false
    
    // Can't move to itself
    if (folder.id === file.id) return false
    
    // Can't move to its own subfolder
    if (file.type === 'folder' && folder.path.startsWith(file.path + '/')) return false
    
    // Can't move to current location
    if (folder.id === file.parent_id) return false
    
    return true
  }

  const getAvailableFolders = () => {
    return folders.filter(canMoveToFolder)
  }

  if (!file) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="minecraft-card border-4 border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-minecraft flex items-center gap-2">
            {file.type === 'folder' ? (
              <FolderIcon className="w-5 h-5 text-secondary" />
            ) : (
              <FileIcon className="w-5 h-5 text-muted-foreground" />
            )}
            Move "{file.name}"
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Choose destination folder:
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {/* Root folder option */}
            <button
              className={`w-full text-left p-3 rounded-md border-2 transition-all ${
                selectedFolder === null
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-border/60 bg-card'
              }`}
              onClick={() => setSelectedFolder(null)}
              disabled={!file || file.parent_id === null}
            >
              <div className="flex items-center gap-2">
                <HomeIcon className="w-4 h-4 text-primary" />
                <span className="font-minecraft text-xs">Root Folder</span>
              </div>
            </button>

            {loading ? (
              <div className="text-center py-4 text-muted-foreground">
                Loading folders...
              </div>
            ) : (
              getAvailableFolders().map((folder) => {
                const path = buildFolderPath(folder)
                return (
                  <button
                    key={folder.id}
                    className={`w-full text-left p-3 rounded-md border-2 transition-all ${
                      selectedFolder?.id === folder.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-border/60 bg-card'
                    }`}
                    onClick={() => setSelectedFolder(folder)}
                  >
                    <div className="flex items-center gap-2">
                      <FolderIcon className="w-4 h-4 text-secondary" />
                      <div className="flex items-center gap-1 text-xs">
                        {path.map((pathFolder, index) => (
                          <React.Fragment key={pathFolder.id}>
                            {index > 0 && <ChevronRightIcon className="w-3 h-3 text-muted-foreground" />}
                            <span className={index === path.length - 1 ? 'font-minecraft' : 'text-muted-foreground'}>
                              {pathFolder.name}
                            </span>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </button>
                )
              })
            )}

            {!loading && getAvailableFolders().length === 0 && (
              <div className="text-center py-4 text-muted-foreground text-sm">
                No available folders to move to
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="block-button font-minecraft text-xs"
            disabled={moveLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleMove}
            className="block-button bg-primary hover:bg-primary/90 font-minecraft text-xs"
            disabled={moveLoading || loading}
          >
            {moveLoading ? 'Moving...' : 'Move Here'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}