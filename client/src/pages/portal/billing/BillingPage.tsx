import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { Notice } from '@/components/atoms/Notice';
import { EmptyState } from '@/components/molecules/EmptyState';
import { MetricCard, MetricGrid } from '@/components/molecules/MetricCard';
import { DataTable, CellTitle, tdClass } from '@/components/molecules/DataTable';
import { getErrorMessage } from '@/shared/lib/http';
import { billingService, type BillingRole, type BillingSummary, type Settlement, type Transaction } from '@/features/billing/services/billingService';

const money = (minor: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(minor / 100);
const date = (value: string) => new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
const statusStyle = (status: string) => status === 'SUCCEEDED' || status === 'COMPLETED' ? 'text-success' : status === 'FAILED' || status === 'CANCELLED' || status === 'REFUNDED' ? 'text-danger' : 'text-warning';
export default function BillingPage({ role }: { role: BillingRole }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]); const [settlements, setSettlements] = useState<Settlement[]>([]); const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [page, setPage] = useState(1); const [totalPages, setTotalPages] = useState(0); const [settlementPage, setSettlementPage] = useState(1); const [settlementTotalPages, setSettlementTotalPages] = useState(0); const [from, setFrom] = useState(''); const [to, setTo] = useState(''); const [status, setStatus] = useState(''); const [settlementStatus, setSettlementStatus] = useState('');
  const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [clinicId, setClinicId] = useState(''); const [clinicName, setClinicName] = useState(''); const [paymentIds, setPaymentIds] = useState(''); const [note, setNote] = useState(''); const [failureReason, setFailureReason] = useState(''); const [reference, setReference] = useState(''); const [selected, setSelected] = useState<Settlement | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const tx = await billingService.transactions(role, { page, limit: 20, from, to, status }); setTransactions(tx.items); setTotalPages(tx.meta.totalPages);
      if (role !== 'DOCTOR') { const [sum, settlementsResult] = await Promise.all([billingService.summary(role, { from, to }), billingService.settlements(role, { page: settlementPage, limit: 20, from, to, status: settlementStatus })]); setSummary(sum); setSettlements(settlementsResult.items); setSettlementTotalPages(settlementsResult.meta.totalPages); }
    } catch (cause) { setError(getErrorMessage(cause, 'Billing information could not be loaded.')); } finally { setLoading(false); }
  }, [role, page, settlementPage, from, to, status, settlementStatus]);
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);
  const selectedPaymentIds = paymentIds.split(/[\s,]+/).filter(Boolean);
  const create = async () => {
    if (!window.confirm('Create a pending manual settlement for these completed appointment payments?')) return;
    setBusy(true); setError('');
    try { await billingService.createSettlement({ clinicId, paymentIds: selectedPaymentIds, administrativeNote: note.trim() }); setClinicId(''); setClinicName(''); setPaymentIds(''); setNote(''); await load(); }
    catch (cause) { const message = getErrorMessage(cause, 'Settlement could not be created.'); await load(); setError(message); } finally { setBusy(false); }
  };
  const update = async (item: Settlement, next: 'COMPLETED' | 'FAILED') => {
    const prompt = next === 'COMPLETED' ? 'Confirm the external payout was completed?' : 'Confirm the external payout failed?'; if (!window.confirm(prompt)) return;
    setBusy(true); setError('');
    try { await billingService.updateSettlement(item.settlementId, { status: next, ...(reference.trim() ? { externalPayoutReference: reference.trim() } : {}), ...(next === 'FAILED' ? { failureReason: failureReason.trim() } : {}) }); setReference(''); setFailureReason(''); setSelected(null); await load(); }
    catch (cause) { setError(getErrorMessage(cause, 'Settlement could not be updated.')); } finally { setBusy(false); }
  };
  return <>
    {error ? <Notice tone="error">{error}</Notice> : null}
    <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface-elevated p-4">
      <label className="grid gap-1 text-xs font-medium text-text-secondary">From<input type="date" value={from} onChange={(e) => { setPage(1); setSettlementPage(1); setFrom(e.target.value); }} className="min-h-10 rounded border border-border px-2 text-sm" /></label>
      <label className="grid gap-1 text-xs font-medium text-text-secondary">To<input type="date" value={to} onChange={(e) => { setPage(1); setSettlementPage(1); setTo(e.target.value); }} className="min-h-10 rounded border border-border px-2 text-sm" /></label>
      <label className="grid gap-1 text-xs font-medium text-text-secondary">Payment status<select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} className="min-h-10 rounded border border-border px-2 text-sm"><option value="">All statuses</option>{['PENDING','SUCCEEDED','FAILED','CANCELLED','REFUNDED'].map((x) => <option key={x}>{x}</option>)}</select></label>
      <Button variant="secondary" size="sm" onClick={() => void load()} disabled={loading}>Refresh</Button>
    </div>
    {role !== 'DOCTOR' && summary ? <MetricGrid cols={3}>
      <MetricCard label="Gross captured collections" value={money(summary.grossCapturedCollectionsMinor)} note="Successful appointment payments; not net revenue or withdrawable earnings" />
      <MetricCard label="Successful payments" value={summary.successfulPaymentCount} note="Captured payments in the selected period" />
      <MetricCard label="Refund review" value={money(summary.refundReviewAmountMinor)} note={`${summary.refundReviewCount} captured payment(s); review flag is not an actual refund`} />
      <MetricCard label="Pending settlements" value={money(summary.pendingSettlementAmountMinor)} note={`${summary.pendingSettlementCount} manual settlement(s)`} />
      <MetricCard label="Completed settlements" value={money(summary.completedSettlementAmountMinor)} note={`${summary.completedSettlementCount} confirmed external payout(s)`} />
    </MetricGrid> : null}
    {role === 'SUPER_ADMIN' ? <Card className="overflow-hidden"><div className="grid gap-3 p-4 sm:grid-cols-2"><h2 className="m-0 text-base font-semibold sm:col-span-2">Create manual settlement</h2><div className="grid gap-1 text-sm"><span>Clinic</span><span className="min-h-10 rounded border border-border bg-page px-3 py-2">{clinicName || 'Select eligible transactions below'}</span></div><label className="grid gap-1 text-sm">Payment IDs (comma or space separated)<input value={paymentIds} onChange={(e) => setPaymentIds(e.target.value)} className="min-h-10 rounded border border-border px-3" /><small className="text-text-muted">{selectedPaymentIds.length} selected. Use “Add to settlement” on eligible transactions below.</small></label><label className="grid gap-1 text-sm sm:col-span-2">Administrative note<input value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} className="min-h-10 rounded border border-border px-3" /></label><div><Button size="sm" onClick={() => void create()} disabled={busy || loading || !clinicId || selectedPaymentIds.length === 0}>Create pending settlement</Button></div></div></Card> : null}
    <Card className="overflow-hidden"><div className="p-4"><h2 className="m-0 text-base font-semibold">Transaction history</h2><p className="mb-0 mt-1 text-sm text-text-muted">{role === 'DOCTOR' ? 'Your appointment transactions. No doctor earnings are calculated.' : 'Appointment payment records within your access scope.'}</p></div>
      {loading ? <EmptyState>Loading transactions…</EmptyState> : transactions.length === 0 ? <EmptyState>No transactions match these filters.</EmptyState> : <DataTable headers={['PAYMENT / APPOINTMENT','APPOINTMENT DATE','CLINIC / DOCTOR','AMOUNT','PAYMENT','REFUND REVIEW',...(role === 'SUPER_ADMIN' ? ['SETTLEMENT'] : [])]}>
        {transactions.map((item) => <tr key={item.paymentId}><td className={tdClass}><CellTitle title={item.paymentId.slice(-8)} lines={[`Appointment ${item.appointmentId.slice(-8)}`, ...(item.patientName ? [`Patient: ${item.patientName}`] : [])]} /></td><td className={tdClass}>{date(item.appointmentDate)}</td><td className={tdClass}><CellTitle title={item.clinicName} lines={[item.doctorName]} /></td><td className={tdClass}>{money(item.amountMinor)}<small className="block text-xs text-text-muted">{item.currency}</small></td><td className={`${tdClass} font-semibold ${statusStyle(item.paymentStatus)}`}>{item.paymentStatus}</td><td className={tdClass}>{item.refundReviewStatus === 'PENDING_REVIEW' ? <span className="font-semibold text-warning">Review needed</span> : 'None'}{item.razorpayPaymentReference ? <small className="mt-1 block text-xs text-text-muted">Razorpay ref: {item.razorpayPaymentReference}</small> : null}</td>{role === 'SUPER_ADMIN' ? <td className={tdClass}>{item.settlementEligible ? <Button size="xs" variant="secondary" disabled={selectedPaymentIds.includes(item.paymentId) || (!!clinicId && clinicId !== item.clinicId)} onClick={() => { setClinicId(item.clinicId); setClinicName(item.clinicName); setPaymentIds((current) => [...current.split(/[\s,]+/).filter(Boolean), item.paymentId].join(', ')); }}>{selectedPaymentIds.includes(item.paymentId) ? 'Added' : clinicId && clinicId !== item.clinicId ? 'Other clinic' : 'Add to settlement'}</Button> : <span className="text-xs text-text-muted">Not eligible</span>}</td> : null}</tr>)}
      </DataTable>}
      <div className="flex items-center justify-between border-t border-border p-3 text-sm"><span>Page {page} of {Math.max(totalPages, 1)}</span><div className="flex gap-2"><Button size="xs" variant="secondary" disabled={page <= 1 || loading} onClick={() => setPage((v) => v - 1)}>Previous</Button><Button size="xs" variant="secondary" disabled={page >= totalPages || loading} onClick={() => setPage((v) => v + 1)}>Next</Button></div></div>
    </Card>
    {role !== 'DOCTOR' ? <Card className="overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-3 p-4"><h2 className="m-0 text-base font-semibold">Settlement history</h2><label className="grid gap-1 text-xs font-medium text-text-secondary">Status<select value={settlementStatus} onChange={(e) => { setSettlementPage(1); setSettlementStatus(e.target.value); }} className="min-h-9 rounded border border-border px-2 text-sm"><option value="">All statuses</option>{['PENDING','COMPLETED','FAILED'].map((x) => <option key={x}>{x}</option>)}</select></label></div>{settlements.length ? <DataTable headers={['SETTLEMENT','CLINIC','CREATED','AMOUNT','STATUS','DETAILS']}>
      {settlements.map((item) => <tr key={item.settlementId}><td className={tdClass}>{item.settlementId}</td><td className={tdClass}>{item.clinicName}</td><td className={tdClass}>{date(item.createdAt)}</td><td className={tdClass}>{money(item.totalAmountMinor)}</td><td className={`${tdClass} font-semibold ${statusStyle(item.status)}`}>{item.status}</td><td className={tdClass}><Button size="xs" variant="secondary" onClick={() => setSelected(item)}>View</Button></td></tr>)}
    </DataTable> : <EmptyState>No settlements for this period.</EmptyState>}
      {settlementTotalPages > 1 ? <div className="flex items-center justify-between border-t border-border p-3 text-sm"><span>Settlement page {settlementPage} of {settlementTotalPages}</span><div className="flex gap-2"><Button size="xs" variant="secondary" disabled={settlementPage <= 1 || loading} onClick={() => setSettlementPage((v) => v - 1)}>Previous</Button><Button size="xs" variant="secondary" disabled={settlementPage >= settlementTotalPages || loading} onClick={() => setSettlementPage((v) => v + 1)}>Next</Button></div></div> : null}
      {selected ? <div className="grid gap-3 border-t border-border p-4"><strong>Settlement {selected.settlementId}</strong><span className="text-sm">{selected.allocations.length} payment(s): {selected.allocations.map((x) => `${x.paymentId.slice(-8)} (${money(x.amountMinor)})`).join(', ')}</span>{selected.externalPayoutReference ? <span className="text-sm">External reference: {selected.externalPayoutReference}</span> : null}{selected.failureReason ? <Notice tone="warning">{selected.failureReason}</Notice> : null}
        {role === 'SUPER_ADMIN' && selected.status === 'PENDING' ? <><label className="grid gap-1 text-sm">External payout reference (optional)<input value={reference} onChange={(e) => setReference(e.target.value)} className="min-h-10 max-w-lg rounded border border-border px-3" /></label><label className="grid gap-1 text-sm">Failure reason (required to mark failed)<input value={failureReason} onChange={(e) => setFailureReason(e.target.value)} className="min-h-10 max-w-lg rounded border border-border px-3" /></label><div className="flex flex-wrap gap-2"><Button size="sm" disabled={busy} onClick={() => void update(selected, 'COMPLETED')}>Confirm payout completed</Button><Button size="sm" variant="secondary" disabled={busy || !failureReason.trim()} onClick={() => void update(selected, 'FAILED')}>Record payout failure</Button></div></> : null}
        <Button size="xs" variant="ghost" className="w-fit" onClick={() => setSelected(null)}>Close details</Button>
      </div> : null}
    </Card> : null}
  </>;
}
