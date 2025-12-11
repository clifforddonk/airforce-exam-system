// app/admin/questions/page.tsx
"use client";

import { useState } from "react";
import {
  useQuestions,
  useCreateBulkQuestions,
  useUpdateQuestion,
  useDeleteQuestion,
  type Question,
} from "@/hooks/useQuestions";
import { TOPICS } from "@/lib/topicsConfig";

// Local question type (without _id for new questions)
type LocalQuestion = Omit<Question, "_id" | "category"> & {
  _id?: string;
  isNew?: boolean;
};

export default function AdminQuestionsPage() {
  const [selectedTopic, setSelectedTopic] = useState(TOPICS[0].id);
  const [showForm, setShowForm] = useState(false);
  const [localQuestions, setLocalQuestions] = useState<LocalQuestion[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // React Query hooks
  const { data: savedQuestions = [], isLoading } = useQuestions(selectedTopic);
  const createBulkMutation = useCreateBulkQuestions();
  const updateMutation = useUpdateQuestion();
  const deleteMutation = useDeleteQuestion();

  // Form state
  const [formData, setFormData] = useState({
    question: "",
    option1: "",
    option2: "",
    option3: "",
    option4: "",
    correctAnswer: 0,
  });

  const resetForm = () => {
    setFormData({
      question: "",
      option1: "",
      option2: "",
      option3: "",
      option4: "",
      correctAnswer: 0,
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleAddQuestion = () => {
    // Validate
    if (
      !formData.question.trim() ||
      !formData.option1.trim() ||
      !formData.option2.trim()
    ) {
      alert("Please fill in question and at least 2 options");
      return;
    }

    // Build options array (only non-empty options)
    const options = [
      formData.option1,
      formData.option2,
      formData.option3,
      formData.option4,
    ].filter((opt) => opt.trim() !== "");

    if (formData.correctAnswer >= options.length) {
      alert("Correct answer index is invalid");
      return;
    }

    const newQuestion: LocalQuestion = {
      question: formData.question,
      options,
      correctAnswer: formData.correctAnswer,
      isNew: true,
    };

    setLocalQuestions([...localQuestions, newQuestion]);
    resetForm();
  };

  const handleEditLocal = (index: number) => {
    const q = localQuestions[index];
    setFormData({
      question: q.question,
      option1: q.options[0] || "",
      option2: q.options[1] || "",
      option3: q.options[2] || "",
      option4: q.options[3] || "",
      correctAnswer: q.correctAnswer,
    });
    setEditingId(`local-${index}`);
    setShowForm(true);
  };

  const handleUpdateLocal = (index: number) => {
    const options = [
      formData.option1,
      formData.option2,
      formData.option3,
      formData.option4,
    ].filter((opt) => opt.trim() !== "");

    const updated = [...localQuestions];
    updated[index] = {
      question: formData.question,
      options,
      correctAnswer: formData.correctAnswer,
      isNew: true,
    };

    setLocalQuestions(updated);
    resetForm();
  };

  const handleDeleteLocal = (index: number) => {
    setLocalQuestions(localQuestions.filter((_, i) => i !== index));
  };

  const handleEditSaved = (question: Question) => {
    setFormData({
      question: question.question,
      option1: question.options[0] || "",
      option2: question.options[1] || "",
      option3: question.options[2] || "",
      option4: question.options[3] || "",
      correctAnswer: question.correctAnswer,
    });
    setEditingId(question._id!);
    setShowForm(true);
  };

  const handleUpdateSaved = () => {
    if (!editingId) return;

    const options = [
      formData.option1,
      formData.option2,
      formData.option3,
      formData.option4,
    ].filter((opt) => opt.trim() !== "");

    updateMutation.mutate({
      id: editingId,
      data: {
        question: formData.question,
        options,
        correctAnswer: formData.correctAnswer,
        category: selectedTopic,
      },
    });

    resetForm();
  };

  const handleDeleteSaved = (id: string) => {
    if (confirm("Delete this question from database?")) {
      deleteMutation.mutate({ id, category: selectedTopic });
    }
  };

  const handleSaveAll = () => {
    if (localQuestions.length === 0) return;

    createBulkMutation.mutate(
      {
        category: selectedTopic,
        questions: localQuestions.map(({ isNew, ...q }) => q),
      },
      {
        onSuccess: () => {
          setLocalQuestions([]);
          alert("Questions saved successfully!");
        },
      }
    );
  };

  const handleTopicChange = (topicId: string) => {
    if (localQuestions.length > 0) {
      if (!confirm("You have unsaved questions. Switch topic anyway?")) {
        return;
      }
      setLocalQuestions([]);
    }
    setSelectedTopic(topicId);
    resetForm();
  };

  const handleFormSubmit = () => {
    if (editingId?.startsWith("local-")) {
      const index = parseInt(editingId.split("-")[1]);
      handleUpdateLocal(index);
    } else if (editingId) {
      handleUpdateSaved();
    } else {
      handleAddQuestion();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Manage Quiz Questions
        </h1>

        {/* Topic Selector */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Select Topic
          </label>
          <select
            value={selectedTopic}
            onChange={(e) => handleTopicChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
          >
            {TOPICS.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.label}
              </option>
            ))}
          </select>
        </div>

        {/* Add Question Button */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="mb-6 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            + Add New Question
          </button>
        )}

        {/* Question Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingId ? "Edit Question" : "Create New Question"}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Question */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Question *
                </label>
                <input
                  type="text"
                  value={formData.question}
                  onChange={(e) =>
                    setFormData({ ...formData, question: e.target.value })
                  }
                  placeholder="Enter your question"
                  className="w-full px-4 py-2 border text-gray-700 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-600"
                />
              </div>

              {/* Options */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Option 1 *
                  </label>
                  <input
                    type="text"
                    value={formData.option1}
                    onChange={(e) =>
                      setFormData({ ...formData, option1: e.target.value })
                    }
                    placeholder="First option"
                    className="w-full px-4 py-2  text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Option 2 *
                  </label>
                  <input
                    type="text"
                    value={formData.option2}
                    onChange={(e) =>
                      setFormData({ ...formData, option2: e.target.value })
                    }
                    placeholder="Second option"
                    className="w-full px-4 py-2 border text-gray-700 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Option 3
                  </label>
                  <input
                    type="text"
                    value={formData.option3}
                    onChange={(e) =>
                      setFormData({ ...formData, option3: e.target.value })
                    }
                    placeholder="Third option (optional)"
                    className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Option 4
                  </label>
                  <input
                    type="text"
                    value={formData.option4}
                    onChange={(e) =>
                      setFormData({ ...formData, option4: e.target.value })
                    }
                    placeholder="Fourth option (optional)"
                    className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-600"
                  />
                </div>
              </div>

              {/* Correct Answer */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Correct Answer *
                </label>
                <select
                  value={formData.correctAnswer}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      correctAnswer: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={0}>Option 1</option>
                  <option value={1}>Option 2</option>
                  <option value={2}>Option 3</option>
                  <option value={3}>Option 4</option>
                </select>
              </div>

              {/* Submit */}
              <div className="flex gap-3">
                <button
                  onClick={handleFormSubmit}
                  className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
                >
                  {editingId ? "Update Question" : "Add Question"}
                </button>
                <button
                  onClick={resetForm}
                  className="px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Unsaved Questions (Local State) */}
        {localQuestions.length > 0 && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-yellow-900">
                Unsaved Questions ({localQuestions.length})
              </h2>
              <button
                onClick={handleSaveAll}
                disabled={createBulkMutation.isPending}
                className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {createBulkMutation.isPending
                  ? "Saving..."
                  : "Save All Questions"}
              </button>
            </div>

            <div className="space-y-3">
              {localQuestions.map((q, index) => (
                <div
                  key={index}
                  className="bg-white p-4 rounded-lg border border-yellow-300"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 mb-2">
                        {index + 1}. {q.question}
                      </p>
                      <div className="space-y-1">
                        {q.options.map((opt, i) => (
                          <p
                            key={i}
                            className={`text-sm ${
                              i === q.correctAnswer
                                ? "text-green-700 font-semibold"
                                : "text-gray-600"
                            }`}
                          >
                            {String.fromCharCode(65 + i)}. {opt}
                            {i === q.correctAnswer && " ✓"}
                          </p>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEditLocal(index)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteLocal(index)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Saved Questions (From DB) */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Saved Questions for{" "}
            {TOPICS.find((t) => t.id === selectedTopic)?.label}
          </h2>

          {isLoading ? (
            <p className="text-gray-500">Loading questions...</p>
          ) : savedQuestions.length === 0 ? (
            <p className="text-gray-500">No questions yet for this topic.</p>
          ) : (
            <div className="space-y-4">
              {savedQuestions.map((q, index) => (
                <div
                  key={q._id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 mb-2">
                        {index + 1}. {q.question}
                      </p>
                      <div className="space-y-1">
                        {q.options.map((opt, i) => (
                          <p
                            key={i}
                            className={`text-sm ${
                              i === q.correctAnswer
                                ? "text-green-700 font-semibold"
                                : "text-gray-600"
                            }`}
                          >
                            {String.fromCharCode(65 + i)}. {opt}
                            {i === q.correctAnswer && " ✓"}
                          </p>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEditSaved(q)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteSaved(q._id!)}
                        disabled={deleteMutation.isPending}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition disabled:opacity-50"
                      >
                        {deleteMutation.isPending ? "..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
