import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Videocam as VideocamIcon,
  AutoAwesome as AutoAwesomeIcon,
  Speed as SpeedIcon,
  School as SchoolIcon,
} from '@mui/icons-material';

const features = [
  {
    icon: <VideocamIcon className="text-4xl" />,
    title: 'Smart Recording',
    description: 'Advanced screen capture with automatic zoom and cursor highlighting',
    color: 'from-rose-400 to-red-500',
  },
  {
    icon: <AutoAwesomeIcon className="text-4xl" />,
    title: 'AI Enhancements',
    description: 'Real-time voice coaching and automatic pause detection',
    color: 'from-amber-400 to-yellow-500',
  },
  {
    icon: <SpeedIcon className="text-4xl" />,
    title: 'Post-Processing',
    description: 'Auto-generated chapters and click highlight effects',
    color: 'from-emerald-400 to-green-500',
  },
  {
    icon: <SchoolIcon className="text-4xl" />,
    title: 'Tutorial Creation',
    description: 'Perfect for creating professional tutorials and guides',
    color: 'from-sky-400 to-cyan-500',
  },
];

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 via-secondary-600/20 to-purple-600/20 animate-gradient" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center z-10 px-4 max-w-4xl mx-auto"
        >
          <motion.h1 
            className="text-6xl md:text-7xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-primary-600 via-secondary-600 to-purple-600"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            AI-Powered Screen Recording
          </motion.h1>
          <motion.p 
            className="text-xl md:text-2xl text-gray-700 mb-12 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Create professional tutorials with smart features like automatic zoom,
            cursor highlighting, and AI-powered voice coaching.
          </motion.p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Link
              to="/recorder"
              className="inline-block bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-10 py-5 rounded-xl text-lg font-semibold hover:shadow-lg hover:shadow-primary-600/20 transition-all duration-300"
            >
              Start Recording
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <motion.h2 
            className="text-4xl md:text-5xl font-bold text-center mb-20 bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            Powerful Features for Professional Content
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="p-8 rounded-2xl bg-white shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <div className={`text-4xl mb-6 bg-gradient-to-r ${feature.color} bg-clip-text text-transparent`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-semibold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2 
            className="text-4xl md:text-5xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            Ready to Create Amazing Tutorials?
          </motion.h2>
          <motion.p 
            className="text-xl text-gray-700 mb-12 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Join thousands of content creators who are using our AI-powered screen
            recorder to create professional tutorials.
          </motion.p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <Link
              to="/recorder"
              className="inline-block bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-10 py-5 rounded-xl text-lg font-semibold hover:shadow-lg hover:shadow-primary-600/20 transition-all duration-300"
            >
              Get Started Now
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home; 