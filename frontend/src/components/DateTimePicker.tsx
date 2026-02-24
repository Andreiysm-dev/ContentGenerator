import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon, Check } from 'lucide-react';

interface DateTimePickerProps {
    value: string; // ISO string or YYYY-MM-DDTHH:mm
    onChange: (value: string) => void;
    disabled?: boolean;
}

export function DateTimePicker({ value, onChange, disabled }: DateTimePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(new Date());

    // Parse initial value
    const currentDate = value ? new Date(value) : new Date();
    if (isNaN(currentDate.getTime())) currentDate.setTime(Date.now());

    const [selectedDate, setSelectedDate] = useState(currentDate);

    useEffect(() => {
        if (value) {
            const d = new Date(value);
            if (!isNaN(d.getTime())) {
                setSelectedDate(d);
            }
        }
    }, [value]);

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const handlePrevMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const handleDateSelect = (day: number) => {
        const newDate = new Date(selectedDate);
        newDate.setFullYear(viewDate.getFullYear());
        newDate.setMonth(viewDate.getMonth());
        newDate.setDate(day);
        setSelectedDate(newDate);
        updateValue(newDate);
    };

    const handleTimeChange = (type: 'hours' | 'minutes', val: number) => {
        const newDate = new Date(selectedDate);
        if (type === 'hours') newDate.setHours(val);
        else newDate.setMinutes(val);
        setSelectedDate(newDate);
        updateValue(newDate);
    };

    const updateValue = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        onChange(`${year}-${month}-${day}T${hours}:${minutes}`);
    };

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

    const renderCalendar = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const days = [];
        const totalDays = daysInMonth(year, month);
        const startDay = firstDayOfMonth(year, month);

        // Padding for start of month
        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`pad-${i}`} className="h-8 w-8" />);
        }

        for (let d = 1; d <= totalDays; d++) {
            const isSelected = selectedDate.getDate() === d &&
                selectedDate.getMonth() === month &&
                selectedDate.getFullYear() === year;
            const isToday = new Date().getDate() === d &&
                new Date().getMonth() === month &&
                new Date().getFullYear() === year;

            days.push(
                <button
                    key={d}
                    onClick={() => handleDateSelect(d)}
                    className={`h-8 w-8 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center
                        ${isSelected ? 'bg-[#3fa9f5] text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-500/20' :
                            isToday ? 'text-[#3fa9f5] bg-blue-50' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                    {d}
                </button>
            );
        }
        return days;
    };

    return (
        <div className="relative inline-block w-full">
            <button
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-xl px-4 py-2 border border-white/5 transition-all w-full
                    ${disabled ? 'opacity-20 grayscale cursor-not-allowed' : 'cursor-pointer'}`}
            >
                <div className="flex items-center gap-2">
                    <CalendarIcon className="w-3.5 h-3.5 text-[#3fa9f5]" />
                    <span className="text-[11px] font-bold text-white whitespace-nowrap">
                        {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                </div>
                <div className="w-px h-3 bg-white/10 mx-1" />
                <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#3fa9f5]" />
                    <span className="text-[11px] font-bold text-white whitespace-nowrap">
                        {selectedDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </span>
                </div>
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full mt-3 right-0 z-[101] w-[320px] bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-6 animate-in fade-in zoom-in-95 duration-200 origin-top-right">

                        {/* Calendar Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                                {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
                            </h4>
                            <div className="flex gap-1">
                                <button onClick={handlePrevMonth} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors">
                                    <ChevronLeft size={16} />
                                </button>
                                <button onClick={handleNextMonth} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors">
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1 mb-6">
                            {weekDays.map(d => (
                                <div key={d} className="h-8 w-8 flex items-center justify-center text-[10px] font-black text-slate-300 uppercase">
                                    {d}
                                </div>
                            ))}
                            {renderCalendar()}
                        </div>

                        <div className="h-px bg-slate-100 mb-6" />

                        {/* Time Picker */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <Clock size={12} />
                                Select Time
                            </div>

                            <div className="flex items-center justify-between gap-4">
                                <div className="flex-1 flex flex-col gap-1">
                                    <span className="text-[9px] font-black text-slate-300 uppercase ml-1">Hour</span>
                                    <select
                                        value={selectedDate.getHours()}
                                        onChange={(e) => handleTimeChange('hours', parseInt(e.target.value))}
                                        className="bg-slate-50 border-none rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 w-full appearance-none cursor-pointer"
                                    >
                                        {Array.from({ length: 24 }).map((_, i) => (
                                            <option key={i} value={i}>
                                                {String(i % 12 || 12).padStart(2, '0')} {i >= 12 ? 'PM' : 'AM'}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex-1 flex flex-col gap-1">
                                    <span className="text-[9px] font-black text-slate-300 uppercase ml-1">Minute</span>
                                    <select
                                        value={selectedDate.getMinutes()}
                                        onChange={(e) => handleTimeChange('minutes', parseInt(e.target.value))}
                                        className="bg-slate-50 border-none rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 w-full appearance-none cursor-pointer"
                                    >
                                        {Array.from({ length: 60 }).map((_, i) => (
                                            <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="h-9 w-9 bg-[#3fa9f5] text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all mt-4"
                                >
                                    <Check size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
