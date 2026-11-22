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

const Notification = { Alert, EmptyState };
export default Notification;
