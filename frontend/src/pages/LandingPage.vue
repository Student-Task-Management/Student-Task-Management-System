<script setup lang="ts">
import {
  ArrowRight, ListChecks, CalendarDays, BookOpen, ChartColumn, Flag, ShieldCheck,
  UserPlus, Plus, TrendingUp, GraduationCap,
} from '@lucide/vue'
import AppLogo from '../components/AppLogo.vue'

const features = [
  { icon: ListChecks, title: 'Task management', text: 'Create, edit and complete assignments in a list or a Kanban board.' },
  { icon: Flag, title: 'Priorities and deadlines', text: 'Mark what is urgent and see what is due today, tomorrow or overdue.' },
  { icon: BookOpen, title: 'Subjects', text: 'Group tasks by subject with colors and see progress for each one.' },
  { icon: CalendarDays, title: 'Calendar view', text: 'See every deadline on a monthly calendar and plan ahead.' },
  { icon: ChartColumn, title: 'Productivity analytics', text: 'Understand your habits with completion rates and clear charts.' },
  { icon: ShieldCheck, title: 'Private and secure', text: 'Your tasks belong only to you, protected by secure sign in.' },
]

const steps = [
  { icon: UserPlus, title: 'Create your account', text: 'Sign up for free in under a minute.' },
  { icon: Plus, title: 'Add subjects and tasks', text: 'Add your classes, then your assignments with priorities and deadlines.' },
  { icon: TrendingUp, title: 'Track your progress', text: 'Complete tasks, watch your dashboard update, and stay on top of deadlines.' },
]

const footerLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how' },
]
</script>

<template>
  <div class="min-h-screen">
    <!-- Header -->
    <header class="sticky top-0 z-30 border-b border-transparent bg-canvas/80 backdrop-blur">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <RouterLink to="/" aria-label="StudyFlow home"><AppLogo /></RouterLink>
        <nav class="hidden gap-8 text-sm font-medium text-muted md:flex" aria-label="Main">
          <a href="#features" class="transition hover:text-ink">Features</a>
          <a href="#how" class="transition hover:text-ink">How it works</a>
        </nav>
        <div class="flex items-center gap-2">
          <RouterLink to="/login" class="btn-ghost">Log in</RouterLink>
          <RouterLink to="/register" class="btn-primary">Get Started</RouterLink>
        </div>
      </div>
    </header>

    <main>
      <!-- Hero -->
      <section class="bg-gradient-to-b from-brand-50/60 to-canvas">
        <div class="mx-auto max-w-4xl px-6 pb-16 pt-16 text-center md:pt-20">
          <span class="inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">Built for students</span>
          <h1 class="mt-6 text-4xl font-bold leading-tight tracking-tight md:text-5xl">
            Study Smarter. Stay Organized. <span class="text-brand-600">Achieve More.</span>
          </h1>
          <p class="mx-auto mt-5 max-w-2xl text-lg text-muted">
            Your academic life, organized in one place. Manage assignments, track deadlines,
            and make every study session count.
          </p>
          <div class="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <RouterLink to="/register" class="btn-primary">Get Started <ArrowRight :size="16" /></RouterLink>
            <a href="#how" class="btn-ghost border border-slate-200 bg-white">See how it works</a>
          </div>
        </div>

        <!-- Dashboard preview (decorative) -->
        <div class="mx-auto max-w-5xl px-6 pb-20" aria-hidden="true">
          <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div class="flex items-center gap-1.5 border-b border-slate-100 px-4 py-3">
              <span class="h-2.5 w-2.5 rounded-full bg-rose-400"></span>
              <span class="h-2.5 w-2.5 rounded-full bg-amber-400"></span>
              <span class="h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
              <span class="ml-3 rounded-md bg-slate-100 px-3 py-0.5 text-[11px] text-muted">studyflow.app/overview</span>
            </div>

            <div class="flex">
              <div class="hidden w-44 shrink-0 space-y-1 border-r border-slate-100 p-3 sm:block">
                <div class="mb-3 flex items-center gap-2 px-2">
                  <span class="grid h-6 w-6 place-items-center rounded-md bg-brand-600 text-white"><GraduationCap :size="14" /></span>
                  <span class="text-xs font-bold">StudyFlow</span>
                </div>
                <div class="rounded-lg bg-brand-50 px-3 py-2 text-xs font-medium text-brand-700">Overview</div>
                <div class="px-3 py-2 text-xs text-muted">My Tasks</div>
                <div class="px-3 py-2 text-xs text-muted">Calendar</div>
                <div class="px-3 py-2 text-xs text-muted">Subjects</div>
                <div class="px-3 py-2 text-xs text-muted">Analytics</div>
              </div>

              <div class="flex-1 space-y-4 p-4 sm:p-6">
                <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <div class="rounded-xl bg-indigo-50 p-3"><p class="text-[11px] text-muted">Total</p><p class="text-xl font-bold text-indigo-600">24</p></div>
                  <div class="rounded-xl bg-amber-50 p-3"><p class="text-[11px] text-muted">Pending</p><p class="text-xl font-bold text-amber-600">8</p></div>
                  <div class="rounded-xl bg-sky-50 p-3"><p class="text-[11px] text-muted">In progress</p><p class="text-xl font-bold text-sky-600">5</p></div>
                  <div class="rounded-xl bg-emerald-50 p-3"><p class="text-[11px] text-muted">Completed</p><p class="text-xl font-bold text-emerald-600">11</p></div>
                </div>

                <div class="grid gap-4 md:grid-cols-3">
                  <div class="rounded-xl border border-slate-100 p-4 md:col-span-2">
                    <p class="mb-3 text-xs font-semibold">Weekly productivity</p>
                    <div class="flex h-24 items-end gap-2">
                      <div v-for="h in [40, 65, 30, 80, 55, 90, 45]" :key="h" class="flex flex-1 items-end gap-0.5">
                        <div class="w-full rounded-t bg-brand-600" :style="{ height: h + '%' }"></div>
                        <div class="w-full rounded-t bg-brand-100" :style="{ height: (100 - h) / 2 + '%' }"></div>
                      </div>
                    </div>
                  </div>
                  <div class="space-y-2 rounded-xl border border-slate-100 p-4">
                    <p class="text-xs font-semibold">Upcoming deadlines</p>
                    <div class="flex items-center justify-between text-[11px]"><span>SQL worksheet</span><span class="rounded-full bg-rose-50 px-2 py-0.5 text-rose-700">Tomorrow</span></div>
                    <div class="flex items-center justify-between text-[11px]"><span>English essay</span><span class="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">In 2 days</span></div>
                    <div class="flex items-center justify-between text-[11px]"><span>REST API lab</span><span class="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">In 6 days</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Features -->
      <section id="features" class="mx-auto max-w-6xl scroll-mt-20 px-6 py-20">
        <div class="mx-auto max-w-2xl text-center">
          <p class="text-sm font-semibold text-brand-600">Features</p>
          <h2 class="mt-2 text-3xl font-bold tracking-tight">Everything you need to stay on top of your studies</h2>
          <p class="mt-3 text-muted">Simple tools that help you plan, focus and finish what matters.</p>
        </div>
        <div class="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <article v-for="f in features" :key="f.title" class="card p-6 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg">
            <span class="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600"><component :is="f.icon" :size="22" /></span>
            <h3 class="mt-4 font-semibold">{{ f.title }}</h3>
            <p class="mt-1.5 text-sm text-muted">{{ f.text }}</p>
          </article>
        </div>
      </section>

      <!-- How it works -->
      <section id="how" class="scroll-mt-20 bg-white py-20">
        <div class="mx-auto max-w-6xl px-6">
          <div class="mx-auto max-w-2xl text-center">
            <p class="text-sm font-semibold text-brand-600">How it works</p>
            <h2 class="mt-2 text-3xl font-bold tracking-tight">Get organized in three simple steps</h2>
          </div>
          <ol class="mt-12 grid gap-8 md:grid-cols-3">
            <li v-for="(s, i) in steps" :key="s.title" class="text-center">
              <span class="relative mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm">
                <component :is="s.icon" :size="26" />
                <span class="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-white text-xs font-bold text-brand-700 shadow">{{ i + 1 }}</span>
              </span>
              <h3 class="mt-5 font-semibold">{{ s.title }}</h3>
              <p class="mx-auto mt-1.5 max-w-xs text-sm text-muted">{{ s.text }}</p>
            </li>
          </ol>
        </div>
      </section>

      <!-- Call to action -->
      <section class="mx-auto max-w-6xl px-6 py-20">
        <div class="rounded-3xl bg-gradient-to-br from-brand-600 to-brand-700 px-6 py-14 text-center text-white shadow-soft sm:px-12">
          <h2 class="text-3xl font-bold tracking-tight">Ready to make every study session count?</h2>
          <p class="mx-auto mt-3 max-w-xl text-brand-100">Join StudyFlow and take control of your assignments and deadlines today.</p>
          <RouterLink
            to="/register"
            class="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-brand-700 transition hover:-translate-y-0.5 hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-700"
          >
            Get Started for free <ArrowRight :size="16" />
          </RouterLink>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="border-t border-slate-200 bg-white">
      <div class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
        <AppLogo />
        <nav class="flex gap-6 text-sm text-muted" aria-label="Footer">
          <a v-for="l in footerLinks" :key="l.label" :href="l.href" class="transition hover:text-ink">{{ l.label }}</a>
          <RouterLink to="/login" class="transition hover:text-ink">Log in</RouterLink>
          <RouterLink to="/register" class="transition hover:text-ink">Sign up</RouterLink>
        </nav>
        <p class="text-sm text-muted">&copy; 2026 StudyFlow. Built as a student project.</p>
      </div>
    </footer>
  </div>
</template>
