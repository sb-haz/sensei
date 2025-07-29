'use client'

import { motion } from 'framer-motion'
import { PreviewBox } from '@/components/PreviewBox'
import { TemplatesSection } from '@/components/TemplatesSection'
import { ClientNavbar } from '@/components/ClientNavbar'
import { Play, Sparkles, Check, Brain } from 'lucide-react'
import Link from 'next/link'
// @ts-expect-error - react-i18next types issue
import { useTranslation } from 'react-i18next'

export default function Home() {
  const { t } = useTranslation();
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <div className="min-h-screen bg-white">
      <main>
        {/* Hero Section */}
        <section className="pt-0 pb-8 md:pb-16 relative overflow-hidden">
          <div className="absolute inset-0 z-0 h-full w-full bg-white [background:radial-gradient(125%_125%_at_50%_0%,#fff_40%,#2563eb_100%)]"></div>
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-white z-10 rounded-t-[100%] transform scale-x-150"></div>
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <ClientNavbar />
            <div className="text-center space-y-8 pt-16">
              <motion.div 
                className="space-y-4 sm:space-y-6 sm:mt-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div 
                  className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full text-sm font-medium text-blue-600"
                  variants={itemVariants}
                >
                  <Sparkles className="w-4 h-4" />
                  {t('homepage.bestToolBadge')}
                </motion.div>
                <motion.div className="space-y-6" variants={itemVariants}>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight max-w-4xl mx-auto">
                    {t('homepage.title')}
                    <br />
                    <span className="text-blue-600">{t('homepage.subtitle')}</span>
                  </h1>
                </motion.div>
                <motion.div 
                  className="flex flex-col sm:flex-row gap-4 justify-center"
                  variants={itemVariants}
                >
                  <motion.button 
                    className="bg-white text-blue-600 px-8 py-3.5 rounded-full hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 font-medium border border-blue-200 shadow-sm"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => document.querySelector('.templates-section')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    <Play className="w-5 h-5" />
                    {t('homepage.startNow')}
                  </motion.button>
                </motion.div>
              </motion.div>
              <motion.div 
                className="relative max-w-4xl mx-auto"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <PreviewBox />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Templates Section */}
        <TemplatesSection />

        {/* Pricing Section */}
        <section className="py-24 sm:py-32 bg-gradient-to-b from-gray-50 to-white" id="pricing">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div 
              className="text-center mb-12 sm:mb-20"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-2">{t('homepage.pricing')}</h2>
              <div className="mt-4 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full border border-green-100">
                  <span className="text-gray-700 font-medium">30-day money-back guarantee</span>
                  <Check className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </motion.div>
            <motion.div 
              className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, staggerChildren: 0.2 }}
            >
              <motion.div 
                className="group relative rounded-3xl p-px bg-gradient-to-b from-indigo-400 via-blue-500 to-blue-600"
                whileHover={{ y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="relative rounded-[22px] p-8 h-full bg-white">
                  <div className="relative">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{t('homepage.freeCard.title')}</h3>
                    <p className="text-gray-600 mb-6">Perfect for getting started</p>
                    <div className="flex items-baseline gap-2 mb-6">
                      <span className="text-5xl font-bold text-gray-900">{t('homepage.freeCard.price')}</span>
                      <span className="text-gray-500 font-medium">/{t('homepage.freeCard.period')}</span>
                    </div>
                    <ul className="space-y-4 mb-6 text-gray-700">
                      <li>{t('homepage.freeCard.features.0')}</li>
                      <li>{t('homepage.freeCard.features.1')}</li>
                      <li>{t('homepage.freeCard.features.2')}</li>
                      <li>{t('homepage.freeCard.features.3')}</li>
                    </ul>
                    <motion.button 
                      className="w-full py-4 px-6 rounded-xl bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors font-medium"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {t('homepage.freeCard.cta')}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
              <motion.div 
                className="group relative rounded-3xl p-px bg-gradient-to-b from-indigo-400 via-blue-500 to-blue-600"
                whileHover={{ y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="relative rounded-[22px] p-8 h-full bg-white">
                  <div className="relative">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{t('homepage.premiumCard.title')}</h3>
                    <p className="text-gray-600 mb-6">For serious candidates</p>
                    <div className="flex items-baseline gap-2 mb-6">
                      <span className="text-5xl font-bold text-gray-900">{t('homepage.premiumCard.price')}</span>
                      <span className="text-gray-500 font-medium">/{t('homepage.premiumCard.period')}</span>
                    </div>
                    <ul className="space-y-4 mb-6 text-gray-700">
                      <li>{t('homepage.premiumCard.features.0')}</li>
                      <li>{t('homepage.premiumCard.features.1')}</li>
                      <li>{t('homepage.premiumCard.features.2')}</li>
                      <li>{t('homepage.premiumCard.features.3')}</li>
                      <li>{t('homepage.premiumCard.features.4')}</li>
                      <li>{t('homepage.premiumCard.features.5')}</li>
                    </ul>
                    <motion.button 
                      className="w-full py-4 px-6 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {t('homepage.premiumCard.cta')}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-12 sm:py-16 bg-white" id="faq">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div 
              className="text-center mb-12"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900">{t('homepage.faq.title')}</h2>
            </motion.div>
            <motion.div 
              className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {[
                {
                  question: t('homepage.faq.items.0.question'),
                  answer: t('homepage.faq.items.0.answer')
                },
                {
                  question: t('homepage.faq.items.1.question'),
                  answer: t('homepage.faq.items.1.answer')
                },
                {
                  question: t('homepage.faq.items.2.question'),
                  answer: t('homepage.faq.items.2.answer')
                },
                {
                  question: t('homepage.faq.items.3.question'),
                  answer: t('homepage.faq.items.3.answer')
                }
              ].map((faq, index) => (
                <motion.div 
                  key={index} 
                  className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition"
                  variants={cardVariants}
                  whileHover={{ y: -2, transition: { duration: 0.2 } }}
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.question}</h3>
                  <p className="text-gray-600">{faq.answer}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-white text-gray-700 border-t border-gray-200 mt-20">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Brain className="w-8 h-8 text-blue-500" />
                  <span className="text-xl font-bold text-gray-900">Sensei</span>
                </div>
                <p className="text-sm text-gray-600">
                  {t('homepage.footer.description')}
                </p>
              </div>
              <div>
                <h3 className="text-gray-900 font-semibold mb-4">{t('homepage.footer.quickLinks')}</h3>
                <ul className="space-y-2">
                  <li><Link href="/dashboard" className="hover:text-blue-600 transition-colors">{t('homepage.footer.dashboard')}</Link></li>
                  <li><Link href="/interview" className="hover:text-blue-600 transition-colors">{t('homepage.footer.interview')}</Link></li>
                  <li><a href="#pricing" className="hover:text-blue-600 transition-colors">{t('homepage.footer.pricing')}</a></li>
                  <li><a href="#faq" className="hover:text-blue-600 transition-colors">{t('homepage.footer.faq')}</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-gray-900 font-semibold mb-4">{t('homepage.footer.resources')}</h3>
                <ul className="space-y-2">
                  <li><a href="#blog" className="hover:text-blue-600 transition-colors">{t('homepage.footer.blog')}</a></li>
                  <li><a href="#guides" className="hover:text-blue-600 transition-colors">{t('homepage.footer.guides')}</a></li>
                  <li><a href="#contact" className="hover:text-blue-600 transition-colors">{t('homepage.footer.contact')}</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-gray-900 font-semibold mb-4">{t('homepage.footer.contact')}</h3>
                <ul className="space-y-2">
                  <li><a href="mailto:support@sensei.com" className="hover:text-blue-600 transition-colors">{t('homepage.footer.email')}</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-200 mt-12 pt-8 text-sm text-gray-500">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <p>&copy; {new Date().getFullYear()} Sensei. {t('homepage.footer.allRights')}</p>
                <div className="flex gap-6">
                  <a href="#privacy" className="hover:text-blue-600 transition-colors">{t('homepage.footer.privacy')}</a>
                  <a href="#terms" className="hover:text-blue-600 transition-colors">{t('homepage.footer.terms')}</a>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}