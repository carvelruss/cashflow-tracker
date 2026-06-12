import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';
import { formatDateInput } from '../../utils/date';

const schema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  contribution_date: z.string().min(1, 'Date is required'),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface ContributionFormProps {
  goalName: string;
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
}

export default function ContributionForm({ goalName, onSubmit, onCancel }: ContributionFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { contribution_date: formatDateInput() },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-400">Adding contribution to: <strong className="text-slate-900 dark:text-white">{goalName}</strong></p>
      <Input label="Amount (₱)" type="number" step="0.01" required error={errors.amount?.message} {...register('amount')} />
      <Input label="Contribution Date" type="date" required error={errors.contribution_date?.message} {...register('contribution_date')} />
      <Textarea label="Notes" placeholder="Optional notes" rows={2} {...register('notes')} />
      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={isSubmitting}>Add Contribution</Button>
      </div>
    </form>
  );
}
