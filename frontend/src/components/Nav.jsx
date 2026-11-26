import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useDebt, getInitials } from '../Context/context.jsx';

export const Sidebar = () => {
  const { user, loaded, logout } = useDebt();
  const navigate = useNavigate();
  const showUserSkeleton = !loaded && !user;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar" aria-label="Main">
      <Link className="brand" to="/">
        <span className="brand__mark" aria-hidden="true">
          <svg className="icon">
            <use href="/sprite.svg#icon-book" />
          </svg>
        </span>
        DebtBook
      </Link>

      <nav className="sidebar__nav">
        <NavLink
          className={({ isActive }) => `sidebar__link ${isActive ? 'active' : ''}`}
          to="/"
          end
        >
          <svg className="icon" aria-hidden="true">
            <use href="/sprite.svg#icon-grid" />
          </svg>
          Dashboard
        </NavLink>
        <NavLink
          className={({ isActive }) => `sidebar__link ${isActive ? 'active' : ''}`}
          to="/debtors"
        >
          <svg className="icon" aria-hidden="true">
            <use href="/sprite.svg#icon-users" />
          </svg>
          Debtors
        </NavLink>
        <NavLink
          className={({ isActive }) => `sidebar__link ${isActive ? 'active' : ''}`}
          to="/transactions"
        >
          <svg className="icon" aria-hidden="true">
            <use href="/sprite.svg#icon-list" />
          </svg>
          Transactions
        </NavLink>
      </nav>

      <div className="sidebar__user">
        <Link
          className="sidebar__who"
          to="/profile"
          aria-label="Your profile"
          aria-busy={showUserSkeleton ? 'true' : undefined}
        >
          {showUserSkeleton ? (
            <>
              <span className="avatar avatar--sm skeleton skeleton--circle" aria-hidden="true" />
              <span
                className="sidebar__username skeleton skeleton--text"
                style={{ width: '5.5rem' }}
                aria-hidden="true"
              />
            </>
          ) : (
            <>
              <span className="avatar avatar--sm" aria-hidden="true">
                {getInitials(user?.name || user?.username)}
              </span>
              <span className="sidebar__username">{user?.username || '-'}</span>
            </>
          )}
        </Link>
        <button
          className="btn danger btn--quiet btn--icon"
          type="button"
          aria-label="Log out"
          onClick={handleLogout}
        >
          <svg className="icon" aria-hidden="true">
            <use href="/sprite.svg#icon-logout" />
          </svg>
        </button>
      </div>
    </aside>
  );
};

export const Topbar = () => {
  const { searchTerm, setSearchTerm, openModal } = useDebt();

  return (
    <header className="topbar">
      <div className="input-group topbar__search">
        <span className="input-group__addon" aria-hidden="true">
          <svg className="icon">
            <use href="/sprite.svg#icon-search" />
          </svg>
        </span>
        <label className="visually-hidden" htmlFor="topbar-search">
          Search debtors
        </label>
        <input
          className="input"
          id="topbar-search"
          type="search"
          placeholder="Search debtors by name or mobile"
          autoComplete="off"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="topbar__actions">
        <button
          className="btn btn--quiet"
          type="button"
          onClick={() => openModal('debtor')}
        >
          <svg className="icon" aria-hidden="true">
            <use href="/sprite.svg#icon-plus" />
          </svg>
          Add debtor
        </button>
        <button
          className="btn btn--primary"
          type="button"
          onClick={() => openModal('transaction')}
        >
          <svg className="icon" aria-hidden="true">
            <use href="/sprite.svg#icon-plus" />
          </svg>
          New transaction
        </button>
      </div>
    </header>
  );
};

export const Nav = ({ children }) => {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Topbar />
        <main className="content">{children}</main>
      </div>
    </div>
  );
};

export default Nav;
