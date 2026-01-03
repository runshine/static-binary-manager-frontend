
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PackageMetadata, VerificationStatus, PackageFilter } from '../types';
import { packageService } from '../services/packageService';
import UploadModal from './UploadModal';

const PackageListPage: React.FC = () => {
  const [packages, setPackages] = useState<PackageMetadata[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<PackageFilter>({ name: '', version: '', arch: 'all' });
  const [showUpload, setShowUpload] = useState(false);
  const [isVerifyingAll, setIsVerifyingAll] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const loadPackages = useCallback(async (isSearchAction = false) => {
    setIsSearching(true);
    try {
      const data = isSearchAction 
        ? await packageService.searchPackages(filter)
        : await packageService.getPackages();
      setPackages(data);
    } catch (error) {
      console.error("Failed to load packages:", error);
    } finally {
      setIsSearching(false);
    }
  }, [filter]);

  useEffect(() => {
    loadPackages();
  }, []);

  const handleSearch = async () => {
    await loadPackages(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleVerify = async (id: string) => {
    setPackages(prev => prev.map(p => 
      p.id === id ? { ...p, verificationStatus: VerificationStatus.VERIFYING } : p
    ));

    try {
      const result = await packageService.verifyPackage(id);
      setPackages(prev => prev.map(p => 
        p.id === id ? { ...p, verificationStatus: result ? VerificationStatus.SUCCESS : VerificationStatus.FAILED } : p
      ));
    } catch (error) {
      setPackages(prev => prev.map(p => 
        p.id === id ? { ...p, verificationStatus: VerificationStatus.FAILED } : p
      ));
    }
  };

  const handleVerifyAll = async () => {
    setIsVerifyingAll(true);
    for (const pkg of packages) {
      await handleVerify(pkg.id);
    }
    setIsVerifyingAll(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this package?')) {
      try {
        await packageService.deletePackage(id);
        setPackages(prev => prev.filter(p => p.id !== id));
      } catch (e) {
        alert('Delete failed');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (confirm(`Are you sure you want to delete ${selectedIds.size} packages?`)) {
      try {
        await packageService.bulkDelete(Array.from(selectedIds));
        setSelectedIds(new Set());
        loadPackages();
      } catch (e) {
        alert('Bulk delete failed');
      }
    }
  };

  const handleClearAll = async () => {
    if (confirm('WARNING: This will permanently delete ALL packages and their records. Continue?')) {
      try {
        await packageService.clearAll();
        setPackages([]);
      } catch (e) {
        alert('Failed to clear packages');
      }
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === packages.length && packages.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(packages.map(p => p.id)));
    }
  };

  const getStatusIcon = (status?: VerificationStatus) => {
    switch (status) {
      case VerificationStatus.SUCCESS:
        return <i className="fas fa-check-circle text-emerald-500" title="Valid"></i>;
      case VerificationStatus.FAILED:
        return <i className="fas fa-times-circle text-rose-500" title="Corrupted or Missing"></i>;
      case VerificationStatus.VERIFYING:
        return <i className="fas fa-spinner fa-spin text-blue-500" title="Verifying..."></i>;
      default:
        return <i className="fas fa-clock text-slate-300" title="Pending Verification"></i>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Software Packages</h1>
          <p className="text-slate-500 text-sm">Manage multi-architecture Linux distribution packages.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleVerifyAll}
            disabled={isVerifyingAll || packages.length === 0}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium transition-all flex items-center gap-2"
          >
            <i className="fas fa-shield-alt"></i>
            {isVerifyingAll ? 'Verifying...' : 'Verify All'}
          </button>
          <button 
            onClick={() => setShowUpload(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-all flex items-center gap-2"
          >
            <i className="fas fa-upload"></i>
            Upload Package
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-grow min-w-[200px]">
          <i className="fas fa-box absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input 
            type="text" 
            placeholder="Package name..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={filter.name}
            onChange={e => setFilter({ ...filter, name: e.target.value })}
            onKeyDown={handleKeyDown}
          />
        </div>
        
        <div className="relative w-full md:w-48">
          <i className="fas fa-code-branch absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input 
            type="text" 
            placeholder="Version (e.g. v1.0)..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={filter.version}
            onChange={e => setFilter({ ...filter, version: e.target.value })}
            onKeyDown={handleKeyDown}
          />
        </div>

        <select 
          className="w-full md:w-auto px-4 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          value={filter.arch}
          onChange={e => setFilter({ ...filter, arch: e.target.value })}
        >
          <option value="all">All Architectures</option>
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
          className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-all flex items-center justify-center gap-2"
        >
          {isSearching ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-search"></i>}
          Search
        </button>
        
        <div className="flex items-center gap-2 ml-auto">
          {selectedIds.size > 0 && (
            <button 
              onClick={handleBulkDelete}
              className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              <i className="fas fa-trash-alt"></i>
              Delete ({selectedIds.size})
            </button>
          )}
          <button 
            onClick={handleClearAll}
            className="px-3 py-2 text-slate-400 hover:text-rose-600 transition-colors text-sm font-medium whitespace-nowrap"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
        {isSearching && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <div className="flex items-center gap-3 text-blue-600 font-medium">
              <i className="fas fa-spinner fa-spin text-2xl"></i>
              Syncing with backend...
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm font-semibold uppercase tracking-wider">
                <th className="px-6 py-4 w-12 text-center">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer" 
                    checked={selectedIds.size === packages.length && packages.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-6 py-4">Package Name</th>
                <th className="px-6 py-4">Version</th>
                <th className="px-6 py-4">System</th>
                <th className="px-6 py-4">Architecture</th>
                <th className="px-6 py-4">Upload Date</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {packages.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-20 text-center text-slate-500">
                    <div className="flex flex-col items-center">
                      <i className="fas fa-box-open text-4xl text-slate-200 mb-4"></i>
                      <p>{isSearching ? 'Fetching from API...' : 'No packages found.'}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                packages.map(pkg => (
                  <tr key={pkg.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 text-center">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 text-blue-600 rounded cursor-pointer" 
                        checked={selectedIds.has(pkg.id)}
                        onChange={() => toggleSelect(pkg.id)}
                      />
                    </td>
                    <td className="px-6 py-4 font-medium">
                      <Link to={`/package/${pkg.id}`} className="text-blue-600 hover:underline">
                        {pkg.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{pkg.version}</td>
                    <td className="px-6 py-4 uppercase text-xs font-bold text-slate-400">{pkg.system}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-bold uppercase border border-blue-100">
                        {pkg.arch}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      {pkg.uploadDate ? new Date(pkg.uploadDate).toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-center text-xl">
                      {getStatusIcon(pkg.verificationStatus)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleVerify(pkg.id)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded"
                          title="Verify Now"
                        >
                          <i className="fas fa-sync"></i>
                        </button>
                        <button 
                          onClick={() => handleDelete(pkg.id)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded"
                          title="Delete"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showUpload && <UploadModal onClose={() => { setShowUpload(false); loadPackages(); }} />}
    </div>
  );
};

export default PackageListPage;
