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
    <div className="auth-card auth-loading-skeleton">
      <div className="skeleton-spinner-wrap">
        <span className="loading-spinner" aria-hidden="true" />
      </div>
      <div className="skeleton-auth-text">
        <div className="skeleton-box skeleton-w-32" />
        <div className="skeleton-box skeleton-w-48 skeleton-thin" />
      </div>
      <p className="skeleton-auth-hint">Authenticating…</p>
    </div>
  );
};
