export const isUsingEmulator = (): boolean => {
  return process.env.NODE_ENV === 'development' && 
         process.env.REACT_APP_USE_FIREBASE_EMULATOR === 'true';
};
