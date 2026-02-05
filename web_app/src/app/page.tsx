"use client"

import { HeroSection } from "@/components/home/HeroSection";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Features } from "@/components/home/Features";

const Index = () => {
  return (
    <div className="min-h-screen">
      <main>
        <HeroSection />
        <HowItWorks />
        <Features />
      </main>
    </div>
  );
};

export default Index;
