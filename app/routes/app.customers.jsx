import {
  Box,
  Card,
  Layout,
  Link,
  List,
  Page,
  Text,
  BlockStack,
  Button,
  IndexTable,
  LegacyCard,
  useBreakpoints,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate, apiVersion } from "../shopify.server";
import { useLoaderData, useNavigate, useLocation } from "@remix-run/react";

export const query = `
  query customers($first: Int, $afterCursor: String, $last: Int, $beforeCursor: String) {
      customers(first: $first, after: $afterCursor, last: $last, before: $beforeCursor) {
      edges {
          node {
            id
            displayName
            email
            phone
            
          }
        }
    }
      pageInfo {
        endCursor
        hasNextPage
        hasPreviousPage
        startCursor
      }
    }
  }
`;

export const loader = async ({ request }) => { 
  const { session } = await authenticate.admin(request);
  const { shop, accessToken } = session;

  const url = new URL(request.url);
  const afterCursor = url.searchParams.get("afterCursor") || null;
  const beforeCursor = url.searchParams.get("beforeCursor") || null;

  const variables = {
    first: beforeCursor ? null : 20,  // 10 for initial load or forward pagination
    afterCursor: afterCursor,
    last: beforeCursor ? 20 : null, // 10 for backward pagination
    beforeCursor: beforeCursor
  };


  const queryWithVariables = JSON.stringify({
    query: query,
    variables: variables
  });

  try {
    const response = await fetch(`https://${shop}/admin/api/${apiVersion}/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken
      },
      body: queryWithVariables
    });

    if (response.ok) {
      const data = await response.json();
      const { products } = data.data;

      return {
        customers: products.edges,
        hasNextPage: products.pageInfo.hasNextPage,
        endCursor: products.pageInfo.endCursor,
        hasPreviousPage: products.pageInfo.hasPreviousPage,
        startCursor: products.pageInfo.startCursor,
      };
    }

    return null;

  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
};

export default function ProductsPage() {
  const { customers, hasNextPage, endCursor, hasPreviousPage, startCursor } = useLoaderData();
  console.log(customers ,  "products");
  const navigate = useNavigate();
 

  const handleNextPage = () => {
    if (hasNextPage) {
      navigate(`?afterCursor=${endCursor}`);
    }
  };

  const handlePreviousPage = () => {
    if (hasPreviousPage) {
      navigate(`?beforeCursor=${startCursor}`);
    }
  };

  const rowMarkup = products.map(
    (node, index) => (
      <IndexTable.Row id={node.node.id} key={node.node.id} position={index}>
        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="bold" as="span">
            {node.node.title.toLowerCase().replace(/\b\w/g, char => char.toUpperCase())}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>{node.node.vendor.toLowerCase().replace(/\b\w/g, char => char.toUpperCase())}</IndexTable.Cell>
        <IndexTable.Cell>{node.node.status.toLowerCase().replace(/\b\w/g, char => char.toUpperCase())}</IndexTable.Cell>
        <IndexTable.Cell>{
          new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: node.node.variants.nodes[0].contextualPricing.price.currencyCode,
          }).format(node.node.variants.nodes[0].contextualPricing.price.amount)}
        </IndexTable.Cell>
      </IndexTable.Row>
    ),
  );

  const resourceName = {
    singular: 'customer',
    plural: 'customers',
  };

  return (
    <Page>
      <TitleBar title="Products" />
      <LegacyCard>
        <IndexTable
          condensed={useBreakpoints().smDown}
          resourceName={resourceName}
          itemCount={customers.length}
          headings={[
            { title: 'Title' },
            { title: 'Vendor' },
            { title: 'Status' },
            { title: 'Price' },
          ]}
          selectable={false}
          pagination={{
            hasNext: hasNextPage,
            onNext: handleNextPage,
            hasPrevious: hasPreviousPage,
            onPrevious: handlePreviousPage,
          }}
        >
          {rowMarkup}
        </IndexTable>
      </LegacyCard>
    </Page>
  );
}
