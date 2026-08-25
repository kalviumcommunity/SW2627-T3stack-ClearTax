"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Zap, Database } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <main className="container" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', minHeight: '100vh', display: 'flex' }}>
      <motion.div 
        className="card"
        style={{ maxWidth: '800px', width: '100%', padding: '4rem 2rem', background: 'rgba(20, 25, 22, 0.4)' }}
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={itemVariants} style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '1rem', borderRadius: '50%', color: 'var(--primary)' }}>
            <Database size={48} />
          </div>
        </motion.div>

        <motion.h1 variants={itemVariants} style={{ fontSize: '4rem', lineHeight: '1.1', marginBottom: '1.5rem' }}>
          Bulk Invoicing, <br/>
          <span style={{ color: 'var(--primary)', background: 'none', WebkitTextFillColor: 'var(--primary)' }}>Redefined.</span>
        </motion.h1>
        
        <motion.p variants={itemVariants} className="subtitle" style={{ fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto 3rem auto' }}>
          Seamlessly upload, process, and track thousands of invoices with bank-grade security and blazing fast background processing.
        </motion.p>

        <motion.div variants={itemVariants} style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginBottom: '4rem' }}>
          <button 
            className="btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 2.5rem', fontSize: '1.125rem' }}
            onClick={() => router.push('/signup')}
          >
            Get Started <ArrowRight size={20} />
          </button>
        </motion.div>

        <motion.div variants={containerVariants} style={{ display: 'flex', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap' }}>
          <motion.div variants={itemVariants} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#cbd5e1' }}>
            <ShieldCheck size={24} style={{ color: 'var(--primary)' }} />
            <span style={{ fontWeight: 500 }}>Bank-Grade Security</span>
          </motion.div>
          <motion.div variants={itemVariants} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#cbd5e1' }}>
            <Zap size={24} style={{ color: 'var(--primary)' }} />
            <span style={{ fontWeight: 500 }}>Real-time Processing</span>
          </motion.div>
        </motion.div>
      </motion.div>
    </main>
  );
}
