import { TitleBar } from "@shopify/app-bridge-react";
import { Avatar, LegacyCard, Page, ResourceItem, ResourceList, Text } from "@shopify/polaris"; // Ensure Polaris components are imported
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
          image {
            url
            altText
          }
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
        <TitleBar title="Collections" />
        <p>No collections found.</p>
      </Page>
    );
  }

  return (
    <Page>
      <TitleBar title="Collections" />
      <LegacyCard>
        <ResourceList
          resourceName={{ singular: 'collection', plural: 'collections' }}
          items={collections.map(({ node }) => ({
            id: node.id,
            name: node.title,
            updatedAt: node.updatedAt,
            sortOrder: node.sortOrder,
            image: node.image?.url || '', // Image source if available
            altText: node.image?.altText || 'Collection image',
          }))}
          renderItem={(item) => {
            const { id, url, name, image, altText, updatedAt, sortOrder } = item;
            const media = <Avatar customer size="md" source={image} name={name} alt={altText} />;

            return (
              <ResourceItem
                id={id}
                url={url}
                media={media}
                accessibilityLabel={`View details for ${name}`}
              >
                <Text variant="bodyMd" fontWeight="bold" as="h3">
                  {name}
                </Text>
                <div>Updated at: {new Date(updatedAt).toLocaleDateString()}</div>
                <div>Sort Order: {sortOrder}</div>
              </ResourceItem>
            );
          }}
        />
      </LegacyCard>
    </Page>
  );
}
