import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';
import DatePicker from '../ui/DatePicker';
import type { SavingsGoal } from '../../types';

const schema = z.object({
  goal_name: z.string().min(1, 'Goal name is required'),
  target_amount: z.coerce.number().positive('Target amount must be greater than 0'),
  current_amount: z.coerce.number().min(0, 'Cannot be negative').default(0),
  target_date: z.string().optional(),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface SavingsFormProps {
  goal?: SavingsGoal;
  budgetPeriodId: string;
  onSubmit: (data: Partial<SavingsGoal>) => Promise<void>;
  onCancel: () => void;
}

export default function SavingsForm({ goal, budgetPeriodId, onSubmit, onCancel }: SavingsFormProps) {
  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: goal ? {
      goal_name: goal.goal_name, target_amount: goal.target_amount,
      current_amount: goal.current_amount, target_date: goal.target_date ?? '',
      notes: goal.notes ?? '',
    } : { current_amount: 0 },
  });

  const submit = handleSubmit(async (data) => {
    await onSubmit({ ...data, budget_period_id: budgetPeriodId });
  });

  return (
    <form onSubmit={submit} className="space-y-4">
      <Input label="Goal Name" placeholder="e.g., Emergency Fund, Japan Trip" required error={errors.goal_name?.message} {...register('goal_name')} />
      <div className="grid grid-cols-2 gap-3 items-end">
        <Input label="Target Amount (₱)" type="number" step="0.01" required error={errors.target_amount?.message} {...register('target_amount')} />
        <Input label="Current Amount (₱)" type="number" step="0.01" error={errors.current_amount?.message} {...register('current_amount')} />
      </div>
      <Controller control={control} name="target_date" render={({ field }) => (
        <DatePicker label="Target Date" error={errors.target_date?.message} value={field.value ?? ''} onChange={field.onChange} />
      )} />
      <Textarea label="Notes" placeholder="Optional notes" rows={2} {...register('notes')} />
      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={isSubmitting}>{goal ? 'Update' : 'Add Goal'}</Button>
      </div>
    </form>
  );
}
