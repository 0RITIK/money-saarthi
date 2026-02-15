import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { FeatureShowcase } from "@/components/landing/FeatureShowcase";
import { AISection } from "@/components/landing/AISection";
import { FinalCTA } from "@/components/landing/FinalCTA";

const Landing = () => {
  return (
    <div className="bg-[#050816] min-h-screen overflow-x-hidden scroll-smooth">
      <LandingNavbar />
      <HeroSection />
      <HowItWorks />
      <FeatureShowcase />
      <AISection />
      <FinalCTA />
    </div>
  );
};

export default Landing;
