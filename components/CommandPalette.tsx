"use client";

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/utils/cn';
import { skillRegistry } from '@/lib/skills/registry';
import { logger } from '@/lib/logger';

export const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setInput] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get all available commands from skills
  const allCommands = skillRegistry.getAllSkills().flatMap(skill => 
    skill.commands.map(cmd => ({
      ...cmd,
      skillName: skill.name,
      skillId: skill.id
    }))
  );

  const filteredCommands = allCommands.filter(cmd => 
    cmd.name.toLowerCase().includes(query.toLowerCase()) ||
    cmd.description.toLowerCase().includes(query.toLowerCase()) ||
    cmd.skillName.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 10);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const executeCommand = async (cmd: any) => {
    logger.info('Executing command from palette', { cmd: cmd.name, skill: cmd.skillId });
    // In a real scenario, this would trigger the actual skill action
    // For now, we simulate success and close
    setIsOpen(false);
    setInput('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-start justify-center pt-[15vh] px-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white dark:bg-black border-4 border-black dark:border-white brutalist-shadow overflow-hidden">
        <div className="flex items-center p-6 border-b-4 border-black dark:border-white">
          <span className="font-mono text-xl mr-4 opacity-50">{'>'}</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setInput(e.target.value)}
            placeholder="SEARCH COMMANDS OR SKILLS..."
            className="flex-1 bg-transparent border-none outline-none font-mono text-xl uppercase placeholder:text-gray-500"
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
              if (e.key === 'ArrowUp') setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
              if (e.key === 'Enter') executeCommand(filteredCommands[selectedIndex]);
            }}
          />
          <div className="text-[10px] font-bold border-2 border-black dark:border-white px-2 py-1 uppercase opacity-50">
            ESC TO CLOSE
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto no-scrollbar">
          {filteredCommands.length > 0 ? (
            filteredCommands.map((cmd, i) => (
              <div
                key={`${cmd.skillId}-${cmd.name}`}
                className={cn(
                  "p-6 cursor-pointer border-b-2 border-black/10 dark:border-white/10 flex justify-between items-center transition-colors",
                  selectedIndex === i ? "bg-black text-white dark:bg-white dark:text-black" : "hover:bg-gray-100 dark:hover:bg-white/5"
                )}
                onClick={() => executeCommand(cmd)}
                onMouseEnter={() => setSelectedIndex(i)}
              >
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 border border-current opacity-60">
                      {cmd.skillName}
                    </span>
                    <span className="font-bold text-lg uppercase tracking-tight">{cmd.name}</span>
                  </div>
                  <p className="text-xs font-mono opacity-70">{cmd.description}</p>
                </div>
                <div className="font-mono text-[10px] opacity-40">
                  {cmd.usage}
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center opacity-40 font-mono text-sm uppercase">
              No matching commands found in Space.
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-100 dark:bg-white/5 border-t-2 border-black dark:border-white flex justify-between items-center text-[10px] font-bold uppercase opacity-60">
          <span>{filteredCommands.length} Commands Available</span>
          <div className="flex gap-4">
            <span>↑↓ Navigate</span>
            <span>↵ Execute</span>
          </div>
        </div>
      </div>
    </div>
  );
};
