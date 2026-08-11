// Vercel Analytics + Speed Insights — paket resmi
// (@vercel/analytics & @vercel/speed-insights), tanpa bundler.
// mode eksplisit 'production' agar konsisten di semua environment.
import { inject } from './vendor/vercel-analytics.mjs';
import { injectSpeedInsights } from './vendor/vercel-speed-insights.mjs';

inject({ mode: 'production' });
injectSpeedInsights();
