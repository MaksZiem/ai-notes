import { useForm, type FieldValues, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'
import type { BaseSyntheticEvent } from 'react'

export function useFormWithMutation<T extends FieldValues, TData = void>(
  schema: z.ZodType<T>,
  mutationFn: (values: T) => Promise<TData>,
  options?: {
    onSuccess?: (data: TData) => void
    onError?: (error: Error) => void
  }
): {
  form: UseFormReturn<T>
  onSubmit: (e?: BaseSyntheticEvent) => Promise<void>
  isLoading: boolean
  error: Error | null
} {
  const form = useForm<T>({
    resolver: zodResolver(schema),
  })

  const mutation = useMutation<TData, Error, T>({
    mutationFn,
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  })

  const onSubmit = form.handleSubmit((values) => mutation.mutate(values))

  return {
    form,
    onSubmit,
    isLoading: mutation.isPending,
    error: mutation.error,
  }
}