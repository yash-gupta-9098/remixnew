import { json } from '@remix-run/node';
import { fetchProductsFromShopify } from '../utils/shopifyUtils';

export const loader = async () => {
    const { session } = await authenticate.admin(request);
    const { shop, accessToken } = session;
  const products = await fetchProductsFromShopify(shop , accessToken); // Call to Shopify API or your logic to get data
  return json(products);
};



