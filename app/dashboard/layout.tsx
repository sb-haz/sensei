import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <main className="min-h-screen flex flex-col">
            {/* <Navbar /> */}
            <div className="flex flex-1">
                <Sidebar />
                <div className="flex-1 p-6">
                    {children}
                </div>
            </div>
        </main>
    );
}