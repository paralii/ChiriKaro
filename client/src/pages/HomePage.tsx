import { PublicNav } from '@/components/organisms/PublicNav';
import { HomeHero } from '@/components/organisms/HomeHero';
import { PortalStrip } from '@/components/organisms/PortalStrip';

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-surface px-[6.4%] max-[1050px]:px-[4%] max-md:px-5 max-[420px]:px-4">
      <PublicNav />
      <HomeHero />
      <PortalStrip />
      <footer className="flex justify-between border-t border-[#e5e4ec] pt-[17px] pb-5 text-[10px] text-[#858895]">
        <span>ChiriKaro <span className="px-[5px] text-[#b1b3bc]">/</span> Dental care, connected</span>
      </footer>
    </main>
  );
}