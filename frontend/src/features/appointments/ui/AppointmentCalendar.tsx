'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { CalendarDayView } from './CalendarDayView';
import { CalendarHeader } from './CalendarHeader';
import { CalendarMonthView } from './CalendarMonthView';
import { CalendarWeekView } from './CalendarWeekView';
import type { Appointment, CalendarView } from '../types/appointment.types';

type AppointmentCalendarProps = {
  appointments: Appointment[];
  onAppointmentClick?: (appointment: Appointment) => void;
  onDateRangeChange?: (startDate: string, endDate: string) => void;
};

function getDateRange(currentDate: Date, view: CalendarView): { startDate: Date; endDate: Date } {
  const startDate = new Date(currentDate);
  const endDate = new Date(currentDate);

  switch (view) {
    case 'day':
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'week': {
      const day = startDate.getDay();
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
      startDate.setDate(diff);
      startDate.setHours(0, 0, 0, 0);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;
    }
    case 'month': {
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      const lastDay = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
      endDate.setDate(lastDay.getDate());
      endDate.setHours(23, 59, 59, 999);
      break;
    }
  }

  return { startDate, endDate };
}

export function AppointmentCalendar({ appointments, onAppointmentClick, onDateRangeChange }: AppointmentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('week');
  const lastDateRangeRef = useRef<{ startDate: string; endDate: string } | null>(null);

  useEffect(() => {
    if (onDateRangeChange) {
      const { startDate, endDate } = getDateRange(currentDate, view);
      const startDateStr = startDate.toISOString();
      const endDateStr = endDate.toISOString();
      
      if (
        lastDateRangeRef.current?.startDate !== startDateStr ||
        lastDateRangeRef.current?.endDate !== endDateStr
      ) {
        lastDateRangeRef.current = { startDate: startDateStr, endDate: endDateStr };
        onDateRangeChange(startDateStr, endDateStr);
      }
    }
  }, [currentDate, view, onDateRangeChange]);

  const handleViewChange = useCallback((newView: CalendarView) => {
    setView(newView);
  }, []);

  const handleNavigate = useCallback((direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setCurrentDate(new Date());
      return;
    }

    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      const delta = direction === 'next' ? 1 : -1;

      switch (view) {
        case 'day':
          newDate.setDate(newDate.getDate() + delta);
          break;
        case 'week':
          newDate.setDate(newDate.getDate() + delta * 7);
          break;
        case 'month':
          newDate.setMonth(newDate.getMonth() + delta);
          break;
      }

      return newDate;
    });
  }, [view]);

  const handleDayClick = useCallback((date: Date) => {
    setCurrentDate(date);
    setView('day');
  }, []);

return (
    <div className="flex flex-col h-full" data-testid="appointment-calendar">
      <CalendarHeader
        currentDate={currentDate}
        view={view}
        onViewChange={handleViewChange}
        onNavigate={handleNavigate}
      />
      <div className="flex-1 overflow-hidden">
        {view === 'day' && (
          <CalendarDayView
            currentDate={currentDate}
            appointments={appointments}
            onAppointmentClick={onAppointmentClick}
          />
        )}
        {view === 'week' && (
          <CalendarWeekView
            currentDate={currentDate}
            appointments={appointments}
            onAppointmentClick={onAppointmentClick}
          />
        )}
        {view === 'month' && (
          <CalendarMonthView
            currentDate={currentDate}
            appointments={appointments}
            onAppointmentClick={onAppointmentClick}
          />
        )}
      </div>
    </div>
  );
}
