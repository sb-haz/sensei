'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
// @ts-expect-error - react-i18next types issue
import { useTranslation } from 'react-i18next';

interface Template {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  level: string;
  is_default: boolean;
}

export function TemplatesSection() {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user } = useAuth(); // Use centralized auth hook

  useEffect(() => {
    const loadTemplates = async () => {
      const supabase = createClient();
      
      // Load templates
      const { data: templatesData } = await supabase
        .from('interview_templates')
        .select('*')
        .eq('is_default', true);
      
      setTemplates(templatesData || []);
      setLoading(false);
    };

    loadTemplates();
  }, []);

  const cardConfigs = [
    {
      gradient: 'bg-gradient-to-br from-red-100 to-pink-50',
      border: 'border-red-100 hover:border-blue-400',
      icon: '🎨'
    },
    {
      gradient: 'bg-gradient-to-br from-blue-100 to-indigo-50', 
      border: 'border-blue-100 hover:border-blue-400',
      icon: '⚛️'
    },
    {
      gradient: 'bg-gradient-to-br from-green-100 to-emerald-50',
      border: 'border-green-100 hover:border-blue-400',
      icon: '⚙️'
    },
    {
      gradient: 'bg-gradient-to-br from-purple-100 to-violet-50',
      border: 'border-purple-100 hover:border-blue-400',
      icon: '📊'
    },
    {
      gradient: 'bg-gradient-to-br from-orange-100 to-amber-50',
      border: 'border-orange-100 hover:border-blue-400',
      icon: '📐'
    },
    {
      gradient: 'bg-gradient-to-br from-cyan-100 to-blue-50',
      border: 'border-cyan-100 hover:border-blue-400',
      icon: '👥'
    },
    {
      gradient: 'bg-gradient-to-br from-yellow-100 to-orange-50',
      border: 'border-yellow-100 hover:border-blue-400',
      icon: '☕'
    }
  ];

  const levelColors = {
    Junior: 'bg-green-100 text-green-700',
    'Mid-level': 'bg-yellow-100 text-yellow-700',
    Senior: 'bg-red-100 text-red-700',
    'All levels': 'bg-blue-100 text-blue-700'
  };

  const handleTemplateClick = (templateId: string) => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    router.push(`/interview?template=${templateId}`);
  };

  const handleCustomClick = () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    router.push('/interview');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-96 bg-gray-100 rounded-2xl animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <section className="py-20 sm:py-28 bg-gray-50 templates-section">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900">{t('templates.title')}</h2>
          <p className="text-lg text-gray-600 mt-4">{t('templates.subtitle')}</p>
        </motion.div>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {templates.map((template, index) => {
            const config = cardConfigs[index % cardConfigs.length];
            return (
              <motion.div
                key={template.id}
                variants={cardVariants}
                className={`group ${config.border} rounded-2xl transition-all duration-200 border-2 hover:shadow-md cursor-pointer overflow-hidden bg-white h-96 flex flex-col`}
                onClick={() => handleTemplateClick(template.id)}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <div className={`${config.gradient} h-32 group-hover:h-20 transition-all duration-300 flex items-center justify-center flex-shrink-0`}>
                  <div className="text-4xl">
                    {config.icon}
                  </div>
                </div>
                
                <div className="p-6 flex-1 flex flex-col justify-between overflow-hidden">
                  <div className="flex-1 overflow-hidden">
                    <h3 className="font-semibold text-lg text-gray-900 mb-2">
                      {template.name}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3 overflow-hidden">
                      {template.description}
                    </p>
                  </div>

                  <div className="flex-shrink-0 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700 font-medium border border-gray-200">
                        {template.duration_minutes}m
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${levelColors[template.level as keyof typeof levelColors] || 'bg-gray-100 text-gray-700'}`}>
                        {template.level}
                      </span>
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="text-blue-600 hover:text-blue-800 text-sm font-medium underline">
                        {user ? 'Start Interview →' : 'Login to Start →'}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
          
          <motion.div
            variants={cardVariants}
            className="group border-gray-200 hover:border-blue-400 rounded-2xl transition-all duration-200 border-2 border-dashed cursor-pointer overflow-hidden bg-white h-96 flex flex-col"
            onClick={handleCustomClick}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <div className="bg-gradient-to-br from-gray-100 to-gray-50 h-32 group-hover:h-20 transition-all duration-300 flex items-center justify-center flex-shrink-0">
              <div className="text-4xl text-gray-400">
                +
              </div>
            </div>
            
            <div className="p-6 flex-1 flex flex-col justify-between overflow-hidden">
              <div className="flex-1 overflow-hidden">
                <h3 className="font-semibold text-lg text-gray-900 mb-2">
                  Custom Interview
                </h3>
                
                <p className="text-sm text-gray-600 mb-4">
                  Create your own interview experience
                </p>
              </div>

              <div className="flex-shrink-0 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700 font-medium border border-gray-200">
                    Custom
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    Any
                  </span>
                </div>

                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-blue-600 hover:text-blue-800 text-sm font-medium underline">
                    {user ? 'Create Interview →' : 'Login to Create →'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
