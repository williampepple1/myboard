'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { LogIn, UserPlus, Mail, Lock, AlertCircle, Loader2, KeyRound } from 'lucide-react'

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
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0C66E4]/5 via-[#0c66e4]/10 to-[#22A06B]/5" />
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[#0C66E4]/10 blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#22A06B]/10 blur-[120px] animate-pulse [animation-delay:2s]" />
      <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] rounded-full bg-[#E34935]/5 blur-[100px] animate-pulse [animation-delay:4s]" />
    </div>
  )

  if (needsVerification) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        {bgElement}
        <div className="w-full max-w-md bg-white border border-border rounded-md shadow-sm p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 text-primary rounded-md mb-4">
              <KeyRound size={24} />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Verify your email</h1>
            <p className="text-sm text-foreground/60 mt-2">
              We sent a verification code to <span className="font-medium text-foreground">{email}</span>
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          {successMsg && (
            <div className="mb-6 p-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleVerificationSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground/80">Verification Code</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                />
                <KeyRound size={16} className="absolute left-3.5 top-3 text-foreground/40" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || otp.length < 5}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm shadow-blue-500/20"
            >
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              Verify Email
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-foreground/60">Didn&apos;t receive a code?</span>{' '}
            <button
              onClick={resendOtp}
              disabled={isLoading}
              className="text-primary hover:underline font-medium focus:outline-none disabled:opacity-50"
            >
              Resend
            </button>
          </div>
          
          <div className="mt-4 text-center">
             <button
              onClick={() => {
                setNeedsVerification(false)
                setOtp('')
                setError('')
                setSuccessMsg('')
              }}
              className="text-sm text-foreground/50 hover:text-foreground/80 font-medium"
            >
              Back to login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative">
      {bgElement}
      <div className="w-full max-w-md bg-white/95 backdrop-blur-sm border border-border rounded-md shadow-sm p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 text-primary rounded-md mb-4">
            {isLogin ? <LogIn size={24} /> : <UserPlus size={24} />}
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {isLogin ? 'Welcome back' : 'Create an account'}
          </h1>
          <p className="text-sm text-foreground/60 mt-2">
            {isLogin ? 'Enter your details to access your boards.' : 'Sign up to start organizing your projects.'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground/80">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                  placeholder="John Doe"
                />
                <UserPlus size={16} className="absolute left-3.5 top-3 text-foreground/40" />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground/80">Email</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                placeholder="you@example.com"
              />
              <Mail size={16} className="absolute left-3.5 top-3 text-foreground/40" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground/80">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                placeholder="••••••••"
              />
              <Lock size={16} className="absolute left-3.5 top-3 text-foreground/40" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm shadow-blue-500/20"
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            {isLogin ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div className="mt-6 flex items-center gap-4 before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border text-xs text-foreground/40 uppercase font-medium">
          Or continue with
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="mt-6 w-full bg-white hover:bg-gray-50 border border-border text-foreground font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Google
        </button>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-foreground/60">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <button
            onClick={() => {
              setIsLogin(!isLogin)
              setError('')
            }}
            className="text-primary hover:underline font-medium focus:outline-none"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  )
}
