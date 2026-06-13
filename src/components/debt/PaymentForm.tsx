import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';
import DatePicker from '../ui/DatePicker';
import { formatDateInput } from '../../utils/date';

const schema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  payment_date: z.string().min(1, 'Date is required'),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface PaymentFormProps {
  debtName: string;
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
}

export default function PaymentForm({ debtName, onSubmit, onCancel }: PaymentFormProps) {
  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { payment_date: formatDateInput() },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-400">Recording payment for: <strong className="text-slate-900 dark:text-white">{debtName}</strong></p>
      <Input label="Payment Amount (₱)" type="number" step="0.01" required error={errors.amount?.message} {...register('amount')} />
      <Controller control={control} name="payment_date" render={({ field }) => (
        <DatePicker label="Payment Date" required error={errors.payment_date?.message} value={field.value ?? ''} onChange={field.onChange} />
      )} />
      <Textarea label="Notes" placeholder="Optional notes" rows={2} {...register('notes')} />
      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={isSubmitting}>Record Payment</Button>
      </div>
    </form>
  );
}
