"use client"

import { AskUserQuestion, type AskUserQuestionInput } from "@/components/agents/ask-user-question"
import { toast } from "@/components/ui/toast"

const input: AskUserQuestionInput = {
  questions: [
    {
      header: "Format",
      multiSelect: false,
      options: [
        { description: "Brief overview", label: "Summary" },
        { description: "Full explanation", label: "Detailed" },
      ],
      question: "How should I format the output?",
    },
    {
      header: "Sections",
      multiSelect: true,
      options: [
        { description: "Opening context", label: "Introduction" },
        { description: "Final summary", label: "Conclusion" },
      ],
      question: "Which sections should I include?",
    },
  ],
}

export function AskUserQuestionDemo() {
  return (
    <AskUserQuestion
      input={input}
      onAnswer={(answers) =>
        toast.add({
          title: Object.values(answers).join(" · "),
          type: "success",
        })
      }
    />
  )
}
