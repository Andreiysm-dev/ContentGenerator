/* Skeletons use Ribo brand colors: #0b2641, #385980, #81bad1 */

export const CalendarTableSkeleton = () => {
  return (
    <div className="calendar-table-wrapper calendar-skeleton-wrapper">
      <table className="calendar-table">
        <thead>
          <tr>
            <th className="calendar-col calendar-col--checkbox">
              <div className="skeleton-box skeleton-checkbox" />
            </th>
            <th className="calendar-col calendar-col--primary">Date</th>
            <th className="calendar-col calendar-col--primary calendar-col--theme">Theme / Content</th>
            <th className="calendar-col calendar-col--muted">Brand / Promo</th>
            <th className="calendar-col">Channel / Target</th>
            <th className="calendar-col">Primary / CTA</th>
            <th className="calendar-col calendar-col--status">Status</th>
            <th className="calendar-col calendar-col--actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {[...Array(8)].map((_, i) => (
            <tr key={i} className="skeleton-row">
              <td className="calendar-cell calendar-cell--checkbox">
                <div className="skeleton-box skeleton-checkbox" />
              </td>
              <td className="calendar-cell calendar-cell--primary">
                <div className="skeleton-box skeleton-w-20" />
              </td>
              <td className="calendar-cell calendar-cell--theme">
                <div className="skeleton-stack">
                  <div className="skeleton-box skeleton-w-32" />
                  <div className="skeleton-box skeleton-w-24 skeleton-thin" />
                </div>
              </td>
              <td className="calendar-cell">
                <div className="skeleton-stack">
                  <div className="skeleton-box skeleton-w-36 skeleton-thin" />
                  <div className="skeleton-box skeleton-w-28 skeleton-thin" />
                </div>
              </td>
              <td className="calendar-cell">
                <div className="skeleton-stack">
                  <div className="skeleton-box skeleton-w-24" />
                  <div className="skeleton-box skeleton-w-20 skeleton-thin" />
                </div>
              </td>
              <td className="calendar-cell">
                <div className="skeleton-stack">
                  <div className="skeleton-box skeleton-w-28" />
                  <div className="skeleton-box skeleton-w-16 skeleton-thin" />
                </div>
              </td>
              <td className="calendar-cell calendar-cell--status">
                <div className="skeleton-box skeleton-pill" />
              </td>
              <td className="calendar-cell calendar-cell--actions">
                <div className="skeleton-actions">
                  <div className="skeleton-box skeleton-btn" />
                  <div className="skeleton-box skeleton-btn" />
                  <div className="skeleton-box skeleton-btn" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const TableSkeleton = () => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full calendar-table">
        <thead className="skeleton-thead">
          <tr>
            <th>Date</th>
            <th>Theme</th>
            <th>Type</th>
            <th>Channels</th>
            <th>Status</th>
            <th>Assets</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {[...Array(5)].map((_, i) => (
            <tr key={i} className="skeleton-row">
              <td><div className="skeleton-box skeleton-w-24" /></td>
              <td><div className="skeleton-box skeleton-w-32" /></td>
              <td><div className="skeleton-box skeleton-w-20" /></td>
              <td><div className="skeleton-box skeleton-w-16" /></td>
              <td><div className="skeleton-box skeleton-pill" /></td>
              <td><div className="skeleton-box skeleton-w-16" /></td>
              <td><div className="skeleton-box skeleton-w-24" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const FormSkeleton = () => {
  return (
    <div className="form-skeleton animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="skeleton-form-section">
          <div className="skeleton-section-header" />
          <div className="skeleton-form-grid">
            <div>
              <div className="skeleton-label" />
              <div className="skeleton-input" />
            </div>
            <div>
              <div className="skeleton-label" />
              <div className="skeleton-input" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton = () => {
  return (
    <div className="skeleton-card animate-pulse">
      <div className="skeleton-card-header">
        <div className="skeleton-box skeleton-icon" />
        <div className="skeleton-card-title-group">
          <div className="skeleton-box skeleton-w-48" />
          <div className="skeleton-box skeleton-w-64 skeleton-thin" />
        </div>
      </div>
      <div className="skeleton-card-body">
        <div className="skeleton-input" />
        <div className="skeleton-input" />
        <div className="skeleton-input" />
      </div>
    </div>
  );
};

export const AuthLoadingSkeleton = () => {
  return (
    <div className="fixed inset-0 bg-slate-50 flex items-center justify-center p-6 z-[9999]">
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-gradient-to-br from-[#3fa9f5]/10 to-[#6fb6e8]/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-gradient-to-tr from-[#a78bfa]/10 to-[#e5a4e6]/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '700ms' }} />
      </div>

      <div className="relative bg-white border border-slate-200 shadow-2xl rounded-[2.5rem] p-12 w-full max-w-md flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-slate-900 rounded-3xl flex items-center justify-center shadow-2xl shadow-slate-900/20 relative z-10">
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          </div>
          <div className="absolute inset-0 bg-blue-500/20 rounded-3xl blur-2xl animate-pulse scale-150 -z-10" />
        </div>

        <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest mb-2 font-display">
          Authenticating
        </h2>
        <p className="text-sm font-medium text-slate-400 max-w-[240px]">
          Securing your workspace and preparing your content ecosystem...
        </p>

        <div className="mt-10 flex gap-1.5">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  );
};
