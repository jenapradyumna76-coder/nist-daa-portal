import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShieldCheck, 
  Search, 
  Printer, 
  Download, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  KeyRound,
  LogOut,
  UserPlus
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy 
} from 'firebase/firestore';

// ---------------------------------------------------------
// FIREBASE CONFIGURATION
// ---------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyAl4V0az5s3WqXEtGmsxqjwUveh84XdM2Q",
  authDomain: "nist-daa-project.firebaseapp.com",
  projectId: "nist-daa-project",
  storageBucket: "nist-daa-project.appspot.com",
  messagingSenderId: "1028308462001",
  appId: "1:1028308462001:web:5830b501d5ce3902316e25"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ---------------------------------------------------------
// MASTER TOPICS (DAA Syllabus)
// ---------------------------------------------------------
const ALL_TOPICS = [
  "Asymptotic notation, Standard notations and common functions",
  "Greedy method",
  "Matrix-Chain Multiplication",
  "0/1 Knapsack problem",
  "Counting sort",
  "Huffman coding",
  "Recurrence relations",
  "Fractional Knapsack problem",
  "String Matching: The Rabin-Karp algorithm",
  "Longest Common Subsequence (LCS)",
  "Quicksort",
  "Insertion sort",
  "Merge Sort",
  "Breadth-first search (BFS) & Depth-first search (DFS)",
  "All-Pairs Shortest Paths algorithm",
  "Heapsort",
  "Dijkstra's Algorithm & Single-Source Shortest Paths",
  "Bellman-Ford Algorithm",
  "Floyd-Warshall Algorithm",
  "Minimum Spanning Trees: Kruskal's Algorithm",
  "Minimum Spanning Trees: Prim's Algorithm",
  "Dynamic Programming: Bellman Equation & Optimal Substructure",
  "Backtracking: N-Queens Problem",
  "Branch and Bound: Traveling Salesperson Problem"
];

export default function App() {
  const [activeTab, setActiveTab] = useState('register'); // 'register' | 'organiser'
  
  // Organiser State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [securityKeyInput, setSecurityKeyInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Groups Data (Synced live with Firestore)
  const [groups, setGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [groupToDelete, setGroupToDelete] = useState(null);

  // Dynamic Team Size & Form State
  const [teamSize, setTeamSize] = useState('3');
  const [formData, setFormData] = useState({
    m1_name: '', m1_roll: '',
    m2_name: '', m2_roll: '',
    m3_name: '', m3_roll: '',
    m4_name: '', m4_roll: '',
    topic: ''
  });
  const [formStatus, setFormStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Direct Live Firestore Listener with LocalStorage Cache Fallback
  useEffect(() => {
    const q = query(collection(db, "groups"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGroups(fetched);
      localStorage.setItem('nist_daa_groups', JSON.stringify(fetched));
    }, (err) => {
      console.warn("Firestore error, loading cached data:", err);
      const local = localStorage.getItem('nist_daa_groups');
      if (local) setGroups(JSON.parse(local));
    });

    return () => unsubscribe();
  }, []);

  // Compute availability from live groups
  const registeredTopics = new Set(groups.map(g => g.topic));
  const availableTopics = ALL_TOPICS.filter(t => !registeredTopics.has(t));
  const registeredRolls = new Set(
    groups.flatMap(g => [g.m1_roll, g.m2_roll, g.m3_roll, g.m4_roll].filter(Boolean).map(r => r.trim()))
  );

  // Handle Team Size Dropdown Change
  const handleTeamSizeChange = (e) => {
    const size = e.target.value;
    setTeamSize(size);
    if (size === '3') {
      setFormData(prev => ({
        ...prev,
        m4_name: '',
        m4_roll: ''
      }));
    }
  };

  // Organiser Login
  const handleLogin = (e) => {
    e.preventDefault();
    if (securityKeyInput.trim() === 'nistcse') {
      setIsAuthenticated(true);
      setAuthError('');
      setSecurityKeyInput('');
    } else {
      setAuthError('Invalid Security Key! Please try again.');
    }
  };

  // Submit Registration Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormStatus({ type: '', message: '' });

    if (
      !formData.m1_name.trim() || !formData.m1_roll.trim() ||
      !formData.m2_name.trim() || !formData.m2_roll.trim() ||
      !formData.m3_name.trim() || !formData.m3_roll.trim() ||
      !formData.topic.trim()
    ) {
      setFormStatus({ type: 'error', message: 'Please fill in all details for Members 1, 2, 3 and select a topic.' });
      return;
    }

    if (teamSize === '4') {
      if (!formData.m4_name.trim() || !formData.m4_roll.trim()) {
        setFormStatus({ type: 'error', message: 'Please enter Member 4 details.' });
        return;
      }
    }

    const currentRolls = [
      formData.m1_roll.trim(),
      formData.m2_roll.trim(),
      formData.m3_roll.trim()
    ];
    if (teamSize === '4') {
      currentRolls.push(formData.m4_roll.trim());
    }

    // Check intra-team duplicates
    if (new Set(currentRolls).size !== currentRolls.length) {
      setFormStatus({ type: 'error', message: 'Duplicate roll numbers detected inside the group.' });
      return;
    }

    // Check duplicate registrations against database
    for (const roll of currentRolls) {
      if (registeredRolls.has(roll)) {
        setFormStatus({ type: 'error', message: `Roll number ${roll} is already registered in another group.` });
        return;
      }
    }

    if (registeredTopics.has(formData.topic)) {
      setFormStatus({ type: 'error', message: 'This topic has just been selected by another group. Choose another topic.' });
      return;
    }

    setIsSubmitting(true);
    const newGroup = {
      teamSize: Number(teamSize),
      m1_name: formData.m1_name.trim(),
      m1_roll: formData.m1_roll.trim(),
      m2_name: formData.m2_name.trim(),
      m2_roll: formData.m2_roll.trim(),
      m3_name: formData.m3_name.trim(),
      m3_roll: formData.m3_roll.trim(),
      m4_name: teamSize === '4' ? formData.m4_name.trim() : '',
      m4_roll: teamSize === '4' ? formData.m4_roll.trim() : '',
      topic: formData.topic.trim(),
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, "groups"), newGroup);
      setFormStatus({ type: 'success', message: 'Team registered successfully! Topic locked.' });
      setFormData({
        m1_name: '', m1_roll: '',
        m2_name: '', m2_roll: '',
        m3_name: '', m3_roll: '',
        m4_name: '', m4_roll: '',
        topic: ''
      });
      setTeamSize('3');
    } catch (err) {
      console.error("Firestore write failed:", err);
      setFormStatus({ type: 'error', message: 'Failed to save to database. Please check your internet connection.' });
    }
    setIsSubmitting(false);
  };

  // Delete Group
  const confirmDeleteGroup = async () => {
    if (!groupToDelete) return;
    try {
      await deleteDoc(doc(db, "groups", groupToDelete.id));
    } catch (err) {
      console.error("Delete failed:", err);
    }
    setGroupToDelete(null);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ["Group No", "Team Size", "Member 1 Name", "Member 1 Roll", "Member 2 Name", "Member 2 Roll", "Member 3 Name", "Member 3 Roll", "Member 4 Name", "Member 4 Roll", "Topic"];
    const rows = groups.map((g, idx) => [
      `Group ${idx + 1}`,
      g.teamSize || (g.m4_name ? 4 : 3),
      `"${g.m1_name}"`, g.m1_roll,
      `"${g.m2_name}"`, g.m2_roll,
      `"${g.m3_name}"`, g.m3_roll,
      `"${g.m4_name || ''}"`, g.m4_roll || '',
      `"${g.topic}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "DAA_Registered_Groups.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter groups
  const filteredGroups = groups.filter(g => {
    const term = searchTerm.toLowerCase();
    return (
      g.topic?.toLowerCase().includes(term) ||
      g.m1_name?.toLowerCase().includes(term) || g.m1_roll?.includes(term) ||
      g.m2_name?.toLowerCase().includes(term) || g.m2_roll?.includes(term) ||
      g.m3_name?.toLowerCase().includes(term) || g.m3_roll?.includes(term) ||
      (g.m4_name && g.m4_name.toLowerCase().includes(term)) ||
      (g.m4_roll && g.m4_roll.includes(term))
    );
  });

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans">
      {/* ---------------- INSTITUTIONAL HEADER (FOR PDF / PRINT) ---------------- */}
      <div className="hidden print:block text-center pb-4 mb-4 border-b border-slate-300">
        <h1 className="text-xl font-bold text-blue-900 tracking-wide uppercase">NIST UNIVERSITY</h1>
        <p className="text-sm font-semibold text-slate-800">Department of Computer Science & Engineering</p>
        <p className="text-xs text-slate-600">3rd Semester, CSE - A</p>
        <h2 className="text-sm font-bold text-slate-900 mt-2 uppercase tracking-wider">DAA Presentation Group Details</h2>
      </div>

      {/* ---------------- NAVIGATION BAR ---------------- */}
      <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-700 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              DAA
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">NIST University</h1>
              <p className="text-xs text-slate-500 font-medium">CSE - Section A | 3rd Semester</p>
            </div>
          </div>

          <nav className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('register')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'register' 
                  ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <UserPlus className="w-4 h-4" /> Register Team
            </button>
            <button
              onClick={() => setActiveTab('organiser')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'organiser' 
                  ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-4 h-4" /> Organiser Portal
            </button>
          </nav>
        </div>
      </header>

      {/* ---------------- MAIN CONTAINER ---------------- */}
      <main className="max-w-6xl mx-auto p-4 sm:p-6 print:p-0">
        
        {/* ================= REGISTER VIEW ================= */}
        {activeTab === 'register' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 sm:p-7">
              <div className="border-b border-slate-100 pb-4 mb-5">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-700" /> DAA Presentation Team Registration
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Choose your team size (3 or 4), fill in the member details, and select an available presentation topic.
                </p>
              </div>

              {formStatus.message && (
                <div className={`p-3 rounded-lg mb-4 text-xs font-medium flex items-center gap-2 ${
                  formStatus.type === 'error' 
                    ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}>
                  {formStatus.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                  <span>{formStatus.message}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Team Size Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Team Size <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={teamSize}
                    onChange={handleTeamSizeChange}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 outline-none bg-white"
                  >
                    <option value="3">3 Members</option>
                    <option value="4">4 Members</option>
                  </select>
                </div>

                {/* MEMBER 1 */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <span className="text-xs font-bold text-blue-700">MEMBER 1</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Full Name"
                      value={formData.m1_name}
                      onChange={(e) => setFormData({ ...formData, m1_name: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 outline-none bg-white"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Roll Number"
                      value={formData.m1_roll}
                      onChange={(e) => setFormData({ ...formData, m1_roll: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 outline-none bg-white font-mono"
                    />
                  </div>
                </div>

                {/* MEMBER 2 */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <span className="text-xs font-bold text-blue-700">MEMBER 2</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Full Name"
                      value={formData.m2_name}
                      onChange={(e) => setFormData({ ...formData, m2_name: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 outline-none bg-white"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Roll Number"
                      value={formData.m2_roll}
                      onChange={(e) => setFormData({ ...formData, m2_roll: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 outline-none bg-white font-mono"
                    />
                  </div>
                </div>

                {/* MEMBER 3 */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <span className="text-xs font-bold text-blue-700">MEMBER 3</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Full Name"
                      value={formData.m3_name}
                      onChange={(e) => setFormData({ ...formData, m3_name: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 outline-none bg-white"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Roll Number"
                      value={formData.m3_roll}
                      onChange={(e) => setFormData({ ...formData, m3_roll: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 outline-none bg-white font-mono"
                    />
                  </div>
                </div>

                {/* MEMBER 4 (Rendered only when teamSize === '4') */}
                {teamSize === '4' && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                    <span className="text-xs font-bold text-blue-700">MEMBER 4</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        required={teamSize === '4'}
                        placeholder="Full Name"
                        value={formData.m4_name}
                        onChange={(e) => setFormData({ ...formData, m4_name: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 outline-none bg-white"
                      />
                      <input
                        type="text"
                        required={teamSize === '4'}
                        placeholder="Roll Number"
                        value={formData.m4_roll}
                        onChange={(e) => setFormData({ ...formData, m4_roll: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 outline-none bg-white font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* TOPIC SELECTION */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Presentation Topic <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 outline-none"
                  >
                    <option value="">-- Choose an Available Topic ({availableTopics.length} remaining) --</option>
                    {availableTopics.map(topic => (
                      <option key={topic} value={topic}>{topic}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded shadow-sm text-xs sm:text-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering...' : 'Submit Group Registration'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ================= ORGANISER VIEW ================= */}
        {activeTab === 'organiser' && (
          <div>
            {!isAuthenticated ? (
              <div className="max-w-md mx-auto bg-white rounded-xl border border-slate-200 p-6 sm:p-8 text-center shadow-sm">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mx-auto mb-4">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">Organiser Access</h3>
                <p className="text-xs text-slate-500 mb-4">Enter administrative key to manage groups and print reports.</p>
                <form onSubmit={handleLogin} className="space-y-3">
                  <input
                    type="password"
                    placeholder="Enter Security Key..."
                    value={securityKeyInput}
                    onChange={(e) => setSecurityKeyInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 outline-none"
                  />
                  {authError && <p className="text-[11px] text-rose-600 font-semibold">{authError}</p>}
                  <button
                    type="submit"
                    className="w-full py-2 px-4 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded text-xs transition cursor-pointer"
                  >
                    Authenticate
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-4">
                {/* TOOLBAR */}
                <div className="no-print flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search name, roll, or topic..."
                      className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportCSV}
                      className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Export CSV
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print / Save PDF
                    </button>
                    <button
                      onClick={() => setIsAuthenticated(false)}
                      className="px-3 py-1.5 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 rounded flex items-center gap-1 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Logout
                    </button>
                  </div>
                </div>

                {/* 4-COLUMN ORGANISER TABLE VIEW */}
                <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="py-2.5 px-3 w-20 text-center">Group No.</th>
                        <th className="py-2.5 px-3 min-w-[170px]">Students Name</th>
                        <th className="py-2.5 px-3 min-w-[120px]">Roll Numbers</th>
                        <th className="py-2.5 px-3 min-w-[210px]">Topic Name</th>
                        <th className="py-2.5 px-2 w-12 text-center no-print">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredGroups.map((g, idx) => (
                        <tr key={g.id} className="hover:bg-slate-50">
                          {/* Col 1: Group No */}
                          <td className="py-2.5 px-3 text-center font-bold text-blue-700 whitespace-nowrap">
                            Group {idx + 1}
                          </td>

                          {/* Col 2: Student Names */}
                          <td className="py-2.5 px-3 text-slate-800 font-medium">
                            <div className="space-y-0.5">
                              <div>1. {g.m1_name}</div>
                              <div>2. {g.m2_name}</div>
                              <div>3. {g.m3_name}</div>
                              {g.m4_name && <div>4. {g.m4_name}</div>}
                            </div>
                          </td>

                          {/* Col 3: Roll Numbers */}
                          <td className="py-2.5 px-3 text-slate-600 font-mono">
                            <div className="space-y-0.5">
                              <div>{g.m1_roll}</div>
                              <div>{g.m2_roll}</div>
                              <div>{g.m3_roll}</div>
                              {g.m4_roll && <div>{g.m4_roll}</div>}
                            </div>
                          </td>

                          {/* Col 4: Topic Name */}
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            {g.topic}
                          </td>

                          {/* Delete Action Button */}
                          <td className="py-2.5 px-2 text-center no-print">
                            <button
                              onClick={() => setGroupToDelete(g)}
                              className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                              title="Delete Group"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* ---------------- DELETE MODAL ---------------- */}
      {groupToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg p-5 max-w-sm w-full shadow-lg border border-slate-200">
            <h4 className="text-sm font-bold text-slate-900 mb-2">Confirm Delete</h4>
            <p className="text-xs text-slate-600 mb-4">
              Delete registration for <strong>{groupToDelete.topic}</strong>? This frees the topic for other teams.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setGroupToDelete(null)}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 rounded text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteGroup}
                className="px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 rounded text-white cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}