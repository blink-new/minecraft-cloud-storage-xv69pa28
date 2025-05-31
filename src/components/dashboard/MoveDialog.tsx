import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Button } from '../ui/button'
import { FileItem } from '../../lib/supabase'
import { FolderIcon, ChevronRightIcon } from 'lucide-react'

interface MoveDialogProps {
  fileToMove: FileItem | null
  open: boolean
  onClose: () => void
  onMove: (file: FileItem, destinationFolder: FileItem | null) => void
  folders: FileItem[] // List of all folders for selection
  currentFolder: FileItem | null // Current folder in the main view
}

export function MoveDialog({ fileToMove, open, onClose, onMove, folders, currentFolder }: MoveDialogProps) {
  const [selectedFolder, setSelectedFolder] = useState<FileItem | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Reset selected folder when dialog opens or fileToMove changes
    setSelectedFolder(null)
  }, [open, fileToMove])

  const handleMoveClick = async () => {
    if (!fileToMove) return
    setLoading(true)
    await onMove(fileToMove, selectedFolder)
    setLoading(false)
    onClose()
  }

  // Filter folders to exclude the file being moved and its descendants
  const getMovableFolders = (items: FileItem[], excludeId: string | null): FileItem[] => {
    if (!excludeId) return items.filter(item => item.type === 'folder')

    const excludedItem = items.find(item => item.id === excludeId)
    if (!excludedItem) return items.filter(item => item.type === 'folder')

    const excludedPaths = new Set<string>()
    const buildExcludedPaths = (item: FileItem) => {
      excludedPaths.add(item.path)
      items.filter(child => child.parent_id === item.id).forEach(buildExcludedPaths)
    }
    buildExcludedPaths(excludedItem)

    return items.filter(item => 
      item.type === 'folder' && 
      item.id !== excludeId && // Cannot move into itself
      item.parent_id !== excludeId && // Cannot move into its direct child
      !excludedPaths.has(item.path) // Cannot move into its descendants
    )
  }

  const movableFolders = getMovableFolders(folders, fileToMove?.id || null)

  // Build a tree structure for displaying folders
  const buildFolderTree = (items: FileItem[], parentId: string | null = null) => {
    return items
      .filter(item => item.parent_id === parentId)
      .map(item => ({
        ...item,
        children: buildFolderTree(items, item.id)
      }))
  }

  const folderTree = buildFolderTree(movableFolders, null)

  const renderFolderTree = (nodes: (FileItem & { children: any[] })[]) => {
    return (
      <ul className="ml-4 space-y-1">
        {nodes.map(node => (
          <li key={node.id}>
            <Button
              variant="ghost"
              size="sm"
              className={`justify-start w-full font-minecraft text-xs ${selectedFolder?.id === node.id ? 'bg-accent text-accent-foreground' : ''}`}
              onClick={() => setSelectedFolder(node)}
            >
              <FolderIcon className="w-4 h-4 mr-2" />
              {node.name}
            </Button>
            {node.children.length > 0 && renderFolderTree(node.children)}
          </li>
        ))}
      </ul>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] minecraft-card">
        <DialogHeader>
          <DialogTitle className="font-minecraft text-lg">Move {fileToMove?.name}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-64 overflow-y-auto">
          <div className="space-y-1">
             <Button
              variant="ghost"
              size="sm"
              className={`justify-start w-full font-minecraft text-xs ${selectedFolder === null ? 'bg-accent text-accent-foreground' : ''}`}
              onClick={() => setSelectedFolder(null)}
            >
              <FolderIcon className="w-4 h-4 mr-2" />
              Home (Root)
            </Button>
            {renderFolderTree(folderTree)}
          </div>
        </div>
        <DialogFooter>
          <Button 
            onClick={handleMoveClick}
            disabled={loading || !fileToMove || selectedFolder?.id === fileToMove.id || selectedFolder?.parent_id === fileToMove.id}
            className="block-button bg-primary hover:bg-primary/90 font-minecraft text-xs"
          >
            {loading ? 'Moving...' : 'Move Here'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
