import Footer from "@/components/footer/footer";
import Header from "@/components/header/header";
import BottomDock from "@/components/ui/bottom-dock";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header className="h-20" />
      <div className="h-[4.8rem] " />
      <main className="pb-20 md:pb-0">
        {children}
      </main>
      <Footer />
      <BottomDock />
    </>
  );
}
