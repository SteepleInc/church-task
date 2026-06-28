import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";

import { Reveal, RISE_EASE, useHeaderEntrance } from "./-marketing-shell";

export const Route = createFileRoute("/_marketing/pricing")({
  component: PricingPage,
  head: () => ({
    meta: [
      {
        title: "Pricing — Church Work",
      },
      {
        name: "description",
        content:
          "One plan, $19.99 a week. Unlimited users, every feature, every church. Billed by the week, like everything else you plan.",
      },
    ],
  }),
});

/* ------------------------------------------------------------------ */
/* Everything that's included — real product surfaces, so the checks   */
/* encode a true fact rather than decorate the page.                   */
/* ------------------------------------------------------------------ */

const INCLUDED = [
  { title: "Unlimited users", body: "Every staff member and volunteer, no per-seat math." },
  { title: "Unlimited Teams", body: "Worship, Production, Kids, and every team you add." },
  { title: "Weeks & Planning", body: "The Monday-to-Sunday planning rhythm, fully managed." },
  { title: "Templates & Schedules", body: "Recurring work written once, projected forward." },
  { title: "Boards & Workflows", body: "Each team's own To Do → In Progress → Done." },
  { title: "Insights", body: "Where the week stands, counted by team and status." },
  { title: "My Work & Our Work", body: "The personal list and the shared church-wide picture." },
  { title: "Rollover, automatically", body: "Unfinished work carries into next week on its own." },
] as const;

function Check() {
  return (
    <span
      aria-hidden
      className="mt-0.5 flex size-[18px] flex-none items-center justify-center rounded-full"
      style={{ background: "oklch(0.88 0.18 95)" }}
    >
      <svg
        fill="none"
        height={10}
        stroke="oklch(0.16 0.01 260)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={3.5}
        viewBox="0 0 24 24"
        width={10}
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* The price hero — the most characteristic thing on the page          */
/* ------------------------------------------------------------------ */

// Pricing hero load cascade, as offsets (seconds) from `base` — the same
// header-relative scheme the home hero uses. The price card is the signature,
// so it lands last and with weight.
const PRICE_OFFSET = {
  eyebrow: -0.3,
  headline: 0.05,
  subhead: 0.4,
  card: 0.75,
} as const;
const CARD_DURATION = 0.95;

// How long the hero takes to come fully to rest, measured from `base` (the
// card's offset plus its own duration). The below-fold sections that are
// already on-screen at load are held until this passes, so they don't reveal
// on top of the still-animating hero.
const HERO_TAIL_SEC = PRICE_OFFSET.card + CARD_DURATION;

function PriceHero({ base }: { readonly base: number }) {
  const at = (offset: number) => Math.max(0, base + offset);
  return (
    <section className="mx-auto max-w-[1400px] px-6 pt-16 md:px-10 md:pt-24">
      {/* Eyebrow */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center"
        initial={{ opacity: 0, y: 24 }}
        transition={{ delay: at(PRICE_OFFSET.eyebrow), duration: 0.8, ease: "easeOut" }}
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-mkt-border px-3 py-1 font-medium text-[13px] text-mkt-muted">
          <span className="size-1.5 rounded-full" style={{ background: "oklch(0.88 0.18 95)" }} />
          One plan, every church
        </span>
      </motion.div>

      {/* Headline */}
      <motion.h1
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto mt-7 max-w-[900px] text-center font-medium text-[48px] tracking-tight md:text-[76px]"
        initial={{ opacity: 0, y: 28 }}
        style={{ letterSpacing: "-0.035em", lineHeight: 1.04 }}
        transition={{ delay: at(PRICE_OFFSET.headline), duration: 0.9, ease: RISE_EASE }}
      >
        Simple pricing, the way ministry should be.
      </motion.h1>

      <motion.p
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto mt-6 max-w-[560px] text-center text-[18px] text-mkt-muted"
        initial={{ opacity: 0, y: 24 }}
        style={{ lineHeight: 1.5 }}
        transition={{ delay: at(PRICE_OFFSET.subhead), duration: 0.9, ease: "easeOut" }}
      >
        No tiers to compare. No per-seat counting. No call with sales to find the real number. One
        price, everything included.
      </motion.p>

      {/* The price card — the signature, lands last and with weight */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mesh-price relative mx-auto mt-12 overflow-hidden rounded-[28px] p-8 md:mt-14 md:p-12"
        initial={{ opacity: 0, y: 48 }}
        transition={{ delay: at(PRICE_OFFSET.card), duration: CARD_DURATION, ease: RISE_EASE }}
      >
        <div className="grid items-center gap-10 md:grid-cols-[1.1fr_1fr] md:gap-12">
          {/* Left: the number */}
          <div className="text-white">
            <span className="font-semibold text-[13px] text-white/55 uppercase tracking-[0.16em]">
              Church Work · all of it
            </span>

            <div className="mt-5 flex items-end gap-3">
              <span
                className="font-medium text-[80px] leading-none tracking-tight md:text-[112px]"
                style={{ letterSpacing: "-0.04em" }}
              >
                $19.99
              </span>
              <span className="pb-2 font-medium text-[20px] text-white/60 md:pb-3 md:text-[22px]">
                / week
              </span>
            </div>

            <p className="mt-6 max-w-[420px] text-[17px] text-white/70" style={{ lineHeight: 1.5 }}>
              Billed by the week, like everything else you plan. Unlimited users, every feature, no
              surprises — for the whole church.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                className="rounded-full px-7 py-3 font-semibold text-[15px] text-mkt-fg transition-transform hover:scale-[1.02]"
                style={{ background: "oklch(0.88 0.18 95)" }}
                type="button"
              >
                Start your first week
              </button>
              <button
                className="rounded-full border border-white/25 px-7 py-3 font-medium text-[15px] text-white transition-colors hover:bg-white/10"
                type="button"
              >
                Book a demo
              </button>
            </div>

            <p className="mt-5 text-[13px] text-white/45">
              Set up in minutes · cancel anytime · no card required to start
            </p>
          </div>

          {/* Right: what's included */}
          <div className="rounded-[20px] border border-white/12 bg-white/[0.04] p-6 backdrop-blur-sm md:p-7">
            <p className="font-semibold text-[12px] text-white/55 uppercase tracking-[0.14em]">
              Everything is included
            </p>
            <ul className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {INCLUDED.map((item) => (
                <li className="flex items-start gap-2.5" key={item.title}>
                  <Check />
                  <span className="text-[14px] text-white/90 leading-snug">{item.title}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Why one plan — the honest argument, in plain terms                  */
/* ------------------------------------------------------------------ */

const REASONS = [
  {
    title: "Every church pays the same",
    body: "A 50-person plant and a 5,000-person multisite get the same software at the same price. Fairness isn't a sales tactic here — it's the whole pricing model.",
  },
  {
    title: "Add your whole team",
    body: "Invite every staff member and volunteer without watching a seat counter. The more of your church that plans together, the better Church Work works.",
  },
  {
    title: "Priced like you plan",
    body: "Your work runs week by week, so the bill does too. $19.99 a week — about the cost of a coffee run for the team — for everything.",
  },
] as const;

function WhyOnePlan({ heroSettleMs }: { readonly heroSettleMs: number }) {
  // On a tall viewport this section is already on-screen when the page loads, so
  // its reveals are held back until the hero above has finished its cascade —
  // otherwise "One plan works for every church" arrives mid-animation. The hold
  // window is derived from the same header-relative hero timing, so it stays in
  // sync. Once the reader scrolls down to it normally, the hold no longer applies.
  return (
    <section className="mx-auto max-w-[1400px] px-6 pt-28 md:px-10 md:pt-36">
      <Reveal holdUntil={heroSettleMs}>
        <p className="cw-eyebrow">Why one plan</p>
        <h2
          className="mt-5 max-w-[760px] font-medium text-[40px] tracking-tight md:text-[56px]"
          style={{ letterSpacing: "-0.03em", lineHeight: 1.05 }}
        >
          One plan works for every church.
        </h2>
      </Reveal>

      <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-mkt-border bg-mkt-border md:grid-cols-3">
        {REASONS.map((r, i) => (
          <Reveal
            className="bg-mkt-bg p-7 md:p-8"
            delay={i * 90}
            holdUntil={heroSettleMs + 140 + i * 90}
            key={r.title}
          >
            <h3 className="font-medium text-[22px] tracking-tight">{r.title}</h3>
            <p className="mt-3 text-[15px] text-mkt-muted" style={{ lineHeight: 1.55 }}>
              {r.body}
            </p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Questions — direct answers, no marketing hedging                    */
/* ------------------------------------------------------------------ */

const FAQS = [
  {
    q: "Is it really one price for everyone?",
    a: "Yes. $19.99 a week covers your entire church — every user, every team, every feature. There are no tiers and nothing to upgrade to.",
  },
  {
    q: "What counts as a user?",
    a: "Anyone you invite: staff, ministry leaders, and volunteers. There's no per-seat charge, so invite everyone who touches the plan.",
  },
  {
    q: "Why billed weekly?",
    a: "Church Work runs on the Monday-to-Sunday week, so the billing matches the rhythm you already keep. You can pay monthly if you'd rather — same total.",
  },
  {
    q: "Can we cancel?",
    a: "Anytime, in a click. Your work stays exportable, and you only pay for the weeks you use.",
  },
] as const;

function Questions() {
  return (
    <section className="mx-auto max-w-[1400px] px-6 pt-28 md:px-10 md:pt-36">
      <Reveal>
        <p className="cw-eyebrow">Questions</p>
        <h2
          className="mt-5 max-w-[760px] font-medium text-[40px] tracking-tight md:text-[56px]"
          style={{ letterSpacing: "-0.03em", lineHeight: 1.05 }}
        >
          The short answers.
        </h2>
      </Reveal>

      <dl className="mt-10 grid gap-x-12 sm:grid-cols-2">
        {FAQS.map((f, i) => (
          <Reveal className="border-mkt-border border-t py-7" delay={i * 70} key={f.q}>
            <dt className="font-medium text-[18px] tracking-tight">{f.q}</dt>
            <dd className="mt-2 text-[15px] text-mkt-muted" style={{ lineHeight: 1.55 }}>
              {f.a}
            </dd>
          </Reveal>
        ))}
      </dl>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Closing call to action                                              */
/* ------------------------------------------------------------------ */

function ClosingCTA() {
  return (
    <section className="mx-auto max-w-[1400px] px-6 pt-28 pb-8 text-center md:px-10 md:pt-40">
      <Reveal>
        <h2
          className="mx-auto max-w-[820px] font-medium text-[44px] tracking-tight md:text-[68px]"
          style={{ letterSpacing: "-0.035em", lineHeight: 1.04 }}
        >
          Nineteen ninety-nine. The whole church.
        </h2>
        <p
          className="mx-auto mt-6 max-w-[520px] text-[18px] text-mkt-muted"
          style={{ lineHeight: 1.5 }}
        >
          Set up your church in minutes and start the next week with a plan.
        </p>
        <div className="mt-9 flex items-center justify-center gap-3">
          <button
            className="rounded-full px-7 py-3 font-semibold text-[15px] text-mkt-fg transition-transform hover:scale-[1.02]"
            style={{ backgroundColor: "oklch(0.88 0.18 95)" }}
            type="button"
          >
            Get started
          </button>
          <button
            className="rounded-full border border-mkt-border bg-mkt-bg px-7 py-3 font-medium text-[15px] text-mkt-fg transition-colors hover:bg-mkt-card"
            style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.04)" }}
            type="button"
          >
            Book a demo
          </button>
        </div>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function PricingPage() {
  // The persistent MarketingShell (see route.tsx) owns the scroll surface and
  // the Header; this page just contributes its sections. The hero enters
  // relative to when the header settles (full delay on a cold load, ~0 after
  // navigation), and the below-fold hold is derived from that same timing.
  const { headerSettle } = useHeaderEntrance();
  const heroSettleMs = Math.round((headerSettle + HERO_TAIL_SEC) * 1000);
  return (
    <>
      <PriceHero base={headerSettle} />
      <WhyOnePlan heroSettleMs={heroSettleMs} />
      <Questions />
      <ClosingCTA />
      <div className="h-16" />
    </>
  );
}
