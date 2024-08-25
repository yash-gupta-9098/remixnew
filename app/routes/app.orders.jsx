
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate, apiVersion } from "../shopify.server";
import { useLoaderData, useNavigate, useLocation } from "@remix-run/react";
import {Card, Badge, IndexTable, LegacyCard, Page, Text, useBreakpoints } from "@shopify/polaris";

export const query = ` query MyQuery($first: Int, $afterCursor: String, $last: Int, $beforeCursor: String) {
    orders(first: $first, after: $afterCursor, last: $last, before: $beforeCursor) {
      nodes {
        createdAt
        name
        phone
        tags
        currentSubtotalLineItemsQuantity
        id
        customer {
          email
          displayName
          id
        }
        originalTotalPriceSet {
          presentmentMoney {
            amount
            currencyCode
          }
        }
        displayFulfillmentStatus
        displayFinancialStatus
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  } `



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
        console.log(data , "data")
        const { orders } = data.data;
  
        return {
          orders: orders.nodes,
          hasNextPage: orders.pageInfo.hasNextPage,
          endCursor: orders.pageInfo.endCursor,
          hasPreviousPage: orders.pageInfo.hasPreviousPage,
          startCursor: orders.pageInfo.startCursor,
        };
      }
  
      return null;
  
    } catch (error) {
      console.error("Error fetching products:", error);
      throw error;
    }
  }; 


  export default function ProductsPage() {
    const { orders, hasNextPage, endCursor, hasPreviousPage, startCursor } = useLoaderData();
    console.log(orders ,  "products");
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



    

    const dateoptions = {
        month: "short",  // Abbreviated month name
        day: "numeric",  // Numeric day of the month
        hour: "numeric", // Hour (12-hour format by default)
        minute: "numeric", // Minutes
        hour12: true // To get AM/PM format
      };


      

    const rowMarkup = orders.map(
        (node, index) => (

            
          <IndexTable.Row id={node.id} key={node.id} position={index}>
            <IndexTable.Cell>
              <Text variant="bodyMd" fontWeight="bold" as="span">
                {node.name}
              </Text>
            </IndexTable.Cell>
            <IndexTable.Cell>{new Date(node.createdAt).toLocaleString("en-US", dateoptions)}</IndexTable.Cell>
            <IndexTable.Cell>{node.customer.displayName.toLowerCase().replace(/\b\w/g, char => char.toUpperCase())}</IndexTable.Cell>
            <IndexTable.Cell><FulfillmentBadge status={node.displayFulfillmentStatus} /></IndexTable.Cell>
            <IndexTable.Cell>{node.displayFinancialStatus.toLowerCase().replace(/\b\w/g, char => char.toUpperCase())}</IndexTable.Cell>
            <IndexTable.Cell>{new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: node.originalTotalPriceSet.presentmentMoney.currencyCode,
          }).format(node.originalTotalPriceSet.presentmentMoney.amount)}</IndexTable.Cell>        
          </IndexTable.Row>
        ), 
      );
    
      const resourceName = {
        singular: 'Order',
        plural: 'Orders',
      };
    
      return (
        <Page>
          <TitleBar title="Orders" />
          <LegacyCard>
            <IndexTable
              condensed={useBreakpoints().smDown}
              resourceName={resourceName}
              itemCount={orders.length}
              headings={[
                { title: 'Order' },
                { title: 'Date' },
                { title: 'Customer' },
                { title: 'FulfillmentStatus' },
                { title: 'PaymentStatus' },
                { title: 'Total' },
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




const FulfillmentBadge = ({ status }) => {
  const badgeProps = {
    FULFILLED: { progress: 'complete', tone: 'success', label: 'Fulfilled' },
    IN_PROGRESS: { progress: 'partiallyComplete', tone: 'attention', label: 'In Progress' },
    ON_HOLD: { progress: 'incomplete', tone: 'warning', label: 'On Hold' },
    OPEN: { progress: 'incomplete', tone: 'attention', label: 'Open' },
    PARTIALLY_FULFILLED: { progress: 'partiallyComplete', tone: 'warning', label: 'Partially Fulfilled' },
    PENDING_FULFILLMENT: { progress: 'incomplete', tone: 'attention', label: 'Pending Fulfillment' },
    RESTOCKED: { progress: 'incomplete', tone: 'default', label: 'Restocked' },
    SCHEDULED: { progress: 'incomplete', tone: 'info', label: 'Scheduled' },
    UNFULFILLED: { progress: 'incomplete', tone: 'attention', label: 'Unfulfilled' },
  };

  const { progress, tone, label } = badgeProps[status] || badgeProps.UNFULFILLED;

  return (
    
      <Badge progress={progress} tone={tone}>
        {label}
      </Badge>
    
  );
};