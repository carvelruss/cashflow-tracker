import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';
import type { Expense } from '../../types';
import { EXPENSE_CATEGORIES } from '../../types';
import { formatDateInput } from '../../utils/date';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string().min(1, 'Category is required'),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  date: z.string().min(1, 'Date is required'),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface ExpenseFormProps {
  expense?: Expense;
  budgetPeriodId: string;
  onSubmit: (data: Partial<Expense>) => Promise<void>;
  onCancel: () => void;
}

export default function ExpenseForm({ expense, budgetPeriodId, onSubmit, onCancel }: ExpenseFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: expense ? {
      name: expense.name, category: expense.category,
      amount: expense.amount, date: expense.date, notes: expense.notes ?? '',
    } : { date: formatDateInput() },
  });

  const catOptions = EXPENSE_CATEGORIES.map(c => ({ value: c, label: c }));

  const submit = handleSubmit(async (data) => {
    await onSubmit({ ...data, budget_period_id: budgetPeriodId });
  });

  return (
    <form onSubmit={submit} className="space-y-4">
      <Input label="Expense Name" placeholder="e.g., Grocery, Uber" required error={errors.name?.message} {...register('name')} />
      <Select label="Category" required options={catOptions} placeholder="Select category" error={errors.category?.message} {...register('category')} />
      <Input label="Amount (₱)" type="number" step="0.01" min="0.01" required error={errors.amount?.message} {...register('amount')} />
      <Input label="Date" type="date" required error={errors.date?.message} {...register('date')} />
      <Textarea label="Notes" placeholder="Optional notes" rows={2} {...register('notes')} />
      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={isSubmitting}>{expense ? 'Update' : 'Add Expense'}</Button>
      </div>
    </form>
  );
}
