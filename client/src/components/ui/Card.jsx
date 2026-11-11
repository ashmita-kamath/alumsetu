/**
 * A simple white card with rounded corners and a soft shadow.
 *
 * Used everywhere: feature blocks on the landing page,
 * alumni cards in the directory, dashboard panels, etc.
 *
 * Pass className to override padding or width when needed.
 */
export default function Card({ children, className = "", ...rest }) {
  return (
    <div
      className={`rounded-xl bg-card shadow-sm border border-gray-100 p-6 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
