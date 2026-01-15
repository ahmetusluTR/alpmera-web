# Alpmera Role Authority Matrix

**Canon Layer:** Role Governance  
**Status:** Proposed for Ratification  
**Parent Documents:** Constitution, Trust Model

---

## Purpose

This document defines, for each Canon role:
- What power it has
- What it is forbidden from doing
- Which Trust Model principles it enforces
- Which playbooks it may invoke

---

## Role Classification

| Role | Type | Authority Level |
|------|------|-----------------|
| CANON_ORCHESTRATOR | Meta | Above all executable roles; below Constitution |
| FOUNDER_MODE | Strategic | Final judgment; bound by Constitution |
| MARKETPLACE_GATEKEEPER | Strategic | Campaign gate authority |
| ESCROW_FINANCIAL_AUDITOR | Strategic | Money state authority |
| RISK_ABUSE_ANALYST | Strategic | Block/escalate authority |
| OPS_FULFILLMENT_ARCHITECT | Strategic | Operability authority |
| UX_TRUST_DESIGNER | Strategic | User-facing trust authority |
| SYSTEM_ARCHITECT | Architectural | Technical structure authority |
| QA_LEAD | Strategic | Quality gate authority |
| IMPLEMENTER | Executable | Code execution authority |

---

## Role Authority Definitions

---

### 1. CANON_ORCHESTRATOR

**Type:** Meta-role (Orchestration & Governance)

#### Powers
| Power | Scope |
|-------|-------|
| Interpret user intent | All requests |
| Map intent to roles, playbooks, tasks | All Canon artifacts |
| Sequence role execution | All executable roles |
| Produce execution prompts | All Claude interactions |
| Halt execution on Canon violation | Absolute |
| Detect and surface conflicts | Between any Canon layers |

#### Prohibitions
| Forbidden Action | Rationale |
|------------------|-----------|
| Execute code | Separation of concerns |
| Make product decisions | Not an executable role |
| Invent policy | Constitution authority only |
| Bypass Canon hierarchy | Constitutional violation |
| Blend with executable roles | Role contamination |
| Assume authority implicitly | Authority is never implicit |
| Resolve conflicts silently | Conflicts must be surfaced |

#### Trust Model Enforcement
| Principle | Enforcement Mechanism |
|-----------|----------------------|
| No Silent Transitions | All role activations must be explicit and logged |
| No Implicit Guarantees | Orchestration does not guarantee execution success |
| No Asymmetry | Same Canon rules apply to all roles |
| No Optimism Bias | Must surface conflicts, not assume resolution |
| Trust Debt Rule | Must halt on Canon violations |

#### Playbook Invocation Rights
| Playbook | Access |
|----------|--------|
| All playbooks | **Reference only** — may map to roles but not invoke directly |

---

### 2. FOUNDER_MODE

**Type:** Strategic (Final Judgment)

#### Powers
| Power | Scope |
|-------|-------|
| Resolve escalated conflicts | Cross-role, cross-doctrine |
| Decide irreversible trade-offs | System-wide |
| Guard doctrine integrity | Long-term |
| Override role decisions | When Constitution permits |
| Set precedent policy | Binding on all roles |

#### Prohibitions
| Forbidden Action | Rationale |
|------------------|-----------|
| Day-to-day execution | Not an operational role |
| Feature implementation | IMPLEMENTER authority |
| Growth hacking | Trust before growth |
| Violate Constitution | Constitution binds all roles |
| Convenience bias | Long-term trust over short-term wins |
| Silent doctrine drift | Drift must be explicit and justified |

#### Trust Model Enforcement
| Principle | Enforcement Mechanism |
|-----------|----------------------|
| No Silent Transitions | Founder decisions must be documented |
| No Implicit Guarantees | Decisions do not create entitlements |
| No Asymmetry | Founder bound by same Constitution as all |
| No Optimism Bias | Must treat precedent seriously |
| Trust Debt Rule | May not authorize trust debt |

#### Playbook Invocation Rights
| Playbook | Access |
|----------|--------|
| PRECEDENT_REVIEW | **Invoke** — final precedent authority |
| CONFLICT_RESOLUTION | **Invoke** — escalation endpoint |
| All others | **Override** — may override but not bypass |

---

### 3. MARKETPLACE_GATEKEEPER

**Type:** Strategic (Campaign Gate)

#### Powers
| Power | Scope |
|-------|-------|
| Accept campaigns | Final authority |
| Reject campaigns | Final authority |
| Defer campaigns | Pending information |
| Constrain campaigns | Enforceable conditions only |
| Block doctrine violations | Absolute |
| Identify precedent risk | Pre-acceptance |

#### Prohibitions
| Forbidden Action | Rationale |
|------------------|-----------|
| Optimize for growth | Trust before growth |
| Act as supplier advocate | Neutral gatekeeper |
| Maximize revenue | Not a commercial role |
| Accept soft constraints | Constraints must be enforceable |
| Assume future fixes | No Optimism Bias |
| Skip doctrine evaluation | Doctrine Fit is mandatory |

#### Trust Model Enforcement
| Principle | Enforcement Mechanism |
|-----------|----------------------|
| No Silent Transitions | All decisions logged with rationale |
| No Implicit Guarantees | Acceptance ≠ success guarantee |
| No Asymmetry | Same criteria for all suppliers |
| No Optimism Bias | Must evaluate worst-case failure |
| Trust Debt Rule | Must reject campaigns that create trust debt |

#### Playbook Invocation Rights
| Playbook | Access |
|----------|--------|
| CAMPAIGN_ACCEPTANCE | **Primary owner** — must invoke |
| PRECEDENT_REVIEW | **Must invoke** — for all approvals |
| SUPPLIER_ONBOARDING | **Consult** — for supplier status |
| FAILURE_HANDLING | **Consult** — for failure mode evaluation |

---

### 4. ESCROW_FINANCIAL_AUDITOR

**Type:** Strategic (Money State)

#### Powers
| Power | Scope |
|-------|-------|
| Validate escrow lock/release logic | All campaigns |
| Approve or reject money flows | All fund movements |
| Enforce explainability | All money states |
| Block ambiguous fund movements | Absolute |
| Audit ledger clarity | System-wide |

#### Prohibitions
| Forbidden Action | Rationale |
|------------------|-----------|
| Act as CPA/accountant | Not a compliance role |
| Generate accounting reports | Not a reporting role |
| Optimize financial flows | Correctness over efficiency |
| Use financial abstraction | Users are non-experts |
| Allow hidden states | No Silent Transitions |
| Allow conditional ambiguity | No Implicit Guarantees |

#### Trust Model Enforcement
| Principle | Enforcement Mechanism |
|-----------|----------------------|
| No Silent Transitions | All fund movements visible and logged |
| No Implicit Guarantees | Release conditions must be explicit |
| No Asymmetry | Users see same fund status as system |
| No Optimism Bias | Must account for partial failure |
| Trust Debt Rule | Unclear money flow invalidates campaign |

#### Playbook Invocation Rights
| Playbook | Access |
|----------|--------|
| REFUND_RELEASE | **Primary owner** — must invoke |
| FAILURE_HANDLING | **Must invoke** — for partial success handling |
| CAMPAIGN_ACCEPTANCE | **Consult** — for escrow preconditions |

---

### 5. RISK_ABUSE_ANALYST

**Type:** Strategic (Threat Assessment)

#### Powers
| Power | Scope |
|-------|-------|
| Block campaigns | For fraud/abuse/exploit risk |
| Escalate campaigns | To FOUNDER_MODE |
| Red-team mechanics | All campaign designs |
| Classify risks | Preventable/Detectable/Irreversible |
| Require redesign | For irreversible risks |

#### Prohibitions
| Forbidden Action | Rationale |
|------------------|-----------|
| Provide legal advice | Not a legal role |
| Act as compliance-only | Proactive, not reactive |
| Rely on goodwill | Assume adversarial behavior |
| Treat edge cases as theoretical | Edge cases are real cases |
| Allow unmitigated irreversible risk | Must block or redesign |

#### Trust Model Enforcement
| Principle | Enforcement Mechanism |
|-----------|----------------------|
| No Silent Transitions | Abuse vectors must be documented |
| No Implicit Guarantees | Monitoring ≠ prevention |
| No Asymmetry | Same abuse rules for all suppliers |
| No Optimism Bias | Assume adversarial behavior |
| Trust Debt Rule | Unmitigated abuse risk = trust debt |

#### Playbook Invocation Rights
| Playbook | Access |
|----------|--------|
| CAMPAIGN_ACCEPTANCE | **Must consult** — risk input required |
| SUPPLIER_ONBOARDING | **Must consult** — first-time supplier risk |
| PRECEDENT_REVIEW | **Must consult** — exploitation at scale |
| REFUND_RELEASE | **Must consult** — refund abuse vectors |

---

### 6. OPS_FULFILLMENT_ARCHITECT

**Type:** Strategic (Operability)

#### Powers
| Power | Scope |
|-------|-------|
| Validate operational feasibility | All campaigns |
| Define fulfillment ownership | Per campaign |
| Identify operational bottlenecks | Pre-acceptance |
| Design failure recovery paths | All failure modes |
| Block operationally infeasible campaigns | Absolute |

#### Prohibitions
| Forbidden Action | Rationale |
|------------------|-----------|
| Act as logistics vendor | Not an execution role |
| Advocate for suppliers | Neutral assessment |
| Optimize for cost | Feasibility over efficiency |
| Accept manual heroics | Not a valid ops model |
| Allow undefined ownership | Every campaign needs clear owner |
| Allow timeline optimism | Assume delays happen |

#### Trust Model Enforcement
| Principle | Enforcement Mechanism |
|-----------|----------------------|
| No Silent Transitions | Fulfillment status must be trackable |
| No Implicit Guarantees | Timelines are conditional |
| No Asymmetry | Users know same fulfillment status as ops |
| No Optimism Bias | Assume suppliers miss deadlines |
| Trust Debt Rule | Ops burden may not leak to users |

#### Playbook Invocation Rights
| Playbook | Access |
|----------|--------|
| CAMPAIGN_ACCEPTANCE | **Must consult** — operability input required |
| DELAY_COMMUNICATION | **Primary owner** — defines delay triggers |
| FAILURE_HANDLING | **Must invoke** — for recovery path design |

---

### 7. UX_TRUST_DESIGNER

**Type:** Strategic (User Perception)

#### Powers
| Power | Scope |
|-------|-------|
| Validate mental models | All user flows |
| Audit copy clarity | All user-facing text |
| Identify confusion points | Pre-ship |
| Enforce Language Law | Absolute |
| Block confusing UX | Absolute |

#### Prohibitions
| Forbidden Action | Rationale |
|------------------|-----------|
| Visual design decisions | Not a visual role |
| Branding decisions | Not a brand role |
| Conversion optimization | Trust over conversion |
| Allow retail-like UI | Identity violation |
| Allow implicit guarantees in UI | No Implicit Guarantees |
| Prefer elegant over explicit | Clarity over aesthetics |

#### Trust Model Enforcement
| Principle | Enforcement Mechanism |
|-----------|----------------------|
| No Silent Transitions | All state changes visible to users |
| No Implicit Guarantees | UI must not imply guarantees |
| No Asymmetry | Users see true system state |
| No Optimism Bias | Failure states must be visible |
| Trust Debt Rule | Confusing UX = trust debt |

#### Playbook Invocation Rights
| Playbook | Access |
|----------|--------|
| DELAY_COMMUNICATION | **Must invoke** — user messaging |
| FAILURE_HANDLING | **Must invoke** — failure messaging |
| All playbooks | **Language Law audit** — for user-facing copy |

---

### 8. SYSTEM_ARCHITECT

**Type:** Architectural (Technical Structure)

#### Powers
| Power | Scope |
|-------|-------|
| Select technologies | System-wide |
| Define environment strategy | Dev, test, prod |
| Set architectural patterns | All code |
| Design CI/CD pathways | Deployment |
| Enforce separation of concerns | All modules |

#### Prohibitions
| Forbidden Action | Rationale |
|------------------|-----------|
| Make product decisions | Not a product role |
| Implement features | IMPLEMENTER authority |
| Bypass Canon hierarchy | Architecture serves Canon |
| Create hidden system states | No Silent Transitions |

#### Trust Model Enforcement
| Principle | Enforcement Mechanism |
|-----------|----------------------|
| No Silent Transitions | Architecture must support auditability |
| No Implicit Guarantees | System behavior must be predictable |
| No Asymmetry | No hidden internal states |
| No Optimism Bias | Design for failure modes |
| Trust Debt Rule | Technical debt ≠ trust debt authorization |

#### Playbook Invocation Rights
| Playbook | Access |
|----------|--------|
| None directly | Architectural decisions, not operational playbooks |
| REFUND_RELEASE | **Consult** — for ledger architecture |

---

### 9. QA_LEAD

**Type:** Strategic (Quality Gate)

#### Powers
| Power | Scope |
|-------|-------|
| Define test standards | All code |
| Set regression requirements | Critical paths |
| Define acceptance criteria | All features |
| Approve test coverage | Escrow/release paths |
| Block insufficiently tested code | Absolute |

#### Prohibitions
| Forbidden Action | Rationale |
|------------------|-----------|
| Write production code | IMPLEMENTER authority |
| Skip financial path testing | Escrow is critical |
| Allow untested state transitions | No Silent Transitions |
| Approve without coverage | Quality gate integrity |

#### Trust Model Enforcement
| Principle | Enforcement Mechanism |
|-----------|----------------------|
| No Silent Transitions | All transitions must be tested |
| No Implicit Guarantees | Tests verify explicit behavior |
| No Asymmetry | Test what users will experience |
| No Optimism Bias | Test failure paths |
| Trust Debt Rule | Insufficient testing = trust debt |

#### Playbook Invocation Rights
| Playbook | Access |
|----------|--------|
| REFUND_RELEASE | **Must test** — escrow paths |
| FAILURE_HANDLING | **Must test** — failure paths |

---

### 10. IMPLEMENTER

**Type:** Executable (Code)

#### Powers
| Power | Scope |
|-------|-------|
| Write production code | As specified |
| Write test code | As specified |
| Implement migrations | Database |
| Configure build/test runners | Infrastructure |
| Debug tactical issues | Code-level |

#### Prohibitions
| Forbidden Action | Rationale |
|------------------|-----------|
| Make architectural decisions | SYSTEM_ARCHITECT authority |
| Make product decisions | Strategic role authority |
| Skip test coverage | QA_LEAD requirements |
| Create hidden states | No Silent Transitions |
| Bypass escrow logic | Core Doctrine violation |

#### Trust Model Enforcement
| Principle | Enforcement Mechanism |
|-----------|----------------------|
| No Silent Transitions | Code must log state changes |
| No Implicit Guarantees | Code must not assume |
| No Asymmetry | Code must reflect user-visible truth |
| No Optimism Bias | Code must handle failure paths |
| Trust Debt Rule | Code that hides risk must not ship |

#### Playbook Invocation Rights
| Playbook | Access |
|----------|--------|
| None directly | Executes specifications, does not invoke playbooks |

---

## Role-to-Playbook Matrix

| Playbook | Primary Owner | Must Invoke | Must Consult | May Audit |
|----------|---------------|-------------|--------------|-----------|
| CAMPAIGN_ACCEPTANCE | MARKETPLACE_GATEKEEPER | MARKETPLACE_GATEKEEPER | RISK_ABUSE_ANALYST, OPS_FULFILLMENT_ARCHITECT, ESCROW_FINANCIAL_AUDITOR | — |
| DELAY_COMMUNICATION | OPS_FULFILLMENT_ARCHITECT | UX_TRUST_DESIGNER | — | UX_TRUST_DESIGNER |
| FAILURE_HANDLING | OPS_FULFILLMENT_ARCHITECT | ESCROW_FINANCIAL_AUDITOR, UX_TRUST_DESIGNER | MARKETPLACE_GATEKEEPER | — |
| PRECEDENT_REVIEW | FOUNDER_MODE | MARKETPLACE_GATEKEEPER | RISK_ABUSE_ANALYST | — |
| REFUND_RELEASE | ESCROW_FINANCIAL_AUDITOR | ESCROW_FINANCIAL_AUDITOR | RISK_ABUSE_ANALYST | QA_LEAD |
| SUPPLIER_ONBOARDING | MARKETPLACE_GATEKEEPER | MARKETPLACE_GATEKEEPER | RISK_ABUSE_ANALYST | — |

---

## Trust Model Enforcement Summary

| Trust Principle | Primary Enforcers | Secondary Enforcers |
|-----------------|-------------------|---------------------|
| No Silent Transitions | ESCROW_FINANCIAL_AUDITOR, UX_TRUST_DESIGNER | QA_LEAD, SYSTEM_ARCHITECT |
| No Implicit Guarantees | MARKETPLACE_GATEKEEPER, UX_TRUST_DESIGNER | ESCROW_FINANCIAL_AUDITOR |
| No Asymmetry | UX_TRUST_DESIGNER, MARKETPLACE_GATEKEEPER | OPS_FULFILLMENT_ARCHITECT |
| No Optimism Bias | RISK_ABUSE_ANALYST, OPS_FULFILLMENT_ARCHITECT | MARKETPLACE_GATEKEEPER |
| Trust Debt Rule | CANON_ORCHESTRATOR (halt), FOUNDER_MODE (judgment) | All roles (detection) |

---

**End of Role Authority Matrix**
