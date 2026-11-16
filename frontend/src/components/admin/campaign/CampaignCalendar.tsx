import { useEffect, useMemo, useState } from 'react';
import { getSalles } from '@/lib/api/salles';
import type { Salle } from '@/lib/api/types';

export interface CalendarEventSlot {
  id: string;
  associationNom: string;
  salleNom: string;
  salleId: string;
  dateStr: string; // YYYY-MM-DD
  startHour: number; // ex: 9
  startMinute?: number;
  endHour: number; // ex: 12
  endMinute?: number;
  hasConflict?: boolean;
  conflictGroupId?: string;
  statut: 'Validée' | 'En conflit' | 'En attente';
  motif?: string;
  contactNom?: string;
}

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const FALLBACK_SALLES = [
  { id: 'gymnase', label: 'Gymnase municipal' },
  { id: 'fetes', label: 'Salle des fêtes' },
  { id: 'reunion', label: 'Salle de réunion' },
  { id: 'complexe', label: 'Complexe sportif' },
];

const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

interface CampaignCalendarProps {
  onSelectEvent?: (event: CalendarEventSlot) => void;
}

export default function CampaignCalendar({ onSelectEvent }: CampaignCalendarProps) {
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [selectedSalleId, setSelectedSalleId] = useState<string>('all');
  const [selectedEventModal, setSelectedEventModal] = useState<CalendarEventSlot | null>(null);
  const [salles, setSalles] = useState<Salle[]>([]);

  // Date actuelle réelle
  const today = useMemo(() => new Date(), []);

  useEffect(() => {
    let isMounted = true;
    void getSalles()
      .then((data) => {
        if (isMounted) setSalles(data.filter((salle) => salle.isActive && !salle.deletedAt));
      })
      .catch(() => {
        // The sample calendar remains usable if the administration API is unavailable.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const availableSalles = useMemo(
    () => (salles.length > 0
      ? salles.map((salle) => ({ id: slugify(salle.nom), label: salle.nom }))
      : FALLBACK_SALLES),
    [salles]
  );

  // Calcul dynamique du lundi de la semaine sélectionnée (100% réel)
  const mondayOfWeek = useMemo(() => {
    const d = new Date(today);
    const day = d.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diffToMonday + weekOffset * 7);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [today, weekOffset]);

  // Les 7 jours réels de la semaine affichée
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(mondayOfWeek);
      date.setDate(mondayOfWeek.getDate() + i);

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const dayOfMonth = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${dayOfMonth}`;

      const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();

      return {
        name: DAY_NAMES[i],
        dayNumber: date.getDate(),
        fullDate: date,
        dateStr,
        isToday,
      };
    });
  }, [mondayOfWeek, today]);

  // Libellé naturel de la semaine (pas de majuscule forcée sur "du" et "au")
  const weekTitle = useMemo(() => {
    const startDay = weekDays[0].dayNumber;
    const endDay = weekDays[6].dayNumber;
    const startMonth = weekDays[0].fullDate.toLocaleDateString('fr-FR', { month: 'long' });
    const endMonth = weekDays[6].fullDate.toLocaleDateString('fr-FR', { month: 'long' });
    const year = weekDays[6].fullDate.getFullYear();

    if (startMonth === endMonth) {
      return `Semaine du ${startDay} au ${endDay} ${startMonth} ${year}`;
    }
    return `Semaine du ${startDay} ${startMonth} au ${endDay} ${endMonth} ${year}`;
  }, [weekDays]);

  // Réservations de créneaux rattachées aux jours réels
  const allEvents = useMemo<CalendarEventSlot[]>(() => {
    const lunStr = weekDays[0].dateStr;
    const marStr = weekDays[1].dateStr;
    const merStr = weekDays[2].dateStr;
    const jeuStr = weekDays[3].dateStr;

    return [
      // Lundi : Conflit sur le Gymnase municipal de 09h à 12h
      {
        id: `conf-nord-${lunStr}`,
        associationNom: 'Foot Club Nord',
        salleNom: 'Gymnase municipal',
        salleId: 'gymnase',
        dateStr: lunStr,
        startHour: 9,
        endHour: 12,
        hasConflict: true,
        conflictGroupId: 'conf-gym-09-12',
        statut: 'En conflit',
        motif: 'Entraînement annuel équipe première et U18',
        contactNom: 'Marc Vasseur (Président)',
      },
      {
        id: `conf-sud-${lunStr}`,
        associationNom: 'Foot Club Sud',
        salleNom: 'Gymnase municipal',
        salleId: 'gymnase',
        dateStr: lunStr,
        startHour: 9,
        endHour: 12,
        hasConflict: true,
        conflictGroupId: 'conf-gym-09-12',
        statut: 'En conflit',
        motif: 'Tournoi et entraînements des jeunes du club',
        contactNom: 'Sophie Laurent (Secrétaire générale)',
      },
      {
        id: `gym-senior-${lunStr}`,
        associationNom: 'Gym Senior Feytiat',
        salleNom: 'Salle des fêtes',
        salleId: 'fetes',
        dateStr: lunStr,
        startHour: 14,
        endHour: 18,
        statut: 'Validée',
        motif: 'Cours de gymnastique douce et étirements',
        contactNom: 'Hélène Roche',
      },

      // Mardi : 3 demandes
      {
        id: `photo-mar-${marStr}`,
        associationNom: 'Club Photo Passion',
        salleNom: 'Salle de réunion',
        salleId: 'reunion',
        dateStr: marStr,
        startHour: 10,
        endHour: 13,
        statut: 'En attente',
        motif: 'Atelier de retouche numérique et tirages',
        contactNom: 'Alexandre Mercier',
      },
      {
        id: `foot-mar-${marStr}`,
        associationNom: 'Foot Club Nord',
        salleNom: 'Gymnase municipal',
        salleId: 'gymnase',
        dateStr: marStr,
        startHour: 14,
        endHour: 18,
        statut: 'Validée',
        motif: 'Séance hebdomadaire catégorie benjamins',
        contactNom: 'Marc Vasseur',
      },
      {
        id: `danse-mar-${marStr}`,
        associationNom: 'Danse Moderne',
        salleNom: 'Salle de réunion',
        salleId: 'reunion',
        dateStr: marStr,
        startHour: 15,
        endHour: 19,
        statut: 'Validée',
        motif: 'Répétitions scéniques et chorégraphies',
        contactNom: 'Julie Bordas',
      },

      // Mercredi : Activités bien réparties
      {
        id: `arts-mer-${merStr}`,
        associationNom: 'Cercle des Peintres',
        salleNom: 'Salle de réunion',
        salleId: 'reunion',
        dateStr: merStr,
        startHour: 10,
        endHour: 14,
        statut: 'Validée',
        motif: 'Pratique libre peinture et aquarelle',
        contactNom: 'Claire Dumas',
      },
      {
        id: `bad-mer-${merStr}`,
        associationNom: 'Badminton Club',
        salleNom: 'Complexe sportif',
        salleId: 'complexe',
        dateStr: merStr,
        startHour: 18,
        endHour: 22,
        statut: 'En attente',
        motif: 'Entraînement loisirs adultes et compétitions',
        contactNom: 'Thomas Bernard',
      },

      // Jeudi : Salle des fêtes
      {
        id: `theatre-jeu-${jeuStr}`,
        associationNom: 'Troupe Théâtre Feytiacois',
        salleNom: 'Salle des fêtes',
        salleId: 'fetes',
        dateStr: jeuStr,
        startHour: 19,
        endHour: 22,
        statut: 'Validée',
        motif: 'Répétition de la pièce de fin de saison',
        contactNom: 'Antoine Guérin',
      },
    ];
  }, [weekDays]);

  // Événements filtrés selon la salle sélectionnée
  const filteredEvents = useMemo(() => {
    if (selectedSalleId === 'all') return allEvents;
    return allEvents.filter((e) => e.salleId === selectedSalleId);
  }, [allEvents, selectedSalleId]);

  // Compteurs pour chaque salle
  const salleCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allEvents.length };
    for (const salle of availableSalles) {
      counts[salle.id] = allEvents.filter((e) => e.salleId === salle.id).length;
    }
    return counts;
  }, [allEvents, availableSalles]);

  // Statistiques globales de la semaine
  const stats = useMemo(() => {
    const total = filteredEvents.length;
    const validated = filteredEvents.filter((e) => e.statut === 'Validée').length;
    const pending = filteredEvents.filter((e) => e.statut === 'En attente').length;
    const conflicts = new Set(
      filteredEvents.filter((e) => e.hasConflict).map((e) => e.conflictGroupId)
    ).size;
    return { total, validated, pending, conflicts };
  }, [filteredEvents]);

  const handleCardClick = (slot: CalendarEventSlot) => {
    if (onSelectEvent) {
      onSelectEvent(slot);
    } else {
      setSelectedEventModal(slot);
    }
  };

  return (
    <div className="overflow-hidden rounded-card border border-line bg-white shadow-card">
      {/* 1. Header principal du calendrier (design inspiré Linear / Stripe) */}
      <div className="border-b border-line bg-white px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Titre & Date */}
          <div className="flex min-w-0 items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-primary-soft text-primary">
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                <h2 className="min-w-0 truncate text-lg font-bold tracking-heading text-ink sm:text-xl">
                  Calendrier — {weekTitle}
                </h2>

                {/* Contrôles de navigation temporelle réels */}
                <div className="flex h-9 shrink-0 items-center gap-1 rounded-control border border-line bg-paper/60 p-1">
                  <button
                    type="button"
                    onClick={() => setWeekOffset((prev) => prev - 1)}
                    aria-label="Semaine précédente"
                    className="flex h-7 w-7 items-center justify-center rounded text-muted transition hover:bg-white hover:text-ink cursor-pointer"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWeekOffset(0)}
                    className={`min-w-24 rounded px-2 py-1 text-xs font-semibold transition cursor-pointer ${
                      weekOffset === 0
                        ? 'bg-white font-bold text-primary shadow-2xs'
                        : 'text-muted hover:text-ink'
                    }`}
                  >
                    Aujourd&apos;hui
                  </button>
                  <button
                    type="button"
                    onClick={() => setWeekOffset((prev) => prev + 1)}
                    aria-label="Semaine suivante"
                    className="flex h-7 w-7 items-center justify-center rounded text-muted transition hover:bg-white hover:text-ink cursor-pointer"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Compteurs dynamiques raffinés */}
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                <span className="font-semibold text-ink">{stats.total} demandes</span>
                <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {stats.validated} validées
                </span>
                <span className="inline-flex items-center gap-1 font-medium text-amber-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  {stats.pending} en attente
                </span>
                {stats.conflicts > 0 && (
                  <span className="inline-flex items-center gap-1 font-bold text-rose-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
                    {stats.conflicts} conflit{stats.conflicts > 1 ? 's' : ''} à arbitrer
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Toggle Hebdomadaire / Mensuel */}
          <div className="flex self-start items-center gap-1 rounded-control border border-line bg-paper p-1 text-xs font-semibold lg:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('weekly')}
              className={`rounded-control px-3.5 py-1.5 transition-all cursor-pointer ${
                viewMode === 'weekly'
                  ? 'bg-white font-bold text-primary shadow-xs'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Hebdomadaire
            </button>
            <button
              type="button"
              onClick={() => setViewMode('monthly')}
              className={`rounded-lg px-3.5 py-1.5 transition-all cursor-pointer ${
                viewMode === 'monthly'
                  ? 'bg-white font-bold text-primary shadow-xs'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Mensuel
            </button>
          </div>
        </div>

        {/* 2. Barre de filtres par salle (vue globale ou par salle spécifique) */}
        <div className="mt-4 flex items-start justify-between gap-3 overflow-x-auto border-t border-line/60 pt-4">
          <div className="flex min-w-max items-center gap-2">
            <span className="mr-1 shrink-0 text-xs font-bold uppercase tracking-wider text-muted">
              Salle
            </span>
            {[{ id: 'all', label: 'Toutes les salles' }, ...availableSalles].map((salle) => {
              const isSelected = selectedSalleId === salle.id;
              const count = salleCounts[salle.id] ?? 0;

              return (
                <button
                  key={salle.id}
                  type="button"
                  onClick={() => setSelectedSalleId(salle.id)}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-paper text-ink hover:bg-white'
                  }`}
                >
                  <span>{salle.label}</span>
                  <span className={`text-xs font-normal ${isSelected ? 'text-white/75' : 'text-muted'}`}>({count})</span>
                </button>
              );
            })}
          </div>

          {selectedSalleId !== 'all' && (
            <button
              type="button"
              onClick={() => setSelectedSalleId('all')}
              className="text-xs text-primary font-bold hover:underline shrink-0 cursor-pointer"
            >
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* 3. Vue du calendrier */}
      {viewMode === 'monthly' ? (
        /* Vue mensuelle synthétique */
        <div className="p-6">
          <div
            style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}
            className="grid gap-2 text-center text-xs font-bold uppercase tracking-wider text-muted pb-3 border-b border-line"
          >
            {DAY_NAMES.map((name) => (
              <div key={name}>{name}</div>
            ))}
          </div>

          <div
            style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}
            className="mt-3 grid gap-2"
          >
            {Array.from({ length: 35 }, (_, idx) => {
              const dayDate = new Date(mondayOfWeek);
              dayDate.setDate(mondayOfWeek.getDate() + idx - 7);
              const dayNum = dayDate.getDate();
              const isCurrentWeek = idx >= 7 && idx < 14;

              return (
                <div
                  key={idx}
                  onClick={() => setViewMode('weekly')}
                  className={`min-h-24 rounded-xl border p-2.5 text-left transition cursor-pointer ${
                    isCurrentWeek
                      ? 'border-primary/40 bg-primary/5 hover:border-primary'
                      : 'border-line/60 bg-paper/30 opacity-70 hover:opacity-100'
                  }`}
                >
                  <span className="text-sm font-bold text-ink">{dayNum}</span>
                  {idx === 7 && (
                    <div className="mt-1 space-y-1">
                      <span className="block truncate rounded bg-rose-100 px-1.5 py-0.5 text-2xs font-bold text-rose-800 border border-rose-300">
                        2 en conflit
                      </span>
                      <span className="block truncate rounded bg-emerald-100 px-1.5 py-0.5 text-2xs font-semibold text-emerald-800">
                        Gym Senior
                      </span>
                    </div>
                  )}
                  {idx === 8 && (
                    <div className="mt-1 space-y-1">
                      <span className="block truncate rounded bg-slate-100 px-1.5 py-0.5 text-2xs font-semibold text-slate-700">
                        3 réservations
                      </span>
                    </div>
                  )}
                  {idx === 9 && (
                    <div className="mt-1 space-y-1">
                      <span className="block truncate rounded bg-sky-100 px-1.5 py-0.5 text-2xs font-semibold text-sky-800">
                        2 réservations
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Vue grille hebdomadaire professionnelle */
        <div className="overflow-x-auto">
          <div style={{ minWidth: '55rem' }}>
            {/* Header des jours */}
            <div
              style={{ gridTemplateColumns: '4.5rem repeat(7, minmax(0, 1fr))' }}
              className="grid border-b border-line bg-paper/50"
            >
              <div className="border-r border-line p-3 text-center text-xs font-bold uppercase tracking-wider text-muted">
                Heures
              </div>

              {weekDays.map((day) => {
                const dayEvents = filteredEvents.filter((e) => e.dateStr === day.dateStr);
                const count = dayEvents.length;

                return (
                  <div
                    key={day.dateStr}
                    className={`flex items-center justify-between border-r border-line px-3.5 py-3 last:border-r-0 ${
                      day.isToday ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-sm font-bold ${
                          day.isToday ? 'text-primary' : 'text-ink'
                        }`}
                      >
                        {day.name} {day.dayNumber}
                      </span>
                      {day.isToday && (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-label="Aujourd'hui" />
                      )}
                    </div>

                    <span
                      className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold ${
                        count > 0 ? 'bg-line/80 text-ink' : 'bg-paper text-muted'
                      }`}
                    >
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Corps de la grille horaire */}
            <div
              style={{ gridTemplateColumns: '4.5rem repeat(7, minmax(0, 1fr))' }}
              className="relative grid bg-white"
            >
              {/* Colonne des heures */}
              <div className="border-r border-line bg-paper/20">
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="h-16 border-b border-line/60 pr-2.5 pt-1 text-right text-xs font-medium text-muted"
                  >
                    {String(hour).padStart(2, '0')}h
                  </div>
                ))}
              </div>

              {/* 7 colonnes pour les jours de la semaine */}
              {weekDays.map((day) => {
                const dayEvents = filteredEvents.filter((e) => e.dateStr === day.dateStr);
                const hasConflictInDay = dayEvents.some((e) => e.hasConflict);

                return (
                  <div
                    key={day.dateStr}
                    className="relative border-r border-line/60 last:border-r-0"
                  >
                    {/* Lignes de fond horaires */}
                    {HOURS.map((hour) => (
                      <div
                        key={hour}
                        className="h-16 border-b border-line/40 hover:bg-paper/30 transition-colors"
                      />
                    ))}

                    {/* État vide si aucune demande sur le jour */}
                    {dayEvents.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-xs font-medium text-muted/50">
                          Aucune demande
                        </span>
                      </div>
                    )}

                    {/* Cartes d'événements positionnées */}
                    {dayEvents.map((slot) => {
                      const topRem = (slot.startHour - 8) * 4;
                      const duration = slot.endHour - slot.startHour;
                      const heightRem = Math.max(duration * 4 - 0.25, 3.2);

                      const isConflict = slot.hasConflict;

                      // Positionnement côte à côte pour les deux réservations en conflit sur le même créneau
                      let horizontalPos = 'left-1.5 right-1.5';
                      if (isConflict && hasConflictInDay) {
                        if (slot.id.includes('nord')) {
                          horizontalPos = 'left-1 right-1/2 mr-1';
                        } else if (slot.id.includes('sud')) {
                          horizontalPos = 'left-1/2 right-1 ml-1';
                        }
                      }

                      // Variantes de style professionnelles selon le statut
                      let cardStyle = 'border-l-4 border-l-emerald-500 bg-white border-line hover:border-emerald-300 text-ink';
                      if (isConflict) {
                        cardStyle = 'border-l-4 border-l-rose-500 bg-rose-50/70 border-rose-300 text-rose-950 shadow-xs';
                      } else if (slot.statut === 'En attente') {
                        cardStyle = 'border-l-4 border-l-amber-500 bg-amber-50/40 border-amber-200 text-ink hover:border-amber-400';
                      }

                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => handleCardClick(slot)}
                          style={{
                            top: `${topRem}rem`,
                            height: `${heightRem}rem`,
                          }}
                          className={`absolute ${horizontalPos} z-10 flex flex-col justify-between overflow-hidden rounded-xl border p-2.5 text-left transition-all hover:shadow-md cursor-pointer ${cardStyle}`}
                        >
                          <div>
                            {/* Nom de l'association */}
                            <div className="flex items-center justify-between gap-1">
                              <h3
                                className={`text-xs font-black leading-tight truncate ${
                                  isConflict ? 'text-rose-900' : 'text-ink'
                                }`}
                              >
                                {slot.associationNom}
                              </h3>
                              {isConflict && (
                                <span                                 className="inline-flex shrink-0 items-center rounded-control bg-rose-200/80 px-1 py-0.5 text-caption font-black uppercase leading-none text-rose-900">
                                  Conflit
                                </span>
                              )}
                            </div>

                            {/* Nom de la salle avec badge discret */}
                            <p
                              className={`mt-1 text-xs font-semibold truncate ${
                                isConflict ? 'text-rose-700' : 'text-primary'
                              }`}
                            >
                              {slot.salleNom}
                            </p>
                          </div>

                          {/* Horaires et statut en bas */}
                          <div className="mt-2 flex items-center justify-between gap-2 border-t border-black/5 pt-1">
                            <span
                              className={`text-xs font-bold ${
                                isConflict ? 'text-rose-800' : 'text-muted'
                              }`}
                            >
                              {String(slot.startHour).padStart(2, '0')}h–{String(slot.endHour).padStart(2, '0')}h
                            </span>
                            <span
                              className={`shrink-0 rounded-control px-1.5 py-0.5 text-caption font-bold leading-none ${
                                isConflict
                                  ? 'bg-rose-100 text-rose-800'
                                  : slot.statut === 'Validée'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {slot.statut}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4. Modale de détail d'un créneau au clic */}
      {selectedEventModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setSelectedEventModal(null)}
          />
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 sm:p-8 shadow-2xl border border-line">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Détail du vœu annuel de créneau
                </span>
                <h3 className="text-xl font-black text-ink mt-1">
                  {selectedEventModal.associationNom}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEventModal(null)}
                aria-label="Fermer"
                className="rounded-lg p-1.5 text-muted hover:text-ink hover:bg-paper cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-3.5 text-sm">
              <div className="flex justify-between border-b border-line/60 pb-2.5">
                <span className="text-muted">Salle sollicitée :</span>
                <span className="font-bold text-ink">
                  {selectedEventModal.salleNom}
                </span>
              </div>
              <div className="flex justify-between border-b border-line/60 pb-2.5">
                <span className="text-muted">Jour & Horaire :</span>
                <span className="font-bold text-ink">
                  {new Date(selectedEventModal.dateStr).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}{' '}
                  de {selectedEventModal.startHour}h00 à {selectedEventModal.endHour}h00
                </span>
              </div>
              <div className="flex justify-between border-b border-line/60 pb-2.5">
                <span className="text-muted">Statut du dossier :</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    selectedEventModal.hasConflict
                      ? 'bg-rose-100 text-rose-800'
                      : selectedEventModal.statut === 'Validée'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {selectedEventModal.statut}
                </span>
              </div>
              {selectedEventModal.motif && (
                <div className="flex justify-between border-b border-line/60 pb-2.5">
                  <span className="text-muted">Motif déclaré :</span>
                  <span className="font-semibold text-ink text-right max-w-xs">
                    {selectedEventModal.motif}
                  </span>
                </div>
              )}
              {selectedEventModal.contactNom && (
                <div className="flex justify-between border-b border-line/60 pb-2.5">
                  <span className="text-muted">Représentant :</span>
                  <span className="font-semibold text-ink">
                    {selectedEventModal.contactNom}
                  </span>
                </div>
              )}

              {selectedEventModal.hasConflict && (
                <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-xs font-semibold text-rose-900 leading-relaxed">
                  <strong>Conflit d’attribution détecté :</strong> Une autre association a également sollicité ce même créneau sur {selectedEventModal.salleNom}. Un arbitrage municipal est nécessaire avant validation de la grille de rentrée.
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedEventModal(null)}
                className="rounded-control bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-primary-hover cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
