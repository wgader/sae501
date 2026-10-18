'use client';

import { useMemo, useState } from 'react';

export const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const weekDaysShort = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const weekDaysLong = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export const isSameDay = (d1: Date, d2: Date) => {
  return d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
};

const getRoomBg = (colorClass: string) => {
  const map: Record<string, string> = {
    'room-blue': 'bg-[#b6d0d3]',
    'room-green': 'bg-[#b9d0bc]',
    'room-orange': 'bg-[#f0c28c]',
    'room-sage': 'bg-[#dfe9df]',
  };
  return map[colorClass] || 'bg-transparent';
};

export const getMockReservations = (date: Date, filter: string, rooms: any[]) => {
  const seed = date.getDate() + date.getMonth();
  const numRes = seed % 4;
  
  let dayRooms = [];
  for (let i = 0; i < numRes; i++) {
    dayRooms.push(rooms[(seed + i) % rooms.length]);
  }
  
  if (filter !== 'Toutes les salles') {
    dayRooms = dayRooms.filter(r => r.name === filter);
  }
  
  const uniqueRooms = [];
  const map = new Map();
  for (const item of dayRooms) {
    if(!map.has(item.name)){
        map.set(item.name, true);
        uniqueRooms.push(item);
    }
  }
  
  return uniqueRooms;
};

interface Room {
  name: string;
  capacity: string;
  color: string;
}

interface RoomCalendarProps {
  rooms: Room[];
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  onNextStep: () => void;
}

export default function RoomCalendar({ rooms, selectedDate, onDateSelect, onNextStep }: RoomCalendarProps) {
  const [viewDate, setViewDate] = useState(new Date()); 
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('month');
  const [isDayMenuOpen, setIsDayMenuOpen] = useState(false);
  const [roomFilter, setRoomFilter] = useState('Toutes les salles');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const displayDays = useMemo(() => {
    const baseDate = new Date(viewDate);
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();

    if (calendarView === 'month') {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const firstDay = new Date(year, month, 1).getDay();
      const offset = firstDay === 0 ? 6 : firstDay - 1;
      
      const days = [];
      for (let i = 0; i < offset; i++) days.push(null);
      for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
      return days;
    } 
    
    if (calendarView === 'week') {
      const day = baseDate.getDay();
      const diff = baseDate.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(year, month, diff);
      
      const days = [];
      for (let i = 0; i < 7; i++) {
        days.push(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i));
      }
      return days;
    }
    
    return [baseDate];
  }, [viewDate, calendarView]);

  const handlePrev = () => {
    const newDate = new Date(viewDate);
    if (calendarView === 'month') newDate.setMonth(newDate.getMonth() - 1);
    if (calendarView === 'week') newDate.setDate(newDate.getDate() - 7);
    if (calendarView === 'day') newDate.setDate(newDate.getDate() - 1);
    setViewDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(viewDate);
    if (calendarView === 'month') newDate.setMonth(newDate.getMonth() + 1);
    if (calendarView === 'week') newDate.setDate(newDate.getDate() + 7);
    if (calendarView === 'day') newDate.setDate(newDate.getDate() + 1);
    setViewDate(newDate);
  };

  const handleYearChange = (offset: number) => {
    const newDate = new Date(viewDate);
    newDate.setFullYear(newDate.getFullYear() + offset);
    setViewDate(newDate);
  };

  const formatHeader = () => {
    if (calendarView === 'month' || calendarView === 'week') {
      return `${monthNames[viewDate.getMonth()]} ${viewDate.getFullYear()}`;
    }
    return `${weekDaysLong[viewDate.getDay()]} ${viewDate.getDate()} ${monthNames[viewDate.getMonth()]}`;
  };

  const roomFilters = ['Toutes les salles', ...rooms.map((room) => room.name)];
  const visibleRooms = rooms.filter((room) => roomFilter === 'Toutes les salles' || room.name === roomFilter);
  const selectedDateFull = selectedDate ? `${selectedDate.getDate()} ${monthNames[selectedDate.getMonth()].toLowerCase()} ${selectedDate.getFullYear()}` : '';

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #cbd5ce transparent; }
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5ce; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #9eaaa3; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      <div className="mt-8 mb-6">
        <div className="flex items-center justify-center gap-4 mb-8 text-xl sm:text-2xl font-black uppercase tracking-widest text-[#1e2420]">
          <div className="flex gap-3 sm:gap-4">
            <button type="button" onClick={() => handleYearChange(-1)} className="text-[#6d746e] hover:text-[#1e2420] transition-colors">«</button>
            <button type="button" onClick={handlePrev} className="text-[#1e2420] hover:opacity-70 transition-opacity">←</button>
          </div>
          <span className="min-w-[240px] sm:min-w-[300px] text-center">{formatHeader()}</span>
          <div className="flex gap-3 sm:gap-4">
            <button type="button" onClick={handleNext} className="text-[#1e2420] hover:opacity-70 transition-opacity">→</button>
            <button type="button" onClick={() => handleYearChange(1)} className="text-[#6d746e] hover:text-[#1e2420] transition-colors">»</button>
          </div>
        </div>

        <div className="hidden sm:flex overflow-x-auto gap-3 pb-3 mb-6 custom-scrollbar">
          {roomFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => { setRoomFilter(filter); setIsDayMenuOpen(false); }}
              className={`shrink-0 px-4 py-3 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.15em] border rounded-[4px] transition-all ${
                roomFilter === filter
                  ? 'bg-[#0b644d] text-white border-[#0b644d] shadow-md'
                  : 'bg-white text-[#1e2420] border-[#d9ded9] hover:border-[#0b644d] hover:bg-[#f2f7f5]'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="sm:hidden mb-6 relative">
          <select
            value={roomFilter}
            onChange={(e) => { setRoomFilter(e.target.value); setIsDayMenuOpen(false); }}
            className="w-full appearance-none bg-white border border-[#1e2420] text-[#1e2420] text-[11px] font-bold uppercase tracking-[0.15em] rounded-[4px] px-4 py-3 outline-none focus:border-[#0b644d] focus:ring-1 focus:ring-[#0b644d]"
          >
            {roomFilters.map(filter => (
              <option key={filter} value={filter}>{filter}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#1e2420]">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <div className="flex gap-6 sm:gap-8 border-b border-[#d9ded9] mb-6">
          <button
            type="button"
            className={`pb-3 text-sm transition-colors ${calendarView === 'month' ? 'text-[#1e2420] border-b-2 border-[#1e2420] font-bold' : 'text-[#6d746e] font-normal hover:text-[#1e2420]'}`}
            onClick={() => setCalendarView('month')}
          >
            Par Mois
          </button>
          <button
            type="button"
            className={`pb-3 text-sm transition-colors ${calendarView === 'week' ? 'text-[#1e2420] border-b-2 border-[#1e2420] font-bold' : 'text-[#6d746e] font-normal hover:text-[#1e2420]'}`}
            onClick={() => setCalendarView('week')}
          >
            Par Semaine
          </button>
          <button
            type="button"
            className={`pb-3 text-sm transition-colors ${calendarView === 'day' ? 'text-[#1e2420] border-b-2 border-[#1e2420] font-bold' : 'text-[#6d746e] font-normal hover:text-[#1e2420]'}`}
            onClick={() => setCalendarView('day')}
          >
            Par Jour
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-[#d9ded9] overflow-hidden">
        
        {calendarView !== 'day' && (
          <div className="grid grid-cols-1 sm:grid-cols-7 border-b border-[#d9ded9] bg-[#f7f8f4]">
            {calendarView === 'month' && weekDaysShort.map(day => (
              <div key={day} className="py-2.5 text-center text-[11px] font-bold text-[#6d746e] uppercase tracking-widest border-r last:border-r-0 border-[#d9ded9] hidden sm:block">
                {day}
              </div>
            ))}
            {calendarView === 'week' && displayDays.map((d, i) => d && (
              <div key={i} className="py-3 text-center border-r last:border-r-0 border-[#d9ded9] hidden sm:block">
                <span className="block text-[10px] font-bold text-[#6d746e] uppercase tracking-widest">{weekDaysShort[d.getDay()]}</span>
                <span className="block text-lg font-black text-[#1e2420] mt-0.5">{d.getDate()}</span>
              </div>
            ))}
          </div>
        )}

        <div className={`grid ${calendarView === 'day' ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-7'}`}>
          {displayDays.map((dateObj, index) => {
            if (!dateObj) return <div key={index} className="hidden sm:block bg-gray-50/50 border-r border-b border-[#d9ded9]" />;
            
            const isSelected = selectedDate && isSameDay(dateObj, selectedDate);
            const isToday = isSameDay(dateObj, today);
            const isPast = dateObj.getTime() < today.getTime();
            const dayReservations = getMockReservations(dateObj, roomFilter, rooms);
            
            return (
              <div
                key={index}
                onClick={() => {
                  if (isPast) return;
                  onDateSelect(dateObj);
                  setIsDayMenuOpen(true);
                }}
                className={`
                  group flex flex-col border-b sm:border-r border-[#d9ded9] transition-colors relative
                  ${calendarView === 'week' ? 'min-h-[160px]' : calendarView === 'month' ? 'min-h-[110px]' : 'min-h-[300px]'}
                  ${isPast ? 'bg-[#f7f8f4] opacity-60 cursor-not-allowed' : isSelected ? 'bg-[#f2f7f5] ring-inset ring-2 ring-[#0b644d] cursor-pointer' : 'hover:bg-[#f7f8f4] bg-white cursor-pointer'}
                `}
              >
                <div className={`
                  flex items-center justify-between p-3 sm:p-2.5 
                  ${calendarView === 'day' ? 'border-b border-[#d9ded9] bg-[#f7f8f4] p-4' : ''}
                  ${calendarView === 'week' ? 'sm:hidden border-b border-[#d9ded9] bg-[#f7f8f4]' : ''}
                  ${calendarView === 'month' ? 'border-b sm:border-none border-[#d9ded9] bg-[#f7f8f4] sm:bg-transparent' : ''}
                `}>
                  <div className="flex items-center gap-3 sm:gap-0">
                    {calendarView !== 'day' && (
                      <span className="sm:hidden text-xs font-bold text-[#6d746e] uppercase tracking-widest w-10">
                        {weekDaysShort[dateObj.getDay()]}
                      </span>
                    )}
                    
                    <div className={`
                      flex items-center justify-center font-bold 
                      ${calendarView === 'day' ? 'text-xl' : 'text-sm w-7 h-7 rounded-full'}
                      ${isToday && !isSelected ? 'bg-[#1e2420] text-white' : ''}
                      ${isSelected && calendarView !== 'day' ? 'bg-[#0b644d] text-white' : 'text-[#1e2420]'}
                    `}>
                      {calendarView === 'day' ? `${weekDaysLong[dateObj.getDay()]} ${dateObj.getDate()} ${monthNames[dateObj.getMonth()]}` : dateObj.getDate()}
                    </div>
                  </div>
                  
                  {calendarView === 'day' && (
                    <span className="text-xs font-bold text-[#6d746e] uppercase tracking-widest bg-white px-3 py-1.5 rounded-md border border-[#d9ded9]">
                      {dayReservations.length} RÉServation(s)
                    </span>
                  )}
                </div>

                <div className={`flex flex-col flex-1 p-2 gap-1.5 custom-scrollbar ${calendarView !== 'day' ? 'overflow-y-auto' : 'p-4 gap-3'}`}>
                  {dayReservations.length > 0 ? (
                    dayReservations.map((room, idx) => (
                      <div key={idx} className={`flex items-center gap-2 ${calendarView === 'day' ? 'p-4 bg-white border border-[#d9ded9] rounded-md shadow-sm' : ''}`}>
                        <span className={`w-2 h-2 rounded-full shrink-0 ${getRoomBg(room.color)}`} />
                        <span className={`font-bold text-[#1e2420] leading-tight uppercase ${calendarView === 'day' ? 'text-sm' : 'text-[9px] sm:text-[10px] truncate'}`}>
                          {calendarView === 'month' ? room.name.split(' ').slice(1).join(' ') : room.name}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className={`flex items-center justify-center h-full italic text-[#a1a6a2] font-medium ${calendarView === 'day' ? 'text-base' : 'text-[10px]'}`}>
                      Aucune réservation
                    </div>
                  )}
                </div>

                {!isPast && <div className="absolute inset-x-0 bottom-0 h-1 bg-[#0b644d] opacity-0 group-hover:opacity-100 transition-opacity" />}
              </div>
            );
          })}
        </div>
      </div>

      {isDayMenuOpen && selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1e2420]/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-[#0b644d] p-5 flex justify-between items-center text-white">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-0.5">Réservation pour le</p>
                <h3 className="text-xl font-black">{selectedDateFull}</h3>
              </div>
              <button className="p-1.5 hover:bg-white/20 rounded-full transition-colors" type="button" onClick={() => setIsDayMenuOpen(false)}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-4 text-center">
              {roomFilter === 'Toutes les salles' ? (
                <>
                  <div className="w-12 h-12 bg-[#f2f7f5] rounded-full flex items-center justify-center mx-auto mb-1 text-[#0b644d]">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  </div>
                  <strong className="text-xl font-black text-[#1e2420]">{rooms.length} salles au catalogue</strong>
                  <p className="text-xs text-[#6d746e]">Pour la journée complète.</p>
                </>
              ) : (
                <>
                   <div className="w-12 h-12 bg-[#f2f7f5] rounded-full flex items-center justify-center mx-auto mb-1 text-[#0b644d]">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <strong className="text-xl font-black text-[#1e2420] uppercase">{visibleRooms[0]?.name ?? rooms[0].name}</strong>
                  <p className="text-xs text-[#6d746e]">Voir la disponibilité de cette salle pour la journée.</p>
                </>
              )}
              
              <button 
                className="mt-2 w-full bg-[#1e2420] text-white text-xs font-bold uppercase tracking-widest py-3.5 rounded-md hover:bg-[#0b644d] transition-colors" 
                type="button" 
                onClick={() => { setIsDayMenuOpen(false); onNextStep(); }}
              >
                Passer à la sélection
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedDate && (
        <div className="room-selection-line mt-6 flex justify-between border-l-4 border-[#d97706] bg-white p-4 text-sm text-[#6d746e]">
          <span>Date choisie</span>
          <strong className="text-[#0b644d]">{selectedDateFull}</strong>
        </div>
      )}
    </>
  );
}