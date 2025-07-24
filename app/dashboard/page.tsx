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
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Mock Interviews</h1>
                    <p className="text-gray-600 mt-2">Practice with AI-powered interview sessions</p>
                </div>
                <Link
                    href="/interview"
                    className="bg-green-600 text-white px-6 py-3 rounded-md font-medium hover:bg-green-700 transition-colors"
                >
                    New Custom Interview
                </Link>
            </div>

            <div>
                <h2 className="text-xl font-semibold mb-4">Choose an Interview Template</h2>
                <TemplatesList />
            </div>
        </div>
    );
}