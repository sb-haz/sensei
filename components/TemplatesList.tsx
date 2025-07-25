import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function TemplatesList() {
    const supabase = await createClient();
    const { data: templates } = await supabase
        .from('interview_templates')
        .select('*')
        .eq('is_default', true);

    const difficultyColors = {
        Easy: 'bg-green-50 text-green-600 border-green-200',
        Medium: 'bg-yellow-50 text-yellow-600 border-yellow-200',
        Hard: 'bg-red-50 text-red-600 border-red-200'
    };

    const topicColors = {
        Technical: 'bg-blue-50 text-blue-600 border-blue-200',
        Behavioral: 'bg-purple-50 text-purple-600 border-purple-200',
        'System Design': 'bg-indigo-50 text-indigo-600 border-indigo-200',
        Cloud: 'bg-cyan-50 text-cyan-600 border-cyan-200'
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            {templates?.map((template) => (
                <div key={template.id} className="group bg-card rounded-xl p-6 hover:shadow-sm transition-all duration-200 border border-border">
                    <div className="mb-6">
                        <div className="flex items-start justify-between mb-4">
                            <h3 className="font-semibold text-lg text-foreground leading-tight">{template.name}</h3>
                            <div className="text-xl opacity-70 group-hover:opacity-100 transition-opacity">
                                {template.topic === 'Technical' ? '💻' : 
                                 template.topic === 'Behavioral' ? '🤝' :
                                 template.topic === 'System Design' ? '🏗️' : '☁️'}
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                            {template.company && (
                                <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs rounded-full border border-primary/20 font-medium">
                                    {template.company}
                                </span>
                            )}
                            <span className="px-2.5 py-1 bg-accent text-accent-foreground text-xs rounded-full border border-border font-medium">
                                {template.level}
                            </span>
                            <span className={`px-2.5 py-1 text-xs rounded-full border font-medium ${difficultyColors[template.difficulty as keyof typeof difficultyColors] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                {template.difficulty}
                            </span>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-1 font-medium">{template.role}</p>
                        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{template.description}</p>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <span>⏱️</span>
                                <span>{template.duration_minutes} min</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span>❓</span>
                                <span>{template.number_of_questions} questions</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Link
                            href={`/interview?template=${template.id}`}
                            className="flex-1 bg-primary text-primary-foreground py-2.5 px-4 rounded-full text-sm font-medium hover:bg-primary/90 transition-all duration-200 text-center"
                        >
                            Start Interview
                        </Link>
                        <Link
                            href={`/interview?template=${template.id}&modify=true`}
                            className="flex-1 border border-border bg-card text-foreground py-2.5 px-4 rounded-full text-sm font-medium hover:bg-accent transition-all duration-200 text-center"
                        >
                            Customize
                        </Link>
                    </div>
                </div>
            ))}
        </div>
    );
}