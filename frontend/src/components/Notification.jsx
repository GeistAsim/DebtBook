import React from 'react';

export const Alert = ({ title, text, onRetry, onDismiss }) => {
  return (
    <div className="alert" role="alert">
      <svg className="icon alert__icon" aria-hidden="true">
        <use href="/sprite.svg#icon-alert" />
      </svg>
      <div className="alert__body stack">
        <p className="alert__title">{title}</p>
        <p className="text-muted">{text}</p>
      </div>
      {onRetry && (
        <button className="btn btn--quiet" type="button" onClick={onRetry}>
          Try again
        </button>
      )}
      {onDismiss && (
        <button className="btn btn--quiet btn--icon" type="button" aria-label="Dismiss" onClick={onDismiss}>
          <svg className="icon" aria-hidden="true">
            <use href="/sprite.svg#icon-close" />
          </svg>
        </button>
      )}
    </div>
  );
};

export const EmptyState = ({
  icon = 'icon-inbox',
  title = 'No items yet',
  text = 'Get started by creating your first entry.',
  actionLabel,
  onAction,
}) => {
  return (
    <section className="empty-state card">
      <span className="empty-state__icon" aria-hidden="true">
        <svg className="icon">
          <use href={`/sprite.svg#${icon}`} />
        </svg>
      </span>
      <h2 className="empty-state__title">{title}</h2>
      <p className="empty-state__text text-muted">{text}</p>
      {actionLabel && onAction && (
        <button className="btn btn--primary" type="button" onClick={onAction}>
          <svg className="icon" aria-hidden="true">
            <use href="/sprite.svg#icon-plus" />
          </svg>
          {actionLabel}
        </button>
      )}
    </section>
  );
};

const NAME_WIDTHS = ['7.5rem', '9rem', '6.5rem', '8.25rem', '7rem', '8.75rem'];

export const StatCardsSkeleton = () => (
  <div className="stats" aria-busy="true" aria-label="Loading summary metrics">
    <article className="stat-card stat-card--hero">
      <span className="stat-card__label skeleton skeleton--hero skeleton--text" style={{ width: '44%' }} />
      <span className="stat-card__value skeleton skeleton--hero skeleton--hero-figure" />
      <span className="stat-card__note skeleton skeleton--hero skeleton--text" style={{ width: '68%' }} />
    </article>
    {[1, 2, 3].map((item) => (
      <article className="stat-card card" key={item}>
        <span className="stat-card__label skeleton skeleton--text" style={{ width: '56%' }} />
        <span className="stat-card__value skeleton skeleton--figure" />
        <span className="stat-card__note skeleton skeleton--text" style={{ width: '50%' }} />
      </article>
    ))}
  </div>
);

export const TableSkeletonRows = ({
  variant = 'debtors',
  rows = 5,
  isSingleDebtor = false,
}) => {
  return Array.from({ length: rows }, (_, idx) => {
    const nameWidth = NAME_WIDTHS[idx % NAME_WIDTHS.length];

    if (variant === 'debtors') {
      return (
        <tr key={idx} aria-hidden="true">
          <td>
            <div className="skeleton-row-identity">
              <span className="avatar avatar--sm skeleton skeleton--circle" />
              <span className="skeleton skeleton--text" style={{ width: nameWidth }} />
            </div>
          </td>
          <td data-col="mobile">
            <span className="skeleton skeleton--text" style={{ width: '6.5rem' }} />
          </td>
          <td data-col="activity">
            <div className="skeleton-stack">
              <span className="skeleton skeleton--text" style={{ width: '5.25rem' }} />
              <span className="skeleton skeleton--text-xs" style={{ width: '3.5rem' }} />
            </div>
          </td>
          <td className="num">
            <span
              className="skeleton skeleton--text"
              style={{ width: '4.75rem', marginLeft: 'auto' }}
            />
          </td>
        </tr>
      );
    }

    return (
      <tr key={idx} aria-hidden="true">
        <td>
          <div className="skeleton-stack">
            <span className="skeleton skeleton--text" style={{ width: '5.25rem' }} />
            <span className="skeleton skeleton--text-xs" style={{ width: '3.5rem' }} />
          </div>
        </td>
        {!isSingleDebtor && (
          <td data-col="debtor">
            <span className="skeleton skeleton--text" style={{ width: nameWidth }} />
          </td>
        )}
        <td>
          <span className="skeleton skeleton--pill" />
        </td>
        <td className="num">
          <span
            className="skeleton skeleton--text"
            style={{ width: '4.75rem', marginLeft: 'auto' }}
          />
        </td>
        <td className="num">
          <span
            className="skeleton skeleton--text"
            style={{ width: '5rem', marginLeft: 'auto' }}
          />
        </td>
      </tr>
    );
  });
};

export const TableSkeleton = ({
  variant = 'debtors',
  rows = 5,
  title = 'Loading',
  showAction = false,
  showFilter = false,
  isSingleDebtor = false,
}) => {
  const isDebtors = variant === 'debtors';
  const sectionClass = isDebtors
    ? 'card debtor-table'
    : `card txn-table ${isSingleDebtor ? 'txn-table--single-debtor' : ''}`;

  return (
    <section className={sectionClass} aria-busy="true" aria-label={`Loading ${title.toLowerCase()}`}>
      <header className="card__header">
        <h2 className="card__title">{title}</h2>
        {showAction && <span className="skeleton skeleton--btn" aria-hidden="true" />}
        {showFilter && (
          <div className="txn-table__filter" aria-hidden="true">
            <span className="skeleton skeleton--select" />
          </div>
        )}
      </header>

      <div className="table-wrap">
        <table className="table">
          <thead>
            {isDebtors ? (
              <tr>
                <th scope="col">Debtor</th>
                <th scope="col" data-col="mobile">
                  Mobile
                </th>
                <th scope="col" data-col="activity">
                  Last activity
                </th>
                <th scope="col" className="num">
                  Balance
                </th>
              </tr>
            ) : (
              <tr>
                <th scope="col">Date</th>
                {!isSingleDebtor && (
                  <th scope="col" data-col="debtor">
                    Debtor
                  </th>
                )}
                <th scope="col">Type</th>
                <th scope="col" className="num">
                  Amount
                </th>
                <th scope="col" className="num">
                  Balance after
                </th>
              </tr>
            )}
          </thead>
          <tbody>
            <TableSkeletonRows
              variant={variant}
              rows={rows}
              isSingleDebtor={isSingleDebtor}
            />
          </tbody>
        </table>
      </div>
    </section>
  );
};

export const DebtorProfileSkeleton = () => (
  <section className="card debtor-profile" aria-busy="true" aria-label="Loading debtor summary">
    <div className="debtor-profile__identity">
      <span className="avatar avatar--lg skeleton skeleton--circle" aria-hidden="true" />
      <div className="debtor-profile__text stack" style={{ width: '100%', maxWidth: '15rem' }}>
        <span className="skeleton skeleton--title" style={{ width: '11rem', height: '2rem' }} />
        <span className="skeleton skeleton--text" style={{ width: '8rem' }} />
        <span className="skeleton skeleton--text" style={{ width: '9.5rem' }} />
      </div>
    </div>

    <div className="debtor-profile__balance">
      <span className="skeleton skeleton--text" style={{ width: '4.5rem' }} />
      <span
        className="skeleton skeleton--figure"
        style={{ width: '8.5rem', marginBlock: 'var(--space-1)' }}
      />
      <div className="cluster">
        <span className="skeleton skeleton--btn" style={{ width: '8.75rem' }} />
        <span className="skeleton skeleton--btn" style={{ width: '6.75rem' }} />
      </div>
    </div>
  </section>
);

export const UserProfileSkeleton = () => (
  <section className="card user-profile" aria-busy="true" aria-label="Loading user profile">
    <div className="user-profile__identity">
      <span className="avatar avatar--lg skeleton skeleton--circle" aria-hidden="true" />
      <div className="user-profile__text stack" style={{ flex: 1 }}>
        <span className="skeleton skeleton--title" style={{ width: '11rem' }} />
        <span className="skeleton skeleton--text" style={{ width: '8rem' }} />
      </div>
      <span className="skeleton skeleton--btn user-profile__logout" style={{ width: '6.25rem' }} />
    </div>

    <dl className="user-profile__details">
      {['Username', 'Shop name', 'Mobile number', 'Email', 'Using DebtBook since'].map((label) => (
        <div className="user-profile__item" key={label}>
          <dt className="text-muted">{label}</dt>
          <dd>
            <span className="skeleton skeleton--text" style={{ width: '9.5rem' }} />
          </dd>
        </div>
      ))}
    </dl>
  </section>
);

const Notification = {
  Alert,
  EmptyState,
  StatCardsSkeleton,
  TableSkeletonRows,
  TableSkeleton,
  DebtorProfileSkeleton,
  UserProfileSkeleton,
};
export default Notification;
