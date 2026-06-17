'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Heart, MessageCircle, Target, UserPlus, Users } from 'lucide-react'
import { getUser, saveUser } from '@/lib/auth'
import { Logo } from '@/components/brand/logo'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n'

const NEED_TYPES = [
  {
    id: 'cohesion',
    label: "Cohésion d'équipe",
    desc: 'Mini-jeux, rétrospectives, kudo cards',
    Icon: Users,
    iconBg: 'bg-blue-50 dark:bg-blue-950',
    iconColor: 'text-blue-700 dark:text-blue-400',
    selectedRing: 'border-blue-500 dark:border-blue-400 bg-blue-50/40 dark:bg-blue-950/40',
  },
  {
    id: 'performance',
    label: 'Performance collective',
    desc: 'Feedback, OKR, quiz managérial',
    Icon: Target,
    iconBg: 'bg-violet-50 dark:bg-violet-950',
    iconColor: 'text-violet-700 dark:text-violet-400',
    selectedRing: 'border-violet-500 dark:border-violet-400 bg-violet-50/40 dark:bg-violet-950/40',
  },
  {
    id: 'wellbeing',
    label: 'Bien-être au travail',
    desc: 'Humeur, icebreakers, kudo cards',
    Icon: Heart,
    iconBg: 'bg-emerald-50 dark:bg-emerald-950',
    iconColor: 'text-emerald-700 dark:text-emerald-400',
    selectedRing: 'border-emerald-500 dark:border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/40',
  },
  {
    id: 'communication',
    label: "Communication d'équipe",
    desc: 'ABCDE, réunion, icebreakers',
    Icon: MessageCircle,
    iconBg: 'bg-amber-50 dark:bg-amber-950',
    iconColor: 'text-amber-700 dark:text-amber-400',
    selectedRing: 'border-amber-500 dark:border-amber-400 bg-amber-50/40 dark:bg-amber-950/40',
  },
  {
    id: 'onboarding',
    label: 'Intégrer un collaborateur',
    desc: '1:1 Coach, icebreakers, rétrospective',
    Icon: UserPlus,
    iconBg: 'bg-cyan-50 dark:bg-cyan-950',
    iconColor: 'text-cyan-700 dark:text-cyan-400',
    selectedRing: 'border-cyan-500 dark:border-cyan-400 bg-cyan-50/40 dark:bg-cyan-950/40',
  },
] as const

export default function OnboardingPage() {
  const { t } = useI18n()
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [firstNameError, setFirstNameError] = useState('')
  const [selectedNeed, setSelectedNeed] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      const localUser = getUser()
      if (!localUser) {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.replace('/login')
          return
        }
      } else if (localUser.firstName) {
        router.replace('/')
        return
      }
      setReady(true)
    }
    checkAuth()
  }, [router])

  function handleStep1(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const trimmedFirst = firstName.trim()
    if (!trimmedFirst) {
      setFirstNameError(t.onboarding.firstNameRequired)
      return
    }
    setFirstNameError('')
    const existing = getUser()
    if (!existing) {
      router.replace('/login')
      return
    }
    saveUser({ ...existing, firstName: trimmedFirst, lastName: lastName.trim() })
    setStep(2)
  }

  async function handleStep2() {
    if (!selectedNeed) return
    setSaving(true)
    try {
      await fetch('/api/weekly-coach/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ need_type: selectedNeed }),
      })
    } catch {
      // Si l'API échoue, on laisse passer — configurable plus tard
    } finally {
      setSaving(false)
      router.replace('/')
    }
  }

  function skipStep2() {
    router.replace('/')
  }

  if (!ready) return null

  // ── Étape 1 : prénom ──────────────────────────────────────────────────────

  if (step === 1) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-card rounded-2xl shadow-sm border border-border p-8">
          <div className="mb-8 text-center">
            <div className="inline-flex mb-4 text-foreground">
              <Logo withWordmark size={22} />
            </div>
            <h1 className="text-xl font-semibold text-foreground">{t.onboarding.title}</h1>
            <p className="mt-1 text-muted-foreground text-sm">{t.onboarding.subtitle}</p>
          </div>

          <form onSubmit={handleStep1} noValidate className="space-y-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-foreground mb-1">
                {t.onboarding.firstName} <span className="text-destructive">*</span>
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value)
                  if (firstNameError) setFirstNameError('')
                }}
                placeholder="Marie"
                autoFocus
                className="w-full px-3 py-2.5 border border-input rounded-lg text-sm text-foreground bg-background placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
              />
              {firstNameError && <p className="mt-1 text-xs text-destructive">{firstNameError}</p>}
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-foreground mb-1">
                {t.onboarding.lastNameOptional}
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Dupont"
                className="w-full px-3 py-2.5 border border-input rounded-lg text-sm text-foreground bg-background placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors mt-2"
            >
              {t.onboarding.start}
            </button>
          </form>
        </div>
      </main>
    )
  }

  // ── Étape 2 : besoin Weekly Coach ─────────────────────────────────────────

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-card rounded-2xl shadow-sm border border-border p-8">
        <div className="mb-6 text-center">
          <div className="inline-flex mb-4 text-foreground">
            <Logo withWordmark size={22} />
          </div>
          <h1 className="text-xl font-semibold text-foreground">Weekly Coach</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Quel est votre besoin principal en tant que manager ?
          </p>
        </div>

        <div className="flex flex-col gap-2 mb-6">
          {NEED_TYPES.map((need) => {
            const { Icon } = need
            const isSelected = selectedNeed === need.id
            return (
              <button
                key={need.id}
                onClick={() => setSelectedNeed(need.id)}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? `border-2 ${need.selectedRing}`
                    : 'border border-border hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${need.iconBg}`}>
                  <Icon size={15} className={need.iconColor} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground leading-tight">{need.label}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{need.desc}</p>
                </div>
                {isSelected && <Check size={13} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />}
              </button>
            )
          })}
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={handleStep2}
            disabled={!selectedNeed || saving}
            className="w-full py-2.5 px-4 bg-blue-700 hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            {saving ? 'Enregistrement…' : 'Configurer mon coach'}
          </button>
          <button
            onClick={skipStep2}
            className="w-full py-2 px-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Passer cette étape
          </button>
        </div>

        <div className="flex items-center justify-center gap-1.5 mt-6">
          <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
          <span className="w-2 h-2 rounded-full bg-blue-600" />
        </div>
      </div>
    </main>
  )
}
