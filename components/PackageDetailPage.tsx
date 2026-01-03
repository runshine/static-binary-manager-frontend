
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

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3 text-blue-600">
        <i className="fas fa-spinner fa-spin text-4xl"></i>
        <span>Loading package metadata...</span>
      </div>
    </div>
  );

  if (!pkg) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/" className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
          <i className="fas fa-arrow-left"></i>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{pkg.name} <span className="text-slate-400 font-normal">@{pkg.version}</span></h1>
          <p className="text-sm text-slate-500">ID: {pkg.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
            <h3 className="font-semibold text-slate-800 pb-2 border-b border-slate-100 uppercase text-xs tracking-wider">Metadata</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-500 text-sm">System</span>
                <span className="font-medium text-sm uppercase">{pkg.system}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-sm">Arch</span>
                <span className="font-medium text-sm uppercase">{pkg.arch}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-sm">Original File</span>
                <span className="font-medium text-sm truncate max-w-[200px]" title={pkg.filename}>{pkg.filename}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-sm">Upload Date</span>
                <span className="font-medium text-sm">{pkg.uploadDate ? new Date(pkg.uploadDate).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-600 p-6 rounded-xl shadow-md text-white">
            <h3 className="font-semibold text-white mb-2 uppercase text-xs tracking-wider opacity-80">Storage Fingerprint</h3>
            <code className="bg-blue-700 block p-3 rounded text-xs font-mono break-all border border-blue-500/30">
              {pkg.id}
            </code>
          </div>
        </div>

        <div className="xl:col-span-3 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800 uppercase text-xs tracking-wider">Package Contents ({pkg.files.length} files tracked)</h3>
              <span className="text-xs text-slate-500 italic">Inventory from backend</span>
            </div>
            <div className="max-h-[700px] overflow-y-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider sticky top-0 shadow-sm">
                    <th className="px-6 py-3">Installation Path</th>
                    <th className="px-6 py-3 text-right">Size (bytes)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pkg.files.length > 0 ? pkg.files.map((file, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3 font-mono text-xs text-slate-700">{file.path}</td>
                      <td className="px-6 py-3 text-right text-slate-500 font-mono text-xs">
                        {file.size.toLocaleString()}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={2} className="px-6 py-20 text-center text-slate-400 text-sm italic">
                        <i className="fas fa-search text-3xl mb-4 block opacity-20"></i>
                        No file list available for this package archive.
                      </td>
                    </tr>
                  )}
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
