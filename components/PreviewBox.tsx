'use client';

import { motion } from 'framer-motion';
// @ts-expect-error - react-i18next types issue
import { useTranslation } from 'react-i18next';

export function PreviewBox() {
  const { t } = useTranslation();
  return (
    <motion.div 
      className="relative w-full max-w-4xl mx-auto"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4 }}
    >
      <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gray-900">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-4 py-3 bg-gray-800">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="flex-1 mx-4">
            <div className="bg-gray-700 rounded-md px-3 py-1 text-sm text-gray-300 text-center">
              sensei.ai/interview
            </div>
          </div>
        </div>
        
        {/* Interface preview */}
        <div className="aspect-video bg-gradient-to-br from-blue-50 to-white p-8">
          <div className="grid grid-cols-2 gap-6 h-full">
            {/* Left side - Interviewer */}
            <div className="space-y-4">
              <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-gray-100 to-white border-2 border-gray-200 flex items-center justify-center shadow-sm">
                <span className="text-blue-600 text-4xl font-bold">AI</span>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600 leading-relaxed">
                  &ldquo;{t('homepage.previewSample')}&rdquo;
                </p>
              </div>
            </div>
            
            {/* Right side - User */}
            <div className="space-y-4">
              <div className="w-32 h-32 mx-auto rounded-full bg-gray-200 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-gray-300"></div>
              </div>
              <div className="space-y-2">
                <div className="bg-blue-100 rounded-lg p-3">
                  <div className="h-2 bg-blue-300 rounded w-3/4"></div>
                </div>
                <div className="bg-blue-100 rounded-lg p-3">
                  <div className="h-2 bg-blue-300 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
