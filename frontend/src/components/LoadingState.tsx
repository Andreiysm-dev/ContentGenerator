export const TableSkeleton = () => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Date</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Theme</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Type</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Channels</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Assets</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {[...Array(5)].map((_, i) => (
            <tr key={i} className="animate-pulse">
              <td className="px-4 py-3">
                <div className="h-4 bg-slate-200 rounded w-24"></div>
              </td>
              <td className="px-4 py-3">
                <div className="h-4 bg-slate-200 rounded w-32 mb-2"></div>
                <div className="h-3 bg-slate-100 rounded w-48"></div>
              </td>
              <td className="px-4 py-3">
                <div className="h-4 bg-slate-200 rounded w-20"></div>
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  <div className="h-6 bg-slate-200 rounded w-16"></div>
                  <div className="h-6 bg-slate-200 rounded w-16"></div>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="h-7 bg-slate-200 rounded-full w-24"></div>
              </td>
              <td className="px-4 py-3">
                <div className="h-4 bg-slate-200 rounded w-16"></div>
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1">
                  <div className="h-8 w-8 bg-slate-200 rounded-lg"></div>
                  <div className="h-8 w-8 bg-slate-200 rounded-lg"></div>
                  <div className="h-8 w-8 bg-slate-200 rounded-lg"></div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const FormSkeleton = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-slate-50">
            <div className="h-5 bg-slate-200 rounded w-32"></div>
          </div>
          <div className="p-4 bg-white grid grid-cols-2 gap-4">
            <div>
              <div className="h-3 bg-slate-200 rounded w-16 mb-2"></div>
              <div className="h-10 bg-slate-100 rounded-lg"></div>
            </div>
            <div>
              <div className="h-3 bg-slate-200 rounded w-20 mb-2"></div>
              <div className="h-10 bg-slate-100 rounded-lg"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-slate-200 rounded-lg"></div>
        <div className="flex-1">
          <div className="h-5 bg-slate-200 rounded w-48 mb-2"></div>
          <div className="h-3 bg-slate-100 rounded w-64"></div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-10 bg-slate-100 rounded-lg"></div>
        <div className="h-10 bg-slate-100 rounded-lg"></div>
        <div className="h-10 bg-slate-100 rounded-lg"></div>
      </div>
    </div>
  );
};
