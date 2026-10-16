type ButtonViewProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'selected' | 'unselected' ;
};

export default function ButtonView({
  variant = 'selected',
  className = '',
  children,
  ...props
}: ButtonViewProps) {
  const baseStyles =
    'inline-flex items-center justify-center rounded-[10px] transition-colors';

  const variants = {
    selected: 'h-[31px] w-[31px]  bg-white text-black hover:bg-gray-50',
    unselected: 'h-[31px] w-[31px]  bg-transparent text-black hover:bg-gray-100',
    
  };

  return (
    <button
      type={props.type ?? 'button'}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      aria-label={props['aria-label'] ?? 'Voir'}
      {...props}
    >
      
      {children}
    </button>
  );
}
