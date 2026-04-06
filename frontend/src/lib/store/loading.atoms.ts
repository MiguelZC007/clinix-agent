import { atom } from 'jotai';

export const navigationLoadingAtom = atom<boolean>(false);

export const apiLoadingAtom = atom<boolean>(false);

export const loadingMessageAtom = atom<string | null>(null);
