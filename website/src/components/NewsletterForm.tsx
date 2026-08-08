// Preact island: the homepage newsletter signup form. Scope is deliberately
// narrow — email input, honeypot, submit button, and the aria-live status
// region (per 04-UI-SPEC.md's Section Anatomy). Heading, pitch line, and
// privacy note are static Astro markup rendered outside this island.
import { useEffect, useRef, useState } from 'preact/hooks';

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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function NewsletterForm({ listmonkUrl, listUuid }: Props) {
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [mounted, setMounted] = useState(false);
  // Synchronous reentrancy guard — status-derived `disabled` attributes only
  // take effect after the next render, which is too late to stop a second
  // `handleSubmit` invocation fired before that commit (rapid double-click,
  // double-tap, or repeated Enter while the first request is in flight).
  const inFlightRef = useRef(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const statusRegionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Move keyboard focus to the source of the error on entry, so a
  // keyboard/screen-reader user whose focus has drifted away from the form
  // (e.g. tabbed past it while `submitting`) doesn't rely on `aria-live`
  // alone to notice the change. Validation errors focus the input itself
  // (its `aria-describedby` already ties it to the status message);
  // network errors aren't tied to a specific field, so focus the status
  // region instead.
  useEffect(() => {
    if (status === 'error-validation') {
      emailInputRef.current?.focus();
    } else if (status === 'error-network') {
      statusRegionRef.current?.focus();
    }
  }, [status]);

  async function handleSubmit(e: Event) {
    e.preventDefault();

    if (inFlightRef.current) {
      return;
    }

    inFlightRef.current = true;

    if (honeypot) {
      // Bot detected: silently render the exact same success UI as a genuine
      // signup, with no network call and no separate visual state — the
      // caught bot gains no signal that it was caught (04-UI-SPEC.md
      // Honeypot Spec). Checked FIRST, independent of email validity, so a
      // bot that fills the honeypot but submits a malformed email never sees
      // a different (validation-error) response than one that submits a
      // well-formed email — the honeypot path must not be conditional on
      // anything else. A randomized delay approximates real network latency
      // so a bot doing simple response-timing analysis can't distinguish
      // this instant local branch from a genuine round trip to Listmonk.
      await new Promise((resolve) => setTimeout(resolve, 400 + Math.random() * 500));
      setStatus('success');
      inFlightRef.current = false;
      return;
    }

    if (!EMAIL_PATTERN.test(email)) {
      setStatus('error-validation');
      inFlightRef.current = false;
      return;
    }

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
      // 409 status; neither signal means what it looks like it means. Echo's
      // error responses use a `{"message": ...}` envelope, not `{"data": ...}`
      // — don't attempt to parse a non-2xx body as the success shape.
      if (!res.ok) {
        setStatus('error-network');
        return;
      }

      const json = await res.json().catch(() => null);
      // `already_subscribed` is a testing artifact this project's local mock
      // invents — real Listmonk's public endpoint returns an identical 200
      // for new and repeat subscribers, so this branch is reachable only
      // against the local mock. A parse failure falls through to success,
      // never to an error.
      if (json?.data?.already_subscribed === true) {
        setStatus('already-subscribed');
      } else {
        setStatus('success');
      }
    } catch {
      // Covers AbortError (8s timeout) and TypeError (DNS/connection/CORS
      // failure) — both collapse to the single network/API error state.
      clearTimeout(timeoutId);
      setStatus('error-network');
    } finally {
      inFlightRef.current = false;
    }
  }

  const isSubmitting = status === 'submitting';
  const isSuccess = status === 'success';
  const isAlreadySubscribed = status === 'already-subscribed';
  const isValidationError = status === 'error-validation';
  const isNetworkError = status === 'error-network';

  const inputDisabled = isSubmitting || isSuccess || isAlreadySubscribed;
  const buttonDisabled = !mounted || isSubmitting || isSuccess || isAlreadySubscribed;

  let buttonLabel = 'Get the drop';
  if (isSubmitting) buttonLabel = 'Sending…';
  if (isSuccess) buttonLabel = "You're in ✓";
  if (isAlreadySubscribed) buttonLabel = 'Already subscribed';

  let statusColorClass = '';
  if (isSuccess) statusColorClass = ' text-accent';
  if (isValidationError || isNetworkError) statusColorClass = ' text-error';

  const inputBorderClass = isValidationError ? 'border-[1.5px] border-error' : 'border border-white/10';

  return (
    <form class="max-w-lg" onSubmit={handleSubmit} novalidate>
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
          ref={emailInputRef}
          type="email"
          id="newsletter-email"
          name="email"
          autocomplete="email"
          inputmode="email"
          required
          placeholder="you@email.com"
          aria-describedby="newsletter-status"
          aria-invalid={isValidationError ? 'true' : undefined}
          value={email}
          onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
          disabled={inputDisabled}
          class={`w-full md:flex-1 min-h-11 rounded-card bg-surface text-text placeholder:text-text-muted px-4 focus:border-[1.5px] focus:border-accent ${inputBorderClass}`}
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
        ref={statusRegionRef}
        id="newsletter-status"
        role="status"
        aria-live="polite"
        tabindex={-1}
        // 72px / 3 lines, not the 48px/2-line figure in 04-UI-SPEC.md — that spec
        // value undercounts: the success state renders two separate <p> elements,
        // and the second one alone wraps to 2 lines at 343px mobile width per the
        // spec's own note, so 1 (first <p>) + 2 (second <p> wrapped) = 3 lines is
        // the true CLS-safe floor. See 04-UI-SPEC.md's dated correction note
        // (2026-08-08) in the "State message region" section.
        class={`min-h-18 mt-2 w-full text-base${statusColorClass}`}
      >
        {isSuccess && (
          <>
            <p>Check your inbox to confirm.</p>
            <p>We just sent a confirmation link — click it and you're on the list.</p>
          </>
        )}
        {isAlreadySubscribed && <p>You're already on the list.</p>}
        {isValidationError && <p>Enter a valid email address.</p>}
        {isNetworkError && <p>Something went wrong. Try again in a moment.</p>}
      </div>
    </form>
  );
}
