type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline' | 'dark';
};

export default function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center font-bold transition-colors";
  
  const variants = {
    primary: "bg-primary text-white rounded-full px-6 py-2 uppercase text-[12px] md:text-[15px] hover:bg-primary/90",
    outline: "border border-black bg-white text-black px-4 py-2 uppercase text-[12px] md:text-[15px] hover:bg-gray-100",
    dark: "bg-black text-white rounded-full px-5 py-2 text-[12px] md:text-[13px] hover:bg-gray-800"
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}