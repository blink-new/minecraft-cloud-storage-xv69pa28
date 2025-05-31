import React, { useEffect, useState, useRef } from 'react'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { FileItem, supabase } from '../../lib/supabase'
import { 
  FileIcon, 
  FolderIcon, 
  ImageIcon, 
  VideoIcon, 
  FileTextIcon,
  DownloadIcon,
  TrashIcon
} from 'lucide-react'

interface FileGridProps {
  files: FileItem[]
  onFileClick: (file: FileItem) => void
  onDownload: (file: FileItem) => void
  onDelete: (file: FileItem) => Promise<void>
  onPreview?: (file: FileItem) => void
  onRenameRequest: (file: FileItem) => void
  onMoveRequest: (file: FileItem) => void
}

function ImageThumb({ file }: { file: FileItem }) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let active = true
    async function fetchUrl() {
      if (!file || !file.path) return
      // Use Supabase signed URL for private bucket
      const { data, error } = await import('../../lib/supabase').then(m => m.supabase.storage.from('files').createSignedUrl(file.path, 60 * 60))
      if (active) setUrl(data?.signedUrl || null)
    }
    fetchUrl()
    return () => { active = false }
  }, [file])
  if (!url) return <FileIcon className="w-8 h-8 text-muted-foreground" />
  return <img src={url} alt={file.name} className="w-12 h-12 object-cover rounded border border-muted" style={{ imageRendering: 'pixelated' }} />
}

export function FileGrid({ files, onFileClick, onDownload, onDelete, onPreview, onRenameRequest, onMoveRequest }: FileGridProps) {
  const getFileIcon = (file: FileItem) => {
    if (file.type === 'folder') {
      return <FolderIcon className="w-8 h-8 text-secondary" />
    }
    if (file.mime_type?.startsWith('image/')) {
      return <ImageThumb file={file} />
    }
    if (file.mime_type === 'application/pdf') {
      return <span className="inline-block"><FileTextIcon className="w-8 h-8 text-red-500" /></span>
    }
    if (file.mime_type?.startsWith('video/')) {
      return <VideoIcon className="w-8 h-8 text-accent" />
    }
    if (file.mime_type?.includes('text/')) {
      return <FileTextIcon className="w-8 h-8 text-muted-foreground" />
    }
    return <FileIcon className="w-8 h-8 text-muted-foreground" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; file: FileItem | null }>({ visible: false, x: 0, y: 0, file: null })
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu({ visible: false, x: 0, y: 0, file: null })
      }
    }
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [])

  const openContextMenu = (e: React.MouseEvent, file: FileItem) => {
    e.preventDefault()
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, file })
  }

  const handleRename = () => {
    if (contextMenu.file) {
      onRenameRequest(contextMenu.file)
      setContextMenu({ visible: false, x: 0, y: 0, file: null })
    }
  }

  const handleDeleteContext = () => {
    if (contextMenu.file) {
      onDelete(contextMenu.file)
      setContextMenu({ visible: false, x: 0, y: 0, file: null })
    }
  }

  const handleMove = () => {
    if (contextMenu.file) {
      onMoveRequest(contextMenu.file)
      setContextMenu({ visible: false, x: 0, y: 0, file: null })
    }
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="minecraft-card w-24 h-24 flex items-center justify-center">
          <span className="font-minecraft text-2xl">📦</span>
        </div>
        <p className="font-minecraft text-sm text-muted-foreground">
          Your inventory is empty
        </p>
        <p className="text-xs text-muted-foreground">
          Upload some files to get started!
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="grid-layout">
        {files.map((file) => (
          <Card
            key={file.id}
            className="minecraft-card hover:scale-105 transition-transform cursor-pointer group"
            onClick={() => onFileClick(file)}
            onContextMenu={(e) => openContextMenu(e, file)}
          >
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-center">
                <div
                  onClick={file.type === 'file' && onPreview ? (e) => { e.stopPropagation(); onPreview(file); } : undefined}
                  className={file.type === 'file' && onPreview ? 'cursor-zoom-in' : ''}
                >
                  {getFileIcon(file)}
                </div>
              </div>
              <div className="text-center space-y-1">
                <h3 className="font-minecraft text-xs truncate" title={file.name}>
                  {file.name}
                </h3>
                {file.type === 'file' && (
                  <p className="text-xs text-muted-foreground font-mono">
                    {formatFileSize(file.size)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground font-mono">
                  {formatDate(file.created_at)}
                </p>
              </div>
              {file.type === 'file' && (
                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 block-button h-8"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDownload(file)
                    }}
                  >
                    <DownloadIcon className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1 block-button h-8"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(file)
                    }}
                  >
                    <TrashIcon className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {contextMenu.visible && (
        <div
          ref={menuRef}
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-50 bg-card border border-border rounded shadow-md p-2 w-40"
        >
          <button
            className="block w-full text-left px-2 py-1 hover:bg-accent hover:text-accent-foreground"
            onClick={handleRename}
          >
            Rename
          </button>
          <button
            className="block w-full text-left px-2 py-1 hover:bg-destructive hover:text-destructive-foreground"
            onClick={handleDeleteContext}
          >
            Delete
          </button>
          <button
            className="block w-full text-left px-2 py-1 hover:bg-secondary hover:text-secondary-foreground"
            onClick={handleMove}
          >
            Move
          </button>
        </div>
      )}
    </>
  )
}