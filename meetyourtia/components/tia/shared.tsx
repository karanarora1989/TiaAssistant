import React from 'react';

// ═══════════════════════════════════════════════════════════════
// SHARED PRIMITIVES - All reusable UI components
// ═══════════════════════════════════════════════════════════════

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'gold' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({ 
  variant = 'gold', 
  size = 'md', 
  className = '', 
  children, 
  ...props 
}: ButtonProps) {
  const baseStyles = 'rounded-2xl font-medium transition-smooth disabled:opacity-25 disabled:cursor-not-allowed';
  
  const variants = {
    gold: 'btn-gold',
    ghost: 'bg-transparent text-gold hover:bg-surface-2',
    outline: 'bg-transparent border border-border-2 text-text-primary hover:border-gold',
  };
  
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };
  
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

interface CardProps {
  children: React.ReactNode;
  shimmer?: boolean;
  shimmerStrength?: 'standard' | 'strong';
  className?: string;
  onClick?: () => void;
}

export function Card({ children, shimmer = false, shimmerStrength = 'standard', className = '', onClick }: CardProps) {
  const shimmerClass = shimmer 
    ? shimmerStrength === 'strong' 
      ? 'card-shimmer-strong' 
      : 'card-shimmer'
    : '';
  
  return (
    <div 
      className={`bg-surface-1 border border-border-2 rounded-2xl p-4 ${shimmerClass} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm text-text-secondary mb-2">
          {label}
        </label>
      )}
      <input
        className={`w-full bg-surface-3 border border-border-2 rounded-xl px-4 py-3 text-text-primary placeholder:text-text-ghost focus:border-gold focus:outline-none transition-smooth ${className}`}
        {...props}
      />
      {error && (
        <p className="text-overdue-red text-xs mt-1">{error}</p>
      )}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className = '', ...props }: TextareaProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm text-text-secondary mb-2">
          {label}
        </label>
      )}
      <textarea
        className={`w-full bg-surface-3 border border-border-2 rounded-xl px-4 py-3 text-text-primary placeholder:text-text-ghost focus:border-gold focus:outline-none transition-smooth resize-none ${className}`}
        {...props}
      />
      {error && (
        <p className="text-overdue-red text-xs mt-1">{error}</p>
      )}
    </div>
  );
}

interface ChipProps {
  children: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function Chip({ children, selected = false, onClick, className = '' }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-smooth ${
        selected
          ? 'bg-[#151008] text-gold border border-gold/30'
          : 'bg-surface-2 text-text-muted border border-border-2 hover:border-border-1'
      } ${className}`}
    >
      {children}
    </button>
  );
}

interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
}

export function ProgressBar({ progress, label }: ProgressBarProps) {
  return (
    <div className="w-full">
      {label && (
        <p className="text-[10px] font-medium tracking-wider-08 text-text-ghost uppercase mb-2">
          {label}
        </p>
      )}
      <div className="h-[1.5px] bg-border-1 rounded-full overflow-hidden">
        <div
          className="h-full bg-gold-gradient transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

interface StatusDotProps {
  color: 'gold' | 'green' | 'red' | 'indigo';
  size?: 'sm' | 'md';
}

export function StatusDot({ color, size = 'md' }: StatusDotProps) {
  const sizeClass = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5';
  const colorClass = `dot-${color}`;
  
  return <div className={`${sizeClass} rounded-full ${colorClass}`} />;
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingSpinner({ size = 'md' }: LoadingSpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };
  
  return (
    <div className={`${sizes[size]} border-2 border-gold/20 border-t-gold rounded-full animate-spin`} />
  );
}

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose?: () => void;
}

export function Toast({ message, type = 'info', onClose }: ToastProps) {
  const colors = {
    success: 'bg-done-green/10 border-done-green text-done-green-text',
    error: 'bg-overdue-red/10 border-overdue-red text-overdue-red',
    info: 'bg-gold/10 border-gold text-gold',
  };
  
  return (
    <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full border ${colors[type]} backdrop-blur-sm z-50 animate-in slide-in-from-bottom-4 duration-300`}>
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {icon && (
        <div className="text-4xl mb-4 opacity-20">{icon}</div>
      )}
      <h3 className="text-lg font-light text-text-primary mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-text-muted mb-6 max-w-xs">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} size="sm">
          {action.label}
        </Button>
      )}
    </div>
  );
}

interface TopBarProps {
  title?: string;
  backLabel?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export function TopBar({ title, backLabel, onBack, rightAction }: TopBarProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-border-1">
      {onBack ? (
        <button
          onClick={onBack}
          className="text-sm text-gold hover:text-gold-light transition-smooth"
        >
          ‹ {backLabel || 'Back'}
        </button>
      ) : (
        <div />
      )}
      
      {title && (
        <h1 className="text-[15px] font-medium text-text-primary tracking-tighter-01">
          {title}
        </h1>
      )}
      
      <div>{rightAction}</div>
    </div>
  );
}

interface BottomNavProps {
  pathname: string;
  onNavigate: (tab: 'home' | 'tasks' | 'people') => void;
}

export function BottomNav({ pathname, onNavigate }: BottomNavProps) {
  const active = pathname.startsWith('/app/people') ? 'people'
    : pathname.startsWith('/app/tasks') ? 'tasks'
    : 'home';

  const items = [
    { id: 'home' as const, label: 'Home', icon: '🏠' },
    { id: 'tasks' as const, label: 'Tasks', icon: '✓' },
    { id: 'people' as const, label: 'People', icon: '👥' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface-0 border-t border-border-1 pb-5">
      <div className="flex items-center justify-around px-6 pt-3">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className="flex flex-col items-center gap-1 transition-smooth active:scale-95 active:opacity-70"
          >
            <div className="relative">
              {active === item.id && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-1 h-1 dot-gold" />
              )}
              <span className="text-xl">{item.icon}</span>
            </div>
            <span className={`text-xs ${active === item.id ? 'text-gold' : 'text-text-ghost'}`}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}

interface FABProps {
  onClick: () => void;
  icon?: string;
}

export function FAB({ onClick, icon = '🎙' }: FABProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-[82px] right-5 w-14 h-14 rounded-full btn-gold shadow-gold-strong flex items-center justify-center text-2xl z-40 hover:scale-105 transition-smooth"
    >
      {icon}
    </button>
  );
}
