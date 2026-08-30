import React, { useState, useEffect, useCallback } from "react";
import {
  ChefHat,
  Phone,
  Plus,
  X,
  ArrowRight,
  ArrowLeft,
  Trash2,
  MapPin,
  Clock,
  IndianRupee,
  Search,
  UtensilsCrossed,
  Flame,
} from "lucide-react";

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Space+Mono:wght@400;700&display=swap');`;

const LEAD_STAGES = [
  { id: "to_call", label: "TO CALL" },
  { id: "called", label: "CALLED" },
  { id: "interested", label: "INTERESTED" },
  { id: "follow_up", label: "FOLLOW-UP" },
  { id: "converted", label: "CONVERTED" },
  { id: "lost", label: "LOST" },
];

const PROJECT_STAGES = [
  { id: "brief", label: "BRIEF" },
  { id: "design", label: "DESIGN" },
  { id: "build", label: "BUILD" },
  { id: "review", label: "REVIEW" },
  { id: "live", label: "LIVE" },
];

const STORAGE_KEY = "crm-data";

function uid() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function ticketNo(id) {
  return "#" + id;
}

function stageColor(stageId) {
  if (stageId === "converted" || stageId === "live") return "var(--sage)";
  if (stageId === "lost") return "var(--rust)";
  if (stageId === "follow_up" || stageId === "review") return "var(--accent)";
  return "var(--line-bright)";
}

function TornEdge({ color = "var(--paper)" }) {
  return (
    <div
      aria-hidden="true"
      style={{
        height: "9px",
        width: "100%",
        backgroundImage: `radial-gradient(circle at 8px 0px, transparent 7px, ${color} 7.5px)`,
        backgroundSize: "16px 16px",
        backgroundRepeat: "repeat-x",
        backgroundPosition: "left top",
        marginBottom: "-1px",
      }}
    />
  );
}

function Ticket({ children, accent, onClick }) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer select-none"
      style={{
        background: "var(--paper)",
        color: "var(--ink)",
        borderRadius: "2px",
        boxShadow: "0 3px 0 rgba(0,0,0,0.25), 0 6px 14px rgba(0,0,0,0.35)",
        borderLeft: `4px solid ${accent}`,
        transform: "rotate(-0.35deg)",
      }}
    >
      <TornEdge />
      <div style={{ padding: "12px 14px 14px 14px" }}>{children}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block mb-3">
      <span
        className="block mb-1 text-[10px] tracking-widest"
        style={{ color: "var(--muted)", fontFamily: "'Space Mono', monospace" }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

const inputStyle = {
  width: "100%",
  background: "var(--rail)",
  border: "1px solid var(--line)",
  color: "var(--paper)",
  padding: "8px 10px",
  borderRadius: "3px",
  fontFamily: "'Space Mono', monospace",
  fontSize: "13px",
  outline: "none",
};

function TextInput(props) {
  return <input {...props} style={{ ...inputStyle, ...(props.style || {}) }} />;
}
function TextArea(props) {
  return <textarea {...props} style={{ ...inputStyle, ...(props.style || {}), resize: "vertical" }} />;
}
function Select(props) {
  return (
    <select {...props} style={{ ...inputStyle, ...(props.style || {}) }}>
      {props.children}
    </select>
  );
}

function Modal({ title, onClose, onSubmit, submitLabel = "Save", children, danger }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(10,12,10,0.72)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md"
        style={{
          background: "var(--bg2)",
          border: "1px solid var(--line)",
          borderRadius: "6px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--line)" }}
        >
          <h3
            style={{
              fontFamily: "'Oswald', sans-serif",
              letterSpacing: "0.06em",
              color: "var(--paper)",
              fontSize: "16px",
              fontWeight: 600,
            }}
          >
            {title}
          </h3>
          <button onClick={onClose} aria-label="Close">
            <X size={18} color="var(--muted)" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        <div
          className="flex items-center justify-end gap-3 px-5 py-4"
          style={{ borderTop: "1px solid var(--line)" }}
        >
          <button
            onClick={onClose}
            className="text-xs tracking-widest px-3 py-2"
            style={{ color: "var(--muted)", fontFamily: "'Space Mono', monospace" }}
          >
            CANCEL
          </button>
          {onSubmit && (
            <button
              onClick={onSubmit}
              className="text-xs tracking-widest px-4 py-2 rounded"
              style={{
                background: danger ? "var(--rust)" : "var(--accent)",
                color: "var(--bg)",
                fontFamily: "'Space Mono', monospace",
                fontWeight: 700,
              }}
            >
              {submitLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const emptyLead = () => ({
  id: uid(),
  name: "",
  phone: "",
  area: "",
  stage: "to_call",
  followUpDate: "",
  notes: "",
  createdAt: Date.now(),
});

const emptyProject = () => ({
  id: uid(),
  restaurantName: "",
  contactName: "",
  phone: "",
  stage: "brief",
  deadline: "",
  value: "",
  paymentStatus: "unpaid",
  notes: "",
  createdAt: Date.now(),
});

export default function PipelineTracker() {
  const [tab, setTab] = useState("leads");
  const [leads, setLeads] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [query, setQuery] = useState("");

  const [leadModal, setLeadModal] = useState(null); // lead object being added/edited, or null
  const [projectModal, setProjectModal] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);

  // Load once
  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY, false);
        if (res && res.value) {
          const parsed = JSON.parse(res.value);
          setLeads(parsed.leads || []);
          setProjects(parsed.projects || []);
        }
      } catch (e) {
        // no existing data yet — that's fine
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const persist = useCallback(async (nextLeads, nextProjects) => {
    try {
      const result = await window.storage.set(
        STORAGE_KEY,
        JSON.stringify({ leads: nextLeads, projects: nextProjects }),
        false
      );
      setSaveError(!result);
    } catch (e) {
      setSaveError(true);
    }
  }, []);

  useEffect(() => {
    if (loaded) persist(leads, projects);
  }, [leads, projects, loaded, persist]);

  function saveLead(lead) {
    setLeads((prev) => {
      const exists = prev.some((l) => l.id === lead.id);
      return exists ? prev.map((l) => (l.id === lead.id ? lead : l)) : [lead, ...prev];
    });
    setLeadModal(null);
  }
  function deleteLead(id) {
    setLeads((prev) => prev.filter((l) => l.id !== id));
    setLeadModal(null);
  }
  function moveLead(id, dir) {
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const idx = LEAD_STAGES.findIndex((s) => s.id === l.stage);
        const next = Math.min(LEAD_STAGES.length - 1, Math.max(0, idx + dir));
        return { ...l, stage: LEAD_STAGES[next].id };
      })
    );
  }

  function saveProject(project) {
    setProjects((prev) => {
      const exists = prev.some((p) => p.id === project.id);
      return exists ? prev.map((p) => (p.id === project.id ? project : p)) : [project, ...prev];
    });
    setProjectModal(null);
  }
  function deleteProject(id) {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setProjectModal(null);
  }
  function moveProject(id, dir) {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const idx = PROJECT_STAGES.findIndex((s) => s.id === p.stage);
        const next = Math.min(PROJECT_STAGES.length - 1, Math.max(0, idx + dir));
        return { ...p, stage: PROJECT_STAGES[next].id };
      })
    );
  }

  function convertLeadToProject(lead) {
    const project = {
      ...emptyProject(),
      restaurantName: lead.name,
      contactName: "",
      phone: lead.phone,
      notes: lead.notes,
    };
    setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, stage: "converted" } : l)));
    setProjects((prev) => [project, ...prev]);
    setTab("projects");
    setProjectModal(project);
  }

  function clearAll() {
    setLeads([]);
    setProjects([]);
    setConfirmClear(false);
  }

  const filteredLeads = leads.filter((l) =>
    (l.name + l.area + l.phone).toLowerCase().includes(query.toLowerCase())
  );
  const filteredProjects = projects.filter((p) =>
    (p.restaurantName + p.contactName + p.phone).toLowerCase().includes(query.toLowerCase())
  );

  const leadCounts = LEAD_STAGES.reduce((acc, s) => {
    acc[s.id] = filteredLeads.filter((l) => l.stage === s.id).length;
    return acc;
  }, {});
  const projectCounts = PROJECT_STAGES.reduce((acc, s) => {
    acc[s.id] = filteredProjects.filter((p) => p.stage === s.id).length;
    return acc;
  }, {});

  return (
    <div
      style={{
        "--bg": "#181C19",
        "--bg2": "#20241F",
        "--rail": "#242923",
        "--paper": "#F2ECDD",
        "--ink": "#26241C",
        "--accent": "#E8A33D",
        "--rust": "#C1502E",
        "--sage": "#6B8F71",
        "--line": "#3A413C",
        "--line-bright": "#565F58",
        "--muted": "#8B9389",
        background: "var(--bg)",
        minHeight: "100%",
        fontFamily: "'Space Mono', monospace",
      }}
      className="w-full"
    >
      <style>{FONT_IMPORT}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid var(--line)" }} className="px-5 py-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div
              style={{
                background: "var(--accent)",
                borderRadius: "6px",
                width: "36px",
                height: "36px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ChefHat size={20} color="var(--bg)" strokeWidth={2.4} />
            </div>
            <div>
              <h1
                style={{
                  fontFamily: "'Oswald', sans-serif",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  color: "var(--paper)",
                  fontSize: "20px",
                  lineHeight: 1,
                }}
              >
                PIPELINE
              </h1>
              <p style={{ color: "var(--muted)", fontSize: "10px", letterSpacing: "0.1em", marginTop: "3px" }}>
                LEADS RAIL &amp; PROJECT RAIL
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-2 px-3 py-2"
              style={{ background: "var(--rail)", borderRadius: "5px", border: "1px solid var(--line)" }}
            >
              <Search size={14} color="var(--muted)" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="search..."
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "var(--paper)",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "12px",
                  width: "120px",
                }}
              />
            </div>
            <button
              onClick={() => setConfirmClear(true)}
              title="Clear all data"
              className="p-2 rounded"
              style={{ border: "1px solid var(--line)" }}
            >
              <Trash2 size={14} color="var(--muted)" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mt-4">
          {[
            { id: "leads", label: "LEADS", icon: Phone, count: leads.length },
            { id: "projects", label: "PROJECTS", icon: UtensilsCrossed, count: projects.length },
          ].map((t) => {
            const active = tab === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex items-center gap-2 px-4 py-2 text-xs tracking-widest"
                style={{
                  fontFamily: "'Oswald', sans-serif",
                  fontWeight: 600,
                  color: active ? "var(--bg)" : "var(--muted)",
                  background: active ? "var(--accent)" : "transparent",
                  borderRadius: "4px 4px 0 0",
                  border: active ? "none" : "1px solid transparent",
                }}
              >
                <Icon size={13} />
                {t.label}
                <span
                  style={{
                    background: active ? "rgba(0,0,0,0.2)" : "var(--rail)",
                    padding: "1px 6px",
                    borderRadius: "10px",
                    fontSize: "10px",
                  }}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {!loaded ? (
        <div className="p-10 text-center" style={{ color: "var(--muted)" }}>
          Loading pipeline...
        </div>
      ) : (
        <div className="p-5">
          {saveError && (
            <div
              className="mb-4 px-4 py-2 rounded text-xs"
              style={{ background: "rgba(193,80,46,0.15)", color: "var(--rust)", border: "1px solid var(--rust)" }}
            >
              Couldn't save your last change. Your data may not persist — try again in a moment.
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <p style={{ color: "var(--muted)", fontSize: "11px", letterSpacing: "0.08em" }}>
              {tab === "leads" ? filteredLeads.length : filteredProjects.length} ticket
              {(tab === "leads" ? filteredLeads.length : filteredProjects.length) === 1 ? "" : "s"} on the rail
            </p>
            <button
              onClick={() =>
                tab === "leads" ? setLeadModal(emptyLead()) : setProjectModal(emptyProject())
              }
              className="flex items-center gap-2 px-4 py-2 text-xs tracking-widest rounded"
              style={{
                background: "var(--accent)",
                color: "var(--bg)",
                fontFamily: "'Oswald', sans-serif",
                fontWeight: 700,
              }}
            >
              <Plus size={14} strokeWidth={3} />
              {tab === "leads" ? "NEW LEAD" : "NEW PROJECT"}
            </button>
          </div>

          {/* Board */}
          <div className="flex gap-4 overflow-x-auto pb-4">
            {(tab === "leads" ? LEAD_STAGES : PROJECT_STAGES).map((stage) => (
              <div key={stage.id} style={{ minWidth: "250px", flex: "0 0 250px" }}>
                <div
                  className="flex items-center justify-between px-3 py-2 mb-3"
                  style={{
                    background: "var(--rail)",
                    borderRadius: "5px",
                    borderTop: `3px solid ${stageColor(stage.id)}`,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Oswald', sans-serif",
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      fontSize: "12px",
                      color: "var(--paper)",
                    }}
                  >
                    {stage.label}
                  </span>
                  <span style={{ color: "var(--muted)", fontSize: "11px" }}>
                    {tab === "leads" ? leadCounts[stage.id] : projectCounts[stage.id]}
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {tab === "leads"
                    ? filteredLeads
                        .filter((l) => l.stage === stage.id)
                        .map((lead) => (
                          <Ticket
                            key={lead.id}
                            accent={stageColor(lead.stage)}
                            onClick={() => setLeadModal(lead)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p style={{ fontWeight: 700, fontSize: "13px", lineHeight: 1.3 }}>
                                {lead.name || "Untitled lead"}
                              </p>
                              <span style={{ fontSize: "10px", color: "var(--ink)", opacity: 0.5 }}>
                                {ticketNo(lead.id)}
                              </span>
                            </div>
                            {lead.area && (
                              <p className="flex items-center gap-1 mt-1" style={{ fontSize: "11px", opacity: 0.75 }}>
                                <MapPin size={11} /> {lead.area}
                              </p>
                            )}
                            {lead.phone && (
                              <p className="flex items-center gap-1 mt-1" style={{ fontSize: "11px", opacity: 0.75 }}>
                                <Phone size={11} /> {lead.phone}
                              </p>
                            )}
                            {lead.stage === "follow_up" && lead.followUpDate && (
                              <p className="flex items-center gap-1 mt-1" style={{ fontSize: "11px", color: "var(--rust)" }}>
                                <Clock size={11} /> {lead.followUpDate}
                              </p>
                            )}
                            <div className="flex items-center justify-between mt-3" style={{ borderTop: "1px dashed rgba(0,0,0,0.2)", paddingTop: "8px" }}>
                              <div className="flex gap-1">
                                <button
                                  onClick={(e) => { e.stopPropagation(); moveLead(lead.id, -1); }}
                                  disabled={stage.id === LEAD_STAGES[0].id}
                                  style={{ opacity: stage.id === LEAD_STAGES[0].id ? 0.25 : 1 }}
                                >
                                  <ArrowLeft size={13} />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); moveLead(lead.id, 1); }}
                                  disabled={stage.id === LEAD_STAGES[LEAD_STAGES.length - 1].id}
                                  style={{ opacity: stage.id === LEAD_STAGES[LEAD_STAGES.length - 1].id ? 0.25 : 1 }}
                                >
                                  <ArrowRight size={13} />
                                </button>
                              </div>
                              {(stage.id === "interested" || stage.id === "converted") && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); convertLeadToProject(lead); }}
                                  className="flex items-center gap-1 px-2 py-1 rounded"
                                  style={{ background: "var(--sage)", color: "#fff", fontSize: "9px", fontWeight: 700 }}
                                >
                                  <Flame size={10} /> TO PROJECT
                                </button>
                              )}
                            </div>
                          </Ticket>
                        ))
                    : filteredProjects
                        .filter((p) => p.stage === stage.id)
                        .map((project) => (
                          <Ticket
                            key={project.id}
                            accent={stageColor(project.stage)}
                            onClick={() => setProjectModal(project)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p style={{ fontWeight: 700, fontSize: "13px", lineHeight: 1.3 }}>
                                {project.restaurantName || "Untitled project"}
                              </p>
                              <span style={{ fontSize: "10px", color: "var(--ink)", opacity: 0.5 }}>
                                {ticketNo(project.id)}
                              </span>
                            </div>
                            {project.contactName && (
                              <p style={{ fontSize: "11px", opacity: 0.75, marginTop: "4px" }}>{project.contactName}</p>
                            )}
                            {project.phone && (
                              <p className="flex items-center gap-1 mt-1" style={{ fontSize: "11px", opacity: 0.75 }}>
                                <Phone size={11} /> {project.phone}
                              </p>
                            )}
                            {project.deadline && (
                              <p className="flex items-center gap-1 mt-1" style={{ fontSize: "11px", opacity: 0.75 }}>
                                <Clock size={11} /> {project.deadline}
                              </p>
                            )}
                            {project.value && (
                              <p className="flex items-center gap-1 mt-1" style={{ fontSize: "11px", opacity: 0.85, fontWeight: 700 }}>
                                <IndianRupee size={11} /> {project.value} · {project.paymentStatus}
                              </p>
                            )}
                            <div className="flex items-center justify-between mt-3" style={{ borderTop: "1px dashed rgba(0,0,0,0.2)", paddingTop: "8px" }}>
                              <div className="flex gap-1">
                                <button
                                  onClick={(e) => { e.stopPropagation(); moveProject(project.id, -1); }}
                                  disabled={stage.id === PROJECT_STAGES[0].id}
                                  style={{ opacity: stage.id === PROJECT_STAGES[0].id ? 0.25 : 1 }}
                                >
                                  <ArrowLeft size={13} />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); moveProject(project.id, 1); }}
                                  disabled={stage.id === PROJECT_STAGES[PROJECT_STAGES.length - 1].id}
                                  style={{ opacity: stage.id === PROJECT_STAGES[PROJECT_STAGES.length - 1].id ? 0.25 : 1 }}
                                >
                                  <ArrowRight size={13} />
                                </button>
                              </div>
                            </div>
                          </Ticket>
                        ))}

                  {(tab === "leads"
                    ? filteredLeads.filter((l) => l.stage === stage.id).length
                    : filteredProjects.filter((p) => p.stage === stage.id).length) === 0 && (
                    <p style={{ color: "var(--muted)", fontSize: "11px", fontStyle: "italic", padding: "8px 2px" }}>
                      Nothing here yet.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lead modal */}
      {leadModal && (
        <Modal
          title={leads.some((l) => l.id === leadModal.id) ? "EDIT LEAD" : "NEW LEAD"}
          onClose={() => setLeadModal(null)}
          onSubmit={() => saveLead(leadModal)}
        >
          <Field label="RESTAURANT NAME">
            <TextInput
              value={leadModal.name}
              onChange={(e) => setLeadModal({ ...leadModal, name: e.target.value })}
              placeholder="e.g. Sambarpot"
              autoFocus
            />
          </Field>
          <Field label="PHONE">
            <TextInput
              value={leadModal.phone}
              onChange={(e) => setLeadModal({ ...leadModal, phone: e.target.value })}
              placeholder="+91..."
            />
          </Field>
          <Field label="AREA">
            <TextInput
              value={leadModal.area}
              onChange={(e) => setLeadModal({ ...leadModal, area: e.target.value })}
              placeholder="e.g. Lajpat Nagar"
            />
          </Field>
          <Field label="STAGE">
            <Select
              value={leadModal.stage}
              onChange={(e) => setLeadModal({ ...leadModal, stage: e.target.value })}
            >
              {LEAD_STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
          {leadModal.stage === "follow_up" && (
            <Field label="FOLLOW-UP DATE">
              <TextInput
                type="date"
                value={leadModal.followUpDate}
                onChange={(e) => setLeadModal({ ...leadModal, followUpDate: e.target.value })}
              />
            </Field>
          )}
          <Field label="NOTES">
            <TextArea
              rows={3}
              value={leadModal.notes}
              onChange={(e) => setLeadModal({ ...leadModal, notes: e.target.value })}
              placeholder="Call notes, objections, what they said..."
            />
          </Field>
          {leads.some((l) => l.id === leadModal.id) && (
            <button
              onClick={() => deleteLead(leadModal.id)}
              className="flex items-center gap-2 mt-1 text-xs"
              style={{ color: "var(--rust)" }}
            >
              <Trash2 size={13} /> Delete this lead
            </button>
          )}
        </Modal>
      )}

      {/* Project modal */}
      {projectModal && (
        <Modal
          title={projects.some((p) => p.id === projectModal.id) ? "EDIT PROJECT" : "NEW PROJECT"}
          onClose={() => setProjectModal(null)}
          onSubmit={() => saveProject(projectModal)}
        >
          <Field label="RESTAURANT NAME">
            <TextInput
              value={projectModal.restaurantName}
              onChange={(e) => setProjectModal({ ...projectModal, restaurantName: e.target.value })}
              autoFocus
            />
          </Field>
          <Field label="CONTACT PERSON">
            <TextInput
              value={projectModal.contactName}
              onChange={(e) => setProjectModal({ ...projectModal, contactName: e.target.value })}
              placeholder="Owner / manager name"
            />
          </Field>
          <Field label="PHONE">
            <TextInput
              value={projectModal.phone}
              onChange={(e) => setProjectModal({ ...projectModal, phone: e.target.value })}
            />
          </Field>
          <Field label="STAGE">
            <Select
              value={projectModal.stage}
              onChange={(e) => setProjectModal({ ...projectModal, stage: e.target.value })}
            >
              {PROJECT_STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="DEADLINE">
            <TextInput
              type="date"
              value={projectModal.deadline}
              onChange={(e) => setProjectModal({ ...projectModal, deadline: e.target.value })}
            />
          </Field>
          <Field label="PROJECT VALUE (₹)">
            <TextInput
              type="number"
              value={projectModal.value}
              onChange={(e) => setProjectModal({ ...projectModal, value: e.target.value })}
              placeholder="e.g. 12000"
            />
          </Field>
          <Field label="PAYMENT STATUS">
            <Select
              value={projectModal.paymentStatus}
              onChange={(e) => setProjectModal({ ...projectModal, paymentStatus: e.target.value })}
            >
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partial / advance received</option>
              <option value="paid">Paid in full</option>
            </Select>
          </Field>
          <Field label="NOTES">
            <TextArea
              rows={3}
              value={projectModal.notes}
              onChange={(e) => setProjectModal({ ...projectModal, notes: e.target.value })}
              placeholder="Scope, requirements, revisions..."
            />
          </Field>
          {projects.some((p) => p.id === projectModal.id) && (
            <button
              onClick={() => deleteProject(projectModal.id)}
              className="flex items-center gap-2 mt-1 text-xs"
              style={{ color: "var(--rust)" }}
            >
              <Trash2 size={13} /> Delete this project
            </button>
          )}
        </Modal>
      )}

      {/* Confirm clear */}
      {confirmClear && (
        <Modal
          title="CLEAR ALL DATA?"
          onClose={() => setConfirmClear(false)}
          onSubmit={clearAll}
          submitLabel="CLEAR EVERYTHING"
          danger
        >
          <p style={{ color: "var(--paper)", fontSize: "13px" }}>
            This deletes every lead and project you've saved. This can't be undone.
          </p>
        </Modal>
      )}
    </div>
  );
}
