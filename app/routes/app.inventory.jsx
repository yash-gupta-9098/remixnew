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
  import { Fragment } from "react";
  
  export const query = `
    query Products($first: Int, $afterCursor: String, $last: Int, $beforeCursor: String) {
        products(first: $first, after: $afterCursor, last: $last, before: $beforeCursor) {
        edges {
        node {
          id
          title
          vendor
          status
          variants(first: 5) {
            nodes {
              inventoryItem {
                id
                inventoryLevels(first: 10) {
                  edges {
                    node {
                      id
                      location {
                        activatable
                        name
                      }
                    }
                  }
                }
              }
              price
              displayName
              contextualPricing(context: {}) {
                compareAtPrice {
                  amount
                  currencyCode
                }
                price {
                  amount
                  currencyCode
                }
              }
              inventoryQuantity
            }
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
      first: beforeCursor ? null : 20,
      afterCursor: afterCursor,
      last: beforeCursor ? 20 : null,
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
          products: products.edges,
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
    const { products, hasNextPage, endCursor, hasPreviousPage, startCursor } = useLoaderData();
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
  
    const rowMarkup = products.map((product, index) => {
      const productVariants = product.node.variants.nodes;
  
      return (
        <Fragment key={product.node.id}>
          {/* Parent Row for Main Product */}
          <IndexTable.Row id={product.node.id} key={product.node.id} position={index}>
            <IndexTable.Cell>
              <Text variant="bodyMd" fontWeight="bold" as="span">
                {product.node.title.toLowerCase().replace(/\b\w/g, char => char.toUpperCase())}
              </Text>
            </IndexTable.Cell>
            <IndexTable.Cell />
            <IndexTable.Cell />
            <IndexTable.Cell />
          </IndexTable.Row>
  
          {/* Nested Rows for Variants and Inventory */}
          {productVariants.map((variant, variantIndex) => {
            return (
              <Fragment key={variant.inventoryItem.id}>
                {/* Inventory Row for Each Variant */}
                <IndexTable.Row rowType="child" id={`variant-${variantIndex}`} position={variantIndex}>
                  <IndexTable.Cell>
                    <Text variant="bodyMd" as="span">
                      {variant.displayName}
                    </Text>
                  </IndexTable.Cell>
                  <IndexTable.Cell>
                    <Text variant="bodyMd" as="span">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: variant.contextualPricing.price.currencyCode,
                      }).format(variant.contextualPricing.price.amount)}
                    </Text>
                  </IndexTable.Cell>
                  <IndexTable.Cell>
                    <Text variant="bodyMd" as="span">
                      {variant.inventoryQuantity}
                    </Text>
                  </IndexTable.Cell>
  
                  {/* Inventory Locations */}
                  {variant.inventoryItem.inventoryLevels.edges.map((inventoryEdge) => (
                    <IndexTable.Row
                      key={inventoryEdge.node.id}
                      rowType="child"
                      id={`inventory-${inventoryEdge.node.id}`}
                    >
                      <IndexTable.Cell>
                        <Text variant="bodyMd" as="span">
                          {inventoryEdge.node.location.name}
                        </Text>
                      </IndexTable.Cell>
                      <IndexTable.Cell>
                        <Text variant="bodyMd" as="span">
                          {inventoryEdge.node.location.activatable ? 'Active' : 'Inactive'}
                        </Text>
                      </IndexTable.Cell>
                    </IndexTable.Row>
                  ))}
                </IndexTable.Row>
              </Fragment>
            );
          })}
        </Fragment>
      );
    });
  
    const resourceName = {
      singular: 'product',
      plural: 'products',
    };
  
    return (
      <Page>
        <TitleBar title="Products" />
        <LegacyCard>
          <IndexTable
            condensed={useBreakpoints().smDown}
            resourceName={resourceName}
            itemCount={products.length}
            headings={[
              { title: 'Title' },
              { title: 'Price' },
              { title: 'available' },
              { title: 'location Name' },
              { title: 'location Status' },
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
  