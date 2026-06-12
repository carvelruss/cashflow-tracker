import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';
import type { Income } from '../../types';
import { formatDateInput } from '../../utils/date';

const schema = z.object({
  source: z.string().min(1, 'Source is required'),
  description: z.string().optional(),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  date_received: z.string().min(1, 'Date is required'),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface IncomeFormProps {
  income?: Income;
  budgetPeriodId: string;
  onSubmit: (data: Partial<Income>) => Promise<void>;
  onCancel: () => void;
}

export default function IncomeForm({ income, budgetPeriodId, onSubmit, onCancel }: IncomeFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: income ? {
      source: income.source,
      description: income.description ?? '',
      amount: income.amount,
      date_received: income.date_received,
      notes: income.notes ?? '',
    } : {
      date_received: formatDateInput(),
    },
  });

  const submit = handleSubmit(async (data) => {
    await onSubmit({ ...data, budget_period_id: budgetPeriodId });
  });

  return (
    <form onSubmit={submit} className="space-y-4">
      <Input label="Income Source" placeholder="e.g., Salary, Freelance" required error={errors.source?.message} {...register('source')} />
      <Input label="Description" placeholder="Optional description" error={errors.description?.message} {...register('description')} />
      <Input label="Amount (₱)" type="number" step="0.01" min="0.01" required error={errors.amount?.message} {...register('amount')} />
      <Input label="Date Received" type="date" required error={errors.date_received?.message} {...register('date_received')} />
      <Textarea label="Notes" placeholder="Optional notes" rows={2} {...register('notes')} />
      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={isSubmitting}>{income ? 'Update' : 'Add Income'}</Button>
      </div>
    </form>
  );
}
