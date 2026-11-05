import { type Association } from '@/lib/api';

export interface AssociationCardMeta {
  imageUrl: string;
  category: string;
  membersText: string;
}

export function getAssociationCardMeta(association: Association): AssociationCardMeta {
  const nameLower = (association.nom || '').toLowerCase();

  let category = association.categorie || '';
  if (!category) {
    if (nameLower.includes('foot') || nameLower.includes('sport') || nameLower.includes('gym') || nameLower.includes('tennis')) {
      category = 'Loisirs';
    } else if (nameLower.includes('secours') || nameLower.includes('solidaire') || nameLower.includes('entraide') || nameLower.includes('croix')) {
      category = 'Solidarité';
    } else if (nameLower.includes('mobil') || nameLower.includes('sécurit') || nameLower.includes('tranquill')) {
      category = 'Cadre de vie';
    } else if (nameLower.includes('loisir') || nameLower.includes('feytiat') || nameLower.includes('art') || nameLower.includes('danse')) {
      category = 'Loisirs';
    } else if (nameLower.includes('figurine') || nameLower.includes('historique') || nameLower.includes('patrimoine') || nameLower.includes('ami')) {
      category = 'Histoire & Culture';
    }
  }

  const membersText = typeof association.nombreMembres === 'number' && association.nombreMembres > 0
    ? `${association.nombreMembres} membres`
    : 'non renseigné';

  return {
    imageUrl: association.imageUrl || '',
    category: category || 'Non renseigné',
    membersText,
  };
}
