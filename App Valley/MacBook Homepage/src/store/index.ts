import { create } from "zustand";

const useMackbookStore = create((set) => ({
  color: '#2e2c2e',
  setColor: (color: string) => set({ color }),

  scale: 0.08,
  setScale: (scale: number) => set({ scale }),

  reset: () => set({ color: '#2e2c2e', scale: 0.08 })
}));

export default useMackbookStore;