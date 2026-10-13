'use client';
import { createContext, useContext, useState, ReactNode } from 'react';

type AssociationData = {
  nom: string;
  numeroRna: string;
  numeroSiret: string;
  dateCreation: string;
  nombreMembres: number;
  categorieActivite: string;
  objet: string;
  adresseSiegeSocial: string;
  siteWeb: string;
};

type UserData = {
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  password: string;
};

type SignupContextType = {
  association: AssociationData;
  setAssociation: (data: Partial<AssociationData>) => void;
  user: UserData;
  setUser: (data: Partial<UserData>) => void;
  cguAccepted: boolean;
  setCguAccepted: (val: boolean) => void;
};

const SignupContext = createContext<SignupContextType | undefined>(undefined);

export function SignupProvider({ children }: { children: ReactNode }) {
  const [association, setAssociationState] = useState<AssociationData>({
    nom: '',
    numeroRna: '',
    numeroSiret: '',
    dateCreation: '',
    nombreMembres: 0,
    categorieActivite: 'Toutes les catégories',
    objet: '',
    adresseSiegeSocial: '',
    siteWeb: ''
  });

  const [user, setUserState] = useState<UserData>({
    nom: '',
    prenom: '',
    telephone: '',
    email: '',
    password: ''
  });

  const [cguAccepted, setCguAccepted] = useState(false);

  const setAssociation = (data: Partial<AssociationData>) => setAssociationState(prev => ({ ...prev, ...data }));
  const setUser = (data: Partial<UserData>) => setUserState(prev => ({ ...prev, ...data }));

  return (
    <SignupContext.Provider value={{ association, setAssociation, user, setUser, cguAccepted, setCguAccepted }}>
      {children}
    </SignupContext.Provider>
  );
}

export const useSignupContext = () => {
  const context = useContext(SignupContext);
  if (!context) throw new Error("useSignupContext must be used within a SignupProvider");
  return context;
};
