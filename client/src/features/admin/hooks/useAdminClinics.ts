import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { changeClinicStatus } from '@/features/admin/store/adminClinicsSlice';
import type { ClinicStatus } from '@/shared/types';

export function useAdminClinics() {
  const dispatch = useAppDispatch();
  const state = useAppSelector((s) => s.adminClinics);
  const changeStatus = useCallback((id: string, status: ClinicStatus, reason?: string) => { void dispatch(changeClinicStatus({ id, status, reason })); }, [dispatch]);
  return { ...state, changeStatus };
}
