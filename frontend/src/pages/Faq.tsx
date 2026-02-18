import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqGroup {
  category: string;
  questions: FaqItem[];
}

export default function Faq() {
  const [openItem, setOpenItem] = useState<string | null>(null);

  const toggleAccordion = (id: string) => {
    setOpenItem(openItem === id ? null : id);
  };

  const faqData: FaqGroup[] = [
    {
      category: "Getting Started",
      questions: [
        {
          question: "How do I create my first content plan?",
          answer:
            "Navigate to the dashboard and click on 'Create Plan'. Follow the guided steps to generate and organize your content strategy.",
        },
        {
          question: "Can I edit a plan after generating it?",
          answer:
            "Yes, all generated plans are fully editable. You can update, refine, and reorganize content at any time.",
        },
      ],
    },
    {
      category: "Content Management",
      questions: [
        {
          question: "How do I track content status?",
          answer:
            "Each content item includes a status indicator such as Draft, In Review, or Published. You can update the status manually.",
        },
        {
          question: "Can I collaborate with my team?",
          answer:
            "Yes, you can share plans and collaborate with team members depending on your subscription level.",
        },
      ],
    },
    {
      category: "Billing & Subscription",
      questions: [
        {
          question: "What subscription plans are available?",
          answer:
            "We offer Free, Pro, and Enterprise plans with varying levels of access and collaboration features.",
        },
        {
          question: "Can I upgrade or downgrade my plan?",
          answer:
            "Yes, you can change your subscription at any time from the billing settings page.",
        },
      ],
    },
  ];

  return (
    <main className="flex-1 overflow-y-auto bg-gray-50/50 p-2.5 md:p-6 relative">
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-8%] left-[-4%] w-[34%] h-[34%] bg-gradient-to-br from-[#6fb6e8]/15 to-[#3fa9f5]/12 rounded-full blur-[80px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[36%] h-[36%] bg-gradient-to-tl from-[#81bad1]/13 to-[#a78bfa]/10 rounded-full blur-[85px] animate-pulse" style={{ animationDelay: '800ms' }} />
      </div>
      <section className="w-full bg-white border border-slate-200/60 rounded-[2rem] shadow-sm overflow-hidden flex flex-col h-full relative z-10">

        <div className="px-8 py-8 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 border-b border-slate-700 flex flex-col gap-2 relative overflow-hidden">
          <HelpCircle className="absolute top-4 right-8 text-blue-400/10 w-32 h-32 rotate-12 pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full w-fit text-[10px] font-bold uppercase tracking-widest border border-blue-500/20 mb-3">
              Support Center
            </div>
            <h2 className="text-2xl font-black text-white">Knowledge Base</h2>
            <p className="mt-1 text-sm font-medium text-slate-400">Everything you need to know about navigating your content engine.</p>
          </div>
        </div>

        {/* FAQ Content */}
        <div className="p-4 md:p-6 space-y-8">
          {faqData.map((group, groupIndex) => (
            <div key={groupIndex}>
              <div className="text-sm md:text-md font-semibold mb-4 text-slate-800 tracking-tight">
                {group.category}
              </div>

              <div className="space-y-3">
                {group.questions.map((item, itemIndex) => {
                  const id = `${groupIndex}-${itemIndex}`;
                  const isOpen = openItem === id;

                  return (
                    <div
                      key={itemIndex}
                      className={`border border-slate-200 rounded-xl overflow-hidden transition-all duration-300 ${isOpen ? "shadow-md ring-1 ring-[#3fa9f5]/20" : "hover:shadow-sm"
                        }`}
                    >
                      <button
                        onClick={() => toggleAccordion(id)}
                        className="w-full flex items-center justify-between p-4 text-left bg-white transition-colors hover:bg-slate-50/50"
                      >
                        <div className={`text-sm md:text-md transition-colors ${isOpen ? "text-[#3fa9f5]" : "text-slate-900"}`}>
                          {item.question}
                        </div>
                        <ChevronDown
                          className={`w-5 h-5 text-slate-400 transition-transform duration-300 ease-in-out ${isOpen ? "rotate-180 text-[#3fa9f5]" : ""}`}
                        />
                      </button>

                      {/* Content Area */}
                      <div
                        className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                          }`}
                      >
                        <div className="p-4 pt-0 text-sm md:text-md text-slate-600 leading-relaxed border-t border-slate-100/50">
                          {item.answer}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}