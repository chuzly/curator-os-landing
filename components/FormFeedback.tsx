type Status = "idle" | "submitting" | "success" | "error";

export default function FormFeedback({
  status,
  errorMsg,
  successText,
}: {
  status: Status;
  errorMsg: string | null;
  successText: string;
}) {
  if (status === "success") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-start gap-3 border-l-2 border-[#2F7D4F] bg-[#2F7D4F]/[0.06] px-4 py-3.5"
      >
        <CheckIcon />
        <p className="text-base font-semibold leading-snug text-navy sm:text-lg">
          {successText}
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className="flex items-start gap-3 border-l-2 border-accent bg-accent/[0.06] px-4 py-3.5"
      >
        <XIcon />
        <p className="text-base font-semibold leading-snug text-accent sm:text-lg">
          {errorMsg ?? "Something went wrong."}
        </p>
      </div>
    );
  }

  return null;
}

function CheckIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      className="mt-0.5 h-5 w-5 flex-none text-[#2F7D4F] sm:h-6 sm:w-6"
    >
      <path
        d="M4.5 10.5l3.5 3.5L15.5 6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      className="mt-0.5 h-5 w-5 flex-none text-accent sm:h-6 sm:w-6"
    >
      <path
        d="M5.5 5.5l9 9M14.5 5.5l-9 9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="square"
      />
    </svg>
  );
}
