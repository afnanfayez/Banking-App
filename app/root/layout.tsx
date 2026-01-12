import Sidebar from "@/components/ui/ui/Sidebar";


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const loggedIn = {
    firstName: 'Adrien', lastName: 'DUPONT'
  }
  return (<main className="flex h-screen w-full font-inter">
    <Sidebar user={loggedIn as any} />
    {children}
  </main>
  );
}
