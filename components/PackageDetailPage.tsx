
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PackageMetadata } from '../types';
import { packageService } from '../services/packageService';

const PackageDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [pkg, setPkg] = useState<PackageMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      setLoading(true);
      packageService.getPackageById(id)
        .then(setPkg)
        .catch(() => navigate('/'))
        .finally(() => setLoading(false));
    }
  }, [id, navigate]);

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
            <i className="fas fa-arrow-left"></i>
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              {pkg.name} <span className="text-slate-400 font-normal">{pkg.version}</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">{pkg.id}</p>
          </div>
        </div>
        <button 
          onClick={() => packageService.downloadPackage(pkg.id, pkg.filename)}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all flex items-center gap-2"
        >
          <i className="fas fa-cloud-download-alt"></i>
          Download Full Archive
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            <section className="space-y-3">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-slate-400">Global Specs</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Architecture</span>
                  <span className="font-bold text-slate-800 uppercase">{pkg.arch}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Operating System</span>
                  <span className="font-bold text-slate-800 uppercase">{pkg.system}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">File Count</span>
                  <span className="font-bold text-slate-800">{pkg.fileCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Total Weight</span>
                  <span className="font-bold text-blue-600">{formatSize(pkg.totalSize)}</span>
                </div>
              </div>
            </section>

            <section className="space-y-3 border-t border-slate-100 pt-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-slate-400">Traffic & Health</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Downloads</span>
                  <span className="font-bold text-emerald-600">{pkg.downloadCount}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Uploaded At</span>
                  <span className="text-xs font-medium text-slate-800 font-mono">{formatDate(pkg.uploadDate)}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Last Download</span>
                  <span className="text-xs font-medium text-slate-800 font-mono">{formatDate(pkg.lastDownloadTime)}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Last Verified</span>
                  <span className="text-xs font-medium text-slate-800 font-mono">{formatDate(pkg.lastCheckTime)}</span>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="xl:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Internal File Explorer</h3>
            </div>
            <div className="max-h-[800px] overflow-y-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm border-b border-slate-200">
                  <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <th className="px-6 py-4">File Path</th>
                    <th className="px-6 py-4">Size</th>
                    <th className="px-6 py-4">Pulls</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pkg.files.map((file, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 group">
                      <td className="px-6 py-3">
                        <p className="text-xs font-mono text-slate-700 truncate max-w-xl" title={file.path}>{file.path}</p>
                      </td>
                      <td className="px-6 py-3 text-xs text-slate-500 font-mono">
                        {formatSize(file.size)}
                      </td>
                      <td className="px-6 py-3 text-xs text-slate-400">
                        {file.downloadCount || 0}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button 
                          onClick={() => packageService.downloadFile(pkg.id, file.path)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                          title="Download File"
                        >
                          <i className="fas fa-download"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackageDetailPage;
