/**
 * Password Input Component
 * Secure password input with visibility toggle
 */

import { useState } from 'react';
import { Eye, EyeOff, Check, X } from 'lucide-react';

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  showStrength?: boolean;
  minLength?: number;
  disabled?: boolean;
}

export function PasswordInput({
  value,
  onChange,
  placeholder = 'Enter password',
  label,
  showStrength = false,
  minLength = 8,
  disabled = false,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const strength = showStrength ? getPasswordStrength(value, minLength) : null;

  return (
    <div className="flex flex-col gap-2">
      {label && <label className="text-sm text-slate-400">{label}</label>}

      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-4 py-3 pr-12 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      {showStrength && value.length > 0 && (
        <div className="flex flex-col gap-2">
          {/* Strength bar */}
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  level <= strength!.level
                    ? strength!.level <= 1
                      ? 'bg-red-500'
                      : strength!.level <= 2
                      ? 'bg-yellow-500'
                      : strength!.level <= 3
                      ? 'bg-blue-500'
                      : 'bg-green-500'
                    : 'bg-slate-700'
                }`}
              />
            ))}
          </div>

          {/* Requirements */}
          <div className="text-xs space-y-1">
            <Requirement met={value.length >= minLength}>
              At least {minLength} characters
            </Requirement>
            <Requirement met={/[A-Z]/.test(value)}>
              One uppercase letter
            </Requirement>
            <Requirement met={/[a-z]/.test(value)}>
              One lowercase letter
            </Requirement>
            <Requirement met={/[0-9]/.test(value)}>One number</Requirement>
          </div>
        </div>
      )}
    </div>
  );
}

function Requirement({ met, children }: { met: boolean; children: React.ReactNode }) {
  return (
    <div className={`flex items-center gap-1 ${met ? 'text-green-400' : 'text-slate-500'}`}>
      {met ? <Check size={12} /> : <X size={12} />}
      <span>{children}</span>
    </div>
  );
}

interface PasswordStrength {
  level: number; // 1-4
  label: string;
}

function getPasswordStrength(password: string, minLength: number): PasswordStrength {
  let score = 0;

  if (password.length >= minLength) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (password.length >= 12) score++;

  const level = Math.min(4, Math.floor(score / 1.5));

  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  return { level, label: labels[level] };
}

/**
 * Check if password meets minimum requirements
 */
export function isPasswordValid(password: string, minLength: number = 8): boolean {
  return (
    password.length >= minLength &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)
  );
}
