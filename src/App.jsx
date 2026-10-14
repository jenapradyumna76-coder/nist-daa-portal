import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import {
  Search,
  Download,
  Printer,
  Trash2,
  Lock,
  Unlock,
  Plus,
  Edit2,
  CheckCircle,
  AlertCircle,
  LogOut
} from 'lucide-react';

// Live Firebase Configuration for nist-daa-project
const firebaseConfig = {
  apiKey: "AIzaSyAl4V0az5s3WqXEtGmsxqjwUveh84XdM2Q",
  authDomain: "nist-daa-project.firebaseapp.com",
  projectId: "nist-daa-project",
  storageBucket: "nist-daa-project.firebasestorage.app",
  messagingSenderId: "1083024626418",
  appId: "1:1083024626418:web:f3e53b3f0c07802ac3f66b",
  measurementId: "G-5SBKBK2N8T"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

const DEFAULT_SYLLABUS = [
  // Module-I
  { id: 'm1_1', module: 'Module-I', title: 'Introduction to problems and algorithms' },
  { id: 'm1_2', module: 'Module-I', title: 'Mathematics for algorithm analysis' },
  { id: 'm1_3', module: 'Module-I', title: 'Insertion sort & Analysing algorithms' },
  { id: 'm1_4', module: 'Module-I', title: 'Designing of algorithms' },
  { id: 'm1_5', module: 'Module-I', title: 'Asymptotic notation, Standard notations and common functions' },
  { id: 'm1_6', module: 'Module-I', title: 'Recurrence relations' },
  { id: 'm1_7', module: 'Module-I', title: 'The substitution method' },
  { id: 'm1_8', module: 'Module-I', title: 'The recursion-tree method' },
  { id: 'm1_9', module: 'Module-I', title: 'The master method' },
  { id: 'm1_10', module: 'Module-I', title: 'Divide and conquer: Min-Max Heap' },
  { id: 'm1_11', module: 'Module-I', title: 'Heapsort' },
  { id: 'm1_12', module: 'Module-I', title: 'Quicksort' },
  { id: 'm1_13', module: 'Module-I', title: 'Merge Sort' },
  { id: 'm1_14', module: 'Module-I', title: 'Sorting in Linear Time: Lower bounds for sorting & Counting sort' },

  // Module-II
  { id: 'm2_1', module: 'Module-II', title: 'Greedy method: Elements of the greedy strategy' },
  { id: 'm2_2', module: 'Module-II', title: 'Huffman codes' },
  { id: 'm2_3', module: 'Module-II', title: 'Fractional Knapsack problem' },
  { id: 'm2_4', module: 'Module-II', title: 'Dynamic programming: Assembly-line Scheduling' },
  { id: 'm2_5', module: 'Module-II', title: 'Matrix-Chain Multiplication' },
  { id: 'm2_6', module: 'Module-II', title: 'Longest Common Subsequence (LCS)' },
  { id: 'm2_7', module: 'Module-II', title: '0/1 Knapsack problem' },

  // Module-III
  { id: 'm3_1', module: 'Module-III', title: 'Graph algorithms: Basic Definitions and Application' },
  { id: 'm3_2', module: 'Module-III', title: 'Representations of graphs' },
  { id: 'm3_3', module: 'Module-III', title: 'Breadth-first search (BFS) & Depth-first search (DFS)' },
  { id: 'm3_4', module: 'Module-III', title: 'Data Structures for Disjoint Sets' },
  { id: 'm3_5', module: 'Module-III', title: 'Strongly connected components' },
  { id: 'm3_6', module: 'Module-III', title: "Minimum Spanning Trees: Kruskal's algorithm" },
  { id: 'm3_7', module: 'Module-III', title: "Minimum Spanning Trees: Prim's algorithm" },
  { id: 'm3_8', module: 'Module-III', title: 'Single-Source Shortest Paths: The Bellman-Ford algorithm' },
  { id: 'm3_9', module: 'Module-III', title: "Single-Source Shortest Paths: Dijkstra's algorithm" },
  { id: 'm3_10', module: 'Module-III', title: 'All-Pairs Shortest Paths algorithm' },

  // Module-IV
  { id: 'm4_1', module: 'Module-IV', title: 'String Matching: The naive string-matching algorithm' },
  { id: 'm4_2', module: 'Module-IV', title: 'String Matching: The Rabin-Karp algorithm' },
  { id: 'm4_3', module: 'Module-IV', title: 'String Matching: The Knuth-Morris-Pratt algorithm' },
  { id: 'm4_4', module: 'Module-IV', title: 'Network Flow: Flow networks & Ford-Fulkerson method' },
  { id: 'm4_5', module: 'Module-IV', title: 'Backtracking: n-Queen problem' },
  { id: 'm4_6', module: 'Module-IV', title: 'Backtracking: Hamiltonian Circuit Problem' },
  { id: 'm4_7', module: 'Module-IV', title: 'Backtracking: Subset Sum Problem' },
  { id: 'm4_8', module: 'Module-IV', title: 'NP-Completeness: Classes P and NP, NP-complete problems' }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('register');
  const [isOrganiserAuth, setIsOrganiserAuth] = useState(false);
  const [securityKeyInput, setSecurityKeyInput] = useState('');
  const [authError, setAuthError] = useState('');

  const [isAcceptingResponses, setIsAcceptingResponses] = useState(true);
  const [groups, setGroups] = useState([]);
  const [topics, setTopics] = useState(DEFAULT_SYLLABUS);
  const [organiserSubTab, setOrganiserSubTab] = useState('groups');

  const [formData, setFormData] = useState({
    m1_name: '',
    m1_roll: '',
    m2_name: '',
    m2_roll: '',
    m3_name: '',
    m3_roll: '',
    topic: ''
  });

  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [groupToDelete, setGroupToDelete] = useState(null);

  const [newTopic, setNewTopic] = useState({ module: 'Module-I', title: '' });
  const [editingTopic, setEditingTopic] = useState(null);
  const [topicToDelete, setTopicToDelete] = useState(null);

  // Real-time Firestore sync
  useEffect(() => {
    const unsubSettings = onSnapshot(
      doc(db, 'portal_settings', 'status'),
      (snap) => {
        if (snap.exists()) {
          setIsAcceptingResponses(snap.data().isAccepting ?? true);
        }
      },
      (err) => console.error('Settings listener error:', err)
    );

    const groupsQuery = query(collection(db, 'daa_groups'), orderBy('createdAt', 'desc'));
    const unsubGroups = onSnapshot(
      groupsQuery,
      (snapshot) => {
        const list = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        setGroups(list);
      },
      (err) => console.error('Groups listener error:', err)
    );

    const unsubTopics = onSnapshot(
      collection(db, 'daa_topics'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() });
          });
          setTopics(list);
        } else {
          setTopics(DEFAULT_SYLLABUS);
        }
      },
      (err) => console.error('Topics listener error:', err)
    );

    return () => {
      unsubSettings();
      unsubGroups();
      unsubTopics();
    };
  }, []);

  const claimedTopicTitles = groups.map((g) => g.topic?.trim().toLowerCase());
  const availableTopics = topics.filter(
    (t) => !claimedTopicTitles.includes(t.title?.trim().toLowerCase())
  );

  const modules = ['Module-I', 'Module-II', 'Module-III', 'Module-IV'];

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    if (securityKeyInput === 'nistcse') {
      setIsOrganiserAuth(true);
      setAuthError('');
      setSecurityKeyInput('');
    } else {
      setAuthError('Invalid Security Key.');
    }
  };

  const handleToggleResponses = async () => {
    try {
      const newStatus = !isAcceptingResponses;
      await setDoc(doc(db, 'portal_settings', 'status'), { isAccepting: newStatus }, { merge: true });
    } catch (err) {
      alert('Failed to update response state: ' + err.message);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setSubmitError('');
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!isAcceptingResponses) {
      setSubmitError('Registration is currently closed by the organiser.');
      return;
    }

    const { m1_name, m1_roll, m2_name, m2_roll, m3_name, m3_roll, topic } = formData;

    if (
      !m1_name.trim() || !m1_roll.trim() ||
      !m2_name.trim() || !m2_roll.trim() ||
      !topic.trim()
    ) {
      setSubmitError('Please fill in Member 1, Member 2, and select a presentation topic.');
      return;
    }

    const hasM3Name = Boolean(m3_name.trim());
    const hasM3Roll = Boolean(m3_roll.trim());
    if (hasM3Name !== hasM3Roll) {
      setSubmitError('Please fill in both name and roll number for Member 3, or leave both empty.');
      return;
    }

    const rolls = [m1_roll.trim().toUpperCase(), m2_roll.trim().toUpperCase()];
    if (hasM3Roll) {
      rolls.push(m3_roll.trim().toUpperCase());
    }
    if (new Set(rolls).size !== rolls.length) {
      setSubmitError('Duplicate roll numbers detected within your group.');
      return;
    }

    const names = [m1_name.trim().toLowerCase(), m2_name.trim().toLowerCase()];
    if (hasM3Name) {
      names.push(m3_name.trim().toLowerCase());
    }
    if (new Set(names).size !== names.length) {
      setSubmitError('Duplicate member names detected within your group.');
      return;
    }

    const registeredRolls = new Set();
    const registeredNames = new Set();
    const registeredTopics = new Set();

    groups.forEach((g) => {
      [g.m1_roll, g.m2_roll, g.m3_roll].forEach((r) => r && registeredRolls.add(r.trim().toUpperCase()));
      [g.m1_name, g.m2_name, g.m3_name].forEach((n) => n && registeredNames.add(n.trim().toLowerCase()));
      if (g.topic) registeredTopics.add(g.topic.trim().toLowerCase());
    });

    for (let r of rolls) {
      if (registeredRolls.has(r)) {
        setSubmitError(`Roll Number "${r}" is already registered in another group.`);
        return;
      }
    }

    for (let n of names) {
      if (registeredNames.has(n)) {
        setSubmitError(`Student Name "${n}" is already registered in another group.`);
        return;
      }
    }

    if (registeredTopics.has(topic.trim().toLowerCase())) {
      setSubmitError('This topic has already been claimed by another group. Please choose another.');
      return;
    }

    setIsSubmitting(true);
    try {
      const docId = `group_${Date.now()}`;
      await setDoc(doc(db, 'daa_groups', docId), {
        m1_name: m1_name.trim(),
        m1_roll: m1_roll.trim().toUpperCase(),
        m2_name: m2_name.trim(),
        m2_roll: m2_roll.trim().toUpperCase(),
        m3_name: m3_name.trim() || '',
        m3_roll: m3_roll.trim().toUpperCase() || '',
        topic: topic.trim(),
        section: 'CSE - Section A',
        semester: '3rd Semester',
        createdAt: new Date().toISOString()
      });

      setSubmitSuccess(true);
      setFormData({
        m1_name: '',
        m1_roll: '',
        m2_name: '',
        m2_roll: '',
        m3_name: '',
        m3_roll: '',
        topic: ''
      });
    } catch (err) {
      setSubmitError('Submission failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteGroup = async () => {
    if (!groupToDelete) return;
    try {
      await deleteDoc(doc(db, 'daa_groups', groupToDelete.id));
      setGroupToDelete(null);
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handleAddTopic = async (e) => {
    e.preventDefault();
    if (!newTopic.title.trim()) return;
    try {
      const docId = `topic_${Date.now()}`;
      await setDoc(doc(db, 'daa_topics', docId), {
        title: newTopic.title.trim(),
        module: newTopic.module
      });
      setNewTopic({ module: 'Module-I', title: '' });
    } catch (err) {
      alert('Failed to add topic: ' + err.message);
    }
  };

  const handleUpdateTopic = async (e) => {
    e.preventDefault();
    if (!editingTopic || !editingTopic.title.trim()) return;
    try {
      await setDoc(
        doc(db, 'daa_topics', editingTopic.id),
        { title: editingTopic.title.trim(), module: editingTopic.module },
        { merge: true }
      );
      setEditingTopic(null);
    } catch (err) {
      alert('Failed to update topic: ' + err.message);
    }
  };

  const confirmDeleteTopic = async () => {
    if (!topicToDelete) return;
    try {
      await deleteDoc(doc(db, 'daa_topics', topicToDelete.id));
      setTopicToDelete(null);
    } catch (err) {
      alert('Failed to delete topic: ' + err.message);
    }
  };

  const handleExportCSV = () => {
    if (groups.length === 0) {
      alert('No groups registered yet.');
      return;
    }
    const headers = ['Group', 'Member 1 Name', 'Member 1 Roll', 'Member 2 Name', 'Member 2 Roll', 'Member 3 Name', 'Member 3 Roll', 'Topic', 'Section', 'Semester', 'Submission Time'];
    const rows = groups.map((g, idx) => [
      `Group ${idx + 1}`,
      `"${g.m1_name || ''}"`,
      `"${g.m1_roll || ''}"`,
      `"${g.m2_name || ''}"`,
      `"${g.m2_roll || ''}"`,
      `"${g.m3_name || ''}"`,
      `"${g.m3_roll || ''}"`,
      `"${(g.topic || '').replace(/"/g, '""')}"`,
      `"CSE - Section A"`,
      `"3rd Semester"`,
      `"${g.createdAt ? new Date(g.createdAt).toLocaleString() : ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DAA_Groups_SectionA_3rdSem_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredGroups = groups.filter((g) => {
    const s = searchTerm.toLowerCase();
    return (
      g.m1_name?.toLowerCase().includes(s) ||
      g.m1_roll?.toLowerCase().includes(s) ||
      g.m2_name?.toLowerCase().includes(s) ||
      g.m2_roll?.toLowerCase().includes(s) ||
      g.m3_name?.toLowerCase().includes(s) ||
      g.m3_roll?.toLowerCase().includes(s) ||
      g.topic?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Header Banner */}
      <header className="bg-white border-b border-slate-200 py-4 sm:py-6 px-3 sm:px-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center text-center">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <span className="text-2xl sm:text-3xl md:text-4xl font-serif font-black tracking-tight text-[#002FA7]">
              NIST
            </span>
            <span className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold tracking-widest text-slate-900">
              UNIVERSITY
            </span>
          </div>
          <p className="mt-1 sm:mt-2 text-xs sm:text-sm md:text-base font-medium text-slate-600 leading-snug px-2">
            Department of Computer Science & Engineering • CSE - Section A • 3rd Semester
          </p>
        </div>
      </header>

      {/* Navigation Bar */}
      <nav className="no-print bg-slate-100 border-b border-slate-200">
        <div className="max-w-4xl mx-auto flex items-center justify-center sm:justify-start px-2 sm:px-4">
          <div className="flex w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 sm:flex-initial py-2.5 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 text-center transition-colors cursor-pointer ${
                activeTab === 'register'
                  ? 'border-blue-600 text-blue-600 bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Student Registration
            </button>
            <button
              onClick={() => setActiveTab('organiser')}
              className={`flex-1 sm:flex-initial py-2.5 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 text-center transition-colors cursor-pointer ${
                activeTab === 'organiser'
                  ? 'border-blue-600 text-blue-600 bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Organiser Portal
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-3 sm:p-4 md:p-6">
        {/* STUDENT REGISTRATION TAB */}
        {activeTab === 'register' && (
          <div className="max-w-2xl mx-auto">
            {!isAcceptingResponses ? (
              <div className="bg-amber-50 border border-amber-300 rounded-lg p-5 sm:p-6 text-center text-amber-800 my-4 sm:my-8">
                <AlertCircle className="w-9 h-9 sm:w-10 sm:h-10 mx-auto mb-2 text-amber-600" />
                <h3 className="text-base sm:text-lg font-bold">Registration Closed</h3>
                <p className="text-xs sm:text-sm mt-1">
                  Registration is currently closed by the organiser. Submissions are not being accepted at this time.
                </p>
              </div>
            ) : submitSuccess ? (
              <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-6 sm:p-8 text-center text-emerald-900 my-4 sm:my-8">
                <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-emerald-600" />
                <h2 className="text-lg sm:text-xl font-bold">Group Successfully Registered</h2>
                <p className="text-xs sm:text-sm text-emerald-700 mt-2">
                  Your group and presentation topic have been confirmed and locked.
                </p>
                <button
                  onClick={() => setSubmitSuccess(false)}
                  className="mt-5 sm:mt-6 w-full sm:w-auto px-4 py-2.5 bg-emerald-600 text-white rounded-md text-xs sm:text-sm font-medium hover:bg-emerald-700 transition cursor-pointer"
                >
                  Register Another Group
                </button>
              </div>
            ) : (
              <form onSubmit={handleStudentSubmit} className="space-y-4 sm:space-y-6">
                <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-sm">
                  <h2 className="text-base sm:text-lg font-bold text-slate-800 mb-3 sm:mb-4 border-b pb-2">
                    DAA Presentation Group Registration
                  </h2>

                  {submitError && (
                    <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded text-xs sm:text-sm flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  {/* Member 1 */}
                  <div className="mb-4 sm:mb-5 bg-slate-50 p-3 sm:p-4 rounded-md border border-slate-200">
                    <h3 className="text-xs sm:text-sm font-bold text-blue-900 mb-2 sm:mb-3">MEMBER 1</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                      <div>
                        <label className="block text-[11px] sm:text-xs font-semibold text-slate-600 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          name="m1_name"
                          value={formData.m1_name}
                          onChange={handleFormChange}
                          placeholder="Full Name"
                          className="w-full px-3 py-2 text-base sm:text-sm bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] sm:text-xs font-semibold text-slate-600 mb-1">
                          Roll Number *
                        </label>
                        <input
                          type="text"
                          name="m1_roll"
                          value={formData.m1_roll}
                          onChange={handleFormChange}
                          placeholder="Roll Number"
                          className="w-full px-3 py-2 text-base sm:text-sm bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 outline-none"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Member 2 */}
                  <div className="mb-4 sm:mb-5 bg-slate-50 p-3 sm:p-4 rounded-md border border-slate-200">
                    <h3 className="text-xs sm:text-sm font-bold text-blue-900 mb-2 sm:mb-3">MEMBER 2</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                      <div>
                        <label className="block text-[11px] sm:text-xs font-semibold text-slate-600 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          name="m2_name"
                          value={formData.m2_name}
                          onChange={handleFormChange}
                          placeholder="Full Name"
                          className="w-full px-3 py-2 text-base sm:text-sm bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] sm:text-xs font-semibold text-slate-600 mb-1">
                          Roll Number *
                        </label>
                        <input
                          type="text"
                          name="m2_roll"
                          value={formData.m2_roll}
                          onChange={handleFormChange}
                          placeholder="Roll Number"
                          className="w-full px-3 py-2 text-base sm:text-sm bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 outline-none"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Member 3 */}
                  <div className="mb-4 sm:mb-5 bg-slate-50 p-3 sm:p-4 rounded-md border border-slate-200">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <h3 className="text-xs sm:text-sm font-bold text-blue-900">MEMBER 3</h3>
                      <span className="text-[10px] sm:text-xs font-semibold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded">Optional</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                      <div>
                        <label className="block text-[11px] sm:text-xs font-semibold text-slate-600 mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          name="m3_name"
                          value={formData.m3_name}
                          onChange={handleFormChange}
                          placeholder="Full Name (Optional)"
                          className="w-full px-3 py-2 text-base sm:text-sm bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] sm:text-xs font-semibold text-slate-600 mb-1">
                          Roll Number
                        </label>
                        <input
                          type="text"
                          name="m3_roll"
                          value={formData.m3_roll}
                          onChange={handleFormChange}
                          placeholder="Roll Number (Optional)"
                          className="w-full px-3 py-2 text-base sm:text-sm bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Topic Selection */}
                  <div className="mb-5 sm:mb-6">
                    <label className="block text-[11px] sm:text-xs font-bold text-slate-700 mb-1">
                      DAA Presentation Topic *
                    </label>
                    <select
                      name="topic"
                      value={formData.topic}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 text-base sm:text-sm bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 outline-none"
                      required
                    >
                      <option value="">-- Select One Presentation Topic --</option>
                      {modules.map((mod) => {
                        const modTopics = availableTopics.filter((t) => t.module === mod);
                        if (modTopics.length === 0) return null;
                        return (
                          <optgroup key={mod} label={mod}>
                            {modTopics.map((t) => (
                              <option key={t.id} value={t.title}>
                                {t.title}
                              </option>
                            ))}
                          </optgroup>
                        );
                      })}
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 sm:py-2.5 bg-blue-600 text-white rounded font-semibold sm:font-medium text-sm hover:bg-blue-700 transition cursor-pointer disabled:bg-blue-300"
                  >
                    {isSubmitting ? 'Registering...' : 'Register Group'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ORGANISER PORTAL TAB */}
        {activeTab === 'organiser' && (
          <div>
            {!isOrganiserAuth ? (
              <div className="max-w-sm mx-auto bg-white border border-slate-200 rounded-lg p-5 sm:p-6 shadow-sm my-4 sm:my-8">
                <div className="text-center mb-4">
                  <h3 className="text-sm sm:text-base font-bold text-slate-800">Organiser Portal</h3>
                  <p className="text-xs text-slate-500 mt-1">Please enter your Security Key to continue.</p>
                </div>
                {authError && (
                  <div className="mb-3 p-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded text-center">
                    {authError}
                  </div>
                )}
                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  <div>
                    <input
                      type="password"
                      value={securityKeyInput}
                      onChange={(e) => setSecurityKeyInput(e.target.value)}
                      placeholder="Security Key"
                      className="w-full px-3 py-2 text-base sm:text-sm border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 outline-none"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 sm:py-2 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded hover:bg-blue-700 transition cursor-pointer"
                  >
                    Verify Access
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Organiser Controls Header */}
                <div className="no-print bg-white border border-slate-200 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setOrganiserSubTab('groups')}
                      className={`flex-1 sm:flex-initial text-center px-3 py-2 sm:py-1.5 text-xs font-semibold rounded cursor-pointer ${
                        organiserSubTab === 'groups' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      Registered Groups ({groups.length})
                    </button>
                    <button
                      onClick={() => setOrganiserSubTab('topics')}
                      className={`flex-1 sm:flex-initial text-center px-3 py-2 sm:py-1.5 text-xs font-semibold rounded cursor-pointer ${
                        organiserSubTab === 'topics' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      Manage Topics ({topics.length})
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleToggleResponses}
                      className={`flex-1 sm:flex-initial justify-center px-3 py-2 sm:py-1.5 text-xs font-semibold rounded flex items-center gap-1.5 cursor-pointer ${
                        isAcceptingResponses ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      {isAcceptingResponses ? (
                        <>
                          <Lock className="w-3.5 h-3.5" /> Stop Responses
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3.5 h-3.5" /> Accept Responses
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setIsOrganiserAuth(false)}
                      className="px-3 py-2 sm:py-1.5 text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Exit
                    </button>
                  </div>
                </div>

                {/* SubTab 1: Groups */}
                {organiserSubTab === 'groups' && (
                  <div className="space-y-4">
                    <div className="no-print flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 bg-white p-3 rounded-lg border border-slate-200">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 sm:top-2.5" />
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Search roll, name, or topic..."
                          className="w-full pl-9 pr-3 py-2 sm:py-1.5 text-base sm:text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-600 outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleExportCSV}
                          className="flex-1 sm:flex-initial justify-center px-3 py-2 sm:py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" /> Export CSV
                        </button>
                        <button
                          onClick={() => window.print()}
                          className="flex-1 sm:flex-initial justify-center px-3 py-2 sm:py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded flex items-center gap-1 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" /> Print
                        </button>
                      </div>
                    </div>

                    {filteredGroups.length === 0 ? (
                      <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 text-center text-slate-500 text-xs sm:text-sm">
                        No groups registered yet.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredGroups.map((g, idx) => (
                          <div key={g.id} className="bg-white border border-slate-200 rounded-lg p-3.5 sm:p-4 shadow-sm">
                            <div className="flex items-center justify-between border-b pb-2 mb-3">
                              <span className="text-xs font-bold text-blue-700">Group {idx + 1}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] sm:text-xs text-slate-500">
                                  {g.createdAt ? new Date(g.createdAt).toLocaleDateString() : ''}
                                </span>
                                <button
                                  onClick={() => setGroupToDelete(g)}
                                  className="no-print text-rose-600 hover:text-rose-800 p-1.5 sm:p-1 cursor-pointer"
                                  title="Delete Group"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3 mb-3 text-xs">
                              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                                <div className="text-slate-400 font-semibold mb-1 text-[11px]">MEMBER 1</div>
                                <div className="font-bold text-slate-800">{g.m1_name}</div>
                                <div className="text-slate-600">{g.m1_roll}</div>
                              </div>
                              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                                <div className="text-slate-400 font-semibold mb-1 text-[11px]">MEMBER 2</div>
                                <div className="font-bold text-slate-800">{g.m2_name}</div>
                                <div className="text-slate-600">{g.m2_roll}</div>
                              </div>
                              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                                <div className="text-slate-400 font-semibold mb-1 text-[11px]">MEMBER 3</div>
                                <div className="font-bold text-slate-800">{g.m3_name || '—'}</div>
                                <div className="text-slate-600">{g.m3_roll || 'N/A'}</div>
                              </div>
                            </div>

                            <div className="bg-blue-50/60 p-2.5 rounded border border-blue-100 text-xs break-words">
                              <span className="font-semibold text-blue-900">Topic: </span>
                              <span className="text-blue-950 font-medium">{g.topic}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* SubTab 2: Topics Management */}
                {organiserSubTab === 'topics' && (
                  <div className="space-y-4">
                    {/* Add Topic Form */}
                    <form onSubmit={handleAddTopic} className="bg-white border border-slate-200 rounded-lg p-3.5 sm:p-4 shadow-sm">
                      <h4 className="text-[11px] sm:text-xs font-bold text-slate-700 mb-2.5 sm:mb-3 uppercase tracking-wider">
                        Add New DAA Topic
                      </h4>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <select
                          value={newTopic.module}
                          onChange={(e) => setNewTopic({ ...newTopic, module: e.target.value })}
                          className="px-3 py-2 sm:py-1.5 text-base sm:text-xs border border-slate-300 rounded outline-none"
                        >
                          {modules.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={newTopic.title}
                          onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
                          placeholder="Topic title..."
                          className="flex-1 px-3 py-2 sm:py-1.5 text-base sm:text-xs border border-slate-300 rounded outline-none"
                          required
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 sm:py-1.5 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700 transition cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Topic
                        </button>
                      </div>
                    </form>

                    {/* Topics List */}
                    <div className="bg-white border border-slate-200 rounded-lg p-3.5 sm:p-4 shadow-sm space-y-3 sm:space-y-4">
                      {modules.map((mod) => {
                        const modTopics = topics.filter((t) => t.module === mod);
                        return (
                          <div key={mod} className="border border-slate-200 rounded-md overflow-hidden">
                            <div className="bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 border-b border-slate-200 flex justify-between items-center">
                              <span>{mod}</span>
                              <span className="text-slate-500 font-normal">{modTopics.length} topics</span>
                            </div>
                            <div className="divide-y divide-slate-100">
                              {modTopics.map((t) => {
                                const isClaimed = claimedTopicTitles.includes(t.title?.trim().toLowerCase());
                                return (
                                  <div key={t.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50 gap-2">
                                    <div className="flex-1 pr-2 break-words">
                                      <div className="font-medium text-slate-800">{t.title}</div>
                                      {isClaimed && (
                                        <span className="inline-block mt-0.5 text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-semibold">
                                          Taken
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        onClick={() => setEditingTopic(t)}
                                        className="p-1.5 sm:p-1 text-slate-500 hover:text-blue-600 cursor-pointer"
                                        title="Edit"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => setTopicToDelete(t)}
                                        className="p-1.5 sm:p-1 text-slate-500 hover:text-rose-600 cursor-pointer"
                                        title="Delete"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Delete Group Modal */}
      {groupToDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-lg p-4 sm:p-5 max-w-sm w-full border border-slate-300 shadow-lg text-xs">
            <h4 className="text-sm font-bold text-slate-800 mb-2">Delete Group Registration?</h4>
            <p className="text-slate-600 mb-4 break-words">
              This will free up the topic: <strong className="text-slate-800">{groupToDelete.topic}</strong> and allow other students to choose it.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setGroupToDelete(null)}
                className="px-3 py-2 sm:py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteGroup}
                className="px-3 py-2 sm:py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-semibold cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Topic Modal */}
      {editingTopic && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-3 sm:p-4 z-50">
          <form onSubmit={handleUpdateTopic} className="bg-white rounded-lg p-4 sm:p-5 max-w-sm w-full border border-slate-300 shadow-lg text-xs space-y-3">
            <h4 className="text-sm font-bold text-slate-800 mb-1">Edit Topic</h4>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Module</label>
              <select
                value={editingTopic.module}
                onChange={(e) => setEditingTopic({ ...editingTopic, module: e.target.value })}
                className="w-full px-2.5 py-2 sm:py-1.5 text-base sm:text-xs border border-slate-300 rounded outline-none"
              >
                {modules.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Topic Title</label>
              <input
                type="text"
                value={editingTopic.title}
                onChange={(e) => setEditingTopic({ ...editingTopic, title: e.target.value })}
                className="w-full px-2.5 py-2 sm:py-1.5 text-base sm:text-xs border border-slate-300 rounded outline-none"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingTopic(null)}
                className="px-3 py-2 sm:py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-2 sm:py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold cursor-pointer"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Topic Modal */}
      {topicToDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-lg p-4 sm:p-5 max-w-sm w-full border border-slate-300 shadow-lg text-xs">
            <h4 className="text-sm font-bold text-slate-800 mb-2">Delete Topic?</h4>
            <p className="text-slate-600 mb-4 break-words">
              Are you sure you want to remove <strong className="text-slate-800">{topicToDelete.title}</strong> from the syllabus list?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setTopicToDelete(null)}
                className="px-3 py-2 sm:py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteTopic}
                className="px-3 py-2 sm:py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-semibold cursor-pointer"
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