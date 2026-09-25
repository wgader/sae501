// components/shared/Stepper.tsx
export default function Stepper({ currentStep = 1 }: { currentStep?: number }) {
  const steps = [
    { num: 1, label: 'Votre association' },
    { num: 2, label: 'Contacts & responsables' },
    { num: 3, label: 'Documents justificatifs' },
    { num: 4, label: 'Confirmation' },
  ];

  return (
    <div className="w-full py-6 sm:py-10">
      <div className="mb-8 sm:mb-10 px-4 text-center">
        <h1 className="mb-3 text-2xl font-black uppercase tracking-tight text-[#1e2420] sm:text-3xl">
          Inscrire mon association
        </h1>
        <p className="text-xs text-[#6d746e] sm:text-sm">
          Complétez votre dossier en 4 étapes — la mairie validera votre inscription sous 48h ouvrées ⚙️
        </p>
      </div>
      
      <div className="mx-auto flex max-w-4xl items-center px-2 sm:px-4">
        {steps.map((step, index) => {
          const isActive = step.num === currentStep;
          const isCompleted = step.num < currentStep;

          return (
            <div key={step.num} className="flex flex-1 items-center last:flex-none">
              <div className="relative z-10 flex w-full flex-col items-center gap-2 sm:gap-3">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold sm:h-8 sm:w-8 sm:text-sm ${
                    isActive || isCompleted
                      ? 'bg-[#0b644d] text-white'
                      : 'border-2 border-[#d9ded9] bg-white text-[#d9ded9]'
                  }`}
                >
                  {isCompleted ? (
                    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.num
                  )}
                </div>
                <span
                  className={`hidden text-center text-[10px] font-bold uppercase tracking-wider md:block sm:text-xs ${
                    isActive || isCompleted ? 'text-[#0b644d]' : 'text-[#6d746e]'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`mx-1 h-0.5 flex-1 sm:mx-2 md:-mt-6 ${
                    isCompleted ? 'bg-[#0b644d]' : 'bg-[#d9ded9]'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
      
      <div className="mt-6 text-center text-xs font-medium text-[#6d746e] sm:mt-8 md:hidden">
        Etape {currentStep} sur 4 - {steps[currentStep - 1].label}
      </div>
    
    </div>
  );
}