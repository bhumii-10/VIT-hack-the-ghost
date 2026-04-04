import React from 'react';
import EmergencyContacts from '../components/EmergencyContacts';
import SeismicSimulator from '../components/SeismicSimulator';

const EmergencyPage = () => {
    return (
        <div className="min-h-screen pt-24 px-4 pb-12 flex flex-col items-center relative">
            {/* Subtle overlay to enhance readability without blocking Earth view */}
            <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-red-900/10 via-transparent to-black/20 z-0" />

            <div className="relative z-10 w-full max-w-5xl">
                <div className="mb-12 text-center space-y-4">
                    <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter drop-shadow-2xl">
                        Emergency<span className="text-red-600">.SOS</span>
                    </h1>
                    <p className="text-lg text-gray-300 max-w-2xl mx-auto border-l-4 border-red-600 pl-4 py-2 bg-black/60 backdrop-blur-md rounded-r-lg shadow-2xl">
                        Direct uplink to emergency services using Twilio Voice Gateway.
                        <br />
                        <span className="text-xs font-mono text-red-400 uppercase">
                            Warning: For Demonstration & Testing Purposes Only
                        </span>
                    </p>
                </div>

                <div className="bg-black/30 backdrop-blur-xl border border-white/20 rounded-3xl p-6 md:p-12 shadow-2xl space-y-8">
                    {/* Judge Control Panel - Only visible for demo */}
                    <div className="border border-yellow-500/30 bg-yellow-900/10 rounded-xl p-1 relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-yellow-500/20 text-yellow-200 text-[10px] px-2 py-0.5 rounded-bl">TEST MODE</div>
                        <SeismicSimulator />
                    </div>

                    <EmergencyContacts />
                </div>
            </div>
        </div>
    );
};

export default EmergencyPage;
