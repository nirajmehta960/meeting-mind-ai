import { Button } from "@/components/ui/button";
import { Check, Zap } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "$29",
    period: "per month",
    description: "Perfect for individual PMs and small teams",
    features: [
      "5 PRD generations per month",
      "Basic priority matrix",
      "Email support",
      "Core integrations",
      "Up to 3 team members"
    ],
    popular: false
  },
  {
    name: "Pro",
    price: "$99", 
    period: "per month",
    description: "For growing product teams that need more power",
    features: [
      "Unlimited PRD generations",
      "Advanced analytics dashboard",
      "Custom roadmap templates", 
      "Priority chat support",
      "Up to 15 team members",
      "API access",
      "Advanced integrations",
      "User research analysis"
    ],
    popular: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "pricing",
    description: "For large organizations with advanced needs",
    features: [
      "Everything in Pro",
      "Unlimited team members",
      "Custom AI training",
      "Dedicated success manager",
      "SSO & advanced security",
      "Custom integrations",
      "SLA guarantees",
      "On-premise deployment"
    ],
    popular: false
  }
];

export default function PricingSection() {
  return (
    <section className="py-24 px-6 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 scroll-fade">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Simple, <span className="gradient-text">Transparent</span> Pricing
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that scales with your product team's ambitions.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div 
              key={index}
              className={`relative glass-card hover-lift transition-all duration-500 scroll-fade ${
                plan.popular ? 'ring-2 ring-primary scale-105' : ''
              }`}
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 animate-pulse-glow">
                    <Zap className="w-4 h-4" />
                    Most Popular
                  </div>
                </div>
              )}
              
              <div className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold gradient-text">{plan.price}</span>
                    {plan.price !== "Custom" && <span className="text-muted-foreground">/{plan.period}</span>}
                  </div>
                  <p className="text-muted-foreground">{plan.description}</p>
                </div>
                
                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <Button 
                  variant={plan.popular ? "hero" : "glass"} 
                  className="w-full"
                  size="lg"
                >
                  {plan.name === "Enterprise" ? "Contact Sales" : "Get Started"}
                </Button>
              </div>
              
              {/* Gradient border effect for popular plan */}
              {plan.popular && (
                <div className="absolute inset-0 rounded-2xl bg-gradient-border opacity-50 -z-10 blur-sm"></div>
              )}
            </div>
          ))}
        </div>
        
        <div className="text-center mt-16 scroll-fade">
          <p className="text-muted-foreground mb-4">
            All plans include a 14-day free trial • No credit card required
          </p>
          <div className="flex justify-center items-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" />
              99.9% uptime SLA
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" />
              Cancel anytime
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" />
              SOC 2 compliant
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}