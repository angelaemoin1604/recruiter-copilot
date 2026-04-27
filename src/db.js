// db.js - NOW USES SUPABASE INSTEAD OF BROWSER STORAGE
export { 
  initDB, 
  ensureSeeded, 
  getAll, 
  snapshot, 
  add, 
  put, 
  del 
} from './supabase.js';