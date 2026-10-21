"use client"

import * as React from "react"

import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoices,
  QuestionnaireError,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSubmit,
  QuestionnaireTitle,
} from "@/components/ui/questionnaire"

// Claude's AskUserQuestion input, as the Agent SDK types it: one to four questions of two to four options each
export type AskUserQuestionInput = {
  questions: {
    header: string
    multiSelect: boolean
    options: { description: string; label: string; preview?: string }[]
    question: string
  }[]
}

// Each answer keyed by its question, a picked label or the human's own text, several joined by commas
export type AskUserQuestionAnswers = Record<string, string>

export function AskUserQuestion({
  input,
  onAnswer,
}: {
  input: AskUserQuestionInput
  onAnswer: (answers: AskUserQuestionAnswers) => void
}) {
  const items = input.questions.map((question) => ({
    choices: question.options.map((option) => ({ value: option.label })),
    multiple: question.multiSelect,
    name: question.question,
    required: true,
  }))

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    onAnswer(
      Object.fromEntries(
        input.questions.map((question) => [
          question.question,
          formData.getAll(question.question).join(", "),
        ]),
      ),
    )
  }

  return (
    <Questionnaire
      className="mx-auto max-w-md"
      defaultItem={items[0]?.name}
      items={items}
      shortcuts="letters"
      onSubmit={handleSubmit}
    >
      <QuestionnaireProgress />
      {input.questions.map((question) => (
        <QuestionnaireItem
          key={question.question}
          multiple={question.multiSelect}
          name={question.question}
          required
        >
          <QuestionnaireTitle>{question.question}</QuestionnaireTitle>
          <QuestionnaireChoices>
            {question.options.map((option) => (
              <QuestionnaireChoice key={option.label} value={option.label}>
                <span className="font-medium">{option.label}</span>
                <span className="text-muted-foreground">{option.description}</span>
              </QuestionnaireChoice>
            ))}
            <QuestionnaireInput aria-label="Other" placeholder="Other…" />
          </QuestionnaireChoices>
          <QuestionnaireError />
        </QuestionnaireItem>
      ))}
      <QuestionnaireActions>
        <QuestionnairePrevious />
        <QuestionnaireNext>Next</QuestionnaireNext>
        <QuestionnaireSubmit>Submit</QuestionnaireSubmit>
      </QuestionnaireActions>
    </Questionnaire>
  )
}
