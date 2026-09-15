import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getWaitlistStats, joinWaitlist, WAITLIST_LIMIT } from "@/lib/waitlist.functions";
import logoAsset from "@/assets/cupai-logo.png.asset.json";

export const Route = createFileRoute("/join")({
  head: () => ({
    meta: [
      { title: "احجز مكانك · أول 100 مشترك في كيوباي" },
      {
        name: "description",
        content:
          "احجز مكانك بين أول 100 مشترك في كيوباي واحصل على خصم التأسيس. الحجز بالبريد الإلكتروني فقط، بدون أي تأكيد.",
      },
      { property: "og:title", content: "احجز مكانك · أول 100 مشترك في كيوباي" },
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
  "وكيل ذكي يردّ على عملائك بلغتهم خلال ثوانٍ، ويكمل الطلب من أول رسالة حتى تأكيد الدفع.",
  "يفهم صور المنتجات ويطابقها مع مخزونك، فيعرف تمامًا أي مقاس ولون متاح الآن.",
  "المخزون يُخصم لحظيًا مع كل طلب مؤكّد، فلا يبيع الوكيل شيئًا غير موجود.",
  "خصومات وعروض بوقت بدء وانتهاء، وحد للاستخدام، تُطبَّق تلقائيًا داخل المحادثة.",
  "ينبّهك للمعلومات الناقصة التي سألك عنها العملاء، وبعد إضافتها يردّ عليهم بنفسه.",
  "متجر جاهز برابط خاص بك، ودخول العملاء بحساب Google بضغطة واحدة.",
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
    <div dir="rtl" className="hub relative min-h-screen overflow-hidden bg-background">
      {/* هالات لونية ناعمة */}
      <div className="pointer-events-none absolute -top-40 right-1/2 h-96 w-96 translate-x-1/2 rounded-full bg-gradient-brand opacity-20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-gradient-brand opacity-10 blur-3xl" />

      <main className="relative mx-auto flex max-w-3xl flex-col items-center px-5 pb-20 pt-14 text-center">
        <img
          src={logoAsset.url}
          alt="كيوباي"
          className="h-24 w-24 animate-in fade-in zoom-in-75 rounded-3xl bg-card object-contain p-2 shadow-elegant duration-700"
        />

        <span className="mt-6 inline-flex animate-in fade-in slide-in-from-bottom-3 items-center gap-2 rounded-full border border-border/70 bg-card/70 px-4 py-1.5 text-xs font-semibold text-muted-foreground shadow-elegant backdrop-blur duration-700">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gradient-brand" />
          الحجز المبكر · خصم المؤسسين
        </span>

        <h1 className="mt-6 animate-in fade-in slide-in-from-bottom-4 text-balance text-3xl font-black leading-tight tracking-tight duration-700 sm:text-5xl">
          كن من أول <span className="text-gradient-brand">100 مشترك</span>
          <br />
          في كيوباي
        </h1>

        <p className="mt-5 max-w-xl animate-in fade-in text-pretty text-sm leading-relaxed text-muted-foreground duration-1000 sm:text-base">
          احجز مكانك الآن واحصل على خصم خاص لا يتكرر عند الإطلاق. الحجز يستغرق
          ثانية واحدة: بريدك الإلكتروني فقط، بدون تأكيد ولا خطوات إضافية.
        </p>

        {/* العدّاد الحقيقي */}
        <section className="mt-9 w-full max-w-md animate-in fade-in slide-in-from-bottom-5 rounded-2xl border border-border/70 bg-card/90 p-5 shadow-card backdrop-blur duration-700">
          <div className="flex items-end justify-between">
            <div className="text-start">
              <div className="text-4xl font-black leading-none text-gradient-brand tabular-nums sm:text-5xl">
                {shown}
              </div>
              <div className="mt-1 text-xs font-semibold text-muted-foreground">
                محجوز من {WAITLIST_LIMIT}
              </div>
            </div>
            <div className="text-end">
              <div className="text-2xl font-black leading-none tabular-nums">{remaining}</div>
              <div className="mt-1 text-xs font-semibold text-muted-foreground">مقعد متبقٍ</div>
            </div>
          </div>
          <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-brand transition-all duration-1000 ease-out"
              style={{ width: `${Math.max(percent, count > 0 ? 4 : 0)}%` }}
            />
          </div>
        </section>

        {/* خطوات الحجز */}
        <div className="mt-8 w-full max-w-md">
          {step === "intro" && (
            <div className="animate-in fade-in zoom-in-95 duration-500">
              <Button
                size="lg"
                className="w-full shadow-glow transition-transform hover:-translate-y-0.5"
                onClick={() => setStep("email")}
              >
                أنا مستعد أبدأ — احجز مكاني
              </Button>
              <p className="mt-3 text-xs text-muted-foreground">
                بدون بطاقة، بدون التزام، وبدون رسائل تأكيد.
              </p>
            </div>
          )}

          {step === "email" && (
            <form
              onSubmit={handleSubmit}
              className="animate-in fade-in slide-in-from-bottom-3 space-y-3 duration-500"
            >
              <Input
                ref={inputRef}
                type="email"
                required
                dir="ltr"
                maxLength={255}
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 text-center text-base"
              />
              <Button
                type="submit"
                size="lg"
                disabled={submitting}
                className="w-full shadow-glow transition-transform hover:-translate-y-0.5"
              >
                {submitting ? "جارٍ الحجز…" : "أكّد الحجز واحصل على الخصم"}
              </Button>
              <button
                type="button"
                onClick={() => setStep("intro")}
                className="text-xs text-muted-foreground underline-offset-4 hover:underline"
              >
                رجوع
              </button>
            </form>
          )}

          {step === "done" && (
            <div className="animate-in fade-in zoom-in-95 rounded-2xl border border-border/70 bg-card/95 p-6 shadow-elegant duration-500">
              <div className="mx-auto grid h-14 w-14 animate-in zoom-in-50 place-items-center rounded-full bg-gradient-brand text-2xl text-primary-foreground shadow-glow duration-700">
                ✓
              </div>
              <h2 className="mt-4 text-xl font-black">مكانك محجوز</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                أنت رقم{" "}
                <span className="font-black text-foreground tabular-nums">{position}</span>{" "}
                في قائمة المؤسسين. سنراسلك على بريدك عند الإطلاق مع خصمك الخاص.
              </p>
            </div>
          )}
        </div>

        {/* أهم الميزات */}
        <section className="mt-14 w-full text-start">
          <h2 className="text-lg font-bold">ماذا يفعل كيوباي فعلًا؟</h2>
          <ul className="mt-4 space-y-3">
            {FEATURES.map((f, i) => (
              <li
                key={f}
                className="flex animate-in fade-in slide-in-from-bottom-2 items-start gap-3 rounded-xl border border-border/60 bg-card/80 p-4 text-sm leading-relaxed text-muted-foreground shadow-card backdrop-blur duration-700"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gradient-brand text-[11px] font-black text-primary-foreground">
                  {i + 1}
                </span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </section>

        {step !== "done" && (
          <Button
            size="lg"
            className="mt-10 w-full max-w-md shadow-glow transition-transform hover:-translate-y-0.5"
            onClick={() => {
              setStep("email");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            احجز مكانك بين أول {WAITLIST_LIMIT}
          </Button>
        )}
      </main>
    </div>
  );
}
