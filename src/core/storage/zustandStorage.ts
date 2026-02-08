import { StateStorage } from 'zustand/middleware';
import { storage } from './mmkv';

export const zustandMMKVStorage: StateStorage = {
  getItem: async (name: string) => {
    const value = await storage.getItem(name);
    return value ?? null;
  },
  setItem: async (name: string, value: string) => {
    await storage.setItem(name, value);
  },
  removeItem: async (name: string) => {
    await storage.removeItem(name);
  },
};
