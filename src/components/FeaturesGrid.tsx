import { FileText, CheckSquare, Mail, Clock } from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Meeting Summaries",
    description:
      "Upload meeting transcripts and get instant, comprehensive summaries. AI extracts key decisions, discussions, and outcomes automatically.",
    className: "md:col-span-2",
  },
  {
    icon: CheckSquare,
    title: "Action Items",
    description:
      "Never miss follow-ups. AI identifies and drafts clear action items with owners, deadlines, and priorities from your meetings.",
    className: "",
  },
  {
    icon: Mail,
    title: "Stakeholder Emails",
    description:
      "Generate professional stakeholder updates and meeting recaps. AI crafts contextually appropriate emails for different audiences.",
    className: "",
  },
  {
    icon: Clock,
    title: "Time Savings",
    description:
      "Transform hours of note-taking and follow-up work into minutes. Focus on strategy while AI handles the documentation.",
    className: "md:col-span-2",
  },
];

export default function FeaturesGrid() {
  return (
    <section className="py-24 px-6 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 scroll-fade">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="gradient-text">Eliminate</span> Meeting Busywork
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            AI that transforms meeting transcripts into actionable insights and
            professional communications.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className={`glass-card hover-glow hover-lift group cursor-pointer scroll-fade ${feature.className}`}
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="mb-6">
                  <div className="w-16 h-16 glass rounded-2xl flex items-center justify-center mb-4 group-hover:glow-primary transition-all duration-300">
                    <Icon className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-3 group-hover:gradient-text transition-all">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Hover border glow effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-border opacity-0 group-hover:opacity-100 transition-opacity -z-10"></div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
