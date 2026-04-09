import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Camera, 
  Upload, 
  BookOpen, 
  Languages, 
  Briefcase, 
  Sparkles, 
  ChevronRight, 
  X,
  Loader2,
  FileText,
  History
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface StudyModule {
  id: string;
  timestamp: number;
  image: string;
  summary: string;
  translation?: string;
  industryMapping?: string;
  language?: string;
}

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [module, setModule] = useState<StudyModule | null>(null);
  const [history, setHistory] = useState<StudyModule[]>([]);
  const [activeTab, setActiveTab] = useState<'summary' | 'translation' | 'industry'>('summary');
  const [selectedLanguage, setSelectedLanguage] = useState('Twi');
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('lumina_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('lumina_history', JSON.stringify(history));
  }, [history]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        processImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async (base64Image: string) => {
    setIsProcessing(true);
    setError(null);
    try {
      const base64Data = base64Image.split(',')[1];
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Data,
              },
            },
            {
              text: "Act as an expert academic tutor. Extract all text and key concepts from this whiteboard photo or lecture note. Generate a structured Markdown summary including: 1. A clear title, 2. Core concepts explained simply, 3. Key formulas or diagrams described, 4. A 'Quick Takeaway' section. Focus on clarity and educational value.",
            },
          ],
        },
      });

      const summary = response.text || "Failed to generate summary.";
      
      const newModule: StudyModule = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        image: base64Image,
        summary,
      };

      setModule(newModule);
      setHistory(prev => [newModule, ...prev].slice(0, 10));
      setActiveTab('summary');
    } catch (err) {
      console.error(err);
      setError("Failed to process image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTranslate = async () => {
    if (!module || isProcessing) return;
    setIsProcessing(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Based on this academic summary: "${module.summary}", explain the core concepts using analogies and terminology in the ${selectedLanguage} language. Make it sound natural and culturally relevant to a student in Ghana. Provide the explanation in both ${selectedLanguage} and English for comparison.`,
      });

      const translation = response.text || "Failed to generate translation.";
      setModule(prev => prev ? { ...prev, translation, language: selectedLanguage } : null);
      setActiveTab('translation');
    } catch (err) {
      console.error(err);
      setError("Failed to translate. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleIndustryMap = async () => {
    if (!module || isProcessing) return;
    setIsProcessing(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Based on this academic summary: "${module.summary}", map these concepts to real-world job roles and skills currently in demand in the global and local (West African) tech/business ecosystem. Answer the student's question: "Why am I learning this?" by showing specific career paths, companies that use these skills, and potential salary ranges or impact areas.`,
      });

      const industryMapping = response.text || "Failed to generate industry mapping.";
      setModule(prev => prev ? { ...prev, industryMapping } : null);
      setActiveTab('industry');
    } catch (err) {
      console.error(err);
      setError("Failed to map to industry. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setImage(null);
    setModule(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-orange-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
            <Sparkles className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight">Lumina</h1>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Whiteboard Alchemist</p>
          </div>
        </div>
        <button 
          onClick={() => {
            setHistory([]);
            localStorage.removeItem('lumina_history');
          }}
          className="p-2 hover:bg-gray-50 rounded-full transition-colors text-gray-400"
          title="Clear History"
        >
          <History className="w-5 h-5" />
        </button>
      </header>

      <main className="max-w-2xl mx-auto p-6 pb-32">
        <AnimatePresence mode="wait">
          {!image ? (
            <motion.div 
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-8 pt-12"
            >
              <div className="text-center space-y-4">
                <h2 className="text-4xl font-bold tracking-tight text-gray-900">
                  Turn lecture notes into <span className="text-orange-500">knowledge.</span>
                </h2>
                <p className="text-gray-500 text-lg max-w-md mx-auto">
                  Upload a photo of your whiteboard or handwritten notes to generate interactive study modules.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative overflow-hidden bg-white border-2 border-dashed border-gray-200 hover:border-orange-400 p-12 rounded-3xl transition-all duration-300 flex flex-col items-center justify-center gap-4"
                >
                  <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Upload className="text-orange-500 w-8 h-8" />
                  </div>
                  <div className="text-center">
                    <span className="block font-bold text-lg">Upload Photo</span>
                    <span className="text-sm text-gray-400">PNG, JPG or JPEG</span>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </button>

                <div className="flex items-center gap-4">
                  <div className="h-px bg-gray-200 flex-1" />
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Recent Sessions</span>
                  <div className="h-px bg-gray-200 flex-1" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {history.length > 0 ? history.map((h) => (
                    <button 
                      key={h.id}
                      onClick={() => {
                        setImage(h.image);
                        setModule(h);
                      }}
                      className="bg-white p-3 rounded-2xl border border-gray-100 hover:border-orange-200 transition-all flex items-center gap-3 text-left group"
                    >
                      <img src={h.image} alt="" className="w-10 h-10 rounded-lg object-cover grayscale group-hover:grayscale-0 transition-all" />
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold truncate">Session {new Date(h.timestamp).toLocaleDateString()}</p>
                        <p className="text-[10px] text-gray-400">View Module</p>
                      </div>
                    </button>
                  )) : (
                    <div className="col-span-2 py-8 text-center text-gray-400 text-sm italic">
                      No recent sessions yet.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Image Preview & Actions */}
              <div className="relative group rounded-3xl overflow-hidden shadow-2xl shadow-orange-100">
                <img src={image} alt="Uploaded note" className="w-full h-64 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <button 
                  onClick={reset}
                  className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md hover:bg-white/40 rounded-full text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-white">
                  <div>
                    <h3 className="font-bold text-lg">Lecture Analysis</h3>
                    <p className="text-xs opacity-80">Captured {new Date().toLocaleTimeString()}</p>
                  </div>
                  {isProcessing && (
                    <div className="flex items-center gap-2 bg-orange-500 px-3 py-1.5 rounded-full text-xs font-bold animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Processing...
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-sm font-medium flex items-center gap-3">
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                  {error}
                </div>
              )}

              {module && (
                <div className="space-y-6">
                  {/* Tab Navigation */}
                  <div className="flex p-1 bg-gray-100 rounded-2xl gap-1">
                    <button 
                      onClick={() => setActiveTab('summary')}
                      className={cn(
                        "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
                        activeTab === 'summary' ? "bg-white text-orange-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                      )}
                    >
                      <FileText className="w-4 h-4" />
                      Summary
                    </button>
                    <button 
                      onClick={() => setActiveTab('translation')}
                      className={cn(
                        "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
                        activeTab === 'translation' ? "bg-white text-orange-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                      )}
                    >
                      <Languages className="w-4 h-4" />
                      Localized
                    </button>
                    <button 
                      onClick={() => setActiveTab('industry')}
                      className={cn(
                        "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
                        activeTab === 'industry' ? "bg-white text-orange-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                      )}
                    >
                      <Briefcase className="w-4 h-4" />
                      Career
                    </button>
                  </div>

                  {/* Content Area */}
                  <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm min-h-[300px]">
                    <AnimatePresence mode="wait">
                      {activeTab === 'summary' && (
                        <motion.div 
                          key="summary-content"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className="prose prose-orange max-w-none"
                        >
                          <ReactMarkdown>{module.summary}</ReactMarkdown>
                        </motion.div>
                      )}

                      {activeTab === 'translation' && (
                        <motion.div 
                          key="translation-content"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className="space-y-6"
                        >
                          {!module.translation ? (
                            <div className="text-center py-12 space-y-6">
                              <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto">
                                <Languages className="text-orange-500 w-10 h-10" />
                              </div>
                              <div className="space-y-2">
                                <h4 className="font-bold text-xl">Mother Tongue Translator</h4>
                                <p className="text-gray-500 text-sm">Explain these concepts in your local language for better understanding.</p>
                              </div>
                              <div className="flex flex-wrap justify-center gap-2">
                                {['Twi', 'Fante', 'Ga', 'Ewe', 'Yoruba', 'Hausa'].map((lang) => (
                                  <button 
                                    key={lang}
                                    onClick={() => setSelectedLanguage(lang)}
                                    className={cn(
                                      "px-4 py-2 rounded-full text-sm font-bold border transition-all",
                                      selectedLanguage === lang ? "bg-orange-500 border-orange-500 text-white" : "bg-white border-gray-200 text-gray-600 hover:border-orange-300"
                                    )}
                                  >
                                    {lang}
                                  </button>
                                ))}
                              </div>
                              <button 
                                onClick={handleTranslate}
                                disabled={isProcessing}
                                className="w-full bg-[#1A1A1A] text-white py-4 rounded-2xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                              >
                                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                Generate Localized Explanation
                              </button>
                            </div>
                          ) : (
                            <div className="prose prose-orange max-w-none">
                              <div className="flex items-center gap-2 mb-6">
                                <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                  {module.language} Explanation
                                </span>
                              </div>
                              <ReactMarkdown>{module.translation}</ReactMarkdown>
                            </div>
                          )}
                        </motion.div>
                      )}

                      {activeTab === 'industry' && (
                        <motion.div 
                          key="industry-content"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className="space-y-6"
                        >
                          {!module.industryMapping ? (
                            <div className="text-center py-12 space-y-6">
                              <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto">
                                <Briefcase className="text-orange-500 w-10 h-10" />
                              </div>
                              <div className="space-y-2">
                                <h4 className="font-bold text-xl">Industry Mapper</h4>
                                <p className="text-gray-500 text-sm">See how these concepts apply to the real world and your future career.</p>
                              </div>
                              <button 
                                onClick={handleIndustryMap}
                                disabled={isProcessing}
                                className="w-full bg-[#1A1A1A] text-white py-4 rounded-2xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                              >
                                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
                                Map to Career Paths
                              </button>
                            </div>
                          ) : (
                            <div className="prose prose-orange max-w-none">
                              <div className="flex items-center gap-2 mb-6">
                                <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                  Career & Industry Insights
                                </span>
                              </div>
                              <ReactMarkdown>{module.industryMapping}</ReactMarkdown>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Floating Action Button (Only when no image) */}
      {!image && (
        <div className="fixed bottom-8 left-0 right-0 px-6 flex justify-center pointer-events-none">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="pointer-events-auto bg-orange-500 text-white p-5 rounded-full shadow-2xl shadow-orange-300 hover:scale-110 active:scale-95 transition-all group"
          >
            <Camera className="w-8 h-8" />
          </button>
        </div>
      )}
    </div>
  );
}
