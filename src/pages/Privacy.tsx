import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Eye, Lock, Globe, FileText, ChevronRight } from 'lucide-react';

const sections = [
  {
    id: 'collection',
    title: 'Information Collection',
    icon: Eye,
    content: `We collect information necessary to ensure a fair and secure voting process. This includes your student registration number, department, and academic level. We do not collect personal contact information unless explicitly provided for account recovery purposes.`,
  },
  {
    id: 'usage',
    title: 'How We Use Data',
    icon: FileText,
    content: `Your data is used solely for voter verification and eligibility checks. We ensure that each student can only cast one vote per election. Aggregate, non-identifiable data may be used for analytical reports on voter turnout.`,
  },
  {
    id: 'security',
    title: 'Data Security',
    icon: Lock,
    content: `We implement robust security measures including end-to-end encryption for all cast votes. Our database is protected by multi-layer firewalls and regular security audits to prevent unauthorized access.`,
  },
  {
    id: 'anonymity',
    title: 'Voter Anonymity',
    icon: Shield,
    content: `Your privacy is our priority. Once a vote is cast, it is decoupled from your user identity in our secure "anonymity layer." This ensures that while we know you have voted, no one—including administrators—can see who you voted for.`,
  },
  {
    id: 'third-party',
    title: 'Third-Party Disclosure',
    icon: Globe,
    content: `We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties. This does not include trusted third parties who assist us in operating our platform, so long as those parties agree to keep this information confidential.`,
  },
];

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background text-text-main py-12 px-4 w-full">
      <div className="w-full px-4 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex p-3 rounded-2xl bg-superior/10 text-superior mb-6">
            <Shield size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4">Privacy Policy</h1>
          <p className="text-text-secondary font-medium max-w-2xl mx-auto">
            Last updated: May 2026. Learn how we protect your data and ensure your anonymity in every election.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sections.map((section, index) => (
            <motion.section
              key={section.id}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.02 }}
              transition={{ delay: index * 0.1, type: "spring", stiffness: 400, damping: 10 }}
              viewport={{ once: true }}
              className="p-8 rounded-3xl bg-card border border-border-color hover:border-superior/50 transition-all group cursor-pointer shadow-2xl"
            >
              <div className="flex flex-col gap-6">
                <motion.div 
                  whileHover={{ rotate: 15, scale: 1.2 }}
                  className="w-14 h-14 p-4 rounded-2xl bg-bg-hover text-superior group-hover:bg-superior/10 transition-all flex items-center justify-center"
                >
                  <section.icon size={24} />
                </motion.div>
                <div className="flex-grow">
                  <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-2xl font-bold text-text-main group-hover:text-superior transition-colors">{section.title}</h2>
                    <ChevronRight size={18} className="text-superior opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </div>
                  <p className="text-text-secondary leading-relaxed font-medium group-hover:text-text-main transition-colors">
                    {section.content}
                  </p>
                </div>
              </div>
            </motion.section>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mt-20 p-8 rounded-3xl bg-superior text-white text-center shadow-xl shadow-superior/20"
        >
          <h3 className="text-2xl font-bold mb-4">Questions about your privacy?</h3>
          <p className="mb-8 opacity-90 font-medium text-white">
            Our dedicated security team is here to help. Reach out to us for any clarifications regarding our data practices.
          </p>
          <button className="px-8 py-3 bg-white text-superior rounded-xl font-bold hover:bg-slate-100 transition-colors shadow-lg">
            Contact Support
          </button>
        </motion.div>
      </div>
    </div>
  );
}
