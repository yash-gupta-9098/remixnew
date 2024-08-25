import { useLoaderData } from '@remix-run/react';

export const loader = async () => {
  const response = await fetch(`${process.env.BASE_URL}/api/products`); // Calling your internal API
  return response.json();
};

export default function Products() {
  const products = useLoaderData(); // Access data in frontend

  return (
    <div>
      <h1>Products List</h1>
      <ul>
        {products.map((product) => (
          <li key={product.id}>{product.title}</li>
        ))}
      </ul>
    </div>
  );
}
