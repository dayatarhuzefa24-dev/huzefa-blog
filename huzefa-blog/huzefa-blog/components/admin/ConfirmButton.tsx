"use client";

/** A small "are you sure?" button for destructive actions that post a hidden id. */
export default function ConfirmButton({
  action,
  id,
  label,
  message,
  className = "",
}: {
  action: (formData: FormData) => void | Promise<void>;
  id: string;
  label: string;
  message: string;
  className?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className={className}>{label}</button>
    </form>
  );
}
