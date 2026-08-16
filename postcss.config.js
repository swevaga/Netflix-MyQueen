module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    // Kompres CSS hanya saat build produksi (NODE_ENV=production, dipakai
    // `npm run build:css`). Watch mode tetap cepat tanpa minify.
    ...(process.env.NODE_ENV === 'production' ? { cssnano: { preset: 'default' } } : {})
  }
};
