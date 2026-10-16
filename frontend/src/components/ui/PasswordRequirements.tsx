// components/ui/PasswordRequirements.tsx
export const passwordRules = [
  { label: '10 caractères minimum', test: (password: string) => password.length >= 10 },
  { label: '1 lettre en majuscule', test: (password: string) => /[A-Z]/.test(password) },
  { label: '1 lettre en minuscule', test: (password: string) => /[a-z]/.test(password) },
  { label: '1 chiffre', test: (password: string) => /\d/.test(password) },
];

export function isPasswordValid(password: string) {
  return passwordRules.every((rule) => rule.test(password));
}

export default function PasswordRequirements({ password }: { password: string }) {
  const hasStarted = password.length > 0;

  return (
    <ul className="ml-4 mt-1 list-disc space-y-1 text-xs">
      {passwordRules.map((rule) => {
        const isValid = rule.test(password);
        const colorClass = isValid
          ? 'text-[#0b644d] marker:text-[#0b644d]'
          : hasStarted
          ? 'text-[#b54b4b] marker:text-[#b54b4b]'
          : 'text-[#6d746e] marker:text-[#d9ded9]';

        return (
          <li key={rule.label} className={`${colorClass} transition-colors`}>
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}