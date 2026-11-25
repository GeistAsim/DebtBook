import React, { useState, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useDebt, formatCurrency, getInitials } from '../Context/context.jsx';
import { EmptyState } from './Notification.jsx';

export const Home = ({ view = 'dashboard' }) => {
  const { id } = useParams();

  switch (view) {
    case 'debtors':
      return <DebtorsView />;
    case 'debtor-detail':
      return <DebtorDetailView debtorId={Number(id)} />;
    case 'transactions':
      return <TransactionsView />;
    case 'profile':
      return <ProfileView />;
    case 'dashboard':
    default:
      return <DashboardView />;
  }
  
};

// ==========================================
// 1. DASHBOARD VIEW
// ==========================================
const DashboardView = () => {
  const { debtors, transactions, dashboardStats } = useDebt();

  // Compute stat metrics from live API data
  const stats = useMemo(() => {
    const computedOutstanding = debtors.reduce((sum, d) => sum + (Number(d.net_balance) || 0), 0);
    const debtorsOwingCount = debtors.filter((d) => (Number(d.net_balance) || 0) > 0).length;

    const creditTxns = transactions.filter((t) => t.txn_type === 'DEBT');
    const paymentTxns = transactions.filter((t) => t.txn_type === 'PAYMENT');

    const computedCredit = creditTxns.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const computedPayments = paymentTxns.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const lastUpdated =
      transactions[0]?.txn_date?.date ||
      debtors[0]?.updated_at?.date ||
      null;

    return {
      totalOutstanding: dashboardStats?.outstanding ?? computedOutstanding,
      debtorsOwingCount,
      totalDebtors: dashboardStats?.debtor_count ?? debtors.length,
      creditThisMonth: dashboardStats?.credit ?? computedCredit,
      creditCount: creditTxns.length,
      paymentsThisMonth: dashboardStats?.payment ?? computedPayments,
      paymentCount: paymentTxns.length,
      lastUpdated,
    };
  }, [debtors, transactions, dashboardStats]);

  return (
    <>
      <div className="page-header">
        <div className="page-header__text stack">
          <h1>Dashboard</h1>
          <p className="text-muted">Who owes you, and what changed recently.</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stats">
        <article className="stat-card stat-card--hero">
          <h2 className="stat-card__label">Total outstanding</h2>
          <p className="figure stat-card__value">{formatCurrency(stats.totalOutstanding)}</p>
          <p className="stat-card__note">
            Across {stats.debtorsOwingCount} debtors
            {stats.lastUpdated ? `, updated ${stats.lastUpdated}` : ''}
          </p>
        </article>

        <article className="stat-card card">
          <h2 className="stat-card__label">Debtors who owe you</h2>
          <p className="figure stat-card__value">{stats.debtorsOwingCount}</p>
          <p className="stat-card__note">of {stats.totalDebtors} people in your book</p>
        </article>

        <article className="stat-card card">
          <h2 className="stat-card__label">Credit given this month</h2>
          <p className="figure stat-card__value">{formatCurrency(stats.creditThisMonth)}</p>
          <p className="stat-card__note">{stats.creditCount} transactions</p>
        </article>

        <article className="stat-card card">
          <h2 className="stat-card__label">Payments received this month</h2>
          <p className="figure stat-card__value">{formatCurrency(stats.paymentsThisMonth)}</p>
          <p className="stat-card__note">{stats.paymentCount} transactions</p>
        </article>
      </div>

      {/* Recent Debtors Table */}
      <DebtorsTableSection limit={5} showViewAll={true} />

      {/* Recent Transactions Table */}
      <TransactionsTableSection limit={6} title="Recent transactions" />
    </>
  );
};

// ==========================================
// 2. DEBTORS VIEW (/debtors)
// ==========================================
const DebtorsView = () => {
  return (
    <>
      <div className="page-header">
        <div className="page-header__text stack">
          <h1>Debtors</h1>
          <p className="text-muted">Everyone who buys from you on credit.</p>
        </div>
      </div>

      <DebtorsTableSection showViewAll={false} />
    </>
  );
};

// ==========================================
// 3. DEBTOR DETAIL VIEW (/debtor/:id)
// ==========================================
const DebtorDetailView = ({ debtorId }) => {
  const { debtors, openModal } = useDebt();
  const debtor = debtors.find((d) => d.id === debtorId);

  if (!debtor) {
    return (
      <EmptyState
        icon="icon-alert"
        title="Debtor Not Found"
        text="The debtor you are looking for does not exist in your records."
        actionLabel="Back to debtors"
        onAction={() => window.history.back()}
      />
    );
  }

  const netBalance = Number(debtor.net_balance) || 0;

  return (
    <>
      {/* Debtor Profile Header Card */}
      <section className="card debtor-profile" aria-label="Debtor summary">
        <div className="debtor-profile__identity">
          <span className="avatar avatar--lg" aria-hidden="true">
            {getInitials(debtor.name)}
          </span>
          <div className="debtor-profile__text stack">
            <h1>{debtor.name}</h1>
            {debtor.mobile_no && (
              <p className="debtor-profile__phone text-muted">
                <svg className="icon" aria-hidden="true">
                  <use href="/sprite.svg#icon-phone" />
                </svg>
                {debtor.mobile_no}
              </p>
            )}
            <p className="text-muted">Added {debtor.created_at?.date || '-'}</p>
          </div>
        </div>

        <div className="debtor-profile__balance">
          <p className="text-muted">Owes you</p>
          {netBalance === 0 ? (
            <p className="figure debtor-profile__amount">
              <span className="badge badge--settled">Settled</span>
            </p>
          ) : (
            <p className="figure debtor-profile__amount">{formatCurrency(netBalance)}</p>
          )}
          <div className="cluster">
            <button
              className="btn btn--primary"
              type="button"
              onClick={() =>
                openModal('transaction', { debtorId: debtor.id, txnType: 'PAYMENT' })
              }
            >
              Record payment
            </button>
            <button
              className="btn btn--quiet"
              type="button"
              onClick={() =>
                openModal('transaction', { debtorId: debtor.id, txnType: 'DEBT' })
              }
            >
              Add credit
            </button>
          </div>
        </div>
      </section>

      {/* Single Debtor Ledger */}
      <TransactionsTableSection debtorId={debtor.id} isSingleDebtor={true} title="Ledger" />
    </>
  );
};

// ==========================================
// 4. TRANSACTIONS VIEW (/transactions)
// ==========================================
const TransactionsView = () => {
  return (
    <>
      <div className="page-header">
        <div className="page-header__text stack">
          <h1>Transactions</h1>
          <p className="text-muted">Every credit given and payment received, newest first.</p>
        </div>
      </div>

      <TransactionsTableSection title="All transactions" />
    </>
  );
};

// ==========================================
// 5. PROFILE VIEW (/profile)
// ==========================================
const ProfileView = () => {
  const { user, logout } = useDebt();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <div className="page-header">
        <div className="page-header__text stack">
          <h1>Profile</h1>
          <p className="text-muted">Your account and shop details.</p>
        </div>
      </div>

      <section className="card user-profile" aria-labelledby="user-profile-name">
        <div className="user-profile__identity">
          <span className="avatar avatar--lg" aria-hidden="true">
            {getInitials(user?.name || user?.username)}
          </span>
          <div className="user-profile__text stack">
            <h2 id="user-profile-name">{user?.name || user?.username || '-'}</h2>
            <p className="text-muted">{user?.business_name || '-'}</p>
          </div>
          <button
            className="btn btn--quiet user-profile__logout"
            type="button"
            onClick={handleLogout}
          >
            <svg className="icon" aria-hidden="true">
              <use href="/sprite.svg#icon-logout" />
            </svg>
            Log out
          </button>
        </div>

        <dl className="user-profile__details">
          <div className="user-profile__item">
            <dt className="text-muted">Username</dt>
            <dd>{user?.username || '-'}</dd>
          </div>
          <div className="user-profile__item">
            <dt className="text-muted">Shop name</dt>
            <dd>{user?.business_name || '-'}</dd>
          </div>
          <div className="user-profile__item">
            <dt className="text-muted">Mobile number</dt>
            <dd>{user?.mobile_no || '-'}</dd>
          </div>
          <div className="user-profile__item">
            <dt className="text-muted">Email</dt>
            <dd>{user?.email || '-'}</dd>
          </div>
          <div className="user-profile__item">
            <dt className="text-muted">Using DebtBook since</dt>
            <dd>{user?.created_at?.date || '-'}</dd>
          </div>
        </dl>
      </section>
    </>
  );
};

// ==========================================
// REUSABLE SUBCOMPONENTS: DEBTORS TABLE
// ==========================================
const DebtorsTableSection = ({ limit, showViewAll = false }) => {
  const { debtors, searchTerm, openModal } = useDebt();

  // Search filter
  const filtered = useMemo(() => {
    let list = debtors;
    if (searchTerm && searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          (d.mobile_no && d.mobile_no.toLowerCase().includes(q))
      );
    }
    return limit ? list.slice(0, limit) : list;
  }, [debtors, searchTerm, limit]);

  if (debtors.length === 0) {
    return (
      <EmptyState
        icon="icon-inbox"
        title="No debtors yet"
        text="Add the first person who buys from you on credit. Their balance and history will appear here."
        actionLabel="Add debtor"
        onAction={() => openModal('debtor')}
      />
    );
  }

  return (
    <section className="card debtor-table" aria-labelledby="debtor-table-title">
      <header className="card__header">
        <h2 className="card__title" id="debtor-table-title">
          Debtors
        </h2>
        {showViewAll && (
          <Link className="btn btn--quiet" to="/debtors">
            View all
          </Link>
        )}
      </header>

      <div className="table-wrap">
        <table className="table">
          <caption className="visually-hidden">
            Debtors and the balance each one owes you
          </caption>
          <thead>
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
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-muted" style={{ textAlign: 'center', padding: 'var(--space-5)' }}>
                  No debtors match "{searchTerm}".
                </td>
              </tr>
            ) : (
              filtered.map((debtor) => {
                const bal = Number(debtor.net_balance) || 0;
                return (
                  <tr key={debtor.id}>
                    <td>
                      <Link className="debtor-table__person" to={`/debtor/${debtor.id}`}>
                        <span className="avatar avatar--sm" aria-hidden="true">
                          {getInitials(debtor.name)}
                        </span>
                        {debtor.name}
                      </Link>
                    </td>
                    <td data-col="mobile" className={debtor.mobile_no ? '' : 'text-muted'}>
                      {debtor.mobile_no || 'Not added'}
                    </td>
                    <td data-col="activity">
                      {debtor.updated_at?.date || debtor.created_at?.date}{' '}
                      <span className="table__sub">
                        {debtor.updated_at?.time || debtor.created_at?.time}
                      </span>
                    </td>
                    <td className="num">
                      {bal === 0 ? (
                        <span className="badge badge--settled">Settled</span>
                      ) : (
                        <span className="amount">{formatCurrency(bal)}</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

// ==========================================
// REUSABLE SUBCOMPONENTS: TRANSACTIONS TABLE
// ==========================================
const TransactionsTableSection = ({
  limit,
  debtorId = null,
  isSingleDebtor = false,
  title = 'Recent transactions',
}) => {
  const { transactions, debtors, openModal } = useDebt();
  const [selectedDebtorFilter, setSelectedDebtorFilter] = useState(
    debtorId ? String(debtorId) : ''
  );

  // Map debtor IDs to names for quick lookup
  const debtorMap = useMemo(() => {
    const map = new Map();
    debtors.forEach((d) => map.set(d.id, d.name));
    return map;
  }, [debtors]);

  // Filter transactions
  const displayedTxns = useMemo(() => {
    let list = transactions;

    if (debtorId) {
      list = list.filter((t) => t.debtor_id === debtorId);
    } else if (selectedDebtorFilter) {
      const targetId = Number(selectedDebtorFilter);
      list = list.filter((t) => t.debtor_id === targetId);
    }

    return limit ? list.slice(0, limit) : list;
  }, [transactions, debtorId, selectedDebtorFilter, limit]);

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon="icon-inbox"
        title="No transactions yet"
        text="Add credit or record a payment to start this ledger."
        actionLabel="New transaction"
        onAction={() => openModal('transaction')}
      />
    );
  }

  return (
    <section
      className={`card txn-table ${isSingleDebtor ? 'txn-table--single-debtor' : ''}`}
      aria-labelledby="txn-table-title"
    >
      <header className="card__header">
        <h2 className="card__title" id="txn-table-title">
          {title}
        </h2>

        {!isSingleDebtor && (
          <div className="txn-table__filter">
            <label className="visually-hidden" htmlFor="txn-filter">
              Show transactions for
            </label>
            <select
              className="input"
              id="txn-filter"
              name="debtor_id"
              value={selectedDebtorFilter}
              onChange={(e) => setSelectedDebtorFilter(e.target.value)}
            >
              <option value="">All debtors</option>
              {debtors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </header>

      <div className="table-wrap">
        <table className="table">
          <caption className="visually-hidden">
            Credit given and payments received, newest first
          </caption>
          <thead>
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
          </thead>
          <tbody>
            {displayedTxns.length === 0 ? (
              <tr>
                <td
                  colSpan={isSingleDebtor ? 4 : 5}
                  className="text-muted"
                  style={{ textAlign: 'center', padding: 'var(--space-5)' }}
                >
                  No transactions recorded for this debtor yet.
                </td>
              </tr>
            ) : (
              displayedTxns.map((txn) => {
                const isDebt = txn.txn_type === 'DEBT';
                return (
                  <tr key={txn.id} data-debtor={txn.debtor_id}>
                    <td>
                      {txn.txn_date?.date}{' '}
                      <span className="table__sub">{txn.txn_date?.time}</span>
                    </td>
                    {!isSingleDebtor && (
                      <td data-col="debtor">
                        <Link to={`/debtor/${txn.debtor_id}`}>
                          {debtorMap.get(txn.debtor_id) || `Debtor #${txn.debtor_id}`}
                        </Link>
                      </td>
                    )}
                    <td>
                      {isDebt ? (
                        <span className="badge badge--debt">
                          <svg className="icon" aria-hidden="true">
                            <use href="/sprite.svg#icon-arrow-up-right" />
                          </svg>
                          Credit given
                        </span>
                      ) : (
                        <span className="badge badge--payment">
                          <svg className="icon" aria-hidden="true">
                            <use href="/sprite.svg#icon-arrow-down-left" />
                          </svg>
                          Payment received
                        </span>
                      )}
                    </td>
                    <td className="num">
                      <span className="amount">{formatCurrency(txn.amount)}</span>
                    </td>
                    <td className="num txn-table__balance">
                      {formatCurrency(txn.new_balance)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default Home;
