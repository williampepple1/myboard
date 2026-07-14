'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { AlertCircle, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/'
  const [isLogin, setIsLogin] = useState(searchParams.get('mode') !== 'signup')
  const [needsVerification, setNeedsVerification] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (isLogin) {
        const { error: signInError } = await authClient.signIn.email({
          email,
          password
        })
        if (signInError) {
          if (signInError.code === 'EMAIL_NOT_VERIFIED' || signInError.message?.toLowerCase().includes('not verified')) {
            setNeedsVerification(true)
            return
          }
          throw new Error(signInError.message || 'Failed to sign in')
        }
        window.location.href = redirectTo
      } else {
        if (!name) throw new Error('Name is required for registration')
        const { error: signUpError } = await authClient.signUp.email({
          email,
          password,
          name
        })
        if (signUpError) throw new Error(signUpError.message || 'Failed to sign up')
        
        // When requireEmailVerification is true, better-auth requires them to click the email link
        setNeedsVerification(true)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError('')
    try {
      const absoluteRedirectUrl = `${window.location.origin}${redirectTo.startsWith('/') ? '' : '/'}${redirectTo}`
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: absoluteRedirectUrl
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to authenticate with Google')
      setIsLoading(false)
    }
  }

  const handleResendVerification = async () => {
    setIsResending(true)
    setError('')
    setResendSuccess(false)
    try {
      await authClient.sendVerificationEmail({
        email,
        callbackURL: '/'
      })
      setResendSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to resend verification email')
    } finally {
      setIsResending(false)
    }
  }

  if (needsVerification) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-[400px] bg-white border border-slate-200/80 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.02)] p-10 flex flex-col items-center animate-in zoom-in-95 duration-500">
          
          {/* Brand Logo */}
          <div className="flex flex-col items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-sm">
              M
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800">MyBoard</span>
          </div>

          <div className="text-center w-full mb-8">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Check your email</h1>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              We sent a verification link to <br/>
              <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md text-xs">{email}</span>
            </p>
          </div>

          <div className="w-full p-4 bg-blue-50 border border-blue-100 text-blue-700 rounded-2xl text-sm flex items-start gap-2.5 mb-8">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-blue-600" />
            <span className="font-medium text-xs leading-relaxed">Please click the link in the email to verify your account before logging in.</span>
          </div>

          {error && (
            <div className="w-full mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm flex items-start gap-2.5">
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
              <span className="font-medium text-xs leading-relaxed">{error}</span>
            </div>
          )}

          {resendSuccess && (
            <div className="w-full mb-6 p-4 bg-green-50 border border-green-100 text-green-700 rounded-2xl text-sm flex items-center justify-center gap-2">
              <span className="font-medium text-xs">Verification email resent successfully!</span>
            </div>
          )}

          <div className="text-center w-full flex flex-col gap-3">
            <button
              onClick={handleResendVerification}
              disabled={isResending || resendSuccess}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-3 rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm text-sm"
            >
              {isResending && <Loader2 size={16} className="animate-spin" />}
              <span>{resendSuccess ? 'Email sent' : 'Resend verification email'}</span>
            </button>

            <button
              onClick={() => {
                setNeedsVerification(false)
                setIsLogin(true)
                setError('')
                setResendSuccess(false)
              }}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              Return to login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[400px] bg-white border border-slate-200/80 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.02)] p-10 flex flex-col items-center">
        
        {/* Brand Logo */}
        <div className="flex flex-col items-center justify-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-sm">
            M
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800">MyBoard</span>
        </div>

        {/* Header */}
        <div className="text-center w-full mb-8">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            {isLogin ? 'Welcome to MyBoard' : 'Create an account'}
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            {isLogin ? 'Find new ways to organize your projects.' : 'Sign up to start pinning your tasks.'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="w-full mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm flex items-start gap-2.5">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
            <span className="font-medium text-xs leading-relaxed">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all text-sm text-slate-800 placeholder:text-slate-400 placeholder:font-normal"
                placeholder="Full name"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all text-sm text-slate-800 placeholder:text-slate-400 placeholder:font-normal"
              placeholder="Email address"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all text-sm text-slate-800 placeholder:text-slate-400 placeholder:font-normal"
              placeholder="Create a password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-2xl transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            <span>{isLogin ? 'Log in' : 'Sign up'}</span>
          </button>
        </form>

        <div className="w-full mt-6 flex items-center gap-3 before:h-px before:flex-1 before:bg-slate-200 after:h-px after:flex-1 after:bg-slate-200 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          OR
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="mt-6 w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-3 rounded-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-slate-500">
          {isLogin ? "Not on MyBoard yet?" : "Already have an account?"}{' '}
          <button
            onClick={() => {
              setIsLogin(!isLogin)
              setError('')
            }}
            className="text-blue-600 hover:text-blue-700 font-bold focus:outline-none transition-colors"
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </div>
      </div>
    </div>
  )
}
