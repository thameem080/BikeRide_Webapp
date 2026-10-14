import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseKey: process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  mapboxToken: process.env.MAPBOX_TOKEN || '',
  googleMapsKey: process.env.GOOGLE_MAPS_KEY || '',
  corsOrigin: process.env.CORS_ORIGIN || '*'
};
