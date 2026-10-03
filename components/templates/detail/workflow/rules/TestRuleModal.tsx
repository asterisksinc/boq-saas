"use client";

import React, { useState } from "react";
import { X, Play, CheckCircle2, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { WorkflowRule, simulateRule, SimulationResult } from "@/lib/templates/rules-domain";
import { testWorkflowRule } from "@/lib/api/templates";

interface TestRuleModalProps {
  isOpen: boolean;
  rule: WorkflowRule;
  templateId?: string;
  onClose: () => void;
}

export default function TestRuleModal({
  isOpen,
  rule,
  templateId,
  onClose,
}: TestRuleModalProps) {
  // Test project payload state
  const [testPayload, setTestPayload] = useState<Record<string, any>>({
    estimatedProjectValue: 1500000,
    projectType: "Residential",
    clientType: "Enterprise",
    projectRegion: "Hyderabad",
    marginPercent: 12,
    budgetVariance: 15,
    documentSigned: "Contract",
    milestoneName: "Design Approval",
    taskStatus: "Completed",
  });

  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRunSimulation = async () => {
    try {
      setTesting(true);
      setError(null);

      // Try backend simulation first if templateId is provided
      if (templateId) {
        try {
          const apiRes = await testWorkflowRule(templateId, rule as any, testPayload);
          if (apiRes) {
            setResult({
              matched: apiRes.matched,
              summary: apiRes.summary,
              conditionResults: apiRes.conditionResults,
              executedActions: apiRes.executedActions as any,
            });
            return;
          }
        } catch {
          // Fallback to local domain engine if network/endpoint issues
        }
      }

      // Local domain simulation fallback
      const sim = simulateRule(rule, testPayload);
      setResult(sim);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Simulation failed.";
      setError(msg);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="td-modal-overlay">
      <div className="td-test-rule-modal">
        {/* Header */}
        <div className="td-test-modal-header">
          <div className="title-wrap">
            <div className="tag-pill">TEST SIMULATION</div>
            <h3 className="title">Test Rule: {rule.name}</h3>
            <p className="subtitle">
              Verify condition evaluation and action triggers against sample project parameters.
            </p>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="td-test-modal-body">
          {/* Left: Input Parameters */}
          <div className="td-test-inputs-col">
            <h4 className="col-heading">Sample Project Data</h4>
            <p className="col-sub">Modify attributes to test rule logic boundaries.</p>

            <div className="td-test-fields-grid">
              <div className="td-test-field">
                <label>Estimated Project Value (₹)</label>
                <input
                  type="number"
                  value={testPayload.estimatedProjectValue}
                  onChange={(e) =>
                    setTestPayload({ ...testPayload, estimatedProjectValue: Number(e.target.value) })
                  }
                  className="td-input"
                />
              </div>

              <div className="td-test-field">
                <label>Project Type</label>
                <select
                  value={testPayload.projectType}
                  onChange={(e) => setTestPayload({ ...testPayload, projectType: e.target.value })}
                  className="td-select"
                >
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Villa">Villa</option>
                  <option value="Retail">Retail</option>
                </select>
              </div>

              <div className="td-test-field">
                <label>Client Type</label>
                <select
                  value={testPayload.clientType}
                  onChange={(e) => setTestPayload({ ...testPayload, clientType: e.target.value })}
                  className="td-select"
                >
                  <option value="Enterprise">Enterprise</option>
                  <option value="Individual">Individual</option>
                  <option value="Corporate">Corporate</option>
                </select>
              </div>

              <div className="td-test-field">
                <label>Project Region</label>
                <select
                  value={testPayload.projectRegion}
                  onChange={(e) => setTestPayload({ ...testPayload, projectRegion: e.target.value })}
                  className="td-select"
                >
                  <option value="Hyderabad">Hyderabad</option>
                  <option value="Bangalore">Bangalore</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Delhi NCR">Delhi NCR</option>
                </select>
              </div>

              <div className="td-test-field">
                <label>Margin Percent (%)</label>
                <input
                  type="number"
                  value={testPayload.marginPercent}
                  onChange={(e) =>
                    setTestPayload({ ...testPayload, marginPercent: Number(e.target.value) })
                  }
                  className="td-input"
                />
              </div>

              <div className="td-test-field">
                <label>Budget Variance (%)</label>
                <input
                  type="number"
                  value={testPayload.budgetVariance}
                  onChange={(e) =>
                    setTestPayload({ ...testPayload, budgetVariance: Number(e.target.value) })
                  }
                  className="td-input"
                />
              </div>

              <div className="td-test-field">
                <label>Document Signed</label>
                <select
                  value={testPayload.documentSigned}
                  onChange={(e) => setTestPayload({ ...testPayload, documentSigned: e.target.value })}
                  className="td-select"
                >
                  <option value="Contract">Contract</option>
                  <option value="Client Proposal">Client Proposal</option>
                  <option value="Work Order">Work Order</option>
                </select>
              </div>

              <div className="td-test-field">
                <label>Milestone Completed</label>
                <select
                  value={testPayload.milestoneName}
                  onChange={(e) => setTestPayload({ ...testPayload, milestoneName: e.target.value })}
                  className="td-select"
                >
                  <option value="Design Approval">Design Approval</option>
                  <option value="Concept Design">Concept Design</option>
                  <option value="BOQ Finalisation">BOQ Finalisation</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              className="td-btn-run-simulation"
              onClick={handleRunSimulation}
              disabled={testing}
            >
              {testing ? <RefreshCw size={14} className="spin-icon" /> : <Play size={14} />}
              <span>{testing ? "Evaluating..." : "Run Simulation"}</span>
            </button>
          </div>

          {/* Right: Simulation Report */}
          <div className="td-test-results-col">
            <h4 className="col-heading">Evaluation Trace</h4>

            {!result && !error && (
              <div className="td-test-placeholder">
                <Play size={32} className="icon-muted" />
                <p>Click "Run Simulation" to execute the rule logic against the test parameters.</p>
              </div>
            )}

            {error && (
              <div className="td-test-error-box">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {result && (
              <div className="td-test-output-wrap">
                {/* Result Status Banner */}
                <div className={`td-test-banner ${result.matched ? "matched" : "not-matched"}`}>
                  {result.matched ? (
                    <CheckCircle2 size={20} className="icon-success" />
                  ) : (
                    <XCircle size={20} className="icon-fail" />
                  )}
                  <div>
                    <div className="status-title">
                      {result.matched ? "RULE MATCHED (TRIGGERED)" : "CONDITIONS NOT MET"}
                    </div>
                    <div className="status-sub">{result.summary}</div>
                  </div>
                </div>

                {/* Condition Breakdown */}
                <div className="td-test-step-card">
                  <span className="step-title">Evaluated Conditions:</span>
                  <div className="eval-items-list">
                    {result.conditionResults.map((cr, idx) => (
                      <div key={idx} className={`eval-row ${cr.passed ? "passed" : "failed"}`}>
                        <div className="eval-status-icon">
                          {cr.passed ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                        </div>
                        <div className="eval-details">
                          <span className="expr">
                            {cr.field} {cr.operator} {String(cr.expected)}
                          </span>
                          <span className="actual">
                            (Provided: <strong>{String(cr.actual)}</strong>)
                          </span>
                        </div>
                        <span className={`eval-badge ${cr.passed ? "pass" : "fail"}`}>
                          {cr.passed ? "PASS" : "FAIL"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Triggered Actions */}
                <div className="td-test-step-card">
                  <span className="step-title">Actions to Execute:</span>
                  {result.executedActions.length === 0 ? (
                    <p className="no-actions-txt">None (conditions did not pass).</p>
                  ) : (
                    <div className="actions-list">
                      {result.executedActions.map((act, idx) => (
                        <div key={act.id || idx} className="action-row">
                          <span className="num">{idx + 1}.</span>
                          <span className="title">{act.title}</span>
                          {act.target && <span className="target">({act.target})</span>}
                          {act.badge && <span className="badge">{act.badge}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="td-test-disclaimer">
                  * Dry-run simulation only. No records or project workflows were modified.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="td-test-modal-footer">
          <button type="button" className="td-btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
