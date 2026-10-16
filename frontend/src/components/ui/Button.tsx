import type {ReactNode} from "react";
import {cva, type VariantProps} from "class-variance-authority";
import {cn} from "../../lib/utils";



const buttonVariants = cva("rounded-[10px] text-white  inline-flex items-center justify-center font-bold  transition-colors",
  {
    variants:{
      variant:{
        primary: "text-white text-2xl font-extrabold  px-6 py-2 uppercase text-2xl md:text-[15px] bg-Primary  hover:bg-Primary/90",
        thin: "font-thin px-4 py-2 uppercase text-[12px] md:text-[15px] hover:bg-gray-100 bg-Primary",
        underline: "text-Primary  font-light ] underline leading-6 tracking-wide",
        tag:""
      },
      size:{
        md:"w-96 h-[64px]"
      }
    },
    compoundVariants:[
      {},
    ],
    defaultVariants:{
      variant:"primary",
      size:"md"
      
    }
  }
);

interface ButtonProps extends  VariantProps<typeof buttonVariants> {
    children?: ReactNode;
}
export default function Button({ 
  children,
  variant,
  size,
  className ,
  ...props 
}: ButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} {...props}>
      {children}
    </button>
  );
}