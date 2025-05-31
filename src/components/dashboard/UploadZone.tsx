import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Progress } from '../ui/progress'
import { UploadIcon, XIcon } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

interface UploadZoneProps {
  parentId: string | null
  onUploadComplete: () => void
}

interface UploadingFile {
  file: File
  progress: number
  id: string
}

export function UploadZone({ parentId, onUploadComplete }: UploadZoneProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const { user } = useAuth()

  const uploadFile = async (file: File) => {
    if (!user) return

    const fileId = Math.random().toString(36).substring(7)
    const fileName = `${Date.now()}-${file.name}`
    // Create user-specific path: userId/parentId/fileName (if parentId exists)
    const filePath = parentId 
      ? `${user.id}/${parentId}/${fileName}`
      : `${user.id}/${fileName}` // Root level

    // Add to uploading files
    setUploadingFiles(prev => [...prev, { file, progress: 0, id: fileId }])

    try {
      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('files')
        .upload(filePath, file, {
          onUploadProgress: (progress) => {
            const percent = (progress.loaded / progress.total) * 100
            setUploadingFiles(prev => 
              prev.map(uf => 
                uf.id === fileId ? { ...uf, progress: percent } : uf
              )
            )
          }
        })

      if (error) {
        throw error
      }

      // Create file record in database
      const { error: dbError } = await supabase
        .from('files')
        .insert({
          name: file.name,
          size: file.size,
          type: 'file',
          mime_type: file.type,
          user_id: user.id,
          path: data.path,
          parent_id: parentId
        })

      if (dbError) {
        throw dbError
      }

      toast.success(`${file.name} uploaded successfully!`)
      onUploadComplete()

    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(`Failed to upload ${file.name}: ${error.message}`)
    } finally {
      // Remove from uploading files
      setUploadingFiles(prev => prev.filter(uf => uf.id !== fileId))
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      await uploadFile(file)
    }
  }, [parentId, user])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true
  })

  const removeUploadingFile = (id: string) => {
    setUploadingFiles(prev => prev.filter(uf => uf.id !== id))
  }

  return (
    <div className="space-y-4">
      <Card
        {...getRootProps()}
        className={`minecraft-card cursor-pointer transition-all ${
          isDragActive ? 'scale-105 border-primary' : 'hover:scale-102'
        }`}
      >
        <input {...getInputProps()} />
        <CardContent className="p-8 text-center space-y-4">
          <div className="minecraft-card w-16 h-16 mx-auto flex items-center justify-center bg-secondary">
            <UploadIcon className="w-8 h-8 text-secondary-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="font-minecraft text-lg text-primary">
              {isDragActive ? 'Drop items here!' : 'Crafting Table Upload'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isDragActive 
                ? 'Release to add to your inventory'
                : 'Drag & drop files here, or click to select items'
              }
            </p>
          </div>
          <Button className="block-button bg-primary hover:bg-primary/90 font-minecraft">
            Select Files
          </Button>
        </CardContent>
      </Card>

      {uploadingFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-minecraft text-sm text-primary">Uploading Items...</h4>
          {uploadingFiles.map((uploadingFile) => (
            <Card key={uploadingFile.id} className="minecraft-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-mono truncate flex-1">
                    {uploadingFile.file.name}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeUploadingFile(uploadingFile.id)}
                    className="h-6 w-6 p-0"
                  >
                    <XIcon className="w-4 h-4" />
                  </Button>
                </div>
                <Progress 
                  value={uploadingFile.progress} 
                  className="h-2 bg-muted"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{Math.round(uploadingFile.progress)}%</span>
                  <span className="font-mono">
                    {(uploadingFile.file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}