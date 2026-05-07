import React from 'react';
import { motion } from 'framer-motion';
import { Scale, UserCheck, AlertTriangle, Gavel, Ban, CheckCircle2 } from 'lucide-react';

const terms = [
  {
    title: 'User Eligibility',
    icon: UserCheck,
    content: 'To use the Vote Sphare, you must be a currently enrolled student with a valid registration number. Use of the system by unauthorized individuals is strictly prohibited.',
  },
  {
    title: 'Account Responsibility',
    icon: Gavel,
    content: 'You are responsible for maintaining the confidentiality of your login credentials. Any activity that occurs under your account is your responsibility. Report any unauthorized access immediately.',
  },
  {
    title: 'Voting Integrity',
    icon: CheckCircle2,
    content: 'Each eligible user is entitled to exactly one vote per election. Attempts to bypass this restriction, including creating multiple accounts or exploiting system vulnerabilities, will result in immediate disqualification and disciplinary action.',
  },
  {
    title: 'Prohibited Conduct',
    icon: Ban,
    content: 'Users may not use the platform for any illegal purpose or to solicit others to perform illegal acts. Harassment, intimidation of candidates, or spreading false information about the voting process is strictly forbidden.',
  },
  {
    title: 'Platform Availability',
    icon: AlertTriangle,
    content: 'While we strive for 100% uptime, we do not guarantee that the service will be uninterrupted. We reserve the right to suspend the system for maintenance or in the event of a security threat.',
  },
  {
    title: 'Limitation of Liability',
    icon: Scale,
    content: 'Vote Sphare and its administrators shall not be liable for any indirect, incidental, or consequential damages resulting from the use or inability to use the platform.',
  },
];

export default function Terms() {
  return (
    <div className="min-h-screen bg-background text-text-main py-12 px-4 w-full">
      <div className="w-full px-4 md:px-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-12"
        >
          <div className="inline-flex p-3 rounded-2xl bg-secondary/10 text-secondary mb-6">
            <Scale size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4">Terms & Conditions</h1>
          <p className="text-text-secondary font-medium max-w-2xl mx-auto">
            By using our platform, you agree to abide by these rules designed to ensure a fair and transparent democratic process for all students.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {terms.map((term, index) => (
            <motion.div
              key={term.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.05 }}
              transition={{ delay: index * 0.1, type: "spring", stiffness: 400, damping: 10 }}
              viewport={{ once: true }}
              className="p-8 rounded-3xl bg-card border border-border-color hover:shadow-2xl hover:shadow-superior/10 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-4 mb-4">
                <motion.div 
                  whileHover={{ scale: 1.2, rotate: -15 }}
                  className="p-3 rounded-xl bg-bg-hover text-superior group-hover:bg-superior/10 transition-all"
                >
                  <term.icon size={22} />
                </motion.div>
                <h3 className="text-xl font-bold text-text-main group-hover:text-superior transition-colors">{term.title}</h3>
              </div>
              <p className="text-text-secondary text-sm leading-relaxed font-semibold group-hover:text-text-main transition-colors">
                {term.content}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mt-16 text-center"
        >
          <p className="text-sm text-text-secondary font-bold uppercase tracking-widest mb-4">Agreement</p>
          <p className="text-text-secondary max-w-lg mx-auto italic">
            "I understand that my participation in the voting process is a privilege and I commit to upholding the highest standards of integrity."
          </p>
        </motion.div>
      </div>
    </div>
  );
}
