"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useScroll, useTransform } from "motion/react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCheck,
  ChevronRight,
  CircleHelp,
  FileText,
  Fingerprint,
  FolderClosed,
  KeyRound,
  LayoutDashboard,
  LockKeyhole,
  ShieldCheck,
  ShieldX,
} from "lucide-react";
import TrustCore3D, { type SecurityState } from "./trust-core-3d";
import DemoEntry from "./demo-entry";
import BrandIntro from "./brand-intro";
import "./landing.css";
import "./landing-awards.css";
import "./landing-experience.css";

const repository = "https://github.com/VijayabaskarR-06/borrow";
const chapters = [
  {
    name: "Define the task",
    title: "A useful task. A precise boundary.",
    text: "Ask for an expense report. BORROW turns the request into a permission proposal: which documents, which fields, where the data may go, and for how long.",
    state: "TASK_REQUESTED" as SecurityState,
    label: "Awaiting approval",
    detail: "No data access until you approve.",
  },
  {
    name: "Approve the minimum",
    title: "Your permission sets the limit.",
    text: "Approve four source documents for five minutes. The gateway releases the fields required for the report. Payroll, unrelated records, and private bank details remain outside the scope.",
    state: "LEASE_APPROVED" as SecurityState,
    label: "Limited access approved",
    detail: "4 documents · approved fields · 5 minutes",
  },
  {
    name: "Enforce every action",
    title: "An invoice is data. Never authority.",
    text: "A malicious instruction inside an invoice asks the agent to read payroll. The server checks the signed lease and denies the request. The authorized report can still finish.",
    state: "ACCESS_DENIED" as SecurityState,
    label: "Payroll request denied",
    detail: "Outside approved document scope.",
  },
  {
    name: "Close and verify",
    title: "The work is done. The access is, too.",
    text: "The report arrives, the lease closes, and a signed privacy receipt records the decisions. Verify its integrity, download it, or alter a byte to test tamper detection.",
    state: "RECEIPT_VERIFIED" as SecurityState,
    label: "Receipt integrity verified",
    detail: "SHA-256 · ECDSA P-256 · downloadable proof",
  },
];

function Brand() {
  return (
    <span className="borrow-wordmark">
      <svg
        width="23"
        height="27"
        viewBox="0 0 28 32"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M3 3h13l10 7-10 6 10 6-10 7H3V3Zm0 0 23 19M3 16h13M3 29 26 10"
          stroke="currentColor"
          strokeWidth="1.8"
        />
      </svg>
      Borrow<span>®</span>
    </span>
  );
}
function Reveal({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y: 34 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: reduced ? 0 : 0.85, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
function ProductPreview() {
  const [approved, setApproved] = useState(false);
  return (
    <div className="product-preview">
      <div className="product-titlebar">
        <span>
          <i />
          <i />
          <i />
        </span>
        <span>
          <LockKeyhole size={11} />
          borrow / workspace
        </span>
        <span>DEMO PREVIEW</span>
      </div>
      <div className="product-body">
        <aside className="product-rail" aria-hidden="true">
          <span className="rail-mark">b.</span>
          <LayoutDashboard />
          <FolderClosed />
          <KeyRound />
          <Fingerprint />
          <CircleHelp />
        </aside>
        <div className="product-content">
          <div className="product-breadcrumb">
            Workspace <ChevronRight size={10} />
            <strong>New task</strong>
            <span>Isolated demo</span>
          </div>
          <div className="preview-task-heading">
            <span className="small-label">EXPENSE WORKSPACE</span>
            <h3>Let’s get the report ready.</h3>
            <p>One task. Just the access it needs.</p>
          </div>
          <div className="preview-prompt">
            <FileText size={16} />
            <span>Prepare my October expense report.</span>
            <span>↵</span>
          </div>
          <div className="preview-bottom">
            <div className="preview-permission">
              <span className="small-label">PERMISSION PROPOSAL</span>
              <div>
                <span>Documents</span>
                <strong>4 selected</strong>
              </div>
              <div>
                <span>Operation</span>
                <strong>Read only</strong>
              </div>
              <div>
                <span>Duration</span>
                <strong>5 minutes</strong>
              </div>
              <button
                onClick={() => setApproved((v) => !v)}
                aria-pressed={approved}
              >
                {approved ? <Check size={13} /> : <KeyRound size={13} />}{" "}
                {approved
                  ? "Approved · reset preview"
                  : "Approve limited access"}
                <ArrowRight size={12} />
              </button>
            </div>
            <div className="preview-core">
              <span>
                <i />
                {approved ? "LEASE APPROVED" : "TRUST CORE"}
              </span>
              <div>
                <TrustCore3D
                  compact
                  state={approved ? "LEASE_APPROVED" : "IDLE"}
                />
              </div>
              <p>
                {approved
                  ? "Approved path open."
                  : "Your data stays behind the boundary."}
              </p>
            </div>
          </div>
          <div className="preview-log">
            <ShieldCheck size={12} />
            <span>
              {approved
                ? "Scoped lease approved in this visual preview."
                : "No standing access. Permission starts with you."}
            </span>
          </div>
        </div>
      </div>
      <div className="product-caption">
        <span>Interactive product illustration</span>
        <DemoEntry>Open the working demo</DemoEntry>
      </div>
    </div>
  );
}

export default function Landing() {
  const [chapter, setChapter] = useState(0);
  const [scene, setScene] = useState(0);
  const [attack, setAttack] = useState(true);
  const story = useRef<HTMLElement>(null);
  const hero = useRef<HTMLElement>(null);
  const interlude = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress: pageProgress } = useScroll();
  const heroProgress = useMotionValue(0);
  const { scrollYProgress: interludeProgress } = useScroll({ target: interlude, offset: ["start end", "end start"] });
  const heroCopyOpacity = useTransform(heroProgress, [0, 0.14, 0.37, 0.48], [1, 1, 0.3, 0]);
  const heroCopyY = useTransform(heroProgress, [0, 0.48], [0, -180]);
  const heroPreviewY = useTransform(heroProgress, [0, 0.18, 0.54, 0.76], ["0vh", "-5vh", "-40vh", "-45vh"]);
  const heroPreviewScale = useTransform(heroProgress, [0, 0.18, 0.54, 0.76], [0.88, 0.94, 1.24, 1.72]);
  const heroPreviewRotate = useTransform(heroProgress, [0, 0.2, 0.55], [7, 5, 0]);
  const heroCurtain = useTransform(heroProgress, [0.59, 0.81], ["circle(0% at 50% 54%)", "circle(150% at 50% 54%)"]);
  const heroCueOpacity = useTransform(heroProgress, [0, 0.12, 0.3], [1, 1, 0]);
  const interludeWord = useTransform(interludeProgress, [0, 0.38, 0.75, 1], [140, 0, -20, -150]);
  const interludeWordOpacity = useTransform(interludeProgress, [0, 0.25, 0.72, 1], [0, 1, 1, 0]);
  const interludeOrb = useTransform(interludeProgress, [0, 1], [-150, 120]);
  const interludeScale = useTransform(interludeProgress, [0, 0.48, 1], [0.45, 1, 2.15]);
  const interludeRotate = useTransform(interludeProgress, [0, 1], [-40, 50]);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      const node = hero.current;
      if (!node) return;
      const top = node.getBoundingClientRect().top + window.scrollY;
      const travel = Math.max(1, node.offsetHeight - window.innerHeight + 72);
      heroProgress.set(Math.max(0, Math.min(1, (window.scrollY - top + 72) / travel)));
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); };
  }, [heroProgress]);
  useEffect(() => {
    const nodes =
      story.current?.querySelectorAll<HTMLElement>("[data-chapter]");
    if (!nodes) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting)
            setChapter(Number((entry.target as HTMLElement).dataset.chapter));
      },
      { rootMargin: "-30% 0px -35% 0px", threshold: 0 },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const ids = ["home", "how-it-works", "enforcement", "proof"];
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) setScene(ids.indexOf(entry.target.id));
    }, { rootMargin: "-35% 0px -45% 0px" });
    ids.forEach((id) => { const node = document.getElementById(id); if (node) observer.observe(node); });
    return () => observer.disconnect();
  }, []);
  return (
    <div className="borrow-site">
      <motion.div className="page-progress" style={{ scaleX: pageProgress }} aria-hidden="true" />
      <nav className="scene-rail" aria-label="Page scenes">
        {[["home", "Intro"], ["how-it-works", "Permission"], ["enforcement", "Boundary"], ["proof", "Proof"]].map(([id, label], index) => (
          <a key={id} href={"#" + id} aria-label={label} aria-current={scene === index ? "location" : undefined}><span />{label}</a>
        ))}
      </nav>
      <BrandIntro />
      <a className="borrow-skip" href="#main">
        Skip to content
      </a>
      <header className="site-nav">
        <Link href="/" aria-label="BORROW home">
          <Brand />
        </Link>
        <nav aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#enforcement">Security</a>
          <a
            href={repository + "/blob/main/docs/ARCHITECTURE.md"}
            target="_blank"
            rel="noreferrer"
          >
            Documentation
            <ArrowUpRight size={12} />
          </a>
        </nav>
        <div>
          <Link href="/login" className="nav-signin">
            Sign in
          </Link>
          <DemoEntry className="site-button primary small" destination="/sources" requireAccount>
            Use your records
          </DemoEntry>
        </div>
      </header>
      <main id="main">
        <section className="hero-sequence" id="home" ref={hero}>
          <div className="hero-stage">
          <div className="site-hero">
          <div className="hero-editorial">
            <motion.div style={reduced ? undefined : { opacity: heroCopyOpacity, y: heroCopyY }}>
              <span className="section-label">
                <span className="blue-dot" />
                THE AI WORKSPACE WITH BOUNDARIES
              </span>
              <h1>
                Let your data work.
                <br />
                Keep the <em>keys.</em>
              </h1>
              <p>
                Reconcile real invoices and payment records with access that
                expires when the work is done.
              </p>
              <div className="hero-cta">
                <DemoEntry className="hero-prompt" destination="/sources" requireAccount>
                  <span className="hero-prompt-symbol"><FileText size={19} /></span>
                  <span className="hero-prompt-copy">Reconcile my invoices and payments.</span>
                  <span className="hero-prompt-action">Start with my records <ArrowRight size={16} /></span>
                </DemoEntry>
              </div>
              <div className="hero-secondary">
                <span>Encrypted workspace · Scoped access · Signed proof</span>
                <a href="#how-it-works">
                  See how it works
                  <ArrowDown size={15} />
                </a>
              </div>
            </motion.div>
          </div>
          <div className="hero-product-frame">
          <motion.div
            className="hero-product"
            style={reduced ? undefined : { y: heroPreviewY, scale: heroPreviewScale, rotateX: heroPreviewRotate }}
          >
            <ProductPreview />
          </motion.div>
          </div>
          <div className="hero-baseline">
            <span>BUILT FOR A SIMPLE RULE</span>
            <strong>
              Borrow the data. <span>Return the access.</span>
            </strong>
            <a href="#how-it-works">
              Explore the workflow
              <ArrowDown size={13} />
            </a>
          </div>
          </div>
          <motion.div className="hero-scroll-cue" style={reduced ? undefined : { opacity: heroCueOpacity }} aria-hidden="true"><span>SCROLL TO ENTER THE WORKSPACE</span><span className="hero-cue-line" /><ArrowDown size={15} /></motion.div>
          <motion.div className="hero-blue-curtain" style={reduced ? undefined : { clipPath: heroCurtain }} aria-hidden="true"><span className="curtain-wordmark">BORROW<span>®</span></span></motion.div>
          </div>
        </section>
        <section className="scroll-interlude" ref={interlude} aria-label="Our approach to AI access">
          <div className="interlude-sticky">
            <div className="interlude-grid" aria-hidden="true" />
            <span className="interlude-kicker">A BETTER DEFAULT / 001</span>
            <motion.div className="interlude-orbit" style={reduced ? undefined : { x: interludeOrb, scale: interludeScale, rotate: interludeRotate }} aria-hidden="true">
              <span className="orbit-ring orbit-ring-one" />
              <span className="orbit-ring orbit-ring-two" />
              <span className="orbit-core"><KeyRound size={42} strokeWidth={1.2} /></span>
            </motion.div>
            <motion.div className="interlude-statement" style={reduced ? undefined : { y: interludeWord, opacity: interludeWordOpacity }}>
              <span>Access should last</span>
              <strong>exactly as long<br />as the task.</strong>
              <p>One request. One clear boundary. Then the door closes.</p>
            </motion.div>
            <span className="interlude-scroll">SCROLL TO FOLLOW THE PERMISSION <ArrowDown size={15} /></span>
          </div>
        </section>
        <section className="principle-strip" aria-label="Core capabilities">
          <span><KeyRound size={17} />Purpose-bound permissions</span>
          <span><ShieldCheck size={17} />Server-enforced boundaries</span>
          <span><Fingerprint size={17} />Verifiable privacy receipts</span>
        </section>
        <section className="story-section" id="how-it-works" ref={story}>
          <div className="story-introduction">
            <Reveal>
              <span className="section-label">
                01 / FROM REQUEST TO RECEIPT
              </span>
              <h2>
                One continuous workflow.
                <br />
                <span>You’re in control throughout.</span>
              </h2>
            </Reveal>
            <p>
              Follow an expense report from its first request to its final
              proof. Scroll to see how the permission changes.
            </p>
          </div>
          <div className="story-layout">
            <div className="story-sticky">
              <div className="story-panel">
                <div className="story-panel-header">
                  <span>
                    <span className="blue-dot" />
                    PERMISSION LIFECYCLE
                  </span>
                  <span>0{chapter + 1} / 04</span>
                </div>
                <div className="story-core">
                  <TrustCore3D
                    state={chapters[chapter].state}
                    reducedMotion={!!reduced}
                  />
                </div>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={chapter}
                    className={"story-state " + (chapter === 2 ? "state-denied" : "")}
                    role="status"
                    initial={reduced ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduced ? undefined : { opacity: 0, y: -10 }}
                    transition={{ duration: reduced ? 0 : 0.28 }}
                  >
                    <span>{chapter === 2 ? <ShieldX size={20} /> : <ShieldCheck size={20} />}</span>
                    <div>
                      <strong>{chapters[chapter].label}</strong>
                      <p>{chapters[chapter].detail}</p>
                    </div>
                  </motion.div>
                </AnimatePresence>
                <div className="story-progress">
                  {chapters.map((c, i) => (
                    <a
                      key={c.name}
                      href={"#chapter-" + i}
                      aria-label={"Go to " + c.name}
                      aria-current={chapter === i ? "step" : undefined}
                    >
                      <span />
                      <small>0{i + 1}</small>
                    </a>
                  ))}
                </div>
                <p className="visual-caption">
                  Illustrative state · real policy checks in the working demo
                </p>
              </div>
            </div>
            <div className="story-chapters">
              {chapters.map((c, i) => (
                <article
                  id={"chapter-" + i}
                  data-chapter={i}
                  key={c.name}
                  className={chapter === i ? "active" : ""}
                >
                  <Reveal>
                    <span className="chapter-index">
                      0{i + 1} / {c.name}
                    </span>
                    <h3>{c.title}</h3>
                    <p>{c.text}</p>
                    <span className="chapter-detail">
                      <Check size={13} />
                      {i === 0
                        ? "No approval, no data."
                        : i === 1
                          ? "Short-lived, explicit, revocable."
                          : i === 2
                            ? "Untrusted content cannot expand scope."
                            : "Permission closes. Evidence stays."}
                    </span>
                  </Reveal>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="enforcement-section" id="enforcement">
          <div className="enforcement-intro">
            <Reveal>
              <span className="section-label">02 / A BOUNDARY THAT HOLDS</span>
              <h2>
                Useful instructions get a result.
                <br />
                <span>Hidden instructions meet a wall.</span>
              </h2>
              <p>
                An invoice can contain a prompt injection. It cannot grant
                itself permission to your payroll.
              </p>
            </Reveal>
            <div
              className="security-tabs"
              aria-label="Preview gateway decisions"
            >
              <button onClick={() => setAttack(false)} aria-pressed={!attack}>
                Approved request
              </button>
              <button onClick={() => setAttack(true)} aria-pressed={attack}>
                Out-of-scope request
              </button>
            </div>
          </div>
          <div className="gateway-console">
            <div className="console-title">
              <span>
                <ShieldCheck size={15} />
                BORROW GATEWAY
              </span>
              <span>CONTROLLED DEMONSTRATION</span>
            </div>
            <div className="gateway-flow">
              <div>
                <span className="small-label">REQUESTED RESOURCE</span>
                <FileText size={25} />
                <strong>{attack ? "payroll-001" : "invoice-003"}</strong>
                <p>
                  {attack
                    ? "Referenced by an injected instruction"
                    : "Included in the approved task"}
                </p>
              </div>
              <span className="gateway-arrow">
                <ArrowRight size={24} />
              </span>
              <div className="gateway-policy">
                <span className="small-label">SIGNED PERMISSION LEASE</span>
                <KeyRound size={25} />
                <strong>October expense report</strong>
                <p>4 sources · read only · expires in 5 min</p>
              </div>
              <span className="gateway-arrow">
                <ArrowRight size={24} />
              </span>
              <div
                className={"gateway-outcome " + (attack ? "denied" : "allowed")}
              >
                <span className="small-label">SERVER DECISION</span>
                {attack ? <ShieldX size={25} /> : <ShieldCheck size={25} />}
                <strong>{attack ? "Access denied" : "Access allowed"}</strong>
                <p>
                  {attack
                    ? "Outside approved document scope"
                    : "Approved invoice fields released"}
                </p>
              </div>
            </div>
            <div className="console-record">
              <code>
                <span>{attack ? "DENY" : "ALLOW"}</span> read_document(“
                {attack ? "payroll-001" : "invoice-003"}”)
              </code>
              <span>
                {attack
                  ? "No payroll data disclosed."
                  : "Only permitted fields disclosed."}
              </span>
            </div>
          </div>
          <div className="enforcement-footnote">
            <p>
              The agent’s adversarial choice is simulated. The working demo
              sends the request through the actual server gateway.
            </p>
            <DemoEntry>Test it in the workspace</DemoEntry>
          </div>
        </section>
        <section className="receipt-section" id="proof">
          <Reveal className="receipt-copy">
            <span className="section-label">03 / VERIFIABLE PROOF · BLOCKCHAIN EXPLAINED</span>
            <h2>
              A finished report.
              <br />A closed permission.
              <br />
              <span>A verifiable receipt.</span>
            </h2>
            <p>
              The result includes a record of what was permitted, what was
              denied, and when access ended. Verify the signature or change a
              byte to see integrity checks fail.
            </p>
            <ul>
              <li>
                <CheckCheck size={16} />
                SHA-256 content hash
              </li>
              <li>
                <Fingerprint size={16} />
                ECDSA P-256 signature
              </li>
              <li>
                <LockKeyhole size={16} />
                Tamper-evident event chain
              </li>
            </ul>
            <DemoEntry className="receipt-link" destination="/sources" requireAccount>
              Create a receipt for your records
            </DemoEntry>
            <p className="receipt-scope-note">
              Blockchain can add an external timestamp to a receipt hash. This build verifies hashes and signatures locally; blockchain anchoring is not enabled.
            </p>
          </Reveal>
          <Reveal className="receipt-example">
            <div className="receipt-paper">
              <div className="receipt-paper-top">
                <Brand />
                <span>
                  PRIVACY RECEIPT
                  <br />
                  <strong>ILLUSTRATIVE EXAMPLE</strong>
                </span>
              </div>
              <span className="section-label">OCTOBER EXPENSE REPORT</span>
              <div className="receipt-amount">
                $3,784<span>.50</span>
                <small>USD</small>
              </div>
              <div className="receipt-line">
                <span>Approved sources</span>
                <strong>4 documents</strong>
              </div>
              <div className="receipt-line">
                <span>Payroll request</span>
                <strong className="denied-label">Denied</strong>
              </div>
              <div className="receipt-line">
                <span>Temporary permission</span>
                <strong>Closed on completion</strong>
              </div>
              <div className="receipt-verified">
                <span>
                  <ShieldCheck size={19} />
                </span>
                <div>
                  <strong>Made to be verified.</strong>
                  <p>The live demo generates the signed receipt.</p>
                </div>
                <Check size={15} />
              </div>
              <div className="receipt-tear" />
              <div className="receipt-paper-bottom">
                <Fingerprint size={26} />
                <span>
                  YOUR TASK. YOUR BOUNDARY.
                  <br />
                  YOUR RECORD OF WHAT HAPPENED.
                </span>
                <span>01 / 01</span>
              </div>
            </div>
          </Reveal>
        </section>
        <section className="closing-section">
          <Reveal>
            <span className="section-label">LESS ACCESS. MORE ASSURANCE.</span>
            <h2>
              Put AI to work.
              <br />
              <span>Keep permission in your hands.</span>
            </h2>
            <p>
              Bring your invoices and payment records. Leave with a reconciled
              report and a signed record of exactly what was accessed.
            </p>
            <div>
              <DemoEntry className="site-button primary" destination="/sources" requireAccount>
                Import your records
              </DemoEntry>
              <a
                className="site-button secondary"
                href={repository}
                target="_blank"
                rel="noreferrer"
              >
                Explore the source
                <ArrowUpRight size={16} />
              </a>
            </div>
          </Reveal>
        </section>
      </main>
      <footer className="site-footer">
        <div>
          <Link href="/" aria-label="BORROW home">
            <Brand />
          </Link>
          <p>Temporary access. Lasting accountability.</p>
        </div>
        <nav aria-label="Footer navigation">
          <a
            href={repository + "/blob/main/docs/ARCHITECTURE.md"}
            target="_blank"
            rel="noreferrer"
          >
            Architecture
            <ArrowUpRight size={12} />
          </a>
          <a href={repository} target="_blank" rel="noreferrer">
            GitHub
            <ArrowUpRight size={12} />
          </a>
          <Link href="/login">
            Sign in
            <ArrowUpRight size={12} />
          </Link>
        </nav>
        <span>BUILT FOR HACKGLOBAL / 2026</span>
      </footer>
    </div>
  );
}
