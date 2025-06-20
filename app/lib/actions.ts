'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { sql } from './db';


const FormSchema = z.object({
    id: z.string(),
    customerId: z.string(),
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

    try {
        await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date});
    `;
    }
    catch (error) {
        console.error('Error creating invoice:', error);
        throw new Error('Failed to create invoice');
    }

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

    try {
        await sql`
        UPDATE invoices
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        WHERE id = ${id};
    `;
    }
    catch (error) {
        console.error('Error updating invoice:', error);
        throw new Error('Failed to update invoice');
    }

    revalidatePath('/dashboard/invoices'); // Revalidate the invoices page to reflect the updated invoice after database update
    redirect('/dashboard/invoices'); // Redirect to the invoices page after successful update
}

export async function deleteInvoice(id: string) {
    try {
        await sql`
        DELETE FROM invoices
        WHERE id = ${id};
    `;
    }
    catch (error) {
        console.error('Error deleting invoice:', error);
        throw new Error('Failed to delete invoice');
    }

    revalidatePath('/dashboard/invoices'); // Revalidate the invoices page to reflect the deletion after database operation
    redirect('/dashboard/invoices'); // Redirect to the invoices page after successful deletion
}
