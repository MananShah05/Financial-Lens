"use client"
import { useState } from "react"
import StressTestPanel from "@/components/scenario/StressTestPanel"
import RollingCorrelationPanel from "@/components/scenario/RollingCorrelationPanel"
import RegressionPanel from "@/components/scenario/RegressionPanel"
import * as Icons from "@/components/scenario/Icons"

export default function ScenarioPage() {
  const [activeTab, setActiveTab] = useState<"stress" | "correlation" | "regression">("stress")

  return (
    <div className="min-h-screen bg-[#131315] text-[#e5e1e4] flex font-sans select-none antialiased">
      {/* Pro SideNavBar Navigation */}
      <aside className="w-64 h-screen fixed left-0 top-0 bg-[#201f22] border-r border-[#424754] flex flex-col pt-6 pb-20 z-50 font-sans">
        <div className="px-6 mb-8">
          <h1 className="text-xl font-bold text-on-surface tracking-tighter uppercase font-display">QUANT_ANALYSIS</h1>
          <p className="text-[10px] text-tertiary font-mono tracking-wider font-semibold mt-1">Live: NASDAQ Connected</p>
        </div>
        
        <nav className="flex-1 space-y-1">
          {/* Dashboard (Simulated / Disabled) */}
          <div className="flex items-center text-on-surface-variant/40 px-6 py-3 cursor-not-allowed">
            <Icons.Dashboard className="w-[18px] h-[18px] mr-3 opacity-40" />
            <span className="font-sans text-sm font-medium">Dashboard</span>
          </div>
 
          {/* Stress Test Tab */}
          <button
            onClick={() => setActiveTab("stress")}
            className={`w-full flex items-center px-6 py-3 transition-all text-left border-l-2 ${
              activeTab === "stress"
                ? "text-primary border-primary bg-[#282a2d] font-semibold"
                : "text-on-surface-variant border-transparent hover:bg-[#282a2d] hover:text-on-surface"
            }`}
          >
            <Icons.Analytics className="w-[18px] h-[18px] mr-3" />
            <span className="font-sans text-sm font-medium">Stress Test</span>
          </button>
 
          {/* Rolling Correlation Tab */}
          <button
            onClick={() => setActiveTab("correlation")}
            className={`w-full flex items-center px-6 py-3 transition-all text-left border-l-2 ${
              activeTab === "correlation"
                ? "text-primary border-primary bg-[#282a2d] font-semibold"
                : "text-on-surface-variant border-transparent hover:bg-[#282a2d] hover:text-on-surface"
            }`}
          >
            <Icons.Correlation className="w-[18px] h-[18px] mr-3" />
            <span className="font-sans text-sm font-medium">Correlation</span>
          </button>
 
          {/* OLS Regression Tab */}
          <button
            onClick={() => setActiveTab("regression")}
            className={`w-full flex items-center px-6 py-3 transition-all text-left border-l-2 ${
              activeTab === "regression"
                ? "text-primary border-primary bg-[#282a2d] font-semibold"
                : "text-on-surface-variant border-transparent hover:bg-[#282a2d] hover:text-on-surface"
            }`}
          >
            <Icons.Regression className="w-[18px] h-[18px] mr-3" />
            <span className="font-sans text-sm font-medium">Regression</span>
          </button>
 
          {/* Portfolio (Simulated) */}
          <div className="flex items-center text-on-surface-variant/40 px-6 py-3 cursor-not-allowed">
            <Icons.Portfolio className="w-[18px] h-[18px] mr-3 opacity-40" />
            <span className="font-sans text-sm font-medium">Portfolio</span>
          </div>
 
          {/* Settings (Simulated) */}
          <div className="flex items-center text-on-surface-variant/40 px-6 py-3 cursor-not-allowed">
            <Icons.Settings className="w-[18px] h-[18px] mr-3 opacity-40" />
            <span className="font-sans text-sm font-medium">Settings</span>
          </div>
        </nav>
 
        {/* Pro Export and status footer */}
        <div className="px-6 space-y-4">
          <button 
            onClick={() => alert("Institutional Report compiled for export!")}
            className="w-full bg-primary text-on-primary py-2 rounded-lg font-mono text-[10px] tracking-wider uppercase font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform hover:opacity-90 animate-none"
          >
            <Icons.Download className="w-3.5 h-3.5" />
            Export Report
          </button>
          
          <div className="pt-4 border-t border-[#424754] space-y-2.5 font-sans">
            <div className="flex items-center text-xs text-tertiary gap-2 font-medium">
              <Icons.CheckCircle className="w-3.5 h-3.5" />
              <span>Status: Stable</span>
            </div>
            <div className="flex items-center text-xs text-on-surface-variant gap-2 hover:text-primary cursor-pointer transition-colors font-medium" onClick={() => alert("Redirecting to system logs...")}>
              <Icons.Terminal className="w-3.5 h-3.5" />
              <span>System Logs</span>
            </div>
          </div>
        </div>
      </aside>


      {/* Pro Main Content Canvas */}
      <main className="ml-64 flex-1 min-h-screen flex flex-col overflow-x-hidden bg-[#131315]">
        {/* Pro TopNavBar Header */}
        <header className="fixed top-0 right-0 w-[calc(100%-256px)] h-16 border-b border-[#424754] bg-[#131315]/90 backdrop-blur-md z-40 flex items-center justify-between px-8">
          <div className="flex items-center gap-8">
            {/* Pro Search Box */}
            <div className="flex items-center gap-2.5 bg-[#2a2a2c] px-3 py-1.5 rounded-lg border border-[#424754]">
              <Icons.Search className="w-4 h-4 text-on-surface-variant" />
              <input 
                type="text" 
                placeholder="Search markets..." 
                className="bg-transparent border-none text-xs w-44 text-on-surface placeholder:text-on-surface-variant/60 focus:ring-0 focus:outline-none"
              />
            </div>
            
            {/* Pro Text Navigation Links */}
            <nav className="hidden md:flex gap-6 font-mono text-[10px] tracking-widest uppercase">
              <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Market Data</a>
              <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Economic Calendar</a>
              <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Risk Models</a>
            </nav>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <button className="p-2 text-on-surface-variant hover:text-primary transition-colors"><Icons.Notifications className="w-4.5 h-4.5" /></button>
              <button className="p-2 text-on-surface-variant hover:text-primary transition-colors"><Icons.History className="w-4.5 h-4.5" /></button>
              <button className="p-2 text-on-surface-variant hover:text-primary transition-colors"><Icons.Help className="w-4.5 h-4.5" /></button>
            </div>
            
            <div className="h-6 w-[1px] bg-[#424754]"></div>
            
            <button 
              onClick={() => alert("Scenario Analysis template initialized.")}
              className="bg-primary text-on-primary px-4 py-1.5 rounded-lg font-mono text-[10px] uppercase tracking-wider font-bold transition-all active:scale-95 hover:opacity-90"
            >
              Create Analysis
            </button>
            
            {/* Pro Analyst Profile Avatar image */}
            <div className="w-8 h-8 rounded-full overflow-hidden border border-[#8c909f] shadow-inner select-none">
              <img 
                alt="Analyst" 
                className="w-full h-full object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD8--L8Sf8kW7wm5MdBr2hM65Ni_HRgHPDreFVoPeq2ebI8_Ga8aPt6O1cxxpAfRzPJKE6hHUGOHOyoznf3fRffUNr4a17X9zi9BNCHRRm8WGCP4TM7-_xSYB4jaHT1bke3V3_06gd2rXgqe2HJiEMTBXHsOeTvyoOwBRirSwneXQZR8Wb0ffgl1FzrZoo4hmabYUU9hyoghEg_QDGzGBhGP0HiKTndRLlKW_mX0I7MhyWsPTI7IuRU1zIRvhCbqoG7-oeJoemo_7s"
              />
            </div>
          </div>
        </header>

        {/* Content Canvas */}
        <div className="p-8 pt-24 flex-1">
          {/* Breadcrumb section */}
          <div className="mb-6 font-mono text-[9px] uppercase tracking-wider flex items-center gap-1.5 text-on-surface-variant">
            <span>Analysis</span>
            <Icons.ChevronRight className="w-3 h-3 text-on-surface-variant" />
            <span className="text-on-surface">
              {activeTab === "stress" && "Stress Test Module"}
              {activeTab === "correlation" && "Rolling Correlation Module"}
              {activeTab === "regression" && "OLS Regression Module"}
            </span>
          </div>

          <div className="mb-6">
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-on-surface">
              {activeTab === "stress" && "Stress Test Module"}
              {activeTab === "correlation" && "Rolling Correlation Module"}
              {activeTab === "regression" && "OLS Regression Module"}
            </h2>
          </div>

          <div className="w-full">
            {activeTab === "stress" && <StressTestPanel />}
            {activeTab === "correlation" && <RollingCorrelationPanel />}
            {activeTab === "regression" && <RegressionPanel />}
          </div>
        </div>
      </main>
    </div>
  )
}
