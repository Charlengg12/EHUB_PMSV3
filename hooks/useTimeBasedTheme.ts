import { useState, useEffect } from 'react';

interface ThemeConfig {
    lightStart: number; // Hour when light mode starts (0-23)
    darkStart: number;  // Hour when dark mode starts (0-23)
    transitionDuration: number; // Duration of transition in minutes
}

const defaultConfig: ThemeConfig = {
    lightStart: 6,   // 6 AM
    darkStart: 18,   // 6 PM
    transitionDuration: 30 // 30 minutes
};

export const useTimeBasedTheme = (config: Partial<ThemeConfig> = {}) => {
    const themeConfig = { ...defaultConfig, ...config };
    const [isDark, setIsDark] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        const updateTheme = () => {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const currentTime = currentHour + (currentMinute / 60);

            // Calculate transition periods
            const lightStartTime = themeConfig.lightStart;
            const darkStartTime = themeConfig.darkStart;
            const transitionDuration = themeConfig.transitionDuration / 60; // Convert to hours

            let shouldBeDark = false;
            let isInTransition = false;

            if (darkStartTime > lightStartTime) {
                // Normal case: light during day, dark during night
                if (currentTime >= darkStartTime || currentTime < lightStartTime) {
                    shouldBeDark = true;
                }

                // Check if we're in transition period
                if (currentTime >= darkStartTime - transitionDuration && currentTime < darkStartTime) {
                    isInTransition = true;
                }
                if (currentTime >= lightStartTime - transitionDuration && currentTime < lightStartTime) {
                    isInTransition = true;
                }
            } else {
                // Edge case: dark mode spans midnight
                if (currentTime >= darkStartTime || currentTime < lightStartTime) {
                    shouldBeDark = true;
                }

                // Check transition periods
                if (currentTime >= darkStartTime - transitionDuration && currentTime < darkStartTime) {
                    isInTransition = true;
                }
                if (currentTime >= lightStartTime - transitionDuration && currentTime < lightStartTime) {
                    isInTransition = true;
                }
            }

            setIsDark(shouldBeDark);
            setIsTransitioning(isInTransition);

            // Apply theme to document
            const root = document.documentElement;
            if (shouldBeDark) {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }

            // Add transition class during transition periods
            if (isInTransition) {
                root.classList.add('theme-transition');
            } else {
                root.classList.remove('theme-transition');
            }
        };

        // Update theme immediately
        updateTheme();

        // Update theme every minute
        const interval = setInterval(updateTheme, 60000);

        // Listen for system theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleSystemThemeChange = () => {
            // Only override if user hasn't manually set a preference
            if (!localStorage.getItem('theme-override')) {
                updateTheme();
            }
        };

        mediaQuery.addEventListener('change', handleSystemThemeChange);

        return () => {
            clearInterval(interval);
            mediaQuery.removeEventListener('change', handleSystemThemeChange);
        };
    }, [themeConfig]);

    // Manual theme override
    const setTheme = (theme: 'light' | 'dark' | 'auto') => {
        const root = document.documentElement;

        if (theme === 'auto') {
            localStorage.removeItem('theme-override');
            // Re-run the automatic theme logic
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const currentTime = currentHour + (currentMinute / 60);

            const shouldBeDark = currentTime >= themeConfig.darkStart || currentTime < themeConfig.lightStart;
            setIsDark(shouldBeDark);

            if (shouldBeDark) {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        } else {
            localStorage.setItem('theme-override', theme);
            const isDarkMode = theme === 'dark';
            setIsDark(isDarkMode);

            if (isDarkMode) {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        }
    };

    // Get current theme status
    const getCurrentTheme = () => {
        const override = localStorage.getItem('theme-override');
        if (override && override !== 'auto') {
            return override as 'light' | 'dark';
        }
        return isDark ? 'dark' : 'light';
    };

    return {
        isDark,
        isTransitioning,
        setTheme,
        getCurrentTheme,
        config: themeConfig
    };
};
