import { TitleBar } from "@shopify/app-bridge-react";
import { Page } from "@shopify/polaris"; // Ensure Polaris components are imported
import { useLoaderData } from "@remix-run/react"; // Import useLoaderData

import { authenticate, apiVersion } from "../shopify.server";

export const query = `
  query {
    collections(first: 5) {
      edges {
        node {
          id
          title
          handle
          updatedAt
          sortOrder
        }
      }
    }
  }
`;

const queryWithVariables = JSON.stringify({
  query: query,
});

export const loader = async ({ request }) => {  
  const { session } = await authenticate.admin(request);
  const { shop, accessToken } = session;
    
  try {
    const response = await fetch(`https://${shop}/admin/api/${apiVersion}/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken
      },
      body: queryWithVariables,
    });

    if (response.ok) {
      const data = await response.json();
      const { collections } = data.data;

      return {
        collections: collections.edges,        
      };
    }

    return { collections: [] }; // Return an empty array if the response is not ok

  } catch (error) {
    console.error("Error fetching collections:", error);
    throw error; // You might want to return an error-friendly object instead of throwing an error directly
  }
}

export default function Reports() {
  const { collections } = useLoaderData();

  if (!collections || collections.length === 0) {
    return (
      <Page>
        <TitleBar title="Orders" />
        <p>No collections found.</p>
      </Page>
    );
  }

  return (
    <Page>
      <TitleBar title="Orders" />
      {collections.map(({ node }) => (
        <div key={node.id}>
          <h3>{node.title}</h3>
          <p>Handle: {node.handle}</p>
          <p>Updated at: {node.updatedAt}</p>
          <p>Sort Order: {node.sortOrder}</p>
        </div>
      ))}
    </Page>
  );
}
