import React, { useState } from 'react';
import { api } from '../api/api.js'
import { worker } from '../utils/worker.js'
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Alert } from './Notification.jsx';
import { useDebt } from '../Context/context.jsx';

export const Login = ({ mode = 'login' }) => {
  const { setToken, setUser } = useDebt();
  const isRegister = mode === 'register';
  const navigate = useNavigate();
  const [authError, setAuthError] = useState(null);


  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data) => {
    setAuthError(null);
    try {

      if (isRegister) {

        // Register new user
        const res = await api.register(data);
        const status = await res.json();

        if (!res.ok) {
          const detailText = Array.isArray(status.detail)
            ? status.detail.map((d) => d.msg || String(d)).join(', ')
            : status.detail || 'Registration failed.';
          throw {
            title: `${res.status} ${res.statusText}`,
            text: detailText,
          };
        }

        navigate('/login');
        return status;
      } else {
        // Login user
        const res = await api.login({ username: data.username, password: data.password });
        const token = await res.json();

        if (!res.ok) {
          const detailText = Array.isArray(token.detail)
            ? token.detail.map((d) => d.msg || String(d)).join(', ')
            : token.detail || 'Incorrect username or password.';
          throw {
            title: `${res.status} ${res.statusText}`,
            text: detailText,
          };
        }

        worker.token_manager({ action: 'store', token: token.access_token });
        setToken(token.access_token);
        setUser({ username: data.username });
        navigate('/');
        return token;
      }
    } catch (err) {
      const formattedErr = err?.title
        ? err
        : {
            title: 'Connection error',
            text: err?.message || 'Could not reach the server.',
          };
      console.error(`${formattedErr.title}: ${formattedErr.text}`);
      setAuthError(formattedErr);
    }
  };


  return (
    <main className="auth-layout">
      <div className="auth-layout__inner">
        <Link className="brand" to="/">
          <span className="brand__mark" aria-hidden="true">
            <svg className="icon">
              <use href="/sprite.svg#icon-book" />
            </svg>
          </span>
          DebtBook
        </Link>

        {authError && (
          <div style={{ width: '100%', marginBottom: 'var(--space-3)' }}>
            <Alert
              title={authError.title}
              text={authError.text}
              onDismiss={() => setAuthError(null)}
            />
          </div>
        )}

        <section className="card auth-layout__card">
          {!isRegister ? (
            // ================= LOGIN FORM =================
            <form className="form auth-form" noValidate onSubmit={handleSubmit(onSubmit)}>
              <div className="auth-form__heading stack">
                <h1>Log in</h1>
                <p className="text-muted">Pick up where your ledger left off.</p>
              </div>

              <div className="field">
                <label className="field__label" htmlFor="login-username">
                  Username
                </label>
                <input
                  className="input"
                  id="login-username"
                  type="text"
                  autoComplete="username"
                  aria-invalid={errors.username ? 'true' : 'false'}
                  {...register('username', { required: 'Username is required' })}
                />
                {errors.username && <p className="field__error">{errors.username.message}</p>}
              </div>

              <div className="field">
                <label className="field__label" htmlFor="login-password">
                  Password
                </label>
                <input
                  className="input"
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={errors.password ? 'true' : 'false'}
                  {...register('password', { required: 'Password is required' })}
                />
                {errors.password && <p className="field__error">{errors.password.message}</p>}
              </div>

              <button
                className="btn btn--primary btn--block"
                type="submit"
                disabled={isSubmitting}
              >
                Log in
              </button>
            </form>
          ) : (
            // ================= REGISTER FORM =================
            <form className="form auth-form" noValidate onSubmit={handleSubmit(onSubmit)}>
              <div className="auth-form__heading stack">
                <h1>Create your account</h1>
                <p className="text-muted">Set up your shop and start tracking credit.</p>
              </div>

              <div className="auth-form__grid">
                <div className="field">
                  <label className="field__label" htmlFor="reg-name">
                    Your name
                  </label>
                  <input
                    className="input"
                    id="reg-name"
                    type="text"
                    maxLength={64}
                    autoComplete="name"
                    aria-invalid={errors.name ? 'true' : 'false'}
                    {...register('name', { required: 'Name is required', maxLength: 64 })}
                  />
                  {errors.name && <p className="field__error">{errors.name.message}</p>}
                </div>

                <div className="field">
                  <label className="field__label" htmlFor="reg-business">
                    Shop name
                  </label>
                  <input
                    className="input"
                    id="reg-business"
                    type="text"
                    maxLength={64}
                    autoComplete="organization"
                    aria-invalid={errors.business_name ? 'true' : 'false'}
                    {...register('business_name', {
                      required: 'Shop name is required',
                      maxLength: 64,
                    })}
                  />
                  {errors.business_name && (
                    <p className="field__error">{errors.business_name.message}</p>
                  )}
                </div>

                <div className="field">
                  <label className="field__label" htmlFor="reg-username">
                    Username
                  </label>
                  <input
                    className="input"
                    id="reg-username"
                    type="text"
                    maxLength={64}
                    autoComplete="username"
                    aria-invalid={errors.username ? 'true' : 'false'}
                    {...register('username', {
                      required: 'Username is required',
                      maxLength: 64,
                    })}
                  />
                  {errors.username && <p className="field__error">{errors.username.message}</p>}
                </div>

                <div className="field">
                  <label className="field__label" htmlFor="reg-mobile">
                    Mobile number
                  </label>
                  <input
                    className="input"
                    id="reg-mobile"
                    type="tel"
                    inputMode="tel"
                    maxLength={20}
                    autoComplete="tel"
                    aria-invalid={errors.mobile_no ? 'true' : 'false'}
                    {...register('mobile_no', {
                      required: 'Mobile number is required',
                      maxLength: 20,
                    })}
                  />
                  {errors.mobile_no && <p className="field__error">{errors.mobile_no.message}</p>}
                </div>

                <div className="field auth-form__wide">
                  <label className="field__label" htmlFor="reg-email">
                    Email
                  </label>
                  <input
                    className="input"
                    id="reg-email"
                    type="email"
                    maxLength={128}
                    autoComplete="email"
                    aria-invalid={errors.email ? 'true' : 'false'}
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Invalid email address',
                      },
                      maxLength: 128,
                    })}
                  />
                  {errors.email && <p className="field__error">{errors.email.message}</p>}
                </div>

                <div className="field auth-form__wide">
                  <label className="field__label" htmlFor="reg-password">
                    Password
                  </label>
                  <input
                    className="input"
                    id="reg-password"
                    type="password"
                    autoComplete="new-password"
                    aria-invalid={errors.password ? 'true' : 'false'}
                    {...register('password', {
                      required: 'Password is required',
                      minLength: { value: 6, message: 'Password must be at least 6 characters' },
                    })}
                  />
                  {errors.password && <p className="field__error">{errors.password.message}</p>}
                </div>
              </div>

              <button
                className="btn btn--primary btn--block"
                type="submit"
                disabled={isSubmitting}
              >
                Create account
              </button>
            </form>
          )}
        </section>

        <p className="text-muted">
          {!isRegister ? (
            <>
              New here? <Link to="/register">Create an account</Link>
            </>
          ) : (
            <>
              Already have an account? <Link to="/login">Log in</Link>
            </>
          )}
        </p>
      </div>
    </main>
  );
};

export default Login;
