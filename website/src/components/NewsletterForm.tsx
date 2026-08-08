// Preact island: the homepage newsletter signup form. Scope is deliberately
// narrow — email input, honeypot, submit button, and the aria-live status
// region (per 04-UI-SPEC.md's Section Anatomy). Heading, pitch line, and
// privacy note are static Astro markup rendered outside this island.
import { useEffect, useState } from 'preact/hooks';

type Status =
  | 'idle'
  | 'submitting'
  | 'success'
  | 'already-subscribed'
  | 'error-validation'
  | 'error-network';

interface Props {
  listmonkUrl: string;
  listUuid: string;
}

export default function NewsletterForm({ listmonkUrl, listUuid }: Props) {
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleSubmit(e: Event) {
    e.preventDefault();
    setStatus('submitting');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch(`${listmonkUrl}/api/public/subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, list_uuids: [listUuid] }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      // Real Listmonk never distinguishes new vs. already-subscribed at this
      // endpoint (verified from cmd/public.go, see 04-RESEARCH.md Common
      // Pitfalls #2) — any 2xx is success. Never branch on `has_optin` or a
      // 409 status; neither signal means what it looks like it means.
      if (!res.ok) {
        setStatus('error-network');
        return;
      }

      setStatus('success');
    } catch {
      clearTimeout(timeoutId);
      setStatus('error-network');
    }
  }

  const isSuccess = status === 'success';
  const inputDisabled = status === 'submitting' || isSuccess;
  const buttonDisabled = !mounted || status === 'submitting' || isSuccess;

  let buttonLabel = 'Get the drop';
  if (status === 'submitting') buttonLabel = 'Sending…';
  if (isSuccess) buttonLabel = "You're in ✓";

  return (
    <form class="max-w-lg" onSubmit={handleSubmit}>
      <label for="newsletter-email" class="sr-only">
        Email address
      </label>
      <div class="hp-field sr-only" aria-hidden="true">
        <label for="newsletter-hp">Leave this field empty</label>
        <input
          type="text"
          id="newsletter-hp"
          name="hp_website"
          tabindex={-1}
          autocomplete="off"
          value={honeypot}
          onInput={(e) => setHoneypot((e.target as HTMLInputElement).value)}
        />
      </div>
      <div class="md:flex md:flex-row md:items-start md:gap-3">
        <input
          type="email"
          id="newsletter-email"
          name="email"
          autocomplete="email"
          inputmode="email"
          required
          placeholder="you@email.com"
          aria-describedby="newsletter-status"
          value={email}
          onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
          disabled={inputDisabled}
          class="w-full md:flex-1 min-h-11 rounded-card bg-surface text-text placeholder:text-text-muted border border-white/10 px-4 focus:border-[1.5px] focus:border-accent"
        />
        <button
          type="submit"
          id="newsletter-submit"
          disabled={buttonDisabled}
          class="w-full mt-2 md:mt-0 md:w-auto md:shrink-0 min-h-11 rounded-full bg-accent text-bg font-semibold px-6"
        >
          {buttonLabel}
        </button>
      </div>
      <div
        id="newsletter-status"
        role="status"
        aria-live="polite"
        class={`min-h-12 mt-2 w-full text-base${isSuccess ? ' text-accent' : ''}`}
      >
        {isSuccess && (
          <>
            <p>Check your inbox to confirm.</p>
            <p>We just sent a confirmation link — click it and you're on the list.</p>
          </>
        )}
      </div>
    </form>
  );
}
