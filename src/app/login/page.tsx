'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { AlertCircle, Loader2, KeyRound } from 'lucide-react'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/'
  const [isLogin, setIsLogin] = useState(true)
  const [needsVerification, setNeedsVerification] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    
    try {
      const { error: verifyError } = await authClient.emailOtp.verifyEmail({
        email,
        otp
      })
      if (verifyError) throw new Error(verifyError.message || 'Invalid verification code')
      
      // After verifying, we need to sign in
      const { error: signInError } = await authClient.signIn.email({
        email,
        password
      })
      if (signInError) throw new Error(signInError.message || 'Failed to sign in after verification')
      
      window.location.href = redirectTo
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const resendOtp = async () => {
    setError('')
    setSuccessMsg('')
    setIsLoading(true)
    try {
      const { error: resendError } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: 'email-verification'
      })
      if (resendError) throw new Error(resendError.message || 'Failed to resend code')
      setSuccessMsg('Verification code sent to your email!')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to resend verification code')
    } finally {
      setIsLoading(false)
    }
  }

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
          console.log('Sign in error:', signInError);
          if (signInError.code === 'EMAIL_NOT_VERIFIED' || signInError.message?.toLowerCase().includes('verification') || signInError.message?.toLowerCase().includes('not verified')) {
            // Automatically send the verification OTP
            await authClient.emailOtp.sendVerificationOtp({
              email,
              type: 'email-verification'
            })
            setNeedsVerification(true)
            setSuccessMsg('Verification code sent to your email!')
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
        
        // Registration success. Transition to verification UI.
        setNeedsVerification(true)
        setSuccessMsg('Please check your email for the verification code.')
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err)
      
      if (errMsg.toLowerCase().includes('verification') || errMsg.toLowerCase().includes('not verified')) {
        // Automatically send the verification OTP
        await authClient.emailOtp.sendVerificationOtp({
          email,
          type: 'email-verification'
        }).catch(console.error)
        setNeedsVerification(true)
        setSuccessMsg('Verification code sent to your email!')
        setError('')
      } else {
        setError(errMsg || 'An unexpected error occurred')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError('')
    try {
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: redirectTo
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to authenticate with Google')
      setIsLoading(false)
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
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Verify your email</h1>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              We sent a verification code to <br/>
              <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md text-xs">{email}</span>
            </p>
          </div>

          {error && (
            <div className="w-full mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm flex items-start gap-2.5">
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
              <span className="font-medium text-xs leading-relaxed">{error}</span>
            </div>
          )}
          
          {successMsg && (
            <div className="w-full mb-6 p-4 bg-green-50 border border-green-100 text-green-700 rounded-2xl text-sm flex items-start gap-2.5">
              <KeyRound size={18} className="mt-0.5 shrink-0 text-green-600" />
              <span className="font-medium text-xs leading-relaxed">{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleVerificationSubmit} className="w-full space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Verification Code</label>
              <input
                type="text"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-all text-sm text-slate-800 font-bold tracking-widest text-center"
                placeholder="000000"
                maxLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || otp.length < 5}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-2xl transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
            >
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              <span>Verify Email</span>
            </button>
          </form>

          <div className="mt-8 text-center text-xs w-full">
            <span className="text-slate-400">Didn&apos;t receive a code?</span>{' '}
            <button
              onClick={resendOtp}
              disabled={isLoading}
              className="text-blue-600 hover:text-blue-700 font-semibold focus:outline-none disabled:opacity-50"
            >
              Resend
            </button>
          </div>
          
          <div className="mt-4 text-center w-full">
             <button
              onClick={() => {
                setNeedsVerification(false)
                setOtp('')
                setError('')
                setSuccessMsg('')
              }}
              className="text-xs text-slate-400 hover:text-slate-600 font-medium"
            >
              Back to login
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
