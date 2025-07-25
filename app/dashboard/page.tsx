import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TemplatesList from "@/components/TemplatesList";
import Link from "next/link";

export default async function Dashboard() {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.getClaims();
    if (error || !data?.claims) {
        redirect("/auth/login");
    }

    return (
        <div className="space-y-12">
            {/* Header Section */}
            <div className="flex justify-between items-start">
                <div className="space-y-3">
                    <h1 className="text-4xl font-bold text-foreground tracking-tight">
                        Mock Interviews
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
                        Practice with AI-powered interview sessions tailored to your target role and company
                    </p>
                </div>
                <Link
                    href="/interview"
                    className="bg-primary text-primary-foreground px-6 py-2.5 rounded-full text-sm font-medium hover:bg-primary/90 transition-all duration-200"
                >
                    Start Custom Interview
                </Link>
            </div>

            {/* Templates Section */}
            <div className="space-y-8">
                <div className="flex items-center gap-4">
                    <div className="w-1 h-10 bg-primary rounded-full"></div>
                    <h2 className="text-3xl font-bold text-foreground">Interview Templates</h2>
                </div>
                <TemplatesList />
            </div>
        </div>
    );
}