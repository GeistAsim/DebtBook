import React, { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useDebt, getInitials } from '../Context/context.jsx';

export const LogForm = () => {
  const { modal, closeModal, debtors, addDebtor, addTransaction } = useDebt();
  const dialogRef = useRef(null);

  // Sync native <dialog> element open/close
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (modal.isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [modal.isOpen]);

  // Handle native ESC or backdrop close
  const handleCancel = () => {
    closeModal();
  };

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-labelledby="modal-title"
      onClose={handleCancel}
    >
      <header className="modal__header">
        <h2 className="modal__title" id="modal-title">
          {modal.type === 'debtor' ? 'Add debtor' : 'New transaction'}
        </h2>
        <button
          className="btn btn--quiet btn--icon"
          type="button"
          aria-label="Close"
          onClick={handleCancel}
        >
          <svg className="icon" aria-hidden="true">
            <use href="/sprite.svg#icon-close" />
          </svg>
        </button>
      </header>

      <div className="modal__body">
        {modal.type === 'debtor' ? (
          <DebtorInnerForm onCancel={handleCancel} onSuccess={addDebtor} onDone={closeModal} />
        ) : (
          <TxnInnerForm
            debtors={debtors}
            defaultDebtorId={modal.debtorId}
            defaultTxnType={modal.txnType}
            onCancel={handleCancel}
            onSuccess={addTransaction}
            onDone={closeModal}
          />
        )}
      </div>
    </dialog>
  );
};

// --- Add Debtor Form ---
const DebtorInnerForm = ({ onCancel, onSuccess, onDone }) => {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: '',
      mobile_no: '',
    },
  });

  const watchedName = watch('name');

  const onSubmit = (data) => {
    onSuccess(data);
    reset();
    onDone();
  };

  return (
    <form className="form debtor-form" noValidate onSubmit={handleSubmit(onSubmit)}>
      <div className="debtor-form__preview">
        <span className="avatar avatar--lg" aria-hidden="true">
          {getInitials(watchedName)}
        </span>
        <p className="text-muted">This is how they'll appear in your list.</p>
      </div>

      <div className="field">
        <label className="field__label" htmlFor="debtor-name">
          Name
        </label>
        <input
          className="input"
          id="debtor-name"
          type="text"
          maxLength={64}
          autoComplete="off"
          placeholder="Ramesh Kumar"
          aria-invalid={errors.name ? 'true' : 'false'}
          {...register('name', {
            required: 'Debtor name is required',
            maxLength: { value: 64, message: 'Name cannot exceed 64 characters' },
          })}
        />
        {errors.name && <p className="field__error">{errors.name.message}</p>}
      </div>

      <div className="field">
        <label className="field__label" htmlFor="debtor-mobile">
          Mobile number <span className="text-muted">(optional)</span>
        </label>
        <input
          className="input"
          id="debtor-mobile"
          type="tel"
          inputMode="tel"
          maxLength={20}
          autoComplete="off"
          placeholder="9876543210"
          aria-describedby="debtor-mobile-hint"
          {...register('mobile_no', {
            maxLength: { value: 20, message: 'Mobile cannot exceed 20 characters' },
          })}
        />
        <p className="field__hint" id="debtor-mobile-hint">
          Helps you tell two people with the same name apart.
        </p>
      </div>

      <div className="form__actions">
        <button className="btn btn--quiet" type="button" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn btn--primary" type="submit" disabled={isSubmitting}>
          Save debtor
        </button>
      </div>
    </form>
  );
};

// --- New Transaction Form ---
const TxnInnerForm = ({
  debtors,
  defaultDebtorId,
  defaultTxnType,
  onCancel,
  onSuccess,
  onDone,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      debtor_id: defaultDebtorId ? String(defaultDebtorId) : (debtors[0]?.id ? String(debtors[0].id) : ''),
      txn_type: defaultTxnType || 'DEBT',
      amount: '',
    },
  });

  const onSubmit = (data) => {
    onSuccess({
      debtor_id: Number(data.debtor_id),
      txn_type: data.txn_type,
      amount: parseFloat(data.amount),
    });
    reset();
    onDone();
  };

  return (
    <form className="form txn-form" noValidate onSubmit={handleSubmit(onSubmit)}>
      {/* Debtor selection (hidden if initiated from single debtor page) */}
      {!defaultDebtorId ? (
        <div className="field">
          <label className="field__label" htmlFor="txn-debtor">
            Debtor
          </label>
          <select
            className="input"
            id="txn-debtor"
            aria-invalid={errors.debtor_id ? 'true' : 'false'}
            {...register('debtor_id', { required: 'Please choose a debtor' })}
          >
            <option value="" disabled>
              Choose a debtor
            </option>
            {debtors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} {d.mobile_no ? `(${d.mobile_no})` : ''}
              </option>
            ))}
          </select>
          {errors.debtor_id && <p className="field__error">{errors.debtor_id.message}</p>}
        </div>
      ) : (
        <input type="hidden" {...register('debtor_id')} value={defaultDebtorId} />
      )}

      {/* Transaction Type selection */}
      <fieldset className="field">
        <legend className="field__label">Type</legend>
        <div className="txn-form__options">
          <label className="txn-form__option">
            <input
              className="visually-hidden"
              type="radio"
              value="DEBT"
              {...register('txn_type')}
            />
            <span className="txn-form__option-label">
              <svg className="icon" aria-hidden="true">
                <use href="/sprite.svg#icon-arrow-up-right" />
              </svg>
              Credit given
            </span>
          </label>
          <label className="txn-form__option">
            <input
              className="visually-hidden"
              type="radio"
              value="PAYMENT"
              {...register('txn_type')}
            />
            <span className="txn-form__option-label">
              <svg className="icon" aria-hidden="true">
                <use href="/sprite.svg#icon-arrow-down-left" />
              </svg>
              Payment received
            </span>
          </label>
        </div>
      </fieldset>

      {/* Amount Input */}
      <div className="field">
        <label className="field__label" htmlFor="txn-amount">
          Amount
        </label>
        <div className="input-group">
          <span className="input-group__addon" aria-hidden="true">
            ₹
          </span>
          <input
            className="input"
            id="txn-amount"
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            aria-invalid={errors.amount ? 'true' : 'false'}
            {...register('amount', {
              required: 'Amount is required',
              min: { value: 0.01, message: 'Amount must be greater than 0' },
            })}
          />
        </div>
        {errors.amount && <p className="field__error">{errors.amount.message}</p>}
      </div>

      <div className="form__actions">
        <button className="btn btn--quiet" type="button" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn btn--primary" type="submit" disabled={isSubmitting}>
          Save transaction
        </button>
      </div>
    </form>
  );
};

export default LogForm;
