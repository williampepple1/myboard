'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { LogIn, UserPlus, Mail, Lock, AlertCircle, Loader2, KeyRound, Sparkles, ArrowRight } from 'lucide-react'

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

  const bgElement = (
    <>
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 10s infinite alternate cubic-bezier(0.4, 0, 0.2, 1);
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
        .delay-400 { animation-delay: 400ms; }
      `}</style>
      <div className="fixed inset-0 -z-10 bg-slate-50 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-400/20 rounded-full mix-blend-multiply filter blur-[100px] animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-cyan-300/20 rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] bg-indigo-400/20 rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-4000"></div>
      </div>
    </>
  )

  if (needsVerification) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
        {bgElement}
        <div className="w-full max-w-md bg-white/70 backdrop-blur-2xl border border-white/60 rounded-3xl shadow-[0_8px_40px_rgb(0,0,0,0.06)] p-10 animate-in zoom-in-95 duration-500 relative overflow-hidden">
          {/* Decorative shine */}
          <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-white to-transparent opacity-80" />
          
          <div className="flex flex-col items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-blue-500/30 ring-4 ring-white/50">M</div>
            <span className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-slate-800 to-slate-600">MyBoard</span>
          </div>
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl mb-5 shadow-inner border border-blue-100">
              <KeyRound size={28} strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Verify your email</h1>
            <p className="text-sm text-slate-500 mt-3 leading-relaxed">
              We sent a verification code to <br/><span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">{email}</span>
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50/80 border border-red-100 text-red-600 rounded-xl text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
              <span className="font-medium">{error}</span>
            </div>
          )}
          
          {successMsg && (
            <div className="mb-6 p-4 bg-green-50/80 border border-green-100 text-green-700 rounded-xl text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <Sparkles size={18} className="mt-0.5 shrink-0 text-green-500" />
              <span className="font-medium">{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleVerificationSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 ml-1">Verification Code</label>
              <div className="relative group">
                <input
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/60 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 text-slate-800 font-bold tracking-widest text-lg placeholder:text-slate-400 placeholder:font-normal placeholder:tracking-normal hover:bg-white/90"
                  placeholder="Enter 6 digits"
                  maxLength={6}
                />
                <KeyRound size={20} className="absolute left-4 top-4 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-300" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || otp.length < 5}
              className="relative w-full overflow-hidden bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3.5 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_4px_20px_0_rgb(37,99,235,0.3)] hover:shadow-[0_6px_25px_rgba(37,99,235,0.4)] hover:-translate-y-0.5 active:translate-y-0"
            >
              {isLoading && <Loader2 size={18} className="animate-spin" />}
              <span>Verify Email</span>
              {!isLoading && <ArrowRight size={18} className="ml-1 opacity-80" />}
            </button>
          </form>

          <div className="mt-8 text-center text-sm">
            <span className="text-slate-500">Didn&apos;t receive a code?</span>{' '}
            <button
              onClick={resendOtp}
              disabled={isLoading}
              className="text-blue-600 hover:text-blue-700 hover:underline font-semibold focus:outline-none disabled:opacity-50 transition-colors"
            >
              Resend
            </button>
          </div>
          
          <div className="mt-5 text-center">
             <button
              onClick={() => {
                setNeedsVerification(false)
                setOtp('')
                setError('')
                setSuccessMsg('')
              }}
              className="text-sm text-slate-400 hover:text-slate-600 font-medium transition-colors"
            >
              Back to login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      {bgElement}
      <div className="w-full max-w-md bg-white/70 backdrop-blur-2xl border border-white/60 rounded-3xl shadow-[0_8px_40px_rgb(0,0,0,0.06)] p-10 relative overflow-hidden">
        {/* Decorative shine */}
        <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-white to-transparent opacity-80" />

        {/* Brand */}
        <div className="flex items-center justify-center gap-3 mb-8 animate-fade-in-up">
          <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-blue-500/30 ring-4 ring-white/50">M</div>
          <span className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-slate-800 to-slate-600">MyBoard</span>
        </div>

        {/* Header */}
        <div className="text-center mb-8 animate-fade-in-up delay-100">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl mb-5 shadow-inner border border-blue-100">
            {isLogin ? <LogIn size={28} strokeWidth={2.5} /> : <Sparkles size={28} strokeWidth={2.5} />}
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            {isLogin ? 'Welcome back' : 'Create an account'}
          </h1>
          <p className="text-sm text-slate-500 mt-3 leading-relaxed">
            {isLogin ? 'Enter your details to access your boards and continue your workflow.' : 'Sign up to start organizing your projects beautifully.'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50/80 border border-red-100 text-red-600 rounded-xl text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in-up delay-200">
          {!isLogin && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 ml-1">Full Name</label>
              <div className="relative group">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white/60 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 text-slate-700 font-medium placeholder:text-slate-400 placeholder:font-normal hover:bg-white/90"
                  placeholder="John Doe"
                />
                <UserPlus size={18} className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-300" />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 ml-1">Email Address</label>
            <div className="relative group">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white/60 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 text-slate-700 font-medium placeholder:text-slate-400 placeholder:font-normal hover:bg-white/90"
                placeholder="you@example.com"
              />
              <Mail size={18} className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-300" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 ml-1">Password</label>
            <div className="relative group">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white/60 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 text-slate-700 font-medium placeholder:text-slate-400 placeholder:font-normal hover:bg-white/90"
                placeholder="••••••••"
              />
              <Lock size={18} className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-300" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="relative w-full overflow-hidden bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3.5 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 mt-6 disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_4px_20px_0_rgb(37,99,235,0.3)] hover:shadow-[0_6px_25px_rgba(37,99,235,0.4)] hover:-translate-y-0.5 active:translate-y-0 group"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
            <span className="relative flex items-center justify-center gap-2">
              {isLoading && <Loader2 size={18} className="animate-spin" />}
              <span>{isLogin ? 'Sign in to MyBoard' : 'Create your account'}</span>
              {!isLoading && <ArrowRight size={18} className="opacity-80 group-hover:translate-x-1 transition-transform" />}
            </span>
          </button>
        </form>

        <div className="mt-8 flex items-center gap-4 before:h-px before:flex-1 before:bg-slate-200 after:h-px after:flex-1 after:bg-slate-200 text-xs text-slate-400 uppercase font-bold tracking-wider animate-fade-in-up delay-300">
          Or continue with
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="mt-6 w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold py-3.5 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 animate-fade-in-up delay-400 group"
        >
          <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>

        {/* Footer */}
        <div className="mt-10 text-center text-sm text-slate-500 animate-fade-in-up delay-400">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <button
            onClick={() => {
              setIsLogin(!isLogin)
              setError('')
            }}
            className="text-blue-600 hover:text-blue-700 hover:underline font-bold focus:outline-none transition-colors"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  )
}
