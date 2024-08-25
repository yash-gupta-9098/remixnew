import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate, apiVersion } from "../shopify.server";

export const loader = async ({ request }) => {  

    const { admin } = await authenticate.admin(request);

    const response = await admin.graphql(
      `#graphql
      query {
        shopifyqlQuery(query: "FROM orders SHOW sum(net_sales) AS monthly_net_sales GROUP BY month SINCE -3m ORDER BY month") {
          __typename
          ... on TableResponse {
            tableData {
              unformattedData
              rowData
              columns {
                name
                dataType
                displayName
              }
            }
          }
          parseErrors {
            code
            message
            range {
              start {
                line
                character
              }
              end {
                line
                character
              }
            }
          }
        }
      }`,
    );
    
    const data = await response.json();
    return  {data}
    
}

export default function Reports() {
    const { data } = useLoaderData();
    console.log(data , "data"); 
retrun (
    <Page>
        <TitleBar  title="Orders"/>
    </Page>
)

}
