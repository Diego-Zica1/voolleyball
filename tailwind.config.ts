
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				volleyball: {
					red: '#ef4444',
					'light-red': '#fecaca',
					orange: '#f59e42',
					'light-orange': '#ffedd5',
					amber: '#f59e0b',
					'light-amber': '#fef3c7',
					yellow: '#fde047',
					'light-yellow': '#fef9c3',
					lime: '#a3e635',
					'light-lime': '#ecfccb',
					green: '#22c55e',
					'light-green': '#bbf7d0',
					emerald: '#10b981',
					'light-emerald': '#d1fae5',
					teal: '#14b8a6',
					'light-teal': '#ccfbf1',
					cyan: '#06b6d4',
					'light-cyan': '#cffafe',
					sky: '#0ea5e9',
					'light-sky': '#e0f2fe',
					blue: '#3b82f6',
					'light-blue': '#dbeafe',
					indigo: '#6366f1',
					'light-indigo': '#e0e7ff',
					violet: '#8b5cf6',
					'light-violet': '#ede9fe',
					purple: '#a21caf',
					'light-purple': '#f3e8ff',
					fuchsia: '#d946ef',
					'light-fuchsia': '#fae8ff',
					pink: '#ec4899',
					'light-pink': '#fce7f3',
					rose: '#f43f5e',
					'light-rose': '#ffe4e6',
					slate: '#64748b',
					'light-slate': '#f1f5f9',
					gray: '#6b7280',
					'light-gray': '#f3f4f6',
					zinc: '#71717a',
					'light-zinc': '#f4f4f5',
					neutral: '#737373',
					'light-neutral': '#f5f5f5',
					stone: '#78716c',
					'light-stone': '#f5f5f4'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
