import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <main className="min-h-screen bg-white">
            <Sidebar />
            <div className="ml-96 mr-8 py-12">
                <div className="max-w-6xl">
                    {children}
                </div>
            </div>
        </main>
    );
}