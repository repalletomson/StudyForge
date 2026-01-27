/**
 * Enhanced Login page component
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { FiMail, FiLock, FiEye, FiEyeOff, FiUser, FiShield, FiEye as FiEyeIcon } from 'react-icons/fi';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const LoginPage = () => {
  const { login, isLoggingIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

  const onSubmit = async (data) => {
    try {
      await login(data);
    } catch (error) {
      // Error handling is done in the auth context
    }
  };

  const demoCredentials = [
    { role: 'Admin', email: 'admin@example.com', password: 'admin123', icon: FiShield, color: 'from-red-500 to-red-600' },
    { role: 'Editor', email: 'editor@example.com', password: 'editor123', icon: FiUser, color: 'from-violet-500 to-purple-600' },
    { role: 'Viewer', email: 'viewer@example.com', password: 'viewer123', icon: FiEyeIcon, color: 'from-green-500 to-green-600' }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-violet-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 animate-fade-in">
        {/* Header */}
       <div className="text-center">
          {/* <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 flex items-center justify-center mb-6 shadow-lg shadow-violet-600/20"> */}
            {/* <span className="text-white text-2xl">🎓</span> */}
          {/* </div> */} 
          <h2 className="text-3xl font-bold text-white font-heading">
            StudyForge
          </h2>
          {/* <p className="mt-2 text-slate-400">
            Educational Content Management
          </p> */}
        </div>
        
        {/* Login Form */}
        <div className="card">
        <div className="card-body">
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label htmlFor="email" className="form-label">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className={`form-input pl-10 ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                    placeholder="Enter your username"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Please enter a valid email address'
                      }
                    })}
                  />
                </div>
                {errors.email && (
                  <p className="form-error">{errors.email.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className={`form-input pl-10 pr-10 ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                    placeholder="Enter your password"
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters'
                      }
                    })}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <FiEyeOff className="h-5 w-5 text-slate-400 hover:text-slate-300" />
                    ) : (
                      <FiEye className="h-5 w-5 text-slate-400 hover:text-slate-300" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="form-error">{errors.password.message}</p>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full btn-primary btn-lg"
                >
                  {isLoggingIn ? (
                    <div className="flex items-center justify-center">
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">Signing in...</span>
                    </div>
                  ) : (
                    <>
                      <span className="mr-2">→</span>
                      Sign In
                    </>
                  )}
                </button>
              </div>
              <div className="text-center">
            <p className="text-sm text-slate-400">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="font-medium text-violet-400 hover:text-violet-300 transition-colors"
              >
                ✨ Sign Up
              </Link>
            </p>
          </div>
        </form>
          </div>
        </div>
        
        {/* Demo Credentials */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-slate-100 font-heading">Demo Credentials</h3>
            <p className="text-sm text-slate-400">Use these credentials to explore the system</p>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {demoCredentials.map((cred) => {
                const Icon = cred.icon;
                return (
                  <div
                    key={cred.role}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-700 hover:border-violet-500/50 hover:bg-slate-800/50 transition-all cursor-pointer group"
                    onClick={() => {
                      document.getElementById('email').value = cred.email;
                      document.getElementById('password').value = cred.password;
                    }}
                  >
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${cred.color} flex items-center justify-center mr-3 shadow-lg`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-200 group-hover:text-white">{cred.role}</p>
                        <p className="text-xs text-slate-400">{cred.email}</p>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 group-hover:text-slate-400">
                      {cred.password}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 p-3 bg-violet-500/10 rounded-lg border border-violet-500/20">
              <p className="text-xs text-violet-300">
                <strong>Tip:</strong> Click on any credential above to auto-fill the form
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;