import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardContent } from "./DashboardContent";

export default async function Dashboard() {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.getClaims();
    if (error || !data?.claims) {
        redirect("/auth/login");
    }

    // Fetch templates data in the server component
    const { data: templates } = await supabase
        .from('interview_templates')
        .select('*')
        .eq('is_default', true);

    return <DashboardContent templates={templates} />;
}