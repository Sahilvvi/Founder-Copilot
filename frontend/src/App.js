import { useState, useRef, useEffect, useCallback } from "react";
import "@/App.css";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { teamApi, taskApi, seedApi } from "./api";
import { toast, Toaster } from "sonner";
import {
  Target,
  Lightning,
  ListChecks,
  ShieldWarning,
  Lightbulb,
  ChartBar,
  Rocket,
  CheckCircle,
  Crosshair,
  Funnel,
  ArrowClockwise,
  Fire,
  CurrencyDollar,
  X,
  WifiSlash,
  List,
  ArrowRight,
  Check,
  Brain,
  Shield,
  Sparkle,
  User,
  SignOut,
  Eye,
  EyeSlash,
  Envelope,
  Lock,
  GoogleLogo,
  House,
  ClockCounterClockwise,
  Gear,
  ChartLineUp,
  Trophy,
  FileText,
  Bookmark,
  BookOpen,
  Bell,
  MagnifyingGlass,
  Plus,
  Trash,
  Calendar,
  TrendUp,
  Users,
  Star,
  CheckSquare,
  Square,
  CaretRight,
  CaretDown,
  Folder,
  Download,
  Share,
  Copy,
  ArrowsClockwise,
  Briefcase,
  Storefront,
  Code,
  ChatCircle,
  UserPlus,
  UsersThree,
  Clock,
  Warning,
  CalendarBlank,
  ChatDots,
  DotsThreeVertical,
  Funnel as FunnelIcon,
  Rows,
  Kanban,
  ArrowUp,
  ArrowDown,
  Minus,
  PaperPlaneTilt,
  At,
  UserCircle,
  SpinnerGap
} from "@phosphor-icons/react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Workflow prompt templates
const WORKFLOW_PROMPTS = [
  {
    id: "validate",
    title: "Validate my startup idea",
    description: "Get a structured validation framework",
    icon: CheckCircle,
    prompt: "I want to validate my startup idea. Help me create a validation plan with key hypotheses to test, metrics to track, and experiments to run."
  },
  {
    id: "growth",
    title: "Plan my growth strategy",
    description: "Build a comprehensive growth plan",
    icon: Rocket,
    prompt: "Help me plan a growth strategy for my startup. I need actionable tactics for user acquisition, retention, and scaling."
  },
  {
    id: "weekly",
    title: "Create weekly execution plan",
    description: "Structure your week for maximum impact",
    icon: Crosshair,
    prompt: "Create a weekly execution plan for my startup. Help me prioritize tasks, set goals, and allocate time effectively."
  },
  {
    id: "funnel",
    title: "Fix my sales funnel",
    description: "Optimize conversion at every stage",
    icon: Funnel,
    prompt: "Analyze and fix my sales funnel. Identify bottlenecks and provide specific tactics to improve conversion at each stage."
  }
];

// Industry templates
const INDUSTRY_TEMPLATES = [
  { id: "saas", name: "SaaS Startup", icon: Code, color: "#6366F1" },
  { id: "ecommerce", name: "E-commerce", icon: Storefront, color: "#EC4899" },
  { id: "agency", name: "Agency", icon: Briefcase, color: "#F59E0B" },
  { id: "marketplace", name: "Marketplace", icon: Users, color: "#10B981" }
];

// Resource links
const RESOURCES = [
  { title: "YC Startup Library", description: "Curated guides from Y Combinator", icon: BookOpen, url: "#" },
  { title: "Startup Metrics 101", description: "Key KPIs every founder should track", icon: ChartLineUp, url: "#" },
  { title: "Fundraising Playbook", description: "How to raise your seed round", icon: Trophy, url: "#" },
  { title: "Community Discord", description: "Connect with other founders", icon: ChatCircle, url: "#" }
];

// Mock team members
const INITIAL_TEAM_MEMBERS = [
  { id: 1, name: "John Doe", email: "john@startup.com", avatar: "JD", role: "Founder", color: "#6366F1" },
  { id: 2, name: "Sarah Kim", email: "sarah@startup.com", avatar: "SK", role: "Co-founder", color: "#EC4899" },
  { id: 3, name: "Mike Chen", email: "mike@startup.com", avatar: "MC", role: "Developer", color: "#10B981" }
];

// Helper to get date strings
const getDateString = (daysFromToday) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  return date.toISOString().split('T')[0];
};

// Mock tasks with assignments - using dynamic dates for better testing
const INITIAL_TASKS = [
  { id: 1, text: "Review growth strategy plan", completed: false, status: "in_progress", priority: "high", assignee: 1, dueDate: getDateString(0), comments: [{ id: 1, user: 2, text: "Looking good so far!", time: "2 hours ago" }] }, // Due today
  { id: 2, text: "Set up analytics tracking", completed: true, status: "done", priority: "medium", assignee: 3, dueDate: getDateString(-2), comments: [] },
  { id: 3, text: "Schedule customer interviews", completed: false, status: "todo", priority: "high", assignee: 2, dueDate: getDateString(1), comments: [] }, // Due tomorrow
  { id: 4, text: "Update pitch deck", completed: false, status: "delayed", priority: "high", assignee: 1, dueDate: getDateString(-4), comments: [{ id: 1, user: 1, text: "Need more time on financial slides", time: "1 day ago" }] }, // Overdue
  { id: 5, text: "Review competitor analysis", completed: true, status: "done", priority: "low", assignee: 2, dueDate: getDateString(-3), comments: [] },
  { id: 6, text: "Prepare demo for investors", completed: false, status: "in_progress", priority: "high", assignee: 3, dueDate: getDateString(3), comments: [] },
  { id: 7, text: "Write blog post about launch", completed: false, status: "todo", priority: "low", assignee: null, dueDate: null, comments: [] },
  { id: 8, text: "Finalize marketing copy", completed: false, status: "todo", priority: "medium", assignee: 2, dueDate: getDateString(1), comments: [] } // Due tomorrow
];

// Mock recent plans
const MOCK_RECENT_PLANS = [
  { id: 1, title: "Q1 Growth Strategy", date: "2 hours ago", status: "completed", progress: 100 },
  { id: 2, title: "Product Launch Plan", date: "Yesterday", status: "in_progress", progress: 65 },
  { id: 3, title: "Funding Pitch Prep", date: "3 days ago", status: "in_progress", progress: 40 },
  { id: 4, title: "Customer Acquisition", date: "1 week ago", status: "completed", progress: 100 }
];

const MOCK_STATS = {
  plansGenerated: 24,
  plansThisWeek: 7,
  tasksCompleted: 45,
  avgProgress: 72
};

// Features for landing page
const FEATURES = [
  { icon: Brain, title: "AI-Powered Execution", description: "GPT-5.2 generates structured, actionable plans tailored to your startup goals" },
  { icon: Target, title: "Structured Output", description: "No fluff. Get strategy, actions, risks, and execution steps in organized cards" },
  { icon: Shield, title: "Startup-Focused", description: "Strict guardrails ensure responses stay relevant to business execution" },
  { icon: Sparkle, title: "Smart Refinements", description: "One-click modifiers to make plans more aggressive or budget-conscious" }
];

// Priority config
const PRIORITY_CONFIG = {
  high: { label: "High", color: "#EF4444", bg: "#FEE2E2", icon: ArrowUp },
  medium: { label: "Medium", color: "#F59E0B", bg: "#FEF3C7", icon: Minus },
  low: { label: "Low", color: "#10B981", bg: "#D1FAE5", icon: ArrowDown }
};

// Status config
const STATUS_CONFIG = {
  todo: { label: "To Do", color: "#64748B", bg: "#F1F5F9" },
  in_progress: { label: "In Progress", color: "#3B82F6", bg: "#DBEAFE" },
  done: { label: "Done", color: "#10B981", bg: "#D1FAE5" },
  delayed: { label: "Delayed", color: "#EF4444", bg: "#FEE2E2" }
};

// ============================================
// AUTH MODAL COMPONENT
// ============================================
const AuthModal = ({ isOpen, onClose, onSuccess, initialMode = "login" }) => {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { setMode(initialMode); }, [initialMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const user = { name: name || email.split('@')[0], email };
      localStorage.setItem('user', JSON.stringify(user));
      onSuccess(user);
      toast.success(mode === 'login' ? 'Welcome back!' : 'Account created successfully!');
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="auth-overlay" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="auth-modal" onClick={(e) => e.stopPropagation()} data-testid="auth-modal">
        <button className="auth-close" onClick={onClose}><X size={20} /></button>
        <div className="auth-header">
          <h2 className="auth-title">{mode === 'login' ? 'Welcome back' : 'Create account'}</h2>
          <p className="auth-subtitle">{mode === 'login' ? 'Sign in to access your execution plans' : 'Start building your startup execution plans'}</p>
        </div>
        <button className="google-btn" onClick={() => toast.info('Google authentication coming soon!')}><GoogleLogo size={20} weight="bold" /><span>Continue with Google</span></button>
        <div className="auth-divider"><span>or</span></div>
        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'signup' && (
            <div className="form-group">
              <label>Full name</label>
              <div className="input-wrapper"><User size={18} className="input-icon" /><input type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required /></div>
            </div>
          )}
          <div className="form-group">
            <label>Email</label>
            <div className="input-wrapper"><Envelope size={18} className="input-icon" /><input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          </div>
          <div className="form-group">
            <label>Password</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}</button>
            </div>
          </div>
          <button type="submit" className="auth-submit-btn" disabled={loading}>{loading ? 'Please wait...' : (mode === 'login' ? 'Sign in' : 'Create account')}</button>
        </form>
        <p className="auth-switch">
          {mode === 'login' ? (<>Don't have an account? <button onClick={() => setMode('signup')}>Sign up</button></>) : (<>Already have an account? <button onClick={() => setMode('login')}>Sign in</button></>)}
        </p>
      </motion.div>
    </div>
  );
};

// ============================================
// LANDING PAGE COMPONENT
// ============================================
const LandingPage = ({ onGetStarted, onOpenAuth, user }) => (
  <div className="landing-page" data-testid="landing-page">
    <nav className="landing-nav">
      <div className="landing-nav-content">
        <div className="landing-logo">
          <div className="logo-icon"><Rocket size={20} weight="fill" /></div>
          <span className="logo-text">FounderCopilot</span>
        </div>
        <div className="nav-links">
          <a href="#features" className="nav-link">Features</a>
          <a href="#how-it-works" className="nav-link">How it works</a>
        </div>
        <div className="nav-actions">
          {user ? (
            <button onClick={onGetStarted} className="nav-cta-primary"><span>Go to Dashboard</span><ArrowRight size={16} weight="bold" /></button>
          ) : (
            <>
              <button onClick={() => onOpenAuth('login')} className="nav-cta-secondary">Sign in</button>
              <button onClick={() => onOpenAuth('signup')} className="nav-cta-primary"><span>Get Started</span><ArrowRight size={16} weight="bold" /></button>
            </>
          )}
        </div>
      </div>
    </nav>

    <section className="landing-hero">
      <div className="hero-bg"></div>
      <div className="hero-content">
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="hero-eyebrow">AI-Powered Execution Engine</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="hero-title">Turn startup goals into<br />execution plans.</motion.h1>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="hero-description">We help founders deploy AI agents that convert vague goals into structured, actionable execution plans — replacing overthinking with reliable systems.</motion.p>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="hero-cta-group">
          <button onClick={onGetStarted} className="hero-primary-cta" data-testid="hero-get-started"><Sparkle size={18} weight="fill" /><span>Try Copilot Free</span><ArrowRight size={18} weight="bold" /></button>
          <button onClick={() => onOpenAuth('signup')} className="hero-secondary-cta"><span>Book a demo</span><ArrowRight size={18} weight="bold" /></button>
        </motion.div>
      </div>
    </section>

    <section className="logos-section">
      <p className="logos-label">Trusted by founders from</p>
      <div className="logos-marquee">
        <div className="marquee-track">
          {['YC', 'Techstars', '500 Global', 'Sequoia', 'a16z', 'Accel', 'YC', 'Techstars', '500 Global', 'Sequoia', 'a16z', 'Accel'].map((logo, i) => (
            <div key={i} className="logo-item">{logo}</div>
          ))}
        </div>
      </div>
    </section>

    <section className="testimonials-section">
      <div className="testimonials-grid">
        <div className="testimonial-card">
          <div className="testimonial-avatar">JD</div>
          <p className="testimonial-text">"The AI Copilot consistently generates plans that are 10x more actionable than what I was creating manually."</p>
          <div className="testimonial-author"><span className="author-name">John Doe</span><span className="author-role">Founder, TechStartup</span></div>
        </div>
        <div className="testimonial-card">
          <div className="testimonial-avatar">SK</div>
          <p className="testimonial-text">"The team really understands the nuances of building AI products. We've already built 2 plans and executing more."</p>
          <div className="testimonial-author"><span className="author-name">Sarah Kim</span><span className="author-role">CEO, SaaSCo</span></div>
        </div>
      </div>
    </section>

    <section className="features-section" id="features">
      <div className="section-header">
        <h2 className="section-title">Our Solutions</h2>
        <p className="section-subtitle">Comprehensive AI solutions to transform your startup operations and accelerate growth.</p>
      </div>
      <div className="features-grid">
        {FEATURES.map((feature, index) => (
          <motion.div key={index} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="feature-card">
            <div className="feature-icon"><feature.icon size={24} weight="duotone" /></div>
            <h3 className="feature-title">{feature.title}</h3>
            <p className="feature-description">{feature.description}</p>
            <button className="feature-link">Explore more <ArrowRight size={14} /></button>
          </motion.div>
        ))}
      </div>
    </section>

    <section className="how-section" id="how-it-works">
      <div className="section-header">
        <span className="section-eyebrow">How it works</span>
        <h2 className="section-title">We built Founder Copilot to turn<br />startup planning from experimental to operational.</h2>
      </div>
      <div className="how-content">
        <p className="how-description">We start by understanding your goals to identify where manual planning is slowing you down. Then we generate secure, structured execution paths built to handle your specific challenges predictably.</p>
        <button onClick={onGetStarted} className="how-cta"><span>Get started free</span><ArrowRight size={18} weight="bold" /></button>
      </div>
    </section>

    <section className="cta-section">
      <div className="cta-box">
        <h2>Ready to execute?</h2>
        <p>Start a free session to walk through your goals and see how we can accelerate your startup.</p>
        <button onClick={onGetStarted} className="cta-button"><span>Launch Founder Copilot</span><ArrowRight size={18} weight="bold" /></button>
      </div>
    </section>

    <footer className="landing-footer">
      <div className="footer-content">
        <div className="footer-logo"><div className="logo-icon small"><Rocket size={16} weight="fill" /></div><span>FounderCopilot</span></div>
        <p className="footer-tagline">Built for founders who ship.</p>
      </div>
    </footer>
  </div>
);

// ============================================
// DASHBOARD COMPONENTS
// ============================================
const StatCard = ({ icon: Icon, label, value, change, changeType }) => (
  <div className="stat-card">
    <div className="stat-icon"><Icon size={20} weight="duotone" /></div>
    <div className="stat-content">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
    {change && <div className={`stat-change ${changeType}`}><TrendUp size={14} weight="bold" /><span>{change}</span></div>}
  </div>
);

const RecentPlanItem = ({ plan, onView, onDelete }) => (
  <div className="recent-plan-item">
    <div className="plan-icon"><FileText size={18} weight="duotone" /></div>
    <div className="plan-info"><span className="plan-title">{plan.title}</span><span className="plan-date">{plan.date}</span></div>
    <div className="plan-progress"><div className="progress-bar"><div className="progress-fill" style={{ width: `${plan.progress}%` }} /></div><span className="progress-text">{plan.progress}%</span></div>
    <div className="plan-actions">
      <button onClick={() => onView(plan)} className="plan-action-btn" title="View"><Eye size={16} /></button>
      <button onClick={() => onDelete(plan.id)} className="plan-action-btn delete" title="Delete"><Trash size={16} /></button>
    </div>
  </div>
);

const TemplateCard = ({ template, onClick }) => (
  <button className="template-card" onClick={() => onClick(template)}>
    <div className="template-icon" style={{ backgroundColor: `${template.color}15`, color: template.color }}><template.icon size={20} weight="duotone" /></div>
    <span className="template-name">{template.name}</span>
  </button>
);

const ResourceCard = ({ resource }) => (
  <a href={resource.url} className="resource-card">
    <div className="resource-icon"><resource.icon size={20} weight="duotone" /></div>
    <div className="resource-content"><span className="resource-title">{resource.title}</span><span className="resource-desc">{resource.description}</span></div>
    <ArrowRight size={16} className="resource-arrow" />
  </a>
);

const SkeletonCard = ({ className = "" }) => (
  <div className={`skeleton-card ${className}`}>
    <div className="skeleton-line skeleton-shimmer" style={{ width: "40%" }} />
    <div className="skeleton-line skeleton-shimmer" style={{ width: "100%" }} />
    <div className="skeleton-line skeleton-shimmer" style={{ width: "85%" }} />
  </div>
);

// Output Cards
const OutputCard = ({ icon: Icon, overline, children, className = "", delay = 0, isError = false }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay }} className={`output-card ${isError ? 'error-card' : ''} ${className}`}>
    <div className="card-header"><Icon size={22} weight="duotone" className="card-icon" /><span className="card-overline">{overline}</span></div>
    <div className="card-content">{children}</div>
  </motion.div>
);

const StrategyCard = ({ strategies, delay }) => (<OutputCard icon={Target} overline="Strategy" delay={delay} className="col-span-2"><ul className="card-list">{strategies.map((s, i) => <li key={i}>{s}</li>)}</ul></OutputCard>);
const ActionsCard = ({ actions, delay }) => (<OutputCard icon={Lightning} overline="Actions" delay={delay} className="row-span-2">{actions.map((a, i) => <div key={i} className="action-item"><div className="action-title">{a.action}</div><div className="action-reason">{a.reason}</div><div className="action-outcome">→ {a.outcome}</div></div>)}</OutputCard>);
const ExecutionPlanCard = ({ steps, delay }) => (<OutputCard icon={ListChecks} overline="Execution Plan" delay={delay} className="col-span-2 row-span-2">{steps.map((s, i) => <div key={i} className="execution-step"><div className="step-number">{String(i + 1).padStart(2, '0')}</div><div className="step-content"><div className="step-description">{s.step}</div><div className="step-result">{s.result}</div></div></div>)}</OutputCard>);
const RisksCard = ({ risks, delay }) => (<OutputCard icon={ShieldWarning} overline="Risks" delay={delay}><ul className="card-list">{risks.map((r, i) => <li key={i}>{r}</li>)}</ul></OutputCard>);
const InsightCard = ({ insight, delay }) => (<OutputCard icon={Lightbulb} overline="Key Insight" delay={delay}><p className="insight-text">{insight}</p></OutputCard>);
const ConfidenceCard = ({ confidence, delay }) => { const cls = confidence.toLowerCase().includes('high') ? 'confidence-high' : confidence.toLowerCase().includes('medium') ? 'confidence-medium' : 'confidence-low'; return (<OutputCard icon={ChartBar} overline="Confidence" delay={delay}><div className={`confidence-badge ${cls}`}><ChartBar size={18} weight="bold" /><span>{confidence}</span></div></OutputCard>); };
const ErrorCard = ({ message }) => (<OutputCard icon={ShieldWarning} overline="Out of Scope" isError={true} className="col-span-4"><p className="error-text">{message}</p></OutputCard>);

// ============================================
// TEAM MEMBER COMPONENTS
// ============================================
const TeamMemberAvatar = ({ member, size = "md", showName = false }) => {
  const sizeClass = size === "sm" ? "avatar-sm" : size === "lg" ? "avatar-lg" : "avatar-md";
  return (
    <div className={`team-avatar-wrapper ${showName ? 'with-name' : ''}`}>
      <div className={`team-avatar ${sizeClass}`} style={{ backgroundColor: member?.color || '#64748B' }}>
        {member?.avatar || '?'}
      </div>
      {showName && <span className="team-avatar-name">{member?.name || 'Unassigned'}</span>}
    </div>
  );
};

const AddTeamMemberModal = ({ isOpen, onClose, onAdd }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const colors = ["#6366F1", "#EC4899", "#10B981", "#F59E0B", "#3B82F6", "#8B5CF6"];
    const newMember = {
      name,
      email,
      role,
      avatar: name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
      color: colors[Math.floor(Math.random() * colors.length)]
    };
    await onAdd(newMember);
    setName(""); setEmail(""); setRole("");
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add Team Member</h3>
          <button onClick={onClose} className="modal-close"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" required disabled={isSubmitting} />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="john@startup.com" required disabled={isSubmitting} />
          </div>
          <div className="form-group">
            <label>Role</label>
            <input type="text" value={role} onChange={e => setRole(e.target.value)} placeholder="Developer, Designer, etc." disabled={isSubmitting} />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? <SpinnerGap size={16} className="spin" /> : <UserPlus size={16} />} 
              {isSubmitting ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// ============================================
// TASK COMPONENTS
// ============================================
const TaskCard = ({ task, teamMembers, onUpdate, onDelete, onAddComment }) => {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const assignee = task.assignee ? teamMembers.find(m => String(m.id) === String(task.assignee)) : null;
  
  // Calculate due status
  const getDueStatus = () => {
    if (!task.dueDate || task.status === 'done') return null;
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (dueDate < today) return 'overdue';
    if (dueDate.getTime() === today.getTime()) return 'due-today';
    if (dueDate.getTime() === tomorrow.getTime()) return 'due-tomorrow';
    return null;
  };
  
  const dueStatus = getDueStatus();
  const isOverdue = dueStatus === 'overdue';
  const isDueToday = dueStatus === 'due-today';
  const isDueTomorrow = dueStatus === 'due-tomorrow';
  
  const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const statusConfig = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo;

  const handleStatusChange = (newStatus) => {
    onUpdate(task.id, { ...task, status: newStatus, completed: newStatus === 'done' });
  };

  const handleCommentSubmit = () => {
    if (newComment.trim()) {
      onAddComment(task.id, newComment);
      setNewComment("");
    }
  };

  return (
    <div className={`task-card ${isOverdue ? 'overdue' : ''} ${isDueToday ? 'due-today' : ''} ${isDueTomorrow ? 'due-tomorrow' : ''}`} data-testid={`task-${task.id}`}>
      <div className="task-card-header">
        <div className="task-card-left">
          <button className={`task-checkbox ${task.completed ? 'checked' : ''}`} onClick={() => handleStatusChange(task.completed ? 'todo' : 'done')}>
            {task.completed ? <CheckSquare size={20} weight="fill" /> : <Square size={20} />}
          </button>
          <span className={`task-card-title ${task.completed ? 'completed' : ''}`}>{task.text}</span>
        </div>
        <div className="task-card-actions">
          <button className="task-card-action" onClick={() => onDelete(task.id)}><Trash size={16} /></button>
        </div>
      </div>
      
      <div className="task-card-meta">
        <div className="task-badges">
          <span className="priority-badge" style={{ backgroundColor: priorityConfig.bg, color: priorityConfig.color }}>
            <priorityConfig.icon size={12} weight="bold" /> {priorityConfig.label}
          </span>
          <span className="status-badge" style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}>
            {statusConfig.label}
          </span>
          {isOverdue && <span className="due-badge overdue"><Warning size={12} weight="fill" /> Overdue</span>}
          {isDueToday && <span className="due-badge today"><Clock size={12} weight="fill" /> Due Today</span>}
          {isDueTomorrow && <span className="due-badge tomorrow"><CalendarBlank size={12} weight="fill" /> Tomorrow</span>}
        </div>
        
        <div className="task-info">
          {task.dueDate && (
            <span className={`task-due ${dueStatus || ''}`}>
              <CalendarBlank size={14} /> {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
          {assignee && <TeamMemberAvatar member={assignee} size="sm" showName />}
        </div>
      </div>

      {task.comments && task.comments.length > 0 && (
        <button className="task-comments-toggle" onClick={() => setShowComments(!showComments)}>
          <ChatDots size={14} /> {task.comments.length} comment{task.comments.length > 1 ? 's' : ''}
          {showComments ? <CaretDown size={12} /> : <CaretRight size={12} />}
        </button>
      )}

      {showComments && (
        <div className="task-comments">
          {task.comments.map(comment => {
            const commenter = teamMembers.find(m => m.id === comment.user);
            return (
              <div key={comment.id} className="task-comment">
                <TeamMemberAvatar member={commenter} size="sm" />
                <div className="comment-content">
                  <span className="comment-author">{commenter?.name}</span>
                  <p className="comment-text">{comment.text}</p>
                  <span className="comment-time">{comment.time}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="task-add-comment">
        <input type="text" placeholder="Add a comment..." value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCommentSubmit()} />
        <button onClick={handleCommentSubmit} disabled={!newComment.trim()}><PaperPlaneTilt size={16} /></button>
      </div>
    </div>
  );
};

const AddTaskModal = ({ isOpen, onClose, onAdd, teamMembers }) => {
  const [text, setText] = useState("");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const newTask = {
      text,
      completed: false,
      status: "todo",
      priority,
      assignee: assignee || null,
      dueDate: dueDate || null,
      comments: []
    };
    await onAdd(newTask);
    setText(""); setAssignee(""); setDueDate(""); setPriority("medium");
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add New Task</h3>
          <button onClick={onClose} className="modal-close"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Task Description</label>
            <input type="text" value={text} onChange={e => setText(e.target.value)} placeholder="What needs to be done?" required disabled={isSubmitting} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Assignee</label>
              <select value={assignee} onChange={e => setAssignee(e.target.value)} disabled={isSubmitting}>
                <option value="">Unassigned</option>
                {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} disabled={isSubmitting} />
            </div>
          </div>
          <div className="form-group">
            <label>Priority</label>
            <div className="priority-selector">
              {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                <button key={key} type="button" className={`priority-option ${priority === key ? 'selected' : ''}`} style={{ '--priority-color': config.color, '--priority-bg': config.bg }} onClick={() => setPriority(key)} disabled={isSubmitting}>
                  <config.icon size={14} /> {config.label}
                </button>
              ))}
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? <SpinnerGap size={16} className="spin" /> : <Plus size={16} />}
              {isSubmitting ? 'Adding...' : 'Add Task'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// ============================================
// COLLABORATION PAGE COMPONENTS
// ============================================
// ============================================
// DRAGGABLE KANBAN COMPONENTS
// ============================================
const DraggableTaskCard = ({ task, teamMembers, onUpdate, onDelete, onAddComment, index }) => {
  return (
    <Draggable draggableId={String(task.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`draggable-task-wrapper ${snapshot.isDragging ? 'is-dragging' : ''}`}
        >
          <TaskCard task={task} teamMembers={teamMembers} onUpdate={onUpdate} onDelete={onDelete} onAddComment={onAddComment} />
        </div>
      )}
    </Draggable>
  );
};

const DroppableKanbanColumn = ({ title, status, tasks, teamMembers, onUpdateTask, onDeleteTask, onAddComment, color }) => (
  <div className="kanban-column">
    <div className="kanban-column-header" style={{ borderTopColor: color }}>
      <span className="kanban-column-title">{title}</span>
      <span className="kanban-column-count">{tasks.length}</span>
    </div>
    <Droppable droppableId={status}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`kanban-column-content ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
        >
          {tasks.map((task, index) => (
            <DraggableTaskCard
              key={task.id}
              task={task}
              teamMembers={teamMembers}
              onUpdate={onUpdateTask}
              onDelete={onDeleteTask}
              onAddComment={onAddComment}
              index={index}
            />
          ))}
          {provided.placeholder}
          {tasks.length === 0 && !snapshot.isDraggingOver && <div className="kanban-empty">No tasks</div>}
        </div>
      )}
    </Droppable>
  </div>
);

const KanbanColumn = ({ title, status, tasks, teamMembers, onUpdateTask, onDeleteTask, onAddComment, color }) => (
  <div className="kanban-column">
    <div className="kanban-column-header" style={{ borderTopColor: color }}>
      <span className="kanban-column-title">{title}</span>
      <span className="kanban-column-count">{tasks.length}</span>
    </div>
    <div className="kanban-column-content">
      {tasks.map(task => (
        <TaskCard key={task.id} task={task} teamMembers={teamMembers} onUpdate={onUpdateTask} onDelete={onDeleteTask} onAddComment={onAddComment} />
      ))}
      {tasks.length === 0 && <div className="kanban-empty">No tasks</div>}
    </div>
  </div>
);

const TaskTableRow = ({ task, teamMembers, onUpdate, onDelete }) => {
  const assignee = task.assignee ? teamMembers.find(m => String(m.id) === String(task.assignee)) : null;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
  const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const statusConfig = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo;

  return (
    <tr className={isOverdue ? 'overdue-row' : ''}>
      <td>
        <button className={`task-checkbox ${task.completed ? 'checked' : ''}`} onClick={() => onUpdate(task.id, { ...task, status: task.completed ? 'todo' : 'done', completed: !task.completed })}>
          {task.completed ? <CheckSquare size={18} weight="fill" /> : <Square size={18} />}
        </button>
      </td>
      <td><span className={task.completed ? 'completed-text' : ''}>{task.text}</span></td>
      <td>{assignee ? <TeamMemberAvatar member={assignee} size="sm" showName /> : <span className="unassigned">Unassigned</span>}</td>
      <td><span className="status-badge" style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}>{statusConfig.label}</span></td>
      <td><span className="priority-badge" style={{ backgroundColor: priorityConfig.bg, color: priorityConfig.color }}><priorityConfig.icon size={12} /> {priorityConfig.label}</span></td>
      <td className={isOverdue ? 'overdue-date' : ''}>{task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'}</td>
      <td><span className="comment-count"><ChatDots size={14} /> {task.comments?.length || 0}</span></td>
      <td>
        <button className="table-action-btn" onClick={() => onDelete(task.id)}><Trash size={16} /></button>
      </td>
    </tr>
  );
};

// ============================================
// MAIN DASHBOARD COMPONENT
// ============================================
const Dashboard = ({ onBackToLanding, user, onLogout }) => {
  const [prompt, setPrompt] = useState("");
  const [lastPrompt, setLastPrompt] = useState("");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState(0);
  const [recentPlans, setRecentPlans] = useState(MOCK_RECENT_PLANS);
  
  // Team & Collaboration State (now loaded from API)
  const [teamMembers, setTeamMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [collabView, setCollabView] = useState("kanban"); // kanban or table
  const [filterAssignee, setFilterAssignee] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  
  const outputRef = useRef(null);

  // Get current user ID for API calls (from prop)
  const userId = user?.email ? user.email.replace(/[^a-zA-Z0-9]/g, '_') : null;

  // Load data from API on mount
  const loadUserData = useCallback(async () => {
    if (!userId) {
      setDataLoading(false);
      return;
    }
    
    setDataLoading(true);
    try {
      // First try to seed data for new users
      await seedApi.seedUserData(userId);
      
      // Then load the data
      const [teamData, tasksData] = await Promise.all([
        teamApi.getAll(userId),
        taskApi.getAll(userId)
      ]);
      
      // Transform data to match frontend format
      const transformedTeam = teamData.map(m => ({
        id: m.id,
        name: m.name,
        email: m.email,
        role: m.role || '',
        avatar: m.avatar || m.name.split(' ').map(n => n[0]).join('').toUpperCase(),
        color: m.color || '#6366F1'
      }));
      
      const transformedTasks = tasksData.map(t => ({
        id: t.id,
        text: t.text,
        status: t.status,
        priority: t.priority,
        assignee: t.assignee,
        dueDate: t.due_date,
        completed: t.completed,
        comments: (t.comments || []).map(c => ({
          id: c.id,
          user: c.user_id,
          text: c.text,
          time: c.time || 'Recently'
        }))
      }));
      
      setTeamMembers(transformedTeam);
      setTasks(transformedTasks);
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Failed to load data. Please refresh.');
    } finally {
      setDataLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Calculate overdue tasks for notifications
  const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done');

  // Calculate tasks due today and tomorrow
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

  const tasksDueToday = tasks.filter(t => {
    if (!t.dueDate || t.status === 'done') return false;
    const dueDate = new Date(t.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate.getTime() === today.getTime();
  });

  const tasksDueTomorrow = tasks.filter(t => {
    if (!t.dueDate || t.status === 'done') return false;
    const dueDate = new Date(t.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate.getTime() === tomorrow.getTime();
  });

  // Helper function to get due status for a task
  const getTaskDueStatus = (task) => {
    if (!task.dueDate || task.status === 'done') return null;
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const tomorrowDate = new Date(todayDate);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    
    if (dueDate < todayDate) return 'overdue';
    if (dueDate.getTime() === todayDate.getTime()) return 'due-today';
    if (dueDate.getTime() === tomorrowDate.getTime()) return 'due-tomorrow';
    return null;
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setSidebarOpen(true);
      else setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update notifications based on overdue + due today tasks
  useEffect(() => {
    setNotifications(overdueTasks.length + tasksDueToday.length);
  }, [overdueTasks.length, tasksDueToday.length]);

  const handleSubmit = async (modifier = null) => {
    if (!prompt.trim() && !modifier) { toast.error('Please enter a prompt'); return; }
    const currentPrompt = prompt.trim() || lastPrompt;
    setLoading(true);
    setActiveTab("generate");
    setResponse(null);

    try {
      const res = await axios.post(`${API}/generate`, { prompt: currentPrompt, modifier, context: modifier ? lastPrompt : null });
      setResponse(res.data);
      setLastPrompt(currentPrompt);
      if (!res.data.is_out_of_scope && !res.data.error) {
        const newPlan = { id: Date.now(), title: currentPrompt.slice(0, 30) + (currentPrompt.length > 30 ? '...' : ''), date: 'Just now', status: 'completed', progress: 0 };
        setRecentPlans(prev => [newPlan, ...prev.slice(0, 4)]);
      }
      setTimeout(() => { outputRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 100);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to generate plan.');
      setResponse({ error: 'Failed to generate plan. Please try again.', is_out_of_scope: false });
    } finally { setLoading(false); }
  };

  const handleWorkflowClick = (workflowPrompt) => { setPrompt(workflowPrompt); setActiveTab("home"); };
  const handleTemplateClick = (template) => {
    const prompts = { saas: "Help me create a growth strategy for my B2B SaaS startup", ecommerce: "Help me optimize my e-commerce funnel", agency: "Help me scale my digital agency", marketplace: "Help me build a go-to-market strategy for my marketplace" };
    setPrompt(prompts[template.id] || "");
    toast.success(`${template.name} template loaded!`);
  };
  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } };

  // Team functions (with API persistence)
  const handleAddTeamMember = async (member) => {
    if (!userId) return;
    try {
      const newMember = await teamApi.create(userId, {
        name: member.name,
        email: member.email,
        role: member.role || '',
        avatar: member.avatar,
        color: member.color
      });
      setTeamMembers(prev => [...prev, {
        id: newMember.id,
        name: newMember.name,
        email: newMember.email,
        role: newMember.role || '',
        avatar: newMember.avatar,
        color: newMember.color
      }]);
      toast.success('Team member added!');
    } catch (error) {
      console.error('Error adding team member:', error);
      toast.error('Failed to add team member');
    }
  };
  
  const handleRemoveTeamMember = async (id) => {
    if (!userId) return;
    try {
      await teamApi.delete(userId, id);
      setTeamMembers(prev => prev.filter(m => m.id !== id));
      toast.success('Team member removed');
    } catch (error) {
      console.error('Error removing team member:', error);
      toast.error('Failed to remove team member');
    }
  };

  // Task functions (with API persistence)
  const handleAddTask = async (task) => {
    if (!userId) return;
    try {
      const newTask = await taskApi.create(userId, {
        text: task.text,
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        assignee: task.assignee || null,
        due_date: task.dueDate || null,
        completed: task.completed || false
      });
      setTasks(prev => [...prev, {
        id: newTask.id,
        text: newTask.text,
        status: newTask.status,
        priority: newTask.priority,
        assignee: newTask.assignee,
        dueDate: newTask.due_date,
        completed: newTask.completed,
        comments: []
      }]);
      toast.success('Task created!');
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Failed to create task');
    }
  };
  
  const handleUpdateTask = async (id, updatedTask) => {
    if (!userId) return;
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
    try {
      await taskApi.update(userId, id, {
        text: updatedTask.text,
        status: updatedTask.status,
        priority: updatedTask.priority,
        assignee: updatedTask.assignee,
        due_date: updatedTask.dueDate,
        completed: updatedTask.completed
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
      // Revert on error
      loadUserData();
    }
  };
  
  const handleDeleteTask = async (id) => {
    if (!userId) return;
    try {
      await taskApi.delete(userId, id);
      setTasks(prev => prev.filter(t => t.id !== id));
      toast.success('Task deleted');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };
  
  const handleAddComment = async (taskId, text) => {
    if (!userId) return;
    try {
      const updatedTask = await taskApi.addComment(userId, taskId, text, user?.name || 'User');
      setTasks(prev => prev.map(t => t.id === taskId ? {
        ...t,
        comments: (updatedTask.comments || []).map(c => ({
          id: c.id,
          user: c.user_id,
          text: c.text,
          time: c.time || 'Just now'
        }))
      } : t));
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  // Drag and drop handler for Kanban board
  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    
    // If no destination, do nothing
    if (!destination) return;
    
    // If dropped in same place, do nothing
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    
    // Find the task that was dragged
    const taskId = parseInt(draggableId);
    const task = tasks.find(t => t.id === taskId);
    
    if (!task) return;
    
    // Update task status based on destination column
    const newStatus = destination.droppableId;
    const isCompleted = newStatus === 'done';
    
    const updatedTask = {
      ...task,
      status: newStatus,
      completed: isCompleted
    };
    
    handleUpdateTask(taskId, updatedTask);
    
    // Show toast notification
    const statusLabels = {
      todo: 'To Do',
      in_progress: 'In Progress',
      done: 'Done',
      delayed: 'Delayed'
    };
    toast.success(`Task moved to ${statusLabels[newStatus]}`);
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (filterAssignee !== "all" && String(task.assignee) !== String(filterAssignee)) return false;
    if (filterStatus !== "all" && task.status !== filterStatus) return false;
    if (filterPriority !== "all" && task.priority !== filterPriority) return false;
    return true;
  });

  const completedTasks = tasks.filter(t => t.completed).length;
  const taskProgress = Math.round((completedTasks / tasks.length) * 100);

  return (
    <div className="dashboard-layout" data-testid="dashboard-layout">
      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : 'closed'} ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo" onClick={onBackToLanding}>
            <div className="logo-icon small"><Rocket size={18} weight="fill" /></div>
            {!sidebarCollapsed && <span>FounderCopilot</span>}
          </div>
          <button className="sidebar-collapse-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            {sidebarCollapsed ? <CaretRight size={16} /> : <CaretDown size={16} />}
          </button>
        </div>
        
        {!sidebarCollapsed && (
          <div className="sidebar-search">
            <MagnifyingGlass size={16} className="search-icon" />
            <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        )}

        <nav className="sidebar-nav">
          <div className="nav-section">
            {!sidebarCollapsed && <span className="nav-section-label">Main</span>}
            <button className={`sidebar-nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}><House size={20} weight="duotone" />{!sidebarCollapsed && <span>Dashboard</span>}</button>
            <button className={`sidebar-nav-item ${activeTab === 'generate' ? 'active' : ''}`} onClick={() => setActiveTab('generate')}><Sparkle size={20} weight="duotone" />{!sidebarCollapsed && <span>Generate Plan</span>}</button>
            <button className={`sidebar-nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}><ClockCounterClockwise size={20} weight="duotone" />{!sidebarCollapsed && <span>History</span>}</button>
            <button className={`sidebar-nav-item ${activeTab === 'templates' ? 'active' : ''}`} onClick={() => setActiveTab('templates')}><Folder size={20} weight="duotone" />{!sidebarCollapsed && <span>Templates</span>}</button>
          </div>

          <div className="nav-section">
            {!sidebarCollapsed && <span className="nav-section-label">Workspace</span>}
            <button className={`sidebar-nav-item ${activeTab === 'team' ? 'active' : ''}`} onClick={() => setActiveTab('team')}>
              <UsersThree size={20} weight="duotone" />
              {!sidebarCollapsed && <span>Team</span>}
            </button>
            <button className={`sidebar-nav-item ${activeTab === 'collaboration' ? 'active' : ''}`} onClick={() => setActiveTab('collaboration')}>
              <Kanban size={20} weight="duotone" />
              {!sidebarCollapsed && <span>Collaboration</span>}
              {overdueTasks.length > 0 && <span className="nav-badge">{overdueTasks.length}</span>}
            </button>
            <button className={`sidebar-nav-item ${activeTab === 'progress' ? 'active' : ''}`} onClick={() => setActiveTab('progress')}><ChartLineUp size={20} weight="duotone" />{!sidebarCollapsed && <span>Progress</span>}</button>
            <button className={`sidebar-nav-item ${activeTab === 'resources' ? 'active' : ''}`} onClick={() => setActiveTab('resources')}><BookOpen size={20} weight="duotone" />{!sidebarCollapsed && <span>Resources</span>}</button>
          </div>

          <div className="nav-section">
            {!sidebarCollapsed && <span className="nav-section-label">Account</span>}
            <button className={`sidebar-nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}><Gear size={20} weight="duotone" />{!sidebarCollapsed && <span>Settings</span>}</button>
          </div>
        </nav>

        <div className="sidebar-footer">
          {!sidebarCollapsed && (
            <div className="upgrade-card">
              <Star size={20} weight="fill" className="upgrade-icon" />
              <div className="upgrade-content"><span className="upgrade-title">Upgrade to Pro</span><span className="upgrade-desc">Get unlimited plans</span></div>
            </div>
          )}
          <div className="user-menu">
            <div className="user-avatar">{user?.name?.charAt(0).toUpperCase() || 'U'}</div>
            {!sidebarCollapsed && <div className="user-info"><span className="user-name">{user?.name || 'User'}</span><span className="user-email">{user?.email || 'user@example.com'}</span></div>}
            <button onClick={onLogout} className="logout-btn" title="Sign out"><SignOut size={18} /></button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="mobile-header">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="menu-toggle"><List size={24} /></button>
        <div className="mobile-logo" onClick={onBackToLanding}><div className="logo-icon small"><Rocket size={16} weight="fill" /></div><span>FounderCopilot</span></div>
        <div className="mobile-actions">
          <button className="notification-btn">
            <Bell size={20} />
            {notifications > 0 && <span className="notification-badge">{notifications}</span>}
          </button>
          <div className="user-avatar small">{user?.name?.charAt(0).toUpperCase() || 'U'}</div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`dashboard-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Top Bar */}
        <div className="dashboard-topbar">
          <div className="topbar-left">
            <h1 className="page-title">
              {activeTab === 'home' && 'Dashboard'}
              {activeTab === 'generate' && 'Generate Plan'}
              {activeTab === 'history' && 'Plan History'}
              {activeTab === 'templates' && 'Templates'}
              {activeTab === 'team' && 'Team Management'}
              {activeTab === 'collaboration' && 'Collaboration'}
              {activeTab === 'progress' && 'Progress Tracker'}
              {activeTab === 'resources' && 'Resource Hub'}
              {activeTab === 'settings' && 'Settings'}
            </h1>
          </div>
          <div className="topbar-right">
            <button className="topbar-btn" title="Notifications">
              <Bell size={20} />
              {notifications > 0 && <span className="notification-badge">{notifications}</span>}
            </button>
            <button className="topbar-btn primary" onClick={() => setActiveTab('generate')}><Plus size={18} /><span>New Plan</span></button>
          </div>
        </div>

        {/* Dashboard Home */}
        {activeTab === 'home' && (
          <div className="dashboard-home">
            <section className="stats-section">
              <StatCard icon={FileText} label="Plans Generated" value={MOCK_STATS.plansGenerated} change="+12%" changeType="positive" />
              <StatCard icon={Lightning} label="This Week" value={MOCK_STATS.plansThisWeek} change="+3" changeType="positive" />
              <StatCard icon={CheckCircle} label="Tasks Completed" value={completedTasks} />
              <StatCard icon={Warning} label="Overdue Tasks" value={overdueTasks.length} changeType={overdueTasks.length > 0 ? "negative" : ""} />
            </section>

            {/* Deadline Alerts Banner */}
            {(overdueTasks.length > 0 || tasksDueToday.length > 0 || tasksDueTomorrow.length > 0) && (
              <section className="deadline-alerts-section">
                {overdueTasks.length > 0 && (
                  <div className="deadline-alert overdue" onClick={() => setActiveTab('collaboration')}>
                    <Warning size={18} weight="fill" />
                    <span><strong>{overdueTasks.length}</strong> task{overdueTasks.length > 1 ? 's' : ''} overdue</span>
                    <ArrowRight size={14} />
                  </div>
                )}
                {tasksDueToday.length > 0 && (
                  <div className="deadline-alert due-today" onClick={() => setActiveTab('collaboration')}>
                    <Clock size={18} weight="fill" />
                    <span><strong>{tasksDueToday.length}</strong> task{tasksDueToday.length > 1 ? 's' : ''} due today</span>
                    <ArrowRight size={14} />
                  </div>
                )}
                {tasksDueTomorrow.length > 0 && (
                  <div className="deadline-alert due-tomorrow" onClick={() => setActiveTab('collaboration')}>
                    <CalendarBlank size={18} weight="fill" />
                    <span><strong>{tasksDueTomorrow.length}</strong> task{tasksDueTomorrow.length > 1 ? 's' : ''} due tomorrow</span>
                    <ArrowRight size={14} />
                  </div>
                )}
              </section>
            )}

            <section className="quick-actions-section">
              <div className="section-header-row"><h2 className="section-title-sm">Quick Actions</h2></div>
              <div className="workflow-grid-compact">
                {WORKFLOW_PROMPTS.map((w) => (
                  <button key={w.id} className="workflow-btn-compact" onClick={() => handleWorkflowClick(w.prompt)}>
                    <w.icon size={18} weight="duotone" className="workflow-icon" /><span>{w.title}</span>
                  </button>
                ))}
              </div>
            </section>

            <div className="dashboard-grid">
              <section className="recent-plans-section">
                <div className="section-header-row"><h2 className="section-title-sm">Recent Plans</h2><button className="see-all-btn" onClick={() => setActiveTab('history')}>See all <ArrowRight size={14} /></button></div>
                <div className="recent-plans-list">
                  {recentPlans.map(plan => <RecentPlanItem key={plan.id} plan={plan} onView={() => toast.info(`Viewing: ${plan.title}`)} onDelete={(id) => { setRecentPlans(prev => prev.filter(p => p.id !== id)); toast.success('Plan deleted'); }} />)}
                </div>
              </section>

              <section className="progress-mini-section">
                <div className="section-header-row"><h2 className="section-title-sm">Team Tasks</h2><span className="progress-badge">{completedTasks}/{tasks.length}</span></div>
                <div className="progress-overview">
                  <div className="circular-progress">
                    <svg viewBox="0 0 36 36"><path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E2E8F0" strokeWidth="3" /><path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#14B8A6" strokeWidth="3" strokeDasharray={`${taskProgress}, 100`} /></svg>
                    <span className="progress-percent">{taskProgress}%</span>
                  </div>
                </div>
                {overdueTasks.length > 0 && (
                  <div className="overdue-alert">
                    <Warning size={16} weight="fill" />
                    <span>{overdueTasks.length} task{overdueTasks.length > 1 ? 's' : ''} overdue</span>
                  </div>
                )}
                <button className="see-all-btn center" onClick={() => setActiveTab('collaboration')}>Manage tasks <ArrowRight size={14} /></button>
              </section>
            </div>

            <section className="templates-section">
              <div className="section-header-row"><h2 className="section-title-sm">Industry Templates</h2></div>
              <div className="templates-grid">{INDUSTRY_TEMPLATES.map(t => <TemplateCard key={t.id} template={t} onClick={handleTemplateClick} />)}</div>
            </section>
          </div>
        )}

        {/* Generate Plan Tab */}
        {activeTab === 'generate' && (
          <div className="generate-page">
            <div className="generate-header"><h2>What would you like to execute?</h2><p>Describe your startup goal and get a structured execution plan</p></div>
            <div className="input-panel large">
              <textarea className="input-textarea" placeholder="e.g., 'Help me validate my B2B SaaS idea for HR automation'" value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={handleKeyDown} disabled={loading} data-testid="main-input" />
              <div className="input-footer">
                <div className="input-hints"><span>Press Enter to generate</span></div>
                <button className="input-submit-btn" onClick={() => handleSubmit()} disabled={loading || !prompt.trim()} data-testid="submit-btn">{loading ? 'Generating...' : 'Generate Plan'}<ArrowRight size={16} weight="bold" /></button>
              </div>
            </div>
            <div ref={outputRef} className="output-area">
              {loading ? (
                <><p className="loading-text"><ArrowsClockwise size={18} className="spin" />Generating your execution plan...</p><div className="bento-grid"><SkeletonCard className="col-span-2" /><SkeletonCard className="row-span-2" /><SkeletonCard className="col-span-2 row-span-2" /><SkeletonCard /><SkeletonCard /><SkeletonCard /></div></>
              ) : response ? (
                response.is_out_of_scope || response.error ? (<div className="bento-grid"><ErrorCard message={response.error} /></div>) : (
                  <>
                    <div className="output-header"><h3>Your Execution Plan</h3><div className="output-actions"><button className="output-action-btn"><Copy size={16} /> Copy</button><button className="output-action-btn"><Download size={16} /> Export</button><button className="output-action-btn"><Share size={16} /> Share</button></div></div>
                    <div className="bento-grid" data-testid="output-grid">
                      <StrategyCard strategies={response.strategy || []} delay={0} />
                      <ActionsCard actions={response.actions || []} delay={0.1} />
                      <ExecutionPlanCard steps={response.execution_plan || []} delay={0.2} />
                      <RisksCard risks={response.risks || []} delay={0.3} />
                      <InsightCard insight={response.insight || ''} delay={0.4} />
                      <ConfidenceCard confidence={response.confidence || ''} delay={0.5} />
                    </div>
                    <div className="smart-actions">
                      <button className="smart-action-btn" onClick={() => handleSubmit('regenerate')} disabled={loading}><ArrowClockwise size={16} /><span>Regenerate</span></button>
                      <button className="smart-action-btn" onClick={() => handleSubmit('aggressive')} disabled={loading}><Fire size={16} /><span>Make aggressive</span></button>
                      <button className="smart-action-btn" onClick={() => handleSubmit('budget')} disabled={loading}><CurrencyDollar size={16} /><span>Reduce budget</span></button>
                      <button className="smart-action-btn save" onClick={() => toast.success('Plan saved!')}><Bookmark size={16} /><span>Save Plan</span></button>
                    </div>
                  </>
                )
              ) : null}
            </div>
          </div>
        )}

        {/* Team Management Tab */}
        {activeTab === 'team' && (
          <div className="team-page" data-testid="team-page">
            <div className="team-header">
              <div className="team-stats">
                <div className="team-stat"><span className="stat-number">{teamMembers.length}</span><span className="stat-label">Team Members</span></div>
                <div className="team-stat"><span className="stat-number">{tasks.filter(t => t.assignee).length}</span><span className="stat-label">Assigned Tasks</span></div>
              </div>
              <button className="btn-primary" onClick={() => setShowAddMemberModal(true)}><UserPlus size={18} /> Add Member</button>
            </div>

            <div className="team-grid">
              {teamMembers.map(member => (
                <div key={member.id} className="team-member-card">
                  <div className="member-header">
                    <div className="team-avatar large" style={{ backgroundColor: member.color }}>{member.avatar}</div>
                    <button className="member-remove" onClick={() => handleRemoveTeamMember(member.id)}><X size={14} /></button>
                  </div>
                  <h3 className="member-name">{member.name}</h3>
                  <p className="member-role">{member.role}</p>
                  <p className="member-email">{member.email}</p>
                  <div className="member-stats">
                    <span><CheckCircle size={14} /> {tasks.filter(t => String(t.assignee) === String(member.id) && t.completed).length} completed</span>
                    <span><Clock size={14} /> {tasks.filter(t => String(t.assignee) === String(member.id) && !t.completed).length} pending</span>
                  </div>
                </div>
              ))}
              <button className="add-member-card" onClick={() => setShowAddMemberModal(true)}>
                <UserPlus size={32} />
                <span>Add Team Member</span>
              </button>
            </div>

            <AddTeamMemberModal isOpen={showAddMemberModal} onClose={() => setShowAddMemberModal(false)} onAdd={handleAddTeamMember} />
          </div>
        )}

        {/* Collaboration Tab */}
        {activeTab === 'collaboration' && (
          <div className="collaboration-page" data-testid="collaboration-page">
            <div className="collab-toolbar">
              <div className="collab-filters">
                <div className="filter-group">
                  <label><User size={14} /> Assignee</label>
                  <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}>
                    <option value="all">All</option>
                    {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    <option value="">Unassigned</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label><FunnelIcon size={14} /> Status</label>
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="all">All</option>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div className="filter-group">
                  <label><ArrowUp size={14} /> Priority</label>
                  <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
                    <option value="all">All</option>
                    {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="collab-actions">
                <div className="view-toggle">
                  <button className={collabView === 'kanban' ? 'active' : ''} onClick={() => setCollabView('kanban')}><Kanban size={18} /></button>
                  <button className={collabView === 'table' ? 'active' : ''} onClick={() => setCollabView('table')}><Rows size={18} /></button>
                </div>
                <button className="btn-primary" onClick={() => setShowAddTaskModal(true)}><Plus size={18} /> Add Task</button>
              </div>
            </div>

            {overdueTasks.length > 0 && (
              <div className="overdue-banner">
                <Warning size={20} weight="fill" />
                <span><strong>{overdueTasks.length} task{overdueTasks.length > 1 ? 's' : ''}</strong> overdue and need attention</span>
              </div>
            )}

            {collabView === 'kanban' ? (
              <DragDropContext onDragEnd={handleDragEnd}>
                <div className="kanban-board">
                  <DroppableKanbanColumn title="To Do" status="todo" color="#64748B" tasks={filteredTasks.filter(t => t.status === 'todo')} teamMembers={teamMembers} onUpdateTask={handleUpdateTask} onDeleteTask={handleDeleteTask} onAddComment={handleAddComment} />
                  <DroppableKanbanColumn title="In Progress" status="in_progress" color="#3B82F6" tasks={filteredTasks.filter(t => t.status === 'in_progress')} teamMembers={teamMembers} onUpdateTask={handleUpdateTask} onDeleteTask={handleDeleteTask} onAddComment={handleAddComment} />
                  <DroppableKanbanColumn title="Done" status="done" color="#10B981" tasks={filteredTasks.filter(t => t.status === 'done')} teamMembers={teamMembers} onUpdateTask={handleUpdateTask} onDeleteTask={handleDeleteTask} onAddComment={handleAddComment} />
                  <DroppableKanbanColumn title="Delayed" status="delayed" color="#EF4444" tasks={filteredTasks.filter(t => t.status === 'delayed')} teamMembers={teamMembers} onUpdateTask={handleUpdateTask} onDeleteTask={handleDeleteTask} onAddComment={handleAddComment} />
                </div>
              </DragDropContext>
            ) : (
              <div className="tasks-table-wrapper">
                <table className="tasks-table">
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}></th>
                      <th>Task</th>
                      <th>Assignee</th>
                      <th>Status</th>
                      <th>Priority</th>
                      <th>Due Date</th>
                      <th>Comments</th>
                      <th style={{ width: 50 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map(task => <TaskTableRow key={task.id} task={task} teamMembers={teamMembers} onUpdate={handleUpdateTask} onDelete={handleDeleteTask} />)}
                  </tbody>
                </table>
              </div>
            )}

            <AddTaskModal isOpen={showAddTaskModal} onClose={() => setShowAddTaskModal(false)} onAdd={handleAddTask} teamMembers={teamMembers} />
          </div>
        )}

        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <div className="progress-page">
            <div className="progress-header">
              <div className="progress-stats">
                <div className="progress-stat"><span className="stat-number">{completedTasks}</span><span className="stat-label">Completed</span></div>
                <div className="progress-stat"><span className="stat-number">{tasks.length - completedTasks}</span><span className="stat-label">Remaining</span></div>
                <div className="progress-stat"><span className="stat-number">{taskProgress}%</span><span className="stat-label">Progress</span></div>
                <div className="progress-stat danger"><span className="stat-number">{overdueTasks.length}</span><span className="stat-label">Overdue</span></div>
              </div>
            </div>
            <div className="progress-bar-large"><div className="progress-fill" style={{ width: `${taskProgress}%` }} /></div>
            <div className="tasks-section">
              <div className="tasks-header"><h3>All Tasks</h3><button className="add-task-btn" onClick={() => setShowAddTaskModal(true)}><Plus size={16} /> Add Task</button></div>
              <div className="tasks-list">
                {tasks.map(task => {
                  const assignee = task.assignee ? teamMembers.find(m => String(m.id) === String(task.assignee)) : null;
                  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
                  return (
                    <div key={task.id} className={`task-item-full ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`}>
                      <button className={`task-checkbox ${task.completed ? 'checked' : ''}`} onClick={() => handleUpdateTask(task.id, { ...task, completed: !task.completed, status: task.completed ? 'todo' : 'done' })}>
                        {task.completed ? <CheckSquare size={20} weight="fill" /> : <Square size={20} />}
                      </button>
                      <span className="task-text">{task.text}</span>
                      {assignee && <TeamMemberAvatar member={assignee} size="sm" />}
                      {isOverdue && <span className="overdue-tag"><Warning size={12} /> Overdue</span>}
                    </div>
                  );
                })}
              </div>
            </div>
            <AddTaskModal isOpen={showAddTaskModal} onClose={() => setShowAddTaskModal(false)} onAdd={handleAddTask} teamMembers={teamMembers} />
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="history-page">
            <div className="history-header">
              <div className="history-filters"><button className="filter-btn active">All Plans</button><button className="filter-btn">Completed</button><button className="filter-btn">In Progress</button></div>
              <div className="history-search"><MagnifyingGlass size={16} /><input type="text" placeholder="Search plans..." /></div>
            </div>
            <div className="history-list">{recentPlans.map(plan => <RecentPlanItem key={plan.id} plan={plan} onView={() => toast.info(`Viewing: ${plan.title}`)} onDelete={(id) => setRecentPlans(prev => prev.filter(p => p.id !== id))} />)}</div>
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="templates-page">
            <div className="templates-header"><h2>Choose a Template</h2><p>Select an industry template to get started faster</p></div>
            <div className="templates-full-grid">
              {INDUSTRY_TEMPLATES.map(t => (
                <div key={t.id} className="template-card-full" onClick={() => handleTemplateClick(t)}>
                  <div className="template-icon-full" style={{ backgroundColor: `${t.color}15`, color: t.color }}><t.icon size={32} weight="duotone" /></div>
                  <h3>{t.name}</h3><p>Pre-built prompts for {t.name.toLowerCase()} businesses</p>
                  <button className="template-use-btn">Use Template <ArrowRight size={14} /></button>
                </div>
              ))}
            </div>
            <div className="custom-templates-section"><h3>Custom Templates</h3><p>Save your own prompts as reusable templates</p><button className="create-template-btn"><Plus size={18} /><span>Create Custom Template</span></button></div>
          </div>
        )}

        {/* Resources Tab */}
        {activeTab === 'resources' && (
          <div className="resources-page">
            <div className="resources-header"><h2>Resource Hub</h2><p>Curated guides, frameworks, and tools for startup founders</p></div>
            <div className="resources-full-grid">{RESOURCES.map((r, i) => <ResourceCard key={i} resource={r} />)}</div>
            <div className="resources-categories"><h3>Browse by Category</h3><div className="category-tags"><button className="category-tag">Growth</button><button className="category-tag">Fundraising</button><button className="category-tag">Product</button><button className="category-tag">Marketing</button><button className="category-tag">Sales</button><button className="category-tag">Hiring</button></div></div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="settings-page">
            <div className="settings-section"><h3>Profile</h3><div className="settings-form"><div className="form-group"><label>Full Name</label><input type="text" defaultValue={user?.name || ''} /></div><div className="form-group"><label>Email</label><input type="email" defaultValue={user?.email || ''} /></div><button className="save-btn">Save Changes</button></div></div>
            <div className="settings-section"><h3>Preferences</h3><div className="preference-item"><div className="preference-info"><span className="preference-title">Email Notifications</span><span className="preference-desc">Receive updates about your plans</span></div><label className="toggle"><input type="checkbox" defaultChecked /><span className="toggle-slider"></span></label></div><div className="preference-item"><div className="preference-info"><span className="preference-title">Task Reminders</span><span className="preference-desc">Get notified about overdue tasks</span></div><label className="toggle"><input type="checkbox" defaultChecked /><span className="toggle-slider"></span></label></div></div>
            <div className="settings-section danger"><h3>Danger Zone</h3><button className="delete-account-btn">Delete Account</button></div>
          </div>
        )}
      </main>
    </div>
  );
};

// ============================================
// MAIN APP COMPONENT
// ============================================
function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [user, setUser] = useState(() => { const saved = localStorage.getItem('user'); return saved ? JSON.parse(saved) : null; });
  const [authModal, setAuthModal] = useState({ open: false, mode: 'login' });
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOffline(!navigator.onLine);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  const handleLogout = () => { localStorage.removeItem('user'); setUser(null); setCurrentView('landing'); toast.success('Signed out successfully'); };
  const handleAuthSuccess = (userData) => { setUser(userData); setAuthModal({ open: false, mode: 'login' }); setCurrentView('dashboard'); };
  
  // Handle "Try Copilot Free" - creates a demo user for quick access
  const handleTryFree = () => {
    const demoUser = { name: 'User', email: 'user@example.com' };
    localStorage.setItem('user', JSON.stringify(demoUser));
    setUser(demoUser);
    setCurrentView('dashboard');
  };

  if (isOffline) return (<div className="offline-banner"><WifiSlash size={64} weight="duotone" className="offline-icon" /><h2 className="offline-title">You're offline</h2><p className="offline-subtitle">Please check your internet connection.</p></div>);

  return (
    <>
      <Toaster position="top-right" theme="light" />
      {currentView === 'landing' ? (<LandingPage onGetStarted={handleTryFree} onOpenAuth={(mode) => setAuthModal({ open: true, mode })} user={user} />) : (<Dashboard onBackToLanding={() => setCurrentView('landing')} user={user} onLogout={handleLogout} />)}
      <AnimatePresence>{authModal.open && <AuthModal isOpen={authModal.open} onClose={() => setAuthModal({ open: false, mode: 'login' })} onSuccess={handleAuthSuccess} initialMode={authModal.mode} />}</AnimatePresence>
    </>
  );
}

export default App;
