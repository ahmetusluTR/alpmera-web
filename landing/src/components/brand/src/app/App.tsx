import React, { useState } from 'react';
import { AlpmeraLogo } from '@/app/components/brand/AlpmeraLogo';
import { OrbitalProgress } from '@/app/components/brand/OrbitalProgress';
import { AlpmeraButton } from '@/app/components/brand/AlpmeraButton';
import { AlpmeraCard } from '@/app/components/brand/AlpmeraCard';
import { AlpmeraInput, AlpmeraSelect, AlpmeraCheckbox, AlpmeraToggle } from '@/app/components/brand/AlpmeraInput';
import { AlpmeraStatusTag, AlpmeraBadge } from '@/app/components/brand/AlpmeraStatusTag';
import { AlpmeraNav, AlpmeraSidebar } from '@/app/components/brand/AlpmeraNav';
import { 
  AlpmeraH1, 
  AlpmeraH2, 
  AlpmeraH3, 
  AlpmeraBodyText, 
  AlpmeraDataLabel,
  AlpmeraMetricDisplay 
} from '@/app/components/brand/AlpmeraTypography';
import { Layers, Box, TrendingUp, Users, Briefcase, Settings, BarChart3 } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<'system' | 'landing' | 'dashboard' | 'vault'>('system');
  const [progress, setProgress] = useState(67);
  const [isToggled, setIsToggled] = useState(false);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E8DED1', fontFamily: 'var(--font-sans)' }}>
      {/* Navigation */}
      <AlpmeraNav 
        items={[
          { label: 'Design System', href: '#', active: currentView === 'system' },
          { label: 'Landing', href: '#', active: currentView === 'landing' },
          { label: 'Dashboard', href: '#', active: currentView === 'dashboard' },
          { label: 'Vault', href: '#', active: currentView === 'vault' },
        ]}
      />

      {/* View Switcher */}
      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="flex gap-3 mb-8">
          <AlpmeraButton 
            variant={currentView === 'system' ? 'primary' : 'ghost'} 
            size="sm"
            onClick={() => setCurrentView('system')}
          >
            Design System
          </AlpmeraButton>
          <AlpmeraButton 
            variant={currentView === 'landing' ? 'primary' : 'ghost'} 
            size="sm"
            onClick={() => setCurrentView('landing')}
          >
            Landing Page
          </AlpmeraButton>
          <AlpmeraButton 
            variant={currentView === 'dashboard' ? 'primary' : 'ghost'} 
            size="sm"
            onClick={() => setCurrentView('dashboard')}
          >
            Dashboard
          </AlpmeraButton>
          <AlpmeraButton 
            variant={currentView === 'vault' ? 'primary' : 'ghost'} 
            size="sm"
            onClick={() => setCurrentView('vault')}
          >
            Vault Product
          </AlpmeraButton>
        </div>

        {/* Design System View */}
        {currentView === 'system' && (
          <div className="space-y-16">
            {/* Header */}
            <div className="text-center space-y-4">
              <AlpmeraH1>Alpmera Design System</AlpmeraH1>
              <AlpmeraBodyText className="max-w-2xl mx-auto" size="lg">
                Nature Distilled meets Neo-Minimalism. A complete visual identity system for trusted industrial operations.
              </AlpmeraBodyText>
            </div>

            {/* Logo System */}
            <section className="space-y-8">
              <div>
                <AlpmeraH2>Logo System – "Institutional Wordmark"</AlpmeraH2>
                <AlpmeraBodyText className="mt-2">
                  Clean serif typography for trusted, century-old institutional presence
                </AlpmeraBodyText>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <AlpmeraCard variant="elevated">
                  <div className="text-center space-y-4">
                    <div className="flex justify-center py-8">
                      <AlpmeraLogo variant="primary" size="lg" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1" style={{ color: '#1B4D3E' }}>Primary Wordmark</h4>
                      <p className="text-sm opacity-60">ALPMERA in Libre Baskerville</p>
                    </div>
                  </div>
                </AlpmeraCard>

                <AlpmeraCard variant="elevated">
                  <div className="text-center space-y-4">
                    <div className="flex justify-center py-8">
                      <AlpmeraLogo variant="tagline" size="lg" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1" style={{ color: '#1B4D3E' }}>With Tagline</h4>
                      <p className="text-sm opacity-60">Wordmark + descriptor</p>
                    </div>
                  </div>
                </AlpmeraCard>

                <AlpmeraCard variant="elevated">
                  <div className="text-center space-y-4">
                    <div className="flex justify-center py-8">
                      <AlpmeraLogo variant="favicon" size="md" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1" style={{ color: '#1B4D3E' }}>Favicon</h4>
                      <p className="text-sm opacity-60">Simple letter "A"</p>
                    </div>
                  </div>
                </AlpmeraCard>
              </div>
            </section>

            {/* Color System */}
            <section className="space-y-8">
              <div>
                <AlpmeraH2>Color System – "The Trust Spectrum"</AlpmeraH2>
                <AlpmeraBodyText className="mt-2">
                  Core brand tokens for institutional security and nature-distilled calm
                </AlpmeraBodyText>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-3">
                  <div 
                    className="h-32 rounded-lg border-2"
                    style={{ backgroundColor: '#1B4D3E', borderColor: '#1B4D3E' }}
                  />
                  <div>
                    <h4 className="font-semibold mb-1" style={{ color: '#1B4D3E' }}>Deep Forest</h4>
                    <p className="text-sm opacity-60">#1B4D3E</p>
                    <p className="text-xs mt-1 opacity-50">Primary • Authority • Security</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div 
                    className="h-32 rounded-lg border-2"
                    style={{ backgroundColor: '#E8DED1', borderColor: '#1B4D3E' }}
                  />
                  <div>
                    <h4 className="font-semibold mb-1" style={{ color: '#1B4D3E' }}>Warm Stone</h4>
                    <p className="text-sm opacity-60">#E8DED1</p>
                    <p className="text-xs mt-1 opacity-50">Background • Calm • Premium</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div 
                    className="h-32 rounded-lg border-2"
                    style={{ backgroundColor: '#C9A962', borderColor: '#C9A962' }}
                  />
                  <div>
                    <h4 className="font-semibold mb-1" style={{ color: '#1B4D3E' }}>Muted Gold</h4>
                    <p className="text-sm opacity-60">#C9A962</p>
                    <p className="text-xs mt-1 opacity-50">Accent • Action • Manufacturing</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div 
                    className="h-32 rounded-lg border-2"
                    style={{ backgroundColor: '#3A6B5A', borderColor: '#3A6B5A' }}
                  />
                  <div>
                    <h4 className="font-semibold mb-1" style={{ color: '#1B4D3E' }}>Forest Light</h4>
                    <p className="text-sm opacity-60">#3A6B5A</p>
                    <p className="text-xs mt-1 opacity-50">Success • Progress • Growth</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Typography */}
            <section className="space-y-8">
              <div>
                <AlpmeraH2>Typography – "The Engineer's Serif"</AlpmeraH2>
                <AlpmeraBodyText className="mt-2">
                  High-contrast serif for authority, super-legible sans for data honesty
                </AlpmeraBodyText>
              </div>

              <AlpmeraCard variant="elevated">
                <div className="space-y-8">
                  <div>
                    <AlpmeraH1>H1 Display Headline</AlpmeraH1>
                    <p className="text-sm mt-2 opacity-60">Libre Baskerville • 3.5rem • Line height 1.2</p>
                  </div>
                  
                  <div>
                    <AlpmeraH1 variant="condensed">H1 Condensed Hero</AlpmeraH1>
                    <p className="text-sm mt-2 opacity-60">Libre Baskerville • 4.5rem • Tight tracking</p>
                  </div>

                  <div>
                    <AlpmeraH2>H2 Section Header</AlpmeraH2>
                    <p className="text-sm mt-2 opacity-60">Libre Baskerville • 2.5rem</p>
                  </div>

                  <div>
                    <AlpmeraH3>H3 Subsection Title</AlpmeraH3>
                    <p className="text-sm mt-2 opacity-60">Libre Baskerville • 2rem</p>
                  </div>

                  <div>
                    <AlpmeraBodyText>
                      Body text uses Inter for maximum legibility in data-rich environments. 
                      Clear rhythm and spacing prioritize "data honesty" with strong visual hierarchy.
                    </AlpmeraBodyText>
                    <p className="text-sm mt-2 opacity-60">Inter • 1rem • Line height 1.7</p>
                  </div>
                </div>
              </AlpmeraCard>
            </section>

            {/* Orbital Progress System */}
            <section className="space-y-8">
              <div>
                <AlpmeraH2>Progress Visualization – "Orbital Progress System"</AlpmeraH2>
                <AlpmeraBodyText className="mt-2">
                  No traditional progress bars. Circular halos with glowing particles signal momentum.
                </AlpmeraBodyText>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <AlpmeraCard variant="elevated">
                  <div className="flex flex-col items-center space-y-4">
                    <OrbitalProgress progress={35} size="sm" label="Small Status" />
                    <AlpmeraBodyText size="sm" className="text-center">
                      Small variant for cards and inline status
                    </AlpmeraBodyText>
                  </div>
                </AlpmeraCard>

                <AlpmeraCard variant="elevated">
                  <div className="flex flex-col items-center space-y-4">
                    <OrbitalProgress progress={progress} size="md" label="Medium Dashboard" />
                    <div className="flex gap-2 mt-4">
                      <AlpmeraButton size="sm" variant="ghost" onClick={() => setProgress(Math.max(0, progress - 10))}>-10%</AlpmeraButton>
                      <AlpmeraButton size="sm" variant="ghost" onClick={() => setProgress(Math.min(100, progress + 10))}>+10%</AlpmeraButton>
                    </div>
                  </div>
                </AlpmeraCard>

                <AlpmeraCard variant="elevated">
                  <div className="flex flex-col items-center space-y-4">
                    <OrbitalProgress progress={85} size="sm" label="Near Complete">
                      <div className="w-12 h-12 rounded-full bg-[#4A5D4E] flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                    </OrbitalProgress>
                    <AlpmeraBodyText size="sm" className="text-center">
                      With custom center content
                    </AlpmeraBodyText>
                  </div>
                </AlpmeraCard>
              </div>
            </section>

            {/* UI Components */}
            <section className="space-y-8">
              <div>
                <AlpmeraH2>UI Components – "Immersive Minimalism"</AlpmeraH2>
                <AlpmeraBodyText className="mt-2">
                  Tactile buttons, matte textures, and precise minimal layouts
                </AlpmeraBodyText>
              </div>

              <div className="space-y-6">
                {/* Buttons */}
                <AlpmeraCard variant="elevated">
                  <h4 className="font-semibold mb-4" style={{ color: '#1B4D3E' }}>Buttons with 3D Press Effect</h4>
                  <div className="flex flex-wrap gap-4">
                    <AlpmeraButton variant="primary">Primary Action</AlpmeraButton>
                    <AlpmeraButton variant="secondary">Secondary</AlpmeraButton>
                    <AlpmeraButton variant="ghost">Ghost Button</AlpmeraButton>
                    <AlpmeraButton variant="primary" size="sm">Small</AlpmeraButton>
                    <AlpmeraButton variant="primary" size="lg">Large CTA</AlpmeraButton>
                    <AlpmeraButton variant="primary" disabled>Disabled</AlpmeraButton>
                  </div>
                </AlpmeraCard>

                {/* Form Inputs */}
                <AlpmeraCard variant="elevated">
                  <h4 className="font-semibold mb-4" style={{ color: '#1B4D3E' }}>Form Controls</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AlpmeraInput label="Campaign Name" placeholder="Enter campaign name..." />
                    <AlpmeraSelect 
                      label="Batch Type" 
                      options={[
                        { value: 'production', label: 'Production Batch' },
                        { value: 'pilot', label: 'Pilot Run' },
                        { value: 'quality', label: 'Quality Control' }
                      ]}
                    />
                    <div className="space-y-3">
                      <AlpmeraCheckbox label="Enable notifications" />
                      <AlpmeraCheckbox label="Auto-commit on threshold" />
                    </div>
                    <div className="space-y-3">
                      <AlpmeraToggle 
                        checked={isToggled} 
                        onChange={setIsToggled}
                        label="Advanced mode"
                      />
                    </div>
                  </div>
                </AlpmeraCard>

                {/* Status Tags & Badges */}
                <AlpmeraCard variant="elevated">
                  <h4 className="font-semibold mb-4" style={{ color: '#1B4D3E' }}>Status Tags & Badges</h4>
                  <div className="flex flex-wrap gap-3">
                    <AlpmeraStatusTag status="success">Completed</AlpmeraStatusTag>
                    <AlpmeraStatusTag status="info">In Review</AlpmeraStatusTag>
                    <AlpmeraStatusTag status="warning">Pending</AlpmeraStatusTag>
                    <AlpmeraStatusTag status="error">Failed</AlpmeraStatusTag>
                    <AlpmeraStatusTag status="progress">Processing</AlpmeraStatusTag>
                    <AlpmeraBadge variant="default">BATCH-2026</AlpmeraBadge>
                    <AlpmeraBadge variant="copper">PREMIUM</AlpmeraBadge>
                    <AlpmeraBadge variant="outline">V2.1</AlpmeraBadge>
                  </div>
                </AlpmeraCard>

                {/* Data Display */}
                <AlpmeraCard variant="blueprint">
                  <h4 className="font-semibold mb-6" style={{ color: '#1B4D3E' }}>Data Metrics with Blueprint Background</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <AlpmeraMetricDisplay 
                      value="$2.4M"
                      label="Total Capital Committed"
                      trend="up"
                      trendValue="12.5%"
                    />
                    <AlpmeraMetricDisplay 
                      value="47"
                      label="Active Campaigns"
                      trend="neutral"
                      trendValue="0%"
                    />
                    <AlpmeraMetricDisplay 
                      value="94%"
                      label="Completion Rate"
                      trend="up"
                      trendValue="3.2%"
                    />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                    <AlpmeraDataLabel label="Batch ID" value="ALX-4729" />
                    <AlpmeraDataLabel label="Units" value="1,247" />
                    <AlpmeraDataLabel label="Quality" value="99.2%" />
                    <AlpmeraDataLabel label="Yield" value="847kg" />
                  </div>
                </AlpmeraCard>
              </div>
            </section>
          </div>
        )}

        {/* Landing Page Example */}
        {currentView === 'landing' && (
          <div className="space-y-24">
            {/* Hero Section */}
            <section className="text-center space-y-8 py-16">
              <div className="flex justify-center mb-8">
                <AlpmeraLogo variant="primary" size="xl" />
              </div>
              
              <AlpmeraH1 variant="condensed">
                The Operations House<br />for Modern Manufacturing
              </AlpmeraH1>
              
              <AlpmeraBodyText size="lg" className="max-w-2xl mx-auto">
                Alpmera transforms collective capital into production power. 
                Join institutional-grade batch campaigns with transparent orbital progress tracking.
              </AlpmeraBodyText>

              <div className="flex justify-center gap-4 mt-8">
                <AlpmeraButton variant="primary" size="lg">
                  Join Campaign
                </AlpmeraButton>
                <AlpmeraButton variant="secondary" size="lg">
                  View Vault
                </AlpmeraButton>
              </div>

              <div className="flex justify-center gap-8 mt-12">
                <AlpmeraBadge variant="copper">TRUSTED OPERATIONS</AlpmeraBadge>
                <AlpmeraBadge variant="outline">2026 READY</AlpmeraBadge>
              </div>
            </section>

            {/* Orbital Progress Hero */}
            <section className="py-16">
              <AlpmeraCard variant="elevated">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                  <div className="space-y-6">
                    <AlpmeraH2>Batch ALM-2401</AlpmeraH2>
                    <AlpmeraBodyText>
                      Industrial precision components manufactured through collective investment. 
                      Watch orbital progress as the batch reaches completion.
                    </AlpmeraBodyText>
                    <div className="flex gap-3">
                      <AlpmeraStatusTag status="progress">In Production</AlpmeraStatusTag>
                      <AlpmeraBadge variant="default">Q1 2026</AlpmeraBadge>
                    </div>
                    <AlpmeraButton variant="primary">Commit Funds</AlpmeraButton>
                  </div>
                  <div className="flex justify-center">
                    <OrbitalProgress progress={73} size="lg" label="Batch Progress">
                      <div className="w-24 h-24 rounded-full bg-[#0F2043] flex items-center justify-center">
                        <Layers className="w-12 h-12 text-[#F0EDE5]" />
                      </div>
                    </OrbitalProgress>
                  </div>
                </div>
              </AlpmeraCard>
            </section>

            {/* Features Grid */}
            <section className="space-y-8">
              <div className="text-center">
                <AlpmeraH2>Built for Trust & Precision</AlpmeraH2>
                <AlpmeraBodyText className="mt-4 max-w-2xl mx-auto">
                  Every detail designed for industrial-grade operational finance
                </AlpmeraBodyText>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <AlpmeraCard variant="elevated">
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-lg bg-[#0F2043] flex items-center justify-center">
                      <Box className="w-6 h-6 text-[#F0EDE5]" />
                    </div>
                    <AlpmeraH3>Locked Batches</AlpmeraH3>
                    <AlpmeraBodyText size="sm">
                      Capital pooled into production runs with transparent tracking and physical delivery
                    </AlpmeraBodyText>
                  </div>
                </AlpmeraCard>

                <AlpmeraCard variant="elevated">
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-lg bg-[#B87333] flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-[#F0EDE5]" />
                    </div>
                    <AlpmeraH3>Orbital Progress</AlpmeraH3>
                    <AlpmeraBodyText size="sm">
                      Visual momentum tracking with multi-ring halos and particle systems
                    </AlpmeraBodyText>
                  </div>
                </AlpmeraCard>

                <AlpmeraCard variant="elevated">
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-lg bg-[#4A5D4E] flex items-center justify-center">
                      <Briefcase className="w-6 h-6 text-[#F0EDE5]" />
                    </div>
                    <AlpmeraH3>Vault Security</AlpmeraH3>
                    <AlpmeraBodyText size="sm">
                      Institutional-grade custody with real-time batch composition analytics
                    </AlpmeraBodyText>
                  </div>
                </AlpmeraCard>
              </div>
            </section>
          </div>
        )}

        {/* Dashboard Example */}
        {currentView === 'dashboard' && (
          <div className="flex gap-6">
            <AlpmeraSidebar 
              items={[
                { label: 'Overview', href: '#', active: true },
                { label: 'Active Batches', href: '#' },
                { label: 'Campaigns', href: '#' },
                { label: 'Analytics', href: '#' },
                { label: 'Settings', href: '#' },
              ]}
            >
              <div className="space-y-2">
                <AlpmeraDataLabel label="Account" value="ALM-9472" />
              </div>
            </AlpmeraSidebar>

            <div className="flex-1 space-y-8">
              <div>
                <AlpmeraH2>Campaign Dashboard</AlpmeraH2>
                <AlpmeraBodyText className="mt-2">
                  Real-time batch monitoring with blueprint-style data visualization
                </AlpmeraBodyText>
              </div>

              {/* Metrics Row */}
              <AlpmeraCard variant="blueprint">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <AlpmeraMetricDisplay 
                    value="$3.2M"
                    label="Total Committed"
                    trend="up"
                    trendValue="8.4%"
                  />
                  <AlpmeraMetricDisplay 
                    value="12"
                    label="Active Batches"
                    trend="neutral"
                    trendValue="0%"
                  />
                  <AlpmeraMetricDisplay 
                    value="87%"
                    label="Avg Progress"
                    trend="up"
                    trendValue="5.2%"
                  />
                  <AlpmeraMetricDisplay 
                    value="4.2M"
                    label="Units Produced"
                    trend="up"
                    trendValue="12%"
                  />
                </div>
              </AlpmeraCard>

              {/* Active Batches */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AlpmeraCard variant="elevated">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold mb-1" style={{ color: '#0F2043' }}>Precision Components Batch</h4>
                        <p className="text-sm opacity-60">ALM-2401 • Started Jan 5, 2026</p>
                      </div>
                      <AlpmeraStatusTag status="progress">Active</AlpmeraStatusTag>
                    </div>
                    
                    <div className="flex justify-center py-4">
                      <OrbitalProgress progress={73} size="md" showParticles={true}>
                        <div className="w-16 h-16 rounded-full bg-[#0F2043] flex items-center justify-center">
                          <Layers className="w-8 h-8 text-[#F0EDE5]" />
                        </div>
                      </OrbitalProgress>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t" style={{ borderColor: 'rgba(15, 32, 67, 0.1)' }}>
                      <AlpmeraDataLabel label="Committed" value="$847K" />
                      <AlpmeraDataLabel label="Units" value="2,400" />
                    </div>

                    <AlpmeraButton variant="primary" className="w-full">
                      View Details
                    </AlpmeraButton>
                  </div>
                </AlpmeraCard>

                <AlpmeraCard variant="elevated">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold mb-1" style={{ color: '#0F2043' }}>Industrial Sensors Batch</h4>
                        <p className="text-sm opacity-60">ALM-2398 • Started Dec 28, 2025</p>
                      </div>
                      <AlpmeraStatusTag status="success">Complete</AlpmeraStatusTag>
                    </div>
                    
                    <div className="flex justify-center py-4">
                      <OrbitalProgress progress={100} size="md" showParticles={true}>
                        <div className="w-16 h-16 rounded-full bg-[#4A5D4E] flex items-center justify-center">
                          <Box className="w-8 h-8 text-[#F0EDE5]" />
                        </div>
                      </OrbitalProgress>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t" style={{ borderColor: 'rgba(15, 32, 67, 0.1)' }}>
                      <AlpmeraDataLabel label="Committed" value="$1.2M" />
                      <AlpmeraDataLabel label="Units" value="5,000" />
                    </div>

                    <AlpmeraButton variant="secondary" className="w-full">
                      Claim Output
                    </AlpmeraButton>
                  </div>
                </AlpmeraCard>
              </div>

              {/* Data Table */}
              <AlpmeraCard variant="blueprint">
                <h4 className="font-semibold mb-4" style={{ color: '#1B4D3E' }}>Recent Transactions</h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b" style={{ borderColor: 'rgba(27, 77, 62, 0.1)' }}>
                        <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: '#1B4D3E' }}>Batch ID</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: '#1B4D3E' }}>Type</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: '#1B4D3E' }}>Amount</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: '#1B4D3E' }}>Status</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold" style={{ color: '#1B4D3E' }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { id: 'ALM-2401', type: 'Commit', amount: '$50,000', status: 'success', date: 'Jan 18' },
                        { id: 'ALM-2398', type: 'Claim', amount: '$120,000', status: 'success', date: 'Jan 17' },
                        { id: 'ALM-2402', type: 'Commit', amount: '$75,000', status: 'progress', date: 'Jan 16' },
                      ].map((tx, i) => (
                        <tr key={i} className="border-b" style={{ borderColor: 'rgba(27, 77, 62, 0.05)' }}>
                          <td className="py-3 px-4">
                            <AlpmeraBadge variant="outline">{tx.id}</AlpmeraBadge>
                          </td>
                          <td className="py-3 px-4 text-sm" style={{ color: '#1B4D3E' }}>{tx.type}</td>
                          <td className="py-3 px-4 font-semibold" style={{ color: '#1B4D3E' }}>{tx.amount}</td>
                          <td className="py-3 px-4">
                            <AlpmeraStatusTag status={tx.status as any} size="sm">
                              {tx.status === 'success' ? 'Complete' : 'Pending'}
                            </AlpmeraStatusTag>
                          </td>
                          <td className="py-3 px-4 text-sm opacity-60">{tx.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </AlpmeraCard>
            </div>
          </div>
        )}

        {/* Vault Product Screen */}
        {currentView === 'vault' && (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <AlpmeraH1>Alpmera Vault</AlpmeraH1>
              <AlpmeraBodyText size="lg" className="max-w-2xl mx-auto">
                Secure institutional custody with real-time batch composition analytics
              </AlpmeraBodyText>
            </div>

            {/* Vault Overview */}
            <AlpmeraCard variant="blueprint">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                <AlpmeraMetricDisplay 
                  value="$4.8M"
                  label="Total Value"
                  trend="up"
                  trendValue="6.2%"
                />
                <AlpmeraMetricDisplay 
                  value="27"
                  label="Holdings"
                />
                <AlpmeraMetricDisplay 
                  value="12.4K"
                  label="Total Units"
                />
                <AlpmeraMetricDisplay 
                  value="99.8%"
                  label="Vault Health"
                  trend="up"
                  trendValue="0.1%"
                />
              </div>

              <div className="flex gap-3">
                <AlpmeraButton variant="primary">Add to Vault</AlpmeraButton>
                <AlpmeraButton variant="secondary">Withdraw</AlpmeraButton>
                <AlpmeraButton variant="ghost">Export Report</AlpmeraButton>
              </div>
            </AlpmeraCard>

            {/* Holdings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { batch: 'ALM-2401', name: 'Precision Components', units: 2400, value: '$847K', progress: 73, icon: Layers },
                { batch: 'ALM-2398', name: 'Industrial Sensors', units: 5000, value: '$1.2M', progress: 100, icon: Box },
                { batch: 'ALM-2399', name: 'Control Modules', units: 1800, value: '$624K', progress: 45, icon: BarChart3 },
                { batch: 'ALM-2400', name: 'Power Systems', units: 3200, value: '$1.1M', progress: 89, icon: TrendingUp },
                { batch: 'ALM-2397', name: 'Circuit Boards', units: 4500, value: '$980K', progress: 100, icon: Box },
                { batch: 'ALM-2402', name: 'Assembly Units', units: 2100, value: '$756K', progress: 58, icon: Layers },
              ].map((holding, i) => (
                <AlpmeraCard key={i} variant="elevated">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold mb-1" style={{ color: '#0F2043' }}>{holding.name}</h4>
                        <AlpmeraBadge variant="outline">{holding.batch}</AlpmeraBadge>
                      </div>
                      <AlpmeraStatusTag status={holding.progress === 100 ? 'success' : 'progress'} size="sm">
                        {holding.progress === 100 ? 'Ready' : 'Active'}
                      </AlpmeraStatusTag>
                    </div>

                    <div className="flex justify-center">
                      <OrbitalProgress progress={holding.progress} size="sm">
                        <div className="w-12 h-12 rounded-full bg-[#0F2043] flex items-center justify-center">
                          <holding.icon className="w-6 h-6 text-[#F0EDE5]" />
                        </div>
                      </OrbitalProgress>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3 border-t" style={{ borderColor: 'rgba(27, 77, 62, 0.1)' }}>
                      <AlpmeraDataLabel label="Value" value={holding.value} />
                      <AlpmeraDataLabel label="Units" value={holding.units.toLocaleString()} />
                    </div>
                  </div>
                </AlpmeraCard>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}