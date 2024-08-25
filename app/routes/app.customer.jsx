// customers.jsx
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { Page, Card, DataTable, Layout, Spinner } from '@shopify/polaris';

// Loader function to fetch customer data from Shopify API
export const loader = async () => {
    const { session } = await authenticate.admin(request);
  const { shop, accessToken } = session;
  try {
    const response = await fetch(`https://${shop}/admin/api/2024-01/customers.json`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken, // Replace with your actual token
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch customers');
    }

    const data = await response.json();
    return json({ customers: data.customers });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return json({ customers: [] });
  }
};

export default function CustomersPage() {
  // Get the customer data from the loader using useLoaderData
  const { customers } = useLoaderData();

  // Prepare data for the Polaris DataTable
  const rows = customers.map((customer) => [
    customer.first_name || 'N/A',
    customer.last_name || 'N/A',
    customer.email || 'N/A',
    customer.phone || 'N/A',
    customer.orders_count || 0,
    `$${customer.total_spent || 0}`,
  ]);

  return (
    <Page title="Customer Accounts">
      <Layout.Section>
        {customers.length === 0 ? (
          <Spinner accessibilityLabel="Loading customer data" size="large" />
        ) : (
          <Card>
            <DataTable
              columnContentTypes={[
                'text', // First name
                'text', // Last name
                'text', // Email
                'text', // Phone
                'numeric', // Orders count
                'numeric', // Total spent
              ]}
              headings={['First Name', 'Last Name', 'Email', 'Phone', 'Orders Count', 'Total Spent']}
              rows={rows}
            />
          </Card>
        )}
      </Layout.Section>
    </Page>
  );
}
