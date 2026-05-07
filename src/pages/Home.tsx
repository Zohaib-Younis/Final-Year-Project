import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Vote as VoteIcon, 
  Users, 
  Zap, 
  Lock, 
  BarChart3, 
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

const stats = [
  { label: 'Total Votes Cast', value: '12.5k+', icon: VoteIcon, color: 'text-blue-500' },
  { label: 'Active Elections', value: '48', icon: BarChart3, color: 'text-purple-500' },
  { label: 'Verified Voters', value: '25k+', icon: Users, color: 'text-emerald-500' },
  { label: 'Uptime', value: '99.9%', icon: Zap, color: 'text-amber-500' },
];

const features = [
  {
    title: 'Secure & Encrypted',
    description: 'Every vote is encrypted and stored securely using industry-standard protocols.',
    icon: Lock,
  },
  {
    title: 'Transparent Process',
    description: 'Real-time results and transparent auditing for complete trust in the system.',
    icon: ShieldCheck,
  },
  {
    title: 'Easy to Use',
    description: 'Intuitive interface designed for students and administrators alike.',
    icon: Zap,
  },
  {
    title: 'Instant Verification',
    description: 'Automated voter verification through student ID and secure credentials.',
    icon: CheckCircle2,
  },
];

const steps = [
  { title: 'Register', description: 'Create your account using your student credentials.' },
  { title: 'Verify', description: 'Receive approval from the administrator to join the voting pool.' },
  { title: 'Vote', description: 'Cast your vote securely for your preferred candidates.' },
  { title: 'Results', description: 'View transparent, real-time results once the election ends.' },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-8 -mt-8 overflow-hidden bg-background text-text-main">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center pt-20">
        {/* Background Blobs */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-superior/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
        <div className="absolute top-0 -right-4 w-72 h-72 bg-secondary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />

        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 mb-6 text-xs font-bold tracking-widest text-superior uppercase bg-superior/10 rounded-full">
              The Future of Campus Elections
            </span>
            <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight drop-shadow-sm text-text-main">
              Vote with <span className="text-superior">Confidence</span>. <br />
              Lead with <span className="text-secondary">Integrity</span>.
            </h1>
            <p className="text-xl text-text-secondary mb-10 max-w-2xl mx-auto font-medium">
              A transparent, secure, and intuitive voting platform designed for the next generation of campus leaders.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/login"
                className="px-8 py-4 bg-superior text-white rounded-2xl font-bold text-lg hover:bg-superior-dark transition-all flex items-center justify-center gap-2 shadow-lg shadow-superior/20 hover:scale-105 active:scale-95"
              >
                Start Voting Now <ArrowRight size={20} />
              </Link>
              <Link
                to="/register"
                className="px-8 py-4 bg-card border-2 border-border-color rounded-2xl font-bold text-lg hover:bg-bg-hover transition-all flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
              >
                Register as Student
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              transition={{ delay: index * 0.1, type: "spring", stiffness: 400, damping: 10 }}
              viewport={{ once: true }}
              className="p-8 bg-card rounded-3xl text-center flex flex-col items-center gap-3 border border-border-color shadow-xl cursor-pointer group"
            >
              <motion.div 
                whileHover={{ rotate: 15, scale: 1.2 }}
                className={`p-3 rounded-2xl bg-bg-hover ${stat.color} group-hover:bg-superior/10 transition-colors`}
              >
                <stat.icon size={24} />
              </motion.div>
              <p className="text-3xl font-black tracking-tight text-text-main group-hover:text-superior transition-colors">{stat.value}</p>
              <p className="text-sm font-bold text-text-secondary uppercase tracking-wider group-hover:text-text-main transition-colors">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black mb-4 text-text-main">Unmatched Security</h2>
          <p className="text-text-secondary font-semibold max-w-xl mx-auto">
            Our platform utilizes advanced encryption and multi-factor authentication to ensure every vote is authentic and anonymous.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.05 }}
              transition={{ delay: index * 0.1, type: "spring", stiffness: 400, damping: 10 }}
              viewport={{ once: true }}
              className="p-8 rounded-3xl bg-card border border-border-color hover:border-superior/50 transition-all group cursor-pointer shadow-lg"
            >
              <motion.div 
                whileHover={{ scale: 1.2, rotate: -10 }}
                className="w-14 h-14 bg-superior/10 rounded-2xl flex items-center justify-center text-superior mb-6 group-hover:bg-superior/20 transition-all"
              >
                <feature.icon size={28} />
              </motion.div>
              <h3 className="text-xl font-bold mb-3 text-text-main group-hover:text-superior transition-colors">{feature.title}</h3>
              <p className="text-text-secondary text-sm leading-relaxed font-semibold group-hover:text-text-main transition-colors">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it Works Section */}
      <section className="bg-superior/5 py-16 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2">
              <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight text-text-main">
                Simple, Fast, and <br />
                <span className="text-superior">Completely Digital</span>
              </h2>
              <div className="space-y-6">
                {steps.map((step, index) => (
                  <motion.div 
                    key={step.title} 
                    whileHover={{ x: 10 }}
                    className="flex gap-6 items-start group"
                  >
                    <div className="flex-shrink-0 w-10 h-10 bg-superior text-white rounded-full flex items-center justify-center font-black text-lg group-hover:scale-110 group-hover:bg-superior-dark transition-all">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-1 text-text-main">{step.title}</h4>
                      <p className="text-text-secondary font-medium group-hover:text-text-main transition-colors">{step.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="lg:w-1/2 relative">
              <div className="aspect-square bg-gradient-to-br from-superior/20 to-secondary/20 rounded-full absolute -top-10 -right-10 blur-3xl opacity-30" />
              <div className="relative glass-panel rounded-[40px] p-2 overflow-hidden shadow-2xl border-border-color">
                <div className="bg-slate-900 rounded-[38px] aspect-video flex items-center justify-center overflow-hidden">
                   <img 
                    src="https://images.unsplash.com/photo-1540910419316-ce72030f2424?q=80&w=1000&auto=format&fit=crop" 
                    alt="Voting System Preview" 
                    className="w-full h-full object-cover opacity-80"
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-10">
                      <div className="text-white">
                        <p className="text-sm font-bold text-superior-light uppercase tracking-widest mb-2">Live Preview</p>
                        <h4 className="text-2xl font-black">Student Dashboard Interface</h4>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 border-t border-border-color">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-superior rounded-lg flex items-center justify-center text-white">
              <ShieldCheck size={18} />
            </div>
            <span className="text-lg font-bold tracking-tight uppercase text-text-main">SuperiorVote</span>
          </div>
          <div className="flex gap-8 text-sm font-bold text-text-secondary">
            <Link to="/privacy" className="hover:text-superior transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-superior transition-colors">Terms of Service</Link>
            <a href="#" className="hover:text-superior transition-colors">Contact Support</a>
          </div>
          <p className="text-xs text-text-secondary font-medium">
            &copy; {new Date().getFullYear()} Superior Voting System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
