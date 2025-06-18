'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { sql } from './db';


const FormSchema = z.object({
    id: z.string(),
    customerId: z.string().min(1, 'Customer ID is required'),
    amount: z.coerce.number(),
    status: z.enum(['pending', 'paid']),
    date: z.string(),

});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
    const { customerId, amount, status } = CreateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });
    const amountInCents = amount * 100; // Convert to cents due to JavaScript's handling of floating point numbers
    const date = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format

    await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date});
    `;

    revalidatePath('/dashboard/invoices'); // Revalidate the invoices page to reflect the new invoice after database insertion
    redirect('/dashboard/invoices'); // Redirect to the invoices page after successful creation
}

export async function updateInvoice(id: string, formData: FormData) {
    const { customerId, amount, status } = UpdateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });
    const amountInCents = amount * 100; // Convert to cents due to JavaScript's handling of floating point numbers

    await sql`
        UPDATE invoices
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        WHERE id = ${id};
    `;

    revalidatePath('/dashboard/invoices'); // Revalidate the invoices page to reflect the updated invoice after database update
    redirect('/dashboard/invoices'); // Redirect to the invoices page after successful update
}