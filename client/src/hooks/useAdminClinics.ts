import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { changeClinicStatus } from '@/store/slices/adminClinicsSlice';
import type { ClinicStatus } from '@/types';

export function useAdminClinics() {
  const dispatch = useAppDispatch();
  const state = useAppSelector((s) => s.adminClinics);
  const changeStatus = useCallback((id: string, status: ClinicStatus) => { void dispatch(changeClinicStatus({ id, status })); }, [dispatch]);
  return { ...state, changeStatus };
}