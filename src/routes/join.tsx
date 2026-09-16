import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  Bot,
  Boxes,
  Check,
  CircleCheck,
  Image,
  MessagesSquare,
  Sparkles,
  Tag,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getWaitlistStats, joinWaitlist, WAITLIST_LIMIT } from "@/lib/waitlist.functions";
import logoAsset from "@/assets/cupai-logo.png.asset.json";

export const Route = createFileRoute("/join")({
  head: () => ({
    meta: [
      { title: "احجز مكانك بين أول 100 مشترك | CUPAI" },
      {
        name: "description",
        content:
          "احجز مكانك بين أول 100 مشترك في CUPAI واحصل على خصم التأسيس. الحجز بالبريد الإلكتروني فقط.",
      },
      { property: "og:title", content: "احجز مكانك بين أول 100 مشترك | CUPAI" },
      {
        property: "og:description",
        content: "وكيل مبيعات ذكي يردّ على عملائك ويكمل طلباتهم على مدار الساعة. خصم خاص لأول 100 مشترك.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: JoinPage,
});

/** Smoothly counts up to the real number coming from the database. */
function useCountUp(target: number) {
  const [value, setValue] = useState(0);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / 900);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (t < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [target]);
  return value;
}

const FEATURES = [
  {
    icon: MessagesSquare,
    title: "محادثة تتحول إلى طلب",
    body: "يرد الوكيل فورًا، يفهم احتياج العميل، ويكمل الطلب حتى تأكيد الدفع.",
  },
  {
    icon: Image,
    title: "يفهم الصور والمنتجات",
    body: "يطابق الصور مع منتجاتك ويعرف المقاسات والألوان المتاحة في اللحظة نفسها.",
  },
  {
    icon: Boxes,
    title: "مخزون دقيق دائمًا",
    body: "يُحدّث الكميات مع الطلبات المؤكدة حتى لا يُباع منتج غير متوفر.",
  },
  {
    icon: Tag,
    title: "عروض تُطبّق تلقائيًا",
    body: "يحسب الخصومات وحدود الاستخدام داخل المحادثة دون تدخل يدوي.",
  },
  {
    icon: Bot,
    title: "يتعلم ما ينقصه",
    body: "ينبّهك للمعلومة الناقصة، ثم يستخدمها لاحقًا في ردوده للعملاء.",
  },
  {
    icon: Sparkles,
    title: "متجرك جاهز للمشاركة",
    body: "رابط خاص لمنتجاتك وتجربة دخول سريعة للعملاء باستخدام Google.",
  },
];

function JoinPage() {
  const fetchStats = useServerFn(getWaitlistStats);
  const join = useServerFn(joinWaitlist);

  const [count, setCount] = useState(0);
  const [step, setStep] = useState<"intro" | "email" | "done">("intro");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [position, setPosition] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let active = true;
    fetchStats()
      .then((s) => {
        if (active) setCount(s.count);
      })
      .catch(() => {
        /* العدّاد يبقى صفرًا إذا تعذّر الاتصال */
      });
    return () => {
      active = false;
    };
  }, [fetchStats]);

  useEffect(() => {
    if (step === "email") inputRef.current?.focus();
  }, [step]);

  const shown = useCountUp(count);
  const remaining = Math.max(0, WAITLIST_LIMIT - count);
  const percent = Math.min(100, Math.round((count / WAITLIST_LIMIT) * 100));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await join({ data: { email } });
      setCount(res.count);
      setPosition(res.position);
      setStep("done");
      toast.success(res.already ? "أنت محجوز بالفعل ✨" : "تم حجز مكانك 🎉");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذّر الحجز، حاول مرة أخرى.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div dir="rtl" className="join-page relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="join-grid pointer-events-none absolute inset-0" aria-hidden />
      <div className="join-glow pointer-events-none absolute -left-48 -top-52 h-[34rem] w-[34rem] rounded-full" aria-hidden />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8 sm:py-7">
        <div className="flex items-center gap-3" dir="ltr">
          <img src={logoAsset.url} alt="CUPAI" className="h-11 w-11 rounded-xl object-contain" />
          <span className="join-latin text-xl font-bold">CUPAI</span>
        </div>
        <span className="join-status inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          التسجيل المبكر مفتوح
        </span>
      </header>

      <main className="relative mx-auto max-w-6xl px-5 pb-20 pt-7 sm:px-8 sm:pt-14">
        <section className="grid items-center gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:gap-20">
          <div className="join-reveal max-w-2xl">
            <div className="mb-6 flex items-center gap-3 text-xs font-semibold text-primary">
              <span className="h-px w-10 bg-primary" />
              لأول 100 مشترك فقط
            </div>
            <h1 className="text-balance text-[2.65rem] font-bold leading-[1.16] sm:text-6xl lg:text-[4.5rem]">
              مستعد تبدأ البيع
              <span className="mt-1 block text-primary">بشكل أذكى؟</span>
            </h1>
            <p className="mt-6 max-w-xl text-pretty text-base leading-8 text-muted-foreground sm:text-lg">
              انضم إلى الدفعة الأولى من CUPAI واحصل على خصم المؤسسين عند الإطلاق.
              بريدك الإلكتروني فقط — لا بطاقة ولا خطوات إضافية.
            </p>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-2"><CircleCheck className="text-primary" /> بدون التزام</span>
              <span className="flex items-center gap-2"><CircleCheck className="text-primary" /> أولوية الوصول</span>
              <span className="flex items-center gap-2"><CircleCheck className="text-primary" /> خصم خاص</span>
            </div>
          </div>

          <aside className="join-reveal join-delay rounded-2xl border border-border bg-card p-5 shadow-card sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">المقاعد المحجوزة</p>
                <div className="join-latin mt-2 flex items-baseline gap-2" dir="ltr">
                  <strong className="text-6xl font-bold leading-none text-primary tabular-nums">{shown}</strong>
                  <span className="text-lg text-muted-foreground">/ {WAITLIST_LIMIT}</span>
                </div>
              </div>
              <span className="rounded-lg bg-secondary px-3 py-2 text-center">
                <strong className="join-latin block text-xl leading-none tabular-nums">{remaining}</strong>
                <span className="mt-1 block text-[10px] text-muted-foreground">متبقي</span>
              </span>
            </div>

            <div className="mt-7 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="join-progress h-full rounded-full bg-primary transition-all duration-1000 ease-out"
                style={{ width: `${Math.max(percent, count > 0 ? 4 : 0)}%` }}
              />
            </div>
            <p className="mt-3 text-xs leading-6 text-muted-foreground">
              العدد يتحدث مباشرة مع كل حجز جديد.
            </p>

            <div className="mt-7 border-t border-border pt-6">
          {step === "intro" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <Button
                size="lg"
                className="h-12 w-full rounded-lg text-base font-bold"
                onClick={() => setStep("email")}
              >
                أنا مستعد — احجز مكاني
                <ArrowLeft />
              </Button>
            </div>
          )}

          {step === "email" && (
            <form
              onSubmit={handleSubmit}
              className="animate-in fade-in slide-in-from-bottom-2 space-y-3 duration-500"
            >
              <label htmlFor="waitlist-email" className="block text-sm font-semibold">
                أين نرسل لك دعوة الإطلاق؟
              </label>
              <Input
                id="waitlist-email"
                ref={inputRef}
                type="email"
                required
                dir="ltr"
                maxLength={255}
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-lg bg-background px-4 text-left text-base"
              />
              <Button
                type="submit"
                size="lg"
                disabled={submitting}
                className="h-12 w-full rounded-lg text-base font-bold"
              >
                {submitting ? "جارٍ الحجز…" : "تأكيد الحجز"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setStep("intro")}
                className="mx-auto flex text-xs text-muted-foreground"
              >
                رجوع
              </Button>
            </form>
          )}

          {step === "done" && (
            <div className="animate-in fade-in zoom-in-95 py-2 text-center duration-500">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-secondary text-primary">
                <Check />
              </div>
              <h2 className="mt-4 text-xl font-bold">مكانك محجوز</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                أنت رقم{" "}
                <span className="font-black text-foreground tabular-nums">{position}</span>{" "}
                في قائمة المؤسسين. سنراسلك على بريدك عند الإطلاق مع خصمك الخاص.
              </p>
            </div>
          )}
            </div>
          </aside>
        </section>

        <section className="mt-24 border-t border-border pt-10 sm:mt-32 sm:pt-14">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold text-primary">ما الذي تحصل عليه؟</p>
            <h2 className="mt-3 text-2xl font-bold sm:text-3xl">أكثر من مجرد ردود تلقائية</h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              CUPAI يعمل مع منتجاتك ومخزونك وعروضك ليحوّل المحادثة إلى تجربة بيع كاملة.
            </p>
          </div>
          <div className="mt-9 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <article key={title} className="group bg-card p-6 transition-colors hover:bg-secondary">
                <Icon className="text-primary transition-transform duration-300 group-hover:-translate-y-0.5" />
                <h3 className="mt-5 text-base font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <footer className="mt-16 flex items-center justify-between border-t border-border py-7 text-xs text-muted-foreground" dir="ltr">
          <span className="join-latin font-semibold text-foreground">CUPAI</span>
          <span>© 2026</span>
        </footer>
      </main>
    </div>
  );
}
