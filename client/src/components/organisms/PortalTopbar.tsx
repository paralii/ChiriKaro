export function PortalTopbar({ title, userName }: { title: string; userName: string }) {
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  return (
    <header className="flex min-h-[58px] items-center justify-between border-b border-[#e8e9ef] bg-white px-[34px] max-[1050px]:px-[23px] max-md:min-h-12 max-md:px-4">
      <div className="text-[11px] text-[#777b89]">ChiriKaro <span className="px-[9px] text-[#b6b8c1]">/</span> {title}</div>
      <div className="flex items-center gap-[9px]">
        <span className="mr-2 text-[10px] text-[#858996] max-md:hidden">{today}</span>
        <span className="grid size-7 place-items-center rounded-full bg-[#e8efff] text-[11px] font-bold text-[#214994]">{userName.slice(0, 1).toUpperCase()}</span>
        <span className="max-w-[140px] truncate text-[11px] font-semibold">{userName}</span>
      </div>
    </header>
  );
}