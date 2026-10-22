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
    'inline-flex items-center justify-center rounded-control transition-colors';

  const variants = {
    selected: 'size-icon-button bg-white text-black hover:bg-gray-50',
    unselected: 'size-icon-button bg-transparent text-black hover:bg-gray-100',
    
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
