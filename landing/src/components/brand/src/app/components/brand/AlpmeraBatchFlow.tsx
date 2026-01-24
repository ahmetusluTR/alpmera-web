import React from 'react';
import { Users, TrendingUp, Package, CheckCircle, ArrowLeft } from 'lucide-react';

interface FlowStep {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  accumulation?: number; // 0-100 percentage for visual "filling"
  isAlternate?: boolean; // For the refund path
}

export function AlpmeraBatchFlow() {
  const steps: FlowStep[] = [
    {
      number: '01',
      title: 'Campaign Opens',
      description: 'Manufacturing batch announced with transparent pricing and timeline',
      icon: <Package className="w-6 h-6" />,
      accumulation: 0
    },
    {
      number: '02',
      title: 'Capital Commits',
      description: 'Buyers commit funds—vessel fills as collective capital accumulates',
      icon: <Users className="w-6 h-6" />,
      accumulation: 65
    },
    {
      number: '03',
      title: 'Batch Locks & Produces',
      description: 'Threshold reached—production begins with orbital progress tracking',
      icon: <TrendingUp className="w-6 h-6" />,
      accumulation: 85
    },
    {
      number: '04',
      title: 'Fulfillment',
      description: 'Completed units distributed proportionally to committed capital',
      icon: <CheckCircle className="w-6 h-6" />,
      accumulation: 100
    },
    {
      number: '05',
      title: 'Threshold Miss → Refund',
      description: "If campaign doesn't reach minimum, all funds automatically returned",
      icon: <ArrowLeft className="w-6 h-6" />,
      accumulation: 30,
      isAlternate: true
    }
  ];

  return (
    <div className="relative">
      {/* Main Pipeline Flow (Steps 1-4) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        {steps.slice(0, 4).map((step, index) => (
          <div key={step.number} className="relative">
            {/* Vessel/Container */}
            <div className="relative">
              {/* Step Number Badge */}
              <div 
                className="absolute -top-3 -left-3 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold z-10"
                style={{ 
                  backgroundColor: '#C9A962',
                  color: '#1B4D3E',
                  fontFamily: 'Inter, sans-serif'
                }}
              >
                {step.number}
              </div>

              {/* Industrial Vessel/Tank */}
              <div 
                className="relative h-48 rounded-lg border-2 overflow-hidden"
                style={{ 
                  borderColor: '#1B4D3E',
                  backgroundColor: '#FFFFFF'
                }}
              >
                {/* Fill Level - Accumulation Visual */}
                <div 
                  className="absolute bottom-0 left-0 right-0 transition-all duration-1000"
                  style={{ 
                    height: `${step.accumulation}%`,
                    backgroundColor: '#3A6B5A',
                    opacity: 0.15
                  }}
                />
                
                {/* Particles/Dots showing accumulation */}
                {step.accumulation > 0 && (
                  <div className="absolute inset-0 flex items-end justify-center pb-4">
                    <div className="flex gap-1 flex-wrap justify-center max-w-[80%]">
                      {Array.from({ length: Math.floor(step.accumulation / 10) }).map((_, i) => (
                        <div
                          key={i}
                          className="w-2 h-2 rounded-full"
                          style={{ 
                            backgroundColor: '#1B4D3E',
                            opacity: 0.4,
                            animation: `float ${1 + i * 0.2}s ease-in-out infinite`
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Icon at center */}
                <div 
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ color: '#1B4D3E' }}
                >
                  {step.icon}
                </div>

                {/* Top rim of vessel */}
                <div 
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: '#1B4D3E' }}
                />
              </div>

              {/* Content below vessel */}
              <div className="mt-6 space-y-2">
                <h4 
                  className="font-semibold text-base"
                  style={{ 
                    color: '#1B4D3E',
                    fontFamily: 'Libre Baskerville, serif'
                  }}
                >
                  {step.title}
                </h4>
                <p 
                  className="text-sm leading-relaxed"
                  style={{ 
                    color: '#1B4D3E',
                    opacity: 0.7,
                    fontFamily: 'Inter, sans-serif'
                  }}
                >
                  {step.description}
                </p>
              </div>
            </div>

            {/* Connecting Pipe/Conduit */}
            {index < 3 && (
              <div className="hidden md:block absolute top-24 -right-4 w-8 h-0.5" style={{ backgroundColor: '#1B4D3E', opacity: 0.3 }}>
                {/* Flow arrow */}
                <div 
                  className="absolute -right-1 -top-1 w-2 h-2 rotate-45"
                  style={{ 
                    borderRight: '2px solid #1B4D3E',
                    borderTop: '2px solid #1B4D3E',
                    opacity: 0.3
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Alternative Path - Refund Branch */}
      <div className="relative pt-8">
        {/* Branch Line from Step 2/3 area */}
        <div className="absolute top-0 left-1/2 w-0.5 h-8 -translate-x-1/2" style={{ backgroundColor: '#C9A962', opacity: 0.4 }} />
        
        <div 
          className="max-w-md mx-auto p-6 rounded-lg border-2"
          style={{ 
            borderColor: '#C9A962',
            backgroundColor: 'rgba(201, 169, 98, 0.05)',
            borderStyle: 'dashed'
          }}
        >
          <div className="flex items-start gap-4">
            {/* Step Number Badge */}
            <div 
              className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ 
                backgroundColor: '#C9A962',
                color: '#1B4D3E',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              {steps[4].number}
            </div>

            {/* Icon */}
            <div 
              className="flex-shrink-0 mt-1"
              style={{ color: '#C9A962' }}
            >
              {steps[4].icon}
            </div>

            {/* Content */}
            <div className="flex-1 space-y-2">
              <h4 
                className="font-semibold text-base"
                style={{ 
                  color: '#1B4D3E',
                  fontFamily: 'Libre Baskerville, serif'
                }}
              >
                {steps[4].title}
              </h4>
              <p 
                className="text-sm leading-relaxed"
                style={{ 
                  color: '#1B4D3E',
                  opacity: 0.7,
                  fontFamily: 'Inter, sans-serif'
                }}
              >
                {steps[4].description}
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-4px);
          }
        }
      `}</style>
    </div>
  );
}