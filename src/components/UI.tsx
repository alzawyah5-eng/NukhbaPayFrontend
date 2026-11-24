import type { ReactNode } from 'react';
import { Search, ChevronDown, X, AlertCircle, CheckCircle2, Info } from 'lucide-react';

export type Tone = 'success' | 'warning' | 'danger' | 'purple' | 'neutral';

export function StatusBadge({ status }: { status: string }) {
  const tone: Tone = ['Active','Approved','Enabled','Complete','MFA enabled','Success'].includes(status) ? 'success'
    : ['Pending','Review','Open','Awaiting approval'].includes(status) ? 'warning'
    : ['Suspended','Denied','Rejected','Revoked','Failed','High'].includes(status) ? 'danger' : 'neutral';
  return <span className={`badge badge--${tone}`}>{status}</span>;
}

export function StatCard({ label, value, detail, accent = 'purple' }: { label: string; value: string | number; detail: string; accent?: 'purple' | 'green' }) {
  return <div className="stat-card"><div className="stat-label"><span className={`stat-dot stat-dot--${accent}`} />{label}</div><div className="stat-value">{value}</div><div className={`stat-detail stat-detail--${accent}`}>{detail}</div></div>;
}

export function StatGrid({ children }: { children: ReactNode }) { return <div className="stat-grid">{children}</div>; }

export function Panel({ title, subtitle, children, action, className = '' }: { title?: string; subtitle?: string; children: ReactNode; action?: ReactNode; className?: string }) {
  return <section className={`panel ${className}`}><div className="panel-head"><div>{title && <h2>{title}</h2>}{subtitle && <p>{subtitle}</p>}</div>{action}</div>{children}</section>;
}

export function Button({ children, variant = 'primary', onClick, disabled = false, type = 'button', className = '', title }: { children: ReactNode; variant?: 'primary' | 'secondary' | 'danger' | 'ghost'; onClick?: () => void; disabled?: boolean; type?: 'submit' | 'button'; className?: string; title?: string }) {
  return <button type={type} className={`btn btn--${variant} ${className}`} onClick={onClick} disabled={disabled} title={title}>{children}</button>;
}

export function SearchField({ value, onChange, placeholder = 'Search...', label }: { value: string; onChange: (s: string) => void; placeholder?: string; label?: string }) {
  return <label className="search-input"><Search aria-hidden="true" size={16} /><span className="sr-only">{label ?? placeholder}</span><input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} /></label>;
}

export function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (s: string) => void; options: string[] }) {
  return <label className="filter-select"><span className="sr-only">{label}</span><select aria-label={label} value={value} onChange={e => onChange(e.target.value)}>{options.map(o => <option key={o} value={o}>{o}</option>)}</select><ChevronDown aria-hidden="true" size={14}/></label>;
}

export function FormField({ label, value, onChange, placeholder = '', required = false, type = 'text', error, disabled = false }: { label: string; value: string; onChange: (s: string) => void; placeholder?: string; required?: boolean; type?: string; error?: string; disabled?: boolean }) {
  const id = `field-${label.toLowerCase().replace(/[^a-z0-9]+/g,'-')}`;
  return <div className="form-field"><label htmlFor={id}>{label}{required && <span className="required"> *</span>}</label><input id={id} name={id} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined}/>{error && <span className="field-error" id={`${id}-error`}>{error}</span>}</div>;
}

export function FormSelect({ label, value, onChange, options, placeholder = 'Select one', required = false }: { label: string; value: string; onChange: (s: string) => void; options: string[]; placeholder?: string; required?: boolean }) {
  return <div className="form-field"><label>{label}{required && <span className="required"> *</span>}</label><select value={value} onChange={e => onChange(e.target.value)} aria-label={label}><option value="">{placeholder}</option>{options.map(o => <option key={o} value={o}>{o}</option>)}</select></div>;
}

export function DataTable<T extends { id: string }>({ columns, rows, onRowClick, empty = 'No records found.', footer }: { columns: { key: string; label: string; render: (row: T) => ReactNode }[]; rows: T[]; onRowClick?: (row: T) => void; empty?: string; footer?: ReactNode }) {
  return <><div className="table-scroll"><table className="data-table"><thead><tr>{columns.map(c => <th key={c.key} scope="col">{c.label}</th>)}</tr></thead><tbody>{rows.map(r => <tr key={r.id} onClick={onRowClick ? () => onRowClick(r) : undefined} onKeyDown={onRowClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onRowClick(r); } } : undefined} tabIndex={onRowClick ? 0 : undefined} aria-label={onRowClick ? `Open record ${r.id}` : undefined} className={onRowClick ? 'clickable-row' : ''}>{columns.map(c => <td key={c.key}>{c.render(r)}</td>)}</tr>)}</tbody></table></div>{rows.length === 0 && <EmptyState title="No matching records" description={empty}/>} {footer && <div className="table-footer">{footer}</div>}</>;
}

export function EmptyState({ title = 'Nothing here yet', description = 'There is no data to display.' }: { title?: string; description?: string }) {
  return <div className="empty-state"><Search size={25} aria-hidden="true"/><strong>{title}</strong><p>{description}</p></div>;
}

export function Notice({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'success' | 'warning' }) {
  const Icon = tone === 'success' ? CheckCircle2 : tone === 'warning' ? AlertCircle : Info;
  return <div className={`notice notice--${tone}`} role="status"><Icon size={19} aria-hidden="true"/><div>{children}</div></div>;
}

export function ConfirmDialog({ title, body, confirmLabel = 'Confirm', danger = false, onClose, onConfirm, reason, setReason, reasonRequired = false }: { title: string; body: ReactNode; confirmLabel?: string; danger?: boolean; onClose: () => void; onConfirm: () => void; reason?: string; setReason?: (v: string) => void; reasonRequired?: boolean }) {
  return <div className="dialog-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><div className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><div className="dialog-head"><h2 id="dialog-title">{title}</h2><button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={18}/></button></div><div className="dialog-body">{body}{setReason && <div className="form-field"><label htmlFor="decision-reason">Reason{reasonRequired ? ' *' : ''}</label><textarea id="decision-reason" value={reason ?? ''} onChange={e => setReason(e.target.value)} rows={3} placeholder="Explain your decision (demo only)"/></div>}</div><div className="dialog-actions"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} disabled={reasonRequired && !(reason?.trim())}>{confirmLabel}</Button></div></div></div>;
}

export function Pagination({ page, totalPages, onChange, total }: { page: number; totalPages: number; onChange: (n: number) => void; total: number }) {
  return <><span>{total} result{total !== 1 ? 's' : ''} · Page {page} of {totalPages}</span><div className="pagination-controls"><Button variant="secondary" onClick={() => onChange(page - 1)} disabled={page <= 1}>Previous</Button><Button variant="secondary" onClick={() => onChange(page + 1)} disabled={page >= totalPages}>Next</Button></div></>;
}
