
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PackageMetadata, VerificationStatus, PackageFilter, GlobalStats } from '../types.ts';
import { packageService } from '../services/packageService.ts';
import UploadModal from './UploadModal.tsx';

const PackageListPage: React.FC = () => {
  const [packages, setPackages] = useState<PackageMetadata[]>([]);
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<PackageFilter>({ name: '', version: '', arch: 'all', filePath: '' });
  const [showUpload, setShowUpload] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const loadData = useCallback(async (isSearchAction = false) => {
    setIsSearching(true);
    try {
      const [pkgs, statsData] = await Promise.all([
        isSearchAction ? packageService.searchPackages(filter) : packageService.getPackages(),
        packageService.getStatistics()
      ]);
      setPackages(pkgs);
      setStats(statsData);
      setCurrentPage(1); // Reset to first page on new search
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsSearching(false);
    }
  }, [filter]);

  useEffect(() => {
    loadData();
  }, []);

  const handleSearch = () => loadData(true);

  // Derived Pagination Data
  const totalItems = packages.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  
  const paginatedPackages = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return packages.slice(startIndex, startIndex + pageSize);
  }, [packages, currentPage, pageSize]);

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

  const handleVerifySelected = async () => {
    if (selectedIds.size === 0) return;
    setIsVerifying(true);
    try {
      await packageService.verifyPackages(Array.from(selectedIds) as string[]);
      await loadData();
    } catch (error) {
      console.error("Verification failed:", error);
      alert("Verification process failed.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSingleVerify = async (id: string) => {
    setPackages(prev => prev.map(p => p.id === id ? { ...p, verificationStatus: VerificationStatus.VERIFYING } : p));
    try {
      const result = await packageService.verifyPackage(id);
      setPackages(prev => prev.map(p => 
        p.id === id ? { 
          ...p, 
          verificationStatus: result.valid ? VerificationStatus.SUCCESS : VerificationStatus.FAILED,
          lastCheckTime: result.check_time 
        } : p
      ));
    } catch (error) {
      setPackages(prev => prev.map(p => p.id === id ? { ...p, verificationStatus: VerificationStatus.FAILED } : p));
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;
    try {
      await packageService.deletePackage(id);
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      await loadData();
    } catch (error) {
      alert("Failed to delete package.");
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds) as string[];
    if (ids.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${ids.length} selected packages?`)) return;
    
    setIsDeleting(true);
    try {
      await packageService.bulkDelete(ids);
      setSelectedIds(new Set());
      await loadData();
    } catch (error) {
      alert("Bulk delete failed.");
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  return (
    <div className="space-y-6">
      {/* Condensed Statistics Row */}
      {stats && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex flex-wrap lg:flex-nowrap items-center divide-x divide-slate-100 gap-y-4">
          <div className="flex items-center gap-10 px-4 whitespace-nowrap text-center sm:text-left">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Packages</p>
              <p className="text-2xl font-black text-slate-900">{stats.summary.total_packages}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Storage</p>
              <p className="text-2xl font-black text-blue-600">{stats.summary.total_size_human}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Downloads</p>
              <p className="text-2xl font-black text-emerald-600">{stats.summary.total_downloads}</p>
            </div>
          </div>

          <div className="flex-grow px-8">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Architecture Distribution</p>
            <div className="flex flex-wrap gap-2">
              {stats.by_architecture.map(item => (
                <span key={item.architecture} className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-slate-600">
                  {item.architecture}: <span className="text-slate-900">{item.package_count}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="flex-grow px-8">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">OS Distribution</p>
            <div className="flex flex-wrap gap-2">
              {stats.by_system.map(item => (
                <span key={item.system} className="px-2.5 py-1 bg-blue-50/50 border border-blue-100 rounded text-xs font-bold text-blue-600">
                  {item.system}: <span className="text-blue-900">{item.package_count}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Header & Main Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Inventory Management</h1>
          <p className="text-slate-500 text-sm">Deploy and audit static binary archives across platforms.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {selectedIds.size > 0 && (
            <>
              <button 
                onClick={handleBulkDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 font-bold flex items-center gap-2 border border-rose-200 transition-all text-sm"
              >
                {isDeleting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-trash-alt"></i>}
                Delete ({selectedIds.size})
              </button>
              <button 
                onClick={handleVerifySelected} 
                disabled={isVerifying}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold flex items-center gap-2 shadow-sm transition-all text-sm"
              >
                {isVerifying ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-shield-alt"></i>}
                Verify Selected ({selectedIds.size})
              </button>
            </>
          )}
          <button 
            onClick={() => setShowUpload(true)} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold flex items-center gap-2 shadow-sm transition-all text-sm"
          >
            <i className="fas fa-plus"></i> New Package
          </button>
        </div>
      </div>

      {/* One-Line Search Toolbar */}
      <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex flex-wrap lg:flex-nowrap items-center gap-3">
        <div className="flex-grow flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 bg-slate-50/50 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all min-w-[200px]">
          <i className="fas fa-box text-slate-400 text-xs"></i>
          <input 
            type="text" placeholder="Package name..." 
            className="w-full bg-transparent border-none text-sm focus:outline-none"
            value={filter.name} onChange={e => setFilter({ ...filter, name: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
        </div>

        <div className="flex-grow flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 bg-slate-50/50 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all min-w-[200px]">
          <i className="fas fa-file-code text-slate-400 text-xs"></i>
          <input 
            type="text" placeholder="Search by internal file..." 
            className="w-full bg-transparent border-none text-sm focus:outline-none"
            value={filter.filePath} onChange={e => setFilter({ ...filter, filePath: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
        </div>
        
        <div className="flex items-center gap-3 whitespace-nowrap">
          <input 
            type="text" placeholder="Version..." 
            className="w-28 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={filter.version} onChange={e => setFilter({ ...filter, version: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          
          <select 
            className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
            value={filter.arch} onChange={e => setFilter({ ...filter, arch: e.target.value })}
          >
            <option value="all">Any Arch</option>
            <option value="x86_64">x86_64</option>
            <option value="aarch64">aarch64</option>
            <option value="armhf">armhf</option>
            <option value="armel">armel</option>
            <option value="mips">mips</option>
            <option value="ppc64le">ppc64le</option>
          </select>
          
          <button 
            onClick={handleSearch} 
            disabled={isSearching} 
            className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-slate-800 transition-colors flex items-center gap-2"
          >
            {isSearching ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-filter text-xs"></i>}
            Apply
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1400px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-widest">
                <th className="px-6 py-4 w-12 text-center">
                   <input 
                     type="checkbox" 
                     className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                     checked={paginatedPackages.length > 0 && paginatedPackages.every(p => selectedIds.has(p.id))}
                     onChange={e => {
                        const newSelected = new Set(selectedIds);
                        if (e.target.checked) {
                          paginatedPackages.forEach(p => newSelected.add(p.id));
                        } else {
                          paginatedPackages.forEach(p => newSelected.delete(p.id));
                        }
                        setSelectedIds(newSelected);
                     }} 
                   />
                </th>
                <th className="px-6 py-4">Identity</th>
                <th className="px-6 py-4">Architecture</th>
                <th className="px-6 py-4">Files</th>
                <th className="px-6 py-4">Size</th>
                <th className="px-6 py-4">Downloads</th>
                <th className="px-6 py-4">Uploaded At</th>
                <th className="px-6 py-4">Health Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedPackages.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-400 text-sm">No packages matching criteria.</td>
                </tr>
              ) : (
                paginatedPackages.map(pkg => (
                  <tr key={pkg.id} className="hover:bg-slate-50 group transition-colors">
                    <td className="px-6 py-4 text-center align-top pt-6">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                        checked={selectedIds.has(pkg.id)} 
                        onChange={() => toggleSelect(pkg.id)} 
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <Link to={`/package/${pkg.id}`} className="block font-bold text-blue-600 hover:text-blue-800 transition-colors text-base">
                          {pkg.name}
                        </Link>
                        <span className="text-xs text-slate-400 font-mono font-medium">{pkg.version} • {pkg.system}</span>
                        
                        {/* Show matched files if searching by file */}
                        {pkg.matchedFiles && pkg.matchedFiles.length > 0 && (
                          <div className="mt-2 space-y-1.5">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Matched Files ({pkg.matchedFiles.length}):</p>
                            <ul className="space-y-1">
                              {pkg.matchedFiles.slice(0, 3).map((f, i) => (
                                <li key={i} className="text-xs font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded truncate max-w-xs" title={f.path}>
                                  <i className="fas fa-file-code mr-1.5 opacity-50"></i> {f.name}
                                </li>
                              ))}
                              {pkg.matchedFiles.length > 3 && (
                                <li className="text-xs text-slate-400 italic">...and {pkg.matchedFiles.length - 3} more</li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top pt-6">
                      <span className="px-2.5 py-1 bg-slate-100 rounded text-xs font-bold uppercase text-slate-600 border border-slate-200">
                        {pkg.arch}
                      </span>
                    </td>
                    <td className="px-6 py-4 align-top pt-6">
                      <div className="flex items-center gap-2 text-slate-600">
                        <i className="far fa-file-archive text-xs opacity-40"></i>
                        <span className="font-bold text-sm">{pkg.fileCount}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top pt-6 text-slate-600 font-mono text-sm">{formatSize(pkg.totalSize)}</td>
                    <td className="px-6 py-4 align-top pt-6">
                      <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                        <i className="fas fa-download text-xs opacity-40"></i>
                        {pkg.downloadCount || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top pt-6 text-xs text-slate-500 font-mono whitespace-nowrap">
                      {formatDate(pkg.uploadDate)}
                    </td>
                    <td className="px-6 py-4 align-top pt-5">
                      <div className="flex items-center gap-4">
                        {pkg.verificationStatus === VerificationStatus.SUCCESS ? (
                          <i className="fas fa-check-circle text-emerald-500 text-lg"></i>
                        ) : pkg.verificationStatus === VerificationStatus.FAILED ? (
                          <i className="fas fa-times-circle text-rose-500 text-lg"></i>
                        ) : pkg.verificationStatus === VerificationStatus.VERIFYING ? (
                          <i className="fas fa-circle-notch fa-spin text-blue-500 text-lg"></i>
                        ) : (
                          <i className="fas fa-clock text-slate-300 text-lg"></i>
                        )}
                        <div>
                          <p className={`text-xs font-bold uppercase ${pkg.verificationStatus === VerificationStatus.SUCCESS ? 'text-emerald-700' : 'text-slate-500'}`}>
                            {pkg.verificationStatus}
                          </p>
                          <p className="text-xs text-slate-400 font-mono">Audit: {formatDate(pkg.lastCheckTime)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right align-top pt-5">
                      <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => packageService.downloadPackage(pkg.id, pkg.filename)} 
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors" 
                          title="Download"
                        >
                          <i className="fas fa-download text-base"></i>
                        </button>
                        <button 
                          onClick={() => handleSingleVerify(pkg.id)} 
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded transition-colors" 
                          title="Verify"
                        >
                          <i className="fas fa-sync-alt text-base"></i>
                        </button>
                        <button 
                          onClick={() => handleDelete(pkg.id, pkg.name)} 
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded transition-colors" 
                          title="Delete"
                        >
                          <i className="fas fa-trash-alt text-base"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        {totalItems > 0 && (
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
              <div className="flex items-center gap-2">
                <span>Show</span>
                <select 
                  className="bg-white border border-slate-300 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={500}>500</option>
                </select>
                <span>per page</span>
              </div>
              <div className="border-l border-slate-300 h-4 mx-1"></div>
              <span>
                Showing {Math.min(totalItems, (currentPage - 1) * pageSize + 1)} to {Math.min(totalItems, currentPage * pageSize)} of {totalItems} items
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-2 w-10 h-10 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center justify-center"
                title="First Page"
              >
                <i className="fas fa-angle-double-left"></i>
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 w-10 h-10 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center justify-center"
                title="Previous Page"
              >
                <i className="fas fa-angle-left"></i>
              </button>
              
              <div className="flex items-center px-4 font-bold text-sm text-slate-700">
                Page {currentPage} of {totalPages}
              </div>

              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 w-10 h-10 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center justify-center"
                title="Next Page"
              >
                <i className="fas fa-angle-right"></i>
              </button>
              <button 
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2 w-10 h-10 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center justify-center"
                title="Last Page"
              >
                <i className="fas fa-angle-double-right"></i>
              </button>
            </div>
          </div>
        )}
      </div>

      {showUpload && <UploadModal onClose={() => { setShowUpload(false); loadData(); }} />}
    </div>
  );
};

export default PackageListPage;
