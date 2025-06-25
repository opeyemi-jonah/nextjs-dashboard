'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { sql, vercelsql } from './db';
import { NeonQueryFunction } from '@neondatabase/serverless';
import { Sql } from 'postgres';

export type State = {
    errors?: {
        customerId?: string[];
        amount?: string[];
        status?: string[];
    };
    message?: string | null;
};

let sql_conn: NeonQueryFunction<false, false> | Sql<{}>;

// Attempt to connect to the local database first
try {
    const test_conn = await sql`Select 1;`;
    if (test_conn.length !== 0) {
        sql_conn = sql;
        console.log('Using local database connection');
    }
    else {
        sql_conn = vercelsql;
        console.log('Using vercel database connection');
    }
    console.log('Database connection successful');
}
catch (error) {
    console.error('Database connection failed:', error);
    throw new Error('Database connection failed');
}


const FormSchema = z.object({
    id: z.string(),
    customerId: z.string({
        invalid_type_error: 'Please select a customer.',
    }),
    amount: z.coerce.number().gt(0, { message: 'Please enter an amount greater than $0.' }),
    status: z.enum(['pending', 'paid'], { invalid_type_error: 'Please select an invoice status.', }),
    date: z.string(),

});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(prevState: State, formData: FormData) {
    const validatedFields = CreateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    // If form validation fails, return errors early. Otherwise, continue.
    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Create Invoice.',
        };
    }

    // Prepare data for insertion into the database
    const { customerId, amount, status } = validatedFields.data;
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];

    // Insert data into the database
    try {
        await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
    } catch (error) {
        // If a database error occurs, return a more specific error.
        return {
            message: 'Database Error: Failed to Create Invoice.',
        };
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
        await sql_conn`
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
        await sql_conn`
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
