import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';
import type { Debt } from '../../types';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  creditor: z.string().min(1, 'Creditor is required'),
  original_amount: z.coerce.number().positive('Original amount must be greater than 0'),
  remaining_balance: z.coerce.number().min(0, 'Remaining balance cannot be negative'),
  monthly_payment: z.coerce.number().min(0, 'Monthly payment cannot be negative'),
  due_date: z.string().optional(),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface DebtFormProps {
  debt?: Debt;
  budgetPeriodId: string;
  onSubmit: (data: Partial<Debt>) => Promise<void>;
  onCancel: () => void;
}

export default function DebtForm({ debt, budgetPeriodId, onSubmit, onCancel }: DebtFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: debt ? {
      name: debt.name, creditor: debt.creditor, original_amount: debt.original_amount,
      remaining_balance: debt.remaining_balance, monthly_payment: debt.monthly_payment,
      due_date: debt.due_date ?? '', notes: debt.notes ?? '',
    } : {},
  });

  const submit = handleSubmit(async (data) => {
    await onSubmit({ ...data, budget_period_id: budgetPeriodId });
  });

  return (
    <form onSubmit={submit} className="space-y-4">
      <Input label="Debt Name" placeholder="e.g., Car Loan, Credit Card" required error={errors.name?.message} {...register('name')} />
      <Input label="Creditor" placeholder="e.g., BPI, BDO, SSS" required error={errors.creditor?.message} {...register('creditor')} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Original Amount (₱)" type="number" step="0.01" required error={errors.original_amount?.message} {...register('original_amount')} />
        <Input label="Remaining Balance (₱)" type="number" step="0.01" required error={errors.remaining_balance?.message} {...register('remaining_balance')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Monthly Payment (₱)" type="number" step="0.01" error={errors.monthly_payment?.message} {...register('monthly_payment')} />
        <Input label="Due Date" type="date" error={errors.due_date?.message} {...register('due_date')} />
      </div>
      <Textarea label="Notes" placeholder="Optional notes" rows={2} {...register('notes')} />
      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={isSubmitting}>{debt ? 'Update' : 'Add Debt'}</Button>
      </div>
    </form>
  );
}
