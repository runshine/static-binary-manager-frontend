
import React, { useState, useRef, useCallback } from 'react';
import { packageService } from '../services/packageService.ts';

interface UploadModalProps {
  onClose: () => void;
}

interface UploadTask {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

const UploadModal: React.FC<UploadModalProps> = ({ onClose }) => {
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((files: FileList | File[]) => {
    const newTasks: UploadTask[] = Array.from(files).map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      status: 'pending'
    }));
    setTasks((prev) => [...prev, ...newTasks]);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  };

  const startUpload = async () => {
    setIsProcessing(true);
    
    // Process only pending tasks
    const pendingTasks = tasks.filter(t => t.status === 'pending');
    
    for (const task of pendingTasks) {
      // Update status to uploading
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'uploading' } : t));
      
      try {
        // Validate filename format locally first
        const parsed = packageService.parseFilename(task.file.name);
        if (!parsed) {
          throw new Error('Invalid format. Expected: name-version-linux-arch.zip/.tar.gz');
        }

        await packageService.uploadPackage(task.file);
        
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'success' } : t));
      } catch (err: any) {
        setTasks(prev => prev.map(t => t.id === task.id ? { 
          ...t, 
          status: 'error', 
          error: err.message || 'Server upload failed' 
        } : t));
      }
    }
    
    setIsProcessing(false);
  };

  const removeTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const finishedCount = tasks.filter(t => t.status === 'success' || t.status === 'error').length;
  const totalCount = tasks.length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Bulk Upload Packages</h2>
            {totalCount > 0 && (
              <p className="text-sm text-slate-500 mt-1">
                Progress: {finishedCount} / {totalCount} completed
              </p>
            )}
          </div>
          <button 
            onClick={onClose} 
            disabled={isProcessing}
            className="text-slate-400 hover:text-slate-600 p-1 disabled:opacity-30"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-grow space-y-6">
          {/* Drop Zone */}
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200
              ${isDragging ? 'border-blue-500 bg-blue-50 scale-[1.01]' : 'border-slate-200 bg-slate-50'}
              ${isProcessing ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:border-blue-400 hover:bg-blue-50/30'}
            `}
            onClick={() => !isProcessing && fileInputRef.current?.click()}
          >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto text-2xl mb-4 transition-colors ${isDragging ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'}`}>
              <i className={`fas ${isDragging ? 'fa-arrow-down' : 'fa-cloud-upload-alt'}`}></i>
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-lg">
                {isDragging ? 'Drop files here' : 'Select or drag & drop packages'}
              </p>
              <p className="text-slate-500 text-sm mt-1">You can select multiple .zip or .tar.gz archives</p>
            </div>
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden" 
              accept=".zip,.tar.gz" 
              multiple
              onChange={handleFileChange}
            />
          </div>

          {/* Upload List */}
          {tasks.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Upload Queue</h3>
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div 
                    key={task.id} 
                    className={`
                      flex items-center gap-4 p-4 rounded-lg border text-sm transition-all
                      ${task.status === 'success' ? 'bg-emerald-50 border-emerald-100' : 
                        task.status === 'error' ? 'bg-rose-50 border-rose-100' : 
                        'bg-white border-slate-200'}
                    `}
                  >
                    <div className="flex-shrink-0 w-8 text-center">
                      {task.status === 'pending' && <i className="far fa-file-archive text-slate-400 text-lg"></i>}
                      {task.status === 'uploading' && <i className="fas fa-circle-notch fa-spin text-blue-500 text-lg"></i>}
                      {task.status === 'success' && <i className="fas fa-check-circle text-emerald-500 text-lg"></i>}
                      {task.status === 'error' && <i className="fas fa-exclamation-circle text-rose-500 text-lg"></i>}
                    </div>
                    
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-bold text-slate-700 truncate block text-sm" title={task.file.name}>
                          {task.file.name}
                        </span>
                        <span className="text-xs text-slate-400 uppercase flex-shrink-0 font-medium font-mono">
                          {(task.file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                      
                      {task.status === 'error' && (
                        <p className="text-xs text-rose-600 mt-1 font-semibold leading-tight">
                          {task.error}
                        </p>
                      )}
                      
                      {task.status === 'success' && (
                        <p className="text-xs text-emerald-600 mt-1 uppercase font-bold tracking-tight">
                          Successfully deployed
                        </p>
                      )}
                    </div>

                    {!isProcessing && task.status !== 'success' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeTask(task.id); }}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <i className="fas fa-trash-alt text-sm"></i>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Guidelines if list is empty */}
          {tasks.length === 0 && (
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-sm text-slate-500 space-y-3">
              <p className="font-bold uppercase text-xs text-slate-400 tracking-widest">Naming Convention Required:</p>
              <code className="block bg-slate-100 p-3 rounded-lg text-slate-600 font-mono text-sm border border-slate-200">
                name-version-linux-arch.ext
              </code>
              <p className="italic font-medium">Example: nginx-v1.2.0-linux-aarch64.tar.gz</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button 
            onClick={onClose}
            disabled={isProcessing}
            className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-30 text-sm"
          >
            Cancel
          </button>
          
          <div className="flex gap-3">
            {tasks.length > 0 && tasks.some(t => t.status === 'pending') && (
              <button 
                onClick={startUpload}
                disabled={isProcessing}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 transition-all disabled:opacity-50 flex items-center gap-2 text-sm"
              >
                {isProcessing ? (
                  <>
                    <i className="fas fa-circle-notch fa-spin"></i>
                    Uploading Queue...
                  </>
                ) : (
                  <>
                    <i className="fas fa-play"></i>
                    Start Uploading ({tasks.filter(t => t.status === 'pending').length})
                  </>
                )}
              </button>
            )}
            
            {tasks.length > 0 && !isProcessing && tasks.every(t => t.status !== 'pending') && (
              <button 
                onClick={onClose}
                className="px-6 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 font-bold transition-all text-sm"
              >
                Finish
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;
