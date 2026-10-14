import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Button({
  variant = "primary",
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  children: ReactNode;
}) {
  const styles =
    variant === "danger"
      ? "btn-danger"
      : variant === "ghost"
      ? "btn-ghost"
      : variant === "secondary"
      ? "btn-secondary"
      : "btn-primary";

  return (
    <button className={`${styles} cursor-pointer ${className}`} {...props}>
      {children}
    </button>
  );
}
