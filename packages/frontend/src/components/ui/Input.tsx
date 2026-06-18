import React, { InputHTMLAttributes, forwardRef, useState, useId } from 'react';
import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            className,
            type = 'text',
            label,
            error,
            leftIcon,
            rightIcon,
            id,
            ...props
        },
        ref
    ) => {
        const [showPassword, setShowPassword] = useState(false);
        const [isFocused, setIsFocused] = useState(false);
        const generatedId = useId();
        const inputId = id || generatedId;
        const isPassword = type === 'password';
        const inputType = isPassword && showPassword ? 'text' : type;

        return (
            <div className="w-full">
                <div className="relative">
                    {leftIcon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            {leftIcon}
                        </div>
                    )}

                    <input
                        ref={ref}
                        id={inputId}
                        type={inputType}
                        className={cn(
                            'w-full h-14 px-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500',
                            'transition-all duration-200 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:focus:ring-primary-400/10',
                            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 dark:disabled:bg-slate-900',
                            error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/10',
                            leftIcon && 'pl-10',
                            (rightIcon || isPassword) && 'pr-10',
                            label && 'pt-6',
                            className
                        )}
                        placeholder={label && isFocused ? '' : props.placeholder}
                        onFocus={(e) => {
                            setIsFocused(true);
                            props.onFocus?.(e);
                        }}
                        onBlur={(e) => {
                            setIsFocused(false);
                            props.onBlur?.(e);
                        }}
                        {...props}
                    />

                    {label && (
                        <label
                            htmlFor={inputId}
                            className={cn(
                                'absolute left-4 transition-all duration-200 pointer-events-none',
                                isFocused || (props.value !== '' && props.value !== undefined && props.value !== null) || type === 'date'
                                    ? 'top-2 text-xs text-primary-600 font-medium'
                                    : 'top-1/2 -translate-y-1/2 text-sm text-slate-500',
                                leftIcon && 'left-10'
                            )}
                        >
                            {label}
                        </label>
                    )}

                    {isPassword && (
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                        >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    )}

                    {rightIcon && !isPassword && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                            {rightIcon}
                        </div>
                    )}
                </div>

                {error && (
                    <p className="mt-1 text-sm text-rose-400 animate-fade-in">{error}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export { Input };
