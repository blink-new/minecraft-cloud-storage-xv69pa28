import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Separator } from '../ui/separator'
import { FileGrid } from './FileGrid'
import { UploadZone } from './UploadZone'
import { StorageUsage } from './StorageUsage'
import { useAuth } from '../../contexts/AuthContext'
import { supabase, FileItem } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { 
  LogOutIcon, 
  SearchIcon, 
  FolderPlusIcon,
  HomeIcon,
  UploadIcon
} from 'lucide-react'
import { FilePreviewModal } from './FilePreviewModal'
import { RenameDialog } from './RenameDialog'
import { MoveDialog } from './MoveDialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"

interface DashboardProps {
  folderId?: string // URL param for current folder
  onUpgradeClick?: () => void
  onNavigateToSettings?: () => void
}

export function Dashboard({ folderId, onUpgradeClick, onNavigateToSettings }: DashboardProps) {
  const navigate = useNavigate()
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentFolder, setCurrentFolder] = useState<FileItem | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [fileToRename, setFileToRename] = useState<FileItem | null>(null)
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [fileToMove, setFileToMove] = useState<FileItem | null>(null)
  const [showMoveDialog, setShowMoveDialog] = useState(false)
  const [sortField, setSortField] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [totalUsedStorage, setTotalUsedStorage] = useState(0)
  const [userPlan, setUserPlan] = useState('free')
  const [breadcrumbPath, setBreadcrumbPath] = useState<FileItem[]>([])
  const { user, signOut } = useAuth()

  // Load current folder based on folderId URL param
  useEffect(() => {
    if (user && folderId) {
      const loadCurrentFolder = async () => {
        const { data, error } = await supabase
          .from('files')
          .select('*')
          .eq('id', folderId)
          .eq('user_id', user.id)
          .eq('type', 'folder')
          .single()

        if (!error && data) {
          setCurrentFolder(data)
        } else {
          // Invalid folder ID, redirect to root
          navigate('/', { replace: true })
        }
      }
      loadCurrentFolder()
    } else {
      setCurrentFolder(null)
    }
  }, [folderId, user, navigate])

  // Build breadcrumb path
  useEffect(() => {
    if (user && currentFolder) {
      const buildPath = async () => {
        const path: FileItem[] = []
        let folder = currentFolder
        
        while (folder) {
          path.unshift(folder)
          if (folder.parent_id) {
            const { data } = await supabase
              .from('files')
              .select('*')
              .eq('id', folder.parent_id)
              .eq('user_id', user.id)
              .single()
            folder = data
          } else {
            folder = null
          }
        }
        setBreadcrumbPath(path)
      }
      buildPath()
    } else {
      setBreadcrumbPath([])
    }
  }, [currentFolder, user])

  const loadFiles = async () => {
    if (!user) return
    setLoading(true)

    try {
      let query = supabase
        .from('files')
        .select('*')
        .eq('user_id', user.id)
      
      if (!currentFolder) {
        query = query.is('parent_id', null)
      } else {
        query = query.eq('parent_id', currentFolder.id)
      }

      if (sortField === 'type') {
        query = query.order('type', { ascending: sortOrder === 'asc' })
      } else {
        query = query
          .order('type', { ascending: false })
          .order(sortField, { ascending: sortOrder === 'asc' })
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      const sortedData = data || []
      if (sortField === 'type') {
        sortedData.sort((a, b) => {
          if (sortOrder === 'asc') {
            return a.type.localeCompare(b.type)
          } else {
            return b.type.localeCompare(a.type)
          }
        })
      } else if (sortField === 'name') {
        sortedData.sort((a, b) => {
          if (a.type !== b.type) {
            return b.type.localeCompare(a.type)
          }
          if (sortOrder === 'asc') {
            return a.name.localeCompare(b.name)
          } else {
            return b.name.localeCompare(a.name)
          }
        })
      } else if (sortField === 'created_at') {
        sortedData.sort((a, b) => {
          if (a.type !== b.type) {
            return b.type.localeCompare(a.type)
          }
          const dateA = new Date(a.created_at).getTime()
          const dateB = new Date(b.created_at).getTime()
          if (sortOrder === 'asc') {
            return dateA - dateB
          } else {
            return dateB - dateA
          }
        })
      } else if (sortField === 'size') {
        sortedData.sort((a, b) => {
          if (a.type !== b.type) {
            return b.type.localeCompare(a.type)
          }
          if (sortOrder === 'asc') {
            return a.size - b.size
          } else {
            return b.size - a.size
          }
        })
      }
      setFiles(sortedData)

      const { data: allUserFiles, error: allFilesError } = await supabase
        .from('files')
        .select('size, type')
        .eq('user_id', user.id)

      if (!allFilesError && allUserFiles) {
        const usage = allUserFiles.reduce((acc, file) => file.type === 'file' ? acc + file.size : acc, 0)
        setTotalUsedStorage(usage) 
      }

    } catch (error: any) {
      console.error('Error loading files:', error)
      toast.error('Failed to load files: ' + (error?.message || error))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      supabase.rpc('get_user_subscription', { p_user_id: user.id })
        .then(({ data, error }) => {
          if (!error && data && data.length > 0) {
            setUserPlan(data[0].plan_id)
          }
        })
    }
    loadFiles()
  }, [user, currentFolder, sortField, sortOrder])

  const handleFileClick = (file: FileItem) => {
    if (file.type === 'folder') {
      navigate(`/folder/${file.id}`)
    }
  }

  const handleFolderNavigation = (folderId: string | null) => {
    if (folderId) {
      navigate(`/folder/${folderId}`)
    } else {
      navigate('/')
    }
  }

  const handleDownload = async (file: FileItem) => {
    try {
      const { data, error } = await supabase.storage
        .from('files')
        .download(file.path)
      if (error) throw error
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success(`Downloaded ${file.name}`)
    } catch (error: any) {
      console.error('Download error:', error)
      toast.error('Failed to download file: ' + (error?.message || error))
    }
  }

  const handleDelete = async (file: FileItem) => {
    if (!confirm(`Are you sure you want to delete ${file.name}${file.type === 'folder' ? ' and its contents' : ''}?`)) {
      return
    }
    try {
      if (file.type === 'folder') {
        const { data: children, error: fetchChildrenError } = await supabase
          .from('files')
          .select('id, name, type, path')
          .eq('parent_id', file.id)
        if (fetchChildrenError) throw fetchChildrenError
        if (children && children.length > 0) {
          for (const child of children) {
            await handleDelete(child)
          }
        }
        const { error: dbError } = await supabase.from('files').delete().eq('id', file.id)
        if (dbError) throw dbError
      } else if (file.type === 'file') {
        const { error: storageError } = await supabase.storage.from('files').remove([file.path])
        if (storageError) console.warn('Storage delete error:', storageError)
        const { error: dbError } = await supabase.from('files').delete().eq('id', file.id)
        if (dbError) throw dbError
      }
      toast.success(`${file.name} deleted successfully`)
      if (currentFolder && currentFolder.id === file.id) {
         // If deleting current folder, navigate to parent
         const parentFolderId = currentFolder.parent_id
         handleFolderNavigation(parentFolderId)
      } else {
         loadFiles()
      }
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error('Failed to delete: ' + (error?.message || error))
    }
  }

  const createFolder = async () => {
    const folderName = prompt('Enter folder name:')
    if (!folderName || !user) return
    try {
      const { error } = await supabase
        .from('files')
        .insert({
          name: folderName,
          size: 0,
          type: 'folder',
          user_id: user.id,
          path: currentFolder ? `${currentFolder.path}/${folderName}` : folderName,
          parent_id: currentFolder ? currentFolder.id : null
        })
      if (error) throw error
      toast.success(`Folder "${folderName}" created`)
      loadFiles()
    } catch (error) {
      console.error('Create folder error:', error)
      toast.error('Failed to create folder')
    }
  }

  const updateChildrenPaths = async (parentId: string, oldParentPath: string, newParentPath: string) => {
    const { data: children, error } = await supabase
      .from('files')
      .select('id, path, type')
      .eq('parent_id', parentId)
    if (error) throw error
    if (children && children.length > 0) {
      for (const child of children) {
        const newChildPath = child.path.replace(oldParentPath, newParentPath)
        const { error: updateError } = await supabase
          .from('files')
          .update({ path: newChildPath })
          .eq('id', child.id)
        if (updateError) throw updateError
        if (child.type === 'folder') {
          await updateChildrenPaths(child.id, child.path, newChildPath)
        }
      }
    }
  }

  const handleRenameRequest = (file: FileItem) => {
    setFileToRename(file)
    setShowRenameDialog(true)
  }

  const handleRename = async (file: FileItem, newName: string) => {
    if (!user) return
    try {
      const oldPath = file.path
      const newPath = currentFolder 
        ? `${currentFolder.path}/${newName}`
        : newName
      const { error: dbError } = await supabase
        .from('files')
        .update({ name: newName, path: newPath })
        .eq('id', file.id)
      if (dbError) throw dbError
      if (file.type === 'file') {
        const { error: storageError } = await supabase.storage.from('files').move(oldPath, newPath)
        if (storageError) throw storageError
      } else if (file.type === 'folder') {
         await updateChildrenPaths(file.id, oldPath, newPath)
      }
      toast.success(`${file.name} renamed to ${newName}`)
      loadFiles()
    } catch (error: any) {
      console.error('Rename error:', error)
      toast.error('Failed to rename: ' + (error?.message || error))
    }
  }

  const handleMoveRequest = (file: FileItem) => {
    setFileToMove(file)
    setShowMoveDialog(true)
  }

  const handleMove = async (file: FileItem, destinationFolder: FileItem | null) => {
    if (!user) return
    try {
      const newParentId = destinationFolder ? destinationFolder.id : null
      const newPath = destinationFolder 
        ? `${destinationFolder.path}/${file.name}`
        : file.name
      const { error: dbError } = await supabase
        .from('files')
        .update({ parent_id: newParentId, path: newPath })
        .eq('id', file.id)
      if (dbError) throw dbError
      if (file.type === 'file') {
        const oldPath = file.path
        const { error: storageError } = await supabase.storage.from('files').move(oldPath, newPath)
        if (storageError) throw storageError
      } else if (file.type === 'folder') {
         await updateChildrenPaths(file.id, file.path, newPath)
      }
      toast.success(`${file.name} moved successfully`)
      loadFiles()
    } catch (error: any) {
      console.error('Move error:', error)
      toast.error('Failed to move: ' + (error?.message || error))
    }
  }

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getFolderName = (folder: FileItem) => {
    return folder.name
  }

  const [previewFile, setPreviewFile] = useState<FileItem | null>(null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-brown-800 to-yellow-900">
      {/* Header */}
      <header className="bg-card/90 backdrop-blur-sm border-b-4 border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="minecraft-card w-12 h-12 bg-primary flex items-center justify-center">
                <span className="font-minecraft text-lg text-primary-foreground">📦</span>
              </div>
              <h1 className="font-minecraft text-xl text-primary">
                CraftBox
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-minecraft text-xs text-primary">
                  Welcome, {user?.email?.split('@')[0]}!
                </p>
              </div>
              {onNavigateToSettings && (
                <Button
                  variant="outline"
                  onClick={onNavigateToSettings}
                  className="block-button font-minecraft text-xs"
                >
                  Settings
                </Button>
              )}
              <Button
                variant="outline"
                onClick={signOut}
                className="block-button font-minecraft text-xs"
              >
                <LogOutIcon className="w-4 h-4 mr-2" />
                Exit World
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFolderNavigation(null)}
              className="font-minecraft text-xs text-secondary hover:text-secondary/80"
            >
              <HomeIcon className="w-4 h-4 mr-1" />
              Home
            </Button>
            {breadcrumbPath.map((folder) => (
              <React.Fragment key={folder.id}>
                <span className="text-muted-foreground">/</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFolderNavigation(folder.id)}
                  className="font-minecraft text-xs text-secondary hover:text-secondary/80"
                >
                  {getFolderName(folder)}
                </Button>
              </React.Fragment>
            ))}
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 relative w-full sm:w-auto">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search your inventory..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block-button pl-10 font-mono w-full"
              />
            </div>
            
            <div className="flex space-x-2 items-center">
              <Select value={sortField} onValueChange={setSortField}>
                <SelectTrigger className="block-button font-minecraft text-xs w-[180px]">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent className="minecraft-card">
                  <SelectItem value="name" className="font-minecraft text-xs">Name</SelectItem>
                  <SelectItem value="created_at" className="font-minecraft text-xs">Date Modified</SelectItem>
                  <SelectItem value="size" className="font-minecraft text-xs">Size</SelectItem>
                  <SelectItem value="type" className="font-minecraft text-xs">Type</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="block-button"
                title={sortOrder === 'asc' ? 'Sort Ascending' : 'Sort Descending'}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={createFolder}
                className="block-button bg-secondary hover:bg-secondary/90 font-minecraft text-xs"
              >
                <FolderPlusIcon className="w-4 h-4 mr-2" />
                New Folder
              </Button>
              <Button
                onClick={() => setShowUpload(!showUpload)}
                className="block-button bg-primary hover:bg-primary/90 font-minecraft text-xs"
              >
                <UploadIcon className="w-4 h-4 mr-2" />
                Upload
              </Button>
            </div>
          </div>

          {/* Storage Usage */}
          {!currentFolder && (
            <StorageUsage
              totalUsed={totalUsedStorage}
              currentPlan={userPlan}
              onUpgradeClick={() => onUpgradeClick?.()}
            />
          )}

          {/* Upload Zone */}
          {showUpload && (
            <UploadZone
              parentId={currentFolder ? currentFolder.id : null}
              onUploadComplete={() => {
                loadFiles()
                setShowUpload(false)
              }}
            />
          )}

          <Separator className="bg-border" />

          {/* File Grid */}
          <div>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="minecraft-card w-16 h-16 flex items-center justify-center animate-pulse">
                  <span className="font-minecraft text-xl">⚡</span>
                </div>
              </div>
            ) : (
              <FileGrid
                files={filteredFiles}
                onFileClick={handleFileClick}
                onDownload={handleDownload}
                onDelete={handleDelete}
                onPreview={setPreviewFile}
                onRenameRequest={handleRenameRequest}
                onMoveRequest={handleMoveRequest}
              />
            )}
          </div>
        </div>
      </main>
      <FilePreviewModal
        file={previewFile}
        open={!!previewFile}
        onClose={() => setPreviewFile(null)}
      />
      <RenameDialog
        file={fileToRename}
        open={showRenameDialog}
        onClose={() => setShowRenameDialog(false)}
        onRename={handleRename}
      />
      <MoveDialog
        fileToMove={fileToMove}
        open={showMoveDialog}
        onClose={() => setShowMoveDialog(false)}
        onMove={handleMove}
        folders={files.filter(f => f.type === 'folder')}
        currentFolder={currentFolder}
      />
    </div>
  )
}