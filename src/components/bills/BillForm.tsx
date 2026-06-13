import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';
import DatePicker from '../ui/DatePicker';
import type { Bill } from '../../types';
import { BILL_CATEGORIES } from '../../types';
import { formatDateInput } from '../../utils/date';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  due_date: z.string().min(1, 'Due date is required'),
  category: z.string().min(1, 'Category is required'),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface BillFormProps {
  bill?: Bill;
  budgetPeriodId: string;
  onSubmit: (data: Partial<Bill>) => Promise<void>;
  onCancel: () => void;
}

export default function BillForm({ bill, budgetPeriodId, onSubmit, onCancel }: BillFormProps) {
  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: bill ? {
      name: bill.name, amount: bill.amount, due_date: bill.due_date,
      category: bill.category, notes: bill.notes ?? '',
    } : { due_date: formatDateInput() },
  });

  const categoryOptions = BILL_CATEGORIES.map(c => ({ value: c, label: c }));

  const submit = handleSubmit(async (data) => {
    await onSubmit({ ...data, budget_period_id: budgetPeriodId });
  });

  return (
    <form onSubmit={submit} className="space-y-4">
      <Input label="Bill Name" placeholder="e.g., Electricity, Netflix" required error={errors.name?.message} {...register('name')} />
      <Input label="Amount (₱)" type="number" step="0.01" min="0.01" required error={errors.amount?.message} {...register('amount')} />
      <Controller control={control} name="due_date" render={({ field }) => (
        <DatePicker label="Due Date" required error={errors.due_date?.message} value={field.value ?? ''} onChange={field.onChange} />
      )} />
      <Select label="Category" required options={categoryOptions} placeholder="Select category" error={errors.category?.message} {...register('category')} />
      <Textarea label="Notes" placeholder="Optional notes" rows={2} {...register('notes')} />
      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={isSubmitting}>{bill ? 'Update' : 'Add Bill'}</Button>
      </div>
    </form>
  );
}
