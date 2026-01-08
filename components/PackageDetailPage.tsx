
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PackageMetadata, FileEntry } from '../types.ts';
import { packageService } from '../services/packageService.ts';

const PackageDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [pkg, setPkg] = useState<PackageMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Pagination State for Files
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (id) {
      setLoading(true);
      packageService.getPackageById(id)
        .then(setPkg)
        .catch(() => navigate('/'))
        .finally(() => setLoading(false));
    }
  }, [id, navigate]);

  const totalFiles = pkg?.files?.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalFiles / pageSize));

  const paginatedFiles = useMemo(() => {
    if (!pkg?.files) return [];
    const startIndex = (currentPage - 1) * pageSize;
    return pkg.files.slice(startIndex, startIndex + pageSize);
  }, [pkg?.files, currentPage, pageSize]);

  const handlePageChange = useCallback((page: number) => {
    setIsRefreshing(true);
    setCurrentPage(page);
    // Simulate content refresh feel
    setTimeout(() => {
      setIsRefreshing(false);
      const explorer = document.getElementById('file-explorer-header');
      if (explorer) explorer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setIsRefreshing(true);
    setPageSize(size);
    setCurrentPage(1);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 150);
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-blue-600">
      <i className="fas fa-spinner fa-spin text-4xl"></i>
    </div>
  );

  if (!pkg) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
            <i className="fas fa-arrow-left text-lg"></i>
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              {pkg.name} <span className="text-slate-400 font-normal">{pkg.version}</span>
            </h1>
            <p className="text-xs text-slate-400 font-mono uppercase tracking-widest">{pkg.id}</p>
          </div>
        </div>
        <button 
          onClick={() => packageService.downloadPackage(pkg.id, pkg.filename)}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all flex items-center gap-2 text-sm"
        >
          <i className="fas fa-cloud-download-alt"></i>
          Download Full Archive
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-8">
            <section className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Global Specs</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Architecture</span>
                  <span className="font-bold text-slate-800 uppercase">{pkg.arch}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Operating System</span>
                  <span className="font-bold text-slate-800 uppercase">{pkg.system}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Total Files</span>
                  <span className="font-bold text-slate-800">{pkg.fileCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Total Weight</span>
                  <span className="font-bold text-blue-600">{formatSize(pkg.totalSize)}</span>
                </div>
              </div>
            </section>

            <section className="space-y-4 border-t border-slate-100 pt-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Traffic & Health</h3>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Downloads</span>
                  <span className="font-bold text-emerald-600">{pkg.downloadCount}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-slate-500 text-xs uppercase font-bold">Uploaded At</span>
                  <span className="text-sm font-medium text-slate-800 font-mono">{formatDate(pkg.uploadDate)}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-slate-500 text-xs uppercase font-bold">Last Download</span>
                  <span className="text-sm font-medium text-slate-800 font-mono">{formatDate(pkg.lastDownloadTime)}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-slate-500 text-xs uppercase font-bold">Last Verified</span>
                  <span className="text-sm font-medium text-slate-800 font-mono">{formatDate(pkg.lastCheckTime)}</span>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="xl:col-span-3 space-y-4">
          <div id="file-explorer-header" className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Internal File Explorer</h3>
                <p className="text-xs text-slate-400 mt-1 font-medium">Managing {totalFiles} files in this distribution</p>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400 uppercase">Page Size</span>
                <select 
                  className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                >
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={250}>250</option>
                  <option value={500}>500</option>
                  <option value={1000}>1000</option>
                  <option value={5000}>5000</option>
                </select>
              </div>
            </div>

            <div className="relative overflow-hidden">
              {isRefreshing && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-20 flex items-center justify-center animate-in fade-in duration-200">
                  <i className="fas fa-circle-notch fa-spin text-2xl text-blue-600"></i>
                </div>
              )}
              
              <div className="max-h-[800px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm border-b border-slate-200">
                    <tr className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      <th className="px-6 py-4">File Path</th>
                      <th className="px-6 py-4">Size</th>
                      <th className="px-6 py-4">Pulls</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedFiles.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-20 text-center">
                          <p className="text-slate-400 text-sm italic">No files available in this archive range.</p>
                        </td>
                      </tr>
                    ) : (
                      paginatedFiles.map((file, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 group transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-sm font-mono text-slate-700 truncate max-w-xl" title={file.path || file.file_path}>
                              {file.path || file.file_path}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                            {formatSize(file.size || file.file_size || 0)}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-400 font-medium">
                            {file.downloadCount || 0}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => packageService.downloadFile(pkg.id, file.path || file.file_path || '')}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                              title="Download File"
                            >
                              <i className="fas fa-download text-base"></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls */}
            {totalFiles > pageSize && (
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Showing {Math.min(totalFiles, (currentPage - 1) * pageSize + 1)} - {Math.min(totalFiles, currentPage * pageSize)} of {totalFiles} entries
                </div>
                
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1 || isRefreshing}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-all"
                  >
                    <i className="fas fa-angle-double-left text-xs"></i>
                  </button>
                  <button 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || isRefreshing}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-all"
                  >
                    <i className="fas fa-angle-left text-xs"></i>
                  </button>
                  
                  <div className="px-3 text-sm font-bold text-slate-700">
                    {currentPage} / {totalPages}
                  </div>

                  <button 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || isRefreshing}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-all"
                  >
                    <i className="fas fa-angle-right text-xs"></i>
                  </button>
                  <button 
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages || isRefreshing}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-all"
                  >
                    <i className="fas fa-angle-double-right text-xs"></i>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackageDetailPage;
