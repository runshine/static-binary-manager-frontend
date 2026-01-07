
import React from 'react';
import { PackageMetadata } from '../types.ts';

interface DeleteConfirmModalProps {
  packages: PackageMetadata[];
  isProcessing: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ packages, isProcessing, onConfirm, onClose }) => {
  if (packages.length === 0) return null;

  const isBulk = packages.length > 1;
  const totalSize = packages.reduce((acc, pkg) => acc + pkg.totalSize, 0);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-rose-50/50">
          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 flex-shrink-0">
            <i className="fas fa-exclamation-triangle text-xl"></i>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Confirm Deletion</h2>
            <p className="text-sm text-slate-500 font-medium">This action cannot be undone.</p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {isBulk ? (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Bulk Selection Summary</span>
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded text-xs font-bold uppercase">Destructive</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Total Items</p>
                    <p className="text-lg font-black text-slate-800">{packages.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Total Volume</p>
                    <p className="text-lg font-black text-rose-600">{formatSize(totalSize)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Items to be removed:</p>
                {packages.map((pkg) => (
                  <div key={pkg.id} className="flex items-center justify-between p-2.5 bg-white border border-slate-100 rounded-lg hover:border-rose-200 transition-colors">
                    <div className="flex flex-col truncate pr-4">
                      <span className="text-sm font-bold text-slate-700 truncate">{pkg.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono font-medium">{pkg.version} • {pkg.arch}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 flex-shrink-0">{formatSize(pkg.totalSize)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col items-center text-center p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-3 text-blue-600">
                  <i className="fas fa-box-open text-3xl"></i>
                </div>
                <h3 className="text-lg font-bold text-slate-800">{packages[0].name}</h3>
                <p className="text-xs text-slate-400 font-mono font-bold tracking-widest mt-1 uppercase">
                  {packages[0].version} • {packages[0].arch}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-slate-100 p-3 rounded-xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Architecture</p>
                  <p className="text-sm font-bold text-slate-700 uppercase">{packages[0].arch}</p>
                </div>
                <div className="bg-white border border-slate-100 p-3 rounded-xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Archive Size</p>
                  <p className="text-sm font-bold text-slate-700">{formatSize(packages[0].totalSize)}</p>
                </div>
                <div className="bg-white border border-slate-100 p-3 rounded-xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">File Count</p>
                  <p className="text-sm font-bold text-slate-700">{packages[0].fileCount} Files</p>
                </div>
                <div className="bg-white border border-slate-100 p-3 rounded-xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pulls</p>
                  <p className="text-sm font-bold text-slate-700">{packages[0].downloadCount} Downloads</p>
                </div>
              </div>
            </div>
          )}
          
          <p className="text-sm text-slate-500 bg-rose-50 p-4 rounded-xl border border-rose-100 leading-relaxed">
            <i className="fas fa-info-circle mr-2 text-rose-400"></i>
            Removing these items will permanently delete the binary archives and all associated metadata from the centralized storage system.
          </p>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className="flex-1 px-6 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Processing...
              </>
            ) : (
              <>
                <i className="fas fa-trash-alt"></i>
                Delete {isBulk ? 'Items' : 'Package'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
