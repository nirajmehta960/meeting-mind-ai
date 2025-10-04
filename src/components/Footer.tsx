import { Brain, Github, Twitter, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="py-20 px-6 border-t border-white/10">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold gradient-text">MeetingAI</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              AI-powered meeting assistant that transforms transcripts into
              actionable insights and professional communications.
            </p>
          </div>

          {/* Features */}
          <div>
            <h4 className="font-semibold mb-4">Features</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Meeting Summaries
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Action Items
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Stakeholder Emails
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Follow-up Planning
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Privacy
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Data Security
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Cookies
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/10">
          <p className="text-sm text-muted-foreground mb-4 md:mb-0">
            © 2024 MeetingAI. All rights reserved.
          </p>

          <div className="flex items-center gap-4">
            <a
              href="#"
              className="w-9 h-9 glass rounded-lg flex items-center justify-center hover:scale-105 transition-transform"
            >
              <Twitter className="w-4 h-4 text-muted-foreground hover:text-primary" />
            </a>
            <a
              href="#"
              className="w-9 h-9 glass rounded-lg flex items-center justify-center hover:scale-105 transition-transform"
            >
              <Github className="w-4 h-4 text-muted-foreground hover:text-primary" />
            </a>
            <a
              href="#"
              className="w-9 h-9 glass rounded-lg flex items-center justify-center hover:scale-105 transition-transform"
            >
              <Linkedin className="w-4 h-4 text-muted-foreground hover:text-primary" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
