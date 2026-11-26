"use client";

import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import { CloudUpload, Trash2 } from "lucide-react";
import {
    CALL_STATUSES, LEAD_SOURCES, LEAD_STAGES, NOTE_TYPES,
    createLead, listLeadFormOptions, listLeadRelated, saveLeadCallLog, saveLeadNote, updateLead, uploadLeadAvatar,
    type Lead, type LeadCallLog, type LeadInput, type LeadNote, type LeadSource, type LeadStage,
} from "@/lib/api/leads";
import { Drawer, Field, SelectInput } from "./LeadUi";

type Option = { value: string; label: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

function Dropzone({ onFiles, busy, children }: { onFiles: (files: File[]) => void; busy?: boolean; children?: React.ReactNode }) {
    const input = useRef<HTMLInputElement>(null);
    const [over, setOver] = useState(false);
    const drop = (event: DragEvent) => {
        event.preventDefault();
        setOver(false);
        onFiles(Array.from(event.dataTransfer.files));
    };
    return (
        <div
            className={`ld-dropzone${over ? " is-over" : ""}`}
            role="button"
            tabIndex={0}
            onClick={() => input.current?.click()}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setOver(true); }}
            onDragLeave={() => setOver(false)}
            onDrop={drop}
        >
            {children ?? (
                <>
                    <span className="ld-dropzone-icon"><CloudUpload size={22} /></span>
                    <span className="ld-dropzone-text">{busy ? "Uploading…" : "Drag & Drop Your File Here"}</span>
                    <span className="ld-dropzone-hint">PNG, JPG or WebP · up to 5 MB</span>
                </>
            )}
            <input
                ref={input}
                type="file"
                accept={IMAGE_TYPES.join(",")}
                hidden
                onChange={(e) => {
                    onFiles(Array.from(e.target.files ?? []));
                    e.target.value = "";
                }}
            />
        </div>
    );
}

function checkImage(file: File) {
    if (!IMAGE_TYPES.includes(file.type)) return "Only PNG, JPG or WebP images are supported.";
    if (file.size > 5 * 1024 * 1024) return "Images must be 5 MB or smaller.";
    return null;
}

// ---------------------------------------------------------------------------
// Add / edit lead
// ---------------------------------------------------------------------------

export function LeadFormDrawer({
    open, lead, onClose, onSaved,
}: {
    open: boolean; lead?: Lead | null; onClose: () => void; onSaved: (lead: Lead, created: boolean) => void;
}) {
    const [form, setForm] = useState({ name: "", avatarUrl: "", email: "", phone: "", location: "", source: "", stage: "new", assignedTo: "" });
    const [members, setMembers] = useState<Option[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [busy, setBusy] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;
        setErrors({});
        setFormError(null);
        setForm({
            name: lead?.name ?? "", avatarUrl: lead?.avatarUrl ?? "", email: lead?.email ?? "", phone: lead?.phone ?? "",
            location: lead?.location ?? "", source: lead?.source ?? "",
            stage: lead?.stage ?? "new", assignedTo: lead?.assignedTo ?? "",
        });
        listLeadFormOptions()
            .then(({ members: m }) => {
                setMembers(m.map((x) => ({ value: x.id, label: x.role ? `${x.name} · ${x.role}` : x.name })));
            })
            .catch(() => setFormError("Team members could not be loaded."));
    }, [open, lead]);

    const set = (key: keyof typeof form) => (value: string) => {
        setForm((f) => ({ ...f, [key]: value }));
        setErrors((e) => ({ ...e, [key]: "" }));
    };

    const upload = async (files: File[]) => {
        const file = files[0];
        if (!file) return;
        const problem = checkImage(file);
        if (problem) { setErrors((e) => ({ ...e, avatarUrl: problem })); return; }
        setUploading(true);
        try {
            const { url } = await uploadLeadAvatar(file);
            set("avatarUrl")(url);
        } catch (error) {
            setErrors((e) => ({ ...e, avatarUrl: error instanceof Error ? error.message : "Upload failed." }));
        } finally {
            setUploading(false);
        }
    };

    const valid = form.name.trim() && form.source;

    const submit = async () => {
        const next: Record<string, string> = {};
        if (!form.name.trim()) next.name = "Lead name is required.";
        if (form.email && !EMAIL_RE.test(form.email.trim())) next.email = "Enter a valid email address.";
        if (!form.source) next.source = "Choose a lead source.";
        setErrors(next);
        if (Object.values(next).some(Boolean)) return;
        const payload: LeadInput = {
            name: form.name.trim(), avatarUrl: form.avatarUrl || null, email: form.email.trim() || null,
            phone: form.phone.trim() || null, location: form.location.trim() || null,
            source: form.source as LeadSource, stage: form.stage as LeadStage, assignedTo: form.assignedTo || null,
        };
        setBusy(true);
        setFormError(null);
        try {
            const saved = lead ? await updateLead(lead.id, payload) : await createLead(payload);
            onSaved(saved, !lead);
        } catch (error) {
            setFormError(error instanceof Error ? error.message : "Lead could not be saved.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <Drawer
            title={lead ? "Edit Lead" : "Add Lead"}
            open={open}
            onClose={onClose}
            footer={
                <>
                    <button type="button" className="ld-btn" onClick={onClose}>Cancel</button>
                    <button type="button" className="ld-btn ld-btn--primary" disabled={!valid || busy || uploading} onClick={submit}>
                        {busy ? "Saving…" : lead ? "Save Changes" : "Add"}
                    </button>
                </>
            }
        >
            {formError ? <p className="ld-form-error" role="alert">{formError}</p> : null}
            <Field label="Profile Picture" error={errors.avatarUrl} group>
                {form.avatarUrl ? (
                    <div className="ld-avatar-preview">
                        <img src={form.avatarUrl} alt="" />
                        <button type="button" className="ld-btn" onClick={() => set("avatarUrl")("")}><Trash2 size={16} /> Remove</button>
                    </div>
                ) : (
                    <Dropzone onFiles={upload} busy={uploading} />
                )}
            </Field>
            <Field label="Lead Name" required error={errors.name}>
                <input value={form.name} onChange={(e) => set("name")(e.target.value)} placeholder="Enter Lead Name" maxLength={160} autoFocus />
            </Field>
            <Field label="Email" error={errors.email}>
                <input type="email" value={form.email} onChange={(e) => set("email")(e.target.value)} placeholder="example@gmail.com" maxLength={254} />
            </Field>
            <Field label="Phone">
                <input type="tel" value={form.phone} onChange={(e) => set("phone")(e.target.value)} placeholder="+91 123456789" maxLength={40} />
            </Field>
            <Field label="Location">
                <input value={form.location} onChange={(e) => set("location")(e.target.value)} placeholder="Enter Location" maxLength={200} />
            </Field>
            <Field label="Lead Source" required error={errors.source}>
                <SelectInput value={form.source} onChange={set("source")} placeholder="Choose Lead Source" options={LEAD_SOURCES} />
            </Field>
            {lead ? (
                <Field label="Stage">
                    <SelectInput value={form.stage} onChange={set("stage")} options={LEAD_STAGES} />
                </Field>
            ) : null}
            <Field label="Assign to">
                <SelectInput value={form.assignedTo} onChange={set("assignedTo")} placeholder="Choose Team Member" options={members} />
            </Field>
        </Drawer>
    );
}

// ---------------------------------------------------------------------------
// Call log (new / view / edit)
// ---------------------------------------------------------------------------

export function CallLogDrawer({
    open, leadId, log, onClose, onSaved,
}: {
    open: boolean; leadId: string; log?: LeadCallLog | null; onClose: () => void; onSaved: (log: LeadCallLog) => void;
}) {
    const [form, setForm] = useState({ title: "", callType: "outbound", status: "connected", durationMinutes: "", notes: "" });
    const [editing, setEditing] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;
        setError(null);
        setEditing(!log);
        setForm({
            title: log?.title ?? "", callType: log?.callType ?? "outbound", status: log?.status ?? "connected",
            durationMinutes: log?.durationMinutes != null ? String(log.durationMinutes) : "", notes: log?.notes ?? "",
        });
    }, [open, log]);

    const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));
    const duration = form.durationMinutes.trim();
    const durationValid = !duration || (/^\d+$/.test(duration) && Number(duration) <= 1440);

    const submit = async () => {
        if (!editing) { setEditing(true); return; }
        if (!form.title.trim() || !durationValid) return;
        setBusy(true);
        setError(null);
        try {
            const saved = await saveLeadCallLog(leadId, {
                title: form.title.trim(), callType: form.callType, status: form.status,
                durationMinutes: duration ? Number(duration) : null, notes: form.notes.trim() || null,
            }, log?.id);
            onSaved(saved);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Call log could not be saved.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <Drawer
            title={log ? `Call Log - ${log.code}` : "New Call Log"}
            open={open}
            onClose={onClose}
            footer={
                <>
                    <button type="button" className="ld-btn" onClick={onClose}>Cancel</button>
                    <button type="button" className="ld-btn ld-btn--primary" disabled={busy || (editing && (!form.title.trim() || !durationValid))} onClick={submit}>
                        {busy ? "Saving…" : !log ? "Add" : editing ? "Save Call Log" : "Edit Call Log"}
                    </button>
                </>
            }
        >
            {error ? <p className="ld-form-error" role="alert">{error}</p> : null}
            <fieldset className="ld-fieldset" disabled={!editing}>
                <Field label="Purpose / Title" required>
                    <input value={form.title} onChange={(e) => set("title")(e.target.value)} placeholder="Enter Call Purpose" maxLength={200} autoFocus={!log} />
                </Field>
                <Field label="Type">
                    <SelectInput value={form.callType} onChange={set("callType")} options={[{ value: "outbound", label: "Outbound" }, { value: "inbound", label: "Inbound" }]} />
                </Field>
                <Field label="Status" required>
                    <SelectInput value={form.status} onChange={set("status")} options={CALL_STATUSES} />
                </Field>
                <Field label="Duration (Minutes)" error={durationValid ? null : "Enter whole minutes between 0 and 1440."}>
                    <input inputMode="numeric" value={form.durationMinutes} onChange={(e) => set("durationMinutes")(e.target.value)} placeholder="0" />
                </Field>
                <Field label="Notes">
                    <textarea value={form.notes} onChange={(e) => set("notes")(e.target.value)} placeholder="What was discussed" rows={10} maxLength={10000} />
                </Field>
            </fieldset>
        </Drawer>
    );
}

// ---------------------------------------------------------------------------
// Note (new / view / edit)
// ---------------------------------------------------------------------------

export function NoteDrawer({
    open, leadId, note, onClose, onSaved,
}: {
    open: boolean; leadId: string; note?: LeadNote | null; onClose: () => void; onSaved: (note: LeadNote) => void;
}) {
    const empty = { title: "", body: "", noteType: "general", visibility: "", boqId: "", projectId: "", invoiceId: "" };
    const [form, setForm] = useState(empty);
    const [attachments, setAttachments] = useState<Array<{ name: string; url: string }>>([]);
    const [options, setOptions] = useState<{ boqs: Option[]; projects: Option[]; invoices: Option[] }>({ boqs: [], projects: [], invoices: [] });
    const [editing, setEditing] = useState(true);
    const [busy, setBusy] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadOptions = useCallback(async () => {
        try {
            const [boqs, projects, invoices] = await Promise.all([
                listLeadRelated<{ id: string; code: string; version: string }>(leadId, "boqs", 1, 100),
                listLeadRelated<{ id: string; name: string; projectCode: string }>(leadId, "projects", 1, 100),
                listLeadRelated<{ id: string; code: string }>(leadId, "invoices", 1, 100),
            ]);
            setOptions({
                boqs: boqs.items.map((b) => ({ value: b.id, label: `${b.code} ${b.version}` })),
                projects: projects.items.map((p) => ({ value: p.id, label: p.projectCode ? `${p.name} · ${p.projectCode}` : p.name })),
                invoices: invoices.items.map((i) => ({ value: i.id, label: i.code })),
            });
        } catch {
            setError("Linked records could not be loaded.");
        }
    }, [leadId]);

    useEffect(() => {
        if (!open) return;
        setError(null);
        setEditing(!note);
        setForm(note ? {
            title: note.title, body: note.body ?? "", noteType: note.noteType, visibility: note.visibility,
            boqId: note.boqId ?? "", projectId: note.projectId ?? "", invoiceId: note.invoiceId ?? "",
        } : empty);
        setAttachments(note?.attachments ?? []);
        void loadOptions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, note, loadOptions]);

    const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

    const upload = async (files: File[]) => {
        const room = 10 - attachments.length;
        const picked = files.slice(0, room);
        for (const file of picked) {
            const problem = checkImage(file);
            if (problem) { setError(problem); return; }
        }
        setUploading(true);
        setError(null);
        try {
            const uploaded = await Promise.all(picked.map(async (file) => ({ name: file.name, url: (await uploadLeadAvatar(file)).url })));
            setAttachments((list) => [...list, ...uploaded]);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed.");
        } finally {
            setUploading(false);
        }
    };

    const valid = form.title.trim() && form.visibility;

    const submit = async () => {
        if (!editing) { setEditing(true); return; }
        if (!valid) return;
        setBusy(true);
        setError(null);
        try {
            const saved = await saveLeadNote(leadId, {
                title: form.title.trim(), body: form.body.trim() || null, noteType: form.noteType, visibility: form.visibility,
                boqId: form.boqId || null, projectId: form.projectId || null, invoiceId: form.invoiceId || null, attachments,
            }, note?.id);
            onSaved(saved);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Note could not be saved.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <Drawer
            title={note ? `Note - ${note.code}` : "New Note"}
            open={open}
            onClose={onClose}
            footer={
                <>
                    <button type="button" className="ld-btn" onClick={onClose}>Cancel</button>
                    <button type="button" className="ld-btn ld-btn--primary" disabled={busy || uploading || (editing && !valid)} onClick={submit}>
                        {busy ? "Saving…" : !note ? "Add" : editing ? "Save Note" : "Edit Note"}
                    </button>
                </>
            }
        >
            {error ? <p className="ld-form-error" role="alert">{error}</p> : null}
            <fieldset className="ld-fieldset" disabled={!editing}>
                <Field label="Note Title" required>
                    <input value={form.title} onChange={(e) => set("title")(e.target.value)} placeholder="Enter Note Title" maxLength={200} autoFocus={!note} />
                </Field>
                <Field label="Note">
                    <textarea value={form.body} onChange={(e) => set("body")(e.target.value)} placeholder="Start writing your note" rows={9} maxLength={20000} />
                </Field>
                <div className="ld-field-row">
                    <Field label="Note Type">
                        <SelectInput value={form.noteType} onChange={set("noteType")} options={NOTE_TYPES} />
                    </Field>
                    <Field label="Visibility" required>
                        <SelectInput value={form.visibility} onChange={set("visibility")} placeholder="Choose Visibility" options={[{ value: "private", label: "Private" }, { value: "team", label: "Team" }]} />
                    </Field>
                </div>
                <div className="ld-field-row">
                    <Field label="Link BOQ">
                        <SelectInput value={form.boqId} onChange={set("boqId")} placeholder="Choose BOQ" options={options.boqs} />
                    </Field>
                    <Field label="Link Project">
                        <SelectInput value={form.projectId} onChange={set("projectId")} placeholder="Choose Project" options={options.projects} />
                    </Field>
                </div>
                <Field label="Link Invoice">
                    <SelectInput value={form.invoiceId} onChange={set("invoiceId")} placeholder="Choose Invoice" options={options.invoices} />
                </Field>
                <div className="ld-field">
                    <span className="ld-field-label">Attachments</span>
                    {attachments.length ? (
                        <ul className="ld-attachments">
                            {attachments.map((file, index) => (
                                <li key={`${file.name}-${index}`}>
                                    <a href={file.url} target="_blank" rel="noreferrer">{file.name}</a>
                                    {editing ? (
                                        <button type="button" aria-label={`Remove ${file.name}`} onClick={() => setAttachments((list) => list.filter((_, i) => i !== index))}>
                                            <Trash2 size={14} />
                                        </button>
                                    ) : null}
                                </li>
                            ))}
                        </ul>
                    ) : null}
                    {editing && attachments.length < 10 ? <Dropzone onFiles={upload} busy={uploading} /> : null}
                    {!editing && !attachments.length ? <span className="ld-muted">No attachments</span> : null}
                </div>
            </fieldset>
        </Drawer>
    );
}
