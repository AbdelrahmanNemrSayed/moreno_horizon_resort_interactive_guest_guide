import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['tests/**/*.test.js'],
        environment: 'node',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: [
                'shared/positioning-core.js',
                'js/core/i18n-engine.js',
                'config/env.js',
                'server/services/positioningEngine.js',
                'services/indoorLocation.js',
            ],
            exclude: [
                'node_modules/',
                'tests/',
                'scripts/',
                '**/*.test.js',
            ],
        },
    },
});