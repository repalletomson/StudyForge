import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Layout, 
  Calendar, 
  Globe, 
  Database, 
  Zap, 
  CheckCircle, 
  ArrowRight,
  Code,
  Layers
} from 'lucide-react';
export default function LandingPage() {
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };
  const stagger = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-purple-600/20 selection:text-purple-400">
      {}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-600 rounded-sm flex items-center justify-center">
              <Layers className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">StudyForge</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <button className="hidden md:inline-flex px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-md transition-colors">
                Login
              </button>
            </Link>
            <Link to="/signup">
              <button className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-2 rounded-md transition-colors">
                Get Started
              </button>
            </Link>
          </div>
        </div>
      </nav>
      {}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial="initial"
              animate="animate"
              variants={stagger}
              className="space-y-8"
            >
              <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-600/30 bg-purple-600/10 text-purple-400 text-xs font-mono uppercase tracking-widest">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-600 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-600"></span>
                </span>
                System Online v2.0
              </motion.div>
              <motion.h1 variants={fadeIn} className="text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight">
                The Headless CMS <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">
                  for Education
                </span>
              </motion.h1>
              <motion.p variants={fadeIn} className="text-xl text-gray-400 max-w-xl leading-relaxed">
                Manage Programs, Terms, and Lessons with a headless CMS built for scale. 
                Schedule content, manage assets, and deliver via high-performance API.
              </motion.p>
              <motion.div variants={fadeIn} className="flex flex-wrap gap-4 pt-4">
                <Link to="/signup">
                  <button className="h-14 px-8 text-lg bg-purple-600 hover:bg-purple-700 text-white border-l-4 border-white/20 transition-colors flex items-center gap-2">
                    Start Building <ArrowRight className="w-5 h-5" />
                  </button>
                </Link>
                <button className="h-14 px-8 text-lg border border-white/20 hover:bg-white/5 hover:text-white text-gray-300 transition-colors">
                  View API Docs
                </button>
              </motion.div>
              <motion.div variants={fadeIn} className="pt-8 flex items-center gap-8 text-sm text-gray-400 font-mono">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-600" />
                  <span>MongoDB Atlas</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-600" />
                  <span>Auto-Scaling</span>
                </div>
                {}
              </motion.div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/20 to-transparent rounded-full blur-3xl opacity-20" />
              <img 
                src="/abstract_purple_network_on_black.png" 
                alt="Abstract Network" 
                className="relative z-10 w-full h-auto rounded-lg border border-white/10 shadow-2xl shadow-purple-600/20"
              />
              {}
              <div className="absolute -left-8 top-1/4 p-4 bg-black/80 backdrop-blur border border-white/10 rounded-lg shadow-xl z-20 font-mono text-xs">
                <div className="text-gray-400 mb-1">STATUS</div>
                <div className="text-green-400">● RUNNING</div>
              </div>
              <div className="absolute -right-4 bottom-1/4 p-4 bg-black/80 backdrop-blur border border-white/10 rounded-lg shadow-xl z-20 font-mono text-xs">
                <div className="text-gray-400 mb-1">API LATENCY</div>
                <div className="text-purple-400">12ms</div>
              </div>
            </motion.div>
          </div>
        </div>
        {}
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0"></div>
      </section>
      {}
      <section className="py-24 border-t border-white/10 bg-black/50">
        <div className="container mx-auto px-6">
          <div className="mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Engineered for Scale</h2>
            <p className="text-gray-400 max-w-2xl text-lg">
              A complete ecosystem for managing educational content structures.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
             
            { [
              {
                icon: <Layout className="w-8 h-8" />,
                title: "Program Management",
                desc: "Define complex hierarchies from Programs to Terms to Lessons with strict schema validation."
              },
              {
                icon: <Calendar className="w-8 h-8" />,
                title: "Smart Scheduling",
                desc: "Automated publishing workflows. Schedule content releases and let the worker handle the rest."
              },
              {
                icon: <Globe className="w-8 h-8" />,
                title: "Multi-Language",
                desc: "Native support for localization. Manage content, assets, and metadata across unlimited languages."
              },
              {
                icon: <Database className="w-8 h-8" />,
                title: "Asset Manager",
                desc: "Centralized storage for lesson thumbnails, program posters, and video content variants."
              },
              {
                icon: <Code className="w-8 h-8" />,
                title: "Public Catalog API",
                desc: "High-performance, cached API endpoints ready for your consumer-facing applications."
              },
              {
                icon: <Zap className="w-8 h-8" />,
                title: "Instant Deploy",
                desc: "Docker-ready architecture with automated migrations and seeding scripts included."
              }
            ].map((feature, i) => (
              <div key={i} className="group p-8 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-purple-600/50 transition-all duration-300">
                <div className="mb-6 text-purple-600 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-white group-hover:text-purple-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {}
      <section className="py-24 border-t border-white/10 relative overflow-hidden">
        <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Developer First API</h2>
            <p className="text-gray-400 text-lg mb-8">
              Build your frontend with a type-safe, documented API. Retrieve programs, filter by topic, and consume  structured lesson content.
            </p>
            <button className="h-12 px-6 text-lg border  border-white/20  hover:bg-white/10 text-white transition-colors">
              Read Documentation  
            </button>
          </div>
          <div className="relative rounded-lg border  border-white/10 bg-black shadow-2xl font-mono text-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/5">
              <div className="w-3 h-3 rounded-full bg-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
              <div className="w-3 h-3 rounded-full bg-green-500/50" />
              <div className="ml-2 text-xs text-gray-400">GET /catalog/programs</div>
            </div>
            <div className="p-6 overflow-x-auto text-blue-100">

              <pre>
{`{
  "data": [
    {
      "id": "prog_123",
      "title": "Advanced React Patterns",
      "language": "en",
      "status": "published",
      "lessons_count": 12,
      "assets": {
        "poster": "https://cdn..."
      }
    }
  ],
  "meta": {
    "page": 1,
    "total": 45
  }
}`}
              </pre>
            </div>
            <div className="absolute inset-0  pointer-events-none  bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        </div>
      </section>
      {}
      <footer className="py-12 border-t border-white/10  bg-black text-sm">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center  gap-2">
            <Layers className="text-purple-600  w-5 h-5" />
            <span className="font-bold tracking-tight text-lg">StudyForge</span>
          </div>
          <div className="text-gray-400">
            © 2026 StudyForge Inc. All rights reserved.
          </div>
          <div className="flex gap-6 text-gray-400">
            <a href="#" className="hover:text-purple-400  transition-colors">Privacy</a>
            <a href="#" className="hover:text-purple-400  transition-colors">Terms</a>
            <a href="#" className="hover:text-purple-400  transition-colors">Twitter</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
