
import { createContext, useContext, useEffect, useState } from 'react';
import { ThemeOptions } from '../types';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: ThemeOptions;
};

type ThemeProviderState = {
  theme: ThemeOptions;
  setTheme: (theme: ThemeOptions) => void;
};

const initialTheme: ThemeOptions = {
  mode: 'dark', // Modificado para 'dark'
  colorScheme: 'purple',
};

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = initialTheme,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<ThemeOptions>(
    () => {
      try {
        const storedTheme = localStorage.getItem('volleyball-theme');
        return storedTheme ? JSON.parse(storedTheme) : defaultTheme;
      } catch (e) {
        return defaultTheme;
      }
    }
  );

  useEffect(() => {
    const root = window.document.documentElement;
    
    root.classList.remove('light', 'dark');
    root.classList.add(theme.mode);
    
    localStorage.setItem('volleyball-theme', JSON.stringify(theme));
  }, [theme]);

  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  
  return context;
};
