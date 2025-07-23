import { createClient } from '@/lib/supabase/server'

export default async function TemplatesList() {
    const supabase = await createClient()
    const { data: templates } = await supabase
        .from('interview_templates')
        .select('*')
        .eq('is_default', true)

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-6xl">
            {templates?.map((template) => (
                <div key={template.id} className="border rounded-lg p-4">
                    <h3 className="font-semibold">{template.name}</h3>
                    <p className="text-sm text-gray-600">
                        {template.company} • {template.role} • {template.level}
                    </p>
                    <p className="text-sm">{template.description}</p>
                </div>
            ))}
        </div>
    )
}