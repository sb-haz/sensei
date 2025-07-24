import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function TemplatesList() {
    const supabase = await createClient();
    const { data: templates } = await supabase
        .from('interview_templates')
        .select('*')
        .eq('is_default', true);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            {templates?.map((template) => (
                <div key={template.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="mb-4">
                        <h3 className="font-semibold text-lg mb-2">{template.name}</h3>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {template.company && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                    {template.company}
                                </span>
                            )}
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                {template.level}
                            </span>
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                {template.difficulty}
                            </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{template.role}</p>
                        <p className="text-sm text-gray-700 mb-4">{template.description}</p>
                        <div className="text-xs text-gray-500 mb-4">
                            {template.duration_minutes} min • {template.number_of_questions} questions
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Link
                            href={`/interview?template=${template.id}`}
                            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors text-center"
                        >
                            Start Interview
                        </Link>
                        <Link
                            href={`/interview?template=${template.id}&modify=true`}
                            className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors text-center"
                        >
                            Modify
                        </Link>
                    </div>
                </div>
            ))}
        </div>
    );
}