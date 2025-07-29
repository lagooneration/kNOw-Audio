import { cn } from '../../lib/utils';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function ToggleSwitch({
  checked,
  onChange,
  size = 'md',
  label,
  disabled = false,
  className
}: ToggleSwitchProps) {
  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'w-8 h-4',
          thumb: 'w-3 h-3',
          thumbTranslate: 'translate-x-4',
        };
      case 'lg':
        return {
          container: 'w-14 h-7',
          thumb: 'w-6 h-6',
          thumbTranslate: 'translate-x-7',
        };
      default:
        return {
          container: 'w-11 h-6',
          thumb: 'w-5 h-5',
          thumbTranslate: 'translate-x-5',
        };
    }
  };

  const sizeClasses = getSizeClasses();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleToggle}
        className={cn(
          "relative inline-flex shrink-0 cursor-pointer rounded-full transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          checked ? "bg-primary" : "bg-input",
          disabled && "cursor-not-allowed opacity-50",
          sizeClasses.container
        )}
      >
        <span
          className={cn(
            "pointer-events-none block rounded-full bg-background shadow-lg ring-0 transition-transform",
            sizeClasses.thumb,
            checked ? sizeClasses.thumbTranslate : "translate-x-1"
          )}
        />
      </button>
    </div>
  );
}
