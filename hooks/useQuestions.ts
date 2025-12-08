// hooks/useQuestions.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Types
export interface Question {
  _id?: string;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
}

export interface BulkQuestionsPayload {
  category: string;
  questions: Omit<Question, '_id' | 'category'>[];
}

// API Functions
const fetchQuestionsByCategory = async (category: string): Promise<Question[]> => {
  const res = await fetch(`/api/questions?category=${category}`);
  if (!res.ok) throw new Error('Failed to fetch questions');
  return res.json();
};

const createBulkQuestions = async (payload: BulkQuestionsPayload) => {
  const res = await fetch('/api/questions/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create questions');
  return res.json();
};

const updateQuestion = async (id: string, data: Partial<Question>) => {
  const res = await fetch(`/api/questions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update question');
  return res.json();
};

const deleteQuestion = async (id: string) => {
  const res = await fetch(`/api/questions/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete question');
  return res.json();
};

// Hooks
export const useQuestions = (category: string) => {
  return useQuery({
    queryKey: ['questions', category],
    queryFn: () => fetchQuestionsByCategory(category),
    enabled: !!category, // Only fetch if category is selected
  });
};

export const useCreateBulkQuestions = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createBulkQuestions,
    onSuccess: (data, variables) => {
      // Invalidate and refetch questions for this category
      queryClient.invalidateQueries({ queryKey: ['questions', variables.category] });
    },
  });
};

export const useUpdateQuestion = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Question> }) => 
      updateQuestion(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['questions'] });
      
      // Snapshot previous value
      const previousQuestions = queryClient.getQueryData(['questions', data.category]);
      
      // Optimistically update
      queryClient.setQueryData(['questions', data.category], (old: Question[] | undefined) => {
        if (!old) return old;
        return old.map(q => q._id === id ? { ...q, ...data } : q);
      });
      
      return { previousQuestions, category: data.category };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousQuestions) {
        queryClient.setQueryData(
          ['questions', context.category],
          context.previousQuestions
        );
      }
    },
    onSettled: (data, error, variables, context) => {
      // Refetch after mutation
      queryClient.invalidateQueries({ 
        queryKey: ['questions', context?.category] 
      });
    },
  });
};

export const useDeleteQuestion = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, category }: { id: string; category: string }) => 
      deleteQuestion(id),
    onMutate: async ({ id, category }) => {
      await queryClient.cancelQueries({ queryKey: ['questions', category] });
      
      const previousQuestions = queryClient.getQueryData(['questions', category]);
      
      // Optimistically remove question
      queryClient.setQueryData(['questions', category], (old: Question[] | undefined) => {
        if (!old) return old;
        return old.filter(q => q._id !== id);
      });
      
      return { previousQuestions, category };
    },
    onError: (err, variables, context) => {
      if (context?.previousQuestions) {
        queryClient.setQueryData(
          ['questions', context.category],
          context.previousQuestions
        );
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['questions', variables.category] 
      });
    },
  });
};